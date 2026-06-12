/**
 * Lemon Squeezy Webhook（本番）。
 *
 * 責務: Lemon の現在状態を subscriptions / profiles にミラーするだけ。
 * - pending 系カラム（自前予約プラン変更）には一切触れない。
 * - invoice 系イベント（subscription_payment_*）の payload は Subscription invoice object であり、
 *   サブスク状態の信頼ソースにしない。GET /v1/subscriptions/:id の結果のみミラーする。
 *   GET 失敗時は subscriptions を一切更新せず、イベント記録のみ行う。
 * - 古いイベントによる巻き戻りは provider_updated_at 比較で防御する。
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import {
  buildLemonVariantIdLists,
  planCodeForLemonVariant,
} from './lib/lemonVariantPlanCode';
import { isTrialVariant } from './lib/lemonPlanCatalog';
import { rankForSubscription } from './lib/lemonSubscriptionMapping';
import {
  buildSubscriptionMirror,
  type ExistingSubscriptionSnapshot,
  type LemonSubscriptionObjectAttrs,
} from './lib/lemonSubscriptionMirror';
import { fetchLemonSubscription } from './lib/lemonNetlifyCommon';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyContext {}

const SUBSCRIPTION_EVENT_NAMES = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
  'subscription_plan_changed',
]);

const INVOICE_EVENT_NAMES = new Set([
  'subscription_payment_success',
  'subscription_payment_failed',
  'subscription_payment_recovered',
  'subscription_payment_refunded',
]);

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
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
      cancelled?: boolean;
      user_name?: string | null;
      user_email?: string | null;
      product_id?: number | null;
      variant_id?: number | null;
      customer_id?: number | string | null;
      customer_email?: string | null;
      subscription_id?: number | string | null;
      store_id?: number;
      renews_at?: string | null;
      ends_at?: string | null;
      trial_ends_at?: string | null;
      updated_at?: string | null;
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

const insertAuditEvent = async (
  supabase: SupabaseClient,
  userId: string | null,
  eventType: string,
  providerEventId: string,
  payload: unknown,
): Promise<void> => {
  await supabase.from('subscription_events').insert({
    user_id: userId,
    provider: 'lemon',
    event_type: eventType,
    provider_event_id: providerEventId,
    payload,
  });
};

const fetchExistingSnapshot = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<ExistingSubscriptionSnapshot | null> => {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan_code, trial_used, provider_updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    plan_code: typeof data.plan_code === 'string' ? data.plan_code : null,
    trial_used: data.trial_used === true,
    provider_updated_at:
      typeof data.provider_updated_at === 'string' ? data.provider_updated_at : null,
  };
};

interface MirrorSource {
  subscriptionId: string;
  attrs: LemonSubscriptionObjectAttrs;
}

const ok = (body: Record<string, unknown>) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(body),
});

export const handler = async (event: NetlifyEvent, _context: NetlifyContext) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const signature = event.headers['x-signature'] || event.headers['X-Signature'] || event.headers['x-signature-hmac-sha256'];
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64') : (event.body ?? '');

    try {
      const verified = verifySignature(rawBody, typeof signature === 'string' ? signature : undefined);
      if (!verified) {
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
    const email = String(attrs.customer_email ?? attrs.user_email ?? '');
    const providerEventId = String(payload.data?.id ?? '');

    const supabase = getSupabaseServiceClient();
    const userId = await resolveUserId(supabase, customData?.user_id, customerId, email);

    await insertAuditEvent(supabase, userId, eventName, providerEventId, payload);

    if (!userId || !eventName) {
      return ok({ received: true, skipped: !userId ? 'user not found' : 'no event name' });
    }

    // order_refunded のみ会員資格を失効させる（plan / variant / trial / pending は触らない）
    if (eventName === 'order_refunded') {
      await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          entitlement_state: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      await supabase.from('profiles').update({ rank: 'free' }).eq('id', userId);
      return ok({ received: true, status: 'expired' });
    }

    // ミラー対象の Subscription object を決定する
    let source: MirrorSource | null = null;

    if (SUBSCRIPTION_EVENT_NAMES.has(eventName)) {
      source = {
        subscriptionId: String(payload.data?.id ?? ''),
        attrs: {
          status: attrs.status ?? null,
          cancelled: attrs.cancelled ?? null,
          variant_id: attrs.variant_id ?? null,
          customer_id: attrs.customer_id ?? null,
          renews_at: attrs.renews_at ?? null,
          ends_at: attrs.ends_at ?? null,
          trial_ends_at: attrs.trial_ends_at ?? null,
          updated_at: attrs.updated_at ?? null,
        },
      };
    } else if (INVOICE_EVENT_NAMES.has(eventName)) {
      // invoice payload はサブスク状態の信頼ソースにせず、最新 Subscription を取りに行くトリガーとして使う
      const subscriptionId = String(attrs.subscription_id ?? '');
      if (!subscriptionId) {
        return ok({ received: true, skipped: 'invoice without subscription_id' });
      }
      const lemonSub = await fetchLemonSubscription(subscriptionId);
      if (!lemonSub) {
        await insertAuditEvent(supabase, userId, 'lemon_subscription_get_failed', providerEventId, {
          original_event: eventName,
          subscription_id: subscriptionId,
        });
        return ok({ received: true, skipped: 'subscription fetch failed' });
      }
      const subAttrs = lemonSub.data.attributes;
      source = {
        subscriptionId: lemonSub.data.id,
        attrs: {
          status: subAttrs.status ?? null,
          cancelled: subAttrs.cancelled ?? null,
          variant_id: subAttrs.variant_id ?? null,
          customer_id: subAttrs.customer_id ?? null,
          renews_at: subAttrs.renews_at ?? null,
          ends_at: subAttrs.ends_at ?? null,
          trial_ends_at: subAttrs.trial_ends_at ?? null,
          updated_at: subAttrs.updated_at ?? null,
        },
      };
    } else {
      // order_created 等はイベント記録のみ（subscription_created 側で状態が同期される）
      return ok({ received: true, skipped: 'event recorded only' });
    }

    const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();
    const variantPlanCode = planCodeForLemonVariant(source.attrs.variant_id, yearlyVariantIds, monthlyVariantIds);
    const existing = await fetchExistingSnapshot(supabase, userId);

    const mirror = buildSubscriptionMirror(source.attrs, existing, {
      variantPlanCode,
      variantIsTrial: isTrialVariant(source.attrs.variant_id),
      nowMs: Date.now(),
    });

    if (mirror.kind === 'skipped') {
      await insertAuditEvent(supabase, userId, 'stale_provider_update', providerEventId, {
        original_event: eventName,
        incoming_updated_at: source.attrs.updated_at ?? null,
        existing_provider_updated_at: existing?.provider_updated_at ?? null,
      });
      return ok({ received: true, skipped: mirror.reason });
    }

    const upsertData: Record<string, unknown> = {
      user_id: userId,
      provider: 'lemon',
      provider_subscription_id: source.subscriptionId || null,
      ...mirror.columns,
      updated_at: new Date().toISOString(),
    };
    if (mirror.trialBecameUsed) {
      upsertData.trial_used_at = new Date().toISOString();
    }

    await supabase.from('subscriptions').upsert(upsertData, { onConflict: 'user_id' });

    const rank = rankForSubscription('lemon', mirror.columns.entitlement_state);
    const lemonStatus = String(source.attrs.status ?? '').toLowerCase();
    const profileUpdates: Record<string, unknown> = {
      rank,
      lemon_subscription_id: source.subscriptionId || null,
      lemon_subscription_status: lemonStatus || null,
    };
    if (mirror.columns.provider_customer_id) {
      profileUpdates.lemon_customer_id = mirror.columns.provider_customer_id;
    }
    if (mirror.columns.trial_used) {
      profileUpdates.lemon_trial_used = true;
      if (mirror.trialBecameUsed) {
        profileUpdates.lemon_trial_used_at = new Date().toISOString();
      }
    }

    await supabase.from('profiles').update(profileUpdates).eq('id', userId);

    return ok({ received: true, status: mirror.columns.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};
