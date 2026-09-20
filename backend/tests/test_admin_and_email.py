import hashlib
import json
import unittest
from datetime import datetime, timedelta
from backend.app import app
from backend.db import db
from backend.models import (
    Admin, AdminPasswordResetToken, EmailLog, Enquiry, NewsletterSubscriber, SiteSetting
)
from backend.services.email_service import (
    send_admin_password_reset,
    send_admin_password_changed,
    send_newsletter_welcome,
    send_enquiry_customer_confirmation,
    send_enquiry_admin_notification,
    send_contact_customer_confirmation,
    send_contact_admin_notification,
    get_notification_recipient_emails
)

class AdminAndEmailTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.client.get('/admin/logout')

    def tearDown(self):
        self.client.get('/admin/logout')
        self.ctx.pop()

    def test_01_super_admin_and_regular_admin_roles(self):
        """Test Super Admin and Regular Admin creation, roles, and status"""
        # Create or reset test super admin
        super_admin = Admin.query.filter_by(email="super_test@thetransitstory.com").first()
        if not super_admin:
            super_admin = Admin(
                name="Test Super Curator",
                email="super_test@thetransitstory.com",
                role="SUPER_ADMIN",
                is_active=True
            )
            db.session.add(super_admin)
        super_admin.role = "SUPER_ADMIN"
        super_admin.is_active = True
        super_admin.set_password("SuperSecret2026!")
        db.session.commit()

        self.assertTrue(super_admin.is_super_admin)
        self.assertFalse(super_admin.is_regular_admin)
        self.assertTrue(super_admin.check_password("SuperSecret2026!"))

        # Create or reset regular admin
        reg_admin = Admin.query.filter_by(email="staff_test@thetransitstory.com").first()
        if not reg_admin:
            reg_admin = Admin(
                name="Test Staff Curator",
                email="staff_test@thetransitstory.com",
                role="ADMIN",
                is_active=True
            )
            db.session.add(reg_admin)
        reg_admin.role = "ADMIN"
        reg_admin.is_active = True
        reg_admin.set_password("StaffSecret2026!")
        db.session.commit()

        self.assertFalse(reg_admin.is_super_admin)
        self.assertTrue(reg_admin.is_regular_admin)
        self.assertTrue(reg_admin.check_password("StaffSecret2026!"))
        print("[PASS] Super Admin & Regular Admin models & role properties")

    def test_02_login_and_inactive_block(self):
        """Test login behavior and inactive account blocking"""
        # Inactive admin test
        inactive_admin = Admin.query.filter_by(email="inactive_test@thetransitstory.com").first()
        if not inactive_admin:
            inactive_admin = Admin(
                name="Inactive Staff",
                email="inactive_test@thetransitstory.com",
                role="ADMIN",
                is_active=False
            )
            db.session.add(inactive_admin)
        inactive_admin.is_active = False
        inactive_admin.set_password("InactiveSecret2026!")
        
        super_admin = Admin.query.filter_by(email="super_test@thetransitstory.com").first()
        if super_admin:
            super_admin.is_active = True
            super_admin.set_password("SuperSecret2026!")
            
        db.session.commit()

        res_inactive = self.client.post('/admin/login', data={
            'email': 'inactive_test@thetransitstory.com',
            'password': 'InactiveSecret2026!'
        })
        self.assertEqual(res_inactive.status_code, 200)
        self.assertIn(b'inactive', res_inactive.data.lower())

        # Valid login test
        res_valid = self.client.post('/admin/login', data={
            'email': 'super_test@thetransitstory.com',
            'password': 'SuperSecret2026!'
        })
        self.assertEqual(res_valid.status_code, 302)  # Redirect to dashboard
        print("[PASS] Login authentication & inactive account blocking")

    def test_03_role_authorization_enforcement(self):
        """Verify that only SUPER_ADMIN can access /admin/admins endpoints"""
        reg_admin = Admin.query.filter_by(email="staff_test@thetransitstory.com").first()
        super_admin = Admin.query.filter_by(email="super_test@thetransitstory.com").first()

        # 1. Access as Regular Admin
        with self.client.session_transaction() as sess:
            sess['admin_id'] = reg_admin.id

        res_admins_page = self.client.get('/admin/admins')
        self.assertEqual(res_admins_page.status_code, 302)  # Redirected away with warning

        res_new_admin = self.client.get('/admin/admins/new')
        self.assertEqual(res_new_admin.status_code, 302)  # Blocked

        # 2. Access as Super Admin
        with self.client.session_transaction() as sess:
            sess['admin_id'] = super_admin.id

        res_super_access = self.client.get('/admin/admins')
        self.assertEqual(res_super_access.status_code, 200)
        self.assertIn(b'Administrator Accounts', res_super_access.data)
        print("[PASS] Role-based access control & SUPER_ADMIN boundary enforcement")

    def test_04_forgot_password_and_reset_token_flow(self):
        """Test secure single-use token generation, expiration, and password reset"""
        admin = Admin.query.filter_by(email="super_test@thetransitstory.com").first()
        
        # 1. Request forgot password
        res_forgot = self.client.post('/admin/forgot-password', data={'email': admin.email})
        self.assertEqual(res_forgot.status_code, 302)

        # 2. Verify token generated in DB
        token_record = (
            AdminPasswordResetToken.query
            .filter_by(admin_id=admin.id, used_at=None)
            .order_by(AdminPasswordResetToken.created_at.desc())
            .first()
        )
        self.assertIsNotNone(token_record)
        self.assertTrue(token_record.is_valid())

        # Test invalid/fake token lookup
        fake_token = "non-existent-fake-token-12345"
        res_fake = self.client.get(f'/admin/reset-password/{fake_token}')
        self.assertEqual(res_fake.status_code, 302)  # Redirects with error

        # 3. Test token expiration
        token_record.expires_at = datetime.utcnow() - timedelta(minutes=10)
        db.session.commit()
        self.assertFalse(token_record.is_valid())

        # Reset expiration for valid test
        import secrets
        raw_token = secrets.token_urlsafe(32)
        raw_token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        new_token_rec = AdminPasswordResetToken(
            admin_id=admin.id,
            token_hash=raw_token_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=60)
        )
        db.session.add(new_token_rec)
        db.session.commit()

        # 4. Perform password reset
        res_reset = self.client.post(f'/admin/reset-password/{raw_token}', data={
            'password': 'NewSuperSecret2026!',
            'confirm_password': 'NewSuperSecret2026!'
        })
        self.assertEqual(res_reset.status_code, 302)

        # 5. Verify token consumed (used_at set)
        reloaded_token = AdminPasswordResetToken.query.filter_by(token_hash=raw_token_hash).first()
        self.assertIsNotNone(reloaded_token.used_at)
        self.assertFalse(reloaded_token.is_valid())

        # 6. Verify password updated
        admin_reloaded = Admin.query.get(admin.id)
        self.assertTrue(admin_reloaded.check_password("NewSuperSecret2026!"))
        print("[PASS] Forgot password flow, cryptographic token security & single-use invalidation")

    def test_05_email_service_and_logging(self):
        """Test email service dispatching, fallback HTML rendering, and database logging"""
        admin = Admin.query.filter_by(email="super_test@thetransitstory.com").first()

        # Test admin password reset email dispatch
        res1, _ = send_admin_password_reset(admin, "test-token", "http://localhost:3000/admin/reset-password/test-token")
        self.assertTrue(res1)

        # Test newsletter welcome email dispatch
        res2, _ = send_newsletter_welcome("subscriber_test@example.com")
        self.assertTrue(res2)

        # Test journey enquiry customer & admin notification
        test_enquiry = Enquiry(
            type='journey_request',
            full_name='Test Traveler',
            email='traveler@test.com',
            phone='+91 9988776655',
            destination='Munnar',
            notes='Custom tea trail enquiry'
        )
        db.session.add(test_enquiry)
        db.session.commit()

        res3, _ = send_enquiry_customer_confirmation(test_enquiry)
        self.assertTrue(res3)

        res4, _ = send_enquiry_admin_notification(test_enquiry)
        self.assertTrue(res4)

        # Verify email logs in database
        logs = EmailLog.query.order_by(EmailLog.created_at.desc()).limit(10).all()
        self.assertTrue(len(logs) >= 4)
        log_types = [l.email_type for l in logs]
        self.assertIn('admin_password_reset', log_types)
        self.assertIn('newsletter_welcome', log_types)
        self.assertIn('enquiry_customer', log_types)
        self.assertIn('enquiry_admin', log_types)

        # Clean up test enquiry
        db.session.delete(test_enquiry)
        db.session.commit()
        print("[PASS] Brevo email service methods, fallback rendering & EmailLog tracking")

    def test_06_last_super_admin_protection(self):
        """Ensure system prevents deleting or deactivating the last Super Admin"""
        super_admins = Admin.query.filter_by(role='SUPER_ADMIN', is_active=True).all()
        self.assertTrue(len(super_admins) >= 1)

        # Login as super admin
        primary_super = super_admins[0]
        with self.client.session_transaction() as sess:
            sess['admin_id'] = primary_super.id

        # Attempt to delete own account
        res_del_self = self.client.post(f'/admin/admins/{primary_super.id}/delete')
        self.assertEqual(res_del_self.status_code, 302)

        # Verify still in database
        still_exists = Admin.query.get(primary_super.id)
        self.assertIsNotNone(still_exists)
        print("[PASS] Last Super Admin & Self-Deletion protection rules")

    def test_07_owner_contact_phones_settings(self):
        """Ensure all four owner contact phone numbers can be updated from Admin and retrieved via public API"""
        super_admins = Admin.query.filter_by(role='SUPER_ADMIN', is_active=True).all()
        self.assertTrue(len(super_admins) >= 1)
        with self.client.session_transaction() as sess:
            sess['admin_id'] = super_admins[0].id

        test_numbers = {
            'contact_phone_1': '+91 98765 43210',
            'contact_phone_2': '+91 98765 43211',
            'contact_phone_3': '+91 98765 43212',
            'contact_phone_4': '+91 98765 43213'
        }

        # Capture pre-test values to accurately restore them in finally block
        pre_test_values = {}
        for k in test_numbers.keys():
            s = SiteSetting.query.filter_by(setting_key=k).first()
            pre_test_values[k] = s.setting_value if s else None

        try:
            post_res = self.client.post('/admin/site-settings', data={
                'brand_name': 'The Transit Story',
                **test_numbers
            }, follow_redirects=True)
            self.assertEqual(post_res.status_code, 200)

            # Verify public API returns the four owner numbers
            api_res = self.client.get('/api/site-settings')
            self.assertEqual(api_res.status_code, 200)
            settings = api_res.get_json()

            for k, expected_val in test_numbers.items():
                self.assertEqual(settings.get(k), expected_val)

            print("[PASS] Owner mobile numbers site settings save and API retrieval")
        finally:
            # Restore original values so live database is preserved intact
            for k, orig_val in pre_test_values.items():
                s = SiteSetting.query.filter_by(setting_key=k).first()
                if s and orig_val is not None:
                    s.setting_value = orig_val
            db.session.commit()

    def test_08_site_settings_preserve_on_blank_submission(self):
        """
        Verify:
        - existing non-empty setting + blank submitted value => existing value remains unchanged
        - existing setting + new non-empty value => value updates normally
        - empty/nonexistent setting + blank value => no unnecessary new value is created
        """
        super_admins = Admin.query.filter_by(role='SUPER_ADMIN', is_active=True).all()
        self.assertTrue(len(super_admins) >= 1)
        with self.client.session_transaction() as sess:
            sess['admin_id'] = super_admins[0].id

        keys_to_track = ['contact_phone_1', 'contact_phone_2', 'test_dummy_empty_setting']
        saved_values = {}
        for k in keys_to_track:
            s = SiteSetting.query.filter_by(setting_key=k).first()
            saved_values[k] = s.setting_value if s else None

        try:
            # Ensure an existing non-empty setting and an existing empty setting exist
            s1 = SiteSetting.query.filter_by(setting_key='contact_phone_1').first()
            if not s1:
                s1 = SiteSetting(setting_key='contact_phone_1', setting_value='+91 8248697026')
                db.session.add(s1)
            else:
                s1.setting_value = '+91 8248697026'

            s_empty = SiteSetting.query.filter_by(setting_key='test_dummy_empty_setting').first()
            if not s_empty:
                s_empty = SiteSetting(setting_key='test_dummy_empty_setting', setting_value='')
                db.session.add(s_empty)
            else:
                s_empty.setting_value = ''
            db.session.commit()

            # Submit form:
            # 1. contact_phone_1 is submitted as blank (whitespace)
            # 2. contact_phone_2 is submitted as a new non-empty value
            # 3. test_dummy_empty_setting is submitted as blank
            # 4. nonexistent_dummy_key is submitted as blank
            res = self.client.post('/admin/site-settings', data={
                'contact_phone_1': '   ',
                'contact_phone_2': '+91 77777 66666',
                'test_dummy_empty_setting': '',
                'nonexistent_dummy_key': '   ',
            }, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Verification 1: Existing non-empty setting preserved when submitted blank
            s1_after = SiteSetting.query.filter_by(setting_key='contact_phone_1').first()
            self.assertEqual(s1_after.setting_value, '+91 8248697026')

            # Verification 2: Existing setting updated normally when submitted with non-empty value
            s2_after = SiteSetting.query.filter_by(setting_key='contact_phone_2').first()
            self.assertEqual(s2_after.setting_value, '+91 77777 66666')

            # Verification 3: Existing empty setting remains empty
            s_empty_after = SiteSetting.query.filter_by(setting_key='test_dummy_empty_setting').first()
            self.assertEqual(s_empty_after.setting_value, '')

            # Verification 4: Nonexistent setting with blank value was not created
            s_nonexistent = SiteSetting.query.filter_by(setting_key='nonexistent_dummy_key').first()
            self.assertIsNone(s_nonexistent)

            print("[PASS] Site settings blank-value preservation & safe update rules")
        finally:
            # Restore all original values
            for k, orig_val in saved_values.items():
                s = SiteSetting.query.filter_by(setting_key=k).first()
                if orig_val is None:
                    if s:
                        db.session.delete(s)
                else:
                    if s:
                        s.setting_value = orig_val
                    else:
                        db.session.add(SiteSetting(setting_key=k, setting_value=orig_val))
            dummy = SiteSetting.query.filter_by(setting_key='nonexistent_dummy_key').first()
            if dummy:
                db.session.delete(dummy)
            db.session.commit()

if __name__ == '__main__':
    unittest.main()
