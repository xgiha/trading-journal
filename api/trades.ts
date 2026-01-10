import { list, put, del } from '@vercel/blob';

export default async function handler(request: any, response: any) {
  // GET: Retrieve the latest 'trades.json' from Blob Storage
  if (request.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'trades.json', limit: 100 });
      const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      if (sorted.length > 0) {
         const latest = sorted[0];
         const res = await fetch(latest.url);
         const data = await res.json();
         // If for some reason the data is still a string, return the parsed version
         const finalData = typeof data === 'string' ? JSON.parse(data) : data;
         return response.status(200).json(finalData);
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
      let body = request.body;
      
      // If Vercel has already parsed it as JSON, stringify it once for storage
      // If it's already a string, we assume it's valid JSON from the client and store it as-is
      const jsonString = typeof body === 'string' ? body : JSON.stringify(body);
      
      const { blobs } = await list({ prefix: 'trades.json', limit: 100 });
      
      await put('trades.json', jsonString, { access: 'public', addRandomSuffix: true });
      
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