/**
 * Lemon サブスクリプション操作のガード（pure、テスト可能）。
 */

export type SubscriptionAction =
  | 'change_plan'
  | 'resume'
  | 'manage_payment'
  | 'billing_history'
  | 'cancel';

export interface BillingCapabilities {
  can_change_plan: boolean;
  can_resume: boolean;
  can_manage_payment: boolean;
}

export interface LemonSubscriptionSnapshot {
  status: string;
  cancelled: boolean;
  ends_at: string | null;
}

export function deriveBillingCapabilities(
  provider: string,
  entitlementState: string,
  status: string,
): BillingCapabilities {
  if (provider !== 'lemon') {
    return {
      can_change_plan: false,
      can_resume: false,
      can_manage_payment: false,
    };
  }

  const isActiveEntitlement = entitlementState === 'active';
  const isCancelledGrace = entitlementState === 'cancelled_but_active_until_end';
  const isPastDue = entitlementState === 'payment_issue_with_access' || status === 'past_due';

  return {
    can_change_plan: isActiveEntitlement,
    can_resume: isCancelledGrace,
    can_manage_payment: isActiveEntitlement || isCancelledGrace || isPastDue,
  };
}

function periodEndMs(endsAt: string | null): number {
  if (!endsAt) return 0;
  const ms = new Date(endsAt).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function assertSubscriptionActionAllowed(
  snapshot: LemonSubscriptionSnapshot,
  dbEntitlementState: string,
  action: SubscriptionAction,
  nowMs: number = Date.now(),
): { allowed: boolean; reason?: string } {
  const lemonStatus = snapshot.status.toLowerCase();
  const periodStillActive = periodEndMs(snapshot.ends_at) > nowMs;

  switch (action) {
    case 'change_plan': {
      if (dbEntitlementState !== 'active') {
        return { allowed: false, reason: 'Plan changes are not allowed in the current subscription state' };
      }
      if (lemonStatus !== 'active' && lemonStatus !== 'on_trial') {
        return { allowed: false, reason: 'Lemon subscription is not active' };
      }
      if (snapshot.cancelled) {
        return { allowed: false, reason: 'Cannot change plan while subscription is cancelled' };
      }
      return { allowed: true };
    }
    case 'resume': {
      if (dbEntitlementState !== 'cancelled_but_active_until_end') {
        return { allowed: false, reason: 'Subscription is not in cancelled grace period' };
      }
      if (!snapshot.cancelled) {
        return { allowed: false, reason: 'Subscription is not cancelled on Lemon' };
      }
      if (!periodStillActive) {
        return { allowed: false, reason: 'Subscription grace period has ended' };
      }
      return { allowed: true };
    }
    case 'manage_payment':
    case 'billing_history':
    case 'cancel': {
      const caps = deriveBillingCapabilities('lemon', dbEntitlementState, lemonStatus === 'on_trial' ? 'trial' : lemonStatus);
      if (action === 'manage_payment' && !caps.can_manage_payment) {
        return { allowed: false, reason: 'Payment management is not available' };
      }
      if (action === 'billing_history' && !caps.can_manage_payment) {
        return { allowed: false, reason: 'Billing history is not available' };
      }
      if (action === 'cancel') {
        if (dbEntitlementState !== 'active') {
          return { allowed: false, reason: 'Cancellation is not available in the current state' };
        }
        if (snapshot.cancelled) {
          return { allowed: false, reason: 'Subscription is already cancelled' };
        }
      }
      return { allowed: true };
    }
    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

export function targetPlanCodeForChange(currentPlanCode: string, target: 'monthly' | 'yearly'): string {
  return target === 'yearly' ? 'core_yearly' : 'core_monthly';
}
