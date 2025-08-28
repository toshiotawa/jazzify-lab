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

type UnknownRecord = Record<string, unknown>;

type ProfileUpdate = {
  rank?: 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum';
  will_cancel?: boolean | null;
  cancel_date?: string | null;
  downgrade_to?: 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | null;
  downgrade_date?: string | null;
  paddle_customer_id?: string | null;
  paddle_subscription_id?: string | null;
};

const extractUserId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as UnknownRecord;

  // Paddle Classic: passthrough (string)
  const passthrough = obj['passthrough'];
  if (typeof passthrough === 'string') {
    try {
      const parsed = JSON.parse(passthrough) as UnknownRecord;
      const uid = parsed['supabase_user_id'];
      if (typeof uid === 'string' && uid) return uid;
    } catch {}
  }

  // Paddle Billing: data.custom_data.supabase_user_id
  const data = obj['data'];
  if (data && typeof data === 'object') {
    const custom = (data as UnknownRecord)['custom_data'];
    if (custom && typeof custom === 'object') {
      const uid = (custom as UnknownRecord)['supabase_user_id'];
      if (typeof uid === 'string' && uid) return uid;
    }
  }

  // Fallback: customer_email → profiles.email lookup (not ideal)
  const email = (obj['email'] || (data && typeof data === 'object' ? (data as UnknownRecord)['customer_email'] : null)) as unknown;
  if (typeof email === 'string' && email) {
    // Note: resolve later in handler
    return `email:${email}`;
  }

  return null;
};

export const handler = async (event: NetlifyEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // 署名検証（簡易: 開発用スキップフラグがfalseなら許可しない）
  const insecure = (process.env.PADDLE_WEBHOOK_INSECURE || '').toLowerCase() === 'true';
  if (!insecure) {
    // TODO: 本番では Paddle Webhook のRSA署名検証を実装する
    // 参考: https://developer.paddle.com/api-reference/webhooks/overview
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Webhook signature verification not implemented' }) };
  }

  let payload: unknown;
  try {
    payload = event.headers['content-type']?.includes('application/json') ? JSON.parse(event.body || '{}') : JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payload' }) };
  }

  const obj = (payload || {}) as UnknownRecord;
  const userRef = extractUserId(obj);

  const resolveUserId = async (): Promise<string | null> => {
    if (!userRef) return null;
    if (!userRef.startsWith('email:')) return userRef;
    const email = userRef.slice('email:'.length);
    const { data, error } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (error || !data) return null;
    return data.id as string;
  };

  const userId = await resolveUserId();
  if (!userId) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  const alertName = typeof obj['alert_name'] === 'string' ? (obj['alert_name'] as string) : '';
  const eventType = typeof obj['event_type'] === 'string' ? (obj['event_type'] as string) : '';

  // Try to extract Billing customer/subscription ids
  const data = obj['data'] as UnknownRecord | undefined;
  const billingCustomerId = data && typeof data['customer_id'] === 'string' ? (data['customer_id'] as string) : undefined;
  const billingSubscriptionId = data && typeof data['subscription_id'] === 'string' ? (data['subscription_id'] as string) : undefined;

  const buildUpdate = (rank: 'free' | 'standard_global' | null): ProfileUpdate => {
    const update: ProfileUpdate = {
      will_cancel: false,
      cancel_date: null,
      downgrade_to: null,
      downgrade_date: null,
    };
    if (rank) update.rank = rank;
    if (billingCustomerId) update.paddle_customer_id = billingCustomerId;
    if (billingSubscriptionId) update.paddle_subscription_id = billingSubscriptionId;
    return update;
  };

  if (
    alertName === 'subscription_created' ||
    alertName === 'subscription_payment_succeeded' ||
    eventType === 'subscription.activated' ||
    eventType === 'transaction.completed'
  ) {
    await supabase.from('profiles').update(buildUpdate('standard_global')).eq('id', userId);
  }

  if (
    alertName === 'subscription_cancelled' ||
    eventType === 'subscription.cancelled' ||
    eventType === 'subscription.paused'
  ) {
    await supabase.from('profiles').update(buildUpdate('free')).eq('id', userId);
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};

