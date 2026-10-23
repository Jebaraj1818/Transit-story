import unittest
from backend.app import app
from backend.db import db
from backend.models import Admin, Testimonial
from backend.services.storage_service import (
    get_media_references, is_media_referenced, safe_cleanup_unused_blob
)

class TestimonialsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        # Ensure admin user for tests
        self.admin = Admin.query.filter_by(email="test_curator@thetransitstory.com").first()
        if not self.admin:
            self.admin = Admin(
                name="Test Curator",
                email="test_curator@thetransitstory.com",
                role="ADMIN",
                is_active=True
            )
            self.admin.set_password("TestSecretPass2026!")
            db.session.add(self.admin)
            db.session.commit()

    def tearDown(self):
        self.client.get('/admin/logout')
        self.ctx.pop()

    def _login(self):
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

    def test_01_public_api_returns_active_ordered_testimonials(self):
        """Verify GET /api/testimonials returns only active items ordered by display_order"""
        # Create test items
        t_active = Testimonial(
            title="Active Journey",
            customer_name="Happy Traveler",
            image_url="/images/testimonials/test_active.jpeg",
            display_order=10,
            is_active=True
        )
        t_hidden = Testimonial(
            title="Draft Hidden",
            customer_name="Secret",
            image_url="/images/testimonials/test_hidden.jpeg",
            display_order=5,
            is_active=False
        )
        db.session.add(t_active)
        db.session.add(t_hidden)
        db.session.commit()

        try:
            res = self.client.get('/api/testimonials')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIsInstance(data, list)
            
            # Ensure hidden is NOT in response
            hidden_titles = [item['title'] for item in data if item['title'] == 'Draft Hidden']
            self.assertEqual(len(hidden_titles), 0)

            # Ensure active is in response
            active_items = [item for item in data if item['title'] == 'Active Journey']
            self.assertEqual(len(active_items), 1)
            self.assertEqual(active_items[0]['customerName'], 'Happy Traveler')
            self.assertEqual(active_items[0]['imageUrl'], '/images/testimonials/test_active.jpeg')
        finally:
            db.session.delete(t_active)
            db.session.delete(t_hidden)
            db.session.commit()

    def test_02_unauthenticated_admin_access_redirects(self):
        """Unauthenticated requests to admin testimonial routes are redirected to login"""
        res = self.client.get('/admin/testimonials')
        self.assertEqual(res.status_code, 302)
        self.assertIn('/admin/login', res.headers.get('Location', ''))

        res_post = self.client.post('/admin/testimonials', data={'title': 'Unauthorized'})
        self.assertEqual(res_post.status_code, 302)

    def test_03_authenticated_admin_crud_lifecycle(self):
        """Admin can create, edit, toggle, and delete customer testimonials"""
        self._login()

        # 1. Access admin list page
        res = self.client.get('/admin/testimonials')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Active Gallery Screenshots', res.data)

        # 2. Create new testimonial
        res_create = self.client.post('/admin/testimonials', data={
            'title': 'Wayanad Nature Trail',
            'customer_name': 'Meera & Friends',
            'image_url': '/images/testimonials/wayanad_review.jpg',
            'display_order': '3',
            'is_active': 'on'
        }, follow_redirects=True)
        self.assertEqual(res_create.status_code, 200)

        created = Testimonial.query.filter_by(title='Wayanad Nature Trail').first()
        self.assertIsNotNone(created)
        self.assertEqual(created.customer_name, 'Meera & Friends')
        self.assertEqual(created.display_order, 3)
        self.assertTrue(created.is_active)

        # 3. Edit testimonial
        res_edit = self.client.post(f'/admin/testimonials/{created.id}/edit', data={
            'title': 'Wayanad Nature Trail - Updated',
            'customer_name': 'Meera & Family',
            'image_url': '/images/testimonials/wayanad_review_v2.jpg',
            'display_order': '4',
            'is_active': 'on'
        }, follow_redirects=True)
        self.assertEqual(res_edit.status_code, 200)

        reloaded = Testimonial.query.get(created.id)
        self.assertEqual(reloaded.title, 'Wayanad Nature Trail - Updated')
        self.assertEqual(reloaded.display_order, 4)

        # 4. Toggle active/inactive
        res_toggle = self.client.post(f'/admin/testimonials/{created.id}/toggle', follow_redirects=True)
        self.assertEqual(res_toggle.status_code, 200)
        reloaded = Testimonial.query.get(created.id)
        self.assertFalse(reloaded.is_active)

        # 5. Delete testimonial
        res_del = self.client.post(f'/admin/testimonials/{created.id}/delete', follow_redirects=True)
        self.assertEqual(res_del.status_code, 200)
        deleted = Testimonial.query.get(created.id)
        self.assertIsNone(deleted)

    def test_04_storage_references_detect_testimonial_image(self):
        """Verify storage service detects active references in Testimonial table"""
        sample_blob_url = "https://mockstore.public.blob.vercel-storage.com/testimonials/test_review_123.jpg"

        test_item = Testimonial(
            title="Kodaikanal Review",
            customer_name="Priya",
            image_url=sample_blob_url,
            display_order=1,
            is_active=True
        )
        db.session.add(test_item)
        db.session.commit()

        try:
            refs = get_media_references(sample_blob_url)
            self.assertTrue(any('Testimonial' in r for r in refs))
            self.assertTrue(is_media_referenced(sample_blob_url))

            # Attempting safe_cleanup_unused_blob must fail while referenced
            can_delete, msg = safe_cleanup_unused_blob(sample_blob_url)
            self.assertFalse(can_delete)
            self.assertIn("referenced", msg.lower())
        finally:
            db.session.delete(test_item)
            db.session.commit()

if __name__ == '__main__':
    unittest.main()
