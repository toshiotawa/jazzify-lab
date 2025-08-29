import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyContext {}

type LemonEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_expired'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_paused'
  | 'order_created'
  | 'order_refunded';

interface LemonWebhookPayload<T = unknown> {
  meta?: {
    event_name?: LemonEventType;
    test_mode?: boolean;
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      user_name?: string | null;
      user_email?: string | null;
      product_id?: number | null;
      variant_id?: number | null;
      customer_id?: number | string | null;
      customer_email?: string | null;
      subscription_id?: string | null;
      store_id?: number;
    };
    relationships?: Record<string, unknown>;
  } & T;
}

const getSupabaseServiceClient = (): SupabaseClient =>
  createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

const verifySignature = (rawBody: string | Buffer, signature: string | undefined): boolean => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = createHmac('sha256', secret);
  hmac.update(typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody));
  const digest = hmac.digest('hex');
  return timingSafeEqual(digest, signature);
};

export const handler = async (event: NetlifyEvent, _context: NetlifyContext) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const signature = event.headers['x-signature'] || event.headers['X-Signature'] || event.headers['x-signature-hmac-sha256'];
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64') : (event.body ?? '');

    // 署名検証（ドキュメントの表記揺れに備えて x-signature を優先）
    // 失敗時は 400
    try {
      const ok = await verifySignature(rawBody, typeof signature === 'string' ? signature : undefined);
      if (!ok) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
      }
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const payload = JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString()) as LemonWebhookPayload;
    const eventName = payload.meta?.event_name;
    const attrs = payload.data?.attributes ?? {};

    const customerId = String(attrs.customer_id ?? '');
    const subscriptionId = String(attrs.subscription_id ?? payload.data?.id ?? '');
    const status = String(attrs.status ?? '').toLowerCase();
    const email = String(attrs.customer_email ?? attrs.user_email ?? '');

    const supabase = getSupabaseServiceClient();

    // ユーザー特定: 1) lemon_customer_id, 2) email
    let userId: string | null = null;
    if (customerId) {
      const { data } = await supabase.from('profiles').select('id').eq('lemon_customer_id', customerId).maybeSingle();
      userId = data?.id ?? null;
    }
    if (!userId && email) {
      const { data } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      userId = data?.id ?? null;
    }

    if (!userId) {
      // 顧客作成イベントなど、後続のイベントで紐づく可能性がある
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, message: 'user not found yet' }) };
    }

    // ステータスを rank と lemon_* に反映
    const statusToRank = (s: string): 'free' | 'standard_global' => {
      if (s === 'active' || s === 'on_trial' || s === 'past_due' || s === 'paused') return 'standard_global';
      return 'free';
    };

    const updates: Record<string, any> = {
      lemon_subscription_id: subscriptionId || null,
      lemon_subscription_status: status || null,
    };
    if (customerId) updates.lemon_customer_id = customerId;
    if (status === 'on_trial' || status === 'expired' || status === 'cancelled' || status === 'active') {
      updates.lemon_trial_used = true;
    }
    updates.rank = statusToRank(status);

    await supabase.from('profiles').update(updates).eq('id', userId);

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};


