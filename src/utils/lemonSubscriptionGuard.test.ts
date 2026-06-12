import {
  assertSubscriptionActionAllowed,
  deriveBillingCapabilities,
  targetPlanCodeForChange,
} from '../../netlify/functions/lib/lemonSubscriptionGuard';

describe('deriveBillingCapabilities', () => {
  it('allows plan change only when active', () => {
    const caps = deriveBillingCapabilities('lemon', 'active', 'active');
    expect(caps.can_change_plan).toBe(true);
    expect(caps.can_resume).toBe(false);
    expect(caps.can_manage_payment).toBe(true);
  });

  it('allows resume only in cancelled grace period', () => {
    const caps = deriveBillingCapabilities('lemon', 'cancelled_but_active_until_end', 'canceled');
    expect(caps.can_change_plan).toBe(false);
    expect(caps.can_resume).toBe(true);
    expect(caps.can_manage_payment).toBe(true);
  });

  it('allows payment management for past_due', () => {
    const caps = deriveBillingCapabilities('lemon', 'payment_issue_with_access', 'past_due');
    expect(caps.can_change_plan).toBe(false);
    expect(caps.can_manage_payment).toBe(true);
  });
});

describe('assertSubscriptionActionAllowed', () => {
  const activeSnapshot = {
    status: 'active',
    cancelled: false,
    ends_at: null,
  };

  it('allows plan change for active subscription', () => {
    expect(assertSubscriptionActionAllowed(activeSnapshot, 'active', 'change_plan').allowed).toBe(true);
  });

  it('blocks plan change when cancelled grace', () => {
    expect(assertSubscriptionActionAllowed(
      { status: 'cancelled', cancelled: true, ends_at: '2099-01-01T00:00:00.000Z' },
      'cancelled_but_active_until_end',
      'change_plan',
    ).allowed).toBe(false);
  });

  it('allows resume in cancelled grace with future ends_at', () => {
    expect(assertSubscriptionActionAllowed(
      { status: 'cancelled', cancelled: true, ends_at: '2099-01-01T00:00:00.000Z' },
      'cancelled_but_active_until_end',
      'resume',
    ).allowed).toBe(true);
  });

  it('allows cancel portal link for active subscription', () => {
    expect(assertSubscriptionActionAllowed(activeSnapshot, 'active', 'cancel').allowed).toBe(true);
  });
});

describe('targetPlanCodeForChange', () => {
  it('maps target interval to plan code', () => {
    expect(targetPlanCodeForChange('core_monthly', 'yearly')).toBe('core_yearly');
    expect(targetPlanCodeForChange('core_yearly', 'monthly')).toBe('core_monthly');
  });
});
