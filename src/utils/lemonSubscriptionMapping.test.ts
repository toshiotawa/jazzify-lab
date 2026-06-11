import {
  mapLemonStatusToSubscription,
  rankForSubscription,
} from '../../netlify/functions/lib/lemonSubscriptionMapping';

describe('mapLemonStatusToSubscription', () => {
  const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  it('maps subscription_created on_trial to trial/active', () => {
    expect(mapLemonStatusToSubscription('subscription_created', 'on_trial', {})).toEqual({
      status: 'trial',
      entitlementState: 'active',
      trialUsed: true,
    });
  });

  it('maps subscription_payment_success to active', () => {
    expect(mapLemonStatusToSubscription('subscription_payment_success', 'active', {})).toEqual({
      status: 'active',
      entitlementState: 'active',
    });
  });

  it('maps subscription_cancelled with future period end to cancelled_but_active_until_end', () => {
    expect(
      mapLemonStatusToSubscription(
        'subscription_cancelled',
        'cancelled',
        { ends_at: futureEnd },
        Date.now(),
      ),
    ).toEqual({
      status: 'canceled',
      entitlementState: 'cancelled_but_active_until_end',
    });
  });

  it('maps subscription_cancelled with past period end to expired', () => {
    expect(
      mapLemonStatusToSubscription(
        'subscription_cancelled',
        'cancelled',
        { ends_at: pastEnd },
        Date.now(),
      ),
    ).toEqual({
      status: 'canceled',
      entitlementState: 'expired',
    });
  });

  it('maps subscription_updated past_due to payment_issue_with_access', () => {
    expect(mapLemonStatusToSubscription('subscription_updated', 'past_due', {})).toEqual({
      status: 'past_due',
      entitlementState: 'payment_issue_with_access',
    });
  });
});

describe('rankForSubscription', () => {
  it('returns standard_global for active lemon entitlement', () => {
    expect(rankForSubscription('lemon', 'active')).toBe('standard_global');
    expect(rankForSubscription('lemon', 'cancelled_but_active_until_end')).toBe('standard_global');
  });

  it('returns free for expired entitlement', () => {
    expect(rankForSubscription('lemon', 'expired')).toBe('free');
  });
});
