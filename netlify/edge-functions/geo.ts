import type { Context } from "https://edge.netlify.com";

export default async function handler(request: Request, context: Context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  // Edge Functions have access to context.geo
  const countryCode = context.geo?.country?.code || null;

  return new Response(
    JSON.stringify({ country: countryCode }),
    { status: 200, headers }
  );
}
