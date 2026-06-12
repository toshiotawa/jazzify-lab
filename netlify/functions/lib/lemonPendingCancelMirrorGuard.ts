/**
 * 予約解約（scheduled）中に Lemon 側だけ先に cancelled になった webhook を
 * Jazzify の契約状態へ反映しないためのガード（pure）。
 *
 * cron 適用前は Jazzify が契約の正。Lemon の早期解約はミラーしない。
 * cron 適用後は Lemon の grace（cancelled_but_active）ではなく即 expired とする。
 */

import type { SubscriptionMirrorColumns } from './lemonSubscriptionMirror';

export function shouldBlockCancellationMirror(
  pendingCancelStatus: string | null | undefined,
  lemonStatus: string,
  lemonCancelled: boolean,
): boolean {
  if (pendingCancelStatus !== 'scheduled' && pendingCancelStatus !== 'applying') {
    return false;
  }
  const status = lemonStatus.toLowerCase();
  return lemonCancelled || status === 'cancelled';
}

export function applyImmediateExpireAfterPendingCancelApply(
  columns: SubscriptionMirrorColumns,
  lastPendingCancelAppliedAt: string | null | undefined,
): SubscriptionMirrorColumns {
  if (!lastPendingCancelAppliedAt) {
    return columns;
  }
  if (columns.entitlement_state !== 'cancelled_but_active_until_end') {
    return columns;
  }
  return {
    ...columns,
    status: 'expired',
    entitlement_state: 'expired',
    current_period_ends_at: null,
  };
}
