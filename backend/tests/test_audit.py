import json
import unittest
from backend.app import app
from backend.db import db
from backend.models import (
    Admin, Destination, Category, JourneyIdea, Enquiry, FAQ, Service, Story, SiteSetting
)

class BackendAuditTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_01_categories(self):
        """Test categories listing"""
        res = self.client.get('/api/categories')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data) >= 4)
        slugs = [c['slug'] for c in data]
        self.assertIn('cultural-heritage', slugs)
        self.assertIn('college-educational', slugs)
        self.assertIn('leisure-holiday', slugs)
        print("[PASS] Categories API test passed")

    def test_02_destination_filtering(self):
        """Test destination filtering across all categories and aliases"""
        # All destinations
        res = self.client.get('/api/destinations')
        self.assertEqual(res.status_code, 200)
        all_dests = res.get_json()
        self.assertTrue(len(all_dests) >= 10)

        # Category: cultural-heritage
        res = self.client.get('/api/destinations?category=cultural-heritage')
        self.assertEqual(res.status_code, 200)
        cultural = res.get_json()
        self.assertTrue(len(cultural) >= 2)

        # Category: college-educational
        res = self.client.get('/api/destinations?category=college-educational')
        self.assertEqual(res.status_code, 200)
        educational = res.get_json()
        self.assertTrue(len(educational) >= 2)

        # Category: leisure-holiday
        res = self.client.get('/api/destinations?category=leisure-holiday')
        self.assertEqual(res.status_code, 200)
        leisure = res.get_json()
        self.assertTrue(len(leisure) >= 4)

        # Destination details slug
        res = self.client.get('/api/destinations/thirumalai-kovil')
        self.assertEqual(res.status_code, 200)
        dest = res.get_json()
        self.assertEqual(dest['slug'], 'thirumalai-kovil')

        # Hero + Gallery Rule verification
        hero_img = dest.get('heroImage')
        gallery_imgs = dest.get('gallery') or []
        self.assertTrue(len(gallery_imgs) <= 3)
        self.assertNotIn(hero_img, gallery_imgs)
        print("[PASS] Destination filtering & Hero+Gallery rules")

    def test_03_journey_ideas_curation(self):
        """Verify Journey Ideas comes ONLY from journey_ideas table and doesn't auto-add new destinations"""
        res = self.client.get('/api/journey-ideas')
        self.assertEqual(res.status_code, 200)
        initial_ideas = res.get_json()
        initial_idea_slugs = [i['slug'] for i in initial_ideas]

        # Create a new test destination
        test_category = Category.query.first()
        test_dest = Destination(
            category_id=test_category.id,
            slug='test-audit-temp-dest',
            title='Test Audit Temporary Destination',
            location='Audit State, S. India',
            hero_image='/images/test-hero.jpg',
            is_published=True,
            display_order=999
        )
        db.session.add(test_dest)
        db.session.commit()

        # Check it appears in /api/destinations
        res_dest = self.client.get('/api/destinations')
        dest_slugs = [d['slug'] for d in res_dest.get_json()]
        self.assertIn('test-audit-temp-dest', dest_slugs)

        # Verify it does NOT appear in /api/journey-ideas
        res_ideas = self.client.get('/api/journey-ideas')
        new_idea_slugs = [i['slug'] for i in res_ideas.get_json()]
        self.assertNotIn('test-audit-temp-dest', new_idea_slugs)
        self.assertEqual(len(new_idea_slugs), len(initial_idea_slugs))

        # Test unpublishing: When unpublished, it should disappear from /api/destinations
        test_dest.is_published = False
        db.session.commit()

        res_dest_unpub = self.client.get('/api/destinations')
        dest_slugs_unpub = [d['slug'] for d in res_dest_unpub.get_json()]
        self.assertNotIn('test-audit-temp-dest', dest_slugs_unpub)

        # Cleanup test record
        db.session.delete(test_dest)
        db.session.commit()
        print("[PASS] Journey ideas curation & publishing state rules")

    def test_04_enquiries_and_phone_validation(self):
        """Verify phone number is mandatory for /api/enquiries and /api/contact"""
        # Missing phone in /api/enquiries -> Must return 422
        payload_no_phone = {
            'fullName': 'Traveler Test',
            'email': 'traveler@test.com',
            'phone': '',
            'destination': 'Nellaiyappar Temple'
        }
        res = self.client.post('/api/enquiries', json=payload_no_phone)
        self.assertEqual(res.status_code, 422)

        # Valid enquiry with phone -> Must return 201 and record in DB
        payload_valid = {
            'fullName': 'Traveler Test Valid',
            'email': 'traveler@test.com',
            'phone': '+91 9876543210',
            'destination': 'Nellaiyappar Temple',
            'travelers': '4 adults',
            'timeframe': 'Next Month',
            'notes': 'Test enquiry submission'
        }
        res = self.client.post('/api/enquiries', json=payload_valid)
        self.assertEqual(res.status_code, 201)
        enquiry_id = res.get_json()['enquiryId']

        # Verify DB entry
        enq = Enquiry.query.get(enquiry_id)
        self.assertIsNotNone(enq)
        self.assertEqual(enq.phone, '+91 9876543210')
        self.assertEqual(enq.status, 'new')

        # Test admin update of enquiry status and admin notes
        enq.status = 'in_discussion'
        enq.admin_notes = 'Called traveler, arranging customized itinerary.'
        db.session.commit()

        reloaded = Enquiry.query.get(enquiry_id)
        self.assertEqual(reloaded.status, 'in_discussion')
        self.assertEqual(reloaded.admin_notes, 'Called traveler, arranging customized itinerary.')

        # Clean up test enquiry
        db.session.delete(reloaded)
        db.session.commit()

        # Missing phone in /api/contact -> Must return 422
        contact_no_phone = {
            'name': 'Test Contact',
            'email': 'contact@test.com',
            'phone': '',
            'message': 'Hello'
        }
        res = self.client.post('/api/contact', json=contact_no_phone)
        self.assertEqual(res.status_code, 422)

        # Valid contact message with phone -> Must return 201
        contact_valid = {
            'name': 'Test Contact Valid',
            'email': 'contact@test.com',
            'phone': '+91 9123456780',
            'subject': 'Trip Question',
            'message': 'Hello from test'
        }
        res = self.client.post('/api/contact', json=contact_valid)
        self.assertEqual(res.status_code, 201)
        c_id = res.get_json()['enquiryId']
        c_enq = Enquiry.query.get(c_id)
        self.assertIsNotNone(c_enq)
        db.session.delete(c_enq)
        db.session.commit()
        print("[PASS] Mandatory phone number enforcement & enquiry management tests")

    def test_05_security_and_auth(self):
        """Verify password hashing, admin auth requirement, and session security"""
        admin = Admin.query.first()
        self.assertIsNotNone(admin)
        # Password hash starts with standard werkzeug/scrypt/pbkdf2 prefix
        self.assertTrue(admin.password_hash.startswith(('scrypt:', 'pbkdf2:', 'argon2:')))
        # Verify unauthenticated access to admin routes redirects or errors
        res = self.client.get('/admin/dashboard')
        self.assertEqual(res.status_code, 302)  # Redirect to login

        res_api = self.client.get('/admin/destinations')
        self.assertEqual(res_api.status_code, 302)
        print("[PASS] Security, hashing, and route protection tests")

if __name__ == '__main__':
    unittest.main()
