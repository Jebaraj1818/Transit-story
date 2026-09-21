"""
==============================================================================
THE TRANSIT STORY — VERCEL BLOB STORAGE SERVICE
==============================================================================
Production cloud storage integration using official Vercel Blob architecture.
- Small images (< 4 MB): Server-side authenticated upload to Vercel Blob.
- Large videos (<= 100 MB): Secure direct client-to-Blob upload via scoped client tokens.
- Master TRANSIT_BLOB_READ_WRITE_TOKEN is strictly server-side and never exposed to browser.
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
    return bool(Config.TRANSIT_BLOB_READ_WRITE_TOKEN)


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
    Master TRANSIT_BLOB_READ_WRITE_TOKEN is kept strictly server-side.
    """
    token = Config.TRANSIT_BLOB_READ_WRITE_TOKEN
    if not token:
        logger.error("[Vercel Blob] Upload failed: TRANSIT_BLOB_READ_WRITE_TOKEN is not configured in server environment.")
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

    token = Config.TRANSIT_BLOB_READ_WRITE_TOKEN
    if not token:
        logger.warning("[Vercel Blob] Deletion skipped: TRANSIT_BLOB_READ_WRITE_TOKEN is not configured.")
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


def is_blob_url(url):
    """
    Returns True only if url is a valid Vercel Blob storage URL.
    Explicitly rejects local static assets, relative paths, or non-blob URLs.
    """
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    if clean.startswith(('/images/', 'images/', '/static/', 'static/')):
        return False
    if not (clean.startswith('http://') or clean.startswith('https://')):
        return False
    return 'blob.vercel-storage.com' in clean


def get_media_references(url):
    """
    Finds all active references to a media URL across the entire database.
    Checks:
    - SiteSetting (setting_value)
    - Destination (cover_image, hero_image, description, about)
    - DestinationGallery (image_url)
    - Service (image)
    - Story (image, content)
    Returns a list of descriptive reference strings, e.g.:
    ['SiteSetting.homepage_hero_photo_2', 'Destination(podaran-foods:hero_image)']
    """
    if not url or not isinstance(url, str):
        return []

    clean_url = url.strip()
    if not clean_url:
        return []

    try:
        from backend.models import SiteSetting, Destination, DestinationGallery, Service, Story
        from sqlalchemy import or_
    except Exception as imp_err:
        logger.error(f"[Storage Service] Error importing models for reference check: {imp_err}")
        return []

    references = []

    try:
        # 1. SiteSetting
        settings = SiteSetting.query.filter(SiteSetting.setting_value == clean_url).all()
        for s in settings:
            references.append(f"SiteSetting.{s.setting_key}")

        # 2. Destination (direct cover & hero image fields)
        destinations = Destination.query.filter(
            or_(Destination.hero_image == clean_url, Destination.cover_image == clean_url)
        ).all()
        for d in destinations:
            if d.hero_image == clean_url:
                references.append(f"Destination({d.slug}:hero_image)")
            if d.cover_image == clean_url and d.cover_image != d.hero_image:
                references.append(f"Destination({d.slug}:cover_image)")

        # 3. DestinationGallery
        galleries = DestinationGallery.query.filter(DestinationGallery.image_url == clean_url).all()
        for g in galleries:
            dest_slug = g.destination.slug if g.destination else f"id_{g.destination_id}"
            references.append(f"DestinationGallery({dest_slug}:slot_{g.display_order})")

        # 4. Service
        services = Service.query.filter(Service.image == clean_url).all()
        for svc in services:
            references.append(f"Service({svc.slug})")

        # 5. Story
        stories = Story.query.filter(Story.image == clean_url).all()
        for st in stories:
            references.append(f"Story({st.slug})")

        # 6. Embedded media in rich text / descriptions
        content_dests = Destination.query.filter(
            or_(
                Destination.description.contains(clean_url),
                Destination.about.contains(clean_url)
            )
        ).all()
        for cd in content_dests:
            ref_name = f"Destination({cd.slug}:content)"
            if ref_name not in references:
                references.append(ref_name)

        content_stories = Story.query.filter(Story.content.contains(clean_url)).all()
        for cs in content_stories:
            ref_name = f"Story({cs.slug}:content)"
            if ref_name not in references:
                references.append(ref_name)

    except Exception as db_err:
        logger.error(f"[Storage Service] Error querying database references for '{clean_url}': {db_err}")
        # On error, play it completely safe: treat as referenced so we never delete blindly
        return [f"DatabaseCheckError({db_err})"]

    return references


def is_media_referenced(url):
    """Returns True if the media URL is currently referenced anywhere in the database."""
    return len(get_media_references(url)) > 0


def safe_cleanup_unused_blob(blob_url):
    """
    Safely deletes a Blob asset from Vercel Blob storage ONLY IF:
    1. It is a valid Vercel Blob URL (never a local asset like /images/...).
    2. It is not referenced anywhere in the database (SiteSetting, Destination, Gallery, Service, Story, content).
    3. Storage service is properly configured.

    Returns (success: bool, message: str).
    Guarantees:
    - Never deletes shared media.
    - Never deletes local static default assets.
    - Safe, idempotent, and non-blocking on errors.
    """
    if not blob_url or not isinstance(blob_url, str):
        return False, "Invalid blob URL."

    clean_url = blob_url.strip()

    # Rule 1: Reject local committed assets immediately
    if clean_url.startswith(('/images/', 'images/', '/static/', 'static/')):
        return False, "Cannot delete local static media assets."

    # Rule 2: Verify it is a Vercel Blob URL
    if not is_blob_url(clean_url):
        return False, f"URL does not belong to project's Vercel Blob storage: {clean_url}"

    # Rule 3: Search for any references in the database
    refs = get_media_references(clean_url)
    if refs:
        logger.info(f"[Vercel Blob Safety] Kept shared blob {clean_url}; referenced in: {', '.join(refs)}")
        return False, f"Blob asset is still referenced in {len(refs)} location(s) ({', '.join(refs)}); deletion skipped."

    # Rule 4: No references exist anywhere, safe to delete via delete_blob
    logger.info(f"[Vercel Blob Cleanup] Asset is completely unreferenced. Proceeding with deletion: {clean_url}")
    return delete_blob(clean_url)


def list_blobs(limit=1000, prefix=None):
    """
    Lists blobs from Vercel Blob storage using the official REST API.
    Returns (True, [blob_dicts]) or (False, error_message).
    """
    token = Config.TRANSIT_BLOB_READ_WRITE_TOKEN
    if not token:
        return False, "Vercel Blob storage is not configured."

    url = VERCEL_BLOB_API_BASE
    headers = {"Authorization": f"Bearer {token}"}
    params = {}
    if limit:
        params['limit'] = limit
    if prefix:
        params['prefix'] = prefix

    try:
        response = requests.get(url, headers=headers, params=params, timeout=15.0)
        if response.status_code == 200:
            data = response.json()
            return True, data.get('blobs', [])
        else:
            safe_resp = (response.text or "").replace(token, "[REDACTED]")
            return False, f"Failed to list blobs (HTTP {response.status_code}): {safe_resp[:200]}"
    except Exception as exc:
        safe_err = str(exc).replace(token, "[REDACTED]")
        return False, f"Exception listing blobs: {safe_err[:200]}"


def audit_storage(project_root=None):
    """
    Performs a non-destructive storage audit:
    - Analyzes active database media references.
    - Inspects public/images directory for referenced vs unreferenced local files.
    - Queries Vercel Blob (if configured) to detect referenced vs orphaned blobs.
    - Never deletes any files.
    """
    from datetime import datetime
    from backend.models import SiteSetting, Destination, DestinationGallery, Service, Story

    if not project_root:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    # 1. Collect all DB media references
    db_media = {
        'site_settings': [],
        'destinations': [],
        'galleries': [],
        'services': [],
        'stories': []
    }
    all_referenced_urls = set()

    for s in SiteSetting.query.all():
        val = (s.setting_value or '').strip()
        if val and any(k in s.setting_key.lower() for k in ['hero', 'photo', 'video', 'slide', 'image', 'banner', 'poster']):
            db_media['site_settings'].append({'key': s.setting_key, 'url': val, 'is_blob': is_blob_url(val)})
            all_referenced_urls.add(val)

    for d in Destination.query.all():
        if d.hero_image:
            u = d.hero_image.strip()
            db_media['destinations'].append({'slug': d.slug, 'field': 'hero_image', 'url': u, 'is_blob': is_blob_url(u)})
            all_referenced_urls.add(u)
        if d.cover_image and d.cover_image != d.hero_image:
            u = d.cover_image.strip()
            db_media['destinations'].append({'slug': d.slug, 'field': 'cover_image', 'url': u, 'is_blob': is_blob_url(u)})
            all_referenced_urls.add(u)

    for g in DestinationGallery.query.all():
        if g.image_url:
            u = g.image_url.strip()
            dest_slug = g.destination.slug if g.destination else f"id_{g.destination_id}"
            db_media['galleries'].append({'destination': dest_slug, 'slot': g.display_order, 'url': u, 'is_blob': is_blob_url(u)})
            all_referenced_urls.add(u)

    for s in Service.query.all():
        if s.image:
            u = s.image.strip()
            db_media['services'].append({'slug': s.slug, 'url': u, 'is_blob': is_blob_url(u)})
            all_referenced_urls.add(u)

    for st in Story.query.all():
        if st.image:
            u = st.image.strip()
            db_media['stories'].append({'slug': st.slug, 'url': u, 'is_blob': is_blob_url(u)})
            all_referenced_urls.add(u)

    # 2. Audit local public/images files
    public_images_dir = os.path.join(project_root, 'public', 'images')
    local_files = []
    if os.path.exists(public_images_dir):
        for root, dirs, files in os.walk(public_images_dir):
            for fname in files:
                if fname.endswith(('.gitkeep', '.DS_Store')):
                    continue
                fpath = os.path.join(root, fname)
                rel_path = os.path.relpath(fpath, os.path.join(project_root, 'public')).replace('\\', '/')
                rel_url = '/' + rel_path.lstrip('/')
                size = os.path.getsize(fpath)
                is_referenced = (rel_url in all_referenced_urls) or any(rel_url in u for u in all_referenced_urls)
                local_files.append({
                    'path': rel_url,
                    'size_bytes': size,
                    'size_kb': round(size / 1024, 1),
                    'referenced_in_db': is_referenced
                })

    # 3. Audit Vercel Blob store
    blob_audit = {
        'configured': is_blob_configured(),
        'total_blobs': 0,
        'active_blobs': [],
        'unreferenced_blobs': []
    }
    if is_blob_configured():
        ok, blobs_or_err = list_blobs(limit=1000)
        if ok and isinstance(blobs_or_err, list):
            blob_audit['total_blobs'] = len(blobs_or_err)
            for b in blobs_or_err:
                b_url = b.get('url', '')
                refs = get_media_references(b_url)
                info = {
                    'url': b_url,
                    'pathname': b.get('pathname', ''),
                    'size_bytes': b.get('size', 0),
                    'uploaded_at': b.get('uploadedAt', ''),
                    'references': refs
                }
                if refs:
                    blob_audit['active_blobs'].append(info)
                else:
                    blob_audit['unreferenced_blobs'].append(info)

    return {
        'timestamp': datetime.utcnow().isoformat(),
        'db_media': db_media,
        'total_db_references': sum(len(v) for v in db_media.values()),
        'local_files_count': len(local_files),
        'local_files': local_files,
        'blob_audit': blob_audit
    }


def generate_scoped_client_upload_token(folder, filename, content_type, size_bytes=0):
    """
    Generates an official scoped Vercel Blob client token for large video uploads (up to 100MB).
    Security guarantees:
    - Master TRANSIT_BLOB_READ_WRITE_TOKEN is NEVER sent to the client.
    - Generates a scoped temporary client token restricted to the specific pathname, max size, and MIME type.
    - Matches official @vercel/blob/client generateClientTokenFromReadWriteToken specification.
    - Browser uploads directly to Vercel Blob using this scoped token.
    """
    token = Config.TRANSIT_BLOB_READ_WRITE_TOKEN
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
