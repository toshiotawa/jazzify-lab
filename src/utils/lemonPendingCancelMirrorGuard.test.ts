import {
  applyImmediateExpireAfterPendingCancelApply,
  shouldBlockCancellationMirror,
} from '../../netlify/functions/lib/lemonPendingCancelMirrorGuard';

describe('shouldBlockCancellationMirror', () => {
  it('blocks cancelled mirror while pending cancel is scheduled', () => {
    expect(shouldBlockCancellationMirror('scheduled', 'cancelled', true)).toBe(true);
    expect(shouldBlockCancellationMirror('scheduled', 'active', true)).toBe(true);
  });

  it('blocks cancelled mirror while cron is applying', () => {
    expect(shouldBlockCancellationMirror('applying', 'cancelled', true)).toBe(true);
  });

  it('allows mirror when no pending cancel', () => {
    expect(shouldBlockCancellationMirror(null, 'cancelled', true)).toBe(false);
    expect(shouldBlockCancellationMirror('failed', 'cancelled', true)).toBe(false);
  });

  it('allows active mirror during scheduled pending cancel', () => {
    expect(shouldBlockCancellationMirror('scheduled', 'active', false)).toBe(false);
  });
});

describe('applyImmediateExpireAfterPendingCancelApply', () => {
  const graceColumns = {
    plan_code: 'core_monthly',
    status: 'canceled',
    entitlement_state: 'cancelled_but_active_until_end' as const,
    current_period_ends_at: '2027-06-12T00:00:00.000Z',
    trial_used: false,
    provider_updated_at: '2026-06-12T00:00:00.000Z',
  };

  it('forces expired when pending cancel was applied by cron', () => {
    expect(applyImmediateExpireAfterPendingCancelApply(graceColumns, '2026-06-12T06:00:00.000Z')).toEqual({
      ...graceColumns,
      status: 'expired',
      entitlement_state: 'expired',
      current_period_ends_at: null,
    });
  });

  it('leaves columns unchanged without applied marker', () => {
    expect(applyImmediateExpireAfterPendingCancelApply(graceColumns, null)).toBe(graceColumns);
  });
});
