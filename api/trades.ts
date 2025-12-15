import { list, put, del } from '@vercel/blob';

export default async function handler(request: any, response: any) {
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
      
      // List old blobs to clean up later
      const { blobs } = await list({ prefix: 'trades.json' });
      
      // Upload new blob (Vercel Blob is immutable, so we create a new file)
      await put('trades.json', jsonString, { access: 'public', addRandomSuffix: true });
      
      // Attempt to clean up old files to keep storage tidy
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