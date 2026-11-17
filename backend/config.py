import os
import urllib.parse
from dotenv import load_dotenv

# Load .env file from project root or current working directory only when not in test mode
if os.environ.get('TESTING') != 'True':
    load_dotenv()

class ConfigMeta(type):
    """Metaclass to ensure BLOB_READ_WRITE_TOKEN and TRANSIT_BLOB_READ_WRITE_TOKEN stay synced during tests and runtime."""
    def __setattr__(cls, name, value):
        super().__setattr__(name, value)
        if name == 'BLOB_READ_WRITE_TOKEN':
            super().__setattr__('TRANSIT_BLOB_READ_WRITE_TOKEN', value)
        elif name == 'TRANSIT_BLOB_READ_WRITE_TOKEN':
            super().__setattr__('BLOB_READ_WRITE_TOKEN', value)

class Config(metaclass=ConfigMeta):
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
    # Supports both PostgreSQL (Aiven PostgreSQL) and MySQL (Aiven MySQL / Local MySQL).
    # When DATABASE_URL is provided, it is the authoritative primary database.
    # Silent fallback to local MySQL is strictly disallowed when DATABASE_URL is set to prevent split-brain state.
    if DATABASE_URL:
        # Standardize PostgreSQL and MySQL connection schemes for SQLAlchemy 2.x
        if DATABASE_URL.startswith('postgres://'):
            SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif DATABASE_URL.startswith('postgresql://'):
            SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg2://', 1)
        elif DATABASE_URL.startswith('mysql://'):
            SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace('mysql://', 'mysql+pymysql://', 1)
        else:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
            
        is_postgres = SQLALCHEMY_DATABASE_URI.startswith(('postgresql://', 'postgresql+psycopg2://'))
        is_mysql = SQLALCHEMY_DATABASE_URI.startswith(('mysql://', 'mysql+pymysql://'))

        has_ssl_requested = (
            'sslmode=require' in SQLALCHEMY_DATABASE_URI.lower() or
            'ssl-mode=required' in SQLALCHEMY_DATABASE_URI.lower() or
            'ssl_mode=required' in SQLALCHEMY_DATABASE_URI.lower() or
            str(DB_SSL_MODE).upper() == 'REQUIRED'
        )

        if is_postgres:
            # PostgreSQL (psycopg2) connection arguments
            pg_connect_args = {}
            if has_ssl_requested:
                pg_connect_args['sslmode'] = 'require'
            if DB_SSL_CA and os.path.exists(DB_SSL_CA):
                pg_connect_args['sslrootcert'] = DB_SSL_CA
            if pg_connect_args:
                engine_options['connect_args'] = pg_connect_args
        elif is_mysql:
            # MySQL (PyMySQL) connection arguments
            if has_ssl_requested:
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
    
    # Strict Safety Check: Automated tests must NEVER connect to live production databases
    if os.environ.get('TESTING') == 'True':
        uri_str = str(SQLALCHEMY_DATABASE_URI).lower()
        live_aiven_hosts = [
            'pg-21d8fda-jebaraj1364-0655',
            'mysql-1762cfd5-jebaraj1364-0655',
        ]
        for live_host in live_aiven_hosts:
            if live_host in uri_str:
                raise RuntimeError(
                    f"FATAL TEST SAFETY VIOLATION: Automated tests attempted to configure connection to live Aiven database ({live_host})! "
                    "Automated tests must run against an isolated test database."
                )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = engine_options
    
    # Brevo Email Configuration
    BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '').strip()
    BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'transitstory.in@gmail.com').strip()
    BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'Transit Story').strip()
    
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

    # Vercel Blob Cloud Storage Configuration (Public Media Store)
    TRANSIT_BLOB_READ_WRITE_TOKEN = (os.environ.get('TRANSIT_BLOB_READ_WRITE_TOKEN') or os.environ.get('BLOB_READ_WRITE_TOKEN') or '').strip()
    BLOB_READ_WRITE_TOKEN = TRANSIT_BLOB_READ_WRITE_TOKEN

    # Session cookie config for admin authentication
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'

    # Auto-reload templates when modified in development
    TEMPLATES_AUTO_RELOAD = True

def ensure_database_exists():
    """Connects to MySQL server and creates the database if it doesn't already exist."""
    # When testing, completely bypass any database auto-creation or connection attempts
    if os.environ.get('TESTING') == 'True':
        return

    database_url = os.environ.get('DATABASE_URL', '')
    # If targeting PostgreSQL or an external managed connection via DATABASE_URL, skip MySQL auto-create
    if database_url:
        return
        
    import pymysql
    
    db_host = os.environ.get('DB_HOST', '127.0.0.1')
    db_port = int(os.environ.get('DB_PORT', 3306))
    db_user = os.environ.get('DB_USER', 'root')
    db_password = os.environ.get('DB_PASSWORD', 'root')
    db_name = os.environ.get('DB_NAME', 'transit_story_db')
    
    # Only run database auto-create on granular local/managed MySQL connections
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
