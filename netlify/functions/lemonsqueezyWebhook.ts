import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import {
  buildLemonVariantIdLists,
  planCodeForLemonVariant,
} from './lib/lemonVariantPlanCode';
import {
  mapLemonStatusToSubscription,
  rankForSubscription,
} from './lib/lemonSubscriptionMapping';

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
  | 'subscription_payment_success'
  | 'subscription_expired'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_paused'
  | 'order_created'
  | 'order_refunded';

interface LemonWebhookPayload {
  meta?: {
    event_name?: LemonEventType;
    test_mode?: boolean;
    custom_data?: {
      user_id?: string;
    };
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
      renews_at?: string | null;
      ends_at?: string | null;
      trial_ends_at?: string | null;
    };
    relationships?: Record<string, unknown>;
  };
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

const getVariantIdLists = () =>
  buildLemonVariantIdLists({
    premium: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM,
    premiumTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL,
    premiumYearly: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY,
    premiumYearlyTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL,
    standardGlobal: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL,
    standardGlobalTrial: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL,
  });

const resolveUserId = async (
  supabase: SupabaseClient,
  customUserId: string | undefined,
  customerId: string,
  email: string,
): Promise<string | null> => {
  if (customUserId) {
    const { data } = await supabase.from('profiles').select('id').eq('id', customUserId).maybeSingle();
    if (data?.id) return data.id;
  }
  if (customerId) {
    const { data } = await supabase.from('profiles').select('id').eq('lemon_customer_id', customerId).maybeSingle();
    if (data?.id) return data.id;
  }
  if (email) {
    const { data } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (data?.id) return data.id;
  }
  return null;
};

export const handler = async (event: NetlifyEvent, _context: NetlifyContext) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const signature = event.headers['x-signature'] || event.headers['X-Signature'] || event.headers['x-signature-hmac-sha256'];
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64') : (event.body ?? '');

    try {
      const ok = await verifySignature(rawBody, typeof signature === 'string' ? signature : undefined);
      if (!ok) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
      }
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const payload = JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString()) as LemonWebhookPayload;
    const eventName = payload.meta?.event_name ?? '';
    const customData = payload.meta?.custom_data;
    const attrs = payload.data?.attributes ?? {};

    const customerId = String(attrs.customer_id ?? '');
    const subscriptionId = String(attrs.subscription_id ?? payload.data?.id ?? '');
    const lemonStatus = String(attrs.status ?? '').toLowerCase();
    const email = String(attrs.customer_email ?? attrs.user_email ?? '');
    const variantId = attrs.variant_id;

    const supabase = getSupabaseServiceClient();

    const userId = await resolveUserId(supabase, customData?.user_id, customerId, email);

    await supabase.from('subscription_events').insert({
      user_id: userId,
      provider: 'lemon',
      event_type: eventName,
      provider_event_id: String(payload.data?.id ?? ''),
      payload,
    });

    if (!userId || !eventName) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, skipped: !userId ? 'user not found' : 'no event name' }),
      };
    }

    const mapped = mapLemonStatusToSubscription(eventName, lemonStatus, attrs as Record<string, unknown>);

    const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();
    let planCode = planCodeForLemonVariant(variantId, yearlyVariantIds, monthlyVariantIds);
    if (!planCode) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('plan_code')
        .eq('user_id', userId)
        .maybeSingle();
      planCode = existingSub?.plan_code ?? 'core_monthly';
    }

    const renewsAt = attrs.renews_at;
    const endsAt = attrs.ends_at;
    const trialEndsAt = attrs.trial_ends_at;
    const periodEndsAt = endsAt || renewsAt || trialEndsAt || null;

    const upsertData: Record<string, unknown> = {
      user_id: userId,
      provider: 'lemon',
      provider_customer_id: customerId || null,
      provider_subscription_id: subscriptionId || null,
      provider_variant_id: variantId != null ? String(variantId) : null,
      plan_code: planCode,
      status: mapped.status,
      entitlement_state: mapped.entitlementState,
      updated_at: new Date().toISOString(),
    };

    if (periodEndsAt) {
      upsertData.current_period_ends_at = periodEndsAt;
    }
    if (mapped.trialUsed !== undefined) {
      upsertData.trial_used = mapped.trialUsed;
    }

    await supabase.from('subscriptions').upsert(upsertData, { onConflict: 'user_id' });

    const rank = rankForSubscription('lemon', mapped.entitlementState);
    const profileUpdates: Record<string, unknown> = {
      rank,
      lemon_subscription_id: subscriptionId || null,
      lemon_subscription_status: lemonStatus || null,
    };
    if (customerId) {
      profileUpdates.lemon_customer_id = customerId;
    }
    if (mapped.trialUsed !== undefined) {
      profileUpdates.lemon_trial_used = mapped.trialUsed;
    } else if (lemonStatus === 'on_trial') {
      profileUpdates.lemon_trial_used = true;
    }

    await supabase.from('profiles').update(profileUpdates).eq('id', userId);

    return { statusCode: 200, headers, body: JSON.stringify({ received: true, status: mapped.status }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};
