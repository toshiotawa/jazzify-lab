export type AppleEntitlementState =
  | 'active'
  | 'payment_issue_with_access'
  | 'payment_issue_no_access'
  | 'cancelled_but_active_until_end'
  | 'expired';

export interface AppleSubscriptionStateMapping {
  status: string;
  entitlementState: AppleEntitlementState;
  trialUsed?: boolean;
}

export interface AppleTransactionInfo {
  offerDiscountType?: string;
}

export function isAppleFreeTrialOffer(transactionInfo: AppleTransactionInfo | undefined): boolean {
  return transactionInfo?.offerDiscountType === 'FREE_TRIAL';
}

/**
 * Apple Server Notification から DB の status / entitlement_state / trial_used を導出する。
 */
export function mapAppleNotification(
  notificationType: string,
  subtype: string | undefined,
  expiresDateMs: number | undefined,
  isFreeTrial: boolean,
  nowMs: number = Date.now(),
): AppleSubscriptionStateMapping {
  const periodEndMs = expiresDateMs ?? 0;
  const periodStillActive = expiresDateMs !== undefined && periodEndMs > nowMs;

  switch (notificationType) {
    case 'SUBSCRIBED':
      if (subtype === 'INITIAL_BUY' && isFreeTrial) {
        return { status: 'trial', entitlementState: 'active', trialUsed: true };
      }
      return { status: 'active', entitlementState: 'active' };
    case 'DID_RENEW':
      return { status: 'active', entitlementState: 'active' };
    case 'DID_FAIL_TO_RENEW':
      return { status: 'billing_retry', entitlementState: 'payment_issue_no_access' };
    case 'GRACE_PERIOD_STARTED':
      return { status: 'grace', entitlementState: 'active' };
    case 'EXPIRED':
      return { status: 'expired', entitlementState: 'expired' };
    case 'DID_CHANGE_RENEWAL_STATUS':
      if (subtype === 'AUTO_RENEW_DISABLED') {
        if (expiresDateMs === undefined || periodStillActive) {
          return { status: 'canceled', entitlementState: 'cancelled_but_active_until_end' };
        }
        return { status: 'canceled', entitlementState: 'expired' };
      }
      if (subtype === 'AUTO_RENEW_ENABLED') {
        return { status: 'active', entitlementState: 'active' };
      }
      return { status: 'active', entitlementState: 'active' };
    case 'REVOKE':
    case 'REFUND':
      return { status: 'expired', entitlementState: 'expired' };
    case 'OFFER_REDEEMED':
      return { status: 'trial', entitlementState: 'active', trialUsed: true };
    default:
      return { status: 'active', entitlementState: 'active' };
  }
}

/** trial_used は履歴であり、true → false には戻さない（単調）。 */
export function nextAppleTrialUsed(
  existingTrialUsed: boolean,
  mappedTrialUsed: boolean | undefined,
): boolean {
  if (existingTrialUsed) {
    return true;
  }
  return mappedTrialUsed === true;
}

export function appleTrialBecameUsed(
  existingTrialUsed: boolean,
  nextTrialUsed: boolean,
): boolean {
  return nextTrialUsed && !existingTrialUsed;
}

export function rankForAppleSubscription(entitlementState: AppleEntitlementState): 'free' | 'standard' {
  if (
    entitlementState === 'active' ||
    entitlementState === 'payment_issue_with_access' ||
    entitlementState === 'cancelled_but_active_until_end'
  ) {
    return 'standard';
  }
  return 'free';
}
