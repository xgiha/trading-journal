import { put } from '@vercel/blob';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In Node.js, request.url is relative, so we need a base to parse searchParams
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url, `${protocol}://${host}`);
    const filename = url.searchParams.get('filename') || 'image.png';
    const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

    // 'request' in Node.js is a ReadableStream, which @vercel/blob put() accepts directly
    const blob = await put(filename, request, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: true, // Prevents filename collisions
    });

    return response.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}