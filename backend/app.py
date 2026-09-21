import os
from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
from backend.config import Config, ensure_database_exists
from backend.db import db
from backend.routes.api import api_bp
from backend.routes.admin import admin_bp

def create_app(config_class=Config):
    # Ensure MySQL database exists prior to connecting
    ensure_database_exists()
    
    app = Flask(
        __name__,
        template_folder='templates',
        static_folder='static'
    )
    app.config.from_object(config_class)
    
    # Enable CORS for frontend Vite development server & production domains
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000", "*"]}},
        supports_credentials=True
    )
    
    # Initialize Database
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(admin_bp)
    
    # Template context processor for dynamic live website URL
    @app.context_processor
    def inject_app_base_url():
        base_url = Config.APP_BASE_URL
        # If APP_BASE_URL is default localhost but request arrived from live domain, align dynamically
        host = request.headers.get('X-Forwarded-Host') or request.host
        scheme = request.headers.get('X-Forwarded-Proto') or request.scheme
        if host and 'localhost' not in host and '127.0.0.1' not in host:
            base_url = f"{scheme}://{host}".rstrip('/')
        return dict(app_base_url=base_url)

    # Route to serve public images from root public/ folder
    @app.route('/images/<path:filename>')
    def serve_public_images(filename):
        public_dir = os.path.abspath(os.path.join(app.root_path, '..', 'public', 'images'))
        return send_from_directory(public_dir, filename)
        
    @app.route('/logo/<path:filename>')
    def serve_public_logo(filename):
        logo_dir = os.path.abspath(os.path.join(app.root_path, '..', 'public', 'logo'))
        return send_from_directory(logo_dir, filename)
        
    # Healthcheck endpoint
    @app.route('/health')
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'The Transit Story API & Admin Desk',
            'version': '2.0.0',
            'database': 'MySQL'
        })
        
    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404
        
    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
        
    # Database schema auto-initialization:
    # Only runs when explicitly requested via DATABASE_AUTO_INIT=true (e.g. local setup or CI).
    # In production serverless requests (Vercel), tables are already established and skipping
    # this eliminates ~2.2 seconds of cold-start DDL latency on every request.
    auto_init = os.environ.get('DATABASE_AUTO_INIT', '').strip().lower() in ('true', '1', 'yes')
    if auto_init:
        with app.app_context():
            try:
                db.create_all()
                # Ensure the many-to-many destination_categories join table exists
                from sqlalchemy import text as _text
                try:
                    db.session.execute(_text(
                        "CREATE TABLE IF NOT EXISTS destination_categories ("
                        "  destination_id INT NOT NULL,"
                        "  category_id INT NOT NULL,"
                        "  PRIMARY KEY (destination_id, category_id),"
                        "  CONSTRAINT fk_dc_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,"
                        "  CONSTRAINT fk_dc_cat  FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE CASCADE"
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
                    ))
                    db.session.commit()
                except Exception as dc_err:
                    db.session.rollback()
                    print(f"[DB Migration Notice] destination_categories table: {dc_err}")
                # Verify and migrate any new columns on existing tables
                from sqlalchemy import text
                try:
                    cols = [r[0] for r in db.session.execute(text('DESCRIBE admins;')).fetchall()]
                    if 'is_active' not in cols:
                        db.session.execute(text('ALTER TABLE admins ADD COLUMN is_active TINYINT(1) DEFAULT 1 NOT NULL;'))
                    if 'last_login_at' not in cols:
                        db.session.execute(text('ALTER TABLE admins ADD COLUMN last_login_at DATETIME NULL;'))

                    # Ensure previous_slugs column exists on destinations table
                    dest_cols = [r[0] for r in db.session.execute(text('DESCRIBE destinations;')).fetchall()]
                    if 'previous_slugs' not in dest_cols:
                        db.session.execute(text('ALTER TABLE destinations ADD COLUMN previous_slugs VARCHAR(500) NULL;'))

                    # Expand image columns to VARCHAR(500) for Vercel Blob URLs
                    for alter_sql in [
                        'ALTER TABLE destinations MODIFY hero_image VARCHAR(500) NULL;',
                        'ALTER TABLE destinations MODIFY cover_image VARCHAR(500) NULL;',
                        'ALTER TABLE destination_gallery MODIFY image_url VARCHAR(500) NOT NULL;',
                        'ALTER TABLE services MODIFY image VARCHAR(500) NULL;',
                        'ALTER TABLE stories MODIFY image VARCHAR(500) NULL;'
                    ]:
                        try:
                            db.session.execute(text(alter_sql))
                        except Exception:
                            pass

                    # Drop unused cover_image column on categories table if present
                    try:
                        cat_cols = [r[0] for r in db.session.execute(text('DESCRIBE categories;')).fetchall()]
                        if 'cover_image' in cat_cols:
                            db.session.execute(text('ALTER TABLE categories DROP COLUMN cover_image;'))
                    except Exception as cat_drop_err:
                        print(f"[DB Migration Notice] categories cover_image drop check: {cat_drop_err}")

                    db.session.commit()
                except Exception as migration_err:
                    db.session.rollback()
                    print(f"[DB Migration Notice] Schema check: {migration_err}")
            except Exception as e:
                print(f"[DB Init Warning] Could not automatically create tables: {e}")
            
    return app

# Root app object for Gunicorn / WSGI / Vercel
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
