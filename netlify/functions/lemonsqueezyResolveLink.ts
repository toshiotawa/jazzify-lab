import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyContext {
  // empty by design; Netlify provides additional fields but we don't need them here
}

interface LemonCheckoutCreateResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      url?: string;
    };
  };
}

type LinkVia = 'checkout' | 'portal';

const getSupabaseServiceClient = (): SupabaseClient =>
  createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

const responseHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const ensureEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

const createCheckout = async (params: {
  email: string;
  userId: string;
  trial: boolean;
}): Promise<string> => {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const storeId = ensureEnv('LEMONSQUEEZY_STORE_ID');
  const variantId = params.trial
    ? ensureEnv('LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL')
    : ensureEnv('LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL');

  const siteUrl = ensureEnv('SITE_URL');

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        store_id: Number(storeId),
        variant_id: Number(variantId),
        checkout_data: {
          email: params.email,
          custom: {
            user_id: params.userId,
          },
        },
        checkout_options: {
          embed: false,
          accept_marketing: false,
        },
        redirect_url: `${siteUrl}/#account`,
      },
    },
  };

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create checkout: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as LemonCheckoutCreateResponse;
  const url = json?.data?.attributes?.url;
  if (!url) {
    throw new Error('Checkout URL not found in response');
  }
  return url;
};

interface LemonCustomersListResponse {
  data: Array<{
    id: string;
    type: 'customers';
    attributes: {
      email: string;
      name: string | null;
      urls?: Record<string, string | undefined>;
    };
  }>;
}

const resolveCustomerIdByEmail = async (email: string): Promise<string | null> => {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const storeId = ensureEnv('LEMONSQUEEZY_STORE_ID');
  const url = new URL('https://api.lemonsqueezy.com/v1/customers');
  url.searchParams.set('filter[store_id]', storeId);
  url.searchParams.set('filter[email]', email);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as LemonCustomersListResponse;
  const first = json.data?.[0];
  return first?.id ?? null;
};

interface LemonCustomerRetrieveResponse {
  data: {
    id: string;
    type: 'customers';
    attributes: {
      email: string;
      urls?: Record<string, string | undefined>;
    };
  };
}

const getCustomerPortalUrl = async (customerId: string): Promise<string | null> => {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const res = await fetch(`https://api.lemonsqueezy.com/v1/customers/${customerId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as LemonCustomerRetrieveResponse;
  const urls = json?.data?.attributes?.urls ?? {};
  return urls['customer_portal'] || urls['portal'] || urls['update_billing'] || null;
};

export const handler = async (event: NetlifyEvent, _context: NetlifyContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: responseHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: responseHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const supabase = getSupabaseServiceClient();
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return { statusCode: 401, headers: responseHeaders, body: JSON.stringify({ error: 'Authorization header required' }) };
    }
    const jwt = authHeader.replace('Bearer ', '');
    const auth = await supabase.auth.getUser(jwt);
    if (auth.error || !auth.data.user) {
      return { statusCode: 401, headers: responseHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const userId = auth.data.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, rank, country, lemon_customer_id, lemon_trial_used')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: 'Failed to fetch user profile' }) };
    }

    const isJapan = profile.country === 'JP';
    if (isJapan) {
      // 日本ユーザーは既存（Stripe）フローを利用
      return { statusCode: 400, headers: responseHeaders, body: JSON.stringify({ error: 'Global checkout is not available for JP users' }) };
    }

    const hasSubscription = profile.rank && profile.rank !== 'free';
    let via: LinkVia;
    let url: string | null = null;

    if (hasSubscription) {
      via = 'portal';
      const customerId = profile.lemon_customer_id || (profile.email ? await resolveCustomerIdByEmail(profile.email) : null);
      if (!customerId) {
        // 既存顧客IDが見当たらない場合はチェックアウトにフォールバック
        url = await createCheckout({ email: profile.email, userId, trial: false });
        via = 'checkout';
      } else {
        url = await getCustomerPortalUrl(customerId);
        if (!url) {
          // ポータルURLが取得できない場合はCheckoutにフォールバック
          url = await createCheckout({ email: profile.email, userId, trial: false });
          via = 'checkout';
        }
      }
    } else {
      // サブスクなし → トライアル未使用ならトライアル付き、使用済みならなし
      const trial = profile.lemon_trial_used === true ? false : true;
      url = await createCheckout({ email: profile.email, userId, trial });
      via = 'checkout';
    }

    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify({ url, via }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};


