/**
 * Lemon 請求履歴バックフィル（管理者のみ）。
 * subscription_events / subscriptions / profiles から ID を収集し Lemon API → billing_* upsert。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  authenticateRequest,
  billingCorsHeaders,
  fetchLemonSubscription,
  fetchLemonSubscriptionInvoices,
} from './lib/lemonNetlifyCommon';
import {
  lookupBillingSubscriptionByProviderId,
  lookupBillingCustomerByProviderId,
  upsertBillingHistorySubscription,
  upsertBillingInvoice,
} from './lib/lemonBillingPersistence';
import {
  buildLemonVariantIdLists,
  planCodeForLemonVariant,
} from './lib/lemonVariantPlanCode';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}

interface BackfillBody {
  user_id?: string;
  dry_run?: boolean;
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

const collectSubscriptionIdsFromEvents = async (
  supabase: SupabaseClient,
  userId?: string,
): Promise<Set<string>> => {
  let query = supabase
    .from('subscription_events')
    .select('payload')
    .eq('provider', 'lemon');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.limit(5000);
  const ids = new Set<string>();

  for (const row of data ?? []) {
    const payload = row.payload;
    if (!payload || typeof payload !== 'object') continue;
    const record = payload as Record<string, unknown>;
    const dataObj = record.data;
    if (!dataObj || typeof dataObj !== 'object') continue;
    const dataRecord = dataObj as Record<string, unknown>;
    if (typeof dataRecord.id === 'string' || typeof dataRecord.id === 'number') {
      ids.add(String(dataRecord.id));
    }
    const attrs = dataRecord.attributes;
    if (attrs && typeof attrs === 'object') {
      const attrRecord = attrs as Record<string, unknown>;
      if (attrRecord.subscription_id !== undefined && attrRecord.subscription_id !== null) {
        ids.add(String(attrRecord.subscription_id));
      }
    }
  }

  return ids;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: billingCorsHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const authResult = await authenticateRequest(authHeader);
    if ('error' in authResult) {
      return {
        statusCode: authResult.statusCode,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: authResult.error }),
      };
    }

    const { supabase, userId: authUserId } = authResult;
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', authUserId)
      .maybeSingle();

    if (!adminProfile?.is_admin) {
      return {
        statusCode: 403,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: 'Admin only' }),
      };
    }

    const body = event.body ? (JSON.parse(event.body) as BackfillBody) : {};
    const targetUserId = body.user_id;
    const dryRun = body.dry_run === true;

    const subscriptionIds = await collectSubscriptionIdsFromEvents(supabase, targetUserId);

    const subQuery = supabase
      .from('subscriptions')
      .select('user_id, provider_subscription_id, provider_customer_id')
      .eq('provider', 'lemon');

    const { data: subscriptionRows } = targetUserId
      ? await subQuery.eq('user_id', targetUserId)
      : await subQuery;

    for (const row of subscriptionRows ?? []) {
      if (typeof row.provider_subscription_id === 'string') {
        subscriptionIds.add(row.provider_subscription_id);
      }
    }

    let subscriptionsUpserted = 0;
    let invoicesUpserted = 0;
    let invoicesSkipped = 0;

    for (const subscriptionId of subscriptionIds) {
      const lemonSub = await fetchLemonSubscription(subscriptionId);
      if (!lemonSub) continue;

      const customerId = lemonSub.data.attributes.customer_id;
      const providerCustomerId =
        customerId !== null && customerId !== undefined ? String(customerId) : '';

      const existingLink = await lookupBillingSubscriptionByProviderId(supabase, subscriptionId);
      let resolvedUserId = existingLink?.user_id ?? null;

      if (!resolvedUserId && providerCustomerId) {
        const customerLink = await lookupBillingCustomerByProviderId(supabase, providerCustomerId);
        resolvedUserId = customerLink?.user_id ?? null;
      }

      if (!resolvedUserId) {
        const match = (subscriptionRows ?? []).find(
          (r) => r.provider_subscription_id === subscriptionId && typeof r.user_id === 'string',
        );
        resolvedUserId = match?.user_id ?? null;
      }

      if (!resolvedUserId) continue;

      if (!dryRun) {
        const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();
        const planCode = planCodeForLemonVariant(
          lemonSub.data.attributes.variant_id,
          yearlyVariantIds,
          monthlyVariantIds,
        );
        await upsertBillingHistorySubscription(
          supabase,
          resolvedUserId,
          subscriptionId,
          {
            status: lemonSub.data.attributes.status ?? null,
            cancelled: lemonSub.data.attributes.cancelled ?? null,
            variant_id: lemonSub.data.attributes.variant_id ?? null,
            customer_id: lemonSub.data.attributes.customer_id ?? null,
            product_id: null,
            renews_at: lemonSub.data.attributes.renews_at ?? null,
            ends_at: lemonSub.data.attributes.ends_at ?? null,
            created_at: null,
            updated_at: lemonSub.data.attributes.updated_at ?? null,
            user_email: null,
          },
          planCode,
        );
      }
      subscriptionsUpserted += 1;

      const invoices = await fetchLemonSubscriptionInvoices(subscriptionId);
      if (!invoices) continue;

      for (const invoice of invoices) {
        const billingSubscriptionLink = await lookupBillingSubscriptionByProviderId(
          supabase,
          subscriptionId,
        );
        const billingCustomerLink = providerCustomerId
          ? await lookupBillingCustomerByProviderId(supabase, providerCustomerId)
          : null;

        const resolution = resolveInvoiceUserId({
          providerSubscriptionId: subscriptionId,
          providerCustomerId,
          billingSubscriptionLink,
          billingCustomerLink,
          lazySubscriptionUserId: resolvedUserId,
        });

        if (resolution.kind === 'failed') {
          invoicesSkipped += 1;
          continue;
        }

        const merged = mergeInvoiceAttrs(
          {
            subscription_id: invoice.subscription_id,
            customer_id: invoice.customer_id,
            billing_reason: invoice.billing_reason,
            status: invoice.status,
            status_formatted: invoice.status_formatted,
            currency: invoice.currency,
            total: invoice.total,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            refunded_amount: invoice.refunded_amount,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            paid_at: invoice.paid_at,
            urls: { invoice_url: invoice.invoice_url },
            total_formatted: invoice.total_formatted,
          },
          {
            subscription_id: subscriptionId,
            customer_id: providerCustomerId,
          },
        );

        const invoiceRow = buildBillingInvoiceRow(
          invoice.id,
          resolution.userId,
          merged,
          resolution.billingSubscriptionId ?? billingSubscriptionLink?.billing_subscription_id ?? null,
          resolution.billingCustomerId ?? billingCustomerLink?.billing_customer_id ?? null,
        );

        if (!invoiceRow) {
          invoicesSkipped += 1;
          continue;
        }

        if (!dryRun) {
          await upsertBillingInvoice(supabase, invoiceRow);
        }
        invoicesUpserted += 1;
      }
    }

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({
        dry_run: dryRun,
        subscription_ids_processed: subscriptionIds.size,
        subscriptions_upserted: subscriptionsUpserted,
        invoices_upserted: invoicesUpserted,
        invoices_skipped: invoicesSkipped,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error', details: message }),
    };
  }
};
