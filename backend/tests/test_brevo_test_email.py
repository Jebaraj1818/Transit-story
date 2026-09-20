"""
Test suite for Admin Brevo Test Email Feature:
1. Unauthenticated request is rejected.
2. Authenticated admin can access the endpoint.
3. Invalid recipient is rejected.
4. Missing BREVO_API_KEY is handled safely.
5. Brevo success response is handled correctly.
6. Brevo failure response is handled safely.
7. API key never appears in the response or logs.
"""

import json
import logging
import unittest
from unittest.mock import patch, MagicMock

from backend.app import app
from backend.config import Config
from backend.db import db
from backend.models import Admin
from backend.services.email_service import send_test_email, is_valid_email

class BrevoTestEmailEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.client.get('/admin/logout')

        # Ensure active test admin exists
        self.admin = Admin.query.filter_by(email="test_curator@thetransitstory.com").first()
        if not self.admin:
            self.admin = Admin(
                name="Test Curator",
                email="test_curator@thetransitstory.com",
                role="ADMIN",
                is_active=True
            )
            db.session.add(self.admin)
        self.admin.is_active = True
        self.admin.set_password("AdminSecret2026!")
        db.session.commit()

    def tearDown(self):
        self.client.get('/admin/logout')
        self.ctx.pop()

    def test_01_unauthenticated_request_rejected(self):
        """1. Unauthenticated request to /admin/api/test-email must be rejected with 401"""
        res = self.client.post('/admin/api/test-email', json={
            'recipient_email': 'visitor@example.com'
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Unauthorized. Admin login required.')

    def test_02_authenticated_admin_can_access_endpoint(self):
        """2. Authenticated admin can access the endpoint"""
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

        with patch('backend.routes.admin.send_test_email') as mock_send:
            mock_send.return_value = (True, "Test email accepted by Brevo.")
            res = self.client.post('/admin/api/test-email', json={
                'recipient_email': 'valid@example.com'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('message'), "Test email accepted by Brevo.")
            mock_send.assert_called_once_with('valid@example.com')

    def test_03_invalid_recipient_is_rejected(self):
        """3. Invalid recipient email is rejected with 400 and clear error"""
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

        invalid_emails = ['', '   ', 'not-an-email', 'missing@domain', '@missinguser.com', 'bad@.com']
        for bad_email in invalid_emails:
            res = self.client.post('/admin/api/test-email', json={
                'recipient_email': bad_email
            })
            self.assertEqual(res.status_code, 400, f"Expected 400 for '{bad_email}'")
            data = res.get_json()
            self.assertFalse(data.get('success'))
            self.assertEqual(data.get('message'), "Please enter a valid recipient email address.")

    def test_04_missing_brevo_api_key_handled_safely(self):
        """4. Missing BREVO_API_KEY is handled safely without crashing"""
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

        with patch.object(Config, 'BREVO_API_KEY', ''):
            res = self.client.post('/admin/api/test-email', json={
                'recipient_email': 'recipient@example.com'
            })
            self.assertEqual(res.status_code, 400)
            data = res.get_json()
            self.assertFalse(data.get('success'))
            self.assertEqual(data.get('message'), "Brevo API key is not configured.")

    def test_05_brevo_success_response_handled_correctly(self):
        """5. Brevo 200/201/202 success response handled correctly"""
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

        mock_resp = MagicMock()
        mock_resp.status_code = 201
        mock_resp.text = json.dumps({'messageId': '<test-msg-123@smtp-relay.brevo.com>'})

        with patch.object(Config, 'BREVO_API_KEY', 'xkeysib-mock-test-key-999'), \
             patch('requests.post', return_value=mock_resp) as mock_post:
            res = self.client.post('/admin/api/test-email', json={
                'recipient_email': 'traveler@thetransitstory.com'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get('success'))
            self.assertIn("accepted by Brevo", data.get('message'))
            # Verify payload sent to Brevo
            mock_post.assert_called_once()
            called_kwargs = mock_post.call_args[1]
            self.assertEqual(called_kwargs['json']['to'][0]['email'], 'traveler@thetransitstory.com')
            self.assertEqual(called_kwargs['json']['subject'], "The Transit Story — Brevo Email Test")

    def test_06_brevo_failure_response_handled_safely(self):
        """6. Brevo failure responses (e.g. unverified sender) return friendly message"""
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

        # Case A: Unverified sender error from Brevo
        mock_resp_unverified = MagicMock()
        mock_resp_unverified.status_code = 400
        mock_resp_unverified.text = json.dumps({
            'code': 'invalid_parameter',
            'message': "Key 'sender' is not valid: sender is not verified"
        })

        with patch.object(Config, 'BREVO_API_KEY', 'xkeysib-mock-test-key-999'), \
             patch('requests.post', return_value=mock_resp_unverified):
            res = self.client.post('/admin/api/test-email', json={
                'recipient_email': 'test@example.com'
            })
            self.assertEqual(res.status_code, 400)
            data = res.get_json()
            self.assertFalse(data.get('success'))
            self.assertEqual(
                data.get('message'),
                "Brevo rejected the email because the configured sender is not verified. Verify the sender in Brevo and try again."
            )

        # Case B: Generic Brevo 500 error
        mock_resp_500 = MagicMock()
        mock_resp_500.status_code = 500
        mock_resp_500.text = "Internal Server Error"

        with patch.object(Config, 'BREVO_API_KEY', 'xkeysib-mock-test-key-999'), \
             patch('requests.post', return_value=mock_resp_500):
            res500 = self.client.post('/admin/api/test-email', json={
                'recipient_email': 'test@example.com'
            })
            self.assertEqual(res500.status_code, 400)
            data500 = res500.get_json()
            self.assertFalse(data500.get('success'))
            self.assertIn("Brevo rejected the test email (HTTP 500)", data500.get('message'))

    def test_07_api_key_never_appears_in_response_or_logs(self):
        """7. API key never appears in HTTP response or logs during success or failure"""
        with self.client.session_transaction() as sess:
            sess['admin_id'] = self.admin.id

        secret_key = "xkeysib-VERY-SECRET-TEST-KEY-NEVER-LEAK"

        mock_fail = MagicMock()
        mock_fail.status_code = 401
        mock_fail.text = f'{{"code": "unauthorized", "message": "Key {secret_key} rejected"}}'

        with patch.object(Config, 'BREVO_API_KEY', secret_key), \
             patch('requests.post', return_value=mock_fail), \
             self.assertLogs('backend.services.email_service', level='WARNING') as cm:
            res = self.client.post('/admin/api/test-email', json={
                'recipient_email': 'test@example.com'
            })
            # Check response body
            raw_response = res.get_data(as_text=True)
            self.assertNotIn(secret_key, raw_response)
            # Check logs
            full_logs = "\n".join(cm.output)
            self.assertNotIn(secret_key, full_logs)
            self.assertIn("[REDACTED]", full_logs)
