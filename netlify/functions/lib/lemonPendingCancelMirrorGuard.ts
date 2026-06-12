/**
 * 予約解約（scheduled）中に Lemon 側だけ先に cancelled になった webhook を
 * Jazzify の契約状態へ反映しないためのガード（pure）。
 *
 * cron 適用前は Jazzify が契約の正。Lemon の早期解約はミラーしない。
 */

export function shouldBlockCancellationMirror(
  pendingCancelStatus: string | null | undefined,
  lemonStatus: string,
  lemonCancelled: boolean,
): boolean {
  if (pendingCancelStatus !== 'scheduled') {
    return false;
  }
  const status = lemonStatus.toLowerCase();
  return lemonCancelled || status === 'cancelled';
}
