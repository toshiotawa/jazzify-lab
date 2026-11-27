import { describe, expect, it } from 'vitest';
import {
  evaluateAccountDeletionBlock,
  formatBillingProviderLabel,
} from '../../supabase/functions/_shared/deleteAccountPolicy';

describe('formatBillingProviderLabel', () => {
  it('formats known providers and falls back safely', () => {
    expect(formatBillingProviderLabel('apple')).toBe('Apple');
    expect(formatBillingProviderLabel('stripe')).toBe('Stripe');
    expect(formatBillingProviderLabel('lemon')).toBe('Lemon Squeezy');
    expect(formatBillingProviderLabel('custom')).toBe('custom');
    expect(formatBillingProviderLabel(null)).toBe('your payment provider');
  });
});

describe('evaluateAccountDeletionBlock', () => {
  it('blocks deletion with Stripe label when Stripe main subscription is active', () => {
    const result = evaluateAccountDeletionBlock({
      subscription: { provider: 'stripe', entitlement_state: 'active' },
      coachingSubscription: null,
      profile: { rank: 'standard', lemon_subscription_status: null },
    });

    expect(result).toEqual({
      error: 'Active subscription exists via Stripe. Please cancel first.',
      provider: 'stripe',
    });
  });

  it('blocks deletion when main subscription is expired but coaching subscription is active', () => {
    const result = evaluateAccountDeletionBlock({
      subscription: { provider: 'stripe', entitlement_state: 'expired' },
      coachingSubscription: { provider: 'stripe', entitlement_state: 'cancelled_but_active_until_end' },
      profile: { rank: 'free', lemon_subscription_status: null },
    });

    expect(result).toEqual({
      error: 'Active coaching subscription exists via Stripe. Please cancel first.',
      provider: 'stripe',
      product: 'coaching',
    });
  });

  it('blocks deletion when coaching subscription has payment issue', () => {
    const result = evaluateAccountDeletionBlock({
      subscription: null,
      coachingSubscription: { provider: 'stripe', entitlement_state: 'payment_issue_with_access' },
      profile: { rank: 'free', lemon_subscription_status: null },
    });

    expect(result).toEqual({
      error: 'Active coaching subscription exists via Stripe. Please cancel first.',
      provider: 'stripe',
      product: 'coaching',
    });
  });

  it('blocks deletion for legacy active Lemon profile when subscriptions row is absent', () => {
    const result = evaluateAccountDeletionBlock({
      subscription: null,
      coachingSubscription: null,
      profile: { rank: 'standard', lemon_subscription_status: 'past_due' },
    });

    expect(result).toEqual({
      error: 'Active Lemon subscription. Cancel via web portal first.',
      provider: 'lemon',
    });
  });

  it('allows deletion when both main and coaching subscriptions are expired', () => {
    const result = evaluateAccountDeletionBlock({
      subscription: { provider: 'stripe', entitlement_state: 'expired' },
      coachingSubscription: { provider: 'stripe', entitlement_state: 'expired' },
      profile: { rank: 'free', lemon_subscription_status: null },
    });

    expect(result).toBeNull();
  });
});
