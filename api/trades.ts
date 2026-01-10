import { list, put, del } from '@vercel/blob';

export default async function handler(request: any, response: any) {
  // Set explicit cache-busting headers for Node.js environment
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  response.setHeader('Surrogate-Control', 'no-store');

  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  // GET: Retrieve the latest 'trades.json' from Blob Storage
  if (request.method === 'GET') {
    try {
      // List with a limit and prefix. We use prefix 'trades' to catch 'trades.json' or 'trades-random.json'
      const { blobs } = await list({ 
        prefix: 'trades', 
        token: BLOB_TOKEN 
      });
      
      // Sort by upload date to find the most recent
      const sorted = blobs
        .filter(b => b.pathname.includes('trades.json'))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      if (sorted.length > 0) {
        const latest = sorted[0];
        // Fetch the raw content from the public URL
        const res = await fetch(latest.url, { cache: 'no-store' });
        const data = await res.json();
        
        // Final parse check if double-stringified
        const finalData = typeof data === 'string' ? JSON.parse(data) : data;
        return response.status(200).json(finalData);
      }
      
      return response.status(200).json([]);
    } catch (error) {
      console.error("GET Error:", error);
      return response.status(500).json({ error: 'Failed to fetch trades' });
    }
  }

  // POST: Save new trades to Blob Storage
  if (request.method === 'POST') {
    try {
      const body = request.body;
      
      // Ensure we have a valid array/string to store
      const jsonString = typeof body === 'string' ? body : JSON.stringify(body);
      
      // 1. Get current blobs to delete them after upload
      const { blobs: oldBlobs } = await list({ 
        prefix: 'trades', 
        token: BLOB_TOKEN 
      });
      
      // 2. Put new blob with random suffix to bypass URL-based CDN caching
      await put('trades.json', jsonString, { 
        access: 'public', 
        addRandomSuffix: true,
        token: BLOB_TOKEN 
      });
      
      // 3. Cleanup old versions to keep storage clean
      if (oldBlobs.length > 0) {
        const tradesFiles = oldBlobs.filter(b => b.pathname.includes('trades.json'));
        await Promise.all(tradesFiles.map(b => del(b.url, { token: BLOB_TOKEN })));
      }

      return response.status(200).json({ success: true });
    } catch (error) {
      console.error("POST Error:", error);
      return response.status(500).json({ error: 'Failed to save trades' });
    }
  }

  return response.status(405).send('Method not allowed');
}