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

const ensureEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

const getSupabaseServiceClient = (): SupabaseClient => {
  const url = ensureEnv('SUPABASE_URL');
  const key = ensureEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
};

const responseHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
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
        checkout_data: {
          email: params.email,
          custom: {
            user_id: params.userId,
          },
        },
        checkout_options: {
          embed: false,
        },
        product_options: {
          redirect_url: `${siteUrl}/#dashboard`,
        },
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: storeId,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: variantId,
          },
        },
      },
    },
  };

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let errDetail: string;
    try {
      const parsed = JSON.parse(errBody) as { errors?: Array<{ detail?: string; title?: string }> };
      errDetail = parsed.errors?.map((e) => e.detail || e.title).filter(Boolean).join('; ') || errBody;
    } catch {
      errDetail = errBody || res.statusText;
    }
    throw new Error(`LemonSqueezy checkout failed (${res.status}): ${errDetail}`);
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
    const userEmail = auth.data.user.email ?? auth.data.user.user_metadata?.email ?? '';
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, rank, country, lemon_customer_id, lemon_trial_used')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: 'Failed to fetch user profile' }) };
    }

    const email = (profile.email ?? userEmail ?? '').trim();
    if (!email) {
      return { statusCode: 400, headers: responseHeaders, body: JSON.stringify({ error: 'Email is required for checkout. Please set your email in account settings.' }) };
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
      const customerId = profile.lemon_customer_id || (await resolveCustomerIdByEmail(email));
      if (!customerId) {
        // 既存顧客IDが見当たらない場合はチェックアウトにフォールバック
        url = await createCheckout({ email, userId, trial: false });
        via = 'checkout';
      } else {
        url = await getCustomerPortalUrl(customerId);
        if (!url) {
          // ポータルURLが取得できない場合はCheckoutにフォールバック
          url = await createCheckout({ email, userId, trial: false });
          via = 'checkout';
        }
      }
    } else {
      // サブスクなし → DB + LemonSqueezy API の二重チェックでトライアル判定
      let trial = true;
      if (profile.lemon_trial_used === true) {
        // DB 上で使用済み → トライアルなし
        trial = false;
      } else {
        // DB 上は未使用 → LS 顧客の存在を確認（webhook 取りこぼし対策）
        const existingCustomerId = profile.lemon_customer_id || (await resolveCustomerIdByEmail(email));
        if (existingCustomerId) {
          // LS 上に顧客が存在 → 過去に購入完了歴あり → トライアルなし
          trial = false;
          // DB を同期しておく
          await supabase.from('profiles').update({ lemon_trial_used: true, lemon_customer_id: existingCustomerId }).eq('id', userId);
        }
      }
      url = await createCheckout({ email, userId, trial });
      via = 'checkout';
    }

    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify({ url, via }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};


