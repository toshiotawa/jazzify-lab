import type { BillingStatusPayload } from '@/utils/billingStatusClient';
import {
  effectiveRankForAccess,
  getDisplayMembershipTier,
  getMembershipDisplayLabel,
  hasNonExpiredBillingProvider,
  isBillingEntitlementPremium,
  isPremiumForDisplay,
} from '@/utils/membershipDisplay';

const payload = (entitlement_state: string): BillingStatusPayload => ({
  provider: 'apple',
  status: 'active',
  entitlement_state,
  plan_code: 'core_monthly',
  trial_used: false,
  trial_used_at: null,
  current_period_ends_at: null,
  pending_plan_code: null,
  pending_plan_effective_at: null,
  next_billing_amount_jpy: 3980,
  can_change_plan: false,
  can_resume: false,
  can_manage_payment: false,
  can_cancel_pending_plan_change: false,
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
    it('returns localized labels from display tier with plan interval when available', () => {
      expect(getMembershipDisplayLabel('free', payload('active'), 'ja')).toBe('プレミアム（月額プラン）');
      expect(getMembershipDisplayLabel('free', payload('active'), 'en')).toBe('Premium (Monthly plan)');
      expect(getMembershipDisplayLabel('free', null, 'ja')).toBe('フリー');
    });
  });

  describe('hasNonExpiredBillingProvider', () => {
    it('returns true for active apple or lemon billing', () => {
      expect(hasNonExpiredBillingProvider(payload('active'), 'apple')).toBe(true);
      expect(hasNonExpiredBillingProvider({ ...payload('active'), provider: 'lemon' }, 'lemon')).toBe(true);
    });

    it('returns true for apple billing retry (payment_issue_no_access)', () => {
      expect(hasNonExpiredBillingProvider(payload('payment_issue_no_access'), 'apple')).toBe(true);
    });

    it('returns false when entitlement is expired even if provider row remains', () => {
      expect(hasNonExpiredBillingProvider(payload('expired'), 'apple')).toBe(false);
      expect(hasNonExpiredBillingProvider({ ...payload('expired'), provider: 'lemon' }, 'lemon')).toBe(false);
    });

    it('returns false when provider does not match', () => {
      expect(hasNonExpiredBillingProvider(payload('active'), 'lemon')).toBe(false);
      expect(hasNonExpiredBillingProvider(null, 'apple')).toBe(false);
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
