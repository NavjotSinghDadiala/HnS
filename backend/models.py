from datetime import datetime
from extensions import db
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    clerk_user_id = db.Column(db.String(100), unique=True, nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(15))
    role = db.Column(db.String(20))  # 'buyer', 'seller', 'admin', 'customer'
    is_active = db.Column(db.Boolean, default=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    properties = db.relationship('Property', backref='owner', lazy=True)
    enquiries = db.relationship('Enquiry', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    favorites = db.relationship('Favorite', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active if hasattr(self, 'is_active') else True,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def check_password(self, raw_password: str) -> bool:
        """
        Minimal password check for the local admin promotion endpoint.
        Current codebase stores the initial admin password as plain text.
        """
        if raw_password is None:
            return False
        return str(self.password) == str(raw_password)

class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    agency_name = db.Column(db.String(100))
    license_number = db.Column(db.String(50))
    verified = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='agent_profile')

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Property_Name = db.Column(db.String(100), nullable=False)
    Location = db.Column(db.String(200), nullable=False)
    Carpet_Area = db.Column(db.String(100))
    Price_Starting_From = db.Column(db.String(50))
    Pricing = db.Column(db.String(100))
    Highlights = db.Column(db.Text)  # JSON string for list of strings
    Extra_Charges = db.Column(db.String(100))
    Builder_Name = db.Column(db.String(100))
    Builder_Details = db.Column(db.Text)  # JSON string for object
    Existing_Configurations = db.Column(db.Text)  # JSON string for list of strings
    Built_up_Area = db.Column(db.String(100))
    Main_Door_Facing = db.Column(db.String(50))
    Ceiling_Height = db.Column(db.String(100))
    Kitchen = db.Column(db.String(100))
    Key_Highlights = db.Column(db.Text)  # JSON string for list of strings
    Address = db.Column(db.String(200))
    Flat_Details = db.Column(db.Text)  # JSON string for object
    Loan_Availability = db.Column(db.Text)  # JSON string for list of strings
    Approved_by_Authorities = db.Column(db.Text)  # JSON string for list of strings
    Project_Status = db.Column(db.String(50))
    Possession_Date = db.Column(db.String(50))
    RERA_ID = db.Column(db.String(50))
    Vastu_Compliant = db.Column(db.String(10))
    Parking = db.Column(db.String(50))
    Lift_Availability = db.Column(db.String(50))
    Security = db.Column(db.String(100))
    Connectivity = db.Column(db.Text)  # JSON string for list of strings
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('builder_project.id'), nullable=True)
    enquiries = db.relationship('Enquiry', backref='property', lazy=True)
    reviews = db.relationship('Review', backref='property', lazy=True)

    def to_dict(self):
        # Helper to safely parse JSON fields that might contain
        # malformed JSON or already-parsed Python objects.
        def _safe_json_loads(value, default=None):
            if value is None:
                return default
            # If it's already a list/dict, return as-is
            if isinstance(value, (list, dict)):
                return value
            try:
                return json.loads(value)
            except Exception:
                # Fallback: return original value or default so that
                # serialization never crashes the API.
                return default if default is not None else value
        # Get builder project image if available
        builder_project_image = None
        
        if self.project:
            # Get the first image from image_urls or use project_image
            if self.project.image_urls:
                try:
                    images = json.loads(self.project.image_urls)
                    if images and len(images) > 0:
                        builder_project_image = images[0]
                except:
                    # If JSON parsing fails, treat as single URL string
                    builder_project_image = self.project.image_urls
                
            if not builder_project_image and self.project.project_image:
                builder_project_image = self.project.project_image
                
            # Add some basic validation for image URLs
            if builder_project_image:
                # Check if it's a valid URL format
                if not (builder_project_image.startswith('http://') or builder_project_image.startswith('https://')):
                    builder_project_image = None
        
        return {
            'id': self.id,
            'Property_Name': self.Property_Name,
            'Location': self.Location,
            'Carpet_Area': self.Carpet_Area,
            'Price_Starting_From': self.Price_Starting_From,
            'Pricing': self.Pricing,
            'Highlights': _safe_json_loads(self.Highlights),
            'Extra_Charges': self.Extra_Charges,
            'Builder_Name': self.Builder_Name,
            'Builder_Details': _safe_json_loads(self.Builder_Details),
            'Existing_Configurations': _safe_json_loads(self.Existing_Configurations, default=[]),
            'Built_up_Area': self.Built_up_Area,
            'Main_Door_Facing': self.Main_Door_Facing,
            'Ceiling_Height': self.Ceiling_Height,
            'Kitchen': self.Kitchen,
            'Key_Highlights': _safe_json_loads(self.Key_Highlights),
            'Address': self.Address,
            'Flat_Details': _safe_json_loads(self.Flat_Details),
            'Loan_Availability': _safe_json_loads(self.Loan_Availability),
            'Approved_by_Authorities': _safe_json_loads(self.Approved_by_Authorities),
            'Project_Status': self.Project_Status,
            'Possession_Date': self.Possession_Date,
            'RERA_ID': self.RERA_ID,
            'Vastu_Compliant': self.Vastu_Compliant,
            'Parking': self.Parking,
            'Lift_Availability': self.Lift_Availability,
            'Security': self.Security,
            'Connectivity': _safe_json_loads(self.Connectivity),
            'user_id': self.user_id,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'builder_project_image': builder_project_image
        }

class Enquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)  
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)

class Builder(db.Model):
    rera_id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    brand_name = db.Column(db.String(100))
    established_year = db.Column(db.Integer)
    builder_type = db.Column(db.String(50))  # Residential, Commercial, Mixed
    rera_registered = db.Column(db.Boolean, default=False)
    corporate_address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pin_code = db.Column(db.String(10))
    contact_email = db.Column(db.String(120))
    contact_number = db.Column(db.String(15))
    website_url = db.Column(db.String(200))
    builder_logo = db.Column(db.String(200))  # URL to stored image
    cover_banner = db.Column(db.String(200))  # URL to stored image
    certificates = db.Column(db.Text)  # JSON string of certificate URLs
    location = db.Column(db.String(200))
    short_description = db.Column(db.Text)
    detailed_description = db.Column(db.Text)
    completed_projects = db.Column(db.Integer)
    ongoing_projects = db.Column(db.Integer)
    awards = db.Column(db.Text)  # JSON string of awards
    verified = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='builder_profiles')
    projects = db.relationship('BuilderProject', backref='builder', lazy=True)

    def to_dict(self):
        def safe_iso(dt):
            try:
                if dt is None:
                    return None
                if hasattr(dt, 'isoformat'):
                    return dt.isoformat()
                if isinstance(dt, str):
                    return dt
                return str(dt)
            except Exception:
                return str(dt)
        return {
            'id': self.rera_id,
            'rera_id': self.rera_id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'brand_name': self.brand_name,
            'established_year': self.established_year,
            'builder_type': self.builder_type,
            'rera_registered': self.rera_registered,
            'corporate_address': self.corporate_address,
            'city': self.city,
            'state': self.state,
            'pin_code': self.pin_code,
            'contact_email': self.contact_email,
            'contact_number': self.contact_number,
            'website_url': self.website_url,
            'builder_logo': self.builder_logo,
            'cover_banner': self.cover_banner,
            'certificates': self.certificates,
            'location': self.location,
            'short_description': self.short_description,
            'detailed_description': self.detailed_description,
            'completed_projects': self.completed_projects,
            'ongoing_projects': self.ongoing_projects,
            'awards': self.awards,
            'verified': self.verified
        }

class BuilderProject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    builder_id = db.Column(db.String(50), db.ForeignKey('builder.rera_id'), nullable=False)
    builder_name = db.Column(db.String(100))  # Manually entered builder name
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    total_units = db.Column(db.Integer)
    price_range = db.Column(db.String(100))
    completion_date = db.Column(db.Date)
    status = db.Column(db.String(50))  # 'Under Construction', 'Completed', 'Upcoming'
    image_urls = db.Column(db.Text)  # JSON string or comma-separated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    primary_slug = db.Column(db.String(150), unique=True, nullable=True)
    alias_slugs = db.Column(db.Text, nullable=True)  # JSON list of up to 5 alias slugs
    form_status = db.Column(db.String(20), default='draft')  # 'draft', 'in_progress', 'complete'

    # New fields for step 1
    property_type = db.Column(db.String(50))
    sub_type = db.Column(db.String(50))
    property_status = db.Column(db.String(20))
    possession_date = db.Column(db.Date)
    configuration = db.Column(db.Text) # JSON string for configuration details

    # New fields for step 2
    flat_number = db.Column(db.String(50))
    price_per_sqft = db.Column(db.Float)
    carpet_area_min = db.Column(db.Float)
    carpet_area_max = db.Column(db.Float)
    booking_amount = db.Column(db.Float)

    # New fields for step 3
    full_address = db.Column(db.Text)
    state = db.Column(db.String(100))
    city = db.Column(db.String(100))
    locality = db.Column(db.String(100))
    landmark = db.Column(db.String(200))
    towers = db.Column(db.Integer)
    floors_per_tower = db.Column(db.Integer)
    construction_status = db.Column(db.Text)
    
    # New fields for step 4 (Construction Details)
    floor_plans = db.Column(db.Text)  # JSON string of floor plan image URLs
    
    # New fields for step 5 (Amenities)
    amenities = db.Column(db.Text)  # JSON string of amenities list
    
    # New field for step 6 (Media)
    project_image = db.Column(db.String(300))  # URL to stored project image

    properties = db.relationship('Property', backref='project', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'builder_id': self.builder_id,
            'builder_name': self.builder_name,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'total_units': self.total_units,
            'price_range': self.price_range,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'status': self.status,
            'image_urls': self.image_urls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'primary_slug': self.primary_slug,
            'alias_slugs': json.loads(self.alias_slugs) if self.alias_slugs else [],
            'form_status': self.form_status,
            'property_type': self.property_type,
            'sub_type': self.sub_type,
            'property_status': self.property_status,
            'possession_date': self.possession_date.isoformat() if self.possession_date else None,
            'configuration': json.loads(self.configuration) if self.configuration else None,
            'flat_number': self.flat_number,
            'price_per_sqft': self.price_per_sqft,
            'carpet_area_min': self.carpet_area_min,
            'carpet_area_max': self.carpet_area_max,
            'booking_amount': self.booking_amount,
            'full_address': self.full_address,
            'state': self.state,
            'city': self.city,
            'locality': self.locality,
            'landmark': self.landmark,
            'towers': self.towers,
            'floors_per_tower': self.floors_per_tower,
            'construction_status': self.construction_status,
            'floor_plans': json.loads(self.floor_plans) if self.floor_plans else [],
            'amenities': json.loads(self.amenities) if self.amenities else [],
            'project_image': self.project_image
        }

class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    intro_paragraph = db.Column(db.Text, nullable=False)
    subheading1 = db.Column(db.String(200))
    content1 = db.Column(db.Text)
    image1 = db.Column(db.String(300))  # file path or URL
    alt_text1 = db.Column(db.String(300))
    subheading2 = db.Column(db.String(200))
    content2 = db.Column(db.Text)
    image2 = db.Column(db.String(300))
    alt_text2 = db.Column(db.String(300))
    subheading3 = db.Column(db.String(200))
    content3 = db.Column(db.Text)
    image3 = db.Column(db.String(300))
    alt_text3 = db.Column(db.String(300))
    featured_image = db.Column(db.String(300))
    featured_image_alt = db.Column(db.String(300))
    interlinks = db.Column(db.Text)  # JSON list
    external_links = db.Column(db.Text)  # JSON list
    meta_description = db.Column(db.String(300))
    focus_keywords = db.Column(db.String(200))
    slug = db.Column(db.String(200), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'intro_paragraph': self.intro_paragraph,
            'subheading1': self.subheading1,
            'content1': self.content1,
            'image1': self.image1,
            'alt_text1': self.alt_text1,
            'subheading2': self.subheading2,
            'content2': self.content2,
            'image2': self.image2,
            'alt_text2': self.alt_text2,
            'subheading3': self.subheading3,
            'content3': self.content3,
            'image3': self.image3,
            'alt_text3': self.alt_text3,
            'featured_image': self.featured_image,
            'featured_image_alt': self.featured_image_alt,
            'interlinks': json.loads(self.interlinks) if self.interlinks else [],
            'external_links': json.loads(self.external_links) if self.external_links else [],
            'meta_description': self.meta_description,
            'focus_keywords': self.focus_keywords,
            'slug': self.slug,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Slug(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(200), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)  # e.g., 'property', 'project', 'blog'
    target_id = db.Column(db.Integer, nullable=False)
    is_primary = db.Column(db.Boolean, default=False)


# ============================================
# ADVANCED FEATURES - NEW MODELS
# ============================================

class ChatSession(db.Model):
    """Enhanced chat session with state machine"""
    __tablename__ = 'chat_session'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(100))
    
    # Existing fields
    status = db.Column(db.String(20), default='active')  # 'active', 'lead_generated', 'closed'
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # NEW: State machine fields
    state = db.Column(db.String(20), default='initial')  # 'initial', 'gathering', 'showing', 'drilling', 'closed'
    lead_quality = db.Column(db.String(20))  # 'hot', 'warm', 'cold'
    interested_property_ids = db.Column(db.Text)  # JSON list of property IDs
    last_state_change = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'status': self.status,
            'state': self.state,
            'lead_quality': self.lead_quality,
            'interested_property_ids': json.loads(self.interested_property_ids) if self.interested_property_ids else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_state_change': self.last_state_change.isoformat() if self.last_state_change else None
        }


class ChatMessage(db.Model):
    """Chat messages"""
    __tablename__ = 'chat_message'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserPreference(db.Model):
    """User preferences learned from conversations"""
    __tablename__ = 'user_preference'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Keys: 'location', 'budget', 'bhk', 'possession', etc.
    pref_key = db.Column(db.String(50), nullable=False)
    pref_value = db.Column(db.String(200), nullable=False)
    
    # Confidence score (0.0 to 1.0)
    confidence = db.Column(db.Float, default=1.0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'pref_key', name='unique_user_pref'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pref_key': self.pref_key,
            'pref_value': self.pref_value,
            'confidence': self.confidence,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class UserInteraction(db.Model):
    """Track user behavior for learning preferences"""
    __tablename__ = 'user_interaction'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    guest_id = db.Column(db.String(100), nullable=True) # UUID for anonymous sessions
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # 'viewed', 'saved', 'shared', 'clicked'
    duration_seconds = db.Column(db.Integer)  # How long they viewed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'))
    
    # Relationships
    user = db.relationship('User', backref='interactions')
    property = db.relationship('Property', backref='interactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'action': self.action,
            'duration_seconds': self.duration_seconds,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'session_id': self.session_id
        }

class Favorite(db.Model):
    """Stores favorite properties for both users and guests"""
    __tablename__ = 'favorite'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    guest_id = db.Column(db.String(100), nullable=True) # UUID for anonymous users
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=True)
    # For guest sessions: store cart snapshot and change history in a single row
    cart_snapshot = db.Column(db.Text, nullable=True)  # JSON list of property IDs
    change_log = db.Column(db.Text, nullable=True)  # JSON list of change events
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    property = db.relationship('Property', backref='favourited_by')
    
    def to_dict(self):
        def safe_list(raw):
            try:
                if not raw:
                    return []
                data = json.loads(raw)
                return data if isinstance(data, list) else []
            except Exception:
                return []

        return {
            'id': self.id,
            'user_id': self.user_id,
            'guest_id': self.guest_id,
            'property_id': self.property_id,
            'entry_type': 'session' if self.property_id is None else 'item',
            'cart_snapshot': safe_list(self.cart_snapshot),
            'change_log': safe_list(self.change_log),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
