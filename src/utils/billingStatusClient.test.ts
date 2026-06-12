import {
  normalizeBillingStatusPayload,
} from '@/utils/billingStatusClient';

describe('normalizeBillingStatusPayload', () => {
  it('derives can_* flags when API omits them (pre-deploy billing-status)', () => {
    const payload = normalizeBillingStatusPayload({
      provider: 'lemon',
      status: 'active',
      entitlement_state: 'active',
      plan_code: 'core_monthly',
      trial_used: false,
      current_period_ends_at: '2026-07-12T00:00:00.000Z',
    });
    expect(payload.can_change_plan).toBe(true);
    expect(payload.can_manage_payment).toBe(true);
    expect(payload.can_resume).toBe(false);
  });

  it('preserves explicit false from API', () => {
    const payload = normalizeBillingStatusPayload({
      provider: 'lemon',
      status: 'canceled',
      entitlement_state: 'cancelled_but_active_until_end',
      plan_code: 'core_monthly',
      trial_used: true,
      can_change_plan: false,
      can_resume: true,
      can_manage_payment: true,
    });
    expect(payload.can_change_plan).toBe(false);
    expect(payload.can_resume).toBe(true);
  });
});
