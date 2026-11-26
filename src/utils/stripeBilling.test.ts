import {
  getStripeClient,
  isJapanStripeEligible,
  mapStripeSubscriptionStatus,
  parseStripeBillingProduct,
  resolveExpectedStripeLivemode,
} from '../../netlify/functions/lib/stripeBilling';

describe('stripe billing helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('maps cancel_at_period_end only for active-like Stripe subscriptions', () => {
    expect(
      mapStripeSubscriptionStatus(
        {
          status: 'active',
          cancel_at_period_end: true,
          current_period_end: 200,
        },
        100,
      ),
    ).toEqual({ status: 'canceled', entitlementState: 'cancelled_but_active_until_end' });

    expect(
      mapStripeSubscriptionStatus(
        {
          status: 'incomplete',
          cancel_at_period_end: true,
          current_period_end: 200,
        },
        100,
      ),
    ).toEqual({ status: 'past_due', entitlementState: 'payment_issue_no_access' });
  });

  it('maps unknown Stripe statuses into DB-safe values', () => {
    expect(
      mapStripeSubscriptionStatus({
        status: 'future_status',
        cancel_at_period_end: false,
        current_period_end: 200,
      } as never),
    ).toEqual({ status: 'past_due', entitlementState: 'payment_issue_no_access' });
  });

  it('enforces Stripe key livemode against deployment mode', () => {
    process.env.STRIPE_EXPECTED_LIVEMODE = 'false';
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    expect(resolveExpectedStripeLivemode()).toBe(false);
    expect(() => getStripeClient()).not.toThrow();

    process.env.STRIPE_SECRET_KEY = 'sk_live_example';
    expect(() => getStripeClient()).toThrow(/livemode/);
  });

  it('resolves Japan Stripe eligibility from profile fields', () => {
    expect(isJapanStripeEligible({ billing_currency: 'JPY' })).toBe(true);
    expect(isJapanStripeEligible({ billing_currency: 'USD' })).toBe(false);
    expect(isJapanStripeEligible({ country: 'JP', preferred_locale: 'en' })).toBe(true);
    expect(isJapanStripeEligible({ country: 'US', preferred_locale: 'ja' })).toBe(false);
    expect(isJapanStripeEligible({ preferred_locale: 'ja' })).toBe(true);
    expect(isJapanStripeEligible({ preferred_locale: 'en' })).toBe(false);
  });

  it('rejects invalid billing product JSON instead of defaulting to premium', () => {
    expect(parseStripeBillingProduct('{not json')).toBe('invalid');
    expect(parseStripeBillingProduct(JSON.stringify({ product: 'coaching' }))).toBe('coaching');
    expect(parseStripeBillingProduct(null)).toBe('premium');
  });
});
