import { resolvePaymentIssueBanner, PAYMENT_ISSUE_COPY } from '@/utils/paymentIssueBanner';
import {
  normalizeBillingStatusPayload,
  resolvePaymentIssueFromBillingPayload,
} from '@/utils/billingStatusClient';

describe('resolvePaymentIssueBanner', () => {
  it('returns lemon_with_access for lemon + payment_issue_with_access', () => {
    expect(resolvePaymentIssueBanner('lemon', 'payment_issue_with_access')).toBe(
      'lemon_with_access',
    );
  });

  it('returns apple_no_access for apple + payment_issue_no_access', () => {
    expect(resolvePaymentIssueBanner('apple', 'payment_issue_no_access')).toBe('apple_no_access');
  });

  it('returns stripe variants for Stripe payment issues', () => {
    expect(resolvePaymentIssueBanner('stripe', 'payment_issue_with_access')).toBe(
      'stripe_with_access',
    );

    expect(resolvePaymentIssueBanner('stripe', 'payment_issue_no_access')).toBe('stripe_no_access');
  });

  it('returns null for active entitlement', () => {
    expect(resolvePaymentIssueBanner('apple', 'active')).toBeNull();

    expect(resolvePaymentIssueBanner('lemon', 'active')).toBeNull();
  });

  it('returns null when provider and entitlement mismatch', () => {
    expect(resolvePaymentIssueBanner('apple', 'payment_issue_with_access')).toBeNull();

    expect(resolvePaymentIssueBanner('lemon', 'payment_issue_no_access')).toBeNull();
  });

  it('returns null for none provider', () => {
    expect(resolvePaymentIssueBanner('none', 'payment_issue_with_access')).toBeNull();
  });
});

describe('resolvePaymentIssueFromBillingPayload', () => {
  it('prefers premium payment issue over active coaching', () => {
    const payload = normalizeBillingStatusPayload({
      provider: 'stripe',
      status: 'past_due',
      entitlement_state: 'payment_issue_with_access',
      plan_code: 'core_monthly',
      trial_used: false,
      coaching_subscription: {
        provider: 'stripe',
        status: 'active',
        entitlement_state: 'active',
        current_period_ends_at: null,
        pending_cancel_effective_at: null,
        next_billing_amount_jpy: 9800,
        billing_currency: 'JPY',
        can_cancel: true,
        can_resume: false,
        can_manage_payment: true,
      },
    });

    expect(resolvePaymentIssueFromBillingPayload(payload)?.target).toBe('premium');
  });

  it('surfaces coaching payment issue when premium is active', () => {
    const payload = normalizeBillingStatusPayload({
      provider: 'lemon',
      status: 'active',
      entitlement_state: 'active',
      plan_code: 'core_monthly',
      trial_used: false,
      coaching_subscription: {
        provider: 'stripe',
        status: 'past_due',
        entitlement_state: 'payment_issue_no_access',
        current_period_ends_at: null,
        pending_cancel_effective_at: null,
        next_billing_amount_jpy: null,
        billing_currency: 'JPY',
        can_cancel: false,
        can_resume: false,
        can_manage_payment: true,
      },
    });

    const resolution = resolvePaymentIssueFromBillingPayload(payload);
    expect(resolution?.target).toBe('coaching');
    expect(resolution?.variant).toBe('stripe_no_access');
    expect(resolution?.canManagePayment).toBe(true);
  });
});

describe('PAYMENT_ISSUE_COPY', () => {
  it('has ja and en keys for both variants', () => {
    expect(PAYMENT_ISSUE_COPY.ja.lemon_with_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.ja.stripe_with_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.ja.stripe_no_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.ja.apple_no_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.en.lemon_with_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.en.stripe_with_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.en.stripe_no_access.length).toBeGreaterThan(0);

    expect(PAYMENT_ISSUE_COPY.en.apple_no_access.length).toBeGreaterThan(0);
  });
});
