import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { useJpyUsdRate } from '@/hooks/useJpyUsdRate';
import { useAuthStore } from '@/stores/authStore';
import { jpyAmountToApproxUsdWhole } from '@/utils/jpyToUsdApprox';

interface WebPaywallModalProps {
  open: boolean;
  onClose: () => void;
  isEnglishCopy: boolean;
}

const PRICING_JPY = {
  monthly: 3980,
  yearly: 34800,
  yearlyPerMonth: 2900,
  yearlySavings: 12960,
} as const;

const formatUsdReferenceLine = (jpyAmount: number, usdRate: number): string =>
  `≈ $${jpyAmountToApproxUsdWhole(jpyAmount, usdRate)} USD`;

const formatUsdReferenceSuffix = (jpyAmount: number, usdRate: number): string =>
  `(≈ $${jpyAmountToApproxUsdWhole(jpyAmount, usdRate)} USD)`;

const COPY = {
  ja: {
    headline: 'ジャズの練習を、ここから先へ。',
    subheadline: 'Jazzify Premiumで、全コース・全ステージ・学習記録を開放。',
    features: [
      '初心者向けメインクエストを最後まで進められる',
      'アドリブ・両手ヴォイシングなど目的別に練習できる',
      'サバイバル全ステージで反復練習できる',
      '学習記録で成長を確認できる',
    ],
    priceMonthly: '月額 ¥3,980',
    priceYearly: '年額 ¥34,800（月あたり ¥2,900）',
    priceSavingsAmount: '年額なら年間 ¥12,960 お得',
    priceSavingsMonths: '約3ヶ月分お得',
    ctaTrial: '7日間無料で始める',
    ctaSubscribe: 'プレミアムに加入する',
    footnote: '次の画面で月額・年額を選択できます。いつでも解約できます。',
    dismiss: 'あとで',
    loginRequired: 'ログインが必要です',
    checkoutFailed: 'チェックアウトの起動に失敗しました',
    error: 'エラーが発生しました',
    processing: '処理中...',
    close: '閉じる',
  },
  en: {
    headline: 'Take your jazz practice further.',
    subheadline: 'Unlock all courses, stages, and learning records with Jazzify Premium.',
    features: [
      'Finish the beginner Main Quest from start to end',
      'Practice by goal—improv, two-hand voicings, and more',
      'Drill every Survival stage tier',
      'Track your progress with learning records',
    ],
    priceMonthly: 'Monthly ¥3,980',
    priceYearly: 'Yearly ¥34,800',
    priceYearlyPerMonth: '¥2,900 per month',
    priceSavingsAmount: 'Save ¥12,960 a year vs monthly',
    priceSavingsMonths: 'About 3 months free vs monthly',
    ctaTrial: 'Start 7-day free trial',
    ctaSubscribe: 'Subscribe to Premium',
    footnote: 'Choose monthly or yearly on the next screen. Cancel anytime.',
    dismiss: 'Later',
    loginRequired: 'You need to log in first.',
    checkoutFailed: 'Failed to open checkout',
    error: 'An error occurred',
    processing: 'Processing...',
    close: 'Close',
  },
} as const;

const WebPaywallModal: React.FC<WebPaywallModalProps> = ({ open, onClose, isEnglishCopy }) => {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialUsed = profile?.lemon_trial_used === true;
  const copy = isEnglishCopy ? COPY.en : COPY.ja;
  const usdRate = useJpyUsdRate(isEnglishCopy, open);

  const handleCheckout = useCallback(async () => {
    if (!profile) {
      setError(copy.loginRequired);
      return;
    }

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
        window.location.href = url;
      } else {
        const errBody = await response.json().catch(() => ({}));
        setError(
          (errBody as { error?: string }).error ?? copy.checkoutFailed,
        );
      }
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  }, [profile, copy.loginRequired, copy.checkoutFailed, copy.error]);

  if (!open) return null;

  const ctaLabel = trialUsed ? copy.ctaSubscribe : copy.ctaTrial;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <button
        type="button"
        aria-label={copy.close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 text-white shadow-2xl my-auto"
      >
        <button
          type="button"
          aria-label={copy.close}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
          onClick={onClose}
        >
          <FaTimes className="w-4 h-4" />
        </button>

        <div className="mb-5 pt-2">
          <h3 className="text-xl font-bold leading-snug">{copy.headline}</h3>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{copy.subheadline}</p>
        </div>

        <ul className="space-y-2 mb-5 text-sm text-gray-200 list-disc list-inside">
          {copy.features.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 space-y-2">
          {isEnglishCopy && usdRate !== null ? (
            <>
              <div>
                <p className="text-sm font-medium text-gray-200">{COPY.en.priceMonthly}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatUsdReferenceLine(PRICING_JPY.monthly, usdRate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">{COPY.en.priceYearly}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatUsdReferenceLine(PRICING_JPY.yearly, usdRate)}
                </p>
              </div>
              <p className="text-sm text-amber-200/90">
                {COPY.en.priceYearlyPerMonth}
                <span className="font-normal text-amber-200/80">
                  {` ${formatUsdReferenceSuffix(PRICING_JPY.yearlyPerMonth, usdRate)}`}
                </span>
              </p>
              <p className="text-sm text-amber-200/90">
                {COPY.en.priceSavingsAmount}
                <span className="font-normal text-amber-200/80">
                  {` ${formatUsdReferenceSuffix(PRICING_JPY.yearlySavings, usdRate)}`}
                </span>
              </p>
              <p className="text-sm text-amber-200/90">{COPY.en.priceSavingsMonths}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-200">{COPY.ja.priceMonthly}</p>
              <p className="text-sm font-medium text-gray-200">{COPY.ja.priceYearly}</p>
              <p className="text-sm text-amber-200/90">{COPY.ja.priceSavingsAmount}</p>
              <p className="text-sm text-amber-200/90">{COPY.ja.priceSavingsMonths}</p>
            </>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        <button
          type="button"
          className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all duration-200 shadow-lg hover:shadow-amber-500/30 disabled:opacity-60"
          onClick={() => void handleCheckout()}
          disabled={loading}
        >
          {loading ? copy.processing : ctaLabel}
        </button>

        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">{copy.footnote}</p>

        <button
          type="button"
          className="mt-3 text-xs text-gray-500 underline hover:text-gray-400 transition-colors"
          onClick={onClose}
          disabled={loading}
        >
          {copy.dismiss}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default WebPaywallModal;
