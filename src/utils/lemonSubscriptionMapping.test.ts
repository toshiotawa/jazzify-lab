import {
  mapLemonSubscriptionObjectState,
  rankForSubscription,
} from '../../netlify/functions/lib/lemonSubscriptionMapping';

describe('mapLemonSubscriptionObjectState', () => {
  const now = Date.now();
  const futureMs = now + 7 * 24 * 60 * 60 * 1000;
  const pastMs = now - 24 * 60 * 60 * 1000;

  it('maps on_trial to trial/active', () => {
    expect(mapLemonSubscriptionObjectState('on_trial', false, futureMs, now)).toEqual({
      status: 'trial',
      entitlementState: 'active',
    });
  });

  it('maps active to active/active', () => {
    expect(mapLemonSubscriptionObjectState('active', false, futureMs, now)).toEqual({
      status: 'active',
      entitlementState: 'active',
    });
  });

  it('maps past_due to payment_issue_with_access', () => {
    expect(mapLemonSubscriptionObjectState('past_due', false, futureMs, now)).toEqual({
      status: 'past_due',
      entitlementState: 'payment_issue_with_access',
    });
  });

  it('maps unpaid and expired to expired', () => {
    expect(mapLemonSubscriptionObjectState('unpaid', false, futureMs, now)).toEqual({
      status: 'expired',
      entitlementState: 'expired',
    });
    expect(mapLemonSubscriptionObjectState('expired', false, pastMs, now)).toEqual({
      status: 'expired',
      entitlementState: 'expired',
    });
  });

  it('maps cancelled with remaining period to cancelled_but_active_until_end', () => {
    expect(mapLemonSubscriptionObjectState('cancelled', true, futureMs, now)).toEqual({
      status: 'canceled',
      entitlementState: 'cancelled_but_active_until_end',
    });
  });

  it('maps cancelled with past period to expired', () => {
    expect(mapLemonSubscriptionObjectState('cancelled', true, pastMs, now)).toEqual({
      status: 'canceled',
      entitlementState: 'expired',
    });
  });

  it('treats cancelled flag as cancelled even if status is active', () => {
    expect(mapLemonSubscriptionObjectState('active', true, futureMs, now)).toEqual({
      status: 'canceled',
      entitlementState: 'cancelled_but_active_until_end',
    });
  });

  it('maps paused like cancelled grace', () => {
    expect(mapLemonSubscriptionObjectState('paused', false, futureMs, now)).toEqual({
      status: 'canceled',
      entitlementState: 'cancelled_but_active_until_end',
    });
  });
});

describe('rankForSubscription', () => {
  it('grants standard_global for active lemon entitlements', () => {
    expect(rankForSubscription('lemon', 'active')).toBe('standard_global');
    expect(rankForSubscription('lemon', 'cancelled_but_active_until_end')).toBe('standard_global');
    expect(rankForSubscription('lemon', 'payment_issue_with_access')).toBe('standard_global');
  });

  it('downgrades to free when expired', () => {
    expect(rankForSubscription('lemon', 'expired')).toBe('free');
    expect(rankForSubscription('lemon', 'payment_issue_no_access')).toBe('free');
  });

  it('grants standard for non-lemon providers', () => {
    expect(rankForSubscription('apple', 'active')).toBe('standard');
  });
});
