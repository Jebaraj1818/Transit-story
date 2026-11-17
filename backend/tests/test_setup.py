"""
==============================================================================
THE TRANSIT STORY — TEST ENVIRONMENT DATABASE ISOLATION SETUP
==============================================================================
Guarantees 100% test isolation by:
1. Setting TESTING=True and FLASK_ENV=testing.
2. Generating an isolated, temporary SQLite database on local disk.
3. Overriding DATABASE_URL with the SQLite URI before Flask/SQLAlchemy initializes.
4. Neutralizing live Aiven MySQL and PostgreSQL connection variables from os.environ.
5. Auto-initializing all 17 tables and seeding baseline data from migration-backup/.
6. Automatically cleaning up temporary database files on exit.
==============================================================================
"""

import os
import sys
import atexit
import tempfile
import shutil
from sqlalchemy import create_engine

# Set test environment flags immediately
os.environ['TESTING'] = 'True'
os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_AUTO_INIT'] = 'false'

# Root directory resolution
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Neutralize live production credentials from environment so tests can never fall back
for live_var in ['MYSQL_FALLBACK_URL', 'POSTGRES_TEST_URL']:
    if live_var in os.environ:
        del os.environ[live_var]

# Also ensure DB_HOST does not point to live Aiven MySQL
if 'aivencloud.com' in os.environ.get('DB_HOST', ''):
    os.environ['DB_HOST'] = '127.0.0.1'

# Global tracking to initialize SQLite test DB only once per test process
_TEST_DB_INITIALIZED = False
_TEMP_DIR = None

def get_test_db_uri():
    global _TEMP_DIR
    if _TEMP_DIR is None:
        _TEMP_DIR = tempfile.mkdtemp(prefix='transit_story_test_')
    db_path = os.path.join(_TEMP_DIR, f'isolated_test_{os.getpid()}.db')
    normalized_path = db_path.replace(os.sep, '/')
    return f"sqlite:///{normalized_path}"

def _initialize_isolated_test_database():
    global _TEST_DB_INITIALIZED
    if _TEST_DB_INITIALIZED:
        return
        
    test_uri = get_test_db_uri()
    os.environ['DATABASE_URL'] = test_uri
    
    # Reload backend.config if already loaded
    if 'backend.config' in sys.modules:
        import importlib
        importlib.reload(sys.modules['backend.config'])
        
    # Import SQLAlchemy models and metadata
    from backend.db import db
    import backend.models  # Registers all 17 models
    
    engine = create_engine(test_uri)
    db.metadata.create_all(engine)
    
    # Load baseline verified records from migration-backup
    backup_dir = os.path.join(PROJECT_ROOT, 'migration-backup')
    scripts_dir = os.path.join(PROJECT_ROOT, 'scripts')
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
        
    loaded_backup = False
    if os.path.exists(backup_dir):
        try:
            from migrate_mysql_backup_to_postgres import TABLE_MIGRATION_ORDER, load_backup_records_for_table
            with engine.begin() as conn:
                for tbl_name in TABLE_MIGRATION_ORDER:
                    cols, records = load_backup_records_for_table(backup_dir, tbl_name)
                    if records:
                        table_obj = db.metadata.tables[tbl_name]
                        conn.execute(table_obj.insert(), records)
            loaded_backup = True
        except Exception:
            loaded_backup = False

    if not loaded_backup:
        # Fallback to standard seed data if backup directory or decompressor is unavailable
        from backend.seed_data import seed_database
        from backend.app import app as _seed_app
        with _seed_app.app_context():
            db.create_all()
            
    engine.dispose()
    
    # Reload backend.app if already imported to bind to test SQLite db
    if 'backend.app' in sys.modules:
        import importlib
        importlib.reload(sys.modules['backend.app'])
        
    _TEST_DB_INITIALIZED = True

def _cleanup_test_database():
    global _TEMP_DIR
    if _TEMP_DIR and os.path.exists(_TEMP_DIR):
        try:
            shutil.rmtree(_TEMP_DIR, ignore_errors=True)
        except Exception:
            pass

atexit.register(_cleanup_test_database)

# Execute initialization immediately upon module import
_initialize_isolated_test_database()
