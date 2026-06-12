/**
 * Lemon Webhook の billing_* 書き込み（invoice / subscription イベント）。
 * subscriptions（現行 entitlement）には invoice パスから触らない。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildLemonVariantIdLists,
  planCodeForLemonVariant,
} from './lemonVariantPlanCode';
import {
  buildBillingInvoiceRow,
  mergeInvoiceAttrs,
  resolveInvoiceUserId,
  type LemonInvoiceWebhookAttrs,
} from './lemonInvoiceMirror';
import {
  subscriptionAttrsFromLemonResponse,
  subscriptionAttrsFromWebhookPayload,
  type LemonBillingSubscriptionAttrs,
} from './lemonBillingSubscriptionMirror';
import {
  lookupBillingCustomerByProviderId,
  lookupBillingSubscriptionByProviderId,
  upsertBillingHistorySubscription,
  upsertBillingInvoice,
  updateBillingInvoiceRefund,
} from './lemonBillingPersistence';
import {
  fetchLemonSubscription,
  fetchLemonSubscriptionInvoice,
  type LemonSubscriptionRetrieveResponse,
} from './lemonNetlifyCommon';

export interface LemonWebhookCustomData {
  user_id?: string;
}

const getVariantIdLists = () =>
  buildLemonVariantIdLists({
    premium: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM,
    premiumTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL,
    premiumYearly: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY,
    premiumYearlyTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL,
    standardGlobal: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL,
    standardGlobalTrial: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL,
  });

const planCodeFromVariant = (variantId: string | number | null | undefined): string | null => {
  const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();
  return planCodeForLemonVariant(variantId, yearlyVariantIds, monthlyVariantIds);
};

export async function resolveLazySubscriptionUserId(
  supabase: SupabaseClient,
  lemonSub: LemonSubscriptionRetrieveResponse,
  webhookCustomUserId: string | undefined,
): Promise<string | null> {
  const subscriptionId = lemonSub.data.id;
  const existing = await lookupBillingSubscriptionByProviderId(supabase, subscriptionId);
  if (existing) return existing.user_id;

  if (webhookCustomUserId) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', webhookCustomUserId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const customerId = lemonSub.data.attributes.customer_id;
  if (customerId !== null && customerId !== undefined && customerId !== '') {
    const customerLink = await lookupBillingCustomerByProviderId(supabase, String(customerId));
    if (customerLink) return customerLink.user_id;
  }

  return null;
}

/**
 * IMPORTANT:
 * Invoice events must never mutate current entitlement.
 * This Subscription GET is only for billing history backfill/lazy-linking.
 */
export async function lazyCreateBillingSubscriptionFromLemon(
  supabase: SupabaseClient,
  subscriptionId: string,
  userId: string,
  lemonSub: LemonSubscriptionRetrieveResponse,
): Promise<number | null> {
  const { subscriptionId: resolvedId, attrs } = subscriptionAttrsFromLemonResponse(lemonSub);
  const planCode = planCodeFromVariant(attrs.variant_id);
  return upsertBillingHistorySubscription(supabase, userId, resolvedId || subscriptionId, attrs, planCode);
}

export async function handleSubscriptionBillingHistoryWrite(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  attrs: LemonBillingSubscriptionAttrs,
): Promise<void> {
  const planCode = planCodeFromVariant(attrs.variant_id);
  await upsertBillingHistorySubscription(supabase, userId, subscriptionId, attrs, planCode);
}

export async function handleSubscriptionBillingHistoryFromWebhook(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  attrs: LemonBillingSubscriptionAttrs,
): Promise<void> {
  const { subscriptionId: resolvedId, attrs: resolvedAttrs } = subscriptionAttrsFromWebhookPayload(
    subscriptionId,
    attrs,
  );
  await handleSubscriptionBillingHistoryWrite(supabase, userId, resolvedId, resolvedAttrs);
}

export type HandleInvoiceWebhookResult =
  | { kind: 'saved'; providerInvoiceId: string }
  | { kind: 'skipped'; reason: string }
  | { kind: 'failed_resolution'; reason: string };

export async function handleInvoiceWebhookEvent(
  supabase: SupabaseClient,
  invoiceId: string,
  webhookAttrs: LemonInvoiceWebhookAttrs,
  webhookCustomData: LemonWebhookCustomData | undefined,
  insertAudit: (eventType: string, payload: unknown) => Promise<void>,
): Promise<HandleInvoiceWebhookResult> {
  const providerSubscriptionId =
    webhookAttrs.subscription_id !== null &&
    webhookAttrs.subscription_id !== undefined &&
    webhookAttrs.subscription_id !== ''
      ? String(webhookAttrs.subscription_id)
      : '';
  const providerCustomerId =
    webhookAttrs.customer_id !== null &&
    webhookAttrs.customer_id !== undefined &&
    webhookAttrs.customer_id !== ''
      ? String(webhookAttrs.customer_id)
      : '';

  if (!providerSubscriptionId || !providerCustomerId) {
    return { kind: 'skipped', reason: 'invoice missing subscription_id or customer_id' };
  }

  const billingSubscriptionLink = await lookupBillingSubscriptionByProviderId(
    supabase,
    providerSubscriptionId,
  );
  const billingCustomerLink = await lookupBillingCustomerByProviderId(
    supabase,
    providerCustomerId,
  );

  let lazySubscriptionUserId: string | null = null;
  let lazyBillingSubscriptionId: number | null = null;

  if (!billingSubscriptionLink) {
    const lemonSub = await fetchLemonSubscription(providerSubscriptionId);
    if (lemonSub) {
      lazySubscriptionUserId = await resolveLazySubscriptionUserId(
        supabase,
        lemonSub,
        webhookCustomData?.user_id,
      );
      if (lazySubscriptionUserId) {
        lazyBillingSubscriptionId = await lazyCreateBillingSubscriptionFromLemon(
          supabase,
          providerSubscriptionId,
          lazySubscriptionUserId,
          lemonSub,
        );
      }
    }
  }

  const resolution = resolveInvoiceUserId({
    providerSubscriptionId,
    providerCustomerId,
    billingSubscriptionLink,
    billingCustomerLink,
    lazySubscriptionUserId,
  });

  if (resolution.kind === 'failed') {
    await insertAudit('invoice_resolution_failed', {
      provider_invoice_id: invoiceId,
      provider_subscription_id: providerSubscriptionId,
      provider_customer_id: providerCustomerId,
    });
    return { kind: 'failed_resolution', reason: resolution.reason };
  }

  const billingSubscriptionId =
    resolution.billingSubscriptionId ?? lazyBillingSubscriptionId;
  const billingCustomerId = resolution.billingCustomerId ?? billingCustomerLink?.billing_customer_id ?? null;

  const fetched = await fetchLemonSubscriptionInvoice(invoiceId);
  let usedFallback = false;
  if (!fetched) {
    usedFallback = true;
    await insertAudit('invoice_fallback_used', {
      provider_invoice_id: invoiceId,
      provider_subscription_id: providerSubscriptionId,
    });
  }

  const mergedAttrs = mergeInvoiceAttrs(
    fetched
      ? {
          subscription_id: fetched.subscription_id,
          customer_id: fetched.customer_id,
          billing_reason: fetched.billing_reason,
          status: fetched.status,
          status_formatted: fetched.status_formatted,
          currency: fetched.currency,
          total: fetched.total,
          subtotal: fetched.subtotal,
          tax: fetched.tax,
          refunded_amount: fetched.refunded_amount,
          created_at: fetched.created_at,
          updated_at: fetched.updated_at,
          paid_at: fetched.paid_at,
          urls: { invoice_url: fetched.invoice_url },
          total_formatted: fetched.total_formatted,
        }
      : null,
    webhookAttrs,
  );

  const invoiceRow = buildBillingInvoiceRow(
    invoiceId,
    resolution.userId,
    mergedAttrs,
    billingSubscriptionId,
    billingCustomerId,
  );

  if (!invoiceRow) {
    return { kind: 'skipped', reason: 'could not build invoice row' };
  }

  const saved = await upsertBillingInvoice(supabase, invoiceRow);
  if (!saved) {
    return { kind: 'skipped', reason: 'billing_invoices upsert failed' };
  }

  if (usedFallback) {
    await insertAudit('invoice_saved_with_fallback', { provider_invoice_id: invoiceId });
  }

  return { kind: 'saved', providerInvoiceId: invoiceId };
}

export async function handleOrderRefundedBillingInvoice(
  supabase: SupabaseClient,
  providerInvoiceId: string | null,
  refundedAmount: number | null,
): Promise<void> {
  if (!providerInvoiceId) return;
  await updateBillingInvoiceRefund(supabase, providerInvoiceId, refundedAmount, 'refunded');
}
