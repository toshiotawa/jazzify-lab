/**
 * Lemon Subscription Invoice → billing_invoices 行への写像（pure、テスト可能）。
 *
 * IMPORTANT:
 * Invoice events must never mutate current entitlement.
 * Subscription GET in the webhook is only for billing history backfill/lazy-linking.
 */

import { LEMON_BILLING_PROVIDER } from './lemonBillingSubscriptionMirror';
import {
  normalizeLemonAmountToMajorUnits,
} from './lemonMonetaryAmount';

export interface LemonInvoiceWebhookAttrs {
  subscription_id?: number | string | null;
  customer_id?: number | string | null;
  customer_email?: string | null;
  user_email?: string | null;
  billing_reason?: string | null;
  status?: string | null;
  status_formatted?: string | null;
  currency?: string | null;
  total?: number | null;
  subtotal?: number | null;
  tax?: number | null;
  refunded?: number | null;
  refunded_amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
  urls?: { invoice_url?: string | null };
}

export interface LemonInvoiceDetailAttrs extends LemonInvoiceWebhookAttrs {
  total_formatted?: string | null;
}

export interface BillingInvoiceRow {
  user_id: string;
  billing_customer_id: number | null;
  billing_subscription_id: number | null;
  provider: typeof LEMON_BILLING_PROVIDER;
  provider_invoice_id: string;
  provider_subscription_id: string;
  provider_customer_id: string;
  billing_reason: string | null;
  status: string | null;
  currency: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  refunded_amount: number | null;
  invoice_url: string | null;
  paid_at: string | null;
  provider_created_at: string | null;
}

export interface BillingSubscriptionUserLink {
  user_id: string;
  billing_subscription_id: number;
  billing_customer_id: number | null;
}

export interface BillingCustomerUserLink {
  user_id: string;
  billing_customer_id: number;
}

export type ResolveInvoiceUserResult =
  | {
      kind: 'resolved';
      userId: string;
      billingSubscriptionId: number | null;
      billingCustomerId: number | null;
      source: 'billing_subscription' | 'lazy_subscription' | 'billing_customer';
    }
  | { kind: 'failed'; reason: string };

export interface ResolveInvoiceUserInput {
  providerSubscriptionId: string;
  providerCustomerId: string;
  billingSubscriptionLink: BillingSubscriptionUserLink | null;
  billingCustomerLink: BillingCustomerUserLink | null;
  lazySubscriptionUserId: string | null;
}

export function resolveInvoiceUserId(input: ResolveInvoiceUserInput): ResolveInvoiceUserResult {
  if (input.billingSubscriptionLink) {
    return {
      kind: 'resolved',
      userId: input.billingSubscriptionLink.user_id,
      billingSubscriptionId: input.billingSubscriptionLink.billing_subscription_id,
      billingCustomerId: input.billingSubscriptionLink.billing_customer_id,
      source: 'billing_subscription',
    };
  }

  if (input.lazySubscriptionUserId) {
    return {
      kind: 'resolved',
      userId: input.lazySubscriptionUserId,
      billingSubscriptionId: null,
      billingCustomerId: null,
      source: 'lazy_subscription',
    };
  }

  if (input.billingCustomerLink) {
    return {
      kind: 'resolved',
      userId: input.billingCustomerLink.user_id,
      billingSubscriptionId: null,
      billingCustomerId: input.billingCustomerLink.billing_customer_id,
      source: 'billing_customer',
    };
  }

  return { kind: 'failed', reason: 'user_id resolution failed' };
}

const parsePaidAt = (attrs: LemonInvoiceDetailAttrs): string | null => {
  if (attrs.paid_at) return attrs.paid_at;
  const status = String(attrs.status ?? '').toLowerCase();
  if (status === 'paid' || status === 'refunded') {
    return attrs.updated_at ?? null;
  }
  return null;
};

const parseRefundedAmount = (attrs: LemonInvoiceDetailAttrs): number | null => {
  if (typeof attrs.refunded_amount === 'number') return attrs.refunded_amount;
  if (typeof attrs.refunded === 'number') return attrs.refunded;
  return null;
};

export function buildBillingInvoiceRow(
  invoiceId: string,
  userId: string,
  attrs: LemonInvoiceDetailAttrs,
  billingSubscriptionId: number | null,
  billingCustomerId: number | null,
): BillingInvoiceRow | null {
  const providerSubscriptionId =
    attrs.subscription_id !== null && attrs.subscription_id !== undefined && attrs.subscription_id !== ''
      ? String(attrs.subscription_id)
      : '';
  const providerCustomerId =
    attrs.customer_id !== null && attrs.customer_id !== undefined && attrs.customer_id !== ''
      ? String(attrs.customer_id)
      : '';

  if (!providerSubscriptionId || !providerCustomerId) {
    return null;
  }

  return {
    user_id: userId,
    billing_customer_id: billingCustomerId,
    billing_subscription_id: billingSubscriptionId,
    provider: LEMON_BILLING_PROVIDER,
    provider_invoice_id: invoiceId,
    provider_subscription_id: providerSubscriptionId,
    provider_customer_id: providerCustomerId,
    billing_reason: attrs.billing_reason ?? null,
    status: attrs.status ?? null,
    currency: attrs.currency ?? null,
    total: normalizeLemonAmountToMajorUnits(attrs.total),
    subtotal: normalizeLemonAmountToMajorUnits(attrs.subtotal),
    tax: normalizeLemonAmountToMajorUnits(attrs.tax),
    refunded_amount: normalizeLemonAmountToMajorUnits(parseRefundedAmount(attrs)),
    invoice_url: attrs.urls?.invoice_url ?? null,
    paid_at: parsePaidAt(attrs),
    provider_created_at: attrs.created_at ?? null,
  };
}

export function mergeInvoiceAttrs(
  primary: LemonInvoiceDetailAttrs | null,
  fallback: LemonInvoiceWebhookAttrs,
): LemonInvoiceDetailAttrs {
  if (!primary) {
    return { ...fallback };
  }
  return {
    subscription_id: primary.subscription_id ?? fallback.subscription_id,
    customer_id: primary.customer_id ?? fallback.customer_id,
    customer_email: primary.customer_email ?? fallback.customer_email,
    user_email: primary.user_email ?? fallback.user_email,
    billing_reason: primary.billing_reason ?? fallback.billing_reason,
    status: primary.status ?? fallback.status,
    status_formatted: primary.status_formatted ?? fallback.status_formatted,
    currency: primary.currency ?? fallback.currency,
    total: primary.total ?? fallback.total,
    subtotal: primary.subtotal ?? fallback.subtotal,
    tax: primary.tax ?? fallback.tax,
    refunded: primary.refunded ?? fallback.refunded,
    refunded_amount: primary.refunded_amount ?? fallback.refunded_amount,
    created_at: primary.created_at ?? fallback.created_at,
    updated_at: primary.updated_at ?? fallback.updated_at,
    paid_at: primary.paid_at ?? fallback.paid_at,
    urls: primary.urls ?? fallback.urls,
    total_formatted: primary.total_formatted ?? fallback.status_formatted,
  };
}
