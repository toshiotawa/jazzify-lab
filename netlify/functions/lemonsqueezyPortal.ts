import { createClient } from '@supabase/supabase-js';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authorization header required' }) };
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(jwt);
    if (error || !user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, lemon_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Profile not found' }) };

    // 顧客のポータルURLは customers API から取得する方式に統一
    const response = await fetch('https://api.lemonsqueezy.com/v1/customers?filter[email]=' + encodeURIComponent(profile.email ?? ''), {
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        Accept: 'application/vnd.api+json',
      },
    });
    if (!response.ok) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Failed to lookup customer' }) };
    const json = await response.json();
    const first = json?.data?.[0];
    const url = first?.attributes?.urls?.customer_portal ?? first?.attributes?.urls?.portal ?? null;
    if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Portal URL not found' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ url }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};


