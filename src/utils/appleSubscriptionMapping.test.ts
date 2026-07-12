import {
  appleTrialBecameUsed,
  isAppleFreeTrialOffer,
  mapAppleNotification,
  nextAppleTrialUsed,
  rankForAppleSubscription,
} from './appleSubscriptionMapping';

describe('isAppleFreeTrialOffer', () => {
  it('returns true for FREE_TRIAL', () => {
    expect(isAppleFreeTrialOffer({ offerDiscountType: 'FREE_TRIAL' })).toBe(true);
  });

  it('returns false for other offers or missing info', () => {
    expect(isAppleFreeTrialOffer({ offerDiscountType: 'PAY_AS_YOU_GO' })).toBe(false);
    expect(isAppleFreeTrialOffer({})).toBe(false);
    expect(isAppleFreeTrialOffer(undefined)).toBe(false);
  });
});

describe('mapAppleNotification', () => {
  const now = Date.now();
  const futureMs = now + 7 * 24 * 60 * 60 * 1000;
  const pastMs = now - 24 * 60 * 60 * 1000;

  it('maps INITIAL_BUY + FREE_TRIAL to trial/active with trialUsed', () => {
    expect(mapAppleNotification('SUBSCRIBED', 'INITIAL_BUY', futureMs, true, now)).toEqual({
      status: 'trial',
      entitlementState: 'active',
      trialUsed: true,
    });
  });

  it('maps INITIAL_BUY without free trial to active/active', () => {
    expect(mapAppleNotification('SUBSCRIBED', 'INITIAL_BUY', futureMs, false, now)).toEqual({
      status: 'active',
      entitlementState: 'active',
    });
  });

  it('maps OFFER_REDEEMED to trial/active with trialUsed', () => {
    expect(mapAppleNotification('OFFER_REDEEMED', undefined, futureMs, false, now)).toEqual({
      status: 'trial',
      entitlementState: 'active',
      trialUsed: true,
    });
  });

  it('maps AUTO_RENEW_DISABLED with active period to canceled/cancelled_but_active_until_end', () => {
    expect(
      mapAppleNotification('DID_CHANGE_RENEWAL_STATUS', 'AUTO_RENEW_DISABLED', futureMs, false, now),
    ).toEqual({
      status: 'canceled',
      entitlementState: 'cancelled_but_active_until_end',
    });
  });

  it('maps AUTO_RENEW_DISABLED with expired period to canceled/expired', () => {
    expect(
      mapAppleNotification('DID_CHANGE_RENEWAL_STATUS', 'AUTO_RENEW_DISABLED', pastMs, false, now),
    ).toEqual({
      status: 'canceled',
      entitlementState: 'expired',
    });
  });

  it('maps EXPIRED to expired/expired', () => {
    expect(mapAppleNotification('EXPIRED', 'VOLUNTARY', pastMs, false, now)).toEqual({
      status: 'expired',
      entitlementState: 'expired',
    });
  });
});

describe('nextAppleTrialUsed', () => {
  it('never reverts trial_used from true to false', () => {
    expect(nextAppleTrialUsed(true, false)).toBe(true);
    expect(nextAppleTrialUsed(true, undefined)).toBe(true);
  });

  it('sets true when mapped trialUsed is true', () => {
    expect(nextAppleTrialUsed(false, true)).toBe(true);
  });

  it('stays false when mapped trialUsed is undefined', () => {
    expect(nextAppleTrialUsed(false, undefined)).toBe(false);
  });
});

describe('appleTrialBecameUsed', () => {
  it('detects first-time trial usage', () => {
    expect(appleTrialBecameUsed(false, true)).toBe(true);
    expect(appleTrialBecameUsed(true, true)).toBe(false);
    expect(appleTrialBecameUsed(false, false)).toBe(false);
  });
});

describe('rankForAppleSubscription', () => {
  it('keeps standard for active entitlements including cancelled grace', () => {
    expect(rankForAppleSubscription('active')).toBe('standard');
    expect(rankForAppleSubscription('payment_issue_with_access')).toBe('standard');
    expect(rankForAppleSubscription('cancelled_but_active_until_end')).toBe('standard');
  });

  it('downgrades to free when expired or no access', () => {
    expect(rankForAppleSubscription('expired')).toBe('free');
    expect(rankForAppleSubscription('payment_issue_no_access')).toBe('free');
  });
});
