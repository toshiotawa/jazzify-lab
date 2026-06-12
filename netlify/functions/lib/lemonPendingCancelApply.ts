/**
 * 予約解約の cron 適用判定（pure、テスト可能）。
 */

export interface PendingCancelRow {
  pending_cancel_effective_at: string;
  pending_cancel_effective_at_snapshot: string | null;
  pending_cancel_attempts: number;
}

export interface LemonCancelSubscriptionState {
  status: string;
  cancelled: boolean;
  renews_at: string | null;
}

export type PendingCancelApplyDecision =
  | { action: 'cancel_pending'; reason: 'subscription_not_active' }
  | { action: 'mark_applied'; reason: 'already_cancelled_on_lemon' }
  | { action: 'reschedule'; reason: 'renewal_date_changed'; newEffectiveAt: string }
  | { action: 'delete' };

const ALLOWED_RENEWAL_DRIFT_MS = 24 * 60 * 60 * 1000;

const parseTimeMs = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export function decidePendingCancelApply(
  row: PendingCancelRow,
  lemon: LemonCancelSubscriptionState,
  allowedDriftMs: number = ALLOWED_RENEWAL_DRIFT_MS,
): PendingCancelApplyDecision {
  const status = lemon.status.toLowerCase();

  if (lemon.cancelled || status === 'cancelled') {
    return { action: 'mark_applied', reason: 'already_cancelled_on_lemon' };
  }

  if (status === 'expired' || status === 'unpaid') {
    return { action: 'cancel_pending', reason: 'subscription_not_active' };
  }

  const renewsAtMs = parseTimeMs(lemon.renews_at);
  const snapshotMs = parseTimeMs(row.pending_cancel_effective_at_snapshot);
  if (
    renewsAtMs !== null &&
    snapshotMs !== null &&
    Math.abs(renewsAtMs - snapshotMs) > allowedDriftMs &&
    lemon.renews_at !== null
  ) {
    return { action: 'reschedule', reason: 'renewal_date_changed', newEffectiveAt: lemon.renews_at };
  }

  return { action: 'delete' };
}
