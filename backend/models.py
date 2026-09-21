from datetime import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash
from backend.db import db

class Admin(db.Model):
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='ADMIN', nullable=False)  # SUPER_ADMIN | ADMIN
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)
    
    reset_tokens = db.relationship('AdminPasswordResetToken', back_populates='admin', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    @property
    def is_super_admin(self):
        return self.role == 'SUPER_ADMIN'
        
    @property
    def is_regular_admin(self):
        return self.role == 'ADMIN'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'isActive': self.is_active,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'last_login_at': self.last_login_at.strftime('%Y-%m-%d %H:%M') if self.last_login_at else None
        }

class AdminPasswordResetToken(db.Model):
    __tablename__ = 'admin_password_reset_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id', ondelete='CASCADE'), nullable=False)
    token_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    admin = db.relationship('Admin', back_populates='reset_tokens')
    
    def is_valid(self):
        return self.used_at is None and self.expires_at > datetime.utcnow()


# ---------------------------------------------------------------------------
# Many-to-Many association table: a destination can belong to multiple categories
# ---------------------------------------------------------------------------
destination_categories = db.Table(
    'destination_categories',
    db.Column('destination_id', db.Integer, db.ForeignKey('destinations.id', ondelete='CASCADE'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True)
)

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # One-to-many (primary category relationship — backward-compatible)
    destinations = db.relationship('Destination', back_populates='category', lazy='dynamic', foreign_keys='Destination.category_id')
    # Many-to-many (secondary/multi-category assignments)
    destinations_m2m = db.relationship('Destination', secondary=destination_categories, back_populates='secondary_categories', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'display_order': self.display_order,
            'is_active': self.is_active
        }

class Destination(db.Model):
    __tablename__ = 'destinations'
    
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(150), unique=True, nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    location = db.Column(db.String(200), nullable=False)
    tag = db.Column(db.String(150), nullable=True)
    cover_image = db.Column(db.String(500), nullable=True)
    hero_image = db.Column(db.String(500), nullable=True)
    hero_position = db.Column(db.String(100), default='center 40%')
    description = db.Column(db.Text, nullable=True)
    about = db.Column(db.Text, nullable=True)
    suitable_for = db.Column(db.Text, nullable=True)
    is_educational = db.Column(db.Boolean, default=False, nullable=False)
    is_published = db.Column(db.Boolean, default=True, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    previous_slugs = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = db.relationship('Category', back_populates='destinations', foreign_keys=[category_id])
    # Many-to-many secondary categories (does not affect category_id / primary category)
    secondary_categories = db.relationship('Category', secondary=destination_categories, back_populates='destinations_m2m', lazy='select')
    gallery = db.relationship('DestinationGallery', back_populates='destination', cascade='all, delete-orphan', order_by='DestinationGallery.display_order')
    highlights = db.relationship('DestinationHighlight', back_populates='destination', cascade='all, delete-orphan', order_by='DestinationHighlight.display_order')
    experiences = db.relationship('DestinationExperience', back_populates='destination', cascade='all, delete-orphan', order_by='DestinationExperience.display_order')
    journey_idea = db.relationship('JourneyIdea', back_populates='destination', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self, include_details=True):
        cat_slug = self.category.slug if self.category else ('college-educational' if self.is_educational else 'leisure-holiday')
        cat_name = self.category.name if self.category else ('College & Educational' if self.is_educational else 'Leisure & Holiday')
        
        # Strictly ensure gallery contains max 3 images and excludes hero_image
        hero_img = self.hero_image or self.cover_image
        hero_norm = hero_img.split('?')[0] if hero_img else ''
        
        gallery_list = []
        for g in self.gallery:
            g_norm = g.image_url.split('?')[0] if g.image_url else ''
            if g_norm and g_norm != hero_norm and g.image_url not in gallery_list:
                gallery_list.append(g.image_url)
        gallery_list = gallery_list[:3]
        
        # Combined images array for fallback compatibility
        images_list = [hero_img] + [g for g in gallery_list if g != hero_img] if hero_img else gallery_list
        
        try:
            sec_slugs = [c.slug for c in self.secondary_categories] if self.secondary_categories else []
        except Exception:
            sec_slugs = []
        all_cat_slugs = [cat_slug] + [s for s in sec_slugs if s != cat_slug]

        res = {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'categoryId': self.category_id,
            'mainCategory': cat_slug,
            'categoryName': cat_name,
            'category': cat_name,
            'categories': all_cat_slugs,
            'categorySlugs': all_cat_slugs,
            'secondaryCategories': sec_slugs,
            'location': self.location,
            'tag': self.tag,
            'coverImage': self.cover_image or hero_img,
            'heroImage': hero_img,
            'heroPosition': self.hero_position or 'center 40%',
            'gallery': gallery_list,
            'images': images_list,
            'description': self.description,
            'isEducational': self.is_educational,
            'isPublished': self.is_published,
            'displayOrder': self.display_order,
            'previousSlugs': [s.strip() for s in self.previous_slugs.split(',') if s.strip()] if self.previous_slugs else [],
            'route': f"/tours/{self.slug}"
        }
        
        if include_details:
            res['about'] = self.about or self.description
            res['suitableFor'] = self.suitable_for
            res['highlights'] = [h.item_text for h in self.highlights]
            res['experiences'] = [e.item_text for e in self.experiences]
            
        return res

    def to_summary_dict(self):
        """Lightweight summary serialization for Tours card directory. Avoids lazy-loading child tables."""
        cat_slug = self.category.slug if self.category else ('college-educational' if self.is_educational else 'leisure-holiday')
        cat_name = self.category.name if self.category else ('College & Educational' if self.is_educational else 'Leisure & Holiday')
        hero_img = self.hero_image or self.cover_image
        try:
            sec_slugs = [c.slug for c in self.secondary_categories] if self.secondary_categories else []
        except Exception:
            sec_slugs = []
        all_cat_slugs = [cat_slug] + [s for s in sec_slugs if s != cat_slug]

        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'categoryId': self.category_id,
            'mainCategory': cat_slug,
            'categoryName': cat_name,
            'category': cat_name,
            'categories': all_cat_slugs,
            'categorySlugs': all_cat_slugs,
            'secondaryCategories': sec_slugs,
            'location': self.location,
            'tag': self.tag,
            'coverImage': self.cover_image or hero_img,
            'heroImage': hero_img,
            'heroPosition': self.hero_position or 'center 40%',
            'gallery': [],
            'images': [hero_img] if hero_img else [],
            'description': self.description,
            'isEducational': self.is_educational,
            'isPublished': self.is_published,
            'displayOrder': self.display_order,
            'previousSlugs': [s.strip() for s in self.previous_slugs.split(',') if s.strip()] if self.previous_slugs else [],
            'route': f"/tours/{self.slug}"
        }

class DestinationGallery(db.Model):
    __tablename__ = 'destination_gallery'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    destination = db.relationship('Destination', back_populates='gallery')

class DestinationHighlight(db.Model):
    __tablename__ = 'destination_highlights'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id', ondelete='CASCADE'), nullable=False)
    item_text = db.Column(db.Text, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    
    destination = db.relationship('Destination', back_populates='highlights')

class DestinationExperience(db.Model):
    __tablename__ = 'destination_experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id', ondelete='CASCADE'), nullable=False)
    item_text = db.Column(db.Text, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    
    destination = db.relationship('Destination', back_populates='experiences')

class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(150), unique=True, nullable=False, index=True)
    eyebrow = db.Column(db.String(150), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    points_json = db.Column(db.Text, nullable=True)  # JSON array string of bullet points
    image = db.Column(db.String(500), nullable=True)
    is_educational = db.Column(db.Boolean, default=False, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_points(self):
        if not self.points_json:
            return []
        try:
            return json.loads(self.points_json)
        except:
            return [p.strip() for p in self.points_json.split('\n') if p.strip()]
            
    def set_points(self, points_list):
        self.points_json = json.dumps(points_list) if isinstance(points_list, list) else points_list
    
    def to_dict(self):
        return {
            'id': self.slug,
            'slug': self.slug,
            'eyebrow': self.eyebrow,
            'title': self.title,
            'description': self.description,
            'points': self.get_points(),
            'image': self.image,
            'isEducational': self.is_educational,
            'displayOrder': self.display_order,
            'isActive': self.is_active
        }

class Enquiry(db.Model):
    __tablename__ = 'enquiries'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), default='journey_request', nullable=False)  # journey_request | contact_message | college_iv
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(50), nullable=False)  # REQUIRED
    destination = db.Column(db.String(200), nullable=True)
    travellers = db.Column(db.String(100), nullable=True)
    timeframe = db.Column(db.String(100), nullable=True)
    themes = db.Column(db.Text, nullable=True)  # comma separated or JSON string
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='new', nullable=False)  # new | contacted | in_planning | confirmed | archived
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'full_name': self.full_name,
            'fullName': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'destination': self.destination,
            'travellers': self.travellers,
            'timeframe': self.timeframe,
            'themes': self.themes,
            'notes': self.notes,
            'message': self.notes,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }

class FAQ(db.Model):
    __tablename__ = 'faqs'
    
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question': self.question,
            'answer': self.answer,
            'display_order': self.display_order,
            'is_published': self.is_published
        }

class JourneyIdea(db.Model):
    __tablename__ = 'journey_ideas'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id', ondelete='CASCADE'), unique=True, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    destination = db.relationship('Destination', back_populates='journey_idea')
    
    def to_dict(self):
        if not self.destination or not self.destination.is_published:
            return None
        d_dict = self.destination.to_dict(include_details=True)
        d_dict['journeyIdeaId'] = self.id
        d_dict['journeyIdeaOrder'] = self.display_order
        return d_dict

class SiteSetting(db.Model):
    __tablename__ = 'site_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    setting_value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'key': self.setting_key,
            'value': self.setting_value
        }

class Story(db.Model):
    __tablename__ = 'stories'
    
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(150), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    date_label = db.Column(db.String(100), nullable=True)
    read_time = db.Column(db.String(50), nullable=True)
    excerpt = db.Column(db.Text, nullable=True)
    content = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(500), nullable=True)
    author = db.Column(db.String(150), nullable=True)
    is_published = db.Column(db.Boolean, default=True, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.slug,
            'slug': self.slug,
            'title': self.title,
            'category': self.category,
            'date': self.date_label,
            'readTime': self.read_time,
            'excerpt': self.excerpt,
            'content': self.content,
            'image': self.image,
            'author': self.author,
            'isPublished': self.is_published
        }

class NewsletterSubscriber(db.Model):
    __tablename__ = 'newsletter_subscribers'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None
        }

class EmailLog(db.Model):
    __tablename__ = 'email_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    email_type = db.Column(db.String(100), nullable=False, index=True)  # admin_password_reset | newsletter_welcome | enquiry_customer | enquiry_admin | etc.
    recipient = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='sent', nullable=False)  # sent | failed | skipped
    related_record_id = db.Column(db.Integer, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email_type': self.email_type,
            'recipient': self.recipient,
            'status': self.status,
            'related_record_id': self.related_record_id,
            'error_message': self.error_message,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None
        }
