"""
==============================================================================
THE TRANSIT STORY — BREVO TRANSACTIONAL EMAIL SERVICE
==============================================================================
Server-side email delivery service using Brevo (Sendinblue) Transactional API.
- All credentials stay securely on the backend in environment variables.
- Supports both Brevo Transactional Templates & rich fallback HTML templates.
- Gracefully handles delivery failures without crashing public form workflows.
- Logs email operations to the database (EmailLog table) without sensitive data.
==============================================================================
"""

import json
import logging
import re
import requests
from datetime import datetime
from flask import current_app
from backend.config import Config
from backend.db import db
from backend.models import EmailLog, SiteSetting, Admin

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def get_notification_recipient_emails():
    """
    Retrieves the configured recipient emails for admin notifications.
    Checks SiteSetting ('notification_emails'), otherwise falls back to all active admins.
    """
    try:
        setting = SiteSetting.query.filter_by(setting_key='notification_emails').first()
        if setting and setting.setting_value:
            emails = [e.strip() for e in setting.setting_value.split(',') if e.strip() and '@' in e]
            if emails:
                return emails
    except Exception as e:
        logger.warning(f"[EmailService] Could not read notification_emails setting: {e}")

    try:
        # Fallback to all active admins
        admins = Admin.query.filter_by(is_active=True).all()
        admin_emails = [a.email for a in admins if a.email]
        if admin_emails:
            return admin_emails
    except Exception as e:
        logger.warning(f"[EmailService] Could not query active admin emails: {e}")

    return [Config.BREVO_SENDER_EMAIL]


def _build_html_email(title, subtitle, content_blocks, action_button=None, footer_note=None):
    """
    Generates a responsive HTML email matching The Transit Story editorial aesthetic.
    Brand Palette:
      - Deep Forest: #173A2D
      - Warm Ivory: #FAF7F0
      - Accent Gold: #C49A45
      - Charcoal: #2D312C
      - Earth Muted: #6B7268
    """
    action_html = ""
    if action_button and action_button.get('url'):
        btn_text = action_button.get('text', 'View Details')
        btn_url = action_button.get('url')
        action_html = f"""
        <div style="margin: 28px 0 20px 0; text-align: center;">
          <a href="{btn_url}" style="display: inline-block; background-color: #173A2D; color: #FAF7F0; text-decoration: none; padding: 13px 28px; border-radius: 2px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; border: 1px solid #173A2D;">
            {btn_text} &rarr;
          </a>
        </div>
        """

    footer_text = footer_note or "Travel beyond destinations. Discover living stories across South India."

    blocks_html = "".join(content_blocks)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4EFE6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4EFE6; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FAF7F0; border: 1px solid #E3DCBF; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 18px rgba(23, 58, 45, 0.06);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #173A2D; padding: 26px 32px; text-align: center; border-bottom: 2px solid #C49A45;">
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; color: #FAF7F0; letter-spacing: 0.05em; font-weight: 400; text-transform: uppercase;">
                Transit Story
              </div>
              <div style="font-size: 10px; color: #C49A45; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 4px; font-weight: 500;">
                Curated Journeys | Crafted Experiences
              </div>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; color: #2D312C; line-height: 1.6;">
              {f'<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C49A45; font-weight: 600; margin-bottom: 6px;">{subtitle}</div>' if subtitle else ''}
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; color: #173A2D; font-weight: normal; margin: 0 0 20px 0; line-height: 1.25;">
                {title}
              </h1>

              <div style="font-size: 14px; color: #3A4038; line-height: 1.65;">
                {blocks_html}
              </div>

              {action_html}
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #EFE9DC; padding: 22px 32px; text-align: center; border-top: 1px solid #E3DCBF; font-size: 11px; color: #6B7268; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 500; color: #173A2D;">Transit Story &bull; Curator Desk</p>
              <p style="margin: 0 0 8px 0;">{footer_text}</p>
              <p style="margin: 0; font-size: 10px; color: #8F958C;">Tamil Nadu, South India &bull; Rooted in Heritage</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _send_brevo_email(to_email, to_name, subject, html_content=None, reply_to_email=None, reply_to_name=None, template_id=None, params=None, email_type='generic', related_record_id=None):
    """
    Core low-level dispatcher to Brevo Transactional Email API.
    Handles configuration checks, timeouts, logging, and graceful fallbacks.
    """
    if not to_email:
        return False, "Recipient email is missing"

    api_key = Config.BREVO_API_KEY
    sender_email = Config.BREVO_SENDER_EMAIL
    sender_name = Config.BREVO_SENDER_NAME

    # If Brevo API key is not configured (e.g. initial local dev mode)
    if not api_key:
        logger.info(f"[Brevo Email Service] Skipped '{email_type}' to <{to_email}> (BREVO_API_KEY is not configured in environment).")
        try:
            log_entry = EmailLog(
                email_type=email_type,
                recipient=to_email,
                status='skipped',
                related_record_id=related_record_id,
                error_message="BREVO_API_KEY not configured in environment (Development Mode)."
            )
            db.session.add(log_entry)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return True, "Brevo email skipped (API key not configured)"

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": api_key
    }

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject
    }

    if reply_to_email:
        payload["replyTo"] = {"email": reply_to_email, "name": reply_to_name or reply_to_email}

    # If template ID is configured and specified
    if template_id and str(template_id).isdigit():
        payload["templateId"] = int(template_id)
        if params:
            payload["params"] = params
    else:
        # Send rendered HTML content
        payload["htmlContent"] = html_content or f"<p>{subject}</p>"
        if params:
            payload["params"] = params

    try:
        response = requests.post(BREVO_API_URL, headers=headers, json=payload, timeout=8.0)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"[Brevo Email Service] Successfully sent '{email_type}' to <{to_email}>.")
            try:
                log_entry = EmailLog(
                    email_type=email_type,
                    recipient=to_email,
                    status='sent',
                    related_record_id=related_record_id
                )
                db.session.add(log_entry)
                db.session.commit()
            except Exception:
                db.session.rollback()
            return True, "Email sent successfully"
        else:
            err_msg = f"Brevo API error HTTP {response.status_code}: {response.text[:200]}"
            logger.warning(f"[Brevo Email Service] Failed '{email_type}' to <{to_email}>: {err_msg}")
            try:
                log_entry = EmailLog(
                    email_type=email_type,
                    recipient=to_email,
                    status='failed',
                    related_record_id=related_record_id,
                    error_message=err_msg
                )
                db.session.add(log_entry)
                db.session.commit()
            except Exception:
                db.session.rollback()
            return False, err_msg

    except Exception as exc:
        err_msg = f"Network/Connection error during Brevo dispatch: {str(exc)[:200]}"
        logger.error(f"[Brevo Email Service] Exception during '{email_type}' to <{to_email}>: {err_msg}")
        try:
            log_entry = EmailLog(
                email_type=email_type,
                recipient=to_email,
                status='failed',
                related_record_id=related_record_id,
                error_message=err_msg
            )
            db.session.add(log_entry)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return False, err_msg


# ==============================================================================
# HIGH-LEVEL TRANSACTIONAL EMAIL WORKFLOWS
# ==============================================================================

def send_admin_password_reset(admin, reset_token, reset_url):
    """
    Sends a secure password reset email to an admin user with a single-use token link.
    """
    subject = "Reset Your Password — Transit Story Curator Desk"
    template_id = Config.BREVO_TEMPLATE_ADMIN_PASSWORD_RESET

    params = {
        "admin_name": admin.name,
        "email": admin.email,
        "reset_link": reset_url,
        "expires_in": "60 minutes"
    }

    content_blocks = [
        f"<p>Hello <strong>{admin.name}</strong>,</p>",
        "<p>We received a request to reset the password for your administrator account on <strong>Transit Story Curator Desk</strong>.</p>",
        "<p>Click the button below to choose a new password. This link is single-use and will expire in <strong>60 minutes</strong>:</p>",
        f'<p style="background: #FAF3E3; border-left: 3px solid #C49A45; padding: 10px 14px; font-size: 13px; color: #5A5243; margin: 18px 0;">If you did not request this password reset, you can safely disregard this message. Your password will remain unchanged.</p>'
    ]

    action_btn = {
        "text": "Reset Password Now",
        "url": reset_url
    }

    html_content = _build_html_email(
        title="Admin Password Reset Request",
        subtitle="Security & Access",
        content_blocks=content_blocks,
        action_button=action_btn,
        footer_note="For security reasons, this link can only be used once."
    )

    return _send_brevo_email(
        to_email=admin.email,
        to_name=admin.name,
        subject=subject,
        html_content=html_content,
        template_id=template_id,
        params=params,
        email_type="admin_password_reset",
        related_record_id=admin.id
    )


def send_admin_password_changed(admin):
    """
    Sends a security notification confirming that the admin password was changed.
    """
    subject = "Your Password Has Been Updated — Transit Story"
    template_id = Config.BREVO_TEMPLATE_ADMIN_PASSWORD_CHANGED

    params = {
        "admin_name": admin.name,
        "email": admin.email,
        "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    }

    content_blocks = [
        f"<p>Hello <strong>{admin.name}</strong>,</p>",
        "<p>This email confirms that the password for your administrator account (<strong>" + admin.email + "</strong>) was successfully changed.</p>",
        f'<p style="background: #FAF3E3; border-left: 3px solid #C49A45; padding: 10px 14px; font-size: 13px; color: #5A5243; margin: 18px 0;">If you did not perform this change, please contact the lead curator immediately to secure your account.</p>'
    ]

    html_content = _build_html_email(
        title="Password Successfully Updated",
        subtitle="Security Notice",
        content_blocks=content_blocks,
        footer_note="Curator Desk Administrator Account Security"
    )

    return _send_brevo_email(
        to_email=admin.email,
        to_name=admin.name,
        subject=subject,
        html_content=html_content,
        template_id=template_id,
        params=params,
        email_type="admin_password_changed",
        related_record_id=admin.id
    )


def send_newsletter_welcome(subscriber_email):
    """
    Sends a warm welcome email to newly subscribed visitors.
    """
    subject = "Welcome to Transit Story ✨"
    template_id = Config.BREVO_TEMPLATE_NEWSLETTER_WELCOME

    params = {
        "email": subscriber_email
    }

    content_blocks = [
        "<p>Thank you for connecting with <strong>Transit Story</strong>.</p>",
        "<p>We curate unhurried journeys, cultural storytelling, private transit, and heritage immersions across South India. From living temple corridors and tea estates to historic backwaters and artisan villages, we design travel experiences around your pacing.</p>",
        "<p>You will occasionally receive our field chronicles, regional travel notes, and seasonal itinerary inspirations.</p>",
        '<div style="border-top: 1px solid #E3DCBF; margin: 24px 0 16px 0; padding-top: 16px; font-style: italic; color: #5A6058; font-family: Georgia, serif;">&ldquo;You choose the journey. We arrange the rest.&rdquo;</div>'
    ]

    action_btn = {
        "text": "Explore Curated Tours",
        "url": f"{Config.APP_BASE_URL}/tours"
    }

    html_content = _build_html_email(
        title="Welcome to Our Travel Circle",
        subtitle="Field Chronicles & Inspirations",
        content_blocks=content_blocks,
        action_button=action_btn,
        footer_note="You received this email because you subscribed to updates at thetransitstory.com."
    )

    return _send_brevo_email(
        to_email=subscriber_email,
        to_name=subscriber_email,
        subject=subject,
        html_content=html_content,
        template_id=template_id,
        params=params,
        email_type="newsletter_welcome"
    )


def send_enquiry_customer_confirmation(enquiry):
    """
    Sends a confirmation email to the traveler after submitting a journey enquiry.
    """
    subject = "We received your journey enquiry — Transit Story"
    template_id = Config.BREVO_TEMPLATE_ENQUIRY_CUSTOMER

    submitted_at = enquiry.created_at.strftime('%d %b %Y, %I:%M %p IST') if enquiry.created_at else "Recently"
    dest_label = enquiry.destination or "Custom South India Circuit"
    travellers_label = enquiry.travellers or "Not specified"
    timeframe_label = enquiry.timeframe or "Flexible dates"

    params = {
        "name": enquiry.full_name,
        "email": enquiry.email,
        "phone": enquiry.phone,
        "destination": dest_label,
        "travellers": travellers_label,
        "timeframe": timeframe_label,
        "notes": enquiry.notes or "None provided",
        "submitted_at": submitted_at
    }

    content_blocks = [
        f"<p>Dear <strong>{enquiry.full_name}</strong>,</p>",
        "<p>Thank you for reaching out to <strong>Transit Story</strong>. We have received your journey enquiry and our curation desk is reviewing your requirements.</p>",
        """
        <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #F6F1E5; border: 1px solid #E0D7BD; border-radius: 3px; font-size: 13px; margin: 18px 0;">
          <tr>
            <td width="35%" style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Destination / Route</td>
            <td style="color: #173A2D; font-weight: 600; border-bottom: 1px solid #E8E0CB;">""" + dest_label + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Travellers / Cohort</td>
            <td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">""" + travellers_label + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Preferred Timing</td>
            <td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">""" + timeframe_label + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600;">Contact Phone</td>
            <td style="color: #173A2D;">""" + enquiry.phone + """</td>
          </tr>
        </table>
        """,
        "<p>A dedicated travel curator will connect with you via phone or email to discuss tailored routing, vehicle arrangements, stays, and pacing.</p>"
    ]

    html_content = _build_html_email(
        title="Your Journey Request Has Been Received",
        subtitle="Bespoke Travel Coordination",
        content_blocks=content_blocks,
        footer_note="For urgent updates regarding your journey, reply directly to this email."
    )

    return _send_brevo_email(
        to_email=enquiry.email,
        to_name=enquiry.full_name,
        subject=subject,
        html_content=html_content,
        template_id=template_id,
        params=params,
        email_type="enquiry_customer",
        related_record_id=enquiry.id
    )


def send_enquiry_admin_notification(enquiry, recipient_emails=None):
    """
    Sends notification to configured owner/admin recipient emails with customer details and Reply-To.
    """
    recipients = recipient_emails or get_notification_recipient_emails()
    if not recipients:
        return False, "No admin notification recipients configured"

    subject = f"New Journey Enquiry — {enquiry.full_name} ({enquiry.destination or 'Custom'})"
    template_id = Config.BREVO_TEMPLATE_ENQUIRY_ADMIN
    submitted_at = enquiry.created_at.strftime('%d %b %Y, %I:%M %p IST') if enquiry.created_at else "Recently"
    dest_label = enquiry.destination or "Custom Journey"
    admin_enquiry_url = f"{Config.APP_BASE_URL}/admin/enquiries"

    params = {
        "name": enquiry.full_name,
        "email": enquiry.email,
        "phone": enquiry.phone,
        "destination": dest_label,
        "travellers": enquiry.travellers or "Not specified",
        "timeframe": enquiry.timeframe or "Flexible",
        "notes": enquiry.notes or "None",
        "submitted_at": submitted_at,
        "admin_url": admin_enquiry_url
    }

    content_blocks = [
        f"<p>A new journey planning request has been submitted on <strong>thetransitstory.com</strong>:</p>",
        """
        <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #FAF3E3; border: 1px solid #E0D7BD; border-radius: 3px; font-size: 13px; margin: 16px 0;">
          <tr>
            <td width="35%" style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Traveler Name</td>
            <td style="color: #173A2D; font-weight: 700; border-bottom: 1px solid #E8E0CB;">""" + enquiry.full_name + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Phone (Mandatory)</td>
            <td style="color: #173A2D; font-weight: 700; border-bottom: 1px solid #E8E0CB;">""" + enquiry.phone + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Email</td>
            <td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">""" + enquiry.email + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Destination / Route</td>
            <td style="color: #173A2D; font-weight: 600; border-bottom: 1px solid #E8E0CB;">""" + dest_label + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Group / Cohort</td>
            <td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">""" + (enquiry.travellers or 'Not specified') + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Timing</td>
            <td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">""" + (enquiry.timeframe or 'Not specified') + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600;">Message / Notes</td>
            <td style="color: #2D312C;">""" + (enquiry.notes or 'None') + """</td>
          </tr>
        </table>
        """,
        '<p style="font-size: 12px; color: #6B7268;">You can reply directly to this email to contact the traveler, or open the enquiry in the curator dashboard.</p>'
    ]

    action_btn = {
        "text": "Open in Admin Dashboard",
        "url": admin_enquiry_url
    }

    html_content = _build_html_email(
        title="New Journey Enquiry Received",
        subtitle="Lead Notification",
        content_blocks=content_blocks,
        action_button=action_btn,
        footer_note="Curator Desk Automated Lead Alert"
    )

    results = []
    for recipient in recipients:
        res, msg = _send_brevo_email(
            to_email=recipient,
            to_name="Curator Desk",
            subject=subject,
            html_content=html_content,
            reply_to_email=enquiry.email,
            reply_to_name=enquiry.full_name,
            template_id=template_id,
            params=params,
            email_type="enquiry_admin",
            related_record_id=enquiry.id
        )
        results.append(res)

    return any(results), "Admin notifications dispatched"


def send_contact_customer_confirmation(enquiry):
    """
    Sends confirmation to visitor after submitting the general contact form.
    """
    subject = "Thank you for contacting Transit Story"
    template_id = Config.BREVO_TEMPLATE_CONTACT_CUSTOMER

    submitted_at = enquiry.created_at.strftime('%d %b %Y, %I:%M %p IST') if enquiry.created_at else "Recently"

    params = {
        "name": enquiry.full_name,
        "email": enquiry.email,
        "phone": enquiry.phone,
        "message": enquiry.notes or "None",
        "submitted_at": submitted_at
    }

    content_blocks = [
        f"<p>Dear <strong>{enquiry.full_name}</strong>,</p>",
        "<p>Thank you for reaching out to <strong>Transit Story</strong>. We have received your message and our team will get back to you shortly.</p>",
        f'<div style="background: #F6F1E5; border: 1px solid #E0D7BD; border-radius: 3px; padding: 14px; font-size: 13px; color: #2D312C; margin: 16px 0;"><strong>Your Message:</strong><br><span style="color: #5A6058;">{enquiry.notes or "General inquiry"}</span></div>',
        "<p>If your travel dates or requirements are urgent, feel free to reply directly to this email.</p>"
    ]

    html_content = _build_html_email(
        title="We Have Received Your Message",
        subtitle="Inquiry Confirmation",
        content_blocks=content_blocks,
        footer_note="Transit Story &bull; Curator Desk"
    )

    return _send_brevo_email(
        to_email=enquiry.email,
        to_name=enquiry.full_name,
        subject=subject,
        html_content=html_content,
        template_id=template_id,
        params=params,
        email_type="contact_customer",
        related_record_id=enquiry.id
    )


def send_contact_admin_notification(enquiry, recipient_emails=None):
    """
    Sends notification to admin recipients for general contact messages with Reply-To set to visitor.
    """
    recipients = recipient_emails or get_notification_recipient_emails()
    if not recipients:
        return False, "No admin notification recipients configured"

    subject = f"New Contact Message — {enquiry.full_name}"
    template_id = Config.BREVO_TEMPLATE_CONTACT_ADMIN
    submitted_at = enquiry.created_at.strftime('%d %b %Y, %I:%M %p IST') if enquiry.created_at else "Recently"
    admin_enquiry_url = f"{Config.APP_BASE_URL}/admin/enquiries"

    params = {
        "name": enquiry.full_name,
        "email": enquiry.email,
        "phone": enquiry.phone,
        "message": enquiry.notes or "None",
        "submitted_at": submitted_at,
        "admin_url": admin_enquiry_url
    }

    content_blocks = [
        f"<p>A new general message was received on <strong>thetransitstory.com/contact</strong>:</p>",
        """
        <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #FAF3E3; border: 1px solid #E0D7BD; border-radius: 3px; font-size: 13px; margin: 16px 0;">
          <tr>
            <td width="35%" style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Sender Name</td>
            <td style="color: #173A2D; font-weight: 700; border-bottom: 1px solid #E8E0CB;">""" + enquiry.full_name + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Phone (Mandatory)</td>
            <td style="color: #173A2D; font-weight: 700; border-bottom: 1px solid #E8E0CB;">""" + enquiry.phone + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Email</td>
            <td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">""" + enquiry.email + """</td>
          </tr>
          <tr>
            <td style="color: #6B7268; font-weight: 600;">Message Content</td>
            <td style="color: #2D312C;">""" + (enquiry.notes or 'None') + """</td>
          </tr>
        </table>
        """,
        '<p style="font-size: 12px; color: #6B7268;">Clicking reply in your email client will respond directly to the sender.</p>'
    ]

    action_btn = {
        "text": "Open in Admin Dashboard",
        "url": admin_enquiry_url
    }

    html_content = _build_html_email(
        title="New Contact Message",
        subtitle="Website Message",
        content_blocks=content_blocks,
        action_button=action_btn,
        footer_note="Curator Desk Automated Notification"
    )

    results = []
    for recipient in recipients:
        res, msg = _send_brevo_email(
            to_email=recipient,
            to_name="Curator Desk",
            subject=subject,
            html_content=html_content,
            reply_to_email=enquiry.email,
            reply_to_name=enquiry.full_name,
            template_id=template_id,
            params=params,
            email_type="contact_admin",
            related_record_id=enquiry.id
        )
        results.append(res)

    return any(results), "Admin notifications dispatched"

# ==============================================================================
# ADMIN DIAGNOSTIC TEST EMAIL WORKFLOW
# ==============================================================================

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def is_valid_email(email):
    """Checks whether the provided string matches valid email format."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def send_test_email(recipient_email):
    """
    Sends a diagnostic test email to verify the current Brevo API integration & sender config.
    Security guarantees:
    - Never exposes or returns BREVO_API_KEY in errors, logs, or UI
    - Reads sender details strictly from server configuration
    - Validates recipient email
    - Does not store test recipient emails unnecessarily
    - Returns safe status and user-friendly message
    """
    clean_recipient = recipient_email.strip() if recipient_email and isinstance(recipient_email, str) else ''
    if not clean_recipient or not is_valid_email(clean_recipient):
        return False, "Please enter a valid recipient email address."

    api_key = Config.BREVO_API_KEY
    if not api_key:
        return False, "Brevo API key is not configured."

    sender_email = Config.BREVO_SENDER_EMAIL
    sender_name = Config.BREVO_SENDER_NAME
    if not sender_email or '@' not in sender_email or not sender_name:
        return False, "Brevo sender configuration is incomplete."

    subject = "Transit Story — Brevo Email Test"
    timestamp_str = datetime.utcnow().strftime('%d %b %Y, %I:%M:%S %p UTC')

    content_blocks = [
        '<div style="background-color: #FAF3E3; border-left: 3px solid #C49A45; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #5A5243;">',
        '  <strong style="color: #173A2D; font-size: 14px;">Brevo Email Configuration Test</strong><br>',
        '  This is a test email from Transit Story admin panel.',
        '</div>',
        '<p style="margin: 0 0 16px 0; color: #2D312C; font-size: 14px; line-height: 1.6;">',
        '  Your Brevo API integration is responding to the test request.',
        '</p>',
        '<table width="100%" cellpadding="8" cellspacing="0" style="background-color: #F6F1E5; border: 1px solid #E0D7BD; border-radius: 3px; font-size: 13px; margin: 18px 0;">',
        f'  <tr><td width="35%" style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Sender Name</td><td style="color: #173A2D; font-weight: 600; border-bottom: 1px solid #E8E0CB;">{sender_name}</td></tr>',
        f'  <tr><td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Sender Email</td><td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">{sender_email}</td></tr>',
        f'  <tr><td style="color: #6B7268; font-weight: 600; border-bottom: 1px solid #E8E0CB;">Recipient Email</td><td style="color: #173A2D; border-bottom: 1px solid #E8E0CB;">{clean_recipient}</td></tr>',
        f'  <tr><td style="color: #6B7268; font-weight: 600;">Date & Time</td><td style="color: #2D312C;">{timestamp_str}</td></tr>',
        '</table>',
        '<p style="font-size: 12px; color: #6B7268; margin-top: 14px; line-height: 1.5;">',
        '  Submission confirmed: The Brevo Transactional API accepted this message for dispatch.',
        '</p>'
    ]

    html_content = _build_html_email(
        title="Brevo Email Configuration Test",
        subtitle="System Diagnostic",
        content_blocks=content_blocks,
        footer_note="Transit Story • Curator Desk System Diagnostic"
    )

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": api_key
    }

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": clean_recipient, "name": clean_recipient}],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        response = requests.post(BREVO_API_URL, headers=headers, json=payload, timeout=10.0)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"[Brevo Email Test] Test email successfully accepted by Brevo for <{clean_recipient}>.")
            return True, "Test email accepted by Brevo."
        else:
            resp_text = response.text or ""
            resp_lower = resp_text.lower()
            safe_resp = resp_text.replace(api_key, "[REDACTED]")
            logger.warning(f"[Brevo Email Test] Brevo rejected HTTP {response.status_code}: {safe_resp[:200]}")

            if "unverified" in resp_lower or "not verified" in resp_lower or "sender" in resp_lower or "domain" in resp_lower or "not valid" in resp_lower:
                return False, "Brevo rejected the email because the configured sender is not verified. Verify the sender in Brevo and try again."
            elif response.status_code == 401 or "unauthorized" in resp_lower or "key not found" in resp_lower:
                return False, "Brevo rejected the request: Invalid API key or unauthorized."
            else:
                return False, f"Brevo rejected the test email (HTTP {response.status_code}). Please verify your Brevo configuration."

    except requests.exceptions.Timeout:
        logger.error("[Brevo Email Test] Connection to Brevo timed out.")
        return False, "Connection to Brevo timed out. Please try again."
    except Exception as exc:
        err_msg = str(exc).replace(api_key, "[REDACTED]")
        logger.error(f"[Brevo Email Test] Error during test dispatch: {err_msg[:200]}")
        return False, "Failed to connect to Brevo API. Please check network connectivity and try again."

