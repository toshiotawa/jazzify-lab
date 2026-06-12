import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const billingCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const ensureEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

export const getSupabaseServiceClient = (): SupabaseClient => {
  const url = ensureEnv('SUPABASE_URL');
  const key = ensureEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
};

export interface AuthenticatedUser {
  supabase: SupabaseClient;
  userId: string;
}

export async function authenticateRequest(
  authHeader: string | undefined,
): Promise<AuthenticatedUser | { error: string; statusCode: number }> {
  if (!authHeader) {
    return { error: 'Authorization header required', statusCode: 401 };
  }
  const supabase = getSupabaseServiceClient();
  const jwt = authHeader.replace('Bearer ', '');
  const auth = await supabase.auth.getUser(jwt);
  if (auth.error || !auth.data.user) {
    return { error: 'Unauthorized', statusCode: 401 };
  }
  return { supabase, userId: auth.data.user.id };
}

export interface LemonSubscriptionAttributes {
  status?: string;
  cancelled?: boolean;
  ends_at?: string | null;
  renews_at?: string | null;
  variant_id?: number | null;
  urls?: Record<string, string | undefined>;
}

export interface LemonSubscriptionRetrieveResponse {
  data: {
    id: string;
    type: 'subscriptions';
    attributes: LemonSubscriptionAttributes;
  };
}

export async function fetchLemonSubscription(
  subscriptionId: string,
): Promise<LemonSubscriptionRetrieveResponse | null> {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as LemonSubscriptionRetrieveResponse;
}

export interface UserLemonSubscriptionRow {
  provider: string;
  provider_subscription_id: string | null;
  plan_code: string;
  entitlement_state: string;
  status: string;
}

export async function getUserLemonSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserLemonSubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('provider, provider_subscription_id, plan_code, entitlement_state, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || data.provider !== 'lemon' || !data.provider_subscription_id) {
    return null;
  }
  return data as UserLemonSubscriptionRow;
}
