import re
from sqlalchemy.orm import joinedload, selectinload
from flask import Blueprint, jsonify, request
from backend.db import db
from backend.models import (
    Category, Destination, Service, FAQ, JourneyIdea,
    SiteSetting, Story, Enquiry, NewsletterSubscriber, destination_categories
)

api_bp = Blueprint('api', __name__, url_prefix='/api')

PUBLIC_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300'

# Common destination slug aliases for backward-compatibility & seamless routing
SLUG_ALIASES = {
    'nellaiyappar': 'nellaiyappar-temple',
    'nellaiyappar-kovil': 'nellaiyappar-temple',
    'nellaiyappar-kovil2': 'nellaiyappar-temple',
    'thirumalai': 'thirumalai-kovil',
    'kutralam': 'courtallam',
    'nilgiris': 'ooty-nilgiris',
    'ooty': 'ooty-nilgiris',
    'kodai': 'kodaikanal',
    'kochi': 'kochi-alappuzha',
    'alappuzha': 'kochi-alappuzha',
    'alleppey': 'kochi-alappuzha',
    'wonderla': 'wonderla-kochi',
    'wonderla-group-escapes': 'wonderla-kochi',
    'kerala-arts': 'kerala-arts-and-science',
    'kerala-arts-science': 'kerala-arts-and-science',
    'kerala-arts-crafts-village': 'kerala-arts-and-science',
    'koodankulam': 'koodankulam-nuclear-plant',
    'koodangulam': 'koodankulam-nuclear-plant',
    'koodankulam-nuclear-power-plant': 'koodankulam-nuclear-plant',
}

@api_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.filter_by(is_active=True).order_by(Category.display_order.asc()).all()
    resp = jsonify([cat.to_dict() for cat in categories])
    resp.headers['Cache-Control'] = PUBLIC_CACHE_CONTROL
    return resp

@api_bp.route('/destinations', methods=['GET'])
def get_destinations():
    category_slug = request.args.get('category', '').strip().lower()
    
    base_query = Destination.query.options(
        joinedload(Destination.category),
        selectinload(Destination.secondary_categories)
    ).filter_by(is_published=True)
    
    if category_slug and category_slug != 'all':
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            # Match destinations that belong to this category via either:
            # (a) the primary category_id FK, or
            # (b) the many-to-many destination_categories join table
            m2m_dest_ids = (
                db.session.query(destination_categories.c.destination_id)
                .filter(destination_categories.c.category_id == category.id)
                .subquery()
            )
            base_query = base_query.filter(
                (Destination.category_id == category.id) |
                (Destination.id.in_(m2m_dest_ids))
            )
        elif category_slug == 'college-educational':
            base_query = base_query.filter_by(is_educational=True)
        else:
            # Fallback for matching title/slug tags
            base_query = base_query.filter(
                (Destination.tag.ilike(f"%{category_slug}%")) |
                (Destination.location.ilike(f"%{category_slug}%"))
            )
            
    destinations = base_query.order_by(Destination.display_order.asc(), Destination.id.asc()).all()
    # Deduplicate in case a destination matched both FK and M2M (shouldn't happen but safety net)
    seen = set()
    unique = []
    for d in destinations:
        if d.id not in seen:
            seen.add(d.id)
            unique.append(d)
    resp = jsonify([d.to_summary_dict() for d in unique])
    resp.headers['Cache-Control'] = PUBLIC_CACHE_CONTROL
    return resp

@api_bp.route('/destinations/<slug>', methods=['GET'])
def get_destination(slug):
    clean_slug = slug.strip().lower()
    target_slug = SLUG_ALIASES.get(clean_slug, clean_slug)
    
    # 1. Check exact slug or alias slug
    dest = Destination.query.options(
        joinedload(Destination.category),
        selectinload(Destination.gallery),
        selectinload(Destination.highlights),
        selectinload(Destination.experiences)
    ).filter(
        (Destination.slug == clean_slug) | (Destination.slug == target_slug)
    ).first()
    
    # 2. Check previous_slugs history (comma-separated list)
    if not dest:
        dest = Destination.query.options(
            joinedload(Destination.category),
            selectinload(Destination.gallery),
            selectinload(Destination.highlights),
            selectinload(Destination.experiences)
        ).filter(
            (Destination.previous_slugs.like(f"%{clean_slug}%")) |
            (Destination.previous_slugs.like(f"%{target_slug}%"))
        ).first()
    
    # 3. Try finding by ID if integer passed
    if not dest and clean_slug.isdigit():
        dest = Destination.query.options(
            joinedload(Destination.category),
            selectinload(Destination.gallery),
            selectinload(Destination.highlights),
            selectinload(Destination.experiences)
        ).get(int(clean_slug))
            
    if not dest or not dest.is_published:
        return jsonify({'error': f"Destination '{slug}' not found"}), 404
        
    return jsonify(dest.to_dict(include_details=True))

@api_bp.route('/journey-ideas', methods=['GET'])
def get_journey_ideas():
    """
    Returns ONLY the curated destinations that are explicitly registered in the
    journey_ideas table. Newly created destinations do NOT appear on the homepage
    unless the admin specifically assigns them here.
    """
    ideas = (
        JourneyIdea.query
        .filter_by(is_active=True)
        .join(Destination)
        .filter(Destination.is_published == True)
        .order_by(JourneyIdea.display_order.asc(), JourneyIdea.id.asc())
        .all()
    )
    
    results = [idea.to_dict() for idea in ideas if idea.to_dict() is not None]
    return jsonify(results)

@api_bp.route('/services', methods=['GET'])
def get_services():
    services = Service.query.filter_by(is_active=True).order_by(Service.display_order.asc(), Service.id.asc()).all()
    return jsonify([s.to_dict() for s in services])

@api_bp.route('/faqs', methods=['GET'])
def get_faqs():
    faqs = FAQ.query.filter_by(is_published=True).order_by(FAQ.display_order.asc(), FAQ.id.asc()).all()
    return jsonify([f.to_dict() for f in faqs])

@api_bp.route('/stories', methods=['GET'])
def get_stories():
    stories = Story.query.filter_by(is_published=True).order_by(Story.display_order.asc(), Story.id.asc()).all()
    return jsonify([s.to_dict() for s in stories])

@api_bp.route('/stories/<slug>', methods=['GET'])
def get_story(slug):
    story = Story.query.filter_by(slug=slug.strip().lower(), is_published=True).first()
    if not story:
        return jsonify({'error': f"Story '{slug}' not found"}), 404
    return jsonify(story.to_dict())

@api_bp.route('/site-settings', methods=['GET'])
def get_site_settings():
    settings = SiteSetting.query.all()
    resp = jsonify({s.setting_key: s.setting_value for s in settings})
    resp.headers['Cache-Control'] = PUBLIC_CACHE_CONTROL
    return resp

@api_bp.route('/enquiries', methods=['POST'])
def submit_enquiry():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    
    if not data:
        return jsonify({'error': 'Invalid request payload.'}), 400
        
    full_name = (data.get('fullName') or data.get('full_name') or data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or '').strip()
    
    # STRICT BACKEND ENFORCEMENT: Phone number is mandatory for all enquiry forms
    if not phone:
        return jsonify({'error': 'Phone number is required.'}), 422
        
    if not full_name:
        return jsonify({'error': 'Full name is required.'}), 422
        
    if not email:
        return jsonify({'error': 'Email address is required.'}), 422
        
    enquiry_type = data.get('type', 'journey_request')
    if enquiry_type not in ['journey_request', 'contact_message', 'college_iv']:
        enquiry_type = 'journey_request'
        
    destination = data.get('destination', '')
    travellers = data.get('travelers') or data.get('travellers', '')
    timeframe = data.get('timeframe', '')
    themes = data.get('themes')
    if isinstance(themes, list):
        themes = ", ".join(themes)
    elif not themes:
        themes = ''
        
    notes = data.get('notes') or data.get('message', '')
    
    enquiry = Enquiry(
        type=enquiry_type,
        full_name=full_name,
        email=email,
        phone=phone,
        destination=destination,
        travellers=travellers,
        timeframe=timeframe,
        themes=themes,
        notes=notes,
        status='new'
    )
    
    db.session.add(enquiry)
    db.session.commit()
    
    # Trigger Brevo Transactional Emails (Customer confirmation + Admin notification)
    # Fail-safe: Form submission succeeds even if email dispatch encounters a temporary network issue
    try:
        from backend.services.email_service import (
            send_enquiry_customer_confirmation,
            send_enquiry_admin_notification
        )
        send_enquiry_customer_confirmation(enquiry)
        send_enquiry_admin_notification(enquiry)
    except Exception as email_err:
        print(f"[Email Notice] Non-fatal background email notification error: {email_err}")
    
    return jsonify({
        'success': True,
        'message': 'Your journey request has been received. Our curation desk will reach out shortly.',
        'enquiryId': enquiry.id
    }), 201

@api_bp.route('/contact', methods=['POST'])
def submit_contact():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    
    if not data:
        return jsonify({'error': 'Invalid request payload.'}), 400
        
    name = (data.get('name') or data.get('fullName') or data.get('full_name') or '').strip()
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or '').strip()
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or data.get('notes') or '').strip()
    
    # STRICT BACKEND ENFORCEMENT: Phone number is required
    if not phone:
        return jsonify({'error': 'Phone number is required.'}), 422
        
    if not name:
        return jsonify({'error': 'Full name is required.'}), 422
        
    if not email:
        return jsonify({'error': 'Email address is required.'}), 422
        
    if not message:
        return jsonify({'error': 'Message content is required.'}), 422
        
    combined_notes = f"[Subject: {subject}]\n\n{message}" if subject else message
    
    enquiry = Enquiry(
        type='contact_message',
        full_name=name,
        email=email,
        phone=phone,
        notes=combined_notes,
        status='new'
    )
    
    db.session.add(enquiry)
    db.session.commit()
    
    # Trigger Brevo Transactional Emails (Customer confirmation + Admin notification with Reply-To)
    # Fail-safe: Contact message is stored safely even if email dispatch encounters an issue
    try:
        from backend.services.email_service import (
            send_contact_customer_confirmation,
            send_contact_admin_notification
        )
        send_contact_customer_confirmation(enquiry)
        send_contact_admin_notification(enquiry)
    except Exception as email_err:
        print(f"[Email Notice] Non-fatal contact email notification error: {email_err}")
    
    return jsonify({
        'success': True,
        'message': 'Thank you for reaching out. We have received your message.',
        'enquiryId': enquiry.id
    }), 201

@api_bp.route('/newsletter', methods=['POST'])
def subscribe_newsletter():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    email = (data.get('email') or '').strip().lower()
    
    if not email or '@' not in email or '.' not in email:
        return jsonify({'error': 'Please enter a valid email address.'}), 422
        
    existing = NewsletterSubscriber.query.filter(db.func.lower(NewsletterSubscriber.email) == email).first()
    is_new_subscriber = False
    if not existing:
        subscriber = NewsletterSubscriber(email=email)
        db.session.add(subscriber)
        db.session.commit()
        is_new_subscriber = True
        
    # Send Brevo Welcome Email only on first/new subscription
    if is_new_subscriber:
        try:
            from backend.services.email_service import send_newsletter_welcome
            send_newsletter_welcome(email)
        except Exception as email_err:
            print(f"[Email Notice] Non-fatal newsletter welcome email error: {email_err}")
        
    return jsonify({
        'success': True,
        'message': "You're on the list. Thank you for subscribing."
    }), 200

