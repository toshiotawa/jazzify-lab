import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';

interface WebPaywallModalProps {
  open: boolean;
  onClose: () => void;
  isEnglishCopy: boolean;
}

const FEATURES_JA = [
  'メインクエスト全チャプター・目的別コースなどプレミアム対象クエストが無制限',
  'すべてのレッスン・実習が無制限',
  'サバイバル ステージですべての階層をプレイ',
];

const FEATURES_EN = [
  'All Main Quest chapters and Premium topic courses',
  'Unlimited lessons and practice tasks',
  'Every Survival Stage tier',
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label={isEnglishCopy ? 'Close' : '閉じる'}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-2xl"
      >
        <button
          type="button"
          aria-label={isEnglishCopy ? 'Close' : '閉じる'}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
          onClick={onClose}
        >
          <FaTimes className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <h3 className="text-xl font-bold">
            {isEnglishCopy ? 'Upgrade to Premium' : 'プレミアムにアップグレード'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {trialUsed
              ? (isEnglishCopy ? '¥4,980/month (tax included)' : '¥4,980/月（税込）')
              : (isEnglishCopy ? '7-day free trial, then ¥4,980/month' : '7日間無料トライアル、以降 ¥4,980/月')}
          </p>
        </div>

        <ul className="space-y-2 mb-6 text-sm text-gray-200 list-disc list-inside">
          {features.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        <button
          type="button"
          className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all duration-200 shadow-lg hover:shadow-amber-500/30 disabled:opacity-60"
          onClick={() => void handleCheckout()}
          disabled={loading}
        >
          {loading
            ? (isEnglishCopy ? 'Processing...' : '処理中...')
            : trialUsed
              ? (isEnglishCopy ? 'Subscribe Now' : '今すぐ購読する')
              : (isEnglishCopy ? 'Start 7-Day Free Trial' : '7日間無料で始める')}
        </button>

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
