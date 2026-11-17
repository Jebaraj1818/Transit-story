"""
Pytest configuration for The Transit Story backend test suite.
Ensures 100% database isolation using a temporary SQLite test database.
"""

import pytest
import backend.tests.test_setup

@pytest.fixture(autouse=True)
def ensure_isolated_database():
    """Safety assertion run before every test to guarantee live database is never contacted."""
    from backend.app import app
    uri = str(app.config.get('SQLALCHEMY_DATABASE_URI', '')).lower()
    assert 'sqlite' in uri, f"CRITICAL TEST ISOLATION FAILURE: Test attempted to run against non-SQLite database: {uri}"
    assert 'aivencloud.com' not in uri, f"CRITICAL TEST ISOLATION FAILURE: Test attempted to contact live Aiven database: {uri}"
