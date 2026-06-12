export type EntitlementState =
  | 'active'
  | 'payment_issue_with_access'
  | 'payment_issue_no_access'
  | 'cancelled_but_active_until_end'
  | 'expired';

export interface LemonSubscriptionMapping {
  status: string;
  entitlementState: EntitlementState;
  trialUsed?: boolean;
}

export function periodEndMsFromAttrs(attrs: Record<string, unknown> | undefined): number {
  if (!attrs) return 0;
  const endsAt = attrs.ends_at as string | undefined;
  const renewsAt = attrs.renews_at as string | undefined;
  const trialEndsAt = attrs.trial_ends_at as string | undefined;
  const raw = endsAt || renewsAt || trialEndsAt;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function mapCancelledEntitlement(periodStillActive: boolean): LemonSubscriptionMapping {
  return {
    status: 'canceled',
    entitlementState: periodStillActive ? 'cancelled_but_active_until_end' : 'expired',
  };
}

export function mapLemonStatusToSubscription(
  eventName: string,
  lemonStatus: string | undefined,
  attrs: Record<string, unknown> | undefined,
  nowMs: number = Date.now(),
): LemonSubscriptionMapping {
  const periodEndMs = periodEndMsFromAttrs(attrs);
  const periodStillActive = periodEndMs > nowMs;

  switch (eventName) {
    case 'subscription_created':
      if (lemonStatus === 'on_trial') {
        return { status: 'trial', entitlementState: 'active', trialUsed: true };
      }
      return { status: 'active', entitlementState: 'active' };
    case 'subscription_updated':
      if (lemonStatus === 'on_trial') return { status: 'trial', entitlementState: 'active' };
      if (lemonStatus === 'active') return { status: 'active', entitlementState: 'active' };
      if (lemonStatus === 'past_due') {
        return { status: 'past_due', entitlementState: 'payment_issue_with_access' };
      }
      if (lemonStatus === 'unpaid') return { status: 'expired', entitlementState: 'expired' };
      if (lemonStatus === 'expired') return { status: 'expired', entitlementState: 'expired' };
      if (lemonStatus === 'cancelled' || lemonStatus === 'paused') {
        return mapCancelledEntitlement(periodStillActive);
      }
      return { status: 'active', entitlementState: 'active' };
    case 'subscription_payment_success':
      if (lemonStatus === 'on_trial') return { status: 'trial', entitlementState: 'active' };
      return { status: 'active', entitlementState: 'active' };
    case 'subscription_cancelled':
      return mapCancelledEntitlement(periodStillActive);
    case 'subscription_expired':
      return { status: 'expired', entitlementState: 'expired' };
    case 'subscription_resumed':
      return { status: 'active', entitlementState: 'active' };
    case 'subscription_paused':
      return mapCancelledEntitlement(periodStillActive);
    case 'order_refunded':
      return { status: 'expired', entitlementState: 'expired' };
    default:
      return { status: 'active', entitlementState: 'active' };
  }
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
