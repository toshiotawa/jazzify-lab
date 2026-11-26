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

export interface MappedSubscriptionStatus {
  status: string;
  entitlementState: string;
}

interface StripeMirrorResult {
  kind: 'premium' | 'coaching' | 'ignored';
  userId: string | null;
  reason?: string;
}

interface ExistingSubscriptionForMirror {
  provider: string;
  provider_subscription_id: string | null;
  entitlement_state: string;
  trial_used: boolean;
  trial_used_at: string | null;
}

export const resolveExpectedStripeLivemode = (): boolean => {
  const explicit = process.env.STRIPE_EXPECTED_LIVEMODE;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.CONTEXT === 'production';
};

const assertStripeKeyMatchesLivemode = (key: string): void => {
  const expectedLive = resolveExpectedStripeLivemode();
  const isLiveKey = key.startsWith('sk_live_') || key.startsWith('rk_live_');
  const isTestKey = key.startsWith('sk_test_') || key.startsWith('rk_test_');
  if ((expectedLive && isTestKey) || (!expectedLive && isLiveKey)) {
    throw new Error('Stripe key livemode does not match STRIPE_EXPECTED_LIVEMODE');
  }
};

export const getStripeClient = (): Stripe => {
  const key = ensureEnv('STRIPE_SECRET_KEY');
  assertStripeKeyMatchesLivemode(key);
  return new Stripe(key, { apiVersion: '2023-10-16' });
};

export const assertStripeResourceLivemode = (livemode: boolean, resourceName: string): void => {
  if (livemode !== resolveExpectedStripeLivemode()) {
    throw new Error(`${resourceName} livemode does not match deployment mode`);
  }
};

export const stripeLookupKeyForPlan = (
  productKind: StripeProductKind,
  target: StripePlanTarget = 'monthly',
): string => {
  if (productKind === 'coaching') return STRIPE_PRICE_LOOKUP_KEYS.coachingMonthly;
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

const normalizeInterval = (interval: string | null | undefined): 'month' | 'year' | null =>
  interval === 'month' || interval === 'year' ? interval : null;

export const isActiveEntitlementState = (entitlementState: string | null | undefined): boolean =>
  entitlementState != null && ACTIVE_ENTITLEMENT_STATES.has(entitlementState);

export const mapStripeSubscriptionStatus = (
  subscription: Pick<Stripe.Subscription, 'status' | 'cancel_at_period_end' | 'current_period_end'>,
  nowUnixSeconds = Math.floor(Date.now() / 1000),
): MappedSubscriptionStatus => {
  switch (subscription.status) {
    case 'trialing':
      if (subscription.cancel_at_period_end && subscription.current_period_end > nowUnixSeconds) {
        return { status: 'trial', entitlementState: 'cancelled_but_active_until_end' };
      }
      return { status: 'trial', entitlementState: 'active' };
    case 'active':
      if (subscription.cancel_at_period_end && subscription.current_period_end > nowUnixSeconds) {
        return { status: 'canceled', entitlementState: 'cancelled_but_active_until_end' };
      }
      return { status: 'active', entitlementState: 'active' };
    case 'past_due':
      return { status: 'past_due', entitlementState: 'payment_issue_with_access' };
    case 'unpaid':
    case 'incomplete':
    case 'paused':
      return { status: 'past_due', entitlementState: 'payment_issue_no_access' };
    case 'canceled':
    case 'incomplete_expired':
      return { status: 'expired', entitlementState: 'expired' };
    default:
      return { status: 'past_due', entitlementState: 'payment_issue_no_access' };
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
  if (!price) throw new Error(`Stripe price lookup_key not found: ${lookupKey}`);
  assertStripeResourceLivemode(price.livemode, `Stripe price ${lookupKey}`);
  return price;
};

export const retrieveExpandedStripeSubscription = async (
  stripe: Stripe,
  subscriptionId: string,
): Promise<Stripe.Subscription> => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product', 'schedule', 'schedule.phases.items.price'],
  });
  assertStripeResourceLivemode(subscription.livemode, `Stripe subscription ${subscriptionId}`);
  return subscription;
};

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
  if (error || !data || data.provider !== 'stripe' || !data.provider_subscription_id) return null;
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

const profileExists = async (supabase: SupabaseClient, userId: string): Promise<boolean> => {
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  return data?.id === userId;
};

const findUserIdForStripeSubscription = async (
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<string | null> => {
  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId && (await profileExists(supabase, metadataUserId))) return metadataUserId;

  const { data: subscriptionRow } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('provider', 'stripe')
    .eq('provider_subscription_id', subscription.id)
    .maybeSingle();
  if (typeof subscriptionRow?.user_id === 'string') return subscriptionRow.user_id;

  const { data: coachingRow } = await supabase
    .from('coaching_subscriptions')
    .select('user_id')
    .eq('provider', 'stripe')
    .eq('provider_subscription_id', subscription.id)
    .maybeSingle();
  if (typeof coachingRow?.user_id === 'string') return coachingRow.user_id;

  const customerId = getStringId(subscription.customer);
  if (!customerId) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return typeof profile?.id === 'string' ? profile.id : null;
};

const fetchExistingSubscriptionForMirror = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<ExistingSubscriptionForMirror | null> => {
  const { data } = await supabase
    .from('subscriptions')
    .select('provider, provider_subscription_id, entitlement_state, trial_used, trial_used_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    provider: data.provider,
    provider_subscription_id: data.provider_subscription_id ?? null,
    entitlement_state: data.entitlement_state,
    trial_used: data.trial_used === true,
    trial_used_at: data.trial_used_at ?? null,
  };
};

const shouldSkipPremiumMirrorForExistingProvider = (
  existing: ExistingSubscriptionForMirror | null,
  subscriptionId: string,
): boolean => {
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

const pendingPlanFromSchedule = (
  subscription: Stripe.Subscription,
): {
  pendingPlanCode: string | null;
  pendingPriceId: string | null;
  effectiveAt: string | null;
} => {
  const schedule = typeof subscription.schedule === 'string' ? null : subscription.schedule;
  const nextPhase = schedule?.phases?.[1] ?? null;
  const nextPrice = nextPhase?.items?.[0]?.price ?? null;
  const nextPriceId = typeof nextPrice === 'string' ? nextPrice : (nextPrice?.id ?? null);
  const nextLookupKey =
    typeof nextPrice === 'string' || !nextPrice || !('lookup_key' in nextPrice)
      ? null
      : (nextPrice.lookup_key ?? null);
  const effectiveAt = toIsoStringOrNull(nextPhase?.start_date ?? null);
  const pendingPlanCode = stripePlanCodeForLookupKey(nextLookupKey);
  if (!nextPriceId || pendingPlanCode === 'unknown' || !effectiveAt) {
    return { pendingPlanCode: null, pendingPriceId: null, effectiveAt: null };
  }
  return { pendingPlanCode, pendingPriceId: nextPriceId, effectiveAt };
};

export const mirrorStripeSubscription = async (
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<StripeMirrorResult> => {
  const priceInfo = priceInfoFromSubscription(subscription);
  if (!priceInfo?.productKind)
    return { kind: 'ignored', userId: null, reason: 'unknown_price_lookup_key' };

  const userId = await findUserIdForStripeSubscription(supabase, subscription);
  if (!userId) return { kind: 'ignored', userId: null, reason: 'user_not_found' };

  const customerId = getStringId(subscription.customer);
  const mapped = mapStripeSubscriptionStatus(subscription);
  const pendingCancelEffectiveAt =
    subscription.cancel_at_period_end &&
    (subscription.status === 'active' || subscription.status === 'trialing')
      ? toIsoStringOrNull(subscription.current_period_end)
      : null;

  if (priceInfo.productKind === 'coaching') {
    const { error } = await supabase.from('coaching_subscriptions').upsert(
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
        provider_updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider,provider_subscription_id' },
    );
    if (error) throw new Error(`Failed to mirror coaching subscription: ${error.message}`);
    return { kind: 'coaching', userId };
  }

  const existing = await fetchExistingSubscriptionForMirror(supabase, userId);
  if (shouldSkipPremiumMirrorForExistingProvider(existing, subscription.id)) {
    return { kind: 'ignored', userId, reason: 'active_different_provider_exists' };
  }

  const pendingPlan = pendingPlanFromSchedule(subscription);
  const stripeTrialUsed = subscription.status === 'trialing' || subscription.trial_start != null;
  const trialUsed = existing?.trial_used === true || stripeTrialUsed;
  const trialUsedAt = existing?.trial_used_at ?? toIsoStringOrNull(subscription.trial_start);

  const { error } = await supabase.from('subscriptions').upsert(
    {
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
      trial_used: trialUsed,
      trial_used_at: trialUsedAt,
      current_period_starts_at: toIsoStringOrNull(subscription.current_period_start),
      current_period_ends_at: toIsoStringOrNull(subscription.current_period_end),
      pending_plan_code: pendingPlan.pendingPlanCode,
      pending_plan_effective_at: pendingPlan.effectiveAt,
      pending_provider_variant_id: pendingPlan.pendingPriceId,
      pending_from_provider_variant_id: priceInfo.priceId,
      pending_effective_at_snapshot: pendingPlan.effectiveAt,
      pending_status: pendingPlan.pendingPlanCode ? 'scheduled' : null,
      pending_locked_at: null,
      pending_failed_reason: null,
      pending_attempts: 0,
      pending_cancel_effective_at: pendingCancelEffectiveAt,
      pending_cancel_effective_at_snapshot: pendingCancelEffectiveAt,
      pending_cancel_status: pendingCancelEffectiveAt ? 'scheduled' : null,
      pending_cancel_locked_at: null,
      pending_cancel_failed_reason: null,
      pending_cancel_attempts: 0,
      billing_currency: priceInfo.currency,
      billing_interval: priceInfo.interval,
      provider_status: subscription.status,
      provider_updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`Failed to mirror Stripe subscription: ${error.message}`);

  const profileUpdates: Record<string, string | null> = {
    rank: isActiveEntitlementState(mapped.entitlementState) ? 'premium' : 'free',
    stripe_customer_id: customerId,
  };
  const trialStart = toIsoStringOrNull(subscription.trial_start);
  const trialEnd = toIsoStringOrNull(subscription.trial_end);
  if (trialStart) profileUpdates.stripe_trial_start = trialStart;
  if (trialEnd) profileUpdates.stripe_trial_end = trialEnd;

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId);
  if (profileError) throw new Error(`Failed to update profile membership: ${profileError.message}`);

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
      'payment_issue_no_access',
      'cancelled_but_active_until_end',
    ])
    .limit(1)
    .maybeSingle();
  return data != null;
};
