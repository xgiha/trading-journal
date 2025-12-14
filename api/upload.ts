
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  return new Response(JSON.stringify({ 
    status: 'success', 
    message: 'Mock upload endpoint - Client side processing enabled' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
