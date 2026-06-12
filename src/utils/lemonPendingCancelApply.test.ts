import {
  decidePendingCancelApply,
  type PendingCancelRow,
} from '../../netlify/functions/lib/lemonPendingCancelApply';

const row = (): PendingCancelRow => ({
  pending_cancel_effective_at: '2026-07-12T05:25:32.000000Z',
  pending_cancel_effective_at_snapshot: '2026-07-12T05:25:32.000000Z',
  pending_cancel_attempts: 0,
});

const lemon = (overrides: Partial<{
  status: string;
  cancelled: boolean;
  renews_at: string | null;
}> = {}) => ({
  status: 'active',
  cancelled: false,
  renews_at: '2026-07-12T05:25:32.000000Z',
  ...overrides,
});

describe('decidePendingCancelApply', () => {
  it('deletes when subscription is active on Lemon', () => {
    expect(decidePendingCancelApply(row(), lemon())).toEqual({ action: 'delete' });
  });

  it('marks applied when already cancelled on Lemon', () => {
    expect(decidePendingCancelApply(row(), lemon({ cancelled: true, status: 'cancelled' }))).toEqual({
      action: 'mark_applied',
      reason: 'already_cancelled_on_lemon',
    });
  });

  it('clears pending when subscription is expired', () => {
    expect(decidePendingCancelApply(row(), lemon({ status: 'expired' }))).toEqual({
      action: 'cancel_pending',
      reason: 'subscription_not_active',
    });
  });

  it('reschedules when renewal date drifted', () => {
    expect(
      decidePendingCancelApply(
        row(),
        lemon({ renews_at: '2026-08-12T05:25:32.000000Z' }),
        24 * 60 * 60 * 1000,
      ),
    ).toEqual({
      action: 'reschedule',
      reason: 'renewal_date_changed',
      newEffectiveAt: '2026-08-12T05:25:32.000000Z',
    });
  });
});
