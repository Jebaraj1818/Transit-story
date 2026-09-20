/**
 * ==============================================================================
 * THE TRANSIT STORY — MEDIA URL RESOLUTION UTILITY
 * ==============================================================================
 * Resolves media paths correctly for:
 * 1. Committed local assets: /images/hero/hero01.jpg
 * 2. Absolute Vercel Blob storage URLs: https://...blob.vercel-storage.com/...
 * 3. External HTTP/HTTPS URLs: https://...
 *
 * Guarantees:
 * - Does not prepend the application host to absolute URLs.
 * - Does not rewrite or corrupt local /images/... paths.
 * - Returns a clean string suitable for direct use in <img src> and <video src>.
 * ==============================================================================
 */

export function resolveMediaUrl(pathOrUrl, fallback = '') {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') {
    return fallback;
  }

  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject known test/mock/placeholder URLs (e.g., test.public.blob.vercel-storage.com)
  if (
    trimmed.includes('test.public.blob.vercel-storage.com') ||
    trimmed.includes('example.com') ||
    trimmed.includes('placeholder.com')
  ) {
    return fallback;
  }

  // Absolute URLs (Vercel Blob, external CDN, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Data URLs or blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Local absolute paths (e.g. /images/...) - do not prepend API host
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Relative path without leading slash
  return `/${trimmed}`;
}

export default resolveMediaUrl;
