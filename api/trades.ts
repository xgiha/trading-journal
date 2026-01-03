import { list, put, del } from '@vercel/blob';

export default async function handler(request: any, response: any) {
  // GET: Retrieve the latest 'trades.json' from Blob Storage
  if (request.method === 'GET') {
    try {
      // Fetch more items to ensure we don't miss the newest one due to pagination
      const { blobs } = await list({ prefix: 'trades.json', limit: 100 });
      
      // Sort by uploadedAt descending to guarantee the most recent version is first
      const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      if (sorted.length > 0) {
         const latest = sorted[0];
         const res = await fetch(latest.url);
         const data = await res.json();
         return response.status(200).json(data);
      }
      
      return response.status(200).json([]);
    } catch (error) {
       console.error(error);
       return response.status(500).json({ error: 'Failed to fetch trades' });
    }
  }

  // POST: Save new trades to Blob Storage
  if (request.method === 'POST') {
    try {
      const body = request.body;
      const jsonString = JSON.stringify(body);
      
      // List all existing versions for comprehensive cleanup
      const { blobs } = await list({ prefix: 'trades.json', limit: 100 });
      
      // Upload new blob
      await put('trades.json', jsonString, { access: 'public', addRandomSuffix: true });
      
      // Clean up ALL previous versions
      if (blobs.length > 0) {
         await Promise.all(blobs.map(b => del(b.url)));
      }

      return response.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Failed to save trades' });
    }
  }

  return response.status(405).send('Method not allowed');
}