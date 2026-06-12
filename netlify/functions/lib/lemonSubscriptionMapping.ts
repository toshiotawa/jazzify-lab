export type EntitlementState =
  | 'active'
  | 'payment_issue_with_access'
  | 'payment_issue_no_access'
  | 'cancelled_but_active_until_end'
  | 'expired';

export interface LemonSubscriptionStateMapping {
  status: string;
  entitlementState: EntitlementState;
}

/**
 * Lemon Subscription object の現在状態から DB の status / entitlement_state を導出する。
 * イベント名には依存しない（Webhook はオブジェクト状態のミラーに徹する）。
 */
export function mapLemonSubscriptionObjectState(
  lemonStatus: string,
  cancelled: boolean,
  periodEndMs: number,
  nowMs: number = Date.now(),
): LemonSubscriptionStateMapping {
  if (lemonStatus === 'expired' || lemonStatus === 'unpaid') {
    return { status: 'expired', entitlementState: 'expired' };
  }
  if (cancelled || lemonStatus === 'cancelled' || lemonStatus === 'paused') {
    return {
      status: 'canceled',
      entitlementState: periodEndMs > nowMs ? 'cancelled_but_active_until_end' : 'expired',
    };
  }
  if (lemonStatus === 'on_trial') {
    return { status: 'trial', entitlementState: 'active' };
  }
  if (lemonStatus === 'past_due') {
    return { status: 'past_due', entitlementState: 'payment_issue_with_access' };
  }
  return { status: 'active', entitlementState: 'active' };
}

export function rankForSubscription(
  provider: string,
  entitlementState: EntitlementState,
): 'free' | 'standard_global' | 'standard' {
  if (
    entitlementState === 'active' ||
    entitlementState === 'payment_issue_with_access' ||
    entitlementState === 'cancelled_but_active_until_end'
  ) {
    return provider === 'lemon' ? 'standard_global' : 'standard';
  }
  return 'free';
}
