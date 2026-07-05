/**
 * Lemon Squeezy Webhook（本番）。
 *
 * 責務:
 * - subscription_* → subscriptions / profiles（現行 entitlement）+ billing_* 履歴
 * - subscription_payment_* → billing_invoices のみ（entitlement 非接触）
 * - order_refunded → Phase 1: 既存 entitlement 失効 + billing_invoices 更新
 *
 * IMPORTANT:
 * Invoice events must never mutate current entitlement.
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
import {
  applyImmediateExpireAfterPendingCancelApply,
  shouldBlockCancellationMirror,
} from './lib/lemonPendingCancelMirrorGuard';
import {
  handleInvoiceWebhookEvent,
  handleOrderRefundedBillingInvoice,
  handleSubscriptionBillingHistoryFromWebhook,
} from './lib/lemonBillingWebhookHandlers';
import {
  isInitialPaidInvoice,
  recordUserMilestoneForUserSafe,
  sendPurchaseGa4EventForUser,
} from './lib/analyticsMilestones';

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
      billing_reason?: string | null;
      total?: number | null;
      subtotal?: number | null;
      tax?: number | null;
      refunded?: number | null;
      refunded_amount?: number | null;
      created_at?: string | null;
      paid_at?: string | null;
      currency?: string | null;
      urls?: { invoice_url?: string | null };
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
    .select('plan_code, trial_used, provider_updated_at, pending_cancel_status, last_pending_cancel_applied_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    plan_code: typeof data.plan_code === 'string' ? data.plan_code : null,
    trial_used: data.trial_used === true,
    provider_updated_at:
      typeof data.provider_updated_at === 'string' ? data.provider_updated_at : null,
    pending_cancel_status:
      typeof data.pending_cancel_status === 'string' ? data.pending_cancel_status : null,
    last_pending_cancel_applied_at:
      typeof data.last_pending_cancel_applied_at === 'string' ? data.last_pending_cancel_applied_at : null,
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

const mirrorSubscriptionEntitlement = async (
  supabase: SupabaseClient,
  userId: string,
  eventName: string,
  providerEventId: string,
  source: MirrorSource,
): Promise<Record<string, unknown>> => {
  const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();
  const variantPlanCode = planCodeForLemonVariant(source.attrs.variant_id, yearlyVariantIds, monthlyVariantIds);
  const existing = await fetchExistingSnapshot(supabase, userId);

  if (
    shouldBlockCancellationMirror(
      existing?.pending_cancel_status ?? null,
      String(source.attrs.status ?? ''),
      source.attrs.cancelled === true,
    )
  ) {
    await insertAuditEvent(supabase, userId, 'pending_cancel_external_mirror_blocked', providerEventId, {
      original_event: eventName,
      pending_cancel_status: existing?.pending_cancel_status ?? null,
      incoming_status: source.attrs.status ?? null,
      incoming_cancelled: source.attrs.cancelled ?? null,
    });
    return { received: true, skipped: 'pending_cancel_scheduled' };
  }

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
    return { received: true, skipped: mirror.reason };
  }

  const mirrorColumns = applyImmediateExpireAfterPendingCancelApply(
    mirror.columns,
    existing?.last_pending_cancel_applied_at ?? null,
  );

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    provider: 'lemon',
    provider_subscription_id: source.subscriptionId || null,
    ...mirrorColumns,
    updated_at: new Date().toISOString(),
  };
  if (mirrorColumns.entitlement_state === 'active') {
    upsertData.last_pending_cancel_applied_at = null;
  }
  if (mirror.trialBecameUsed) {
    upsertData.trial_used_at = new Date().toISOString();
  }

  await supabase.from('subscriptions').upsert(upsertData, { onConflict: 'user_id' });

  const rank = rankForSubscription('lemon', mirrorColumns.entitlement_state);
  const lemonStatus = String(source.attrs.status ?? '').toLowerCase();
  const profileUpdates: Record<string, unknown> = {
    rank,
    lemon_subscription_id: source.subscriptionId || null,
    lemon_subscription_status:
      mirrorColumns.entitlement_state === 'expired' ? 'expired' : (lemonStatus || null),
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

  await handleSubscriptionBillingHistoryFromWebhook(supabase, userId, source.subscriptionId, {
    status: source.attrs.status ?? null,
    cancelled: source.attrs.cancelled ?? null,
    variant_id: source.attrs.variant_id ?? null,
    customer_id: source.attrs.customer_id ?? null,
    product_id: null,
    renews_at: source.attrs.renews_at ?? null,
    ends_at: source.attrs.ends_at ?? null,
    created_at: null,
    updated_at: source.attrs.updated_at ?? null,
    user_email: null,
  });

  return { received: true, status: mirrorColumns.status };
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

    if (INVOICE_EVENT_NAMES.has(eventName)) {
      const invoiceResult = await handleInvoiceWebhookEvent(
        supabase,
        providerEventId,
        {
          subscription_id: attrs.subscription_id ?? null,
          customer_id: attrs.customer_id ?? null,
          customer_email: attrs.customer_email ?? null,
          user_email: attrs.user_email ?? null,
          billing_reason: attrs.billing_reason ?? null,
          status: attrs.status ?? null,
          currency: attrs.currency ?? null,
          total: attrs.total ?? null,
          subtotal: attrs.subtotal ?? null,
          tax: attrs.tax ?? null,
          refunded: attrs.refunded ?? null,
          refunded_amount: attrs.refunded_amount ?? null,
          created_at: attrs.created_at ?? null,
          updated_at: attrs.updated_at ?? null,
          paid_at: attrs.paid_at ?? null,
          urls: attrs.urls,
        },
        customData,
        async (auditType, auditPayload) => {
          await insertAuditEvent(supabase, userId, auditType, providerEventId, auditPayload);
        },
      );

      if (
        userId
        && eventName === 'subscription_payment_success'
        && invoiceResult.kind === 'saved'
      ) {
        await recordUserMilestoneForUserSafe(supabase, userId, 'paid');
        if (isInitialPaidInvoice(attrs.billing_reason ?? null)) {
          const totalCents = typeof attrs.total === 'number' ? attrs.total : null;
          const currency = typeof attrs.currency === 'string' ? attrs.currency.toUpperCase() : 'JPY';
          const value = totalCents !== null ? totalCents / 100 : 3980;
          await sendPurchaseGa4EventForUser(supabase, userId, {
            currency,
            value,
            transactionId: providerEventId,
          });
        }
      }

      return ok({
        received: true,
        billing: invoiceResult.kind,
        ...(invoiceResult.kind === 'skipped' || invoiceResult.kind === 'failed_resolution'
          ? { reason: invoiceResult.reason }
          : {}),
      });
    }

    if (!userId || !eventName) {
      return ok({ received: true, skipped: !userId ? 'user not found' : 'no event name' });
    }

    // TODO Phase 2:
    // Refund events should not be treated as entitlement truth.
    // Entitlement should be derived from subscription status, not refund status.
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

      const refundedAmount =
        typeof attrs.refunded_amount === 'number'
          ? attrs.refunded_amount
          : typeof attrs.refunded === 'number'
            ? attrs.refunded
            : null;
      await handleOrderRefundedBillingInvoice(supabase, providerEventId, refundedAmount);

      return ok({ received: true, status: 'expired' });
    }

    if (!SUBSCRIPTION_EVENT_NAMES.has(eventName)) {
      return ok({ received: true, skipped: 'event recorded only' });
    }

    const source: MirrorSource = {
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

    const result = await mirrorSubscriptionEntitlement(
      supabase,
      userId,
      eventName,
      providerEventId,
      source,
    );

    if (
      eventName === 'subscription_created'
      && String(attrs.status ?? '').toLowerCase() === 'on_trial'
    ) {
      await recordUserMilestoneForUserSafe(supabase, userId, 'trial_start');
    }

    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};
