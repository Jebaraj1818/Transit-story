/**
 * Vercel Serverless Function: api/blob-token.js
 * Generates a scoped client token for direct client uploads up to 100MB.
 * Follows current official @vercel/blob documentation.
 * Does NOT expose master BLOB_READ_WRITE_TOKEN to the client.
 */

import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Vercel Blob storage is not configured.' });
  }

  try {
    const { pathname, folder, filename, contentType } = req.body || {};
    const cleanFolder = (folder || 'general').replace(/^\/+|\/+$/g, '');
    const cleanFilename = (filename || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '');
    const targetPath = pathname || `${cleanFolder}/${Date.now()}-${cleanFilename}`;

    const clientToken = await generateClientTokenFromReadWriteToken({
      token,
      pathname: targetPath,
      maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB max for videos
      allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime']
    });

    return res.status(200).json({
      success: true,
      clientToken,
      pathname: targetPath,
      maxSize: 100 * 1024 * 1024
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to generate client token'
    });
  }
}
