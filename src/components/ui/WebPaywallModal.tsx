import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaMusic, FaArrowRight } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';

interface WebPaywallModalProps {
  open: boolean;
  onClose: () => void;
  isEnglishCopy: boolean;
}

const FEATURES_JA = [
  'メインクエスト全チャプター',
  '目的別コース',
  'サバイバル全ステージ',
  '学習記録',
];

const FEATURES_EN = [
  'All Main Quest chapters',
  'Topic courses',
  'Every Survival Stage tier',
  'Learning records',
];

const WebPaywallModal: React.FC<WebPaywallModalProps> = ({ open, onClose, isEnglishCopy }) => {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialUsed = profile?.lemon_trial_used === true;

  const handleCheckout = useCallback(async () => {
    if (!profile) {
      setError(isEnglishCopy ? 'You need to log in first.' : 'ログインが必要です');
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
          (errBody as { error?: string }).error
            ?? (isEnglishCopy ? 'Failed to open checkout' : 'チェックアウトの起動に失敗しました'),
        );
      }
    } catch {
      setError(isEnglishCopy ? 'An error occurred' : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [profile, isEnglishCopy]);

  if (!open) return null;

  const features = isEnglishCopy ? FEATURES_EN : FEATURES_JA;

  const headline = isEnglishCopy ? 'Play more. Keep going.' : 'もっと弾ける。もっと続く。';
  const subheadline = isEnglishCopy
    ? 'Unlock all lessons, game modes, and learning records with Jazzify Premium.'
    : 'Jazzify Premiumで、全レッスン・ゲームモード・学習記録を開放';

  const priceLine = isEnglishCopy
    ? 'Monthly ¥3,980 / Yearly ¥34,800 (tax included)'
    : '月額 ¥3,980 / 年額 ¥34,800（税込）';
  const yearlyPerMonth = isEnglishCopy
    ? 'Yearly plan: about ¥2,900 per month'
    : '年額は月あたり約 ¥2,900';

  const ctaLabel = trialUsed
    ? (isEnglishCopy ? 'Resume Premium' : 'プレミアムを再開する')
    : (isEnglishCopy
      ? 'Choose a plan and start your 7-day free trial'
      : 'プランを選んで7日間無料で始める');

  const footnote = trialUsed
    ? (isEnglishCopy
      ? 'Renews automatically unless you cancel.'
      : 'キャンセルしない限り自動更新されます')
    : (isEnglishCopy
      ? 'Cancel anytime. Choose monthly or yearly on the next screen.'
      : 'いつでも解約できます。月額・年額は次の画面で選べます。');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <button
        type="button"
        aria-label={isEnglishCopy ? 'Close' : '閉じる'}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-2xl my-auto"
      >
        <button
          type="button"
          aria-label={isEnglishCopy ? 'Close' : '閉じる'}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
          onClick={onClose}
        >
          <FaTimes className="w-4 h-4" />
        </button>

        <div className="text-center mb-5 pt-2">
          <h3 className="text-xl font-bold leading-snug">{headline}</h3>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{subheadline}</p>
        </div>

        <ul className="space-y-2 mb-5 text-sm text-gray-200 list-disc list-inside">
          {features.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-center">
          <p className="text-sm font-medium text-gray-200">{priceLine}</p>
          <p className="text-xs text-amber-200/90 mt-1">{yearlyPerMonth}</p>
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        <button
          type="button"
          className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all duration-200 shadow-lg hover:shadow-amber-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
          onClick={() => void handleCheckout()}
          disabled={loading}
        >
          <FaMusic className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {loading ? (isEnglishCopy ? 'Processing...' : '処理中...') : ctaLabel}
          </span>
          {!loading && <FaArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </button>

        <p className="text-[11px] text-gray-500 text-center mt-3 leading-relaxed">{footnote}</p>

        <button
          type="button"
          className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          onClick={onClose}
          disabled={loading}
        >
          {isEnglishCopy ? 'Not now' : '今はしない'}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default WebPaywallModal;
