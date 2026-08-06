import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaTimes,
  FaMusic,
  FaArrowRight,
  FaCheck,
  FaCalendarAlt,
  FaCrown,
} from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import {
  PREMIUM_PRICING_JPY,
  PREMIUM_PRICING_USD,
  formatUsdAmount,
} from '@/utils/premiumPricing';
import { resolveDisplayBillingCurrency } from '@/utils/billingCurrency';
import { trackEvent } from '@/utils/analytics/ga';
import { recordUserMilestoneFireAndForget } from '@/utils/analytics/milestones';
import type { PaywallSource } from '@/utils/analytics/paywallSource';
import { resolveWebPaywallCopy } from '@/utils/webPaywallCopy';

interface WebPaywallModalProps {
  open: boolean;
  onClose: () => void;
  isEnglishCopy: boolean;
  source: PaywallSource;
}

const PRICE_COPY = {
  ja: {
    priceMonthly: '月額 ¥3,980',
    priceYearly: '年額 ¥34,800（月あたり ¥2,900）',
    priceSavingsAmount: '年額なら年間 ¥12,960 お得',
    priceSavingsMonths: '約3ヶ月分お得',
    footnote: '次の画面で月額・年額を選択できます。いつでも解約できます。',
    trialBadge: '7日間無料',
    dismiss: 'あとで',
    loginRequired: 'ログインが必要です',
    checkoutFailed: 'チェックアウトの起動に失敗しました',
    error: 'エラーが発生しました',
    processing: '処理中...',
    redirecting: 'チェックアウトへ移動中...',
    close: '閉じる',
  },
  enJpy: {
    priceMonthly: 'Monthly ¥3,980',
    priceYearly: 'Yearly ¥34,800',
    priceYearlyPerMonth: '¥2,900 per month',
    priceSavingsAmount: 'Save ¥12,960 a year vs monthly',
    priceSavingsMonths: 'About 3 months free vs monthly',
    footnote: 'Choose monthly or yearly on the next screen. Cancel anytime.',
    trialBadge: '7-day free trial',
    dismiss: 'Later',
    loginRequired: 'You need to log in first.',
    checkoutFailed: 'Failed to open checkout',
    error: 'An error occurred',
    processing: 'Processing...',
    redirecting: 'Redirecting to checkout...',
    close: 'Close',
  },
  enUsd: {
    priceMonthly: `Monthly ${formatUsdAmount(PREMIUM_PRICING_USD.monthly)}`,
    priceYearly: `Yearly ${formatUsdAmount(PREMIUM_PRICING_USD.yearly)}`,
    priceYearlyPerMonth: `${formatUsdAmount(PREMIUM_PRICING_USD.yearlyPerMonth)} per month`,
    priceSavingsAmount: `Save ${formatUsdAmount(PREMIUM_PRICING_USD.yearlySavings)} a year vs monthly`,
    priceSavingsMonths: 'About 3 months free vs monthly',
    footnote: 'Choose monthly or yearly on the next screen. Cancel anytime.',
    trialBadge: '7-day free trial',
    dismiss: 'Later',
    loginRequired: 'You need to log in first.',
    checkoutFailed: 'Failed to open checkout',
    error: 'An error occurred',
    processing: 'Processing...',
    redirecting: 'Redirecting to checkout...',
    close: 'Close',
  },
} as const;

interface SavingsBadgeProps {
  label: string;
  tone?: 'amber' | 'green';
}

const SavingsBadge: React.FC<SavingsBadgeProps> = ({ label, tone = 'amber' }) => (
  <span
    className={
      tone === 'green'
        ? 'inline-flex rounded-full border border-emerald-500/45 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200'
        : 'inline-flex rounded-full border border-amber-500/45 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200'
    }
  >
    {label}
  </span>
);

interface PriceRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}

const PriceRow: React.FC<PriceRowProps> = ({ icon, label, sublabel }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
    <div>
      <p className="text-sm font-medium text-gray-100">{label}</p>
      {sublabel !== undefined && (
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  </div>
);

const WebPaywallModal: React.FC<WebPaywallModalProps> = ({ open, onClose, isEnglishCopy, source }) => {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billingCurrency = resolveDisplayBillingCurrency({
    profileBillingCurrency: profile?.billing_currency ?? null,
    isEnglishCopy,
  });
  const trialUsed = profile?.lemon_trial_used === true;
  const copy = resolveWebPaywallCopy(source, isEnglishCopy, trialUsed, billingCurrency);
  const priceCopy = !isEnglishCopy
    ? PRICE_COPY.ja
    : billingCurrency === 'USD'
      ? PRICE_COPY.enUsd
      : PRICE_COPY.enJpy;
  const checkoutBusy = loading || redirecting;

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setRedirecting(false);
      setError(null);
      return;
    }
    if (!profile) {
      return;
    }
    trackEvent('paywall_view', { source });
    recordUserMilestoneFireAndForget(profile.id, 'free_tier_wall_view', source);
  }, [open, profile, source]);

  const handleDismiss = useCallback(() => {
    if (redirecting) {
      return;
    }
    trackEvent('paywall_dismiss', { source });
    onClose();
  }, [onClose, redirecting, source]);

  const handleCheckout = useCallback(async () => {
    if (!profile || redirecting) {
      if (!profile) {
        setError(priceCopy.loginRequired);
      }
      return;
    }

    const checkoutValue = billingCurrency === 'USD'
      ? PREMIUM_PRICING_USD.monthly
      : PREMIUM_PRICING_JPY.monthly;

    trackEvent('begin_checkout', {
      currency: billingCurrency,
      value: checkoutValue,
      plan: 'premium',
    });
    recordUserMilestoneFireAndForget(profile.id, 'checkout_click');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/lemonsqueezyResolveLink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().session?.access_token || ''}`,
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        setRedirecting(true);
        window.location.href = url;
        return;
      }
      const errBody = await response.json().catch(() => ({}));
      setError(
        (errBody as { error?: string }).error ?? priceCopy.checkoutFailed,
      );
    } catch {
      setError(priceCopy.error);
    } finally {
      setLoading(false);
    }
  }, [profile, redirecting, priceCopy.loginRequired, priceCopy.checkoutFailed, priceCopy.error, billingCurrency]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <button
        type="button"
        aria-label={priceCopy.close}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-amber-500/35 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-2xl shadow-amber-950/25 my-auto"
      >
        <button
          type="button"
          aria-label={priceCopy.close}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-slate-800/80 transition-colors"
          onClick={handleDismiss}
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>

        <div className="flex justify-center mb-4 pt-1">
          <div className="relative">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/35">
              <FaMusic className="text-amber-400 text-lg" aria-hidden="true" />
            </div>
            <span
              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300/90"
              aria-hidden="true"
            />
            <span
              className="absolute top-0.5 -left-1 w-1 h-1 rounded-full bg-amber-200/70"
              aria-hidden="true"
            />
            <span
              className="absolute -bottom-0.5 right-0 w-1 h-1 rounded-full bg-orange-300/60"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="text-center mb-5">
          <h3 className="text-xl font-bold leading-snug">{copy.headline}</h3>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{copy.subheadline}</p>
        </div>

        <ul className="space-y-3 mb-5">
          {copy.features.map((line) => (
            <li key={line} className="flex items-start gap-3 text-sm text-gray-200">
              <span className="mt-0.5 flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/40">
                <FaCheck className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
              </span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>

        <div className="mb-5 rounded-xl border border-slate-600/80 bg-slate-800/40 px-4 py-3.5 space-y-3">
          {isEnglishCopy ? (
            <>
              <PriceRow
                icon={<FaCalendarAlt className="w-4 h-4" aria-hidden="true" />}
                label={priceCopy.priceMonthly}
              />
              <PriceRow
                icon={<FaCrown className="w-4 h-4 text-amber-400/90" aria-hidden="true" />}
                label={priceCopy.priceYearly}
              />
              {'priceYearlyPerMonth' in priceCopy && (
                <p className="pl-7 text-xs text-gray-400">
                  {priceCopy.priceYearlyPerMonth}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pl-7">
                {!trialUsed && <SavingsBadge label={priceCopy.trialBadge} tone="green" />}
                <SavingsBadge label={priceCopy.priceSavingsAmount} />
                <SavingsBadge label={priceCopy.priceSavingsMonths} />
              </div>
            </>
          ) : (
            <>
              <PriceRow
                icon={<FaCalendarAlt className="w-4 h-4" aria-hidden="true" />}
                label={PRICE_COPY.ja.priceMonthly}
              />
              <PriceRow
                icon={<FaCrown className="w-4 h-4 text-amber-400/90" aria-hidden="true" />}
                label={PRICE_COPY.ja.priceYearly}
              />
              <div className="flex flex-wrap gap-2 pl-7">
                {!trialUsed && <SavingsBadge label={PRICE_COPY.ja.trialBadge} tone="green" />}
                <SavingsBadge label={PRICE_COPY.ja.priceSavingsAmount} />
                <SavingsBadge label={PRICE_COPY.ja.priceSavingsMonths} />
              </div>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        {copy.trialUsedNotice ? (
          <p className="text-xs text-amber-200/90 text-center mb-3 leading-relaxed">
            {copy.trialUsedNotice}
          </p>
        ) : null}

        <button
          type="button"
          className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all duration-200 shadow-lg shadow-amber-900/30 hover:shadow-amber-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
          onClick={() => void handleCheckout()}
          disabled={checkoutBusy}
        >
          <FaMusic className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-center">
            {redirecting
              ? priceCopy.redirecting
              : loading
                ? priceCopy.processing
                : copy.ctaLabel}
          </span>
          {!checkoutBusy && <FaArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </button>

        <p className="text-[11px] text-gray-500 text-center mt-3 leading-relaxed">
          {copy.ctaFootnote ?? priceCopy.footnote}
        </p>

        <div className="text-center mt-3">
          <button
            type="button"
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors disabled:opacity-50"
            onClick={handleDismiss}
            disabled={checkoutBusy}
          >
            {priceCopy.dismiss}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default WebPaywallModal;
