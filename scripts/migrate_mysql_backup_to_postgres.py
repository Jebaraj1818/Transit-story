"""
==============================================================================
THE TRANSIT STORY — CONTROLLED MYSQL SHELL BACKUP TO POSTGRESQL MIGRATION
==============================================================================
Reads audited MySQL Shell backup from `migration-backup/`, validates schemas,
creates tables on target Aiven PostgreSQL using SQLAlchemy metadata, loads
all 17 tables and 586 records preserving IDs, relationships, and datatypes,
and synchronizes all 16 primary key sequences.
==============================================================================
"""

import os
import sys
import re
import json
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import zstandard as zstd
from sqlalchemy import create_engine, text, inspect
from backend.db import db
import backend.models  # Registers all 17 models in db.metadata

# Ordered tables respecting foreign key constraints
TABLE_MIGRATION_ORDER = [
    # Tier 1: Independent parent tables
    'admins',
    'categories',
    'services',
    'stories',
    'faqs',
    'site_settings',
    'enquiries',
    'newsletter_subscribers',
    'email_logs',
    'testimonials',
    # Tier 2: Level 1 child tables
    'admin_password_reset_tokens',
    'destinations',
    # Tier 3: Level 2 child tables & association table
    'destination_categories',
    'destination_highlights',
    'destination_experiences',
    'destination_gallery',
    'journey_ideas',
]

# Set of all 10 Boolean columns across the database
BOOLEAN_COLUMNS = {
    ('admins', 'is_active'),
    ('categories', 'is_active'),
    ('destinations', 'is_educational'),
    ('destinations', 'is_published'),
    ('faqs', 'is_published'),
    ('journey_ideas', 'is_active'),
    ('services', 'is_educational'),
    ('services', 'is_active'),
    ('stories', 'is_published'),
    ('testimonials', 'is_active'),
}

# Date/Time columns to parse
DATETIME_COLUMNS = {
    ('admins', 'created_at'),
    ('admins', 'updated_at'),
    ('admins', 'last_login_at'),
    ('admin_password_reset_tokens', 'expires_at'),
    ('admin_password_reset_tokens', 'used_at'),
    ('admin_password_reset_tokens', 'created_at'),
    ('categories', 'created_at'),
    ('categories', 'updated_at'),
    ('destinations', 'created_at'),
    ('destinations', 'updated_at'),
    ('destination_gallery', 'created_at'),
    ('email_logs', 'created_at'),
    ('enquiries', 'created_at'),
    ('enquiries', 'updated_at'),
    ('newsletter_subscribers', 'created_at'),
    ('services', 'created_at'),
    ('services', 'updated_at'),
    ('site_settings', 'updated_at'),
    ('stories', 'created_at'),
    ('testimonials', 'created_at'),
    ('testimonials', 'updated_at'),
}

# Integer columns to parse
INTEGER_COLUMNS = {
    ('admins', 'id'),
    ('admin_password_reset_tokens', 'id'),
    ('admin_password_reset_tokens', 'admin_id'),
    ('categories', 'id'),
    ('categories', 'display_order'),
    ('destinations', 'id'),
    ('destinations', 'category_id'),
    ('destinations', 'display_order'),
    ('destination_categories', 'destination_id'),
    ('destination_categories', 'category_id'),
    ('destination_experiences', 'id'),
    ('destination_experiences', 'destination_id'),
    ('destination_experiences', 'display_order'),
    ('destination_gallery', 'id'),
    ('destination_gallery', 'destination_id'),
    ('destination_gallery', 'display_order'),
    ('destination_highlights', 'id'),
    ('destination_highlights', 'destination_id'),
    ('destination_highlights', 'display_order'),
    ('email_logs', 'id'),
    ('email_logs', 'related_record_id'),
    ('enquiries', 'id'),
    ('faqs', 'id'),
    ('faqs', 'display_order'),
    ('journey_ideas', 'id'),
    ('journey_ideas', 'destination_id'),
    ('journey_ideas', 'display_order'),
    ('newsletter_subscribers', 'id'),
    ('services', 'id'),
    ('services', 'display_order'),
    ('site_settings', 'id'),
    ('stories', 'id'),
    ('stories', 'display_order'),
    ('testimonials', 'id'),
    ('testimonials', 'display_order'),
}

ESCAPE_MAP = {
    'n': '\n',
    'r': '\r',
    't': '\t',
    '\\': '\\',
    '0': '\0',
    "'": "'",
    '"': '"',
}

def unescape_mysql_tsv_value(val):
    """Decodes MySQL Shell TSV escaping and converts \\N to None."""
    if val == r'\N':
        return None
    return re.sub(r'\\(.)', lambda m: ESCAPE_MAP.get(m.group(1), m.group(1)), val)

def parse_and_convert_value(table_name, col_name, raw_val):
    """Decodes, unescapes, and type-casts a TSV field value."""
    val = unescape_mysql_tsv_value(raw_val)
    if val is None:
        return None

    # 1. Boolean conversion
    if (table_name, col_name) in BOOLEAN_COLUMNS:
        return val in ('1', 1, True, 't', 'true')

    # 2. Integer conversion
    if (table_name, col_name) in INTEGER_COLUMNS:
        try:
            return int(val)
        except ValueError:
            return None

    # 3. Datetime conversion
    if (table_name, col_name) in DATETIME_COLUMNS:
        try:
            return datetime.strptime(val, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            # Fallback for ISO or date strings
            try:
                return datetime.fromisoformat(val)
            except Exception:
                return val

    # 4. Standard string/text value
    return val

def load_backup_records_for_table(backup_dir, table_name):
    """Decompresses and parses records from MySQL Shell TSV for a single table."""
    meta_path = os.path.join(backup_dir, f'defaultdb@{table_name}.json')
    tsv_path = os.path.join(backup_dir, f'defaultdb@{table_name}@@0.tsv.zst')

    if not os.path.exists(meta_path) or not os.path.exists(tsv_path):
        raise FileNotFoundError(f"Missing backup files for table '{table_name}'")

    with open(meta_path, 'r', encoding='utf-8') as f:
        meta = json.load(f)
    columns = meta['options']['columns']

    dctx = zstd.ZstdDecompressor()
    with open(tsv_path, 'rb') as zf:
        with dctx.stream_reader(zf) as reader:
            raw_text = reader.read().decode('utf-8')

    lines = [l for l in raw_text.split('\n') if l.strip()]
    records = []

    for line_idx, line in enumerate(lines):
        parts = line.split('\t')
        if len(parts) != len(columns):
            raise ValueError(
                f"Row {line_idx+1} in table '{table_name}' column count mismatch: "
                f"expected {len(columns)}, got {len(parts)}"
            )
        record = {}
        for col_name, raw_val in zip(columns, parts):
            record[col_name] = parse_and_convert_value(table_name, col_name, raw_val)
        records.append(record)

    return columns, records

def get_target_engine():
    """Builds the PostgreSQL SQLAlchemy engine using POSTGRES_TEST_URL securely from .env."""
    dotenv_path = os.path.join(PROJECT_ROOT, '.env')
    load_dotenv(dotenv_path)

    pg_url = os.environ.get('POSTGRES_TEST_URL')
    if not pg_url:
        raise ValueError("POSTGRES_TEST_URL is not set in .env")

    # Normalize driver scheme to postgresql+psycopg2://
    if pg_url.startswith('postgres://'):
        pg_url = pg_url.replace('postgres://', 'postgresql+psycopg2://', 1)
    elif pg_url.startswith('postgresql://'):
        pg_url = pg_url.replace('postgresql://', 'postgresql+psycopg2://', 1)

    connect_args = {'sslmode': 'require'}
    engine = create_engine(
        pg_url,
        connect_args=connect_args,
        pool_recycle=280,
        pool_pre_ping=True
    )
    return engine

def run_pre_migration_checks(backup_dir, engine):
    """Step 2: Pre-migration validation before any DDL or data changes."""
    print("=" * 70)
    print("STEP 2: PRE-MIGRATION AUDIT & VALIDATION")
    print("=" * 70)

    # 1. Target database & version check
    with engine.connect() as conn:
        pg_version = conn.execute(text("SELECT version();")).scalar()
        cur_db = conn.execute(text("SELECT current_database();")).scalar()
        cur_user = conn.execute(text("SELECT current_user;")).scalar()
        public_table_count = conn.execute(
            text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
        ).scalar()

    print(f"[CHECK 1/6] Target Server   : {pg_version.split(',')[0]}")
    if "PostgreSQL 18" not in pg_version:
        raise RuntimeError(f"Target is not PostgreSQL 18: {pg_version}")

    print(f"[CHECK 2/6] Target Database : {cur_db} (User: {cur_user})")
    if cur_db != 'defaultdb':
        raise RuntimeError(f"Target database is '{cur_db}', expected 'defaultdb'")

    print(f"[CHECK 3/6] Public Schema   : {public_table_count} tables existing")
    if public_table_count > 0:
        raise RuntimeError(
            f"Protection Check Failed: Target public schema is NOT empty ({public_table_count} tables exist). "
            "Aborting to avoid overwriting existing data."
        )

    # 4. Source backup file check
    print(f"[CHECK 4/6] Backup Directory : Verifying all 17 tables in '{backup_dir}'...")
    total_backup_rows = 0
    all_table_records = {}

    for tbl in TABLE_MIGRATION_ORDER:
        cols, records = load_backup_records_for_table(backup_dir, tbl)
        all_table_records[tbl] = (cols, records)
        total_backup_rows += len(records)
        print(f"             - {tbl:30s}: {len(records):3d} rows, {len(cols):2d} cols")

    # 5. Row count verification
    print(f"[CHECK 5/6] Total Records   : {total_backup_rows} rows loaded and decoded")
    if total_backup_rows != 586:
        raise RuntimeError(f"Total row count {total_backup_rows} does not match expected 586 rows")

    # 6. Model column parity check
    print("[CHECK 6/6] Model Parity    : Comparing model metadata with backup columns...")
    metadata_tables = db.metadata.tables
    for tbl in TABLE_MIGRATION_ORDER:
        if tbl not in metadata_tables:
            raise RuntimeError(f"Table '{tbl}' is missing from SQLAlchemy metadata!")
        model_cols = set(metadata_tables[tbl].columns.keys())
        backup_cols = set(all_table_records[tbl][0])
        if model_cols != backup_cols:
            diff_missing = backup_cols - model_cols
            diff_extra = model_cols - backup_cols
            raise RuntimeError(
                f"Column mismatch on '{tbl}': missing in model={diff_missing}, extra in model={diff_extra}"
            )

    print("\n[PRE-MIGRATION SUCCESS] All 6 verification checks PASSED.")
    print("=" * 70)
    return all_table_records

def execute_migration(backup_dir, check_only=False):
    """Executes schema creation, data loading, sequence resets, and post-audit."""
    engine = get_target_engine()

    try:
        # Run Pre-migration checks
        all_table_records = run_pre_migration_checks(backup_dir, engine)

        if check_only:
            print("\n[CHECK ONLY MODE] Pre-migration checks complete. Exiting without modifying database.")
            return True

        print("\n" + "=" * 70)
        print("STEP 3: POSTGRESQL SCHEMA INITIALIZATION")
        print("=" * 70)

        # Create all 17 tables from SQLAlchemy metadata
        print("[SCHEMA] Generating PostgreSQL DDL from SQLAlchemy metadata...")
        db.metadata.create_all(engine)
        print("[SCHEMA] All 17 tables created successfully in public schema.")

        print("\n" + "=" * 70)
        print("STEP 4: CONTROLLED DATA INSERTION (SINGLE TRANSACTION)")
        print("=" * 70)

        # Execute data loading in a single transaction
        with engine.begin() as conn:
            for tbl_name in TABLE_MIGRATION_ORDER:
                cols, records = all_table_records[tbl_name]
                table_obj = db.metadata.tables[tbl_name]

                if not records:
                    print(f"[DATA LOAD] {tbl_name:30s}: 0 rows (table created clean).")
                    continue

                # Execute parameterized bulk insert using SQLAlchemy Core
                conn.execute(table_obj.insert(), records)
                print(f"[DATA LOAD] {tbl_name:30s}: {len(records):3d} rows successfully inserted.")

            print("\n" + "=" * 70)
            print("STEP 5: POSTGRESQL SEQUENCE SYNCHRONIZATION")
            print("=" * 70)

            # Synchronize all 16 sequential tables
            for tbl_name in TABLE_MIGRATION_ORDER:
                if tbl_name == 'destination_categories':
                    # Composite primary key without sequence
                    continue

                # Unified conditional query:
                # If table populated -> set to MAX(id) with is_called = true (next insert = max + 1)
                # If table empty -> set to 1 with is_called = false (next insert = 1)
                seq_query = text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{tbl_name}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {tbl_name}), 1),
                        (SELECT MAX(id) IS NOT NULL FROM {tbl_name})
                    );
                """)
                new_seq_val = conn.execute(seq_query).scalar()
                print(f"[SEQUENCE]  {tbl_name:30s}: id sequence synchronized to {new_seq_val}")

            print("\n[TRANSACTION] All 586 rows inserted and 16 sequences synchronized.")
            print("[TRANSACTION] Committing transaction to Aiven PostgreSQL...")

        print("\n" + "=" * 70)
        print("STEP 6: POST-MIGRATION DATA INTEGRITY AUDIT")
        print("=" * 70)

        total_live_rows = 0
        with engine.connect() as conn:
            for tbl_name in TABLE_MIGRATION_ORDER:
                cnt = conn.execute(text(f"SELECT count(*) FROM {tbl_name};")).scalar()
                total_live_rows += cnt
                print(f"[AUDIT]     {tbl_name:30s}: {cnt:3d} rows verified in PostgreSQL")

        print(f"\n[AUDIT TOTAL] Total live records in PostgreSQL: {total_live_rows} / 586 expected.")
        if total_live_rows != 586:
            raise RuntimeError(f"Post-migration audit failed: found {total_live_rows} rows, expected 586!")

        print("\n" + "=" * 70)
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n[MIGRATION FAILED] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()
        print("[DISPOSE] Database connection pool disposed cleanly.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Migrate MySQL Shell backup to Aiven PostgreSQL.")
    parser.add_argument('--check-only', action='store_true', help="Run pre-migration checks only without altering database.")
    args = parser.parse_args()

    backup_directory = os.path.join(PROJECT_ROOT, 'migration-backup')
    success = execute_migration(backup_directory, check_only=args.check_only)
    sys.exit(0 if success else 1)
