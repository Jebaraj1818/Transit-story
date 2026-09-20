/**
 * ==============================================================================
 * THE TRANSIT STORY — ADMIN MEDIA UPLOADER UTILITY
 * ==============================================================================
 * Production media upload helper for the Flask Admin Panel.
 * 
 * Security & Architectural Guarantees:
 * - Master BLOB_READ_WRITE_TOKEN is strictly server-side (NEVER received by browser).
 * - Small images (< 4 MB): Uploaded via authenticated endpoint /admin/api/media/upload.
 * - Large videos (<= 100 MB): Direct browser-to-Blob upload using a temporary, scoped
 *   client upload token obtained from /admin/api/media/client-token.
 * - Includes real-time upload progress (0% - 100%), video/image preview, and disables
 *   form submissions during active uploads.
 * ==============================================================================
 */

window.AdminUploader = (function () {
  const MAX_IMAGE_SIZE = 4 * 1024 * 1024;      // 4 MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024;    // 100 MB

  const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  const ALLOWED_VIDEO_EXTS = ['.mp4', '.webm', '.mov'];

  function getExtension(filename) {
    const idx = (filename || '').lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  }

  function setFormButtonsDisabled(formElem, disabled) {
    if (!formElem) return;
    const buttons = formElem.querySelectorAll('button[type="submit"], input[type="submit"]');
    buttons.forEach((btn) => {
      btn.disabled = disabled;
      if (disabled) {
        btn.setAttribute('data-orig-opacity', btn.style.opacity || '1');
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.style.opacity = btn.getAttribute('data-orig-opacity') || '1';
        btn.style.cursor = 'pointer';
      }
    });
  }

  /**
   * Uploads an image file (< 4MB) via server-side authenticated Flask endpoint.
   */
  async function uploadImage(file, folder = 'general') {
    if (!file) throw new Error('No file selected.');

    const ext = getExtension(file.name);
    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
      throw new Error(`Unsupported image format "${ext}". Allowed: ${ALLOWED_IMAGE_EXTS.join(', ')}`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`Image size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 4MB.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('is_video', '0');

    const res = await fetch('/admin/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Invalid response from server.' }));
    if (!res.ok || !data.success || !data.url) {
      throw new Error(data.message || 'Image upload failed.');
    }

    return data;
  }

  /**
   * Uploads a video file (<= 100MB) directly to Vercel Blob using a scoped client token.
   * Tracks upload progress via onProgress callback.
   */
  async function uploadVideoDirect(file, folder = 'homepage/hero', onProgress = null) {
    if (!file) throw new Error('No file selected.');

    const ext = getExtension(file.name);
    if (!ALLOWED_VIDEO_EXTS.includes(ext)) {
      throw new Error(`Unsupported video format "${ext}". Allowed: ${ALLOWED_VIDEO_EXTS.join(', ')}`);
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error(`Video size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 100MB.`);
    }

    // Step 1: Obtain a short-lived scoped client upload token from authenticated endpoint
    const tokenRes = await fetch('/admin/api/media/client-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        folder: folder,
        contentType: file.type || 'video/mp4',
        size_bytes: file.size,
      }),
    });

    const tokenData = await tokenRes.json().catch(() => ({ success: false, message: 'Failed to obtain upload token.' }));
    if (!tokenRes.ok || !tokenData.success || !tokenData.clientToken) {
      throw new Error(tokenData.message || 'Failed to authorize video upload.');
    }

    const { clientToken, uploadUrl } = tokenData;

    // Step 2: Upload file directly to Vercel Blob with progress reporting
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${clientToken}`);
      xhr.setRequestHeader('x-content-type', file.type || 'video/mp4');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct, event.loaded, event.total);
          }
        };
      }

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resp = JSON.parse(xhr.responseText);
            resolve(resp);
          } catch (e) {
            // Some Blob versions return standard object
            resolve({ url: uploadUrl.split('?')[0] });
          }
        } else {
          reject(new Error(`Storage service rejected upload (HTTP ${xhr.status}).`));
        }
      };

      xhr.onerror = function () {
        reject(new Error('Network error occurred during direct video upload.'));
      };

      xhr.ontimeout = function () {
        reject(new Error('Upload timed out. Please check your network connection.'));
      };

      xhr.send(file);
    });
  }

  /**
   * UI Binding for Image Inputs
   */
  async function bindImageUpload({
    inputElem,
    targetInputId,
    previewImgId,
    previewContainerId,
    statusElemId,
    folder = 'general',
    onSuccess = null,
  }) {
    if (!inputElem || !inputElem.files || !inputElem.files[0]) return;
    const file = inputElem.files[0];
    const targetInput = document.getElementById(targetInputId);
    const previewImg = document.getElementById(previewImgId);
    const previewContainer = document.getElementById(previewContainerId);
    const statusElem = statusElemId ? document.getElementById(statusElemId) : null;
    const form = inputElem.closest('form');

    setFormButtonsDisabled(form, true);
    if (statusElem) {
      statusElem.textContent = 'Uploading image...';
      statusElem.style.display = 'block';
      statusElem.style.color = '#8F6B1E';
    }

    try {
      const result = await uploadImage(file, folder);
      if (targetInput) targetInput.value = result.url;
      if (previewImg) previewImg.src = result.url;
      if (previewContainer) previewContainer.style.display = 'block';

      if (statusElem) {
        statusElem.textContent = '✓ Uploaded successfully to Vercel Blob';
        statusElem.style.color = '#2E6B4A';
      }
      if (onSuccess) onSuccess(result.url);
    } catch (err) {
      alert(err.message || 'Image upload failed.');
      if (statusElem) {
        statusElem.textContent = `✗ ${err.message}`;
        statusElem.style.color = '#9C2B2B';
      }
    } finally {
      setFormButtonsDisabled(form, false);
      inputElem.value = '';
    }
  }

  /**
   * UI Binding for Video Inputs (with real-time progress)
   */
  async function bindVideoUpload({
    inputElem,
    targetInputId,
    previewVideoId,
    previewContainerId,
    progressContainerId,
    progressBarId,
    progressTextId,
    metaElemId,
    folder = 'homepage/hero',
    onSuccess = null,
  }) {
    if (!inputElem || !inputElem.files || !inputElem.files[0]) return;
    const file = inputElem.files[0];
    const targetInput = document.getElementById(targetInputId);
    const previewVideo = document.getElementById(previewVideoId);
    const previewContainer = document.getElementById(previewContainerId);
    const progressContainer = document.getElementById(progressContainerId);
    const progressBar = document.getElementById(progressBarId);
    const progressText = document.getElementById(progressTextId);
    const metaElem = metaElemId ? document.getElementById(metaElemId) : null;
    const form = inputElem.closest('form');

    setFormButtonsDisabled(form, true);
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = `Uploading ${file.name} (0%)...`;
    if (metaElem) {
      metaElem.textContent = `File: ${file.name} • Size: ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      metaElem.style.display = 'block';
    }

    try {
      const result = await uploadVideoDirect(file, folder, (pct, loaded, total) => {
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressText) {
          progressText.textContent = `Uploading direct to Vercel Blob: ${pct}% (${(loaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`;
        }
      });

      if (targetInput) targetInput.value = result.url;
      if (previewVideo) {
        previewVideo.src = result.url;
        previewVideo.load();
      }
      if (previewContainer) previewContainer.style.display = 'block';
      if (progressText) {
        progressText.textContent = '✓ Direct video upload completed successfully.';
        progressText.style.color = '#2E6B4A';
      }
      if (onSuccess) onSuccess(result.url);
    } catch (err) {
      alert(err.message || 'Video upload failed.');
      if (progressText) {
        progressText.textContent = `✗ ${err.message}`;
        progressText.style.color = '#9C2B2B';
      }
    } finally {
      setFormButtonsDisabled(form, false);
      inputElem.value = '';
    }
  }

  return {
    uploadImage,
    uploadVideoDirect,
    bindImageUpload,
    bindVideoUpload,
  };
})();
