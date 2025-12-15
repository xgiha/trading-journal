import { list, put, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // GET: Retrieve the latest 'trades.json' from Blob Storage
  if (request.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'trades.json', limit: 10 });
      
      // Sort to get the most recent upload
      const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      if (sorted.length > 0) {
         const latest = sorted[0];
         const res = await fetch(latest.url);
         const data = await res.json();
         return new Response(JSON.stringify(data), { 
             headers: { 'Content-Type': 'application/json' } 
         });
      }
      
      return new Response(JSON.stringify([]), { 
          headers: { 'Content-Type': 'application/json' } 
      });
    } catch (error) {
       console.error(error);
       return new Response(JSON.stringify({ error: 'Failed to fetch trades' }), { status: 500 });
    }
  }

  // POST: Save new trades to Blob Storage
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const jsonString = JSON.stringify(body);
      
      // List old blobs to clean up later
      const { blobs } = await list({ prefix: 'trades.json' });
      
      // Upload new blob (Vercel Blob is immutable, so we create a new file)
      await put('trades.json', jsonString, { access: 'public', addRandomSuffix: true });
      
      // Attempt to clean up old files to keep storage tidy
      if (blobs.length > 0) {
         // We do this asynchronously without awaiting to speed up response, 
         // or await if we want to ensure cleanup. Edge runtime supports async background tasks 
         // via waitUntil but simple await is safer here for consistency.
         await Promise.all(blobs.map(b => del(b.url)));
      }

      return new Response(JSON.stringify({ success: true }), { 
          headers: { 'Content-Type': 'application/json' } 
      });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Failed to save trades' }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}