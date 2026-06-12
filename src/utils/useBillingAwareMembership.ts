import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  clearBillingStatusCache,
  fetchBillingStatusPayload,
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
}

/**
 * profiles.rank の反映が遅い間も、billing-status に合わせてプラン表示・ゲートを揃える（Web／ネイティブの課金先と同じ考え方）。
 */
export function useBillingAwareMembership(locale: 'ja' | 'en'): BillingAwareMembership {
  const session = useAuthStore(s => s.session);
  const profile = useAuthStore(s => s.profile);
  const [billingPayload, setBillingPayload] = useState<BillingStatusPayload | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refetchBilling = useCallback(async (): Promise<void> => {
    clearBillingStatusCache();
    setRefreshNonce(n => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      const token = session?.access_token ?? null;
      if (!token) {
        if (!cancelled) setBillingPayload(null);
        return;
      }
      const p = await fetchBillingStatusPayload(token);
      if (!cancelled) setBillingPayload(p);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, refreshNonce]);

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
  };
}
