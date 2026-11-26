import {
  getStripeClient,
  mapStripeSubscriptionStatus,
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
});
