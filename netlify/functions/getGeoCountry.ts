export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Netlify provides geolocation via multiple sources:
  // 1. context.geo (Edge Functions only)
  // 2. x-country header (added by Netlify edge)
  // 3. x-nf-client-connection-ip can be used for IP-based lookup as fallback
  
  let countryCode: string | null = null;

  // Try context.geo first (works in Edge Functions)
  if (context?.geo?.country?.code) {
    countryCode = context.geo.country.code;
  }
  
  // Fallback to x-country header (Netlify adds this automatically)
  if (!countryCode && event.headers) {
    // Headers are case-insensitive, but Netlify normalizes to lowercase
    countryCode = event.headers['x-country'] || event.headers['X-Country'] || null;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ country: countryCode }),
  };
};