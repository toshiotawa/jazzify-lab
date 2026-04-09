import type { BillingStatusPayload } from '@/utils/billingStatusClient';
import {
  effectiveRankForAccess,
  getDisplayMembershipTier,
  getMembershipDisplayLabel,
  isBillingEntitlementPremium,
  isPremiumForDisplay,
} from '@/utils/membershipDisplay';

const payload = (entitlement_state: string): BillingStatusPayload => ({
  provider: 'apple',
  status: 'active',
  entitlement_state,
  plan_code: 'core_monthly',
  trial_used: false,
  current_period_ends_at: null,
});

describe('membershipDisplay', () => {
  describe('isBillingEntitlementPremium', () => {
    it('returns true for active-like entitlements', () => {
      expect(isBillingEntitlementPremium(payload('active'))).toBe(true);
      expect(isBillingEntitlementPremium(payload('payment_issue_with_access'))).toBe(true);
      expect(isBillingEntitlementPremium(payload('cancelled_but_active_until_end'))).toBe(true);
    });

    it('returns false for inactive entitlements', () => {
      expect(isBillingEntitlementPremium(payload('expired'))).toBe(false);
      expect(isBillingEntitlementPremium(payload('payment_issue_no_access'))).toBe(false);
    });
  });

  describe('isPremiumForDisplay', () => {
    it('uses billing when payload is present', () => {
      expect(isPremiumForDisplay('free', payload('active'))).toBe(true);
      expect(isPremiumForDisplay('premium', payload('expired'))).toBe(false);
    });

    it('falls back to rank when billing is null', () => {
      expect(isPremiumForDisplay('free', null)).toBe(false);
      expect(isPremiumForDisplay('premium', null)).toBe(true);
      expect(isPremiumForDisplay('standard', null)).toBe(true);
    });
  });

  describe('getDisplayMembershipTier', () => {
    it('matches isPremiumForDisplay', () => {
      expect(getDisplayMembershipTier('free', payload('active'))).toBe('premium');
      expect(getDisplayMembershipTier('premium', payload('expired'))).toBe('free');
    });
  });

  describe('getMembershipDisplayLabel', () => {
    it('returns localized labels from display tier', () => {
      expect(getMembershipDisplayLabel('free', payload('active'), 'ja')).toBe('プレミアム');
      expect(getMembershipDisplayLabel('free', payload('active'), 'en')).toBe('Premium');
      expect(getMembershipDisplayLabel('free', null, 'ja')).toBe('フリー');
    });
  });

  describe('effectiveRankForAccess', () => {
    it('upgrades free to premium when billing is active', () => {
      expect(effectiveRankForAccess('free', payload('active'))).toBe('premium');
    });

    it('keeps non-free rank when billing is active', () => {
      expect(effectiveRankForAccess('standard', payload('active'))).toBe('standard');
    });

    it('keeps profile rank when billing is expired', () => {
      expect(effectiveRankForAccess('premium', payload('expired'))).toBe('premium');
    });
  });
});
