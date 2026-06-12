import {
  nextBillingAmountJpy,
  resolvePlanCodeOnSubscriptionUpdated,
  resolvePlanFieldsOnPaymentSuccess,
} from '../../netlify/functions/lib/pendingPlanChange';

describe('resolvePlanCodeOnSubscriptionUpdated', () => {
  it('keeps existing plan_code when pending change is scheduled', () => {
    expect(resolvePlanCodeOnSubscriptionUpdated('core_monthly', 'core_yearly', 'core_yearly'))
      .toBe('core_monthly');
  });

  it('applies variant plan_code when no pending change', () => {
    expect(resolvePlanCodeOnSubscriptionUpdated('core_monthly', null, 'core_yearly'))
      .toBe('core_yearly');
  });
});

describe('resolvePlanFieldsOnPaymentSuccess', () => {
  it('applies variant plan and clears pending fields', () => {
    expect(resolvePlanFieldsOnPaymentSuccess('core_yearly')).toEqual({
      plan_code: 'core_yearly',
      pending_plan_code: null,
      pending_plan_effective_at: null,
    });
  });
});

describe('nextBillingAmountJpy', () => {
  it('uses pending plan for next billing amount', () => {
    expect(nextBillingAmountJpy('core_monthly', 'core_yearly')).toBe(34800);
  });

  it('uses current plan when no pending change', () => {
    expect(nextBillingAmountJpy('core_monthly', null)).toBe(3980);
  });
});
