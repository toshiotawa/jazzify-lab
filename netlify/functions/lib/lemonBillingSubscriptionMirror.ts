/**
 * Lemon Subscription object → billing_customers / billing_subscriptions 履歴テーブルへの写像。
 * subscriptions（現行 entitlement）には触らない。
 */

import type { LemonSubscriptionRetrieveResponse } from './lemonNetlifyCommon';

export const LEMON_BILLING_PROVIDER = 'lemon' as const;

export interface LemonBillingSubscriptionAttrs {
  status?: string | null;
  cancelled?: boolean | null;
  variant_id?: number | string | null;
  customer_id?: number | string | null;
  product_id?: number | string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_email?: string | null;
}

export interface BillingCustomerRow {
  user_id: string;
  provider: typeof LEMON_BILLING_PROVIDER;
  provider_customer_id: string;
  provider_email: string | null;
}

export interface BillingSubscriptionRow {
  user_id: string;
  billing_customer_id: number | null;
  provider: typeof LEMON_BILLING_PROVIDER;
  provider_subscription_id: string;
  provider_customer_id: string | null;
  provider_product_id: string | null;
  provider_variant_id: string | null;
  plan_code: string | null;
  status: string | null;
  renews_at: string | null;
  ends_at: string | null;
  cancelled_at: string | null;
  provider_created_at: string | null;
}

export function buildBillingCustomerRow(
  userId: string,
  customerId: string | number | null | undefined,
  providerEmail: string | null | undefined,
): BillingCustomerRow | null {
  if (customerId === null || customerId === undefined || customerId === '') {
    return null;
  }
  return {
    user_id: userId,
    provider: LEMON_BILLING_PROVIDER,
    provider_customer_id: String(customerId),
    provider_email: providerEmail ?? null,
  };
}

export function buildBillingSubscriptionRow(
  userId: string,
  subscriptionId: string,
  attrs: LemonBillingSubscriptionAttrs,
  planCode: string | null,
  billingCustomerId: number | null,
): BillingSubscriptionRow {
  const status = attrs.status ?? null;
  const cancelled = attrs.cancelled === true || String(status ?? '').toLowerCase() === 'cancelled';
  const cancelledAt = cancelled ? (attrs.ends_at ?? attrs.updated_at ?? null) : null;

  return {
    user_id: userId,
    billing_customer_id: billingCustomerId,
    provider: LEMON_BILLING_PROVIDER,
    provider_subscription_id: subscriptionId,
    provider_customer_id:
      attrs.customer_id !== null && attrs.customer_id !== undefined && attrs.customer_id !== ''
        ? String(attrs.customer_id)
        : null,
    provider_product_id:
      attrs.product_id !== null && attrs.product_id !== undefined && attrs.product_id !== ''
        ? String(attrs.product_id)
        : null,
    provider_variant_id:
      attrs.variant_id !== null && attrs.variant_id !== undefined && attrs.variant_id !== ''
        ? String(attrs.variant_id)
        : null,
    plan_code: planCode,
    status,
    renews_at: attrs.renews_at ?? null,
    ends_at: attrs.ends_at ?? null,
    cancelled_at: cancelledAt,
    provider_created_at: attrs.created_at ?? null,
  };
}

export function subscriptionAttrsFromLemonResponse(
  response: LemonSubscriptionRetrieveResponse,
): { subscriptionId: string; attrs: LemonBillingSubscriptionAttrs } {
  const attrs = response.data.attributes;
  return {
    subscriptionId: response.data.id,
    attrs: {
      status: attrs.status ?? null,
      cancelled: attrs.cancelled ?? null,
      variant_id: attrs.variant_id ?? null,
      customer_id: attrs.customer_id ?? null,
      product_id: null,
      renews_at: attrs.renews_at ?? null,
      ends_at: attrs.ends_at ?? null,
      created_at: null,
      updated_at: attrs.updated_at ?? null,
      user_email: null,
    },
  };
}

export function subscriptionAttrsFromWebhookPayload(
  subscriptionId: string,
  attrs: LemonBillingSubscriptionAttrs,
): { subscriptionId: string; attrs: LemonBillingSubscriptionAttrs } {
  return { subscriptionId, attrs };
}
