/**
 * billing-status の provider + entitlement_state から支払い注意バナー種別を決定する。
 */
export type PaymentIssueBannerVariant = 'lemon_with_access' | 'apple_no_access';

export function resolvePaymentIssueBanner(
  provider: string,
  entitlementState: string,
): PaymentIssueBannerVariant | null {
  if (provider === 'lemon' && entitlementState === 'payment_issue_with_access') {
    return 'lemon_with_access';
  }
  if (provider === 'apple' && entitlementState === 'payment_issue_no_access') {
    return 'apple_no_access';
  }
  return null;
}

export const PAYMENT_ISSUE_COPY = {
  ja: {
    lemon_with_access:
      'お支払いに問題があります。現在は利用できます。支払い情報を更新してください。',
    apple_no_access:
      'お支払いに問題があります。現在ご利用を停止しています。支払い情報を更新してください。',
  },
  en: {
    lemon_with_access:
      'There is an issue with your payment. You still have access. Please update your payment information.',
    apple_no_access:
      'There is an issue with your payment. Your access is currently paused. Please update your payment information.',
  },
} as const;
