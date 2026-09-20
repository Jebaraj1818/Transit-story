/**
 * Helper utility to generate official scoped Vercel Blob client tokens.
 * Uses @vercel/blob/client's generateClientTokenFromReadWriteToken.
 * Ensures master read-write token stays on the server and is never passed to browser.
 */

import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';

const [, , token, pathname, maxSizeStr, allowedTypesStr] = process.argv;

if (!token || !pathname) {
  process.stderr.write(JSON.stringify({ success: false, error: 'Token and pathname are required.' }));
  process.exit(1);
}

const maxSize = parseInt(maxSizeStr, 10) || 100 * 1024 * 1024;
const allowedContentTypes = allowedTypesStr ? allowedTypesStr.split(',').map(s => s.trim()) : undefined;

try {
  const clientToken = await generateClientTokenFromReadWriteToken({
    token,
    pathname,
    maximumSizeInBytes: maxSize,
    allowedContentTypes
  });
  process.stdout.write(JSON.stringify({ success: true, clientToken }));
  process.exit(0);
} catch (err) {
  process.stderr.write(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
}
