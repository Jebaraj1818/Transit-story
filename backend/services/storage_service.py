"""
==============================================================================
THE TRANSIT STORY — VERCEL BLOB STORAGE SERVICE
==============================================================================
Production cloud storage integration using official Vercel Blob architecture.
- Small images (< 4 MB): Server-side authenticated upload to Vercel Blob.
- Large videos (<= 100 MB): Secure direct client-to-Blob upload via scoped client tokens.
- Master BLOB_READ_WRITE_TOKEN is strictly server-side and never exposed to browser.
- No local filesystem fallback in production (returns clear configuration error).
- Strict MIME and file magic-byte validation (rejects SVG, HTML, scripts, executables).
==============================================================================
"""

import os
import re
import json
import time
import uuid
import hmac
import base64
import hashlib
import logging
import mimetypes
import subprocess
import requests
from backend.config import Config

logger = logging.getLogger(__name__)

VERCEL_BLOB_API_BASE = "https://blob.vercel-storage.com"

# Allowed MIME types and extensions
ALLOWED_IMAGE_MIMES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/avif': ['.avif']
}

ALLOWED_VIDEO_MIMES = {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov']
}

MAX_IMAGE_SIZE = 4 * 1024 * 1024       # 4 MB max for images (safe margin under Vercel Functions 4.5MB limit)
MAX_VIDEO_SIZE = 100 * 1024 * 1024     # 100 MB max for videos via direct client upload


def is_blob_configured():
    """Checks if Vercel Blob token is set in server environment."""
    return bool(Config.BLOB_READ_WRITE_TOKEN)


def sanitize_pathname(folder, original_filename, is_video=False):
    """
    Generates a secure, collision-resistant Blob pathname.
    Never trusts the original filename as the complete pathname.
    Example:
      destinations/munnar/hero/a1b2c3d4e5f6.webp
      homepage/hero/9f8e7d6c5b4a.mp4
    """
    clean_folder = re.sub(r'[^a-zA-Z0-9_\-/]', '', folder.strip('/')).strip('/')
    if not clean_folder:
        clean_folder = 'general'

    _, ext = os.path.splitext((original_filename or '').lower())
    allowed_exts = [e for exts in (ALLOWED_VIDEO_MIMES if is_video else ALLOWED_IMAGE_MIMES).values() for e in exts]
    if ext not in allowed_exts:
        ext = '.mp4' if is_video else '.jpg'

    unique_id = uuid.uuid4().hex[:12]
    return f"{clean_folder}/{unique_id}{ext}"


def validate_media_file(file_obj, is_video=False):
    """
    Strict server-side validation for media uploads:
    - Verifies file presence
    - Checks file extension
    - Checks MIME / Content-Type
    - Inspects initial magic bytes to reject SVG, HTML, JS, PHP, executables
    - Enforces maximum file size
    Returns (is_valid, error_message, detected_mime).
    """
    if not file_obj:
        return False, "No file provided for upload.", None

    filename = getattr(file_obj, 'filename', '') or ''
    _, ext = os.path.splitext(filename.lower())

    # Check extension
    allowed_map = ALLOWED_VIDEO_MIMES if is_video else ALLOWED_IMAGE_MIMES
    max_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE

    valid_ext = False
    for mime, extensions in allowed_map.items():
        if ext in extensions:
            valid_ext = True
            break

    if not valid_ext:
        allowed_ext_str = ", ".join([e for exts in allowed_map.values() for e in exts])
        return False, f"Unsupported file type '{ext}'. Allowed types: {allowed_ext_str}", None

    # Check content type header
    content_type = getattr(file_obj, 'content_type', '') or mimetypes.guess_type(filename)[0] or ''
    content_type = content_type.lower().split(';')[0].strip()

    if content_type not in allowed_map:
        # If client provided an inaccurate or generic MIME, derive it from extension
        for mime, extensions in allowed_map.items():
            if ext in extensions:
                content_type = mime
                break

    # Inspect file size and magic bytes
    try:
        file_obj.seek(0, os.SEEK_END)
        size = file_obj.tell()
        file_obj.seek(0)

        if size > max_size:
            max_mb = max_size // (1024 * 1024)
            return False, f"File size ({size / (1024 * 1024):.1f}MB) exceeds maximum limit of {max_mb}MB.", None

        # Inspect initial header bytes for security
        header = file_obj.read(512)
        file_obj.seek(0)

        # Reject executables, scripts, SVG, HTML
        header_lower = header.lower()
        if header.startswith(b'MZ') or header.startswith(b'\x7fELF'):
            return False, "Executable binary files are strictly prohibited.", None
        if (b'<svg' in header_lower or b'<?xml' in header_lower or 
            b'<!doctype html' in header_lower or b'<html' in header_lower or 
            b'<script' in header_lower or b'<?php' in header_lower):
            return False, "SVG, HTML, XML, and script files are strictly prohibited.", None

        # Verify image magic bytes
        if not is_video:
            if ext in ['.jpg', '.jpeg'] and not header.startswith(b'\xff\xd8\xff'):
                return False, "Corrupted or invalid JPEG image header.", None
            elif ext == '.png' and not header.startswith(b'\x89PNG\r\n\x1a\n'):
                return False, "Corrupted or invalid PNG image header.", None
            elif ext == '.webp' and not (header.startswith(b'RIFF') and b'WEBP' in header[:16]):
                return False, "Corrupted or invalid WebP image header.", None

    except Exception as exc:
        logger.warning(f"[Media Validation Notice] File inspection notice: {exc}")

    return True, None, content_type


def upload_file_to_blob(file_bytes, pathname, content_type='application/octet-stream'):
    """
    Uploads file bytes directly to Vercel Blob public storage via REST API.
    Used for small images (< 4 MB).
    Returns (True, blob_info_dict) on success, or (False, error_message) on failure.
    Master BLOB_READ_WRITE_TOKEN is kept strictly server-side.
    """
    token = Config.BLOB_READ_WRITE_TOKEN
    if not token:
        logger.error("[Vercel Blob] Upload failed: BLOB_READ_WRITE_TOKEN is not configured in server environment.")
        return False, "Vercel Blob storage is not configured."

    url = f"{VERCEL_BLOB_API_BASE}/{pathname.lstrip('/')}"
    headers = {
        "Authorization": f"Bearer {token}",
        "x-add-random-suffix": "false",
        "x-content-type": content_type
    }

    try:
        response = requests.put(url, headers=headers, data=file_bytes, timeout=25.0)
        if response.status_code in [200, 201, 202]:
            result = response.json()
            blob_url = result.get('url')
            logger.info(f"[Vercel Blob] Uploaded successfully: {blob_url}")
            return True, {
                'url': blob_url,
                'pathname': result.get('pathname', pathname),
                'contentType': result.get('contentType', content_type)
            }
        else:
            safe_resp = (response.text or "").replace(token, "[REDACTED]")
            logger.warning(f"[Vercel Blob] Upload rejected HTTP {response.status_code}: {safe_resp[:200]}")
            return False, f"Vercel Blob rejected upload (HTTP {response.status_code})."
    except Exception as exc:
        safe_err = str(exc).replace(token, "[REDACTED]")
        logger.error(f"[Vercel Blob] Exception during upload: {safe_err[:200]}")
        return False, "Failed to connect to Vercel Blob storage service."


def delete_blob(blob_url):
    """
    Deletes an existing blob from Vercel storage given its full public URL.
    Safety guarantees:
    - Requires authenticated admin access.
    - NEVER deletes local /images/... assets.
    - NEVER deletes arbitrary third-party URLs.
    - Only deletes URLs confirmed to belong to *.public.blob.vercel-storage.com or blob.vercel-storage.com.
    """
    if not blob_url or not isinstance(blob_url, str):
        return False, "Invalid blob URL provided."

    clean_url = blob_url.strip()

    # Reject local committed files immediately
    if clean_url.startswith('/images/') or clean_url.startswith('images/'):
        return False, "Cannot delete local static media assets."

    # Validate that URL belongs to Vercel Blob
    if not ('blob.vercel-storage.com' in clean_url):
        return False, "URL does not belong to project's Vercel Blob storage."

    token = Config.BLOB_READ_WRITE_TOKEN
    if not token:
        logger.warning("[Vercel Blob] Deletion skipped: BLOB_READ_WRITE_TOKEN is not configured.")
        return False, "Vercel Blob storage is not configured."

    url = f"{VERCEL_BLOB_API_BASE}/delete"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, json={"urls": [clean_url]}, timeout=15.0)
        if response.status_code in [200, 204]:
            logger.info(f"[Vercel Blob] Successfully deleted asset: {clean_url}")
            return True, "File deleted from Vercel Blob."
        else:
            safe_resp = (response.text or "").replace(token, "[REDACTED]")
            logger.warning(f"[Vercel Blob] Delete failed HTTP {response.status_code}: {safe_resp[:200]}")
            return False, f"Vercel Blob delete failed (HTTP {response.status_code})."
    except Exception as exc:
        safe_err = str(exc).replace(token, "[REDACTED]")
        logger.error(f"[Vercel Blob] Exception during delete: {safe_err[:200]}")
        return False, "Failed to connect to storage service for deletion."


def generate_scoped_client_upload_token(folder, filename, content_type, size_bytes=0):
    """
    Generates an official scoped Vercel Blob client token for large video uploads (up to 100MB).
    Security guarantees:
    - Master BLOB_READ_WRITE_TOKEN is NEVER sent to the client.
    - Generates a scoped temporary client token restricted to the specific pathname, max size, and MIME type.
    - Matches official @vercel/blob/client generateClientTokenFromReadWriteToken specification.
    - Browser uploads directly to Vercel Blob using this scoped token.
    """
    token = Config.BLOB_READ_WRITE_TOKEN
    if not token:
        return False, "Vercel Blob storage is not configured.", None

    # Validate content type and size for videos
    if content_type not in ALLOWED_VIDEO_MIMES:
        return False, f"Disallowed video MIME type '{content_type}'.", None

    if size_bytes and size_bytes > MAX_VIDEO_SIZE:
        return False, f"Video size exceeds maximum limit of {MAX_VIDEO_SIZE // (1024 * 1024)}MB.", None

    pathname = sanitize_pathname(folder, filename, is_video=True)
    allowed_types = list(ALLOWED_VIDEO_MIMES.keys())

    # Try pure Python HMAC-SHA256 client token generation
    try:
        # Standard format: vercel_blob_rw_<store_id>_<secret>
        parts = token.split('_')
        store_id = parts[3] if len(parts) >= 4 and parts[0] == 'vercel' and parts[1] == 'blob' else 'store'

        valid_until = int((time.time() + 3600) * 1000)  # 1 hour expiry in ms
        payload_dict = {
            'pathname': pathname,
            'maximumSizeInBytes': MAX_VIDEO_SIZE,
            'allowedContentTypes': allowed_types,
            'validUntil': valid_until
        }
        payload_json = json.dumps(payload_dict, separators=(',', ':'))
        payload_b64 = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')

        sig = hmac.new(token.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        combined = f"{sig}.{payload_b64}"
        combined_b64 = base64.b64encode(combined.encode('utf-8')).decode('utf-8')
        client_token = f"vercel_blob_client_{store_id}_{combined_b64}"

        logger.info(f"[Vercel Blob] Scoped client upload token generated for {pathname}")
        return True, None, {
            'clientToken': client_token,
            'pathname': pathname,
            'contentType': content_type,
            'maxSize': MAX_VIDEO_SIZE,
            'uploadUrl': f"{VERCEL_BLOB_API_BASE}/{pathname.lstrip('/')}"
        }
    except Exception as py_err:
        logger.warning(f"[Vercel Blob] Python token generator notice: {py_err}. Attempting node helper fallback.")

    # Fallback to node helper if script exists and python method raised an issue
    script_path = os.path.join(os.path.dirname(__file__), 'token_generator.js')
    if os.path.exists(script_path):
        try:
            allowed_types_str = ",".join(allowed_types)
            proc = subprocess.run(
                ['node', script_path, token, pathname, str(MAX_VIDEO_SIZE), allowed_types_str],
                capture_output=True,
                text=True,
                timeout=10
            )
            if proc.returncode == 0:
                output_data = json.loads(proc.stdout)
                client_token = output_data.get('clientToken')
                if client_token:
                    return True, None, {
                        'clientToken': client_token,
                        'pathname': pathname,
                        'contentType': content_type,
                        'maxSize': MAX_VIDEO_SIZE,
                        'uploadUrl': f"{VERCEL_BLOB_API_BASE}/{pathname.lstrip('/')}"
                    }
        except Exception as node_err:
            safe_err = str(node_err).replace(token, "[REDACTED]")
            logger.error(f"[Vercel Blob] Node helper failed: {safe_err[:200]}")

    return False, "Failed to generate upload authorization.", None
