import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import requests
from models import (
    User,
    Agent,
    Property,
    Enquiry,
    Review,
    Builder,
    BuilderProject,
    Blog,
    Slug,
    ChatSession,
    ChatMessage,
    UserPreference,
    UserInteraction,
    Favorite
)

from flask import Flask, request, jsonify, send_from_directory, redirect, make_response, g
import jwt
from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions

#flash
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies, get_jwt_identity, unset_jwt_cookies
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import sqlite3
from werkzeug.utils import secure_filename
import json
from flask_migrate import Migrate
import requests
import base64
import sys
from slugify import slugify
from extensions import db 
from models import ChatSession, ChatMessage, UserPreference
import logging
from datetime import timedelta
from functools import wraps
import threading



# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

# Configure logging for security events
# NOTE: File logging disabled during development to prevent huge log files
# Uncomment FileHandler line for production security auditing
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # logging.FileHandler('security.log'),  # Disabled - was creating 30k+ line files
        logging.StreamHandler()  # Console logging only
    ]
)
security_logger = logging.getLogger('security')

app = Flask(__name__)
LOCAL_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# Allow localhost/127.0.0.1 on any port for development.
LOCAL_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {"origins": LOCAL_DEV_ORIGINS + [LOCAL_ORIGIN_REGEX]},
        r"/query": {"origins": LOCAL_DEV_ORIGINS + [LOCAL_ORIGIN_REGEX]},
        r"/build_index": {"origins": LOCAL_DEV_ORIGINS + [LOCAL_ORIGIN_REGEX]},
        r"/health": {"origins": LOCAL_DEV_ORIGINS + [LOCAL_ORIGIN_REGEX]},
    },
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Guest-ID", "x-guest-id"],
)
jwt = JWTManager(app)


@app.after_request
def add_local_dev_cors_headers(response):
    """
    Safety net for local development: ensure CORS headers are present even on
    framework-generated error/redirect responses.
    """
    origin = request.headers.get("Origin")
    if origin and (
        origin in LOCAL_DEV_ORIGINS
        or origin.startswith("http://localhost:")
        or origin.startswith("http://127.0.0.1:")
    ):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Guest-ID, x-guest-id"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return response

# Configure Flask to use UTF-8
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Configure Clerk Auth
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
from auth import clerk_required, admin_only
# Map the old jwt_required to clerk_required
def jwt_required(fn=None):
    if fn is None:
        return clerk_required(optional=False)
    return clerk_required(optional=False)(fn)

# Get absolute path to the backend folder (where app.py lives)
basedir = os.path.abspath(os.path.dirname(__file__))
# Create 'instance' folder if it doesn't exist
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)  # This line fixes most issues


# Use PostgreSQL (DATABASE_URL from .env)
_db_url = "sqlite:///" + os.path.join(basedir, "instance", "hns.db").replace("\\", "/")
# SQLAlchemy requires 'postgresql://' not 'postgres://' (Heroku-style URLs)
if _db_url.startswith('postgres://'):
    _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = _db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Import the db instance from extensions
from extensions import db

# Initialize the db with the app
db.init_app(app)  # <-- Use the imported db instance

# Then initialize Flask-Migrate
migrate = Migrate(app, db)

# Chatbot globals
_index_lock = threading.Lock()
_emb_index = None

# Add these configurations
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


with app.app_context():
    try:
        # Create tables if they don't exist
        db.create_all()
        
        # Check if admin exists
        admin = User.query.filter_by(email='admin@gmail.com').first()
        if not admin:
            # Create admin user
            admin = User()
            admin.username = 'admin'
            admin.email = 'admin@gmail.com'
            admin.password = 'admin'  # Plain text password
            admin.role = 'admin'
            admin.is_active = True
            db.session.add(admin)
            db.session.commit()
            print("Admin created successfully!")
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        db.session.rollback()

#--------------------------------------------- AUTHENTICATION HANDLED BY CLERK ---------------------------------------------
# Removed /api/auth/signup, /api/auth/login, /api/auth/refresh, /api/auth/logout routes
# as these are now fully managed by Clerk's frontend UI components and backend token verification.

#--------------------------------------------- ROUTERS AND API ENDPOINTS ---------------------------------------------
@app.route('/api/properties/location/<string:loc>', methods=['GET'])
def get_properties_by_location(loc):
    properties = Property.query.filter(Property.Location.like(f'%{loc}%')).all()
    return jsonify([property.to_dict() for property in properties])

@app.route('/api/properties', methods=['GET'])
def get_properties():
    properties = Property.query.all()
    return jsonify([property.to_dict() for property in properties])

@app.route('/api/locations', methods=['GET']) 
@jwt_required()
def get_locations(): 
    locations = db.session.query(Property.Location).distinct().all() 
    unique_locations = [loc[0].strip() for loc in locations if loc[0] and loc[0].strip()] 
    unique_locations = sorted(set(unique_locations))
    return jsonify(unique_locations)

# Excluded nodes for the "near you" feature (kept as an empty set for now so all areas are eligible).
EXCLUDED_NEAR_YOU_NODES = set()

# Ordered list of key nodes/areas used for the "nearest nodes" API.
# This is used as a logical sequence (roughly along the Navi Mumbai / Thane belt)
# to compute nearby locations. Update this list if you add more areas.
ORDERED_AREAS = [
    "Airoli",
    "Rabale",
    "Ghansoli",
    "Kopar Khairane",
    "Vashi",
    "Sanpada",
    "Juinagar",
    "Nerul",
    "Seawoods",
    "Belapur",
    "Kharghar",
    "Mansarovar",
    "Khandeshwar",
    "Panvel",
    "Thane",
    "Kalyan Subdistrict",
    "Kalyan-Dombivli",
    "Mumbai",
    "Navi Mumbai",
]

#yaha se nearyou till.. 

def has_properties_for_location(loc_name):
    """Check if a location has any properties in the database."""
    # Also check if the location is in the excluded list
    if loc_name in EXCLUDED_NEAR_YOU_NODES:
        return False
    count = Property.query.filter(Property.Location.ilike(f'%{loc_name}%')).count()
    return count > 0

@app.route('/api/nearest-nodes/<string:location>', methods=['GET'])
def get_nearest_nodes(location):
    """Get 4 nearest nodes based on the primary location from ORDERED_AREAS.
    Returns the location's position and 4 nearest nodes that have property data available.
    Only includes nodes that actually have properties to display.
    """
    # Normalize the input location for matching
    location_lower = location.lower().strip()
    
    # Find the index of the location in ORDERED_AREAS (case-insensitive partial match)
    found_index = -1
    for i, area in enumerate(ORDERED_AREAS):
        if area.lower() == location_lower or location_lower in area.lower() or area.lower() in location_lower:
            found_index = i
            break
    
    # If location not found, find first 4 areas with properties as fallback
    if found_index == -1:
        nearest = []
        for area in ORDERED_AREAS:
            if has_properties_for_location(area):
                nearest.append(area)
                if len(nearest) >= 4:
                    break
        return jsonify({
            'primaryLocation': location,
            'foundInArray': False,
            'nearestNodes': nearest
        })
    
    # Calculate nearest nodes that have properties.
    # Collect ALL valid candidates with their offset distance, then pick
    # the 4 closest ordered by position in ORDERED_AREAS.
    total_areas = len(ORDERED_AREAS)
    candidates = []  # list of (absolute_offset, index_in_ORDERED_AREAS)

    for i, area in enumerate(ORDERED_AREAS):
        if i == found_index:
            continue  # skip the user's own location
        if has_properties_for_location(area):
            candidates.append((abs(i - found_index), i))

    # Sort by offset distance (closest first), then by actual index for stable ordering
    candidates.sort(key=lambda x: (x[0], x[1]))

    # Take the 4 closest; re-sort by original index to preserve geographic order
    closest_four = sorted(candidates[:4], key=lambda x: x[1])
    nearest = [ORDERED_AREAS[idx] for _, idx in closest_four]
    
    return jsonify({
        'primaryLocation': ORDERED_AREAS[found_index],
        'foundInArray': True,
        'primaryIndex': found_index,
        'nearestNodes': nearest
    })

@app.route('/api/properties/multiple-locations', methods=['GET'])
def get_properties_by_multiple_locations():
    """Get properties from multiple locations.
    Query param: locations (comma-separated list of location names)
    """
    locations_param = request.args.get('locations', '')
    if not locations_param:
        return jsonify([]), 200
    
    locations_list = [loc.strip() for loc in locations_param.split(',') if loc.strip()]
    
    # Query properties matching any of the locations
    all_properties = []
    for loc in locations_list:
        properties = Property.query.filter(Property.Location.ilike(f'%{loc}%')).all()
        for prop in properties:
            prop_dict = prop.to_dict()
            if prop_dict not in all_properties:
                all_properties.append(prop_dict)
    
    return jsonify(all_properties)

# yaha tak nearyou. 

@app.route('/api/properties/<int:id>', methods=['GET'])
def get_property(id):
    property = Property.query.get_or_404(id)
    return jsonify(property.to_dict())

@app.route('/api/properties', methods=['POST'])
@admin_only
def create_property():
    data = request.json
    new_property = Property(
        Property_Name=data.get('Property_Name'),
        Location=data.get('Location'),
        Carpet_Area=data.get('Carpet_Area'),
        Price_Starting_From=data.get('Price_Starting_From'),
        Pricing=data.get('Pricing'),
        Highlights=json.dumps(data.get('Highlights')),
        Extra_Charges=data.get('Extra_Charges'),
        Builder_Name=data.get('Builder_Name'),
        Builder_Details=json.dumps(data.get('Builder_Details')),
        Existing_Configurations=json.dumps(data.get('Existing_Configurations')),
        Built_up_Area=data.get('Built_up_Area'),
        Main_Door_Facing=data.get('Main_Door_Facing'),
        Ceiling_Height=data.get('Ceiling_Height'),
        Kitchen=data.get('Kitchen'),
        Key_Highlights=json.dumps(data.get('Key_Highlights')),
        Address=data.get('Address'),
        Flat_Details=json.dumps(data.get('Flat_Details')),
        Loan_Availability=json.dumps(data.get('Loan_Availability')),
        Approved_by_Authorities=json.dumps(data.get('Approved_by_Authorities')),
        Project_Status=data.get('Project_Status'),
        Possession_Date=data.get('Possession_Date'),
        RERA_ID=data.get('RERA_ID'),
        Vastu_Compliant=data.get('Vastu_Compliant'),
        Parking=data.get('Parking'),
        Lift_Availability=data.get('Lift_Availability'),
        Security=data.get('Security'),
        Connectivity=json.dumps(data.get('Connectivity')),
        user_id=data['user_id'],
        project_id=data.get('project_id')
    )
    db.session.add(new_property)
    db.session.commit()
    return jsonify(new_property.to_dict()), 201

@app.route('/api/builders', methods=['GET'])
def get_builders():
    try:
        print("Fetching builders...")  # Debug log
        builders = Builder.query.all()
        print(f"Found {len(builders)} builders")  # Debug log
        
        builders_data = [builder.to_dict() for builder in builders]
        return jsonify(builders_data)
    except Exception as e:
        print(f"Error in get_builders: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500

# New endpoint to fetch builder by company_name
@app.route('/api/builders/name/<company_name>', methods=['GET'])
# 6 @jwt_required()
def get_builder_by_name(company_name):
    """
    Get builder by company name (case-insensitive, handles URL-encoded names)
    """
    try:
        # Decode URL-encoded name and normalize (replace hyphens/underscores with spaces)
        normalized_name = company_name.replace('-', ' ').replace('_', ' ').strip()
        
        print(f"Searching for builder: '{normalized_name}'")  # Debug log
        
        # Try exact match first (case-insensitive)
        builder = Builder.query.filter(
            Builder.company_name.ilike(normalized_name)
        ).first()
        
        # If not found, try partial match
        if not builder:
            builder = Builder.query.filter(
                Builder.company_name.ilike(f'%{normalized_name}%')
            ).first()
        
        # If still not found, try matching individual words
        if not builder:
            words = normalized_name.split()
            for word in words:
                if len(word) > 3:  # Only search meaningful words
                    builder = Builder.query.filter(
                        Builder.company_name.ilike(f'%{word}%')
                    ).first()
                    if builder:
                        break
        
        if not builder:
            print(f"Builder not found for name: '{normalized_name}'")  # Debug log
            # List all available builders for debugging
            all_builders = Builder.query.all()
            available_names = [b.company_name for b in all_builders]
            print(f"Available builders: {available_names}")
            
            return jsonify({
                'error': 'Builder not found',
                'searched_name': normalized_name,
                'available_builders': available_names[:5]  # Return first 5 for reference
            }), 404
        
        print(f"Builder found: {builder.company_name}")  # Debug log
        return jsonify(builder.to_dict())
        
    except Exception as e:
        print(f"Error in get_builder_by_name: {str(e)}")  # Debug log
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# Alternative: Add a route that lists all builders for debugging
@app.route('/api/builders/search', methods=['GET'])
def search_builders():
    """
    Search builders by name with query parameter
    Usage: /api/builders/search?name=hiranandani
    """
    try:
        search_term = request.args.get('name', '').strip()
        
        if not search_term:
            return jsonify({'error': 'Please provide a search term'}), 400
        
        # Search by company name or brand name
        builders = Builder.query.filter(
            (Builder.company_name.ilike(f'%{search_term}%')) |
            (Builder.brand_name.ilike(f'%{search_term}%'))
        ).all()
        
        if not builders:
            return jsonify({
                'error': 'No builders found',
                'searched_term': search_term
            }), 404
        
        return jsonify([builder.to_dict() for builder in builders])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/<path:rera_id>', methods=['GET'])
def get_builder(rera_id):
    try:
        builder = Builder.query.get_or_404(rera_id)
        return jsonify(builder.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders', methods=['POST'])
@admin_only
def create_builder():
    try:
        # Get user_id and rera_id from form data
        user_id = request.form.get('user_id')
        rera_id = request.form.get('reraId')
        
        if not user_id:
            return jsonify({'message': 'User ID is required'}), 400
        if not rera_id:
            return jsonify({'message': 'RERA ID is required'}), 400

        # Check if builder with this RERA ID already exists
        existing_builder = Builder.query.filter_by(rera_id=rera_id).first()
        if existing_builder:
            return jsonify({'message': 'Builder with this RERA ID already exists'}), 400

        # Get the user to check if they are admin
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Handle file uploads
        builder_logo = request.files.get('builderLogo')
        cover_banner = request.files.get('coverBanner')
        certificates = request.files.getlist('certificates')
    
        # Save builder logo
        logo_path = None
        if builder_logo and allowed_file(builder_logo.filename):
            filename = secure_filename(f"logo_{rera_id}_{builder_logo.filename}")
            logo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            builder_logo.save(logo_path)

        # Save cover banner
        banner_path = None
        if cover_banner and allowed_file(cover_banner.filename):
            filename = secure_filename(f"banner_{rera_id}_{cover_banner.filename}")
            banner_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            cover_banner.save(banner_path)

        # Save certificates
        certificate_paths = []
        for cert in certificates:
            if cert and allowed_file(cert.filename):
                filename = secure_filename(f"cert_{rera_id}_{cert.filename}")
                cert_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                cert.save(cert_path)
                certificate_paths.append(cert_path)

        # Create new builder
        new_builder = Builder(
            rera_id=rera_id,
            user_id=user_id,
            company_name=request.form.get('companyName'),
            brand_name=request.form.get('brandName'),
            established_year=request.form.get('establishedYear'),
            builder_type=request.form.get('builderType'),
            rera_registered=request.form.get('reraRegistered') == 'true',
            corporate_address=request.form.get('corporateAddress'),
            city=request.form.get('city'),
            state=request.form.get('state'),
            pin_code=request.form.get('pinCode'),
            contact_email=request.form.get('contactEmail'),
            contact_number=request.form.get('contactNumber'),
            website_url=request.form.get('websiteUrl'),
            builder_logo=logo_path,
            cover_banner=banner_path,
            certificates=json.dumps(certificate_paths),
            location=request.form.get('location'),
            short_description=request.form.get('shortDescription'),
            detailed_description=request.form.get('detailedDescription'),
            completed_projects=request.form.get('completedProjects'),
            ongoing_projects=request.form.get('ongoingProjects'),
            awards=request.form.get('awards'),
            verified=False
        )
    
        db.session.add(new_builder)
        db.session.commit()
    
        return jsonify({
            'message': 'Builder profile created successfully',
            'builder': new_builder.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating builder: {str(e)}")
        return jsonify({'message': f'Error creating builder profile: {str(e)}'}), 500

@app.route('/api/builders/<path:rera_id>', methods=['PUT'])
@admin_only
def update_builder(rera_id):
    try:
        builder = Builder.query.get_or_404(rera_id)
        data = request.get_json()

        # Update builder fields
        for field in ['company_name', 'brand_name', 'established_year', 'builder_type',
                     'rera_registered', 'corporate_address', 'city', 'state',
                     'pin_code', 'contact_email', 'contact_number', 'website_url',
                     'location', 'short_description', 'detailed_description',
                     'completed_projects', 'ongoing_projects', 'verified']:
            if field in data:
                setattr(builder, field, data[field])

        db.session.commit()
        return jsonify({'message': 'Builder updated successfully', 'builder': builder.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

import re
@app.route('/api/builders/<path:rera_id>', methods=['DELETE'])
@admin_only
def delete_builder(rera_id):
    try:
        builder = Builder.query.get_or_404(rera_id)
        db.session.delete(builder)
        db.session.commit()
        return jsonify({'message': 'Builder deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/<path:rera_id>/projects', methods=['GET'])
def get_builder_projects(rera_id):
    try:
        status = request.args.get('status')
        query = BuilderProject.query.filter_by(builder_id=rera_id)
        if status:
            # Allow partial, case-insensitive match for status
            query = query.filter(BuilderProject.status.ilike(f"%{status}%"))
        projects = query.all()
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _create_property_for_project(project, user_id, data):
    new_property = Property(
        Property_Name=project.title,
        Location=project.location,
        Builder_Name=project.builder_name,
        Project_Status=project.status,
        Possession_Date=project.possession_date.isoformat() if project.possession_date else None,
        user_id=user_id,
        project_id=project.id,
        RERA_ID=data.get('RERA_ID'),
        Carpet_Area=data.get('Carpet_Area'),
        Price_Starting_From=data.get('Price_Starting_From'),
        Pricing=data.get('Pricing'),
        Highlights=json.dumps(data.get('Highlights')) if data.get('Highlights') else None,
        Extra_Charges=data.get('Extra_Charges'),
        Builder_Details=json.dumps(data.get('Builder_Details')),
        Existing_Configurations=json.dumps(data.get('Existing_Configurations')),
        Built_up_Area=data.get('Built_up_Area'),
        Main_Door_Facing=data.get('Main_Door_Facing'),
        Ceiling_Height=data.get('Ceiling_Height'),
        Kitchen=data.get('Kitchen'),
        Key_Highlights=json.dumps(data.get('Key_Highlights')),
        Address=data.get('Address'),
        Flat_Details=json.dumps(data.get('Flat_Details')),
        Loan_Availability=json.dumps(data.get('Loan_Availability')),
        Approved_by_Authorities=json.dumps(data.get('Approved_by_Authorities')),
        Vastu_Compliant=data.get('Vastu_Compliant'),
        Parking=data.get('Parking'),
        Lift_Availability=data.get('Lift_Availability'),
        Security=data.get('Security'),
        Connectivity=json.dumps(data.get('Connectivity'))
    )
    db.session.add(new_property)
    db.session.commit()
    

#-----------------STEP 1 ROUTING FETCHING DETAILS FROM FRONTEND AND PUSHING TO DATABASE------------------------
@app.route('/api/builders/<path:rera_id>/projects/step1', methods=['POST'])
@admin_only
def create_project_step1(rera_id):
    data = request.json
    title = data['title']
    location = data['location']
    builder_name = data.get('builder_name')
    if not builder_name:
        builder = Builder.query.filter_by(rera_id=rera_id).first()
        builder_name = builder.company_name if builder else None
    new_project = BuilderProject(
        builder_id=rera_id,
        builder_name=builder_name,
        title=title,
        description=data.get('description'),
        location=location,
        property_type=data.get('property_type'),
        sub_type=data.get('sub_type'),
        property_status=data.get('property_status'),
        possession_date=None, # handled elsewhere
        configuration=json.dumps(data.get('configuration')) if data.get('configuration') else None,
        total_units=data.get('total_units'),
        price_range=data.get('price_range'),
        completion_date=None, # handled elsewhere
        status=data.get('status'),
        image_urls=data.get('image_urls'),
        form_status=data.get('form_status', 'draft'),
        full_address=data.get('full_address'),
        state=data.get('state'),
        city=data.get('city'),
        locality=data.get('locality'),
        landmark=data.get('landmark'),
        towers=data.get('towers'),
        floors_per_tower=data.get('floors_per_tower'),
        construction_status=data.get('construction_status')
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify(new_project.to_dict()), 201

@app.route('/api/builders/<path:rera_id>/projects/step2', methods=['POST'])
@admin_only
def create_project_step2(rera_id):
    data = request.json
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    project = BuilderProject.query.filter_by(id=project_id, builder_id=rera_id).first_or_404()
    # Update fields for step 2
    project.total_units = data.get('totalUnits')
    project.price_range = f"{data.get('priceMin', '')} - {data.get('priceMax', '')}"
    project.price_per_sqft = data.get('pricePerSqft')
    project.carpet_area_min = data.get('carpetAreaMin')
    project.carpet_area_max = data.get('carpetAreaMax')
    project.booking_amount = data.get('bookingAmount')
    project.flat_number = data.get('flat_number')
    project.form_status = 'step2_complete'
    db.session.commit()
    return jsonify(project.to_dict()), 200

@app.route('/api/builders/<path:rera_id>/projects/step4', methods=['POST'])
@admin_only
def create_project_step4(rera_id):
    # Handle both form data and JSON data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
    else:
        data = request.json
    
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    
    # Allow updating any project, not just from the current builder
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    
    # Handle file uploads for floor plans
    floor_plan_urls = []
    if 'floor_plans' in request.files:
        files = request.files.getlist('floor_plans')
        for file in files:
            if file and allowed_file(file.filename):
                filename = save_image(file)
                if filename:
                    floor_plan_urls.append(f'/uploads/{filename}')
    
    # Update fields for step 4
    project.towers = int(data.get('towers')) if data.get('towers') else None
    project.floors_per_tower = int(data.get('floors_per_tower')) if data.get('floors_per_tower') else None
    project.construction_status = data.get('construction_status')
    project.floor_plans = json.dumps(floor_plan_urls)
    project.form_status = 'step4_complete'
    
    db.session.commit()
    return jsonify(project.to_dict()), 200

@app.route('/api/builders/<path:rera_id>/projects/step5', methods=['POST'])
@admin_only
def create_project_step5(rera_id):
    data = request.json
    project_id = data.get('project_id')
    user_id = data.get('user_id')

    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Allow updating any project, not just from the current builder
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    
    # Update fields for step 5
    project.amenities = json.dumps(data.get('amenities', []))
    project.form_status = 'step5_complete'
    
    db.session.commit()

    _create_property_for_project(project, user_id, data)

    return jsonify(project.to_dict()), 200

def generate_slug_with_perplexity(project, api_key):
    """
    Calls Perplexity AI to generate a slug for a builder project.
    Fallbacks to slugify if the API call fails.
    """
    import requests
#-----------------------------------------PROMPTING WITH AI-----------------------------------------------
    
    prompt = (
        f"Generate a short, SEO-friendly, unique URL slug for a real estate project. "
        f"Only return the slug, no extra text. "
        f"Builder: {project.builder_name}\n"
        f"Project Title: {project.title}\n"
        f"Description: {project.description}\n"
        f"Property Type: {project.property_type}\n"
        f"Sub Type: {project.sub_type}\n"
        f"Locality: {project.locality}\n"
        f"City: {project.city}\n"
        f"Price Range: {project.price_range}\n"
        f"Configuration: {project.configuration}"
    )
    url = "https://api.perplexity.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "pplx-70b-online",  
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 20,
        "temperature": 0.2
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        slug = response.json()['choices'][0]['message']['content'].strip()
        # Sanitize slug: lowercase, replace spaces/underscores with hyphens, remove non-url chars
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9\- ]', '', slug)
        slug = slug.replace(' ', '-').replace('_', '-')
        slug = re.sub(r'-+', '-', slug).strip('-')
        return slug
    except Exception as e:
        # Fallback to slugify
        return slugify(f"{project.title}-{project.locality}-{project.city}")

@app.route('/api/builders/<path:rera_id>/projects/<int:project_id>', methods=['PATCH'])
@admin_only
def update_project_step(rera_id, project_id):
    try:
        data = request.json
        project = BuilderProject.query.filter_by(id=project_id, builder_id=rera_id).first_or_404()
        # Update only provided fields
        for key, value in data.items():
            if key == 'floor_plans':
                # Always save as JSON array
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if not isinstance(parsed, list):
                            parsed = [parsed]
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps([value])
                elif isinstance(value, list):
                    value = json.dumps(value)
                setattr(project, key, value)
            elif key == 'amenities':
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if not isinstance(parsed, list):
                            parsed = [parsed]
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps([value])
                elif isinstance(value, list):
                    value = json.dumps(value)
                setattr(project, key, value)
            elif hasattr(project, key):
                setattr(project, key, value)
        # Optionally update form_status
        if 'form_status' in data:
            project.form_status = data['form_status']
        db.session.commit()
        # After step 3, generate slugs if all required fields are present
        required_fields = [project.configuration, project.property_type, project.locality, project.builder_name, project.city, project.price_range]
        if all(required_fields):
            # Use Perplexity AI to generate the primary slug
            api_key = os.getenv('PERPLEXITY_API_KEY')
            primary_slug = generate_slug_with_perplexity(project, api_key)
            # Optionally, generate alias slugs using variations (fallback to slugify for aliases)
            try:
                config = json.loads(project.configuration) if project.configuration else []
            except Exception:
                config = []
            bhk = str(config[0]) if config else ''
            property_type = str(project.property_type or '')
            locality = str(project.locality or '')
            builder = str(project.builder_name or '')
            city = str(project.city or '')
            price_range = str(project.price_range or '')
            property_type_variant = str(project.sub_type or property_type)
            bhk_as_text = f"{bhk}-bedroom" if bhk else ''
            alias_slugs = [
                slugify(f"/project/{bhk}-{locality}-{property_type}"),
                slugify(f"/project/{locality}-{bhk}-{property_type_variant}-{builder}"),
                slugify(f"/project/{bhk_as_text}-{property_type}-in-{city}"),
                slugify(f"/project/{bhk}-in-{locality}-under-{price_range}"),
                slugify(f"/project/{locality}-{property_type}-{bhk}-{builder}")
            ]
            project.primary_slug = primary_slug
            project.alias_slugs = json.dumps(alias_slugs)
            db.session.commit()
            # Remove old slugs for this project
            Slug.query.filter_by(target_type='project', target_id=project.id).delete()
            db.session.commit()
            db.session.add(Slug(slug=primary_slug, target_type='project', target_id=project.id, is_primary=True))
            for alias in alias_slugs:
                db.session.add(Slug(slug=alias, target_type='project', target_id=project.id, is_primary=False))
            db.session.commit()
            # Return slugs in response
            result = project.to_dict()
            result['primary_slug'] = primary_slug
            result['alias_slugs'] = alias_slugs
            return jsonify(result), 200
        return jsonify(project.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@admin_only
def delete_project(project_id):
    project = BuilderProject.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'})

#--------------------------------------------- ADMIN ROUTES ---------------------------------------------
#--------------------------------------------- DONT EVEN THINK TO TOUCH THIS  ---------------------------------------------
#----------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------
@app.route('/api/admin/stats', methods=['GET'])
@admin_only
def get_admin_stats():
    try:
        print("Starting to fetch admin stats...")  # Debug log
        
        # Get total users
        total_users = User.query.count()
        print(f"Total users: {total_users}")  # Debug log
        
        # Get total properties
        total_properties = Property.query.count()
        print(f"Total properties: {total_properties}")  # Debug log
        
        # Get total enquiries
        total_enquiries = Enquiry.query.count()
        print(f"Total enquiries: {total_enquiries}")  # Debug log
        
        # Get total reviews
        total_reviews = Review.query.count()
        print(f"Total reviews: {total_reviews}")  # Debug log
        
        # Get recent activities
        print("Fetching recent activities...")  # Debug log
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_properties = Property.query.order_by(Property.created_at.desc()).limit(5).all()
        recent_enquiries = Enquiry.query.order_by(Enquiry.timestamp.desc()).limit(5).all()
        
        # Combine and sort activities
        activities = []
        
        for user in recent_users:
            activities.append({
                'type': 'user',
                'title': user.username,
                'description': 'New user registered',
                'timestamp': user.created_at.isoformat() if user.created_at else None
            })
            
        for property in recent_properties:
            activities.append({
                'type': 'property',
                'title': property.Property_Name,
                'description': 'New property listed',
                'timestamp': property.created_at.isoformat() if property.created_at else None
            })
            
        for enquiry in recent_enquiries:
            activities.append({
                'type': 'enquiry',
                'title': f'Enquiry for Property #{enquiry.property_id}',
                'description': 'New enquiry received',
                'timestamp': enquiry.timestamp.isoformat() if enquiry.timestamp else None
            })
        
        # Sort activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        # Take only the 5 most recent activities
        recent_activities = activities[:5]
        print(f"Recent activities count: {len(recent_activities)}")  # Debug log
        
        response_data = {
            'totalUsers': total_users,
            'totalProperties': total_properties,
            'totalEnquiries': total_enquiries,
            'totalReviews': total_reviews,
            'recentActivities': recent_activities
        }
        print("Successfully prepared response data")  # Debug log
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in get_admin_stats: {str(e)}")  # Debug log
        import traceback
        print(traceback.format_exc())  # Print full stack trace
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/graph', methods=['GET'])
@admin_only
def get_admin_graph():
    """Build a dynamic knowledge graph from DB entities for admin visualization."""
    def _parse_json_list(raw):
        if raw is None:
            return []
        if isinstance(raw, list):
            return [str(x).strip() for x in raw if str(x).strip()]
        if isinstance(raw, str):
            text = raw.strip()
            if not text:
                return []
            try:
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
                if isinstance(parsed, dict):
                    return [str(k).strip() for k in parsed.keys() if str(k).strip()]
            except Exception:
                pass
            return [part.strip() for part in text.split(',') if part.strip()]
        return []

    def _extract_city(location_text):
        if not location_text:
            return 'Unknown'
        parts = [p.strip() for p in str(location_text).split(',') if p.strip()]
        return parts[-1] if parts else str(location_text).strip()

    def _parse_price(raw_price):
        if raw_price is None:
            return None
        if isinstance(raw_price, (int, float)):
            return float(raw_price)

        text = str(raw_price).lower().replace(',', '').strip()
        if not text:
            return None

        match = re.search(r'(\d+(?:\.\d+)?)', text)
        if not match:
            return None

        value = float(match.group(1))
        if 'crore' in text or 'cr' in text:
            value *= 10000000
        elif 'lakh' in text or 'lac' in text or 'lakhs' in text:
            value *= 100000
        elif 'k' in text:
            value *= 1000
        return value

    try:
        properties = Property.query.all()
        builders = Builder.query.all()
        projects = BuilderProject.query.all()

        builder_by_id = {b.rera_id: b for b in builders}
        builder_by_name = {}
        for b in builders:
            for key in [b.company_name, b.brand_name, b.rera_id]:
                if key:
                    builder_by_name[str(key).strip().lower()] = b

        project_count_by_builder = {}
        for b in builders:
            project_count_by_builder[b.rera_id] = len(b.projects or [])
        max_builder_projects = max(project_count_by_builder.values(), default=1)

        location_count = {}
        for p in properties:
            location_key = (p.Location or '').strip() or 'Unknown'
            location_count[location_key] = location_count.get(location_key, 0) + 1
        max_location_count = max(location_count.values(), default=1)

        parsed_prices = []
        max_amenity_count = 1
        for p in properties:
            project = p.project
            price_value = _parse_price(p.Price_Starting_From or p.Pricing or (project.price_range if project else None))
            if price_value is not None:
                parsed_prices.append(price_value)

            amenities_probe = []
            if project and project.amenities:
                amenities_probe = _parse_json_list(project.amenities)
            elif p.Highlights:
                amenities_probe = _parse_json_list(p.Highlights)
            max_amenity_count = max(max_amenity_count, len(amenities_probe))

        min_price = min(parsed_prices) if parsed_prices else None
        max_price = max(parsed_prices) if parsed_prices else None
        amenity_weight = 0.06
        score_denominator = 1.0 + (max_amenity_count * amenity_weight) + 1.0 + 1.0

        nodes = {}
        edges = set()

        def _add_node(node_id, node_type, label, **extra):
            if node_id not in nodes:
                node_data = {'id': node_id, 'type': node_type, 'label': label}
                node_data.update(extra)
                nodes[node_id] = node_data

        def _add_edge(source, target, edge_type):
            if source and target:
                edges.add((source, target, edge_type))

        for b in builders:
            builder_id = f"builder_{slugify(str(b.rera_id or b.company_name or b.brand_name or 'unknown'))}"
            builder_label = b.company_name or b.brand_name or b.rera_id
            _add_node(builder_id, 'builder', builder_label, city=b.city or 'Unknown')

        for project in projects:
            project_id = f"project_{project.id}"
            project_label = project.title or f"Project {project.id}"
            _add_node(project_id, 'project', project_label)

            builder_id = f"builder_{slugify(str(project.builder_id or project.builder_name or 'unknown'))}"
            if builder_id not in nodes and project.builder_name:
                _add_node(builder_id, 'builder', project.builder_name)
            _add_edge(builder_id, project_id, 'has_project')

        property_scores = []

        for p in properties:
            property_id = f"property_{p.id}"
            property_label = p.Property_Name or f"Property {p.id}"
            location_text = (p.Location or (p.project.location if p.project else None) or 'Unknown').strip() if isinstance((p.Location or (p.project.location if p.project else None) or 'Unknown'), str) else 'Unknown'
            city = _extract_city(location_text)

            matched_builder = None
            if p.project and p.project.builder_id and p.project.builder_id in builder_by_id:
                matched_builder = builder_by_id[p.project.builder_id]
            elif p.Builder_Name:
                matched_builder = builder_by_name.get(p.Builder_Name.strip().lower())

            if matched_builder:
                builder_node_id = f"builder_{slugify(str(matched_builder.rera_id or matched_builder.company_name or matched_builder.brand_name))}"
                builder_label = matched_builder.company_name or matched_builder.brand_name or matched_builder.rera_id
                builder_project_score = project_count_by_builder.get(matched_builder.rera_id, 0)
            elif p.project and p.project.builder_name:
                builder_node_id = f"builder_{slugify(str(p.project.builder_name))}"
                builder_label = p.project.builder_name
                builder_project_score = 0
            elif p.Builder_Name:
                builder_node_id = f"builder_{slugify(str(p.Builder_Name))}"
                builder_label = p.Builder_Name
                builder_project_score = 0
            else:
                builder_node_id = 'builder_unknown'
                builder_label = 'Unknown Builder'
                builder_project_score = 0

            _add_node(builder_node_id, 'builder', builder_label)
            _add_edge(property_id, builder_node_id, 'built_by')

            location_node_id = f"location_{slugify(location_text)}"
            _add_node(location_node_id, 'location', location_text, city=city)
            _add_edge(property_id, location_node_id, 'located_in')

            amenities = []
            if p.project and p.project.amenities:
                amenities = _parse_json_list(p.project.amenities)
            elif p.Highlights:
                amenities = _parse_json_list(p.Highlights)

            for amenity in amenities:
                amenity_node_id = f"amenity_{slugify(amenity)}"
                _add_node(amenity_node_id, 'amenity', amenity)
                _add_edge(property_id, amenity_node_id, 'has_amenity')

            raw_price = p.Price_Starting_From or p.Pricing or (p.project.price_range if p.project else None)
            parsed_price = _parse_price(raw_price)

            if parsed_price is None or min_price is None or max_price is None or max_price == min_price:
                normalized_price = 0.5
            else:
                normalized_price = 1.0 - ((parsed_price - min_price) / (max_price - min_price))
                normalized_price = max(0.0, min(1.0, normalized_price))

            amenity_score = len(amenities) * amenity_weight
            builder_reputation = builder_project_score / max_builder_projects if max_builder_projects else 0.0
            location_popularity = location_count.get(location_text, 0) / max_location_count if max_location_count else 0.0

            total_raw_score = normalized_price + amenity_score + builder_reputation + location_popularity
            score = round(max(0.0, min(1.0, total_raw_score / score_denominator)), 4)

            _add_node(
                property_id,
                'property',
                property_label,
                score=score,
                city=city,
                builder_label=builder_label,
                amenity_count=len(amenities)
            )
            property_scores.append((property_id, score))

        top_property_ids = [pid for pid, _ in sorted(property_scores, key=lambda x: x[1], reverse=True)[:5]]
        for pid in top_property_ids:
            if pid in nodes:
                nodes[pid]['is_top'] = True

        return jsonify({
            'nodes': list(nodes.values()),
            'edges': [{'source': s, 'target': t, 'type': et} for (s, t, et) in edges],
            'meta': {
                'top_properties': top_property_ids
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to build admin graph: {str(e)}'}), 500

#--------------------------------------------- USER MANAGEMENT ROUTES ---------------------------------------------
@app.route('/api/users', methods=['GET'])
@admin_only
def get_users():
    try:
        # Get the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401

        # Get all users
        users = User.query.all()
        users_data = [{
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active if hasattr(user, 'is_active') else True,
            'created_at': user.created_at.isoformat() if user.created_at else None
        } for user in users]
        
        return jsonify(users_data)
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    try:
        user = User.query.get_or_404(id)
        return jsonify({
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active if hasattr(user, 'is_active') else True,
            'created_at': user.created_at.isoformat() if user.created_at else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_builder_project_by_id(project_id):
    project = BuilderProject.query.get(project_id)
    if not project:
        return jsonify({'error': 'Builder project not found'}), 404
    return jsonify(project.to_dict())

@app.route('/api/users/<int:id>', methods=['PUT'])
@admin_only
def update_user(id):
    try:
        user = User.query.get_or_404(id)
        data = request.get_json()

        # Update user fields
        if 'name' in data:
            user.username = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = data['is_active']
        # Add more fields as needed

        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'name': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active if hasattr(user, 'is_active') else True,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
@admin_only
def delete_user(id):
    try:
        user = User.query.get_or_404(id)
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Utility to generate slug from title
import re
from unicodedata import normalize
from urllib.parse import urlparse

def generate_slug(title):
    slug = normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', slug).lower()
    slug = re.sub(r'\s+', '-', slug).strip('-')
    return slug

def normalize_blog_slug(raw_slug, title):
    slug_input = (raw_slug or '').strip()
    if not slug_input:
        return generate_slug(title or '')

    if re.match(r'^https?://', slug_input, flags=re.IGNORECASE):
        parsed = urlparse(slug_input)
        path_segment = parsed.path.strip('/').split('/')[-1] if parsed.path else ''
        slug_input = path_segment or parsed.netloc or slug_input

    return generate_slug(slug_input)

def ensure_unique_blog_slug(candidate_slug, exclude_blog_id=None):
    base_slug = (candidate_slug or '').strip() or 'blog'
    unique_slug = base_slug
    counter = 2

    while True:
        query = Blog.query.filter_by(slug=unique_slug)
        if exclude_blog_id is not None:
            query = query.filter(Blog.id != exclude_blog_id)
        if not query.first():
            return unique_slug
        unique_slug = f"{base_slug}-{counter}"
        counter += 1

# Utility to save uploaded images
def save_image(file):
    if file and allowed_file(file.filename):
        # Check file size (5MB limit per image)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 5 * 1024 * 1024:  # 5MB limit
            return None  # File too large
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return filename  # Only return the filename, not the full path
    return None

# API to create a blog (multipart/form-data)
@app.route('/api/blogs', methods=['POST'])
@admin_only
def create_blog():
    try:
        data = request.form
        files = request.files
        title = data.get('title')
        intro_paragraph1 = data.get('introParagraph')
        subheading1 = data.get('subheading1')
        content1 = data.get('content1')
        subheading2 = data.get('subheading2')
        content2 = data.get('content2')
        subheading3 = data.get('subheading3')
        content3 = data.get('content3')
        meta_description = data.get('metaDescription')
        focus_keywords = data.get('focusKeywords')
        slug = ensure_unique_blog_slug(normalize_blog_slug(data.get('slug'), title))
        featured_image_alt = data.get('featuredImageAlt')
        alt_text1 = data.get('altText1')
        alt_text2 = data.get('altText2')
        alt_text3 = data.get('altText3')
        interlinks = data.get('interlinks')  # JSON string
        external_links = data.get('externalLinks')  # JSON string

        # Validate uploaded file types with clear error response
        for field_name in ('featuredImage', 'image1', 'image2', 'image3'):
            file_obj = files.get(field_name)
            if file_obj and file_obj.filename and not allowed_file(file_obj.filename):
                return jsonify({'error': f'Invalid file type for {field_name}. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}), 400

        # Save images
        featured_image = save_image(files.get('featuredImage'))
        image1 = save_image(files.get('image1'))
        image2 = save_image(files.get('image2'))
        image3 = save_image(files.get('image3'))

        blog = Blog(
            title=title,
            intro_paragraph=intro_paragraph1,
            subheading1=subheading1,
            content1=content1,
            image1=image1,
            alt_text1=alt_text1,
            subheading2=subheading2,
            content2=content2,
            image2=image2,
            alt_text2=alt_text2,
            subheading3=subheading3,
            content3=content3,
            image3=image3,
            alt_text3=alt_text3,
            featured_image=featured_image,
            featured_image_alt=featured_image_alt,
            interlinks=interlinks,
            external_links=external_links,
            meta_description=meta_description,
            focus_keywords=focus_keywords,
            slug=slug
        )
        db.session.add(blog)
        db.session.commit()
        return jsonify({'success': True, 'blog': blog.to_dict()}), 201
    except Exception as e:
        return jsonify({'error': f'Blog creation failed: {str(e)}'}), 500

# API to list all blogs (for admin dashboard)
@app.route('/api/blogs', methods=['GET'])
def list_blogs():
    blogs = Blog.query.order_by(Blog.created_at.desc()).all()
    slugs_updated = False
    for blog in blogs:
        if blog.slug and re.match(r'^https?://', blog.slug, flags=re.IGNORECASE):
            fixed_slug = ensure_unique_blog_slug(normalize_blog_slug(blog.slug, blog.title), exclude_blog_id=blog.id)
            if fixed_slug != blog.slug:
                blog.slug = fixed_slug
                slugs_updated = True

    if slugs_updated:
        db.session.commit()

    return jsonify([b.to_dict() for b in blogs])

# Get a single blog by ID
@app.route('/api/blogs/<int:blog_id>', methods=['GET'])
def get_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    return jsonify(blog.to_dict())

# Get a single blog by slug
@app.route('/api/blogs/slug/<slug>', methods=['GET'])
def get_blog_by_slug(slug):
    print(f"Fetching blog with slug: {slug}")
    blog = Blog.query.filter_by(slug=slug).first()
    if not blog:
        print(f"Blog not found for slug: {slug}")
        return jsonify({'error': 'Blog not found'}), 404
    print(f"Blog found: {blog.title}")
    return jsonify(blog.to_dict())

# Update a blog by ID (multipart/form-data for images)
@app.route('/api/blogs/<int:blog_id>', methods=['PUT'])
@admin_only
def update_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    data = request.form
    files = request.files

    for field_name in ('featuredImage', 'image1', 'image2', 'image3'):
        file_obj = files.get(field_name)
        if file_obj and file_obj.filename and not allowed_file(file_obj.filename):
            return jsonify({'error': f'Invalid file type for {field_name}. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}), 400

    blog.title = data.get('title', blog.title)
    blog.intro_paragraph = data.get('introParagraph', blog.intro_paragraph)
    blog.subheading1 = data.get('subheading1', blog.subheading1)
    blog.content1 = data.get('content1', blog.content1)
    blog.subheading2 = data.get('subheading2', blog.subheading2)
    blog.content2 = data.get('content2', blog.content2)
    blog.subheading3 = data.get('subheading3', blog.subheading3)
    blog.content3 = data.get('content3', blog.content3)
    blog.meta_description = data.get('metaDescription', blog.meta_description)
    blog.focus_keywords = data.get('focusKeywords', blog.focus_keywords)
    normalized_slug = normalize_blog_slug(data.get('slug', blog.slug), blog.title)
    blog.slug = ensure_unique_blog_slug(normalized_slug, exclude_blog_id=blog.id)
    blog.featured_image_alt = data.get('featuredImageAlt', blog.featured_image_alt)
    blog.alt_text1 = data.get('altText1', blog.alt_text1)
    blog.alt_text2 = data.get('altText2', blog.alt_text2)
    blog.alt_text3 = data.get('altText3', blog.alt_text3)
    blog.interlinks = data.get('interlinks', blog.interlinks)
    blog.external_links = data.get('externalLinks', blog.external_links)
    # Update images if new files are uploaded
    if files.get('featuredImage'):
        blog.featured_image = save_image(files.get('featuredImage'))
    if files.get('image1'):
        blog.image1 = save_image(files.get('image1'))
    if files.get('image2'):
        blog.image2 = save_image(files.get('image2'))
    if files.get('image3'):
        blog.image3 = save_image(files.get('image3'))
    db.session.commit()
    return jsonify({'success': True, 'blog': blog.to_dict()})

# Delete a blog by ID (and its images)
@app.route('/api/blogs/<int:blog_id>', methods=['DELETE'])
@admin_only
def delete_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    # Optionally, delete image files from disk
    for img_field in ['featured_image', 'image1', 'image2', 'image3']:
        img = getattr(blog, img_field)
        if img:
            img_path = os.path.join(app.config['UPLOAD_FOLDER'], img)
            if os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except Exception:
                    pass
    db.session.delete(blog)
    db.session.commit()
    return jsonify({'success': True})

# Serve SEO-friendly blog page
from flask import render_template_string
@app.route('/blog/<slug>', methods=['GET'])
def serve_blog(slug):
    blog = Blog.query.filter_by(slug=slug).first_or_404()
    # Render interlinks and external links
    interlinks_html = ''
    if blog.interlinks:
        links = json.loads(blog.interlinks)
        if links:
            interlinks_html = '<h3>Related Articles</h3><ul>' + ''.join(f'<li><a href="{l}">{l}</a></li>' for l in links) + '</ul>'
    external_links_html = ''
    if blog.external_links:
        links = json.loads(blog.external_links)
        if links:
            external_links_html = '<h3>External Resources</h3><ul>' + ''.join(f'<li><a href="{l}" target="_blank" rel="noopener noreferrer">{l}</a></li>' for l in links) + '</ul>'
    html = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{blog.title}</title>
        <meta name="description" content="{blog.meta_description or ''}">
        <meta property="og:title" content="{blog.title}">
        <meta property="og:description" content="{blog.meta_description or ''}">
        <meta property="og:type" content="article">
        <meta property="og:url" content="{{request.url}}">
        <meta name="keywords" content="{blog.focus_keywords or ''}">
    </head>
    <body>
        <h1>{blog.title}</h1>
        <p>{blog.intro_paragraph}</p>
        {'<img src="/' + blog.featured_image + '" alt="' + (blog.featured_image_alt or '') + '" style="max-width:400px;">' if blog.featured_image else ''}
        <h2>{blog.subheading1 or ''}</h2>
        <p>{blog.content1 or ''}</p>
        {'<img src="/' + blog.image1 + '" alt="' + (blog.alt_text1 or '') + '" style="max-width:400px;">' if blog.image1 else ''}
        <h2>{blog.subheading2 or ''}</h2>
        <p>{blog.content2 or ''}</p>
        {'<img src="/' + blog.image2 + '" alt="' + (blog.alt_text2 or '') + '" style="max-width:400px;">' if blog.image2 else ''}
        <h2>{blog.subheading3 or ''}</h2>
        <p>{blog.content3 or ''}</p>
        {'<img src="/' + blog.image3 + '" alt="' + (blog.alt_text3 or '') + '" style="max-width:400px;">' if blog.image3 else ''}
        {interlinks_html}
        {external_links_html}
    </body>
    </html>
    '''
    return render_template_string(html)

# Serve uploaded images
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    normalized = (filename or '').replace('\\', '/').lstrip('/')
    if normalized.startswith('backend/uploads/'):
        normalized = normalized[len('backend/uploads/'):]
    if normalized.startswith('uploads/'):
        normalized = normalized[len('uploads/'):]
    normalized = os.path.basename(normalized)
    return send_from_directory(app.config['UPLOAD_FOLDER'], normalized)

# Remove this endpoint since we're using the existing /uploads/<filename> endpoint

# Update /api/projects/slug/<slug> to handle BuilderProject slugs
@app.route('/api/projects/slug/<slug>', methods=['GET'])
def get_project_by_slug(slug):
    slug_entry = Slug.query.filter_by(slug=slug, target_type='project').first()
    if not slug_entry:
        return jsonify({'error': 'Project not found'}), 404
    project = BuilderProject.query.get(slug_entry.target_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if not slug_entry.is_primary:
        primary_entry = Slug.query.filter_by(target_type='project', target_id=project.id, is_primary=True).first()
        if primary_entry:
            return redirect(f"/api/projects/slug/{primary_entry.slug}", code=301)
    return jsonify(project.to_dict())

# 3. Redirect alias slugs to primary in /api/properties/slug/<slug>
@app.route('/api/properties/slug/<slug>', methods=['GET'])
@jwt_required()
def get_property_by_slug(slug):
    slug_entry = Slug.query.filter_by(slug=slug, target_type='property').first()
    if not slug_entry:
        return jsonify({'error': 'Property not found'}), 404
    property = Property.query.get(slug_entry.target_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    if not slug_entry.is_primary:
        # Redirect to canonical slug
        primary_entry = Slug.query.filter_by(target_type='property', target_id=property.id, is_primary=True).first()
        if primary_entry:
            return redirect(f"/api/properties/slug/{primary_entry.slug}", code=301)
    return jsonify(property.to_dict())

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    projects = BuilderProject.query.all()
    return jsonify([p.to_dict() for p in projects])

@app.route('/api/builders/<path:rera_id>/projects/upload-image', methods=['POST'])
@admin_only
def upload_project_image(rera_id):
    print(f"Upload project image called with rera_id: {rera_id}")
    print(f"Request form data: {request.form}")
    print(f"Request files: {request.files}")
    
    # Accepts multipart/form-data with project_id and project_image
    project_id = request.form.get('project_id')
    print(f"Project ID from form: {project_id}")
    
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    if 'project_image' not in request.files:
        return jsonify({'error': 'project_image file is required'}), 400
    
    file = request.files['project_image']
    print(f"File received: {file.filename}")
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Save the image file to uploads folder
    filename = save_image(file)
    print(f"Saved filename: {filename}")
    
    if not filename:
        return jsonify({'error': 'Failed to save image'}), 500
    
    # Update the project
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    print(f"Found project: {project.title}")
    
    # Store the image URL in the project_image field
    project.project_image = f'/uploads/{filename}'
    print(f"Setting project_image to: {project.project_image}")
    
    db.session.commit()
    print(f"Database updated successfully")
    
    return jsonify(project.to_dict()), 200

# ---------------------------------------------------------------------GEO LOCATION -----------------------------------------------------------------------


@app.route('/api/geolocation', methods=['POST'])
def receive_geolocation():
    data = request.get_json()
    lat = data.get('latitude')
    lon = data.get('longitude')
    district = None
    full_address = None
    # Reverse geocode using OpenStreetMap Nominatim
    try:
        url = 'https://nominatim.openstreetmap.org/reverse'
        params = {
            'lat': lat,
            'lon': lon,
            'format': 'json',
            'zoom': 10,
            'addressdetails': 1
        }
        headers = {'User-Agent': 'HnSApp/1.0'}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data_json = resp.json()
            address = data_json.get('address', {})
            district = address.get('district') or address.get('county') or address.get('state_district')
            full_address = data_json.get('display_name')
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
    print(f"Received geolocation: latitude={lat}, longitude={lon}, district={district}, address={full_address}")
    # Store latest
    global latest_geolocation
    latest_geolocation = {'latitude': lat, 'longitude': lon, 'district': district, 'full_address': full_address}
    return jsonify({
        'status': 'success',
        'message': 'Coordinates and location received',
        'received': {'latitude': lat, 'longitude': lon, 'district': district, 'full_address': full_address}
    }), 200

# ---------------------------------------------------------------------GEO LOCATION admin dashboard-----------------------------------------------------------------------

# Security audit endpoint for admins
@app.route('/api/admin/security-audit', methods=['GET'])
@admin_only
def get_security_audit():
    """Get recent security events for admin review"""
    try:
        # Read the last 100 lines from security.log
        log_file = 'security.log'
        if not os.path.exists(log_file):
            return jsonify({'events': [], 'message': 'No security log found'})
        
        with open(log_file, 'r') as f:
            lines = f.readlines()
            # Get last 100 lines
            recent_lines = lines[-100:] if len(lines) > 100 else lines
        
        events = []
        for line in recent_lines:
            if line.strip():
                # Parse log line (basic parsing)
                parts = line.split(' - ')
                if len(parts) >= 4:
                    events.append({
                        'timestamp': parts[0],
                        'logger': parts[1],
                        'level': parts[2],
                        'message': ' - '.join(parts[3:]).strip()
                    })
        
        return jsonify({
            'events': events,
            'total_events': len(events)
        })
    except Exception as e:
        security_logger.error(f"Error reading security audit: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/latest-geolocation', methods=['GET'])
@admin_only
def get_latest_geolocation():
    global latest_geolocation
    # If latest_geolocation is not set, return a default empty response
    try:
        return jsonify(latest_geolocation)
    except Exception:
        return jsonify({'latitude': None, 'longitude': None, 'district': None, 'full_address': None})
    

# ------------------------------------------------------- AI Blog Summarization -------------------------------------------------- ---

@app.route('/api/blogs/<slug>/summary', methods=['GET'])
@clerk_required(optional=True)
def summarize_blog(slug):
    api_key = os.getenv('PERPLEXITY_API_KEY')
    blog = Blog.query.filter_by(slug=slug).first()
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404

    # If no API key, return a simple summary
    if not api_key:
        content_parts = []
        if blog.title:
            content_parts.append(blog.title)
        if blog.intro_paragraph:
            content_parts.append(blog.intro_paragraph)
        
        # Create a simple summary from the first 200 characters
        content = '\n'.join([str(part) for part in content_parts if part])
        simple_summary = content[:200] + "..." if len(content) > 200 else content
        return jsonify({'summary': simple_summary})

    content_parts = []
    if blog.title:
        content_parts.append(blog.title)
    if blog.intro_paragraph:
        content_parts.append(blog.intro_paragraph)
    if blog.subheading1:
        content_parts.append(blog.subheading1)
    if blog.content1:
        content_parts.append(blog.content1)
    if blog.subheading2:
        content_parts.append(blog.subheading2)
    if blog.content2:
        content_parts.append(blog.content2)
    if blog.subheading3:
        content_parts.append(blog.subheading3)
    if blog.content3:
        content_parts.append(blog.content3)

    content = '\n'.join([str(part) for part in content_parts if part])
    prompt = f"Summarize the following real estate blog for a user in 3-5 sentences.\n\n{content}"
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "sonar",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.2
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=20)
        response.raise_for_status()
        summary = response.json()['choices'][0]['message']['content'].strip()
        return jsonify({'summary': summary})
    except Exception as e:
        # Fallback to simple summary if API fails
        simple_summary = content[:200] + "..." if len(content) > 200 else content
        return jsonify({'summary': simple_summary})


# ------------------------------------------------------- Property Search API -------------------------------------------------- ---


# ---- Helpers for amenities/status normalization and society type derivation ----
def _normalize_amenities(value):
    try:
        if not value:
            return []
        # Accept JSON list or plain string
        if isinstance(value, list):
            raw = value
        elif isinstance(value, str):
            try:
                parsed = json.loads(value)
                raw = parsed if isinstance(parsed, list) else [str(parsed)]
            except Exception:
                raw = [value]
        else:
            raw = [str(value)]

        result = []
        for item in raw:
            if not item:
                continue
            text = str(item)
            # Split only on commas or explicit conjunctions that usually combine two amenities in one index
            # Avoid splitting multi-word amenities like "kids play area"
            parts = []
            for part in re.split(r",|\sand\s|\s&\s|/", text, flags=re.IGNORECASE):
                part = part.strip().strip('-').strip()
                if part:
                    parts.append(part)
            for p in parts:
                normalized = p.lower()
                # Canonical mappings with synonym grouping
                canonical = {
                    # Security-related (kept for completeness though society types come from Property.Security)
                    'cctv security': 'cctv',
                    'cctv': 'cctv',
                    'security': 'security',
                    'manned security': 'security',
                    'multi-tier security': 'security',
                    'access control': 'security',

                    # Club/Gym
                    'club house': 'clubhouse',
                    'clubhouse': 'clubhouse',
                    'gymnasium': 'gym',
                    'gym': 'gym',

                    # Kids area
                    'kids play area': 'kids play area',
                    'children play area': 'kids play area',

                    # Pools (group variants under swimming pool)
                    'swimming pool': 'swimming pool',
                    'pool': 'swimming pool',
                    'podium pool': 'swimming pool',
                    'rooftop pool': 'swimming pool',

                    # Amphitheatre
                    'amphitheatre': 'amphitheatre',
                    'open-air amphitheatre': 'amphitheatre',

                    # Sky amenities
                    'sky deck': 'sky deck',
                    'sky park': 'sky deck',

                    # Party spaces
                    'party hall': 'party hall',
                    'party lawn': 'party hall',

                    # Courts and tracks
                    'jogging track': 'jogging track',
                    'tennis court': 'tennis court',
                    'badminton court': 'badminton court',
                    'basketball court': 'basketball court',

                    # Other amenities
                    'indoor games': 'indoor games',
                    'library': 'library',
                    'yoga room': 'yoga room',
                    'spa': 'spa',
                    'sauna': 'sauna',
                    'multipurpose hall': 'multipurpose hall',
                    'landscaped garden': 'landscaped garden',
                    'gated community': 'gated community',
                    'intercom': 'intercom',
                    'power backup': 'power backup',
                    'lift': 'lift',
                    'elevator': 'lift',
                    'parking': 'covered parking',
                    'covered parking': 'covered parking',
                    'mini-golf': 'mini golf',
                }.get(normalized, normalized)
                result.append(canonical)
        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for x in result:
            if x and x not in seen:
                seen.add(x)
                deduped.append(x)
        return deduped
    except Exception:
        return []

def _derive_society_types(amenities_list):
    items = [a.lower() for a in amenities_list or []]
    derived = set()
    if any(x in items for x in ['gated community', 'access control']):
        derived.add('Gated')
    if any(x in items for x in ['security', 'cctv']):
        derived.add('Advanced Security')
    if any(x in items for x in ['clubhouse', 'community hall', 'multipurpose hall']):
        derived.add('Lounge')
    if any(x in items for x in ['senior citizen area']):
        derived.add('Senior Citizen')
    return sorted(list(derived))

def _normalize_security_types(value):
    try:
        if not value:
            return []
        # Accept list or string
        if isinstance(value, list):
            raw = value
        else:
            raw = [value]
        tokens = []
        for item in raw:
            if not item:
                continue
            text = str(item)
            parts = re.split(r",|\sand\s|\s&\s|/", text, flags=re.IGNORECASE)
            for p in parts:
                p = p.strip().strip('-').strip()
                if p:
                    tokens.append(p)
        # Canonical minimal mapping while preserving descriptive labels
        mapped = []
        for t in tokens:
            low = t.lower()
            canonical = {
                'cctv security': 'CCTV',
                'cctv': 'CCTV',
                'manned security': 'Manned Security',
                'multi-tier security': 'Advanced Security',
                'access control': 'Access Control',
                'gated community': 'Gated',
                'security': 'Advanced Security',
            }.get(low, t.title())
            mapped.append(canonical)
        # Dedupe preserving order
        seen = set()
        result = []
        for x in mapped:
            if x and x not in seen:
                seen.add(x)
                result.append(x)
        return result
    except Exception:
        return []

def _canonical_property_status(value: str) -> str:
    try:
        if not value:
            return ''
        text = str(value).strip().lower()
        # Explicit mappings first
        explicit = {
            'completed': 'Completed',
            'completed/ready': 'Completed',
            'ready to move': 'Completed',
            'ready-to-move': 'Completed',
            'ready': 'Completed',
            'ongoing': 'Ongoing',
            'mixed': 'Mixed',
            'ongoing/completed': 'Ongoing/Completed',
            'ongoing/completed (varies)': 'Ongoing/Completed',
            'ongoing/ready': 'Ongoing/Completed',
        }
        if text in explicit:
            return explicit[text]
        # Heuristics
        if 'mixed' in text:
            return 'Mixed'
        if 'ongoing' in text and ('completed' in text or 'ready' in text or 'varies' in text):
            return 'Ongoing/Completed'
        if 'ongoing' in text:
            return 'Ongoing'
        if 'ready' in text or 'completed' in text:
            return 'Completed'
        # Fallback to title case original
        return str(value).strip().title()
    except Exception:
        return ''

@app.route('/api/properties/filters', methods=['GET'])
def get_filters():
    """Return unique filter options sourced from BuilderProject and Property tables.
    Includes amenities (normalized), property_status, project status, and derived society types.
    Optional query: location= filters to projects/properties matching location.
    Public endpoint - no authentication required.
    """
    location = request.args.get('location', '', type=str)

    # Collect amenities from BuilderProject
    project_query = BuilderProject.query
    if location:
        project_query = project_query.filter(BuilderProject.location.ilike(f"%{location}%"))
    projects = project_query.all()

    amenities_all = []
    property_status_all = []
    society_types_all = []

    for prj in projects:
        amenities_all.extend(_normalize_amenities(prj.amenities))
        # property status is sourced from Property table per requirements

    # Collect from Property table for status and society types
    prop_query = Property.query
    if location:
        prop_query = prop_query.filter(Property.Location.ilike(f"%{location}%"))
    for prop in prop_query.all():
        if prop.Project_Status:
            property_status_all.append(_canonical_property_status(prop.Project_Status))
        if prop.Security:
            society_types_all.extend(_normalize_security_types(prop.Security))

    # Build unique, nicely-cased amenities list
    amen_set = []
    seen = set()
    for a in sorted(set(amenities_all)):
        label = a.title() if a.isalpha() or ' ' in a else a
        if label not in seen:
            seen.add(label)
            amen_set.append(label)

    # Society types come from Property.Security
    society_types = sorted(set([s for s in society_types_all if s]))

    return jsonify({
        'amenities': amen_set,
        'propertyStatus': sorted(set([s for s in property_status_all if s])),
        'societyTypes': society_types,
    })

# Simplified property search endpoint: direct filtering only
@app.route('/api/properties/search', methods=['GET'])
def search_properties():
    location = request.args.get('location', '', type=str)
    price = request.args.get('price', 0, type=float)  # price in Cr
    bhk_types = request.args.getlist('type')  # e.g., ['1BHK', '2BHK']
    amenities_filter = [a.lower().strip() for a in request.args.getlist('amenities') if a]
    property_status_filter = [s.lower().strip() for s in request.args.getlist('property_status') if s]
    # Canonicalize requested property status values
    property_status_filter_canonical = set(_canonical_property_status(s) for s in property_status_filter)
    society_type_filter = [t.lower().strip() for t in request.args.getlist('society_type') if t]

    query = Property.query

    # ---- LOCATION FILTER ----
    if location:
        query = query.filter(Property.Location.ilike(f"%{location}%"))

    # Fetch all rows first (filtered by location)
    results = query.all()

    # ---- PRICE FILTER ----
    if price and price > 0:
        def price_matches(prop, max_price_cr):
            val = getattr(prop, "Price_Starting_From", "") or ""
            # Handle ranges like "70 L - 2.5 Cr" - take the starting price
            first_part = val.split('–')[0].split('-')[0].strip()
            val_clean = first_part.replace('₹','').replace(',','').replace('+','').strip().lower()
            
            try:
                # Handle "Cr" or "Crore"
                if 'cr' in val_clean or 'crore' in val_clean:
                    price_val = float(val_clean.replace('crore','').replace('cr','').strip())
                # Handle "L" or "Lakh"
                elif 'l' in val_clean or 'lakh' in val_clean:
                    price_val = float(val_clean.replace('lakh','').replace('l','').strip()) / 100  # Lakh → Cr
                else:
                    price_val = float(val_clean)
                return price_val <= max_price_cr
            except Exception:
                return False

        results = [p for p in results if price_matches(p, price)]

    # ---- BHK FILTER ----
    if bhk_types and any(bhk_types):
        def matches_bhk_type(prop):
            try:
                configs = json.loads(prop.Existing_Configurations) if prop.Existing_Configurations else []
                
                # Handle both formats:
                # 1. Simple array format: ["2", "3"] 
                # 2. Object format: [{"type": "2BHK"}, {"type": "3BHK"}]
                
                if isinstance(configs, list) and len(configs) > 0:
                    if isinstance(configs[0], dict):
                        # Object format: [{"type": "2BHK"}, {"type": "3BHK"}]
                        types = [c.get('type','').lower() for c in configs if isinstance(c, dict) and 'type' in c]
                    else:
                        # Simple array format: ["2", "3"]
                        types = [str(c).lower() for c in configs if c]
                    
                    # Check if any of the requested BHK types match
                    requested_types = [bt.lower().replace('bhk', '').strip() for bt in bhk_types]
                    return any(any(req_type in t for req_type in requested_types) for t in types)
                
                return False
            except Exception as e:
                print(f"Error parsing BHK configs: {e}")
                return False

        results = [p for p in results if matches_bhk_type(p)]

    # ---- AMENITIES / PROPERTY STATUS / SOCIETY TYPE FILTERS ----
    if amenities_filter or property_status_filter or society_type_filter:
        def get_matching_project(prop):
            # Prefer explicit relationship, else best-effort match by builder and title
            if prop.project_id:
                return BuilderProject.query.get(prop.project_id)
            if prop.Property_Name and prop.Builder_Name:
                return BuilderProject.query.filter_by(
                    title=prop.Property_Name.strip(),
                    builder_name=prop.Builder_Name.strip()
                ).first()
            return None

        def matches_extra_filters(prop):
            prj = get_matching_project(prop)
            prj_amenities = _normalize_amenities(prj.amenities) if prj else []
            # Property Status must be from Property.Project_Status
            # Canonicalize property status value for comparison
            prop_status_value = _canonical_property_status(prop.Project_Status) if prop.Project_Status else None

            # Amenities: require all requested to be present (subset)
            if amenities_filter:
                prj_amen_lower = set([a.lower() for a in prj_amenities])
                if not all(a in prj_amen_lower for a in amenities_filter):
                    return False

            # Property status: match against Property.Project_Status only
            if property_status_filter_canonical:
                if (prop_status_value or '') not in property_status_filter_canonical:
                    return False

            # Society type derived from Property.Security values
            if society_type_filter:
                derived = _normalize_security_types(prop.Security)
                derived_lower = set([d.lower() for d in derived])
                if not all(t in derived_lower for t in society_type_filter):
                    return False

            return True

        results = [p for p in results if matches_extra_filters(p)]

    # Return JSON
    return jsonify([p.to_dict() for p in results])



@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")  # Set your actual Google Client ID here

@app.route('/api/auth/google-signin', methods=['POST'])
def google_signin():
    data = request.json
    id_token = data.get('id_token')
    if not id_token:
        return jsonify({'error': 'Missing id_token'}), 400

    # Verify id_token with Google
    resp = requests.get(
        f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    )
    if resp.status_code != 200:
        return jsonify({'error': 'Invalid Google token'}), 401
    info = resp.json()

    # Client ID check - SECURITY (always verify this)
    if info.get('aud') != GOOGLE_CLIENT_ID:
        return jsonify({'error': 'Invalid Google client ID'}), 401

    # User info from Google response
    email = info.get('email')
    username = info.get('name', email)

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            username=username,
            email=email,
            password='',  # No password needed for Google users
            role='customer',
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
    
    access_token = create_access_token(identity={'username': user.username, 'role': user.role, 'user_id': user.id, 'email': user.email})
    refresh_token = create_refresh_token(identity={'username': user.username, 'role': user.role, 'user_id': user.id, 'email': user.email})

    response = jsonify({'message': 'Login successful', 'user': user.to_dict()})
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response, 200

# ------------------------------------------------------- Favorites & Merge -------------------------------------------------- ---

def _safe_json_list(raw):
    try:
        if not raw:
            return []
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []

def _get_or_create_guest_cart_session(guest_id):
    session_row = Favorite.query.filter_by(guest_id=guest_id, property_id=None).first()
    if not session_row:
        legacy_favs = Favorite.query.filter_by(guest_id=guest_id).filter(Favorite.property_id.isnot(None)).all()
        legacy_ids = []
        for fav in legacy_favs:
            if fav.property_id is not None and fav.property_id not in legacy_ids:
                legacy_ids.append(fav.property_id)
        session_row = Favorite(
            guest_id=guest_id,
            property_id=None,
            cart_snapshot=json.dumps(legacy_ids),
            change_log=json.dumps([])
        )
        db.session.add(session_row)
        for fav in legacy_favs:
            db.session.delete(fav)
    return session_row

def _get_or_create_user_cart_session(user_id):
    session_row = Favorite.query.filter_by(user_id=user_id, property_id=None).first()
    if not session_row:
        legacy_favs = Favorite.query.filter_by(user_id=user_id).filter(Favorite.property_id.isnot(None)).all()
        legacy_ids = []
        for fav in legacy_favs:
            if fav.property_id is not None and fav.property_id not in legacy_ids:
                legacy_ids.append(fav.property_id)
        session_row = Favorite(
            user_id=user_id,
            guest_id=None,
            property_id=None,
            cart_snapshot=json.dumps(legacy_ids),
            change_log=json.dumps([])
        )
        db.session.add(session_row)
        for fav in legacy_favs:
            db.session.delete(fav)
    return session_row

def _append_cart_change(session_row, action, property_id):
    changes = _safe_json_list(session_row.change_log)
    changes.append({
        'action': action,
        'property_id': property_id,
        'at': datetime.utcnow().isoformat()
    })
    session_row.change_log = json.dumps(changes)

@app.route('/api/favorites', methods=['POST'])
@clerk_required(optional=True)
def add_favorite():
    data = request.json or {}
    property_id = data.get('property_id')
    # Accept guest id from body or header to support anonymous favorites
    guest_id = data.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')

    if not property_id:
        return jsonify({'error': 'property_id is required'}), 400
    try:
        property_id = int(property_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'property_id must be an integer'}), 400

    if g.current_user:
        session_row = _get_or_create_user_cart_session(g.current_user.id)
        cart_snapshot = _safe_json_list(session_row.cart_snapshot)
        if property_id in cart_snapshot:
            return jsonify({'message': 'Already in user cart', 'session': session_row.to_dict()}), 200

        cart_snapshot.append(property_id)
        session_row.cart_snapshot = json.dumps(cart_snapshot)
        _append_cart_change(session_row, 'add', property_id)
        db.session.commit()
        return jsonify({'message': 'User cart updated', 'session': session_row.to_dict()}), 200

    if not guest_id:
        return jsonify({'error': 'Authentication or guest_id required'}), 401

    session_row = _get_or_create_guest_cart_session(guest_id)
    cart_snapshot = _safe_json_list(session_row.cart_snapshot)
    if property_id in cart_snapshot:
        return jsonify({'message': 'Already in guest cart', 'session': session_row.to_dict()}), 200

    cart_snapshot.append(property_id)
    session_row.cart_snapshot = json.dumps(cart_snapshot)
    _append_cart_change(session_row, 'add', property_id)
    db.session.commit()
    return jsonify({'message': 'Guest cart updated', 'session': session_row.to_dict()}), 200

@app.route('/api/favorites', methods=['GET'])
@clerk_required(optional=True)
def get_favorites():
    guest_id = request.args.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')
    
    if g.current_user:
        session_row = _get_or_create_user_cart_session(g.current_user.id)
        return jsonify([session_row.to_dict()] if session_row else [])
    if guest_id:
        session_row = Favorite.query.filter_by(guest_id=guest_id, property_id=None).first()
        return jsonify([session_row.to_dict()] if session_row else [])
    return jsonify({'favorites': []}), 200


@app.route('/api/favorites', methods=['DELETE'])
@clerk_required(optional=True)
def remove_favorite():
    data = request.json or {}
    property_id = data.get('property_id') or request.args.get('property_id')
    guest_id = data.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')

    if not property_id:
        return jsonify({'error': 'property_id is required'}), 400
    try:
        property_id = int(property_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'property_id must be an integer'}), 400

    if g.current_user:
        session_row = _get_or_create_user_cart_session(g.current_user.id)

        cart_snapshot = _safe_json_list(session_row.cart_snapshot)
        if property_id not in cart_snapshot:
            return jsonify({'message': 'Property not in user cart (noop)', 'session': session_row.to_dict()}), 200

        cart_snapshot = [pid for pid in cart_snapshot if pid != property_id]
        session_row.cart_snapshot = json.dumps(cart_snapshot)
        _append_cart_change(session_row, 'remove', property_id)
        db.session.commit()
        return jsonify({'message': 'User cart updated', 'session': session_row.to_dict()}), 200
    elif guest_id:
        session_row = Favorite.query.filter_by(guest_id=guest_id, property_id=None).first()
        if not session_row:
            return jsonify({'message': 'Guest cart not found (noop)'}), 200

        cart_snapshot = _safe_json_list(session_row.cart_snapshot)
        if property_id not in cart_snapshot:
            return jsonify({'message': 'Property not in guest cart (noop)', 'session': session_row.to_dict()}), 200

        cart_snapshot = [pid for pid in cart_snapshot if pid != property_id]
        session_row.cart_snapshot = json.dumps(cart_snapshot)
        _append_cart_change(session_row, 'remove', property_id)
        db.session.commit()
        return jsonify({'message': 'Guest cart updated', 'session': session_row.to_dict()}), 200
    else:
        return jsonify({'error': 'Authentication or guest_id required'}), 401

@app.route('/api/auth/merge-guest', methods=['POST'])
@clerk_required()
def merge_guest_data():
    data = request.json
    guest_id = (data or {}).get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')
    
    if not guest_id:
        return jsonify({'error': 'guest_id required for merge'}), 400

    user_session = Favorite.query.filter_by(user_id=g.current_user.id, property_id=None).first()

    # Merge guest session rows into user session (or promote guest session to user)
    session_rows = Favorite.query.filter_by(guest_id=guest_id, property_id=None).all()
    for session_row in session_rows:
        if user_session and user_session.id != session_row.id:
            user_cart = _safe_json_list(user_session.cart_snapshot)
            guest_cart = _safe_json_list(session_row.cart_snapshot)
            for pid in guest_cart:
                if pid not in user_cart:
                    user_cart.append(pid)
            user_session.cart_snapshot = json.dumps(user_cart)

            user_changes = _safe_json_list(user_session.change_log)
            guest_changes = _safe_json_list(session_row.change_log)
            if guest_changes:
                user_session.change_log = json.dumps(user_changes + guest_changes)

            db.session.delete(session_row)
        else:
            session_row.user_id = g.current_user.id
            session_row.guest_id = None
            user_session = session_row

    # Promote legacy guest rows (property_id NOT NULL) to user
    legacy_guest_rows = Favorite.query.filter_by(guest_id=guest_id).filter(Favorite.property_id.isnot(None)).all()
    for fav in legacy_guest_rows:
        existing = Favorite.query.filter_by(user_id=g.current_user.id, property_id=fav.property_id).first()
        if existing:
            db.session.delete(fav)
        else:
            fav.user_id = g.current_user.id
            fav.guest_id = None
    
    # Update interactions
    # This is best-effort: your DB schema may not have `user_interaction.guest_id`
    # (migration drift), which would otherwise cause a 500 and break the entire merge.
    db.session.commit()
    try:
        UserInteraction.query.filter_by(guest_id=guest_id).update({
            'user_id': g.current_user.id,
            'guest_id': None
        })
        db.session.commit()
    except Exception as ie:
        db.session.rollback()
        print(f"Interaction merge error (best-effort): {ie}")
    
    return jsonify({'message': 'Data merged successfully'}), 200



#... existing imports...
from models import ChatSession, ChatMessage, UserPreference
from chatbot.routes import chatbot_bp

# Register the Blueprintcd..
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

# Note: The db.create_all() inside your existing main block will 
# automatically create the new chatbot tables because we imported them above.


@app.route('/api/graph', methods=['GET'])
def get_graph():
    try:
        builders = Builder.query.all()
        projects = BuilderProject.query.all()
        properties = Property.query.all()

        nodes = []
        links = []   # ✅ use links (not edges)
        node_ids = set()

        # -------------------------
        # BUILDERS
        # -------------------------
        for builder in builders:
            node_id = f"builder_{builder.rera_id}"

            if node_id not in node_ids:
                nodes.append({
                    "id": node_id,
                    "type": "builder",
                    "label": builder.company_name or "Unknown Builder"
                })
                node_ids.add(node_id)

        # -------------------------
        # PROJECTS
        # -------------------------
        for project in projects:
            project_node_id = f"project_{project.id}"

            if project_node_id not in node_ids:
                nodes.append({
                    "id": project_node_id,
                    "type": "project",
                    "label": project.title or "Unnamed Project"
                })
                node_ids.add(project_node_id)

            if project.builder_id:
                builder_node_id = f"builder_{project.builder_id}"

                if builder_node_id in node_ids:
                    links.append({
                        "source": builder_node_id,
                        "target": project_node_id,
                        "type": "BUILDS"
                    })

        # -------------------------
        # PROPERTIES
        # -------------------------
        for prop in properties:
            property_node_id = f"property_{prop.id}"

            if property_node_id not in node_ids:
                nodes.append({
                    "id": property_node_id,
                    "type": "property",
                    "label": prop.Property_Name or "Unnamed Property"
                })
                node_ids.add(property_node_id)

            if prop.project_id:
                project_node_id = f"project_{prop.project_id}"

                if project_node_id in node_ids:
                    links.append({
                        "source": project_node_id,
                        "target": property_node_id,
                        "type": "CONTAINS"
                    })

        return jsonify({
            "nodes": nodes,
            "links": links   # ✅ THIS IS THE FIX
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500



@app.route('/graph-view')
def graph_view():
    return """
    <html>
    <head>
        <title>AI Smart Graph</title>
        <script src="https://unpkg.com/force-graph"></script>
        <style>
            body { margin: 0; font-family: Arial; }
            #graph { width: 100vw; height: 100vh; }

            #controls {
                position: absolute;
                top: 10px;
                left: 10px;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                z-index: 10;
            }

            input {
                padding: 5px;
                margin-bottom: 5px;
                width: 200px;
            }

            button {
                margin: 2px;
                padding: 5px 10px;
                cursor: pointer;
            }
        </style>
    </head>
    <body>

        <div id="controls">
            <input id="search" placeholder="Search node..." />
            <br/>
            <button onclick="filterType('all')">All</button>
            <button onclick="filterType('builder')">Builders</button>
            <button onclick="filterType('project')">Projects</button>
            <button onclick="filterType('property')">Properties</button>
        </div>

        <div id="graph"></div>

        <script>
            let fullData = null;
            let Graph = null;

            fetch('/api/graph')
                .then(res => res.json())
                .then(data => {
                    fullData = data;

                    Graph = ForceGraph()(document.getElementById('graph'))
                        .graphData(data)

                        .nodeAutoColorBy('type')

                        .nodeLabel(n => `${n.type} → ${n.label}`)

                        .nodeCanvasObject((node, ctx, scale) => {
                            const label = node.label;
                            const fontSize = 12 / scale;
                            ctx.font = `${fontSize}px Sans-Serif`;

                            ctx.fillStyle = node.color;
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
                            ctx.fill();

                            ctx.fillStyle = "black";
                            ctx.fillText(label, node.x + 6, node.y + 3);
                        })

                        // 🔥 AI CLICK BEHAVIOR
                        .onNodeClick(node => {
                            highlightNeighbors(node);
                            focusNode(node);
                        })

                        .d3Force('charge').strength(-120)
                        .d3Force('link').distance(80);
                });

            // =========================
            // 🧠 HIGHLIGHT LOGIC (AI)
            // =========================
            function highlightNeighbors(node) {
                const neighbors = new Set();
                const links = fullData.links;

                links.forEach(link => {
                    if (link.source.id === node.id) {
                        neighbors.add(link.target.id);
                    }
                    if (link.target.id === node.id) {
                        neighbors.add(link.source.id);
                    }
                });

                Graph.nodeColor(n => {
                    if (n.id === node.id) return 'red';
                    if (neighbors.has(n.id)) return 'orange';
                    return '#ccc';
                });

                Graph.linkColor(l => {
                    if (l.source.id === node.id || l.target.id === node.id) {
                        return 'red';
                    }
                    return '#ddd';
                });
            }

            // =========================
            // 🎯 FOCUS NODE
            // =========================
            function focusNode(node) {
                Graph.centerAt(node.x, node.y, 1000);
                Graph.zoom(4, 1000);
            }

            // =========================
            // 🔍 SEARCH
            // =========================
            document.getElementById('search').addEventListener('input', function(e) {
                const value = e.target.value.toLowerCase();

                const node = fullData.nodes.find(n =>
                    n.label.toLowerCase().includes(value)
                );

                if (node) {
                    highlightNeighbors(node);
                    focusNode(node);
                }
            });

            // =========================
            // 🎛 FILTER
            // =========================
            function filterType(type) {
                if (type === 'all') {
                    Graph.graphData(fullData);
                    return;
                }

                const filteredNodes = fullData.nodes.filter(n => n.type === type);
                const ids = new Set(filteredNodes.map(n => n.id));

                const filteredLinks = fullData.links.filter(l =>
                    ids.has(l.source.id || l.source) &&
                    ids.has(l.target.id || l.target)
                );

                Graph.graphData({
                    nodes: filteredNodes,
                    links: filteredLinks
                });
            }
        </script>

    </body>
    </html>
    """
# ------------------------------------------------------------------ Admin Auth
@app.route('/api/auth/me', methods=['GET'])
@clerk_required()
def get_current_user_profile():
    """
    Returns the current authenticated user's profile from the local DB.
    Used by the frontend AdminRoute to verify if the user has admin role.
    The role comes from the database — not from email or client-side logic.
    """
    user = g.current_user
    return jsonify({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'role': user.role,
        'is_active': user.is_active,
    }), 200


@app.route('/api/auth/promote-admin', methods=['POST'])
def promote_to_admin():
    """
    Admin promotion - works with local auth or Clerk
    Checks database first, then uses Clerk if available
    """
    data = request.json or {}
    email = data.get('email', '')
    password = data.get('password', '')
    
    # Check if user is authenticated via local auth (from clerk_required decorator)
    if hasattr(g, 'current_user') and g.current_user:
        # User is authenticated, check if they're admin@gmail.com
        if g.current_user.email != 'admin@gmail.com':
            return jsonify({'error': 'Unauthorized email for admin access.'}), 403
        
        # Check password
        if not g.current_user.check_password(password):
            return jsonify({'error': 'Invalid admin password.'}), 401
        
        # Promote role
        g.current_user.role = 'admin'
        db.session.commit()
        return jsonify({'message': 'Admin access verified.', 'role': g.current_user.role}), 200
    
    # No authentication - check credentials directly
    from models import User
    admin_user = User.query.filter_by(email=email).first()
    if not admin_user or not admin_user.check_password(password):
        return jsonify({'error': 'Invalid admin credentials.'}), 401
    
    if email != 'admin@gmail.com':
        return jsonify({'error': 'Unauthorized email for admin access.'}), 403

    # Promote role
    admin_user.role = 'admin'
    db.session.commit()
    return jsonify({'message': 'Admin access granted.', 'role': admin_user.role}), 200


@app.route('/admin_login.html')
def serve_admin_login():
    """Serve the admin login HTML page"""
    return send_from_directory('.', 'admin_login.html')


if __name__ == '__main__':
    app.run(debug=True)

