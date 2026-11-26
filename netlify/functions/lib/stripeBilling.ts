import Stripe from 'stripe';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  authenticateRequest,
  billingCorsHeaders,
  ensureEnv,
  getSupabaseServiceClient,
} from './lemonNetlifyCommon';

export { authenticateRequest, billingCorsHeaders, ensureEnv, getSupabaseServiceClient };

export type StripeProductKind = 'premium' | 'coaching';

export type StripePlanTarget = 'monthly' | 'yearly';

export const STRIPE_PRICE_LOOKUP_KEYS = {
  premiumMonthly: 'jazzify_premium_monthly_jpy',

  premiumYearly: 'jazzify_premium_yearly_jpy',

  coachingMonthly: 'jazzify_coaching_monthly_jpy',
} as const;

const LOOKUP_KEY_TO_PRODUCT_KIND: Record<string, StripeProductKind> = {
  [STRIPE_PRICE_LOOKUP_KEYS.premiumMonthly]: 'premium',

  [STRIPE_PRICE_LOOKUP_KEYS.premiumYearly]: 'premium',

  [STRIPE_PRICE_LOOKUP_KEYS.coachingMonthly]: 'coaching',
};

const LOOKUP_KEY_TO_PLAN_CODE: Record<string, string> = {
  [STRIPE_PRICE_LOOKUP_KEYS.premiumMonthly]: 'core_monthly',

  [STRIPE_PRICE_LOOKUP_KEYS.premiumYearly]: 'core_yearly',

  [STRIPE_PRICE_LOOKUP_KEYS.coachingMonthly]: 'coaching_monthly',
};

const ACTIVE_ENTITLEMENT_STATES = new Set([
  'active',

  'payment_issue_with_access',

  'cancelled_but_active_until_end',
]);

export interface StripeSubscriptionRow {
  provider: string;

  provider_subscription_id: string | null;

  plan_code: string;

  entitlement_state: string;

  status: string;

  pending_plan_code: string | null;

  pending_status: string | null;

  pending_cancel_status: string | null;

  current_period_ends_at: string | null;

  trial_used: boolean;
}

interface StripePriceInfo {
  priceId: string;

  productId: string | null;

  lookupKey: string | null;

  productKind: StripeProductKind | null;

  planCode: string;

  currency: 'JPY' | 'USD' | null;

  interval: 'month' | 'year' | null;
}

interface MappedSubscriptionStatus {
  status: string;

  entitlementState: string;
}

interface StripeMirrorResult {
  kind: 'premium' | 'coaching' | 'ignored';

  userId: string | null;

  reason?: string;
}

export const getStripeClient = (): Stripe =>
  new Stripe(ensureEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
  });

export const resolveExpectedStripeLivemode = (): boolean => {
  const explicit = process.env.STRIPE_EXPECTED_LIVEMODE;

  if (explicit === 'true') return true;

  if (explicit === 'false') return false;

  return process.env.CONTEXT === 'production';
};

export const stripeLookupKeyForPlan = (
  productKind: StripeProductKind,

  target: StripePlanTarget = 'monthly',
): string => {
  if (productKind === 'coaching') {
    return STRIPE_PRICE_LOOKUP_KEYS.coachingMonthly;
  }

  return target === 'yearly'
    ? STRIPE_PRICE_LOOKUP_KEYS.premiumYearly
    : STRIPE_PRICE_LOOKUP_KEYS.premiumMonthly;
};

export const stripeProductKindForLookupKey = (
  lookupKey: string | null,
): StripeProductKind | null => {
  if (!lookupKey) return null;

  return LOOKUP_KEY_TO_PRODUCT_KIND[lookupKey] ?? null;
};

export const stripePlanCodeForLookupKey = (lookupKey: string | null): string => {
  if (!lookupKey) return 'unknown';

  return LOOKUP_KEY_TO_PLAN_CODE[lookupKey] ?? 'unknown';
};

export const stripePlanTargetForPlanCode = (planCode: string): StripePlanTarget =>
  planCode === 'core_yearly' ? 'yearly' : 'monthly';

const toIsoStringOrNull = (unixSeconds: number | null | undefined): string | null => {
  if (typeof unixSeconds !== 'number') return null;

  return new Date(unixSeconds * 1000).toISOString();
};

const normalizeCurrency = (currency: string | null | undefined): 'JPY' | 'USD' | null => {
  const upper = currency?.toUpperCase();

  return upper === 'JPY' || upper === 'USD' ? upper : null;
};

const normalizeInterval = (interval: string | null | undefined): 'month' | 'year' | null => {
  return interval === 'month' || interval === 'year' ? interval : null;
};

export const isActiveEntitlementState = (entitlementState: string | null | undefined): boolean =>
  entitlementState != null && ACTIVE_ENTITLEMENT_STATES.has(entitlementState);

const mapStripeSubscriptionStatus = (
  subscription: Stripe.Subscription,
): MappedSubscriptionStatus => {
  if (
    subscription.cancel_at_period_end &&
    subscription.current_period_end > Math.floor(Date.now() / 1000)
  ) {
    return {
      status: subscription.status === 'trialing' ? 'trial' : 'canceled',

      entitlementState: 'cancelled_but_active_until_end',
    };
  }

  switch (subscription.status) {
    case 'trialing':
      return { status: 'trial', entitlementState: 'active' };

    case 'active':
      return { status: 'active', entitlementState: 'active' };

    case 'past_due':
      return { status: 'past_due', entitlementState: 'payment_issue_with_access' };

    case 'unpaid':

    case 'incomplete':
      return { status: 'past_due', entitlementState: 'payment_issue_no_access' };

    case 'canceled':

    case 'incomplete_expired':
      return { status: 'expired', entitlementState: 'expired' };

    case 'paused':
      return { status: 'expired', entitlementState: 'payment_issue_no_access' };

    default:
      return { status: subscription.status, entitlementState: 'payment_issue_no_access' };
  }
};

const getStringId = (value: string | { id: string } | null | undefined): string | null => {
  if (typeof value === 'string') return value;

  return value?.id ?? null;
};

const priceInfoFromSubscription = (subscription: Stripe.Subscription): StripePriceInfo | null => {
  const price = subscription.items.data[0]?.price ?? null;

  if (!price) return null;

  const lookupKey = price.lookup_key ?? null;

  return {
    priceId: price.id,

    productId: getStringId(price.product),

    lookupKey,

    productKind: stripeProductKindForLookupKey(lookupKey),

    planCode: stripePlanCodeForLookupKey(lookupKey),

    currency: normalizeCurrency(price.currency),

    interval: normalizeInterval(price.recurring?.interval),
  };
};

export const resolveStripePriceByLookupKey = async (
  stripe: Stripe,

  lookupKey: string,
): Promise<Stripe.Price> => {
  const prices = await stripe.prices.list({
    active: true,

    lookup_keys: [lookupKey],

    limit: 1,

    expand: ['data.product'],
  });

  const price = prices.data[0] ?? null;

  if (!price) {
    throw new Error(`Stripe price lookup_key not found: ${lookupKey}`);
  }

  return price;
};

export const retrieveExpandedStripeSubscription = async (
  stripe: Stripe,

  subscriptionId: string,
): Promise<Stripe.Subscription> =>
  stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product', 'schedule'],
  });

export const getUserStripeSubscription = async (
  supabase: SupabaseClient,

  userId: string,
): Promise<StripeSubscriptionRow | null> => {
  const { data, error } = await supabase

    .from('subscriptions')

    .select(
      'provider, provider_subscription_id, plan_code, entitlement_state, status, pending_plan_code, pending_status, pending_cancel_status, current_period_ends_at, trial_used',
    )

    .eq('user_id', userId)

    .maybeSingle();

  if (error || !data || data.provider !== 'stripe' || !data.provider_subscription_id) {
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

    trial_used: data.trial_used === true,
  };
};

const findUserIdForStripeSubscription = async (
  supabase: SupabaseClient,

  subscription: Stripe.Subscription,
): Promise<string | null> => {
  const metadataUserId = subscription.metadata?.user_id;

  if (metadataUserId) return metadataUserId;

  const { data: subscriptionRow } = await supabase

    .from('subscriptions')

    .select('user_id')

    .eq('provider', 'stripe')

    .eq('provider_subscription_id', subscription.id)

    .maybeSingle();

  if (typeof subscriptionRow?.user_id === 'string') {
    return subscriptionRow.user_id;
  }

  const customerId = getStringId(subscription.customer);

  if (!customerId) return null;

  const { data: profile } = await supabase

    .from('profiles')

    .select('id')

    .eq('stripe_customer_id', customerId)

    .maybeSingle();

  return typeof profile?.id === 'string' ? profile.id : null;
};

const shouldSkipPremiumMirrorForExistingProvider = async (
  supabase: SupabaseClient,

  userId: string,

  subscriptionId: string,
): Promise<boolean> => {
  const { data: existing } = await supabase

    .from('subscriptions')

    .select('provider, provider_subscription_id, entitlement_state')

    .eq('user_id', userId)

    .maybeSingle();

  if (!existing) return false;

  if (existing.provider === 'stripe') {
    return (
      existing.provider_subscription_id !== null &&
      existing.provider_subscription_id !== subscriptionId &&
      isActiveEntitlementState(existing.entitlement_state)
    );
  }

  return existing.provider !== 'none' && isActiveEntitlementState(existing.entitlement_state);
};

export const mirrorStripeSubscription = async (
  supabase: SupabaseClient,

  subscription: Stripe.Subscription,
): Promise<StripeMirrorResult> => {
  const priceInfo = priceInfoFromSubscription(subscription);

  if (!priceInfo?.productKind) {
    return { kind: 'ignored', userId: null, reason: 'unknown_price_lookup_key' };
  }

  const userId = await findUserIdForStripeSubscription(supabase, subscription);

  if (!userId) {
    return { kind: 'ignored', userId: null, reason: 'user_not_found' };
  }

  const customerId = getStringId(subscription.customer);

  const mapped = mapStripeSubscriptionStatus(subscription);

  const pendingCancelEffectiveAt = subscription.cancel_at_period_end
    ? toIsoStringOrNull(subscription.current_period_end)
    : null;

  const subscriptionColumns = {
    user_id: userId,

    provider: 'stripe',

    provider_customer_id: customerId,

    provider_subscription_id: subscription.id,

    provider_product_id: priceInfo.productId,

    provider_price_id: priceInfo.priceId,

    provider_price_lookup_key: priceInfo.lookupKey,

    plan_code: priceInfo.planCode,

    status: mapped.status,

    entitlement_state: mapped.entitlementState,

    trial_used: subscription.status === 'trialing' || subscription.trial_start != null,

    current_period_starts_at: toIsoStringOrNull(subscription.current_period_start),

    current_period_ends_at: toIsoStringOrNull(subscription.current_period_end),

    pending_cancel_effective_at: pendingCancelEffectiveAt,

    pending_cancel_effective_at_snapshot: pendingCancelEffectiveAt,

    pending_cancel_status: pendingCancelEffectiveAt ? 'scheduled' : null,

    billing_currency: priceInfo.currency,

    billing_interval: priceInfo.interval,

    provider_status: subscription.status,

    provider_updated_at: toIsoStringOrNull(subscription.created),
  };

  if (priceInfo.productKind === 'coaching') {
    const { error } = await supabase

      .from('coaching_subscriptions')

      .upsert(
        {
          user_id: userId,

          provider: 'stripe',

          provider_customer_id: customerId,

          provider_subscription_id: subscription.id,

          provider_product_id: priceInfo.productId,

          provider_price_id: priceInfo.priceId,

          provider_price_lookup_key: priceInfo.lookupKey,

          status: mapped.status,

          entitlement_state: mapped.entitlementState,

          billing_currency: priceInfo.currency,

          billing_interval: priceInfo.interval,

          current_period_starts_at: toIsoStringOrNull(subscription.current_period_start),

          current_period_ends_at: toIsoStringOrNull(subscription.current_period_end),

          pending_cancel_effective_at: pendingCancelEffectiveAt,

          pending_cancel_status: pendingCancelEffectiveAt ? 'scheduled' : null,

          livemode: subscription.livemode,

          last_verified_at: new Date().toISOString(),

          provider_updated_at: toIsoStringOrNull(subscription.created),
        },
        { onConflict: 'provider,provider_subscription_id' },
      );

    if (error) throw new Error(`Failed to mirror coaching subscription: ${error.message}`);

    return { kind: 'coaching', userId };
  }

  if (await shouldSkipPremiumMirrorForExistingProvider(supabase, userId, subscription.id)) {
    return { kind: 'ignored', userId, reason: 'active_different_provider_exists' };
  }

  const { error } = await supabase

    .from('subscriptions')

    .upsert(subscriptionColumns, { onConflict: 'user_id' });

  if (error) throw new Error(`Failed to mirror Stripe subscription: ${error.message}`);

  const isPremium = isActiveEntitlementState(mapped.entitlementState);

  const trialStart = toIsoStringOrNull(subscription.trial_start);

  const trialEnd = toIsoStringOrNull(subscription.trial_end);

  const profileUpdates: Record<string, string | null> = {
    rank: isPremium ? 'premium' : 'free',
  };

  if (trialStart) profileUpdates.stripe_trial_start = trialStart;

  if (trialEnd) profileUpdates.stripe_trial_end = trialEnd;

  await supabase

    .from('profiles')

    .update(profileUpdates)

    .eq('id', userId);

  return { kind: 'premium', userId };
};

export const userHasPaidPremiumForCoaching = async (
  supabase: SupabaseClient,

  userId: string,
): Promise<boolean> => {
  const { data } = await supabase

    .from('subscriptions')

    .select('status, entitlement_state, pending_cancel_status')

    .eq('user_id', userId)

    .maybeSingle();

  return (
    data?.status === 'active' &&
    data.entitlement_state === 'active' &&
    data.pending_cancel_status == null
  );
};

export const userHasCurrentCoaching = async (
  supabase: SupabaseClient,

  userId: string,
): Promise<boolean> => {
  const { data } = await supabase

    .from('coaching_subscriptions')

    .select('id')

    .eq('user_id', userId)

    .in('entitlement_state', [
      'active',

      'payment_issue_with_access',

      'cancelled_but_active_until_end',
    ])

    .limit(1)

    .maybeSingle();

  return data != null;
};
