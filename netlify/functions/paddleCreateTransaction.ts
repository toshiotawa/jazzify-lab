import { createClient } from '@supabase/supabase-js';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body?: string;
}

interface PaddleTransactionResponseItem {
  id: string;
  status?: string;
  checkout_url?: string;
}

interface PaddleTransactionResponse {
  data?: PaddleTransactionResponseItem;
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

    // プロフィール取得（メール・国）
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('email, country')
      .eq('id', user.id)
      .single();
    if (profErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
    }

    const country = (profile?.country || '').trim();
    const isJapan = country.toUpperCase() === 'JP' || country.toLowerCase() === 'japan';
    if (isJapan) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Japan users are not eligible for Paddle Billing checkout' }) };
    }

    const paddleApiKey = process.env.PADDLE_API_KEY;
    if (!paddleApiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'PADDLE_API_KEY is not configured' }) };
    }

    const priceId = process.env.PADDLE_PRICE_ID_STANDARD_GLOBAL;
    if (!priceId) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'PADDLE_PRICE_ID_STANDARD_GLOBAL is not configured' }) };
    }

    // Paddle Billing: Create Transaction
    const apiBase = process.env.PADDLE_API_BASE || 'https://api.paddle.com';
    const resp = await fetch(`${apiBase}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          { price_id: priceId, quantity: 1 },
        ],
        customer: profile?.email ? { email: profile.email } : undefined,
        custom_data: { supabase_user_id: user.id },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create transaction', details: text }) };
    }

    const data = await resp.json() as PaddleTransactionResponse;
    const checkoutUrl = data?.data?.checkout_url;
    if (!checkoutUrl) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'checkout_url not returned by Paddle' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ url: checkoutUrl, transactionId: data.data?.id }) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};

