import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchBillingStatusPayload,
  getBillingFetchGeneration,
  getBillingRefreshNonce,
  primeBillingStatusCache,
  refreshBillingStatusPayload,
  subscribeBillingRefresh,
  type BillingStatusPayload,
} from '@/utils/billingStatusClient';
import type { MembershipRank } from '@/utils/lessonAccess';
import {
  effectiveRankForAccess,
  getMembershipDisplayLabel,
  isPremiumForDisplay,
} from '@/utils/membershipDisplay';

export interface BillingAwareMembership {
  billingPayload: BillingStatusPayload | null;
  isPremiumMember: boolean;
  planLabel: string;
  effectiveRank: MembershipRank;
  refetchBilling: () => Promise<void>;
  primeBillingPayload: (payload: BillingStatusPayload) => void;
}

/**
 * profiles.rank の反映が遅い間も、billing-status に合わせてプラン表示・ゲートを揃える（Web／ネイティブの課金先と同じ考え方）。
 */
export function useBillingAwareMembership(locale: 'ja' | 'en'): BillingAwareMembership {
  const session = useAuthStore(s => s.session);
  const profile = useAuthStore(s => s.profile);
  const [billingPayload, setBillingPayload] = useState<BillingStatusPayload | null>(null);
  const billingRefreshNonce = useSyncExternalStore(
    subscribeBillingRefresh,
    getBillingRefreshNonce,
  );

  const refetchBilling = useCallback(async (): Promise<void> => {
    const token = session?.access_token ?? null;
    const payload = await refreshBillingStatusPayload(token);
    setBillingPayload(payload);
  }, [session?.access_token]);

  const primeBillingPayload = useCallback((payload: BillingStatusPayload): void => {
    primeBillingStatusCache(payload);
    setBillingPayload(payload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      const token = session?.access_token ?? null;
      if (!token) {
        if (!cancelled) setBillingPayload(null);
        return;
      }
      const p = await fetchBillingStatusPayload(token, {
        force: billingRefreshNonce > 0,
        generation: getBillingFetchGeneration(),
      });
      if (!cancelled) setBillingPayload(p);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, billingRefreshNonce]);

  const isPremiumMember = useMemo(
    () => isPremiumForDisplay(profile?.rank, billingPayload),
    [profile?.rank, billingPayload],
  );

  const planLabel = useMemo(
    () => getMembershipDisplayLabel(profile?.rank, billingPayload, locale),
    [profile?.rank, billingPayload, locale],
  );

  const effectiveRank = useMemo(
    () => effectiveRankForAccess(profile?.rank, billingPayload),
    [profile?.rank, billingPayload],
  );

  return {
    billingPayload,
    isPremiumMember,
    planLabel,
    effectiveRank,
    refetchBilling,
    primeBillingPayload,
  };
}
