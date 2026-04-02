import os
import sys

# Forces the backend directory into the top of the search path
# This fixes runtime "ModuleNotFoundError" across all environments
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
from functools import wraps
from flask import request, jsonify, g
import jwt
from clerk_backend_api import Clerk
from clerk_backend_api.security import authenticate_request, AuthenticateRequestOptions
from extensions import db
from models import User

def _ensure_unique_username(base, clerk_user_id):
    base = (base or f"hns_user_{clerk_user_id[:8]}").strip()
    candidate = base
    counter = 1
    while User.query.filter_by(username=candidate).first():
        candidate = f"{base}_{counter}"
        counter += 1
    return candidate

def _safe_json_list(raw):
    try:
        if not raw:
            return []
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []

# Configure Clerk Auth
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
sdk = Clerk(bearer_auth=CLERK_SECRET_KEY)

class FlaskRequestWrapper:
    def __init__(self, request):
        self.headers = request.headers

def clerk_required(optional=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # 1. First check if user exists in local database by email from Authorization header
                # This makes the system database-first rather than Clerk-first
                auth_header = request.headers.get('Authorization', '')
                if auth_header.startswith('Bearer '):
                    try:
                        # Try to decode as a simple email token for local auth
                        token = auth_header.replace('Bearer ', '')
                        # Simple format: email:password (base64 encoded for basic auth style)
                        import base64
                        try:
                            decoded = base64.b64decode(token).decode('utf-8')
                            if ':' in decoded:
                                email, password = decoded.split(':', 1)
                                # Check if user exists in database
                                user = User.query.filter_by(email=email).first()
                                if user and user.check_password(password):
                                    g.current_user = user
                                    return f(*args, **kwargs)
                        except:
                            pass  # Not a local auth token, continue with Clerk
                    except:
                        pass  # Continue with Clerk auth
                
                # 2. Verify Clerk Request (only if local auth didn't work)
                request_state = authenticate_request(
                    FlaskRequestWrapper(request),
                    AuthenticateRequestOptions(secret_key=CLERK_SECRET_KEY)
                )
                
                if not request_state.is_signed_in:
                    if optional:
                        g.current_user = None
                        return f(*args, **kwargs)
                    return jsonify({
                        'error': 'Unauthorized',
                        'reason': str(request_state.reason)
                    }), 401
                
                # 3. Extract Data
                payload = getattr(request_state, 'payload', None)
                if not payload and hasattr(request_state, 'token'):
                    payload = jwt.decode(request_state.token, options={"verify_signature": False})
                
                if not payload:
                    return jsonify({'error': 'Unauthorized', 'reason': 'No token payload found'}), 401

                clerk_user_id = payload.get('sub')

                # 4. Database Lookup - First check by clerk_user_id
                user = User.query.filter_by(clerk_user_id=clerk_user_id).first()

                if not user:
                    # Fetch profile from Clerk for missing data
                    try:
                        clerk_user_data = sdk.users.get(user_id=clerk_user_id)
                    except Exception as e:
                        print(f"Clerk User Fetch Error: {str(e)}")
                        clerk_user_data = None
                    
                    # Get email from Clerk
                    email = None
                    if hasattr(clerk_user_data, 'email_addresses') and clerk_user_data.email_addresses:
                        email = clerk_user_data.email_addresses[0].email_address
                    
                    if not email:
                        return jsonify({"error": "Unauthorized", "reason": "User must have a valid email address."}), 401

                    # Check if user exists in database by email
                    existing_user = User.query.filter_by(email=email).first()
                    if existing_user:
                        # Attach Clerk ID to existing user
                        existing_user.clerk_user_id = clerk_user_id
                        db.session.commit()
                        user = existing_user
                    else:
                        # User not in database - deny access
                        return jsonify({"error": "Unauthorized", "reason": "User not found in database. Please contact administrator."}), 401
                    email_prefix = email.split('@')[0] if email else None

                    final_username = raw_username or first_name or email_prefix or f"hns_user_{clerk_user_id[:8]}"
                    final_username = _ensure_unique_username(final_username, clerk_user_id)

                    # If a user exists with this email, attach Clerk ID and use it
                    existing_by_email = User.query.filter_by(email=email).first()
                    if existing_by_email:
                        if not existing_by_email.clerk_user_id:
                            existing_by_email.clerk_user_id = clerk_user_id
                            if not existing_by_email.username:
                                existing_by_email.username = _ensure_unique_username(
                                    final_username, clerk_user_id
                                )
                            db.session.add(existing_by_email)
                            try:
                                db.session.commit()
                            except Exception as db_err:
                                db.session.rollback()
                                print(f"Database Save Error: {db_err}")
                                return jsonify({"error": "Failed to sync user to local DB"}), 500
                        user = existing_by_email
                    else:
                        # C. Create User with defaults for all NOT NULL fields
                        user = User(
                            clerk_user_id=clerk_user_id,
                            email=email,
                            username=final_username,
                            password="", # Provided an empty string to satisfy NOT NULL
                            role='customer',
                            is_active=True,
                            phone=None
                        )
                        db.session.add(user)
                        try:
                            db.session.commit()
                        except Exception as db_err:
                            db.session.rollback()
                            print(f"Database Save Error: {db_err}")
                            return jsonify({"error": "Failed to sync user to local DB"}), 500
                
                # 4. Attach to Global Context
                g.current_user = user
                
                # 5. Merge Guest Activity (Liked Properties)
                guest_id = request.headers.get('X-Guest-ID')
                if guest_id and user:
                    from models import Favorite
                    guest_favorites = Favorite.query.filter_by(guest_id=guest_id).all()
                    
                    if guest_favorites:
                        user_session = Favorite.query.filter_by(user_id=user.id, property_id=None).first()

                        for fav in guest_favorites:
                            # Session row: attach to user, or merge if user session already exists
                            if fav.property_id is None:
                                if user_session and user_session.id != fav.id:
                                    user_cart = _safe_json_list(user_session.cart_snapshot)
                                    guest_cart = _safe_json_list(fav.cart_snapshot)
                                    for pid in guest_cart:
                                        if pid not in user_cart:
                                            user_cart.append(pid)
                                    user_session.cart_snapshot = json.dumps(user_cart)

                                    user_changes = _safe_json_list(user_session.change_log)
                                    guest_changes = _safe_json_list(fav.change_log)
                                    if guest_changes:
                                        user_session.change_log = json.dumps(user_changes + guest_changes)

                                    db.session.delete(fav)
                                else:
                                    fav.user_id = user.id
                                    fav.guest_id = None
                                    user_session = fav
                                continue

                            # Legacy row: move ownership to user (or drop if duplicate)
                            existing = Favorite.query.filter_by(user_id=user.id, property_id=fav.property_id).first()
                            if existing:
                                db.session.delete(fav)
                            else:
                                fav.user_id = user.id
                                fav.guest_id = None
                        
                        # Merge User Interactions
                        try:
                            from models import UserInteraction
                            UserInteraction.query.filter_by(guest_id=guest_id).update({
                                'user_id': user.id,
                                'guest_id': None
                            })
                        except Exception as ie:
                            print(f"Interaction merge error: {ie}")

                        try:
                            db.session.commit()
                        except Exception as e:
                            db.session.rollback()
                            print(f"Guest merge error: {e}")

                return f(*args, **kwargs)
            except Exception as e:
                print(f"Critical Auth Error: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({'error': 'Authentication server error', 'details': str(e)}), 500

        return decorated_function
    return decorator

def admin_only(fn):
    @wraps(fn)
    @clerk_required(optional=False)
    def wrapper(*args, **kwargs):
        if not g.current_user or g.current_user.role != 'admin':
            return jsonify({"error": "Forbidden", "message": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper
