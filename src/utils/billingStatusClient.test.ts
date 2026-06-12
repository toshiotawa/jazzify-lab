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
    expect(payload.can_cancel_pending_plan_change).toBe(false);
    expect(payload.next_billing_amount_jpy).toBe(3980);
    expect(payload.can_manage_payment).toBe(true);
    expect(payload.can_resume).toBe(false);
  });

  it('derives pending plan capabilities and next billing amount', () => {
    const payload = normalizeBillingStatusPayload({
      provider: 'lemon',
      status: 'active',
      entitlement_state: 'active',
      plan_code: 'core_monthly',
      pending_plan_code: 'core_yearly',
      pending_plan_effective_at: '2026-07-12T00:00:00.000Z',
      trial_used: false,
      current_period_ends_at: '2026-07-12T00:00:00.000Z',
    });
    expect(payload.can_change_plan).toBe(false);
    expect(payload.can_cancel_pending_plan_change).toBe(true);
    expect(payload.next_billing_amount_jpy).toBe(34800);
  });

  it('derives resume when cancellation is scheduled', () => {
    const payload = normalizeBillingStatusPayload({
      provider: 'lemon',
      status: 'active',
      entitlement_state: 'active',
      plan_code: 'core_yearly',
      pending_cancel_effective_at: '2027-06-12T05:30:46.000000Z',
      trial_used: false,
      current_period_ends_at: '2027-06-12T05:30:46.000000Z',
    });
    expect(payload.can_resume).toBe(true);
    expect(payload.can_change_plan).toBe(false);
    expect(payload.next_billing_amount_jpy).toBeNull();
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
