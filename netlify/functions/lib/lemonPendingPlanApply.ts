/**
 * 予約プラン変更の cron 適用判定（pure、テスト可能）。
 *
 * 前提: 予約時点の状態が今も続いているとは限らない。適用前に Lemon の現在状態を
 * 再確認し、前提が崩れていたら PATCH せず安全側に倒す。
 */

export interface PendingPlanRow {
  pending_plan_code: string;
  pending_provider_variant_id: string;
  pending_from_provider_variant_id: string | null;
  pending_plan_effective_at: string;
  pending_effective_at_snapshot: string | null;
  pending_attempts: number;
}

export interface LemonSubscriptionCurrentState {
  status: string;
  cancelled: boolean;
  variant_id: number | string | null;
  renews_at: string | null;
}

export type PendingApplyDecision =
  | { action: 'cancel_pending'; reason: 'subscription_not_active' }
  | { action: 'mark_applied'; reason: 'already_on_target_variant' }
  | { action: 'fail_permanently'; reason: 'subscription_changed_externally' }
  | { action: 'reschedule'; reason: 'renewal_date_changed'; newEffectiveAt: string }
  | { action: 'patch' };

const ALLOWED_RENEWAL_DRIFT_MS = 24 * 60 * 60 * 1000;

const parseTimeMs = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export function decidePendingApply(
  row: PendingPlanRow,
  lemon: LemonSubscriptionCurrentState,
  allowedDriftMs: number = ALLOWED_RENEWAL_DRIFT_MS,
): PendingApplyDecision {
  const status = lemon.status.toLowerCase();
  if (lemon.cancelled || status === 'cancelled' || status === 'expired' || status === 'unpaid') {
    return { action: 'cancel_pending', reason: 'subscription_not_active' };
  }

  const currentVariantId = lemon.variant_id !== null ? String(lemon.variant_id) : null;
  if (currentVariantId === row.pending_provider_variant_id) {
    return { action: 'mark_applied', reason: 'already_on_target_variant' };
  }

  if (
    row.pending_from_provider_variant_id !== null &&
    currentVariantId !== row.pending_from_provider_variant_id
  ) {
    return { action: 'fail_permanently', reason: 'subscription_changed_externally' };
  }

  const renewsAtMs = parseTimeMs(lemon.renews_at);
  const snapshotMs = parseTimeMs(row.pending_effective_at_snapshot);
  if (
    renewsAtMs !== null &&
    snapshotMs !== null &&
    Math.abs(renewsAtMs - snapshotMs) > allowedDriftMs &&
    lemon.renews_at !== null
  ) {
    return { action: 'reschedule', reason: 'renewal_date_changed', newEffectiveAt: lemon.renews_at };
  }

  return { action: 'patch' };
}

export const MAX_PENDING_ATTEMPTS = 5;

export type PendingFailureOutcome =
  | { kind: 'retry'; nextAttempts: number }
  | { kind: 'permanent'; nextAttempts: number };

export function decideFailureOutcome(currentAttempts: number): PendingFailureOutcome {
  const nextAttempts = currentAttempts + 1;
  if (nextAttempts >= MAX_PENDING_ATTEMPTS) {
    return { kind: 'permanent', nextAttempts };
  }
  return { kind: 'retry', nextAttempts };
}
