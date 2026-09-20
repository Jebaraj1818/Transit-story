from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify, g
from backend.models import Admin

def get_current_admin():
    admin_id = session.get('admin_id')
    if not admin_id:
        g.current_admin = None
        return None
    if not hasattr(g, 'current_admin') or g.current_admin is None or getattr(g.current_admin, 'id', None) != admin_id:
        admin = Admin.query.get(admin_id)
        if admin and admin.is_active:
            g.current_admin = admin
        else:
            # If admin was deactivated or deleted, terminate session
            session.pop('admin_id', None)
            g.current_admin = None
    return g.current_admin

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin = get_current_admin()
        if not admin:
            if request.path.startswith('/api/admin') or request.path.startswith('/admin/api') or request.is_json:
                return jsonify({'error': 'Unauthorized. Admin login required.'}), 401
            flash('Please log in to access the curator desk.', 'warning')
            return redirect(url_for('admin.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def super_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin = get_current_admin()
        if not admin:
            if request.path.startswith('/api/admin'):
                return jsonify({'error': 'Unauthorized. Admin login required.'}), 401
            flash('Please log in to access this area.', 'warning')
            return redirect(url_for('admin.login', next=request.url))
        if not admin.is_super_admin:
            if request.path.startswith('/api/admin'):
                return jsonify({'error': 'Forbidden. Super Admin privileges required.'}), 403
            flash('Access restricted to Super Administrators.', 'danger')
            return redirect(url_for('admin.dashboard'))
        return f(*args, **kwargs)
    return decorated_function

