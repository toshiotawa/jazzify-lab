import { createClient } from '@supabase/supabase-js';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body?: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event: NetlifyEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authorization header required' }) };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('email, country, rank')
      .eq('id', user.id)
      .single();
    if (profErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
    }

    // JPユーザーは対象外（安全側）
    const country = (profile?.country || '').trim();
    const isJapan = country.toUpperCase() === 'JP' || country.toLowerCase() === 'japan';
    if (isJapan) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Japan users are not eligible for Paddle checkout' }) };
    }

    const baseCheckout = process.env.PADDLE_CHECKOUT_LINK_STANDARD_GLOBAL;
    const billingUrl = process.env.PADDLE_BILLING_CHECKOUT_URL; // 例: https://{vendor}.paddle.com/checkout
    if (!baseCheckout && !billingUrl) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Paddle checkout URL is not configured' }) };
    }

    // 優先: Billing URL（custom_data）; 次点: Classicリンク（passthrough）
    if (billingUrl) {
      const url = new URL(billingUrl);
      // 必須: price_id
      const priceId = process.env.PADDLE_PRICE_ID_STANDARD_GLOBAL;
      if (!priceId) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'PADDLE_PRICE_ID_STANDARD_GLOBAL is not configured' }) };
      }
      url.searchParams.set('price_id', priceId);
      url.searchParams.set('quantity', '1');
      // custom_data: user id for linking
      url.searchParams.set('custom_data', JSON.stringify({ supabase_user_id: user.id }));
      if (profile?.email) url.searchParams.set('customer_email', profile.email);
      return { statusCode: 200, headers, body: JSON.stringify({ url: url.toString() }) };
    } else {
      const url = new URL(baseCheckout as string);
      if (profile?.email) url.searchParams.set('customer_email', profile.email);
      url.searchParams.set('passthrough', JSON.stringify({ supabase_user_id: user.id }));
      return { statusCode: 200, headers, body: JSON.stringify({ url: url.toString() }) };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};

