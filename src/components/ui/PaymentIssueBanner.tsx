import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import {
  PAYMENT_ISSUE_COPY,
  type PaymentIssueBannerVariant,
} from '@/utils/paymentIssueBanner';
import {
  bannerVariantFromPayload,
  fetchBillingStatusPayload,
  type BillingStatusPayload,
} from '@/utils/billingStatusClient';

/**
 * Lemon / Apple の支払い問題時にプロバイダ別メッセージを表示するバナー。
 */
const PaymentIssueBanner: React.FC = () => {
  const session = useAuthStore(s => s.session);
  const profile = useAuthStore(s => s.profile);
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });
  const locale: 'ja' | 'en' = isEnglishCopy ? 'en' : 'ja';

  const [variant, setVariant] = useState<PaymentIssueBannerVariant | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      const token = session?.access_token ?? null;
      if (!token) {
        if (!cancelled) setVariant(null);
        return;
      }
      const payload: BillingStatusPayload | null = await fetchBillingStatusPayload(token);
      if (cancelled) return;
      setVariant(bannerVariantFromPayload(payload));
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  if (!variant) {
    return null;
  }

  const copy = PAYMENT_ISSUE_COPY[locale][variant];
  const isLemon = variant === 'lemon_with_access';
  const borderClass = isLemon ? 'border-amber-500/50 bg-amber-950/40' : 'border-red-500/50 bg-red-950/35';

  return (
    <div
      role="status"
      className={`w-full flex-shrink-0 px-3 py-2 border-b text-sm ${borderClass} text-amber-50`}
    >
      <p className="leading-snug">{copy}</p>
    </div>
  );
};

export default PaymentIssueBanner;
