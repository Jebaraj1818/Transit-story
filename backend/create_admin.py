"""
CLI Utility to create or update an Administrator account for The Transit Story.
Usage:
    python backend/create_admin.py <email> <password> <name> <role>
Example:
    python backend/create_admin.py owner@thetransitstory.com StrongSecret2026! "Lead Curator" SUPER_ADMIN
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.db import db
from backend.models import Admin

app = create_app()

def create_or_update_admin(email, password, name="Curator Desk", role="SUPER_ADMIN", is_active=True):
    with app.app_context():
        clean_email = email.strip().lower()
        admin = Admin.query.filter(db.func.lower(Admin.email) == clean_email).first()
        clean_role = role.strip().upper() if role.strip().upper() in ['SUPER_ADMIN', 'ADMIN'] else 'SUPER_ADMIN'
        
        if admin:
            admin.name = name
            admin.set_password(password)
            admin.role = clean_role
            admin.is_active = is_active
            print(f"[ADMIN] Updated existing administrator: {clean_email} ({clean_role}, Active: {is_active})")
        else:
            admin = Admin(
                name=name,
                email=clean_email,
                role=clean_role,
                is_active=is_active
            )
            admin.set_password(password)
            db.session.add(admin)
            print(f"[ADMIN] Created new administrator: {clean_email} ({clean_role})")
        db.session.commit()

if __name__ == '__main__':
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@thetransitstory.com"
    pwd = sys.argv[2] if len(sys.argv) > 2 else "transitstory2026"
    name = sys.argv[3] if len(sys.argv) > 3 else "Curator Desk"
    role = sys.argv[4] if len(sys.argv) > 4 else "SUPER_ADMIN"
    create_or_update_admin(email, pwd, name, role)

