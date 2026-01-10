import { list, put, del } from '@vercel/blob';

export default async function handler(request: any, response: any) {
  // Common headers for both GET and POST to prevent cross-device stale data
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json',
  };

  // GET: Retrieve the latest 'trades.json' from Blob Storage
  if (request.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'trades.json', limit: 100 });
      const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      if (sorted.length > 0) {
         const latest = sorted[0];
         // Fetch the actual content of the blob with no-cache headers
         const res = await fetch(latest.url, { cache: 'no-store' });
         const data = await res.json();
         
         // Fix: If data was stored as double-string, unwrap it
         const finalData = typeof data === 'string' ? JSON.parse(data) : data;
         return response.status(200).json(finalData, { headers });
      }
      
      return response.status(200).json([], { headers });
    } catch (error) {
       console.error("GET error:", error);
       return response.status(500).json({ error: 'Failed to fetch trades' });
    }
  }

  // POST: Save new trades to Blob Storage
  if (request.method === 'POST') {
    try {
      let body = request.body;
      
      // Strict serialization check:
      // Ensure we store a clean JSON string representing the array
      const jsonString = typeof body === 'string' ? body : JSON.stringify(body);
      
      // Cleanup old files before pushing the new one to prevent clutter and confusion
      const { blobs } = await list({ prefix: 'trades.json', limit: 100 });
      
      // Use addRandomSuffix to ensure unique URLs (helps with caching)
      await put('trades.json', jsonString, { access: 'public', addRandomSuffix: true });
      
      // Delete older versions
      if (blobs.length > 0) {
         await Promise.all(blobs.map(b => del(b.url)));
      }

      return response.status(200).json({ success: true }, { headers });
    } catch (error) {
      console.error("POST error:", error);
      return response.status(500).json({ error: 'Failed to save trades' });
    }
  }

  return response.status(405).send('Method not allowed');
}