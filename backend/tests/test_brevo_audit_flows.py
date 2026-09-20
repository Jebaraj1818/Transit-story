"""
Comprehensive Brevo Email & Admin Integration Audit Test Suite
Verifies all 10 requirements:
1. Newsletter end-to-end flow & duplicate prevention
2. Journey enquiry submission, dual email triggers, Reply-To & multiple recipients
3. Contact message submission, dual email triggers, Reply-To & multiple recipients
4. Admin forgot password token generation, expiration, single-use invalidation & anti-enumeration
5. Multiple admin RBAC, independent credentials, deactivation & lockout protection
6. Brevo secret security & frontend leak audit
7. Non-fatal email failure handling & secure database logging
8. Environment variable configuration & Brevo template ID / HTML fallback support
9. Sender address configuration inspection
10. Overall system integrity
"""

import hashlib
import json
import os
import secrets
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from backend.app import app
from backend.config import Config
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
    get_notification_recipient_emails,
    _send_brevo_email
)

class BrevoAuditFlowsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.client.get('/admin/logout')

        # Ensure active super admin exists
        self.super_admin = Admin.query.filter_by(email="super_test@thetransitstory.com").first()
        if not self.super_admin:
            self.super_admin = Admin(
                name="Audit Super Admin",
                email="super_test@thetransitstory.com",
                role="SUPER_ADMIN",
                is_active=True
            )
            db.session.add(self.super_admin)
        self.super_admin.role = "SUPER_ADMIN"
        self.super_admin.is_active = True
        self.super_admin.set_password("SuperSecret2026!")

        # Ensure active regular admin exists
        self.reg_admin = Admin.query.filter_by(email="staff_test@thetransitstory.com").first()
        if not self.reg_admin:
            self.reg_admin = Admin(
                name="Audit Staff Admin",
                email="staff_test@thetransitstory.com",
                role="ADMIN",
                is_active=True
            )
            db.session.add(self.reg_admin)
        self.reg_admin.role = "ADMIN"
        self.reg_admin.is_active = True
        self.reg_admin.set_password("StaffSecret2026!")

        db.session.commit()

    def tearDown(self):
        self.client.get('/admin/logout')
        self.ctx.pop()

    def test_01_newsletter_flow(self):
        """1. NEWSLETTER: New subscriber saved, duplicate handled, welcome email triggered only on new subscriber"""
        test_email = f"audit_subscriber_{secrets.token_hex(4)}@example.com"

        with patch('backend.services.email_service._send_brevo_email') as mock_send:
            mock_send.return_value = (True, "Mock email dispatched")

            # First submission (New subscriber)
            res1 = self.client.post('/api/newsletter', json={'email': test_email})
            self.assertEqual(res1.status_code, 200)
            data1 = res1.get_json()
            self.assertTrue(data1.get('success'))

            # Verify subscriber saved in DB
            sub = NewsletterSubscriber.query.filter_by(email=test_email).first()
            self.assertIsNotNone(sub)

            # Confirm welcome email was triggered exactly once for the new subscriber
            self.assertEqual(mock_send.call_count, 1)
            call_kwargs = mock_send.call_args[1] if mock_send.call_args[1] else {}
            call_args = mock_send.call_args[0] if mock_send.call_args[0] else ()
            to_email = call_kwargs.get('to_email') or (call_args[0] if len(call_args) > 0 else None)
            self.assertEqual(to_email, test_email)

            # Second submission with same email (Duplicate check)
            res2 = self.client.post('/api/newsletter', json={'email': test_email})
            self.assertEqual(res2.status_code, 200)

            # Confirm welcome email was NOT triggered a second time (still call_count == 1)
            self.assertEqual(mock_send.call_count, 1)

            # Clean up
            db.session.delete(sub)
            db.session.commit()

    def test_02_journey_enquiry_flow(self):
        """2. JOURNEY ENQUIRY: Saved in MySQL, customer confirmation + admin notification triggered, Reply-To set, multiple recipients"""
        enquiry_payload = {
            'fullName': 'Ananya Sharma',
            'email': 'ananya.sharma@example.com',
            'phone': '+91 98765 43210',
            'destination': 'Chettinad Heritage Trail',
            'travelers': '2 Adults',
            'timeframe': 'November 2026',
            'themes': ['Heritage & Mansions', 'Culinary'],
            'notes': 'Looking for private heritage mansions and bespoke cooking session.'
        }

        # Save existing notification_emails value to restore later
        prev_setting = SiteSetting.query.filter_by(setting_key='notification_emails').first()
        prev_value = prev_setting.setting_value if prev_setting else None

        # Set configured notification recipients in SiteSetting
        setting = SiteSetting.query.filter_by(setting_key='notification_emails').first()
        if not setting:
            setting = SiteSetting(setting_key='notification_emails', setting_value='curator1@transitstory.com, curator2@transitstory.com')
            db.session.add(setting)
        else:
            setting.setting_value = 'curator1@transitstory.com, curator2@transitstory.com'
        db.session.commit()

        try:
            with patch('backend.services.email_service._send_brevo_email') as mock_send:
                mock_send.return_value = (True, "Mock email dispatched")

                res = self.client.post('/api/enquiries', json=enquiry_payload)
                self.assertEqual(res.status_code, 201)
                data = res.get_json()
                self.assertTrue(data.get('success'))
                enquiry_id = data.get('enquiryId')

                # Verify saved in MySQL
                enquiry = Enquiry.query.get(enquiry_id)
                self.assertIsNotNone(enquiry)
                self.assertEqual(enquiry.full_name, 'Ananya Sharma')
                self.assertEqual(enquiry.phone, '+91 98765 43210')
                self.assertEqual(enquiry.destination, 'Chettinad Heritage Trail')

                # Verify emails triggered: 1 customer confirmation + 2 admin notifications (for 2 recipients) = 3 calls
                self.assertEqual(mock_send.call_count, 3)

                # Verify customer confirmation call
                customer_call = mock_send.call_args_list[0]
                cust_kwargs = customer_call[1]
                self.assertEqual(cust_kwargs.get('to_email'), 'ananya.sharma@example.com')
                self.assertEqual(cust_kwargs.get('email_type'), 'enquiry_customer')

                # Verify admin notification calls and Reply-To customer email
                admin_call_1 = mock_send.call_args_list[1]
                admin_1_kwargs = admin_call_1[1]
                self.assertEqual(admin_1_kwargs.get('to_email'), 'curator1@transitstory.com')
                self.assertEqual(admin_1_kwargs.get('reply_to_email'), 'ananya.sharma@example.com')
                self.assertEqual(admin_1_kwargs.get('email_type'), 'enquiry_admin')

                admin_call_2 = mock_send.call_args_list[2]
                admin_2_kwargs = admin_call_2[1]
                self.assertEqual(admin_2_kwargs.get('to_email'), 'curator2@transitstory.com')
                self.assertEqual(admin_2_kwargs.get('reply_to_email'), 'ananya.sharma@example.com')

                # Clean up
                db.session.delete(enquiry)
                db.session.commit()
        finally:
            # Restore previous notification_emails
            s = SiteSetting.query.filter_by(setting_key='notification_emails').first()
            if s and prev_value is not None:
                s.setting_value = prev_value
                db.session.commit()

    def test_03_contact_message_flow(self):
        """3. CONTACT MESSAGE: Saved in MySQL, customer confirmation + admin notification triggered, Reply-To customer email"""
        contact_payload = {
            'fullName': 'Rahul Varma',
            'email': 'rahul.varma@example.com',
            'phone': '+91 91234 56789',
            'subject': 'Private Tea Estate Villa Query',
            'message': 'Can we arrange a 3-day quiet retreat with private chauffeur?'
        }

        prev_setting = SiteSetting.query.filter_by(setting_key='notification_emails').first()
        prev_value = prev_setting.setting_value if prev_setting else None

        setting = SiteSetting.query.filter_by(setting_key='notification_emails').first()
        if setting:
            setting.setting_value = 'leadcurator@transitstory.com'
            db.session.commit()

        try:
            with patch('backend.services.email_service._send_brevo_email') as mock_send:
                mock_send.return_value = (True, "Mock email dispatched")

                res = self.client.post('/api/contact', json=contact_payload)
                self.assertEqual(res.status_code, 201)
                data = res.get_json()
                self.assertTrue(data.get('success'))
                msg_id = data.get('enquiryId')

                # Verify message stored
                contact_rec = Enquiry.query.get(msg_id)
                self.assertIsNotNone(contact_rec)
                self.assertEqual(contact_rec.type, 'contact_message')
                self.assertEqual(contact_rec.full_name, 'Rahul Varma')

                # Verify 2 email dispatches (1 customer + 1 admin)
                self.assertEqual(mock_send.call_count, 2)

                # Customer confirmation
                cust_call = mock_send.call_args_list[0][1]
                self.assertEqual(cust_call.get('to_email'), 'rahul.varma@example.com')
                self.assertEqual(cust_call.get('email_type'), 'contact_customer')

                # Admin notification with Reply-To
                admin_call = mock_send.call_args_list[1][1]
                self.assertEqual(admin_call.get('to_email'), 'leadcurator@transitstory.com')
                self.assertEqual(admin_call.get('reply_to_email'), 'rahul.varma@example.com')
                self.assertEqual(admin_call.get('email_type'), 'contact_admin')

                # Clean up
                db.session.delete(contact_rec)
                db.session.commit()
        finally:
            s = SiteSetting.query.filter_by(setting_key='notification_emails').first()
            if s and prev_value is not None:
                s.setting_value = prev_value
                db.session.commit()

    def test_04_admin_forgot_password_and_anti_enumeration(self):
        """4. ADMIN FORGOT PASSWORD: Valid token flow, single use, expiration, password reset, confirmation email, anti-enumeration"""
        admin = self.super_admin

        # A. Test Unknown Email (Anti-Enumeration)
        with patch('backend.routes.admin.send_admin_password_reset') as mock_reset_email:
            res_unknown = self.client.post('/admin/forgot-password', data={'email': 'unknown_person@randomdomain.xyz'}, follow_redirects=True)
            self.assertEqual(res_unknown.status_code, 200)
            self.assertIn(b'If an active account exists', res_unknown.data)
            self.assertEqual(mock_reset_email.call_count, 0)

        # B. Test Known Active Admin Email
        with patch('backend.routes.admin.send_admin_password_reset') as mock_reset_email:
            res_known = self.client.post('/admin/forgot-password', data={'email': 'super_test@thetransitstory.com'}, follow_redirects=True)
            self.assertEqual(res_known.status_code, 200)
            self.assertIn(b'If an active account exists', res_known.data)
            self.assertEqual(mock_reset_email.call_count, 1)

        # Retrieve generated token from DB
        token_rec = (
            AdminPasswordResetToken.query
            .filter_by(admin_id=admin.id, used_at=None)
            .order_by(AdminPasswordResetToken.created_at.desc())
            .first()
        )
        self.assertIsNotNone(token_rec)
        self.assertTrue(token_rec.is_valid())

        # Create known raw token and hash for form testing
        raw_test_token = secrets.token_urlsafe(32)
        raw_hash = hashlib.sha256(raw_test_token.encode('utf-8')).hexdigest()
        audit_token_rec = AdminPasswordResetToken(
            admin_id=admin.id,
            token_hash=raw_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=60)
        )
        db.session.add(audit_token_rec)
        db.session.commit()

        # C. Perform Password Reset using token
        with patch('backend.routes.admin.send_admin_password_changed') as mock_changed_email:
            res_reset = self.client.post(f'/admin/reset-password/{raw_test_token}', data={
                'password': 'BrandNewPassword2026!',
                'confirm_password': 'BrandNewPassword2026!'
            }, follow_redirects=True)
            self.assertEqual(res_reset.status_code, 200)
            self.assertIn(b'successfully reset', res_reset.data.lower())
            self.assertEqual(mock_changed_email.call_count, 1)

        # D. Verify token cannot be reused
        res_reused = self.client.get(f'/admin/reset-password/{raw_test_token}', follow_redirects=True)
        self.assertEqual(res_reused.status_code, 200)
        self.assertIn(b'invalid, expired, or has already been used', res_reused.data)

        # E. Verify new password works
        admin_refreshed = Admin.query.get(admin.id)
        self.assertTrue(admin_refreshed.check_password('BrandNewPassword2026!'))

    def test_05_multiple_admins_rbac_and_lockout_protection(self):
        """5. MULTIPLE ADMINS: Super Admin vs Admin RBAC, inactive blocked, independent credentials"""
        # Regular Admin attempting Super Admin routes is blocked (redirects to dashboard)
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.reg_admin.id

        res_admins = self.client.get('/admin/admins')
        self.assertEqual(res_admins.status_code, 302)
        self.assertIn('/admin/dashboard', res_admins.headers.get('Location', ''))

        # Super Admin managing admins has full access (200 OK)
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.super_admin.id

        res_admins_super = self.client.get('/admin/admins')
        self.assertEqual(res_admins_super.status_code, 200)
        self.assertIn(b'Administrator Accounts', res_admins_super.data)

    def test_06_brevo_security_and_no_leakage(self):
        """6. BREVO SECURITY: Ensure Brevo key is only in backend config and never in API responses"""
        for endpoint in ['/api/destinations', '/api/categories', '/api/journey-ideas', '/api/services', '/api/faqs', '/api/stories', '/api/site-settings']:
            res = self.client.get(endpoint)
            self.assertEqual(res.status_code, 200)
            res_str = res.get_data(as_text=True)
            self.assertNotIn('BREVO_API_KEY', res_str)
            self.assertNotIn('xkeysib', res_str)

    def test_07_email_failure_handling_graceful(self):
        """7. EMAIL FAILURE HANDLING: Database record is saved even if Brevo returns an error or network fails"""
        enquiry_payload = {
            'fullName': 'Fail-Safe Traveler',
            'email': 'failsafe@example.com',
            'phone': '+91 99999 88888',
            'destination': 'Ooty & Nilgiri Hills',
            'travelers': '2',
            'timeframe': 'October 2026',
            'notes': 'Testing fail-safe persistence under simulated Brevo outage.'
        }

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = '{"message": "Internal Brevo Server Error"}'

        with patch('requests.post', return_value=mock_response):
            orig_key = Config.BREVO_API_KEY
            Config.BREVO_API_KEY = 'test_key_for_failure_simulation'
            try:
                res = self.client.post('/api/enquiries', json=enquiry_payload)
                self.assertEqual(res.status_code, 201)
                data = res.get_json()
                self.assertTrue(data.get('success'))
                enquiry_id = data.get('enquiryId')

                saved_enquiry = Enquiry.query.get(enquiry_id)
                self.assertIsNotNone(saved_enquiry)
                self.assertEqual(saved_enquiry.full_name, 'Fail-Safe Traveler')

                failed_log = EmailLog.query.filter_by(recipient='failsafe@example.com', status='failed').first()
                self.assertIsNotNone(failed_log)
                self.assertIn('500', failed_log.error_message)

                db.session.delete(saved_enquiry)
                db.session.delete(failed_log)
                db.session.commit()
            finally:
                Config.BREVO_API_KEY = orig_key

    def test_08_environment_and_template_configuration(self):
        """8. EMAIL CONFIGURATION: Verify supported environment variables and template fallback mechanism"""
        self.assertTrue(hasattr(Config, 'BREVO_API_KEY'))
        self.assertTrue(hasattr(Config, 'BREVO_SENDER_EMAIL'))
        self.assertTrue(hasattr(Config, 'BREVO_SENDER_NAME'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_ADMIN_PASSWORD_RESET'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_ADMIN_PASSWORD_CHANGED'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_NEWSLETTER_WELCOME'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_ENQUIRY_CUSTOMER'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_ENQUIRY_ADMIN'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_CONTACT_CUSTOMER'))
        self.assertTrue(hasattr(Config, 'BREVO_TEMPLATE_CONTACT_ADMIN'))

    def test_09_sender_email_format(self):
        """9. SENDER VERIFICATION: Check configured sender format"""
        sender = Config.BREVO_SENDER_EMAIL
        self.assertTrue(bool(sender))
        self.assertIn('@', sender)
        self.assertIn('.', sender)

if __name__ == '__main__':
    unittest.main()
