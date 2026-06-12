import {
  buildSubscriptionMirror,
  resolveCurrentPeriodEndsAt,
  type ExistingSubscriptionSnapshot,
  type LemonSubscriptionObjectAttrs,
} from '../../netlify/functions/lib/lemonSubscriptionMirror';

const NOW = new Date('2026-06-12T12:00:00.000Z').getTime();
const FUTURE = '2026-07-12T12:00:00.000Z';
const FAR_FUTURE = '2027-06-12T12:00:00.000Z';
const PAST = '2026-06-01T12:00:00.000Z';

const baseAttrs = (overrides: Partial<LemonSubscriptionObjectAttrs> = {}): LemonSubscriptionObjectAttrs => ({
  status: 'active',
  cancelled: false,
  variant_id: 1315418,
  customer_id: 999,
  renews_at: FUTURE,
  ends_at: null,
  trial_ends_at: null,
  updated_at: '2026-06-12T11:00:00.000Z',
  ...overrides,
});

const existingRow = (overrides: Partial<ExistingSubscriptionSnapshot> = {}): ExistingSubscriptionSnapshot => ({
  plan_code: 'core_monthly',
  trial_used: false,
  provider_updated_at: '2026-06-10T00:00:00.000Z',
  ...overrides,
});

const context = (overrides: Partial<{ variantPlanCode: string | null; variantIsTrial: boolean }> = {}) => ({
  variantPlanCode: 'core_monthly' as string | null,
  variantIsTrial: false,
  nowMs: NOW,
  ...overrides,
});

describe('resolveCurrentPeriodEndsAt', () => {
  it('uses renews_at for active subscriptions', () => {
    expect(resolveCurrentPeriodEndsAt(baseAttrs(), NOW)).toBe(FUTURE);
  });

  it('prefers ends_at when cancelled', () => {
    const attrs = baseAttrs({ status: 'cancelled', cancelled: true, ends_at: FAR_FUTURE });
    expect(resolveCurrentPeriodEndsAt(attrs, NOW)).toBe(FAR_FUTURE);
  });

  it('falls back to renews_at when cancelled without ends_at', () => {
    const attrs = baseAttrs({ status: 'cancelled', cancelled: true, ends_at: null });
    expect(resolveCurrentPeriodEndsAt(attrs, NOW)).toBe(FUTURE);
  });

  it('prefers ends_at when expired', () => {
    const attrs = baseAttrs({ status: 'expired', ends_at: PAST, renews_at: null });
    expect(resolveCurrentPeriodEndsAt(attrs, NOW)).toBe(PAST);
  });

  it('uses trial_ends_at while trial is in the future', () => {
    const attrs = baseAttrs({ status: 'on_trial', trial_ends_at: FUTURE, renews_at: FAR_FUTURE });
    expect(resolveCurrentPeriodEndsAt(attrs, NOW)).toBe(FUTURE);
  });

  it('ignores past trial_ends_at and uses renews_at', () => {
    const attrs = baseAttrs({ trial_ends_at: PAST, renews_at: FUTURE });
    expect(resolveCurrentPeriodEndsAt(attrs, NOW)).toBe(FUTURE);
  });
});

describe('buildSubscriptionMirror', () => {
  it('mirrors an active subscription', () => {
    const result = buildSubscriptionMirror(baseAttrs(), existingRow(), context());
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns).toMatchObject({
      plan_code: 'core_monthly',
      status: 'active',
      entitlement_state: 'active',
      current_period_ends_at: FUTURE,
      trial_used: false,
      provider_updated_at: '2026-06-12T11:00:00.000Z',
      provider_variant_id: '1315418',
      provider_customer_id: '999',
    });
    expect(result.trialBecameUsed).toBe(false);
  });

  it('skips stale updates older than provider_updated_at', () => {
    const attrs = baseAttrs({ updated_at: '2026-06-09T00:00:00.000Z' });
    const result = buildSubscriptionMirror(attrs, existingRow(), context());
    expect(result).toEqual({ kind: 'skipped', reason: 'stale_provider_update' });
  });

  it('applies updates with equal updated_at (only strictly older is stale)', () => {
    const attrs = baseAttrs({ updated_at: '2026-06-10T00:00:00.000Z' });
    const result = buildSubscriptionMirror(attrs, existingRow(), context());
    expect(result.kind).toBe('apply');
  });

  it('applies when existing row has no provider_updated_at', () => {
    const attrs = baseAttrs({ updated_at: '2026-06-09T00:00:00.000Z' });
    const result = buildSubscriptionMirror(attrs, existingRow({ provider_updated_at: null }), context());
    expect(result.kind).toBe('apply');
  });

  it('keeps existing plan_code when variant is unknown', () => {
    const attrs = baseAttrs({ variant_id: null });
    const result = buildSubscriptionMirror(attrs, existingRow({ plan_code: 'core_yearly' }), context({ variantPlanCode: null }));
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns.plan_code).toBe('core_yearly');
    expect(result.columns.provider_variant_id).toBeUndefined();
  });

  it('never reverts trial_used from true to false', () => {
    const attrs = baseAttrs({ trial_ends_at: null });
    const result = buildSubscriptionMirror(attrs, existingRow({ trial_used: true }), context());
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns.trial_used).toBe(true);
    expect(result.trialBecameUsed).toBe(false);
  });

  it('marks trial as used when trial_ends_at is present', () => {
    const attrs = baseAttrs({ status: 'on_trial', trial_ends_at: FUTURE });
    const result = buildSubscriptionMirror(attrs, existingRow(), context());
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns.trial_used).toBe(true);
    expect(result.trialBecameUsed).toBe(true);
  });

  it('marks trial as used for trial variants', () => {
    const result = buildSubscriptionMirror(baseAttrs(), existingRow(), context({ variantIsTrial: true }));
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns.trial_used).toBe(true);
  });

  it('mirrors cancelled subscription into grace state', () => {
    const attrs = baseAttrs({ status: 'cancelled', cancelled: true, ends_at: FUTURE, renews_at: null });
    const result = buildSubscriptionMirror(attrs, existingRow(), context());
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns).toMatchObject({
      status: 'canceled',
      entitlement_state: 'cancelled_but_active_until_end',
      current_period_ends_at: FUTURE,
    });
  });

  it('handles a missing existing row with defaults', () => {
    const result = buildSubscriptionMirror(baseAttrs({ variant_id: null }), null, context({ variantPlanCode: null }));
    expect(result.kind).toBe('apply');
    if (result.kind !== 'apply') return;
    expect(result.columns.plan_code).toBe('core_monthly');
  });
});
