import os
import urllib.parse
from dotenv import load_dotenv

# Load .env file from project root or current working directory
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'the-transit-story-secret-key-2026')
    
    DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
    DB_PORT = int(os.environ.get('DB_PORT', 3306))
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
    DB_NAME = os.environ.get('DB_NAME', 'transit_story_db')
    
    DATABASE_URL = os.environ.get('DATABASE_URL')
    DB_SSL_MODE = os.environ.get('DB_SSL_MODE')
    DB_SSL_CA = os.environ.get('DB_SSL_CA')
    
    engine_options = {
        'pool_recycle': 280,
        'pool_pre_ping': True,
    }
    
    pwd_encoded = urllib.parse.quote_plus(DB_PASSWORD)
    local_uri = f"mysql+pymysql://{DB_USER}:{pwd_encoded}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

    # Database selection logic:
    # When DATABASE_URL is provided, it is the authoritative primary database (e.g. Aiven MySQL).
    # Silent fallback to local MySQL is strictly disallowed to prevent split-brain state,
    # silent data divergency, and disappearing site settings.
    if DATABASE_URL:
        if DATABASE_URL.startswith('mysql://'):
            SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('mysql://', 'mysql+pymysql://', 1)
        else:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
            
        # Ensure PyMySQL accepts SSL parameters via connect_args
        if 'ssl-mode=REQUIRED' in SQLALCHEMY_DATABASE_URI or 'ssl_mode=REQUIRED' in SQLALCHEMY_DATABASE_URI or DB_SSL_MODE == 'REQUIRED':
            ssl_dict = {'ssl_mode': 'REQUIRED'}
            if DB_SSL_CA and os.path.exists(DB_SSL_CA):
                ssl_dict['ca'] = DB_SSL_CA
            engine_options['connect_args'] = {'ssl': ssl_dict}
    else:
        # Local development fallback only when DATABASE_URL is completely unset
        SQLALCHEMY_DATABASE_URI = local_uri
        if DB_SSL_MODE == 'REQUIRED':
            ssl_dict = {'ssl_mode': 'REQUIRED'}
            if DB_SSL_CA and os.path.exists(DB_SSL_CA):
                ssl_dict['ca'] = DB_SSL_CA
            engine_options['connect_args'] = {'ssl': ssl_dict}
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = engine_options
    
    # Brevo Email Configuration
    BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '').strip()
    BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'transitstory.in@gmail.com').strip()
    BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'The Transit Story').strip()
    
    # Optional Brevo Transactional Template IDs
    BREVO_TEMPLATE_ADMIN_PASSWORD_RESET = os.environ.get('BREVO_TEMPLATE_ADMIN_PASSWORD_RESET')
    BREVO_TEMPLATE_ADMIN_PASSWORD_CHANGED = os.environ.get('BREVO_TEMPLATE_ADMIN_PASSWORD_CHANGED')
    BREVO_TEMPLATE_NEWSLETTER_WELCOME = os.environ.get('BREVO_TEMPLATE_NEWSLETTER_WELCOME')
    BREVO_TEMPLATE_ENQUIRY_CUSTOMER = os.environ.get('BREVO_TEMPLATE_ENQUIRY_CUSTOMER')
    BREVO_TEMPLATE_ENQUIRY_ADMIN = os.environ.get('BREVO_TEMPLATE_ENQUIRY_ADMIN')
    BREVO_TEMPLATE_CONTACT_CUSTOMER = os.environ.get('BREVO_TEMPLATE_CONTACT_CUSTOMER')
    BREVO_TEMPLATE_CONTACT_ADMIN = os.environ.get('BREVO_TEMPLATE_CONTACT_ADMIN')
    
    # App base URL for reset links and redirects
    APP_BASE_URL = os.environ.get('APP_BASE_URL', 'http://localhost:3000').rstrip('/')

    # Vercel Blob Cloud Storage Configuration
    BLOB_READ_WRITE_TOKEN = os.environ.get('BLOB_READ_WRITE_TOKEN', '').strip()

    # Session cookie config for admin authentication
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'

def ensure_database_exists():
    """Connects to MySQL server and creates the database if it doesn't already exist."""
    import pymysql
    
    db_host = os.environ.get('DB_HOST', '127.0.0.1')
    db_port = int(os.environ.get('DB_PORT', 3306))
    db_user = os.environ.get('DB_USER', 'root')
    db_password = os.environ.get('DB_PASSWORD', 'root')
    db_name = os.environ.get('DB_NAME', 'transit_story_db')
    
    # Only run database auto-create on granular local/managed connections
    if not os.environ.get('DATABASE_URL'):
        try:
            conn = pymysql.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                charset='utf8mb4'
            )
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.commit()
            conn.close()
            print(f"[DB] Database `{db_name}` verified/created successfully.")
        except Exception as e:
            print(f"[DB Notice] Could not verify/create database `{db_name}`: {e}")
