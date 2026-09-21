"""
==============================================================================
TEST MEDIA SAFE CLEANUP & AUDIT
==============================================================================
Tests safe replacement cleanup for Admin media uploads:
A. Upload new Hero Photo 2 -> save -> verify new image works.
B. Replace Hero Photo 2 again -> verify previous Blob is cleaned up safely.
C. Use Default -> restore local fallback asset, clean up previous Blob.
D. Shared/reused media -> verify shared Blob is NEVER deleted.
E. Existing /admin/api/media/delete endpoint -> verify reference protections.
F. Upload failure safety -> verify rollback preserves setting and cleans up orphan.
G. Storage audit endpoint -> verify non-destructive media audit.
==============================================================================
"""

import unittest
from unittest.mock import patch, MagicMock
from backend.app import app
from backend.db import db
from backend.models import Admin, SiteSetting, Destination, DestinationGallery
from backend.config import Config
from backend.services.storage_service import (
    is_blob_url, get_media_references, is_media_referenced,
    safe_cleanup_unused_blob, delete_blob, audit_storage
)

class MediaSafeCleanupTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.client.get('/admin/logout')

        self.admin = Admin.query.filter_by(email="test_media_admin@thetransitstory.com").first()
        if not self.admin:
            self.admin = Admin(
                name="Test Media Admin",
                email="test_media_admin@thetransitstory.com",
                role="ADMIN",
                is_active=True
            )
            db.session.add(self.admin)
        self.admin.is_active = True
        self.admin.set_password("MediaPass2026!")
        db.session.commit()

        # Save original SiteSetting values to restore after test
        self.original_settings = {}
        for s in SiteSetting.query.all():
            self.original_settings[s.setting_key] = s.setting_value

    def tearDown(self):
        # Restore original SiteSetting values
        try:
            for k, val in self.original_settings.items():
                s = SiteSetting.query.filter_by(setting_key=k).first()
                if s:
                    s.setting_value = val
                else:
                    db.session.add(SiteSetting(setting_key=k, setting_value=val))
            db.session.commit()
        except Exception:
            db.session.rollback()

        self.client.get('/admin/logout')
        self.ctx.pop()

    def _login(self):
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

    # --------------------------------------------------------------------------
    # Test A: Upload new Hero Photo 2 -> save -> verify new image works
    # --------------------------------------------------------------------------
    def test_a_upload_new_hero_photo_2_and_save(self):
        self._login()
        blob_url_a = "https://test.public.blob.vercel-storage.com/homepage/hero/hero_test_a.jpg"

        with patch('backend.routes.admin.safe_cleanup_unused_blob') as mock_cleanup:
            res = self.client.post('/admin/site-settings', data={
                'homepage_hero_photo_2': blob_url_a
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Verify public API returns the new URL
            api_res = self.client.get('/api/site-settings')
            self.assertEqual(api_res.status_code, 200)
            data = api_res.get_json()
            self.assertEqual(data.get('homepage_hero_photo_2'), blob_url_a)

    # --------------------------------------------------------------------------
    # Test B: Replace Hero Photo 2 again -> verify previous Blob is handled safely
    # --------------------------------------------------------------------------
    def test_b_replace_hero_photo_2_again_safe_cleanup(self):
        self._login()
        blob_url_a = "https://test.public.blob.vercel-storage.com/homepage/hero/hero_test_a.jpg"
        blob_url_b = "https://test.public.blob.vercel-storage.com/homepage/hero/hero_test_b.jpg"

        # Step 1: Set to blob_url_a
        s2 = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_2').first()
        if not s2:
            s2 = SiteSetting(setting_key='homepage_hero_photo_2', setting_value=blob_url_a)
            db.session.add(s2)
        else:
            s2.setting_value = blob_url_a
        db.session.commit()

        # Step 2: Replace with blob_url_b
        with patch('backend.services.storage_service.delete_blob', return_value=(True, "Deleted")) as mock_delete:
            res = self.client.post('/admin/site-settings', data={
                'homepage_hero_photo_2': blob_url_b
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Verify blob_url_a was deleted because it's no longer referenced
            mock_delete.assert_called_with(blob_url_a)

            # Verify new setting is blob_url_b
            api_res = self.client.get('/api/site-settings')
            data = api_res.get_json()
            self.assertEqual(data.get('homepage_hero_photo_2'), blob_url_b)

    # --------------------------------------------------------------------------
    # Test C: Use Default -> verify default image works & old blob is deleted
    # --------------------------------------------------------------------------
    def test_c_use_default_restores_default_and_cleans_up_blob(self):
        self._login()
        blob_url = "https://test.public.blob.vercel-storage.com/homepage/hero/hero_to_default.jpg"
        default_local = "/images/hero/hero-video-poster.jpg"

        # Set existing setting to blob
        s2 = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_2').first()
        if not s2:
            s2 = SiteSetting(setting_key='homepage_hero_photo_2', setting_value=blob_url)
            db.session.add(s2)
        else:
            s2.setting_value = blob_url
        db.session.commit()

        with patch('backend.services.storage_service.delete_blob', return_value=(True, "Deleted")) as mock_delete:
            # Click "Use Default" -> submits local path
            res = self.client.post('/admin/site-settings', data={
                'homepage_hero_photo_2': default_local
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Old blob should be deleted
            mock_delete.assert_called_with(blob_url)

            # Setting should now be the default local path
            api_res = self.client.get('/api/site-settings')
            data = api_res.get_json()
            self.assertEqual(data.get('homepage_hero_photo_2'), default_local)

            # Local asset must NEVER be passed to delete_blob
            for call in mock_delete.call_args_list:
                arg = call[0][0]
                self.assertFalse(arg.startswith('/images/'))

    # --------------------------------------------------------------------------
    # Test D: Shared / reused media is NOT deleted
    # --------------------------------------------------------------------------
    def test_d_shared_media_is_not_deleted(self):
        self._login()
        shared_blob = "https://test.public.blob.vercel-storage.com/shared_hero_photo.jpg"
        new_blob = "https://test.public.blob.vercel-storage.com/brand_new_hero.jpg"

        # Shared between photo 1 and photo 2
        s1 = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_1').first()
        if s1:
            s1.setting_value = shared_blob
        else:
            db.session.add(SiteSetting(setting_key='homepage_hero_photo_1', setting_value=shared_blob))

        s2 = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_2').first()
        if s2:
            s2.setting_value = shared_blob
        else:
            db.session.add(SiteSetting(setting_key='homepage_hero_photo_2', setting_value=shared_blob))
        db.session.commit()

        with patch('backend.services.storage_service.delete_blob', return_value=(True, "Deleted")) as mock_delete:
            # Replace photo 2 only
            res = self.client.post('/admin/site-settings', data={
                'homepage_hero_photo_1': shared_blob,
                'homepage_hero_photo_2': new_blob
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Shared blob must NOT be deleted because photo 1 still references it!
            mock_delete.assert_not_called()

    # --------------------------------------------------------------------------
    # Test E: Existing /admin/api/media/delete endpoint safety
    # --------------------------------------------------------------------------
    def test_e_media_delete_endpoint_protections(self):
        self._login()
        referenced_blob = "https://test.public.blob.vercel-storage.com/in_use.jpg"
        unreferenced_blob = "https://test.public.blob.vercel-storage.com/orphan.jpg"

        # Create setting referencing the blob
        s = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_1').first()
        if s:
            s.setting_value = referenced_blob
        else:
            db.session.add(SiteSetting(setting_key='homepage_hero_photo_1', setting_value=referenced_blob))
        db.session.commit()

        # 1. Attempt to delete actively referenced asset -> HTTP 409 Conflict
        res = self.client.post('/admin/api/media/delete', json={'url': referenced_blob})
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertFalse(data['success'])
        self.assertIn('actively referenced', data['message'])

        # 2. Delete unreferenced asset -> Allowed
        with patch('backend.routes.admin.delete_blob', return_value=(True, "File deleted from Vercel Blob.")) as mock_del:
            res2 = self.client.post('/admin/api/media/delete', json={'url': unreferenced_blob})
            self.assertEqual(res2.status_code, 200)
            mock_del.assert_called_with(unreferenced_blob)

        # 3. Attempt to delete local asset -> Rejected
        with patch.object(Config, 'BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_teststore_token123'):
            res3 = self.client.post('/admin/api/media/delete', json={'url': '/images/hero/hero01.jpg'})
            self.assertEqual(res3.status_code, 400)
            self.assertIn('Cannot delete local static media assets', res3.get_json()['message'])

    # --------------------------------------------------------------------------
    # Test F: Upload failure safety (DB error rolls back & cleans up new blob)
    # --------------------------------------------------------------------------
    def test_f_upload_failure_safety(self):
        self._login()
        existing_blob = "https://test.public.blob.vercel-storage.com/keep_me.jpg"
        new_failed_blob = "https://test.public.blob.vercel-storage.com/failed_upload.jpg"

        s2 = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_2').first()
        if s2:
            s2.setting_value = existing_blob
        else:
            db.session.add(SiteSetting(setting_key='homepage_hero_photo_2', setting_value=existing_blob))
        db.session.commit()

        with patch('backend.routes.admin.db.session.commit', side_effect=Exception("Database connection lost")):
            with patch('backend.routes.admin.safe_cleanup_unused_blob') as mock_cleanup:
                res = self.client.post('/admin/site-settings', data={
                    'homepage_hero_photo_2': new_failed_blob
                }, follow_redirects=True)
                self.assertEqual(res.status_code, 200)

                # The new failed blob should be passed to cleanup so it doesn't remain orphaned
                mock_cleanup.assert_called_with(new_failed_blob)

        # Existing setting should remain untouched (preserved)
        db.session.rollback()
        s2_check = SiteSetting.query.filter_by(setting_key='homepage_hero_photo_2').first()
        self.assertEqual(s2_check.setting_value, existing_blob)

    # --------------------------------------------------------------------------
    # Test G: Storage audit endpoint
    # --------------------------------------------------------------------------
    def test_g_storage_audit_endpoint(self):
        self._login()
        res = self.client.get('/admin/api/media/audit')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        audit = data['audit']
        self.assertIn('db_media', audit)
        self.assertIn('local_files', audit)
        self.assertIn('blob_audit', audit)
        self.assertGreater(audit['local_files_count'], 0)


if __name__ == '__main__':
    unittest.main()
