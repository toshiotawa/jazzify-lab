import React, { useCallback, useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';

import { shouldUseEnglishCopy } from '@/utils/globalAudience';

import { useGeoStore } from '@/stores/geoStore';

import { PAYMENT_ISSUE_COPY, type PaymentIssueBannerVariant } from '@/utils/paymentIssueBanner';

import {
  bannerVariantFromPayload,
  fetchBillingStatusPayload,
  type BillingStatusPayload,
} from '@/utils/billingStatusClient';

import { fetchLemonBillingLink } from '@/utils/lemonBillingClient';

import { fetchStripeBillingLink } from '@/utils/stripeBillingClient';

/**

 * Lemon / Apple の支払い問題時にプロバイダ別メッセージを表示するバナー。

 */

const PaymentIssueBanner: React.FC = () => {
  const session = useAuthStore((s) => s.session);

  const profile = useAuthStore((s) => s.profile);

  const geoCountry = useGeoStore((s) => s.country);

  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,

    country: profile?.country ?? geoCountry,

    preferredLocale: profile?.preferred_locale ?? null,
  });

  const locale: 'ja' | 'en' = isEnglishCopy ? 'en' : 'ja';

  const [variant, setVariant] = useState<PaymentIssueBannerVariant | null>(null);

  const [canManagePayment, setCanManagePayment] = useState(false);

  const [billingProvider, setBillingProvider] = useState<string | null>(null);

  const [openingPayment, setOpeningPayment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      const token = session?.access_token ?? null;

      if (!token) {
        if (!cancelled) {
          setVariant(null);

          setCanManagePayment(false);

          setBillingProvider(null);
        }

        return;
      }

      const payload: BillingStatusPayload | null = await fetchBillingStatusPayload(token);

      if (cancelled) return;

      setVariant(bannerVariantFromPayload(payload));

      setCanManagePayment(payload?.can_manage_payment === true);

      setBillingProvider(payload?.provider ?? null);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const handleUpdatePayment = useCallback(async () => {
    setOpeningPayment(true);

    try {
      const url =
        billingProvider === 'stripe'
          ? await fetchStripeBillingLink('payment_method')
          : await fetchLemonBillingLink('payment_method');

      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setOpeningPayment(false);
    }
  }, [billingProvider]);

  if (!variant) {
    return null;
  }

  const copy = PAYMENT_ISSUE_COPY[locale][variant];

  const isWithAccess = variant === 'lemon_with_access' || variant === 'stripe_with_access';

  const canOpenHostedPaymentUpdate = billingProvider === 'lemon' || billingProvider === 'stripe';

  const borderClass = isWithAccess
    ? 'border-amber-500/50 bg-amber-950/40'
    : 'border-red-500/50 bg-red-950/35';

  return (
    <div
      role="status"

      className={`w-full flex-shrink-0 px-3 py-2 border-b text-sm ${borderClass} text-amber-50`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="leading-snug">{copy}</p>

        {canOpenHostedPaymentUpdate && canManagePayment && (
          <button
            type="button"

            className="btn btn-xs btn-outline shrink-0 self-start sm:self-auto"

            disabled={openingPayment}

            onClick={() => void handleUpdatePayment()}
          >
            {openingPayment
              ? isEnglishCopy
                ? 'Opening…'
                : '開いています…'
              : isEnglishCopy
                ? 'Update payment method'
                : '支払い方法を更新'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentIssueBanner;
