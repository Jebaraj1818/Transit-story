"""
Migration Script: Local MySQL (transit_story_db) -> Production Aiven MySQL (defaultdb)
Strict adherence to safety rules:
- Read-only on local DB.
- Preserves original primary keys and foreign key relationships.
- Does NOT migrate admins, tokens, test enquiries, or test email logs.
- Does NOT copy test blob URLs in site_settings.
- Transactional with rollback on error.
- Updates AUTO_INCREMENT on all target tables.
"""

import os
import sys
from urllib.parse import urlparse
from dotenv import load_dotenv
import pymysql

load_dotenv()

def run_migration():
    print("==================================================")
    print("THE TRANSIT STORY: PRODUCTION CONTENT MIGRATION")
    print("==================================================")

    # 1. Connect to Local MySQL
    try:
        local_conn = pymysql.connect(
            host=os.environ.get('DB_HOST', '127.0.0.1'),
            port=int(os.environ.get('DB_PORT', 3306)),
            user=os.environ.get('DB_USER', 'root'),
            password=os.environ.get('DB_PASSWORD', 'root'),
            database=os.environ.get('DB_NAME', 'transit_story_db'),
            charset='utf8mb4'
        )
        print("[SOURCE] Connected to Local MySQL (transit_story_db)")
    except Exception as e:
        print(f"[FATAL] Failed to connect to Local MySQL: {e}")
        sys.exit(1)

    # 2. Connect to Aiven MySQL
    aiven_url = os.environ.get('DATABASE_URL')
    if not aiven_url:
        print("[FATAL] DATABASE_URL is not set in environment.")
        sys.exit(1)

    p = urlparse(aiven_url)
    try:
        aiven_conn = pymysql.connect(
            host=p.hostname,
            port=p.port,
            user=p.username,
            password=p.password,
            database=p.path.lstrip('/'),
            charset='utf8mb4',
            ssl={'ssl_mode': 'REQUIRED'},
            autocommit=False
        )
        print(f"[TARGET] Connected to Aiven MySQL ({p.hostname}:{p.port}/{p.path.lstrip('/')})")
    except Exception as e:
        print(f"[FATAL] Failed to connect to Aiven MySQL: {e}")
        sys.exit(1)

    cur_loc = local_conn.cursor(pymysql.cursors.DictCursor)
    cur_aiv = aiven_conn.cursor(pymysql.cursors.DictCursor)

    try:
        # Pre-flight checks on Aiven
        print("\n--- PRE-FLIGHT VERIFICATION ---")
        cur_aiv.execute("SELECT id, email, role FROM admins;")
        aiven_admins = cur_aiv.fetchall()
        print(f"Existing Aiven Admins: {aiven_admins}")
        if not any(a['email'] == 'jebaraj1364@gmail.com' and a['role'] == 'SUPER_ADMIN' for a in aiven_admins):
            raise RuntimeError("Protection Check Failed: Production SUPER_ADMIN (jebaraj1364@gmail.com) not found in Aiven!")

        # Content tables to migrate in strict dependency order
        # (Table name, primary key column)
        content_tables = [
            'categories',
            'destinations',
            'destination_highlights',
            'destination_experiences',
            'destination_gallery',
            'journey_ideas',
            'services',
            'faqs',
            'stories'
        ]

        # Verify all target content tables are currently empty
        for tbl in content_tables:
            cur_aiv.execute(f"SELECT COUNT(*) AS cnt FROM `{tbl}`;")
            cnt = cur_aiv.fetchone()['cnt']
            if cnt > 0:
                raise RuntimeError(f"Target table `{tbl}` already contains {cnt} rows! Migration aborted to avoid overwriting.")
            print(f"Table `{tbl}` is clean (0 rows) in Aiven.")

        print("\n--- EXECUTING MIGRATION ---")

        # 1. Migrate core content tables
        for tbl in content_tables:
            cur_loc.execute(f"SELECT * FROM `{tbl}` ORDER BY id ASC;")
            rows = cur_loc.fetchall()
            if not rows:
                print(f"[{tbl}] No rows to migrate.")
                continue

            columns = list(rows[0].keys())
            cols_joined = ", ".join([f"`{c}`" for c in columns])
            placeholders = ", ".join(["%s" for _ in columns])
            insert_sql = f"INSERT INTO `{tbl}` ({cols_joined}) VALUES ({placeholders});"

            val_list = [tuple(row[c] for c in columns) for row in rows]
            cur_aiv.executemany(insert_sql, val_list)
            print(f"[{tbl}] Successfully migrated {len(val_list)} rows.")

            # Update AUTO_INCREMENT
            cur_loc.execute(f"SELECT MAX(id) AS max_id FROM `{tbl}`;")
            max_id = cur_loc.fetchone()['max_id']
            if max_id:
                next_id = max_id + 1
                cur_aiv.execute(f"ALTER TABLE `{tbl}` AUTO_INCREMENT = {next_id};")
                print(f"[{tbl}] AUTO_INCREMENT reset to {next_id}.")

        # 2. Migrate site_settings (Filter out test Blob URLs)
        print("\n--- MIGRATING SITE SETTINGS ---")
        cur_loc.execute("SELECT * FROM site_settings ORDER BY id ASC;")
        settings_rows = cur_loc.fetchall()
        
        migrated_settings = []
        excluded_settings = []

        for s in settings_rows:
            key = s['setting_key']
            val = s['setting_value'] or ''
            
            # Identify test-only mock blob URLs
            if 'blob.vercel-storage.com' in val:
                excluded_settings.append((key, val))
            else:
                migrated_settings.append(s)

        if migrated_settings:
            columns = list(migrated_settings[0].keys())
            cols_joined = ", ".join([f"`{c}`" for c in columns])
            placeholders = ", ".join(["%s" for _ in columns])
            insert_sql = f"INSERT INTO `site_settings` ({cols_joined}) VALUES ({placeholders});"

            val_list = [tuple(s[c] for c in columns) for s in migrated_settings]
            cur_aiv.executemany(insert_sql, val_list)
            print(f"[site_settings] Successfully migrated {len(val_list)} legitimate settings.")

            cur_loc.execute("SELECT MAX(id) AS max_id FROM `site_settings`;")
            max_id = cur_loc.fetchone()['max_id']
            if max_id:
                cur_aiv.execute(f"ALTER TABLE `site_settings` AUTO_INCREMENT = {max_id + 1};")

        print(f"[site_settings] Excluded {len(excluded_settings)} test blob settings:")
        for k, v in excluded_settings:
            print(f"   - {k}: {v}")

        # Commit transaction
        aiven_conn.commit()
        print("\n[SUCCESS] Transaction committed successfully to Aiven MySQL!")

    except Exception as e:
        aiven_conn.rollback()
        print(f"\n[ERROR] Migration failed: {e}")
        print("[ROLLBACK] All changes rolled back. Aiven database remains untouched.")
        sys.exit(1)
    finally:
        cur_loc.close()
        cur_aiv.close()
        local_conn.close()
        aiven_conn.close()

if __name__ == '__main__':
    run_migration()
