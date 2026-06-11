import type { BillingStatusPayload } from '@/utils/billingStatusClient';
import type { MembershipRank } from '@/utils/lessonAccess';
import {
  getMembershipLabel,
  isPremiumTier,
  type MembershipTier,
} from '@/utils/membership';

const PREMIUM_ENTITLEMENT_STATES = new Set<string>([
  'active',
  'payment_issue_with_access',
  'cancelled_but_active_until_end',
]);

/**
 * billing-status の entitlement が「利用側としてプレミアム相当」とみなせるか（サーバ／ネイティブの判定に揃える）
 */
export function isBillingEntitlementPremium(payload: BillingStatusPayload): boolean {
  return PREMIUM_ENTITLEMENT_STATES.has(payload.entitlement_state);
}

/**
 * 課金プロバイダ行が残っていても、利用権が expired なら Web 側のプロバイダ案内は出さない。
 */
export function hasNonExpiredBillingProvider(
  payload: BillingStatusPayload | null,
  provider: 'apple' | 'lemon',
): boolean {
  return (
    payload !== null &&
    payload.provider === provider &&
    payload.entitlement_state !== 'expired'
  );
}

/**
 * UI・クライアントゲート用: 課金APIが取れたときはそれを優先し、未取得時は profiles.rank にフォールバックする。
 */
export function isPremiumForDisplay(
  rank: string | null | undefined,
  billingPayload: BillingStatusPayload | null,
): boolean {
  if (billingPayload !== null) {
    return isBillingEntitlementPremium(billingPayload);
  }
  return isPremiumTier(rank);
}

export function getDisplayMembershipTier(
  rank: string | null | undefined,
  billingPayload: BillingStatusPayload | null,
): MembershipTier {
  return isPremiumForDisplay(rank, billingPayload) ? 'premium' : 'free';
}

export function getMembershipDisplayLabel(
  rank: string | null | undefined,
  billingPayload: BillingStatusPayload | null,
  locale: 'ja' | 'en',
): string {
  const tier = getDisplayMembershipTier(rank, billingPayload);
  return getMembershipLabel(tier === 'premium' ? 'premium' : 'free', locale);
}

/**
 * コース／レッスンの rank ガード用: 課金のみ先に有効で profiles.rank がまだ free のとき premium として扱う。
 */
export function effectiveRankForAccess(
  rank: string | null | undefined,
  billingPayload: BillingStatusPayload | null,
): MembershipRank {
  const r = (rank ?? 'free') as MembershipRank;
  if (billingPayload !== null && isBillingEntitlementPremium(billingPayload) && r === 'free') {
    return 'premium';
  }
  return r;
}
