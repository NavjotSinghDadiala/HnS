from flask import Blueprint, request, jsonify, g
from models import Builder, ChatSession, ChatMessage, UserInteraction, Property, User
from extensions import db 
from sqlalchemy.exc import DataError, IntegrityError, OperationalError
from sqlalchemy import text
from auth import clerk_required
from .rag_service import (
    get_chatbot_response, 
    sync_properties_to_vectordb, 
    get_direct_sql_results,
    determine_conversation_state,
    update_session_state,
    ConversationMemory,
    classify_intent,
    UserIntent,
    format_property_details,
    format_builder_details,
    handle_query
)

chatbot_bp = Blueprint('chatbot', __name__)
from auth import clerk_required

# Session-level tracking (in-memory)
# For production, consider Redis or database storage
session_tracking = {}


def _resync_sequence(table_name, pk_column="id"):
    """
    Repair PostgreSQL sequence drift for SERIAL/BIGSERIAL PKs.
    """
    db.session.execute(
        text(
            f"""
            SELECT setval(
                pg_get_serial_sequence('{table_name}', '{pk_column}'),
                COALESCE((SELECT MAX({pk_column}) FROM {table_name}), 1),
                true
            )
            """
        )
    )
    db.session.commit()


def _resync_chat_session_sequence():
    """
    Fix PostgreSQL sequence drift for chat_session.id so next inserts don't collide.
    Safe no-op for empty table; only intended for PostgreSQL backends.
    """
    _resync_sequence("chat_session", "id")


def _save_chat_messages(session_id, user_content=None, assistant_content=None):
    """
    Persist chat messages with one automatic retry on chat_message sequence drift.
    """
    payloads = []
    if user_content:
        payloads.append({"role": "user", "content": user_content})
    if assistant_content:
        payloads.append({"role": "assistant", "content": assistant_content})
    if not payloads:
        return

    def _insert_messages():
        for item in payloads:
            db.session.add(
                ChatMessage(
                    session_id=session_id,
                    role=item["role"],
                    content=item["content"]
                )
            )
        db.session.commit()

    try:
        _insert_messages()
    except IntegrityError as e:
        db.session.rollback()
        err_text = str(e).lower()
        if "chat_message_pkey" in err_text and "duplicate key value" in err_text:
            try:
                _resync_sequence("chat_message", "id")
                _insert_messages()
                return
            except Exception as retry_error:
                db.session.rollback()
                print(f"Failed saving chat messages after sequence resync: {retry_error}")
                return
        print(f"Failed saving chat messages: {e}")
    except Exception as e:
        db.session.rollback()
        print(f"Failed saving chat messages: {e}")


@chatbot_bp.route('/sync', methods=['POST'])
def sync_db():
    """Admin endpoint to force sync SQL -> Vector DB"""
    try:
        sync_properties_to_vectordb()
        return jsonify({"message": "Synchronization complete."}), 200
    except Exception as e:
        print(f"Sync Error: {str(e)}")
        return jsonify({"error": "Failed to sync database."}), 500


@chatbot_bp.route('/ask', methods=['POST'])
@clerk_required(optional=True)
def ask_bot():
    """
    Enhanced chatbot endpoint with improved pagination
    - Retrieves up to 20 results
    - Shows first 10 initially
    - Provides "show more" option
    """
    data = request.json
    user_message = data.get('message')
    user_id = g.current_user.id if g.current_user else None
    session_id = data.get('session_id')

    if not user_message:
        return jsonify({"error": "Message required"}), 400

    # Initialize session tracking
    if session_id and session_id not in session_tracking:
        session_tracking[session_id] = {
            'shown_ids': set(),
            'conversation_count': 0,
            'memory': ConversationMemory(session_id),
            'all_properties': [],
            'all_builders': [],
            'current_page': 0,
            'properties_offset': 0,
            'builders_offset': 0
        }
    
    session_data = session_tracking.get(session_id, {
        'shown_ids': set(),
        'conversation_count': 0,
        'memory': ConversationMemory(session_id) if session_id else None,
        'all_properties': [],
        'all_builders': [],
        'current_page': 0,
        'properties_offset': 0,
        'builders_offset': 0
    })
    
    session_data['conversation_count'] += 1
    
    # Extract entities
    if session_data.get('memory'):
        memory = session_data['memory']
        memory.extract_entities_from_message(user_message)
        resolved_property_id = memory.resolve_coreference(user_message)
        if resolved_property_id:
            print(f"🔗 Resolved reference to property: {resolved_property_id}")

    # Prepare Chat History
    chat_history = []
    if session_id:
        recent_msgs = ChatMessage.query.filter_by(session_id=session_id)\
                        .order_by(ChatMessage.created_at.asc())\
                        .limit(10).all()
        
        temp_user_msg = None
        for msg in recent_msgs:
            if msg.role == 'user':
                temp_user_msg = msg.content
            elif msg.role == 'assistant' and temp_user_msg:
                chat_history.append((temp_user_msg, msg.content))
                temp_user_msg = None

    # Determine conversation state
    if session_id:
        new_state = determine_conversation_state(session_id, user_message, chat_history)
        update_session_state(session_id, new_state)

    # INTENT PRE-HANDLING: If user asked for DETAILS referencing a shown card (e.g., "prop 1", "first one"),
    # resolve it using session tracking and return the DB-sourced detailed text immediately.
    intent = classify_intent(user_message)
    if intent == UserIntent.GET_DETAILS and session_id:
        import re
        # numeric reference like 'prop 1' or 'property #2' or 'builder 2'
        m = re.search(r"\b(prop(?:erty)?|property|builder|proj|project)\b\s*#?\s*(\d+)", user_message.lower())
        if not m:
            # ordinal words 'first', 'second', etc.
            ord_map = {'first':1,'second':2,'third':3,'fourth':4,'fifth':5}
            for word, idx in ord_map.items():
                if word in user_message.lower():
                    m = (None, None)
                    ord_idx = idx
                    break
            else:
                ord_idx = None
        else:
            ord_idx = int(m.group(2)) if m else None

        # If we detected a numeric/ordinal reference, attempt to resolve
        if ord_idx is not None and ord_idx >= 1:
            last_props = session_data.get('last_shown_properties', [])
            last_builders = session_data.get('last_shown_builders', [])

            # Determine which type user referenced
            referenced_type = None
            if m and m[1]:
                token = m[1]
                if 'prop' in token or 'property' in token:
                    referenced_type = 'property'
                elif 'build' in token:
                    referenced_type = 'builder'
                elif 'proj' in token or 'project' in token:
                    referenced_type = 'property'

            # If no explicit token, infer from last intent
            if not referenced_type:
                last_int = session_tracking.get(session_id, {}).get('last_intent')
                if last_int == 'search_properties':
                    referenced_type = 'property'
                elif last_int == 'search_builders':
                    referenced_type = 'builder'

            # Resolve the item id from last_shown lists
            if referenced_type == 'property' and len(last_props) >= ord_idx:
                pid = last_props[ord_idx-1]
                prop = Property.query.get(int(pid))
                if prop:
                    detailed = format_property_details(prop)
                    # mark shown
                    session_data['shown_ids'].add(str(prop.id))
                    session_data['last_shown_properties'] = [str(prop.id)]

                    # Save chat messages
                    if session_id:
                        _save_chat_messages(session_id, user_message, detailed)

                    return jsonify({
                        "response": detailed,
                        "last_intent": 'get_details',
                        "properties": [prop.to_dict()],
                        "builders": [],
                        "has_more": len([p for p in session_data.get('all_properties', []) if str(p.get('id')) not in session_data['shown_ids']]) > 0
                    })

            if referenced_type == 'builder' and len(last_builders) >= ord_idx:
                bid = last_builders[ord_idx-1]
                builder = Builder.query.get(bid)
                if builder:
                    detailed = format_builder_details(builder)
                    session_data['shown_ids'].add(str(bid))
                    session_data['last_shown_builders'] = [str(bid)]

                    if session_id:
                        _save_chat_messages(session_id, user_message, detailed)

                    return jsonify({
                        "response": detailed,
                        "last_intent": 'get_details',
                        "properties": [],
                        "builders": [builder.to_dict()],
                        "has_more": len([b for b in session_data.get('all_builders', []) if str(b.get('id')) not in session_data['shown_ids']]) > 0
                    })

    # Call RAG Service
    try:
        # Keep a copy of previously shown IDs to determine what's newly shown
        prev_shown = set(session_data['shown_ids'])

        # Use new 3-layer routing architecture
        result = handle_query(
            user_message, 
            user_id, 
            chat_history,
            session_shown_ids=session_data['shown_ids'],
            conversation_memory=session_data.get('memory'),
            last_intent=session_data.get('last_intent')
        )
        
        # Extract results from new format
        ai_response = result["response"]
        query_type = result["query_type"]
        data_sources = result["data_sources_used"]
        all_properties = result.get("properties", [])
        all_builders = result.get("builders", [])
        updated_shown_ids = result.get("shown_ids", session_data['shown_ids'])
        buffered_responses = result.get("buffered_responses", [])
        
        # Save last intent for this session (map query_type to intent)
        intent_mapping = {
            "simple": "search_properties" if all_properties else "search_builders",
            "medium": "ask_general",
            "complex": "compare"
        }
        session_data['last_intent'] = intent_mapping.get(query_type, "ask_general")
        
        # Update session data with ALL results (convert to dict immediately to avoid SQLAlchemy session issues)
        session_data['shown_ids'] = updated_shown_ids
        session_data['all_properties'] = [p.to_dict() if hasattr(p, 'to_dict') else p for p in all_properties]
        session_data['all_builders'] = [b.to_dict() if hasattr(b, 'to_dict') else b for b in all_builders]
        session_data['current_page'] = 0  # Reset to first page
        
        # Update session data with ALL results (convert to dict immediately to avoid SQLAlchemy session issues)
        session_data['shown_ids'] = updated_shown_ids
        session_data['all_properties'] = [p.to_dict() for p in all_properties]
        session_data['all_builders'] = [b.to_dict() for b in all_builders]
        session_data['current_page'] = 0  # Reset to first page
        
        # Determine which items were newly marked as shown by the RAG service
        new_shown_ids = set(updated_shown_ids) - prev_shown

        # Show items that were newly marked as shown. If none, fallback to the first unseen batch
        properties_to_show = [p for p in session_data['all_properties'] if str(p.get('id')) in new_shown_ids]
        if not properties_to_show:
            unseen = [p for p in session_data['all_properties'] if str(p.get('id')) not in prev_shown]
            properties_to_show = unseen[:10]

        builders_to_show = [b for b in session_data['all_builders'] if str(b.get('id')) in new_shown_ids]
        if not builders_to_show:
            unseen_b = [b for b in session_data['all_builders'] if str(b.get('id')) not in prev_shown]
            builders_to_show = unseen_b[:10]

        # Store last shown order for reference (e.g., 'prop 1' -> this mapping)
        session_data['last_shown_properties'] = [p.get('id') for p in properties_to_show]
        session_data['last_shown_builders'] = [b.get('id') for b in builders_to_show]
        # Enforce intent-specific visibility: if user asked for properties only, don't show builders and vice versa
        if session_data.get('last_intent') == 'search_properties':
            builders_to_show = []
        elif session_data.get('last_intent') == 'search_builders':
            properties_to_show = []

        # Track cursor offsets for robust pagination per latest result set
        session_data['properties_offset'] = len(properties_to_show)
        session_data['builders_offset'] = len(builders_to_show)

        # Add displayed items to shown_ids so 'show more' won't return duplicates
        for p in properties_to_show:
            session_data['shown_ids'].add(str(p.get('id')))
        for b in builders_to_show:
            session_data['shown_ids'].add(str(b.get('id')))

        # Check if there are more unseen results available for the requested type only
        remaining_props = [p for p in session_data['all_properties'] if str(p.get('id')) not in session_data['shown_ids']]
        remaining_builders = [b for b in session_data['all_builders'] if str(b.get('id')) not in session_data['shown_ids']]
        if session_data.get('last_intent') == 'search_properties':
            has_more = len(remaining_props) > 0
        elif session_data.get('last_intent') == 'search_builders':
            has_more = len(remaining_builders) > 0
        else:
            has_more = len(remaining_props) > 0 or len(remaining_builders) > 0
        
        # Save to DB
        if session_id:
            _save_chat_messages(session_id, user_message, ai_response)

        # PROCESS BUFFERED RESPONSES (Serialize objects)
        final_buffered = []
        if buffered_responses:
            for item in buffered_responses:
                payload = item.get('payload', {})
                
                # Convert properties to dicts
                if 'properties' in payload:
                    payload['properties'] = [p.to_dict() if hasattr(p, 'to_dict') else p for p in payload['properties']]
                
                if 'all_properties' in payload:
                    payload['all_properties'] = [p.to_dict() if hasattr(p, 'to_dict') else p for p in payload['all_properties']]
                
                # Convert builders to dicts
                if 'builders' in payload:
                    payload['builders'] = [b.to_dict() if hasattr(b, 'to_dict') else b for b in payload['builders']]
                
                if 'all_builders' in payload:
                    payload['all_builders'] = [b.to_dict() if hasattr(b, 'to_dict') else b for b in payload['all_builders']]
                
                # Ensure structure matches regular response
                if 'has_more' not in payload: payload['has_more'] = False
                if 'total_results' not in payload:
                    payload['total_results'] = {
                        "properties": len(payload.get('all_properties', payload.get('properties', []))),
                        "builders": len(payload.get('all_builders', payload.get('builders', [])))
                    }
                
                item['payload'] = payload
                final_buffered.append(item)
        return jsonify({
            "response": ai_response,
            "query_type": query_type,
            "data_sources_used": data_sources,
            "last_intent": session_data.get('last_intent'),
            "properties": [p.to_dict() if hasattr(p, 'to_dict') else p for p in properties_to_show],
            "builders": [b.to_dict() if hasattr(b, 'to_dict') else b for b in builders_to_show],
            "has_more": has_more,
            "total_results": {
                "properties": len(all_properties),
                "builders": len(all_builders)
            },
            "current_page": session_data.get('current_page', 0),
            "stats": {
                "properties_shown": len(properties_to_show),  # Only count what's actually shown
                "conversation_count": session_data['conversation_count']
            },
            "buffered_responses": final_buffered
        })
    
    except Exception as e:
        error_str = str(e).lower()
        
        if 'quota' in error_str or 'resource_exhausted' in error_str or '429' in error_str:
            error_message = (
                "I'm currently experiencing high demand. "
                "Please try again in a moment, or contact our support team for immediate assistance."
            )
            
            if session_id:
                _save_chat_messages(session_id, assistant_content=error_message)
            
            return jsonify({
                "response": error_message,
                "properties": [],
                "builders": [],
                "error_type": "quota_exceeded",
                "contact_info": {
                    "location": "Mumbai, India",
                    "email": "hello@housenseek.com",
                    "phone": "+91 123-456-7890"
                }
            }), 200
        
        db.session.rollback()
        print(f"Chat Error: {e}")
        import traceback
        print(traceback.format_exc())
        
        return jsonify({
            "response": "I apologize, but I'm having trouble right now. Please try again.",
            "properties": [],
            "builders": [],
            "error": str(e)
        }), 500

@chatbot_bp.route('/load-more', methods=['POST'])
@clerk_required()
def load_more():
    """
    Load next batch of 10 properties/builders
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        
        print(f"🔄 Load More Request - Session ID: {session_id}")
        
        if not session_id or session_id not in session_tracking:
            print(f"❌ Invalid session: {session_id}")
            print(f"Available sessions: {list(session_tracking.keys())}")
            return jsonify({"error": "Invalid session"}), 400
        
        session_data = session_tracking[session_id]
        current_page = session_data.get('current_page', 0)
        
        # These are already dictionaries (converted when stored)
        all_properties = session_data.get('all_properties', [])
        all_builders = session_data.get('all_builders', [])
        shown_ids = session_data.get('shown_ids', set())

        # Page using explicit offsets from the current result set.
        # This avoids false "no more" when shown_ids includes items from older turns.
        properties_offset = int(session_data.get('properties_offset', 0) or 0)
        builders_offset = int(session_data.get('builders_offset', 0) or 0)

        print(
            f"📊 Total properties: {len(all_properties)} (offset: {properties_offset}); "
            f"Total builders: {len(all_builders)} (offset: {builders_offset})"
        )

        # Decide which type to load based on last intent
        last_intent = session_data.get('last_intent')
        if last_intent == 'search_properties':
            properties_to_show = all_properties[properties_offset:properties_offset + 10]
            builders_to_show = []
        elif last_intent == 'search_builders':
            properties_to_show = []
            builders_to_show = all_builders[builders_offset:builders_offset + 10]
        else:
            properties_to_show = all_properties[properties_offset:properties_offset + 10]
            builders_to_show = all_builders[builders_offset:builders_offset + 10]

        # If nothing unseen, return empty and indicate no more
        if not properties_to_show and not builders_to_show:
            print("ℹ️ No more unseen items to load for this intent.")
            has_more = False
            return jsonify({
                "properties": [],
                "builders": [],
                "has_more": False,
                "current_page": session_data['current_page']
            })

        # Update shown_ids and page only for items we are returning
        for p in properties_to_show:
            shown_ids.add(str(p.get('id')))
        for b in builders_to_show:
            shown_ids.add(str(b.get('id')))

        # Advance offsets by what we returned
        session_data['properties_offset'] = properties_offset + len(properties_to_show)
        session_data['builders_offset'] = builders_offset + len(builders_to_show)

        session_data['shown_ids'] = shown_ids
        session_data['current_page'] = current_page + 1

        # Store last shown order for 'details by index' references
        session_data['last_shown_properties'] = [p.get('id') for p in properties_to_show]
        session_data['last_shown_builders'] = [b.get('id') for b in builders_to_show]

        # Check if more results available for this intent
        if last_intent == 'search_properties':
            has_more = session_data['properties_offset'] < len(all_properties)
        elif last_intent == 'search_builders':
            has_more = session_data['builders_offset'] < len(all_builders)
        else:
            has_more = (
                session_data['properties_offset'] < len(all_properties) or
                session_data['builders_offset'] < len(all_builders)
            )
        
        print(f"✅ Returning {len(properties_to_show)} properties, {len(builders_to_show)} builders")
        print(f"📌 Has more: {has_more}")
        
        return jsonify({
            "last_intent": session_data.get('last_intent'),
            "properties": properties_to_show,
            "builders": builders_to_show,
            "has_more": has_more,
            "current_page": session_data['current_page'],
            "debug_pagination": {
                "properties_offset": session_data.get('properties_offset', 0),
                "builders_offset": session_data.get('builders_offset', 0),
                "total_properties": len(all_properties),
                "total_builders": len(all_builders)
            },
            "total_results": {
                "properties": len(all_properties),
                "builders": len(all_builders)
            }
        })
    
    except Exception as e:
        print(f"❌ Error in load_more: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/session/new', methods=['POST'])
@clerk_required()
def create_session():
    """Create a new chat session"""
    try:
        # Use the authenticated user from clerk_required decorator
        user = g.current_user
        user_id = user.id if user else None

        new_session = ChatSession(
            user_id=user_id,
            title="New Chat",
            state='initial',
            status='active'
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        # Initialize tracking
        session_tracking[new_session.id] = {
            'shown_ids': set(),
            'conversation_count': 0,
            'memory': ConversationMemory(new_session.id),
            'all_properties': [],
            'all_builders': [],
            'current_page': 0,
            'properties_offset': 0,
            'builders_offset': 0
        }
        
        return jsonify({
            "session_id": new_session.id,
            "message": "Session created successfully"
        })
    except (IntegrityError, DataError) as e:
        db.session.rollback()
        err_text = str(e).lower()
        print(f"Error creating session (data/integrity): {e}")

        # Auto-heal common PostgreSQL issue:
        # duplicate key on chat_session_pkey due to sequence behind MAX(id).
        if "chat_session_pkey" in err_text and "duplicate key value" in err_text:
            try:
                _resync_chat_session_sequence()
                # Retry once after sequence repair.
                retry_session = ChatSession(
                    user_id=user_id,
                    title="New Chat",
                    state='initial',
                    status='active'
                )
                db.session.add(retry_session)
                db.session.commit()

                session_tracking[retry_session.id] = {
                    'shown_ids': set(),
                    'conversation_count': 0,
                    'memory': ConversationMemory(retry_session.id),
                    'all_properties': [],
                    'all_builders': [],
                    'current_page': 0,
                    'properties_offset': 0,
                    'builders_offset': 0
                }

                return jsonify({
                    "session_id": retry_session.id,
                    "message": "Session created successfully"
                })
            except Exception as retry_error:
                db.session.rollback()
                print(f"Session retry after sequence resync failed: {retry_error}")

        return jsonify({"error": "Invalid session payload."}), 400
    except OperationalError as e:
        db.session.rollback()
        print(f"Error creating session (db operational): {e}")
        return jsonify({"error": "Database schema issue. Ensure chat tables are migrated/created."}), 500
    except Exception as e:
        db.session.rollback()
        print(f"Error creating session: {e}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/history', methods=['GET'])
def get_session_history(session_id):
    """Get full chat history for a session"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        messages = ChatMessage.query.filter_by(session_id=session_id)\
                    .order_by(ChatMessage.created_at.asc()).all()
        
        return jsonify({
            "session_id": session_id,
            "session_info": session.to_dict(),
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat() if msg.created_at else None
                } for msg in messages
            ]
        })
    except Exception as e:
        print(f"Error in get_session_history: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@chatbot_bp.route('/session/<int:session_id>/reset', methods=['POST'])
def reset_session(session_id):
    """Clear shown properties tracking for fresh recommendations"""
    try:
        if session_id in session_tracking:
            session_tracking[session_id]['shown_ids'] = set()
            session_tracking[session_id]['all_properties'] = []
            session_tracking[session_id]['all_builders'] = []
            session_tracking[session_id]['current_page'] = 0
            session_tracking[session_id]['properties_offset'] = 0
            session_tracking[session_id]['builders_offset'] = 0
            return jsonify({"message": "Session tracking reset successfully"})
        return jsonify({"message": "Session not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/state', methods=['GET'])
def get_session_state(session_id):
    """Get current state of the conversation"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        tracking_data = session_tracking.get(session_id, {})
        
        return jsonify({
            "session_id": session_id,
            "state": session.state,
            "lead_quality": session.lead_quality,
            "status": session.status,
            "properties_shown": len(tracking_data.get('shown_ids', [])),
            "conversation_count": tracking_data.get('conversation_count', 0),
            "last_state_change": session.last_state_change.isoformat() if session.last_state_change else None
        })
    except Exception as e:
        print(f"Error in get_session_state: {str(e)}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/preferences/<int:user_id>', methods=['GET'])
def get_user_preferences(user_id):
    """Get learned preferences for a user"""
    try:
        from models import UserPreference
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        return jsonify({
            "user_id": user_id,
            "preferences": {
                p.pref_key: {
                    "value": p.pref_value,
                    "confidence": p.confidence,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None
                } for p in prefs
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/preferences/<int:user_id>', methods=['PUT'])
def update_user_preference(user_id):
    """Manually update user preferences"""
    try:
        from models import UserPreference
        data = request.json
        
        pref_key = data.get('pref_key')
        pref_value = data.get('pref_value')
        
        if not pref_key or not pref_value:
            return jsonify({"error": "pref_key and pref_value required"}), 400
        
        existing = UserPreference.query.filter_by(user_id=user_id, pref_key=pref_key).first()
        
        if existing:
            existing.pref_value = str(pref_value)
            existing.confidence = data.get('confidence', 1.0)
        else:
            new_pref = UserPreference(
                user_id=user_id,
                pref_key=pref_key,
                pref_value=str(pref_value),
                confidence=data.get('confidence', 1.0)
            )
            db.session.add(new_pref)
        
        db.session.commit()
        return jsonify({"message": "Preference updated successfully"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================
# FEATURE 5: BEHAVIORAL TRACKING ENDPOINT
# ============================================

@chatbot_bp.route('/track-interaction', methods=['POST'])
def track_interaction():
    """Track when user views/clicks a property"""
    try:
        data = request.json
        
        interaction = UserInteraction(
            user_id=data.get('user_id'),
            guest_id=data.get('guest_id') or request.headers.get('X-Guest-ID'),
            property_id=data.get('property_id'),
            action=data.get('action', 'viewed'),
            duration_seconds=data.get('duration'),
            session_id=data.get('session_id')
        )
        
        db.session.add(interaction)
        db.session.commit()
        
        return jsonify({"message": "Interaction tracked successfully"})
    except Exception as e:
        db.session.rollback()
        print(f"Error tracking interaction: {e}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/interactions/<int:user_id>', methods=['GET'])
def get_user_interactions(user_id):
    """Get user's interaction history"""
    try:
        interactions = UserInteraction.query.filter_by(user_id=user_id)\
                        .order_by(UserInteraction.timestamp.desc())\
                        .limit(50).all()
        
        return jsonify({
            "user_id": user_id,
            "interactions": [i.to_dict() for i in interactions]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# ANALYTICS & INSIGHTS
# ============================================

@chatbot_bp.route('/analytics/user/<int:user_id>', methods=['GET'])
def get_user_analytics(user_id):
    """Get comprehensive analytics for a user"""
    try:
        from models import UserPreference
        from .rag_service import analyze_user_behavior
        
        # Get preferences
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        
        # Get behavioral analysis
        behavior = analyze_user_behavior(user_id)
        
        # Get sessions
        sessions = ChatSession.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            "user_id": user_id,
            "explicit_preferences": {
                p.pref_key: p.pref_value for p in prefs
            },
            "behavioral_insights": behavior,
            "session_stats": {
                "total_sessions": len(sessions),
                "active_sessions": len([s for s in sessions if s.status == 'active']),
                "hot_leads": len([s for s in sessions if s.lead_quality == 'hot']),
                "warm_leads": len([s for s in sessions if s.lead_quality == 'warm'])
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/analytics/sessions', methods=['GET'])
def get_all_sessions_analytics():
    """Get analytics across all sessions (admin view)"""
    try:
        from datetime import datetime, timedelta
        
        # Get sessions from last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = ChatSession.query.filter(
            ChatSession.created_at >= thirty_days_ago
        ).all()
        
        # Calculate stats
        total_sessions = len(recent_sessions)
        active_sessions = len([s for s in recent_sessions if s.status == 'active'])
        
        state_distribution = {}
        for session in recent_sessions:
            state = session.state or 'initial'
            state_distribution[state] = state_distribution.get(state, 0) + 1
        
        lead_quality_distribution = {}
        for session in recent_sessions:
            quality = session.lead_quality or 'unknown'
            lead_quality_distribution[quality] = lead_quality_distribution.get(quality, 0) + 1
        
        return jsonify({
            "period": "last_30_days",
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "state_distribution": state_distribution,
            "lead_quality_distribution": lead_quality_distribution,
            "conversion_metrics": {
                "to_drilling": state_distribution.get('drilling', 0),
                "to_closed": state_distribution.get('closed', 0),
                "conversion_rate": (state_distribution.get('closed', 0) / total_sessions * 100) if total_sessions > 0 else 0
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# UTILITY ENDPOINTS
# ============================================

@chatbot_bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all sessions for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id query parameter required"}), 400
        
        sessions = ChatSession.query.filter_by(user_id=user_id).order_by(ChatSession.created_at.desc()).all()
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/sessions/list', methods=['GET'])
def list_sessions():
    """List all sessions (with optional user filter)"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        query = ChatSession.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        sessions = query.order_by(ChatSession.created_at.desc()).limit(50).all()
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/session/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """Get specific session details"""
    try:
        session = ChatSession.query.get(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        return jsonify(session.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/session/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session and all its messages"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
        # Remove from tracking
        if session_id in session_tracking:
            del session_tracking[session_id]
        
        # Delete from database (cascade will delete messages)
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({"message": "Session deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from models import Property
        Property.query.first()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "active_sessions": len(session_tracking)
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
