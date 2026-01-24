import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename') || 'image.png';
    const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

    if (!request.body) {
      return new Response('No file provided', { status: 400 });
    }

    // Upload the file stream directly to Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: true, // Prevents filename collisions
    });

    return new Response(JSON.stringify({ url: blob.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}