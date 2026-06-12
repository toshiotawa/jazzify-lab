import {
  decideFailureOutcome,
  decidePendingApply,
  MAX_PENDING_ATTEMPTS,
  type LemonSubscriptionCurrentState,
  type PendingPlanRow,
} from '../../netlify/functions/lib/lemonPendingPlanApply';

const EFFECTIVE_AT = '2026-07-12T03:00:00.000Z';

const row = (overrides: Partial<PendingPlanRow> = {}): PendingPlanRow => ({
  pending_plan_code: 'core_yearly',
  pending_provider_variant_id: '1776822',
  pending_from_provider_variant_id: '1315418',
  pending_plan_effective_at: EFFECTIVE_AT,
  pending_effective_at_snapshot: EFFECTIVE_AT,
  pending_attempts: 0,
  ...overrides,
});

const lemon = (overrides: Partial<LemonSubscriptionCurrentState> = {}): LemonSubscriptionCurrentState => ({
  status: 'active',
  cancelled: false,
  variant_id: 1315418,
  renews_at: EFFECTIVE_AT,
  ...overrides,
});

describe('decidePendingApply', () => {
  it('patches when the reservation premise still holds', () => {
    expect(decidePendingApply(row(), lemon())).toEqual({ action: 'patch' });
  });

  it('cancels pending when subscription is cancelled', () => {
    expect(decidePendingApply(row(), lemon({ cancelled: true, status: 'cancelled' }))).toEqual({
      action: 'cancel_pending',
      reason: 'subscription_not_active',
    });
  });

  it('cancels pending when subscription is expired', () => {
    expect(decidePendingApply(row(), lemon({ status: 'expired' }))).toEqual({
      action: 'cancel_pending',
      reason: 'subscription_not_active',
    });
  });

  it('marks applied idempotently when already on target variant', () => {
    expect(decidePendingApply(row(), lemon({ variant_id: 1776822 }))).toEqual({
      action: 'mark_applied',
      reason: 'already_on_target_variant',
    });
  });

  it('fails permanently when variant changed externally', () => {
    expect(decidePendingApply(row(), lemon({ variant_id: 9999999 }))).toEqual({
      action: 'fail_permanently',
      reason: 'subscription_changed_externally',
    });
  });

  it('reschedules when renewal date drifted beyond tolerance', () => {
    const driftedRenewsAt = '2026-07-20T03:00:00.000Z';
    expect(decidePendingApply(row(), lemon({ renews_at: driftedRenewsAt }))).toEqual({
      action: 'reschedule',
      reason: 'renewal_date_changed',
      newEffectiveAt: driftedRenewsAt,
    });
  });

  it('tolerates renewal drift within 24 hours', () => {
    const slightDrift = '2026-07-12T10:00:00.000Z';
    expect(decidePendingApply(row(), lemon({ renews_at: slightDrift }))).toEqual({ action: 'patch' });
  });

  it('still patches when from-variant is unknown (legacy rows)', () => {
    const legacyRow = row({ pending_from_provider_variant_id: null });
    expect(decidePendingApply(legacyRow, lemon({ variant_id: 5555 }))).toEqual({ action: 'patch' });
  });

  it('prioritizes cancel over already-applied', () => {
    expect(
      decidePendingApply(row(), lemon({ cancelled: true, status: 'cancelled', variant_id: 1776822 })),
    ).toEqual({ action: 'cancel_pending', reason: 'subscription_not_active' });
  });
});

describe('decideFailureOutcome', () => {
  it('retries while attempts remain', () => {
    expect(decideFailureOutcome(0)).toEqual({ kind: 'retry', nextAttempts: 1 });
    expect(decideFailureOutcome(MAX_PENDING_ATTEMPTS - 2)).toEqual({
      kind: 'retry',
      nextAttempts: MAX_PENDING_ATTEMPTS - 1,
    });
  });

  it('fails permanently at the attempt limit', () => {
    expect(decideFailureOutcome(MAX_PENDING_ATTEMPTS - 1)).toEqual({
      kind: 'permanent',
      nextAttempts: MAX_PENDING_ATTEMPTS,
    });
  });
});
