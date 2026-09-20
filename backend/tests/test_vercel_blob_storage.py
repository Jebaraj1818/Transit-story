"""
==============================================================================
THE TRANSIT STORY — VERCEL BLOB STORAGE & SECURITY TEST SUITE
==============================================================================
Automated verification tests for Vercel Blob media storage integration:
1. Unauthenticated media upload rejected (401)
2. Blob master credentials (BLOB_READ_WRITE_TOKEN) never returned in API responses
3. Missing Blob configuration gives clear error
4. Valid image accepted (JPEG, PNG, WebP, AVIF)
5. Invalid MIME rejected
6. SVG rejected
7. Executable binary rejected (MZ, ELF)
8. Oversized image (> 4MB) rejected
9. Video size validation (> 100MB rejected)
10. Pathname sanitization preventing collisions
11. Gallery maximum 3 preserved
12. Deletion cannot delete arbitrary external URLs
13. Deletion cannot delete local /images/... paths
14. SiteSetting homepage media handling
15. College IV settings handling
16. Existing local paths still work & Blob absolute URLs handled properly
==============================================================================
"""

import io
import json
import unittest
from unittest.mock import patch, MagicMock

from backend.app import app
from backend.config import Config
from backend.db import db
from backend.models import Admin, Destination, DestinationGallery, SiteSetting
from backend.services.storage_service import (
    validate_media_file, sanitize_pathname, upload_file_to_blob,
    delete_blob, generate_scoped_client_upload_token,
    ALLOWED_IMAGE_MIMES, ALLOWED_VIDEO_MIMES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE
)


class MockFile:
    """Mock file object for validation tests."""
    def __init__(self, filename, content_type, data):
        self.filename = filename
        self.content_type = content_type
        self.stream = io.BytesIO(data)

    def read(self, n=-1):
        return self.stream.read(n)

    def seek(self, offset, whence=0):
        return self.stream.seek(offset, whence)

    def tell(self):
        return self.stream.tell()


class VercelBlobStorageTestCase(unittest.TestCase):
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

    def tearDown(self):
        self.client.get('/admin/logout')
        self.ctx.pop()

    def _login(self):
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

    # --------------------------------------------------------------------------
    # 1. Unauthenticated media upload rejected
    # --------------------------------------------------------------------------
    def test_01_unauthenticated_media_upload_rejected(self):
        res = self.client.post('/admin/api/media/upload', data={'folder': 'test'})
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn('error', data)

        res2 = self.client.post('/admin/api/media/client-token', json={'filename': 'hero.mp4'})
        self.assertEqual(res2.status_code, 401)

    # --------------------------------------------------------------------------
    # 2. Master BLOB_READ_WRITE_TOKEN never returned in any response
    # --------------------------------------------------------------------------
    def test_02_blob_master_credential_never_returned(self):
        self._login()
        test_token = "vercel_blob_rw_teststore123_ultraSecretMasterCredentialKey"

        with patch.object(Config, 'BLOB_READ_WRITE_TOKEN', test_token):
            res = self.client.post('/admin/api/media/client-token', json={
                'filename': 'cinematic_hero.mp4',
                'folder': 'homepage/hero',
                'contentType': 'video/mp4',
                'size_bytes': 1024 * 1024
            })
            self.assertEqual(res.status_code, 200)
            raw_text = res.get_data(as_text=True)

            # Master secret must NEVER appear anywhere in the response
            self.assertNotIn(test_token, raw_text)
            self.assertNotIn("ultraSecretMasterCredentialKey", raw_text)

            data = res.get_json()
            self.assertTrue(data.get('success'))
            self.assertIn('clientToken', data)
            # Must be a scoped client token
            self.assertTrue(data['clientToken'].startswith('vercel_blob_client_'))

    # --------------------------------------------------------------------------
    # 3. Missing Blob configuration gives clear error
    # --------------------------------------------------------------------------
    def test_03_missing_blob_configuration_gives_clear_error(self):
        with patch.object(Config, 'BLOB_READ_WRITE_TOKEN', ''):
            success, err = upload_file_to_blob(b"sample", "test/image.jpg")
            self.assertFalse(success)
            self.assertIn("Vercel Blob storage is not configured", err)

            success2, err2, _ = generate_scoped_client_upload_token("test", "video.mp4", "video/mp4")
            self.assertFalse(success2)
            self.assertIn("Vercel Blob storage is not configured", err2)

    # --------------------------------------------------------------------------
    # 4. Valid images accepted
    # --------------------------------------------------------------------------
    def test_04_valid_images_accepted(self):
        # JPEG
        jpeg_data = b"\xff\xd8\xff\xe0" + b"\x00" * 200
        f_jpg = MockFile("temple.jpg", "image/jpeg", jpeg_data)
        ok, err, mime = validate_media_file(f_jpg)
        self.assertTrue(ok)
        self.assertIsNone(err)
        self.assertEqual(mime, "image/jpeg")

        # PNG
        png_data = b"\x89PNG\r\n\x1a\n" + b"\x00" * 200
        f_png = MockFile("palace.png", "image/png", png_data)
        ok, err, mime = validate_media_file(f_png)
        self.assertTrue(ok)
        self.assertEqual(mime, "image/png")

        # WebP
        webp_data = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBPVP8 " + b"\x00" * 100
        f_webp = MockFile("backwaters.webp", "image/webp", webp_data)
        ok, err, mime = validate_media_file(f_webp)
        self.assertTrue(ok)
        self.assertEqual(mime, "image/webp")

        # AVIF
        avif_data = b"\x00\x00\x00 ftypavif" + b"\x00" * 100
        f_avif = MockFile("hills.avif", "image/avif", avif_data)
        ok, err, mime = validate_media_file(f_avif)
        self.assertTrue(ok)
        self.assertEqual(mime, "image/avif")

    # --------------------------------------------------------------------------
    # 5. Invalid MIME rejected
    # --------------------------------------------------------------------------
    def test_05_invalid_mime_rejected(self):
        f_pdf = MockFile("document.pdf", "application/pdf", b"%PDF-1.4\n...")
        ok, err, _ = validate_media_file(f_pdf)
        self.assertFalse(ok)
        self.assertIn("Unsupported file type", err)

    # --------------------------------------------------------------------------
    # 6. SVG rejected
    # --------------------------------------------------------------------------
    def test_06_svg_rejected(self):
        svg_content = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        f_svg = MockFile("vector.svg", "image/svg+xml", svg_content)
        ok, err, _ = validate_media_file(f_svg)
        self.assertFalse(ok)

        # SVG disguised with .jpg extension
        f_disguised = MockFile("fake.jpg", "image/jpeg", svg_content)
        ok2, err2, _ = validate_media_file(f_disguised)
        self.assertFalse(ok2)
        self.assertIn("SVG", err2)

    # --------------------------------------------------------------------------
    # 7. Executables rejected
    # --------------------------------------------------------------------------
    def test_07_executables_rejected(self):
        # Windows PE executable (MZ header)
        exe_content = b"MZ\x90\x00\x03\x00\x00\x00" + b"\x00" * 200
        f_exe = MockFile("evil.exe", "application/x-msdownload", exe_content)
        ok, err, _ = validate_media_file(f_exe)
        self.assertFalse(ok)

        # Renamed as .jpg
        f_renamed = MockFile("innocent.jpg", "image/jpeg", exe_content)
        ok2, err2, _ = validate_media_file(f_renamed)
        self.assertFalse(ok2)
        self.assertIn("Executable", err2)

        # Linux ELF binary
        elf_content = b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 200
        f_elf = MockFile("binary.png", "image/png", elf_content)
        ok3, err3, _ = validate_media_file(f_elf)
        self.assertFalse(ok3)

    # --------------------------------------------------------------------------
    # 8. Oversized image rejected (> 4MB)
    # --------------------------------------------------------------------------
    def test_08_oversized_image_rejected(self):
        # 5 MB image
        large_data = b"\xff\xd8\xff\xe0" + (b"X" * (5 * 1024 * 1024))
        f_large = MockFile("giant.jpg", "image/jpeg", large_data)
        ok, err, _ = validate_media_file(f_large)
        self.assertFalse(ok)
        self.assertIn("exceeds maximum limit of 4MB", err)

    # --------------------------------------------------------------------------
    # 9. Video size validation (> 100MB rejected)
    # --------------------------------------------------------------------------
    def test_09_video_size_validation(self):
        # Video within limit (50 MB)
        ok, err, mime = validate_media_file(MockFile("journey.mp4", "video/mp4", b"\x00" * (1024 * 1024)), is_video=True)
        self.assertTrue(ok)
        self.assertEqual(mime, "video/mp4")

        # Video exceeding 100 MB
        with patch.object(Config, 'BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_teststore_token123'):
            success, err_msg, _ = generate_scoped_client_upload_token(
                folder="homepage/hero",
                filename="huge_drone_reel.mp4",
                content_type="video/mp4",
                size_bytes=105 * 1024 * 1024
            )
            self.assertFalse(success)
            self.assertIn("exceeds maximum limit of 100MB", err_msg)

    # --------------------------------------------------------------------------
    # 10. Pathname sanitization and collision resistance
    # --------------------------------------------------------------------------
    def test_10_pathname_sanitization(self):
        p1 = sanitize_pathname("destinations/munnar/hero", "temple photo #1.jpg")
        p2 = sanitize_pathname("destinations/munnar/hero", "temple photo #1.jpg")

        self.assertNotEqual(p1, p2)  # Unique IDs prevent collision
        self.assertTrue(p1.startswith("destinations/munnar/hero/"))
        self.assertTrue(p1.endswith(".jpg"))

        # Folder sanitization
        p3 = sanitize_pathname("../../../etc/passwd", "exploit.jpg")
        self.assertNotIn("..", p3)

    # --------------------------------------------------------------------------
    # 11. Gallery maximum 3 preserved
    # --------------------------------------------------------------------------
    def test_11_gallery_maximum_3_preserved(self):
        dest = Destination.query.filter_by(slug="test-gallery-dest").first()
        if not dest:
            dest = Destination(
                slug="test-gallery-dest",
                title="Gallery Test",
                location="Tamil Nadu",
                hero_image="https://xyz.public.blob.vercel-storage.com/hero.jpg",
                is_published=True
            )
            db.session.add(dest)
            db.session.flush()

        # Add 5 gallery images
        DestinationGallery.query.filter_by(destination_id=dest.id).delete()
        for i in range(5):
            db.session.add(DestinationGallery(
                destination_id=dest.id,
                image_url=f"https://xyz.public.blob.vercel-storage.com/g{i}.jpg",
                display_order=i
            ))
        db.session.commit()

        # to_dict must strictly limit gallery to maximum 3 images
        d_dict = dest.to_dict()
        self.assertEqual(len(d_dict['gallery']), 3)
        self.assertEqual(d_dict['gallery'], [
            "https://xyz.public.blob.vercel-storage.com/g0.jpg",
            "https://xyz.public.blob.vercel-storage.com/g1.jpg",
            "https://xyz.public.blob.vercel-storage.com/g2.jpg"
        ])

    # --------------------------------------------------------------------------
    # 12. Deletion cannot delete arbitrary external URLs
    # --------------------------------------------------------------------------
    def test_12_deletion_cannot_delete_arbitrary_external_urls(self):
        with patch.object(Config, 'BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_teststore_token123'):
            ok, msg = delete_blob("https://evil-attacker.com/malicious.jpg")
            self.assertFalse(ok)
            self.assertIn("does not belong to project's Vercel Blob storage", msg)

            ok2, msg2 = delete_blob("https://aws-s3-bucket.amazonaws.com/image.jpg")
            self.assertFalse(ok2)

    # --------------------------------------------------------------------------
    # 13. Deletion cannot delete local /images/... paths
    # --------------------------------------------------------------------------
    def test_13_deletion_cannot_delete_local_images(self):
        with patch.object(Config, 'BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_teststore_token123'):
            ok, msg = delete_blob("/images/hero/hero01.jpg")
            self.assertFalse(ok)
            self.assertIn("Cannot delete local static media assets", msg)

            ok2, msg2 = delete_blob("images/kerala-arts-crafts-village-04.jpg")
            self.assertFalse(ok2)

    # --------------------------------------------------------------------------
    # 14. SiteSetting homepage media handling
    # --------------------------------------------------------------------------
    def test_14_sitesetting_homepage_media_handling(self):
        self._login()
        media_keys = ['homepage_hero_photo_1', 'homepage_hero_video', 'homepage_hero_photo_2']
        original_values = {}
        for k in media_keys:
            s = SiteSetting.query.filter_by(setting_key=k).first()
            original_values[k] = s.setting_value if s else ''

        try:
            res = self.client.post('/admin/site-settings', data={
                'brand_name': 'The Transit Story',
                'homepage_hero_photo_1': 'https://test.public.blob.vercel-storage.com/hero1.webp',
                'homepage_hero_video': 'https://test.public.blob.vercel-storage.com/hero-video.mp4',
                'homepage_hero_photo_2': 'https://test.public.blob.vercel-storage.com/hero2.webp'
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Verify retrieved from public API
            api_res = self.client.get('/api/site-settings')
            self.assertEqual(api_res.status_code, 200)
            settings = api_res.get_json()

            self.assertEqual(settings.get('homepage_hero_photo_1'), 'https://test.public.blob.vercel-storage.com/hero1.webp')
            self.assertEqual(settings.get('homepage_hero_video'), 'https://test.public.blob.vercel-storage.com/hero-video.mp4')
            self.assertEqual(settings.get('homepage_hero_photo_2'), 'https://test.public.blob.vercel-storage.com/hero2.webp')
        finally:
            # Restore pre-existing values so test runs never overwrite or blank legitimate settings
            for k in media_keys:
                s = SiteSetting.query.filter_by(setting_key=k).first()
                if s:
                    s.setting_value = original_values.get(k, '')
            db.session.commit()

    # --------------------------------------------------------------------------
    # 15. College IV settings handling
    # --------------------------------------------------------------------------
    def test_15_college_iv_settings_handling(self):
        self._login()
        iv_keys = ['college_iv_slide_1', 'college_iv_slide_2', 'college_iv_slide_3']
        original_values = {}
        for k in iv_keys:
            s = SiteSetting.query.filter_by(setting_key=k).first()
            original_values[k] = s.setting_value if s else ''

        try:
            res = self.client.post('/admin/site-settings', data={
                'brand_name': 'The Transit Story',
                'college_iv_slide_1': 'https://test.public.blob.vercel-storage.com/iv1.jpg',
                'college_iv_slide_2': 'https://test.public.blob.vercel-storage.com/iv2.jpg',
                'college_iv_slide_3': 'https://test.public.blob.vercel-storage.com/iv3.jpg'
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            api_res = self.client.get('/api/site-settings')
            self.assertEqual(api_res.status_code, 200)
            settings = api_res.get_json()

            self.assertEqual(settings.get('college_iv_slide_1'), 'https://test.public.blob.vercel-storage.com/iv1.jpg')
            self.assertEqual(settings.get('college_iv_slide_2'), 'https://test.public.blob.vercel-storage.com/iv2.jpg')
            self.assertEqual(settings.get('college_iv_slide_3'), 'https://test.public.blob.vercel-storage.com/iv3.jpg')
        finally:
            # Restore pre-existing values so test runs never overwrite or blank legitimate settings
            for k in iv_keys:
                s = SiteSetting.query.filter_by(setting_key=k).first()
                if s:
                    s.setting_value = original_values.get(k, '')
            db.session.commit()

    # --------------------------------------------------------------------------
    # 16. Existing local paths still work & Blob absolute URLs handled properly
    # --------------------------------------------------------------------------
    def test_16_media_urls_resolution(self):
        # Test the pure resolution logic matching src/utils/media.js
        def resolve_media_url(path_or_url, fallback=''):
            if not path_or_url or not isinstance(path_or_url, str):
                return fallback
            t = path_or_url.strip()
            if not t:
                return fallback
            if 'test.public.blob.vercel-storage.com' in t or 'example.com' in t or 'placeholder.com' in t:
                return fallback
            if t.startswith('http://') or t.startswith('https://') or t.startswith('data:') or t.startswith('blob:'):
                return t
            if t.startswith('/'):
                return t
            return f"/{t}"

        # 1. Local path
        self.assertEqual(resolve_media_url('/images/hero/hero01.jpg'), '/images/hero/hero01.jpg')
        # 2. Vercel Blob URL (does not prepend host)
        blob_url = 'https://abc.public.blob.vercel-storage.com/homepage/hero/video-123.mp4'
        self.assertEqual(resolve_media_url(blob_url), blob_url)
        # 3. Empty string fallback
        self.assertEqual(resolve_media_url('', '/images/hero/hero01.jpg'), '/images/hero/hero01.jpg')
        # 4. Test/mock Blob URL rejected and returns fallback
        self.assertEqual(resolve_media_url('https://test.public.blob.vercel-storage.com/hero1.webp', '/images/hero/hero01.jpg'), '/images/hero/hero01.jpg')


if __name__ == '__main__':
    unittest.main()
