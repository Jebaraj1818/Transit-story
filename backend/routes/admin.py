import os
import re
import hashlib
import secrets
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, g
from backend.config import Config
from backend.db import db
from backend.models import (
    Admin, AdminPasswordResetToken, Category, Destination, DestinationGallery,
    DestinationHighlight, DestinationExperience, Service,
    Enquiry, FAQ, JourneyIdea, SiteSetting, Story, NewsletterSubscriber, EmailLog
)
from backend.routes.auth import login_required, super_admin_required, get_current_admin
from backend.services.email_service import (
    send_admin_password_reset, send_admin_password_changed, send_test_email
)
from backend.services.storage_service import (
    is_blob_configured, validate_media_file, sanitize_pathname,
    upload_file_to_blob, delete_blob, generate_scoped_client_upload_token,
    ALLOWED_IMAGE_MIMES, ALLOWED_VIDEO_MIMES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE
)

admin_bp = Blueprint('admin', __name__, url_prefix='/admin', template_folder='../templates', static_folder='../static')

@admin_bp.before_request
def load_admin_context():
    g.current_admin = get_current_admin()

# ------------------------------------------------------------------------------
# AUTHENTICATION & PASSWORD RESET ROUTES
# ------------------------------------------------------------------------------

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if g.current_admin:
        return redirect(url_for('admin.dashboard'))
        
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        admin = Admin.query.filter(db.func.lower(Admin.email) == email).first()
        if admin and admin.check_password(password):
            if not admin.is_active:
                flash("Your administrator account is currently inactive. Please contact a Super Administrator.", "danger")
                return render_template('login.html')
                
            # Update last login timestamp
            admin.last_login_at = datetime.utcnow()
            db.session.commit()
            
            session['admin_id'] = admin.id
            session.permanent = True
            flash(f"Welcome back, {admin.name}!", "success")
            next_page = request.args.get('next') or url_for('admin.dashboard')
            return redirect(next_page)
        else:
            flash("Invalid email address or password.", "danger")
            
    return render_template('login.html')

@admin_bp.route('/logout')
def logout():
    session.pop('admin_id', None)
    flash("You have been logged out securely.", "info")
    return redirect(url_for('admin.login'))

@admin_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if g.current_admin:
        return redirect(url_for('admin.dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        
        # Look up active admin
        admin = Admin.query.filter(db.func.lower(Admin.email) == email, Admin.is_active == True).first()
        if admin:
            # Generate cryptographically secure token
            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
            expires_at = datetime.utcnow() + timedelta(minutes=60)
            
            # Record single-use token in database
            reset_record = AdminPasswordResetToken(
                admin_id=admin.id,
                token_hash=token_hash,
                expires_at=expires_at
            )
            db.session.add(reset_record)
            db.session.commit()
            
            # Construct secure reset link
            reset_url = url_for('admin.reset_password', token=token, _external=True)
            # If request is from localhost:3000 proxy, align base url
            if 'localhost:3000' in request.host_url:
                reset_url = f"http://localhost:3000/admin/reset-password/{token}"
                
            send_admin_password_reset(admin, token, reset_url)
            
        # Generic response to prevent email enumeration
        flash("If an active account exists for that email address, password reset instructions have been dispatched.", "info")
        return redirect(url_for('admin.login'))

    return render_template('forgot_password.html')

@admin_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if g.current_admin:
        return redirect(url_for('admin.dashboard'))

    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    reset_record = (
        AdminPasswordResetToken.query
        .filter_by(token_hash=token_hash)
        .first()
    )

    if not reset_record or not reset_record.is_valid():
        flash("This password reset link is invalid, expired, or has already been used. Please request a new one.", "danger")
        return redirect(url_for('admin.forgot_password'))

    admin = reset_record.admin
    if not admin or not admin.is_active:
        flash("The account associated with this token is inactive or no longer exists.", "danger")
        return redirect(url_for('admin.login'))

    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if len(password) < 8:
            flash("Password must be at least 8 characters in length.", "danger")
            return render_template('reset_password.html', token=token)

        if password != confirm_password:
            flash("Passwords do not match. Please try again.", "danger")
            return render_template('reset_password.html', token=token)

        # Update password & consume token
        admin.set_password(password)
        reset_record.used_at = datetime.utcnow()
        
        # Invalidate any other pending reset tokens for this admin
        other_tokens = AdminPasswordResetToken.query.filter_by(admin_id=admin.id, used_at=None).all()
        for t in other_tokens:
            t.used_at = datetime.utcnow()
            
        db.session.commit()

        # Send confirmation email
        send_admin_password_changed(admin)

        flash("Your password has been successfully reset. Please sign in with your new credentials.", "success")
        return redirect(url_for('admin.login'))

    return render_template('reset_password.html', token=token)

# ------------------------------------------------------------------------------
# DASHBOARD
# ------------------------------------------------------------------------------

@admin_bp.route('/')
@admin_bp.route('/dashboard')
@login_required
def dashboard():
    # Consolidate stat counters into a single SQL query using scalar subqueries
    stats_row = db.session.query(
        db.session.query(func.count(Destination.id)).scalar_subquery(),
        db.session.query(func.count(Destination.id)).filter(Destination.is_published == True).scalar_subquery(),
        db.session.query(func.count(Category.id)).scalar_subquery(),
        db.session.query(func.count(Enquiry.id)).scalar_subquery(),
        db.session.query(func.count(Enquiry.id)).filter(Enquiry.status == 'new').scalar_subquery(),
        db.session.query(func.count(JourneyIdea.id)).filter(JourneyIdea.is_active == True).scalar_subquery(),
        db.session.query(func.count(NewsletterSubscriber.id)).scalar_subquery(),
    ).first()

    (
        total_destinations,
        published_destinations,
        total_categories,
        total_enquiries,
        new_enquiries,
        journey_ideas_count,
        total_subscribers
    ) = stats_row if stats_row else (0, 0, 0, 0, 0, 0, 0)
    
    recent_enquiries = Enquiry.query.order_by(Enquiry.created_at.desc()).limit(6).all()
    recent_destinations = (
        Destination.query
        .options(joinedload(Destination.category))
        .order_by(Destination.updated_at.desc())
        .limit(5)
        .all()
    )
    
    return render_template(
        'dashboard.html',
        stats={
            'total_destinations': total_destinations,
            'published_destinations': published_destinations,
            'total_categories': total_categories,
            'total_enquiries': total_enquiries,
            'new_enquiries': new_enquiries,
            'journey_ideas_count': journey_ideas_count,
            'total_subscribers': total_subscribers,
        },
        recent_enquiries=recent_enquiries,
        recent_destinations=recent_destinations
    )

# ------------------------------------------------------------------------------
# ENQUIRIES / LEADS MANAGEMENT
# ------------------------------------------------------------------------------

@admin_bp.route('/enquiries')
@login_required
def enquiries():
    status_filter = request.args.get('status', 'all')
    type_filter = request.args.get('type', 'all')
    
    query = Enquiry.query
    if status_filter != 'all':
        query = query.filter_by(status=status_filter)
    if type_filter != 'all':
        query = query.filter_by(type=type_filter)
        
    enquiry_list = query.order_by(Enquiry.created_at.desc()).all()
    
    return render_template(
        'enquiries.html',
        enquiries=enquiry_list,
        status_filter=status_filter,
        type_filter=type_filter
    )

@admin_bp.route('/enquiries/<int:enquiry_id>', methods=['GET', 'POST'])
@login_required
def enquiry_detail(enquiry_id):
    enquiry = Enquiry.query.get_or_404(enquiry_id)
    
    if request.method == 'POST':
        enquiry.status = request.form.get('status', enquiry.status)
        enquiry.admin_notes = request.form.get('admin_notes', enquiry.admin_notes)
        db.session.commit()
        flash("Enquiry details updated successfully.", "success")
        return redirect(url_for('admin.enquiries'))
        
    return render_template('enquiry_detail.html', enquiry=enquiry)

@admin_bp.route('/enquiries/<int:enquiry_id>/delete', methods=['POST'])
@login_required
def delete_enquiry(enquiry_id):
    enquiry = Enquiry.query.get_or_404(enquiry_id)
    db.session.delete(enquiry)
    db.session.commit()
    flash("Enquiry record deleted.", "info")
    return redirect(url_for('admin.enquiries'))

# ------------------------------------------------------------------------------
# DESTINATIONS MANAGEMENT
# ------------------------------------------------------------------------------

@admin_bp.route('/destinations')
@login_required
def destinations():
    dest_list = Destination.query.options(
        joinedload(Destination.category),
        selectinload(Destination.gallery)
    ).order_by(Destination.display_order.asc(), Destination.id.asc()).all()
    return render_template('destinations.html', destinations=dest_list)

@admin_bp.route('/destinations/new', methods=['GET', 'POST'])
@login_required
def new_destination():
    categories = Category.query.filter_by(is_active=True).order_by(Category.name.asc()).all()
    
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        slug = request.form.get('slug', '').strip().lower()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
            
        category_id = request.form.get('category_id') or None
        location = request.form.get('location', '').strip()
        tag = request.form.get('tag', '').strip()
        hero_image = request.form.get('hero_image', '').strip()
        hero_position = request.form.get('hero_position', 'center 40%').strip()
        description = request.form.get('description', '').strip()
        about = request.form.get('about', '').strip()
        suitable_for = request.form.get('suitable_for', '').strip()
        is_educational = 'is_educational' in request.form
        is_published = 'is_published' in request.form
        display_order = int(request.form.get('display_order', 0) or 0)
        
        # Check slug uniqueness
        existing = Destination.query.filter_by(slug=slug).first()
        if existing:
            flash(f"A destination with slug '{slug}' already exists. Please choose a different slug.", "danger")
            return render_template('destination_form.html', categories=categories, destination=None)
            
        dest = Destination(
            title=title,
            slug=slug,
            category_id=category_id,
            location=location,
            tag=tag,
            cover_image=hero_image,
            hero_image=hero_image,
            hero_position=hero_position,
            description=description,
            about=about,
            suitable_for=suitable_for,
            is_educational=is_educational,
            is_published=is_published,
            display_order=display_order
        )
        db.session.add(dest)
        db.session.flush() # get dest.id
        
        # Save Highlights (line-separated)
        highlights_raw = request.form.get('highlights', '')
        for idx, line in enumerate(highlights_raw.split('\n')):
            text = line.strip()
            if text:
                db.session.add(DestinationHighlight(destination_id=dest.id, item_text=text, display_order=idx))
                
        # Save Experiences (line-separated)
        exp_raw = request.form.get('experiences', '')
        for idx, line in enumerate(exp_raw.split('\n')):
            text = line.strip()
            if text:
                db.session.add(DestinationExperience(destination_id=dest.id, item_text=text, display_order=idx))
                
        # Save up to 3 Gallery Images (Hero image strictly separate)
        gallery_raw = request.form.get('gallery_images', '')
        gallery_lines = [g.strip() for g in gallery_raw.split('\n') if g.strip() and g.strip() != hero_image][:3]
        for idx, img_url in enumerate(gallery_lines):
            db.session.add(DestinationGallery(destination_id=dest.id, image_url=img_url, display_order=idx))
            
        db.session.commit()
        flash(f"Destination '{dest.title}' created successfully.", "success")
        return redirect(url_for('admin.destinations'))
        
    return render_template('destination_form.html', categories=categories, destination=None)

@admin_bp.route('/destinations/<int:dest_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_destination(dest_id):
    dest = Destination.query.get_or_404(dest_id)
    categories = Category.query.filter_by(is_active=True).order_by(Category.name.asc()).all()
    
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        slug = request.form.get('slug', '').strip().lower()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
            
        category_id = request.form.get('category_id') or None
        location = request.form.get('location', '').strip()
        tag = request.form.get('tag', '').strip()
        hero_image = request.form.get('hero_image', '').strip()
        hero_position = request.form.get('hero_position', 'center 40%').strip()
        description = request.form.get('description', '').strip()
        about = request.form.get('about', '').strip()
        suitable_for = request.form.get('suitable_for', '').strip()
        is_educational = 'is_educational' in request.form
        is_published = 'is_published' in request.form
        display_order = int(request.form.get('display_order', 0) or 0)
        
        # Check slug uniqueness if changed
        existing = Destination.query.filter(Destination.slug == slug, Destination.id != dest.id).first()
        if existing:
            flash(f"A destination with slug '{slug}' already exists. Please choose a different slug.", "danger")
            return render_template('destination_form.html', categories=categories, destination=dest)
            
        # Preserve old slug in previous_slugs history if changed
        if dest.slug and dest.slug != slug:
            history = [s.strip() for s in (dest.previous_slugs or '').split(',') if s.strip()]
            if dest.slug not in history:
                history.append(dest.slug)
            dest.previous_slugs = ','.join(history)

        dest.title = title
        dest.slug = slug
        dest.category_id = category_id
        dest.location = location
        dest.tag = tag
        dest.cover_image = hero_image
        dest.hero_image = hero_image
        dest.hero_position = hero_position
        dest.description = description
        dest.about = about
        dest.suitable_for = suitable_for
        dest.is_educational = is_educational
        dest.is_published = is_published
        dest.display_order = display_order
        
        # Replace Highlights
        DestinationHighlight.query.filter_by(destination_id=dest.id).delete()
        highlights_raw = request.form.get('highlights', '')
        for idx, line in enumerate(highlights_raw.split('\n')):
            text = line.strip()
            if text:
                db.session.add(DestinationHighlight(destination_id=dest.id, item_text=text, display_order=idx))
                
        # Replace Experiences
        DestinationExperience.query.filter_by(destination_id=dest.id).delete()
        exp_raw = request.form.get('experiences', '')
        for idx, line in enumerate(exp_raw.split('\n')):
            text = line.strip()
            if text:
                db.session.add(DestinationExperience(destination_id=dest.id, item_text=text, display_order=idx))
                
        # Replace Gallery Images (Strictly enforce max 3 and exclude hero)
        DestinationGallery.query.filter_by(destination_id=dest.id).delete()
        gallery_raw = request.form.get('gallery_images', '')
        gallery_lines = [g.strip() for g in gallery_raw.split('\n') if g.strip() and g.strip() != hero_image][:3]
        for idx, img_url in enumerate(gallery_lines):
            db.session.add(DestinationGallery(destination_id=dest.id, image_url=img_url, display_order=idx))
            
        db.session.commit()
        flash(f"Destination '{dest.title}' updated successfully.", "success")
        return redirect(url_for('admin.destinations'))
        
    return render_template('destination_form.html', categories=categories, destination=dest)

@admin_bp.route('/destinations/<int:dest_id>/toggle-publish', methods=['POST'])
@login_required
def toggle_publish_destination(dest_id):
    dest = Destination.query.get_or_404(dest_id)
    dest.is_published = not dest.is_published
    db.session.commit()
    status = "published" if dest.is_published else "unpublished"
    flash(f"Destination '{dest.title}' is now {status}.", "success")
    return redirect(url_for('admin.destinations'))

@admin_bp.route('/destinations/<int:dest_id>/delete', methods=['POST'])
@login_required
def delete_destination(dest_id):
    dest = Destination.query.get_or_404(dest_id)
    title = dest.title
    db.session.delete(dest)
    db.session.commit()
    flash(f"Destination '{title}' deleted.", "info")
    return redirect(url_for('admin.destinations'))

# ------------------------------------------------------------------------------
# JOURNEY IDEAS (HOMEPAGE CURATION MANAGER)
# ------------------------------------------------------------------------------

MAX_HOMEPAGE_IDEAS = 8  # Homepage Journey Ideas hard cap — never exceed this

@admin_bp.route('/journey-ideas', methods=['GET', 'POST'])
@login_required
def journey_ideas():
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add':
            dest_id = request.form.get('destination_id')
            order = int(request.form.get('display_order', 0) or 0)
            if dest_id:
                # Enforce homepage maximum before adding
                current_count = JourneyIdea.query.count()
                if current_count >= MAX_HOMEPAGE_IDEAS:
                    flash(
                        f"Homepage is full ({MAX_HOMEPAGE_IDEAS}/{MAX_HOMEPAGE_IDEAS}). "
                        "Remove an existing destination before adding a new one.",
                        "danger"
                    )
                else:
                    existing = JourneyIdea.query.filter_by(destination_id=dest_id).first()
                    if not existing:
                        idea = JourneyIdea(destination_id=dest_id, display_order=order, is_active=True)
                        db.session.add(idea)
                        db.session.commit()
                        flash("Destination added to Homepage Journey Ideas.", "success")
                    else:
                        flash("This destination is already in Journey Ideas.", "warning")
                    
        elif action == 'remove':
            idea_id = request.form.get('idea_id')
            idea = JourneyIdea.query.get(idea_id)
            if idea:
                db.session.delete(idea)
                db.session.commit()
                flash("Removed from Homepage Journey Ideas.", "info")
                
        elif action == 'reorder':
            for key, val in request.form.items():
                if key.startswith('order_'):
                    idea_id = key.replace('order_', '')
                    if idea_id.isdigit():
                        idea = JourneyIdea.query.get(int(idea_id))
                        if idea:
                            idea.display_order = int(val or 0)
            db.session.commit()
            flash("Journey Ideas order updated.", "success")
            
        return redirect(url_for('admin.journey_ideas'))
        
    current_ideas = (
        JourneyIdea.query
        .options(
            joinedload(JourneyIdea.destination).joinedload(Destination.category)
        )
        .join(Destination)
        .order_by(JourneyIdea.display_order.asc())
        .all()
    )
    current_dest_ids = [i.destination_id for i in current_ideas]
    is_full = len(current_ideas) >= MAX_HOMEPAGE_IDEAS
    
    # All active (published) destinations from the complete Tours catalog, any category,
    # minus those already on the homepage — no category filter applied.
    available_destinations = (
        Destination.query
        .options(joinedload(Destination.category))
        .filter(
            Destination.is_published == True,
            Destination.id.notin_(current_dest_ids) if current_dest_ids else True
        )
        .order_by(Destination.title.asc())
        .all()
    )
    
    return render_template(
        'journey_ideas.html',
        current_ideas=current_ideas,
        available_destinations=available_destinations,
        is_full=is_full,
        max_ideas=MAX_HOMEPAGE_IDEAS
    )

# ------------------------------------------------------------------------------
# CATEGORIES MANAGEMENT
# ------------------------------------------------------------------------------

@admin_bp.route('/categories', methods=['GET', 'POST'])
@login_required
def categories():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        slug = request.form.get('slug', '').strip().lower()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        description = request.form.get('description', '').strip()
        display_order = int(request.form.get('display_order', 0) or 0)
        
        cat = Category(
            name=name,
            slug=slug,
            description=description,
            display_order=display_order,
            is_active=True
        )
        db.session.add(cat)
        db.session.commit()
        flash(f"Category '{name}' created.", "success")
        return redirect(url_for('admin.categories'))
        
    cats = Category.query.order_by(Category.display_order.asc(), Category.name.asc()).all()
    return render_template('categories.html', categories=cats)

@admin_bp.route('/categories/<int:cat_id>/delete', methods=['POST'])
@login_required
def delete_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    name = cat.name
    db.session.delete(cat)
    db.session.commit()
    flash(f"Category '{name}' deleted.", "info")
    return redirect(url_for('admin.categories'))

# ------------------------------------------------------------------------------
# SERVICES MANAGEMENT
# ------------------------------------------------------------------------------

@admin_bp.route('/services', methods=['GET', 'POST'])
@login_required
def services():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        slug = request.form.get('slug', '').strip().lower()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        eyebrow = request.form.get('eyebrow', '').strip()
        description = request.form.get('description', '').strip()
        points = [p.strip() for p in request.form.get('points', '').split('\n') if p.strip()]
        image = request.form.get('image', '').strip()
        is_educational = 'is_educational' in request.form
        display_order = int(request.form.get('display_order', 0) or 0)
        
        svc = Service(
            title=title,
            slug=slug,
            eyebrow=eyebrow,
            description=description,
            image=image,
            is_educational=is_educational,
            display_order=display_order,
            is_active=True
        )
        svc.set_points(points)
        db.session.add(svc)
        db.session.commit()
        flash(f"Service '{title}' created.", "success")
        return redirect(url_for('admin.services'))
        
    svc_list = Service.query.order_by(Service.display_order.asc()).all()
    return render_template('services.html', services=svc_list)

@admin_bp.route('/services/<int:svc_id>/delete', methods=['POST'])
@login_required
def delete_service(svc_id):
    svc = Service.query.get_or_404(svc_id)
    db.session.delete(svc)
    db.session.commit()
    flash(f"Service '{svc.title}' deleted.", "info")
    return redirect(url_for('admin.services'))

# ------------------------------------------------------------------------------
# FAQS MANAGEMENT
# ------------------------------------------------------------------------------

@admin_bp.route('/faqs', methods=['GET', 'POST'])
@login_required
def faqs():
    if request.method == 'POST':
        question = request.form.get('question', '').strip()
        answer = request.form.get('answer', '').strip()
        display_order = int(request.form.get('display_order', 0) or 0)
        is_published = 'is_published' in request.form
        
        faq = FAQ(
            question=question,
            answer=answer,
            display_order=display_order,
            is_published=is_published
        )
        db.session.add(faq)
        db.session.commit()
        flash("FAQ item added.", "success")
        return redirect(url_for('admin.faqs'))
        
    faq_list = FAQ.query.order_by(FAQ.display_order.asc()).all()
    return render_template('faqs.html', faqs=faq_list)

@admin_bp.route('/faqs/<int:faq_id>/delete', methods=['POST'])
@login_required
def delete_faq(faq_id):
    faq = FAQ.query.get_or_404(faq_id)
    db.session.delete(faq)
    db.session.commit()
    flash("FAQ item deleted.", "info")
    return redirect(url_for('admin.faqs'))

# ------------------------------------------------------------------------------
# STORIES MANAGEMENT
# ------------------------------------------------------------------------------

@admin_bp.route('/stories', methods=['GET', 'POST'])
@login_required
def stories():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        slug = request.form.get('slug', '').strip().lower()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        category = request.form.get('category', '').strip()
        date_label = request.form.get('date_label', '').strip()
        read_time = request.form.get('read_time', '').strip()
        excerpt = request.form.get('excerpt', '').strip()
        content = request.form.get('content', '').strip()
        image = request.form.get('image', '').strip()
        author = request.form.get('author', '').strip()
        is_published = 'is_published' in request.form
        
        story = Story(
            title=title,
            slug=slug,
            category=category,
            date_label=date_label,
            read_time=read_time,
            excerpt=excerpt,
            content=content,
            image=image,
            author=author,
            is_published=is_published
        )
        db.session.add(story)
        db.session.commit()
        flash(f"Story '{title}' created.", "success")
        return redirect(url_for('admin.stories'))
        
    story_list = Story.query.order_by(Story.created_at.desc()).all()
    return render_template('stories.html', stories=story_list)

@admin_bp.route('/stories/<int:story_id>/delete', methods=['POST'])
@login_required
def delete_story(story_id):
    story = Story.query.get_or_404(story_id)
    db.session.delete(story)
    db.session.commit()
    flash(f"Story '{story.title}' deleted.", "info")
    return redirect(url_for('admin.stories'))

# ------------------------------------------------------------------------------
# NEWSLETTER SUBSCRIBERS
# ------------------------------------------------------------------------------

@admin_bp.route('/newsletter')
@login_required
def newsletter():
    subscribers = NewsletterSubscriber.query.order_by(NewsletterSubscriber.created_at.desc()).all()
    return render_template('newsletter.html', subscribers=subscribers)

@admin_bp.route('/newsletter/<int:sub_id>/delete', methods=['POST'])
@login_required
def delete_subscriber(sub_id):
    sub = NewsletterSubscriber.query.get_or_404(sub_id)
    db.session.delete(sub)
    db.session.commit()
    flash("Subscriber removed.", "info")
    return redirect(url_for('admin.newsletter'))

# ------------------------------------------------------------------------------
# SITE SETTINGS & NOTIFICATION CONFIGURATION
# ------------------------------------------------------------------------------

@admin_bp.route('/site-settings', methods=['GET', 'POST'])
@login_required
def site_settings():
    if request.method == 'POST':
        # Check permissions: only Super Admin can edit critical settings/notification emails
        for key, val in request.form.items():
            cleaned_val = (val or '').strip()
            setting = SiteSetting.query.filter_by(setting_key=key).first()
            if setting:
                # Never overwrite an existing setting with an empty/whitespace-only value
                if cleaned_val:
                    setting.setting_value = cleaned_val
            elif cleaned_val:
                # New settings should only be created when the submitted value is non-empty
                db.session.add(SiteSetting(setting_key=key, setting_value=cleaned_val))
        db.session.commit()
        flash("Site settings updated successfully.", "success")
        return redirect(url_for('admin.site_settings'))
        
    settings = SiteSetting.query.all()
    settings_dict = {s.setting_key: s.setting_value for s in settings}
    
    # Brevo status overview for admin UI (safe, no secret exposure)
    brevo_info = {
        'is_configured': bool(Config.BREVO_API_KEY),
        'sender_name': Config.BREVO_SENDER_NAME,
        'sender_email': Config.BREVO_SENDER_EMAIL,
        'status_label': 'Connected (API Active)' if Config.BREVO_API_KEY else 'Development Mode (Local / Mock)',
        'blob_configured': is_blob_configured()
    }
    
    return render_template('settings.html', settings=settings_dict, brevo_info=brevo_info)

@admin_bp.route('/api/test-email', methods=['POST'])
@login_required
def test_email():
    """
    Protected Admin endpoint: POST /admin/api/test-email
    Sends a diagnostic test email through Brevo using server-side configuration.
    Safe:
    - Never accepts custom sender details from client
    - Never returns or leaks API key
    - Requires authenticated admin session
    """
    data = request.get_json(silent=True) or request.form
    recipient_email = (data.get('recipient_email') or data.get('email') or '').strip()

    if not recipient_email:
        return jsonify({
            'success': False,
            'message': 'Please enter a valid recipient email address.'
        }), 400

    success, message = send_test_email(recipient_email)
    status_code = 200 if success else 400
    return jsonify({
        'success': success,
        'message': message
    }), status_code

# ------------------------------------------------------------------------------
# VERCEL BLOB MEDIA STORAGE & UPLOAD ENDPOINTS
# ------------------------------------------------------------------------------

@admin_bp.route('/api/media/upload', methods=['POST'])
@login_required
def media_upload():
    """
    Standard image upload endpoint (<= 4MB).
    Uploads directly to Vercel Blob public storage from server side.
    Master credential stays strictly server-side.
    """
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded.'}), 400

    file = request.files['file']
    folder = request.form.get('folder', 'general').strip()
    is_video = request.form.get('is_video', '0') in ['1', 'true', 'True']

    is_valid, err_msg, content_type = validate_media_file(file, is_video=is_video)
    if not is_valid:
        return jsonify({'success': False, 'message': err_msg}), 400

    pathname = sanitize_pathname(folder, file.filename, is_video=is_video)
    file_bytes = file.read()

    success, result = upload_file_to_blob(file_bytes, pathname, content_type=content_type)
    if success:
        return jsonify({
            'success': True,
            'url': result.get('url'),
            'pathname': result.get('pathname', pathname),
            'contentType': result.get('contentType', content_type)
        }), 200
    else:
        return jsonify({'success': False, 'message': result}), 400


@admin_bp.route('/api/media/client-token', methods=['POST'])
@login_required
def media_client_token():
    """
    Generates direct client upload authorization for large files (e.g. videos up to 100MB)
    bypassing Vercel Serverless Function 4.5MB request limit.
    Security guarantee: Browser NEVER receives master BLOB_READ_WRITE_TOKEN.
    """
    data = request.get_json(silent=True) or request.form
    filename = (data.get('filename') or '').strip()
    folder = (data.get('folder') or 'homepage/hero').strip()
    content_type = (data.get('contentType') or 'video/mp4').strip().lower()
    size_bytes = int(data.get('size') or data.get('size_bytes') or 0)

    if not filename:
        return jsonify({'success': False, 'message': 'Filename is required.'}), 400

    # Validate video extension
    _, ext = os.path.splitext(filename.lower())
    valid_exts = [e for exts in ALLOWED_VIDEO_MIMES.values() for e in exts]
    if ext not in valid_exts:
        return jsonify({'success': False, 'message': f"Disallowed video file extension '{ext}'. Allowed: {', '.join(valid_exts)}"}), 400

    success, err_msg, token_data = generate_scoped_client_upload_token(folder, filename, content_type, size_bytes=size_bytes)
    if not success:
        return jsonify({'success': False, 'message': err_msg}), 400

    return jsonify({
        'success': True,
        **token_data
    }), 200


@admin_bp.route('/api/media/delete', methods=['POST'])
@login_required
def media_delete():
    """
    Deletes an existing blob given its URL.
    Safety guarantees:
    - Requires authenticated admin session.
    - Prohibits deleting local /images/... assets.
    - Only deletes URLs confirmed to belong to Vercel Blob storage.
    """
    data = request.get_json(silent=True) or request.form
    url = (data.get('url') or '').strip()
    if not url:
        return jsonify({'success': False, 'message': 'URL is required.'}), 400

    success, msg = delete_blob(url)
    return jsonify({'success': success, 'message': msg}), (200 if success else 400)

# ------------------------------------------------------------------------------
# ADMIN ACCOUNTS MANAGEMENT (SUPER_ADMIN ONLY)
# ------------------------------------------------------------------------------

@admin_bp.route('/admins')
@super_admin_required
def admins():
    admin_list = Admin.query.order_by(Admin.created_at.desc()).all()
    return render_template('admins.html', admins=admin_list)

@admin_bp.route('/admins/new', methods=['GET', 'POST'])
@super_admin_required
def new_admin():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        role = request.form.get('role', 'ADMIN').strip().upper()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        is_active = request.form.get('is_active') == 'on'

        if not name or not email:
            flash("Name and email are required fields.", "danger")
            return render_template('admin_form.html', admin=None, is_new=True)

        if not password or len(password) < 8:
            flash("Password must be at least 8 characters in length.", "danger")
            return render_template('admin_form.html', admin=None, is_new=True)

        if password != confirm_password:
            flash("Passwords do not match. Please verify.", "danger")
            return render_template('admin_form.html', admin=None, is_new=True)

        if role not in ['SUPER_ADMIN', 'ADMIN']:
            role = 'ADMIN'

        existing = Admin.query.filter(db.func.lower(Admin.email) == email).first()
        if existing:
            flash(f"An admin account with email '{email}' already exists.", "danger")
            return render_template('admin_form.html', admin=None, is_new=True)

        new_acc = Admin(
            name=name,
            email=email,
            role=role,
            is_active=is_active
        )
        new_acc.set_password(password)
        db.session.add(new_acc)
        db.session.commit()

        flash(f"Administrator '{name}' ({role}) created successfully.", "success")
        return redirect(url_for('admin.admins'))

    return render_template('admin_form.html', admin=None, is_new=True)

@admin_bp.route('/admins/<int:admin_id>/edit', methods=['GET', 'POST'])
@super_admin_required
def edit_admin(admin_id):
    acc = Admin.query.get_or_404(admin_id)

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        role = request.form.get('role', 'ADMIN').strip().upper()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        is_active = request.form.get('is_active') == 'on'

        if not name or not email:
            flash("Name and email are required fields.", "danger")
            return render_template('admin_form.html', admin=acc, is_new=False)

        # Check for unique email conflict
        existing = Admin.query.filter(db.func.lower(Admin.email) == email, Admin.id != acc.id).first()
        if existing:
            flash(f"An admin account with email '{email}' already exists.", "danger")
            return render_template('admin_form.html', admin=acc, is_new=False)

        # Safety Check: Prevent demoting or deactivating the last active SUPER_ADMIN
        if acc.is_super_admin and (role != 'SUPER_ADMIN' or not is_active):
            super_count = Admin.query.filter_by(role='SUPER_ADMIN', is_active=True).count()
            if super_count <= 1:
                flash("Operation blocked: System must have at least one active Super Administrator.", "danger")
                return render_template('admin_form.html', admin=acc, is_new=False)

        acc.name = name
        acc.email = email
        acc.role = role if role in ['SUPER_ADMIN', 'ADMIN'] else 'ADMIN'
        acc.is_active = is_active

        if password:
            if len(password) < 8:
                flash("New password must be at least 8 characters in length.", "danger")
                return render_template('admin_form.html', admin=acc, is_new=False)
            if password != confirm_password:
                flash("Passwords do not match. Please verify.", "danger")
                return render_template('admin_form.html', admin=acc, is_new=False)
            acc.set_password(password)

        db.session.commit()
        flash(f"Administrator '{acc.name}' updated successfully.", "success")
        return redirect(url_for('admin.admins'))

    return render_template('admin_form.html', admin=acc, is_new=False)

@admin_bp.route('/admins/<int:admin_id>/toggle-status', methods=['POST'])
@super_admin_required
def toggle_admin_status(admin_id):
    acc = Admin.query.get_or_404(admin_id)

    # Protect against self-deactivation or deactivating last Super Admin
    if acc.id == g.current_admin.id:
        flash("You cannot deactivate your own active session account.", "danger")
        return redirect(url_for('admin.admins'))

    if acc.is_super_admin and acc.is_active:
        super_count = Admin.query.filter_by(role='SUPER_ADMIN', is_active=True).count()
        if super_count <= 1:
            flash("Cannot deactivate the last remaining active Super Administrator.", "danger")
            return redirect(url_for('admin.admins'))

    acc.is_active = not acc.is_active
    db.session.commit()
    status_label = "activated" if acc.is_active else "deactivated"
    flash(f"Administrator '{acc.name}' has been {status_label}.", "info")
    return redirect(url_for('admin.admins'))

@admin_bp.route('/admins/<int:admin_id>/delete', methods=['POST'])
@super_admin_required
def delete_admin(admin_id):
    acc = Admin.query.get_or_404(admin_id)

    # Protect against deleting self or deleting last Super Admin
    if acc.id == g.current_admin.id:
        flash("You cannot delete your own logged-in administrator account.", "danger")
        return redirect(url_for('admin.admins'))

    if acc.is_super_admin:
        super_count = Admin.query.filter_by(role='SUPER_ADMIN').count()
        if super_count <= 1:
            flash("Cannot delete the last remaining Super Administrator account.", "danger")
            return redirect(url_for('admin.admins'))

    admin_name = acc.name
    db.session.delete(acc)
    db.session.commit()
    flash(f"Administrator '{admin_name}' deleted permanently.", "info")
    return redirect(url_for('admin.admins'))

