import os
import unittest
from unittest.mock import patch, MagicMock
import backend.tests.test_setup

class DatabaseCompatibilityTestCase(unittest.TestCase):
    """Test suite for dual-database (MySQL & PostgreSQL) backend configuration and dialect handling."""

    def tearDown(self):
        # Restore backend.config to the active test configuration
        import importlib
        import backend.config
        importlib.reload(backend.config)

    def test_01_postgresql_url_normalization_postgres_prefix(self):
        """postgres:// scheme is automatically normalized to postgresql+psycopg2://"""
        env = {
            'DATABASE_URL': 'postgres://avnadmin:fake_pass@pg-host.aivencloud.com:25408/defaultdb?sslmode=require',
            'DB_SSL_MODE': 'REQUIRED'
        }
        with patch.dict(os.environ, env, clear=False):
            # Re-evaluate Config class dynamically
            import importlib
            import backend.config
            importlib.reload(backend.config)
            cfg = backend.config.Config

            self.assertTrue(cfg.SQLALCHEMY_DATABASE_URI.startswith('postgresql+psycopg2://'))
            self.assertIn('@pg-host.aivencloud.com:25408/defaultdb', cfg.SQLALCHEMY_DATABASE_URI)
            # Verify psycopg2-compatible SSL argument
            connect_args = cfg.SQLALCHEMY_ENGINE_OPTIONS.get('connect_args', {})
            self.assertEqual(connect_args.get('sslmode'), 'require')
            self.assertNotIn('ssl', connect_args)

    def test_02_postgresql_url_normalization_postgresql_prefix(self):
        """postgresql:// scheme is standardized to postgresql+psycopg2://"""
        env = {
            'DATABASE_URL': 'postgresql://avnadmin:fake_pass@pg-host.aivencloud.com:25408/defaultdb?sslmode=require',
        }
        with patch.dict(os.environ, env, clear=False):
            import importlib
            import backend.config
            importlib.reload(backend.config)
            cfg = backend.config.Config

            self.assertTrue(cfg.SQLALCHEMY_DATABASE_URI.startswith('postgresql+psycopg2://'))
            connect_args = cfg.SQLALCHEMY_ENGINE_OPTIONS.get('connect_args', {})
            self.assertEqual(connect_args.get('sslmode'), 'require')

    def test_03_mysql_url_and_ssl_preserved(self):
        """mysql:// scheme is converted to mysql+pymysql:// with PyMySQL-style nested ssl dict"""
        env = {
            'DATABASE_URL': 'mysql://avnadmin:fake_pass@mysql-host.aivencloud.com:3306/defaultdb?ssl_mode=REQUIRED',
            'DB_SSL_MODE': 'REQUIRED'
        }
        with patch.dict(os.environ, env, clear=False):
            import importlib
            import backend.config
            importlib.reload(backend.config)
            cfg = backend.config.Config

            self.assertTrue(cfg.SQLALCHEMY_DATABASE_URI.startswith('mysql+pymysql://'))
            connect_args = cfg.SQLALCHEMY_ENGINE_OPTIONS.get('connect_args', {})
            self.assertIn('ssl', connect_args)
            self.assertEqual(connect_args['ssl'].get('ssl_mode'), 'REQUIRED')

    def test_04_local_mysql_fallback_preserved(self):
        """When DATABASE_URL is unset, local MySQL URI is used with PyMySQL"""
        env = {
            'DB_HOST': '127.0.0.1',
            'DB_PORT': '3306',
            'DB_USER': 'root',
            'DB_PASSWORD': 'password123',
            'DB_NAME': 'transit_story_db'
        }
        # Explicitly remove DATABASE_URL and prevent reload from repopulating from .env
        with patch.dict(os.environ, env, clear=False), patch('dotenv.load_dotenv'):
            if 'DATABASE_URL' in os.environ:
                del os.environ['DATABASE_URL']
            import importlib
            import backend.config
            importlib.reload(backend.config)
            cfg = backend.config.Config

            self.assertTrue(cfg.SQLALCHEMY_DATABASE_URI.startswith('mysql+pymysql://'))
            self.assertIn('password123@127.0.0.1:3306/transit_story_db', cfg.SQLALCHEMY_DATABASE_URI)

    def test_05_ensure_database_exists_skips_when_database_url_present(self):
        """ensure_database_exists() exits immediately without importing pymysql when DATABASE_URL is set"""
        env = {
            'DATABASE_URL': 'postgresql+psycopg2://avnadmin:fake_pass@pg-host.aivencloud.com:25408/defaultdb'
        }
        with patch.dict(os.environ, env, clear=False):
            import importlib
            import backend.config
            importlib.reload(backend.config)
            # Should return without exception and without attempting pymysql.connect
            with patch('pymysql.connect') as mock_connect:
                backend.config.ensure_database_exists()
                mock_connect.assert_not_called()

    def test_06_health_check_endpoint_reports_dialect(self):
        """Health check endpoint dynamically reports the active database dialect"""
        from backend.app import app
        with app.test_client() as client:
            res = client.get('/health')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn('database', data)
            self.assertIn(data['database'], ['MySQL', 'PostgreSQL', 'Sqlite', 'Unknown'])

if __name__ == '__main__':
    unittest.main()
