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
  trial_ends_at?: string | null;
  updated_at?: string | null;
  variant_id?: number | null;
  customer_id?: number | string | null;
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
  pending_plan_code: string | null;
  pending_status: string | null;
  pending_cancel_status: string | null;
  current_period_ends_at: string | null;
}

export async function getUserLemonSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserLemonSubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('provider, provider_subscription_id, plan_code, entitlement_state, status, pending_plan_code, pending_status, pending_cancel_status, current_period_ends_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || data.provider !== 'lemon' || !data.provider_subscription_id) {
    return null;
  }
  return {
    provider: data.provider,
    provider_subscription_id: data.provider_subscription_id,
    plan_code: data.plan_code,
    entitlement_state: data.entitlement_state,
    status: data.status,
    pending_plan_code: data.pending_plan_code ?? null,
    pending_status: data.pending_status ?? null,
    pending_cancel_status: data.pending_cancel_status ?? null,
    current_period_ends_at: data.current_period_ends_at ?? null,
  };
}

export async function patchLemonSubscriptionVariant(
  subscriptionId: string,
  variantId: string,
): Promise<{ ok: true; renewsAt: string | null; endsAt: string | null } | { ok: false; details: string }> {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          variant_id: Number(variantId),
          disable_prorations: true,
        },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return { ok: false, details: errBody };
  }

  const body = (await res.json()) as LemonSubscriptionRetrieveResponse;
  const attrs = body.data.attributes;
  return {
    ok: true,
    renewsAt: attrs.renews_at ?? null,
    endsAt: attrs.ends_at ?? null,
  };
}

/**
 * Lemon サブスクリプションを解約する（DELETE）。呼び出しは cron 適用のみ。
 * UI / 解約 API からは呼ばない（予約は DB のみ、cron が期間終了窓で実行）。
 */
export async function cancelLemonSubscription(
  subscriptionId: string,
): Promise<{ ok: true; endsAt: string | null } | { ok: false; details: string }> {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) {
    const errBody = await res.text();
    return { ok: false, details: errBody };
  }
  const body = (await res.json()) as LemonSubscriptionRetrieveResponse;
  return { ok: true, endsAt: body.data.attributes.ends_at ?? null };
}

export interface LemonSubscriptionInvoiceSummary {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
  status: string | null;
  status_formatted: string | null;
  billing_reason: string | null;
  total: number | null;
  total_formatted: string | null;
  subtotal: number | null;
  tax: number | null;
  refunded_amount: number | null;
  currency: string | null;
  subscription_id: string | null;
  customer_id: string | null;
  card_brand: string | null;
  card_last_four: string | null;
  invoice_url: string | null;
}

interface LemonInvoiceAttributes {
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
  status?: string | null;
  status_formatted?: string | null;
  billing_reason?: string | null;
  total?: number | null;
  total_formatted?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  refunded?: number | null;
  refunded_amount?: number | null;
  currency?: string | null;
  subscription_id?: number | string | null;
  customer_id?: number | string | null;
  card_brand?: string | null;
  card_last_four?: string | null;
  urls?: { invoice_url?: string | null };
}

interface LemonInvoiceListResponse {
  data?: Array<{
    id: string;
    attributes?: LemonInvoiceAttributes;
  }>;
}

interface LemonInvoiceRetrieveResponse {
  data?: {
    id: string;
    attributes?: LemonInvoiceAttributes;
  };
}

const mapLemonInvoiceAttributes = (
  id: string,
  attrs: LemonInvoiceAttributes,
): LemonSubscriptionInvoiceSummary => ({
  id,
  created_at: attrs.created_at ?? null,
  updated_at: attrs.updated_at ?? null,
  paid_at: attrs.paid_at ?? null,
  status: attrs.status ?? null,
  status_formatted: attrs.status_formatted ?? null,
  billing_reason: attrs.billing_reason ?? null,
  total: typeof attrs.total === 'number' ? attrs.total : null,
  total_formatted: attrs.total_formatted ?? null,
  subtotal: typeof attrs.subtotal === 'number' ? attrs.subtotal : null,
  tax: typeof attrs.tax === 'number' ? attrs.tax : null,
  refunded_amount:
    typeof attrs.refunded_amount === 'number'
      ? attrs.refunded_amount
      : typeof attrs.refunded === 'number'
        ? attrs.refunded
        : null,
  currency: attrs.currency ?? null,
  subscription_id:
    attrs.subscription_id !== null && attrs.subscription_id !== undefined
      ? String(attrs.subscription_id)
      : null,
  customer_id:
    attrs.customer_id !== null && attrs.customer_id !== undefined
      ? String(attrs.customer_id)
      : null,
  card_brand: attrs.card_brand ?? null,
  card_last_four: attrs.card_last_four ?? null,
  invoice_url: attrs.urls?.invoice_url ?? null,
});

export async function fetchLemonSubscriptionInvoice(
  invoiceId: string,
): Promise<LemonSubscriptionInvoiceSummary | null> {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscription-invoices/${invoiceId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as LemonInvoiceRetrieveResponse;
  if (!body.data?.id) return null;
  return mapLemonInvoiceAttributes(body.data.id, body.data.attributes ?? {});
}

/**
 * サブスクリプションの請求書一覧を取得する（created_at 降順で返る）。
 */
export async function fetchLemonSubscriptionInvoices(
  subscriptionId: string,
): Promise<LemonSubscriptionInvoiceSummary[] | null> {
  const apiKey = ensureEnv('LEMONSQUEEZY_API_KEY');
  const params = new URLSearchParams({
    'filter[subscription_id]': subscriptionId,
    'page[size]': '50',
  });
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscription-invoices?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as LemonInvoiceListResponse;
  const items = body.data ?? [];
  return items.map((item) => mapLemonInvoiceAttributes(item.id, item.attributes ?? {}));
}
