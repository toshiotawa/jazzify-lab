import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

interface WebPaywallModalProps {
  open: boolean;
  onClose: () => void;
  isEnglishCopy: boolean;
}

const FEATURES_JA = [
  'すべてのレッスンが無制限',
  'サバイバル ステージモードでプレイ',
  'デイリーチャレンジ 全難易度',
];

const FEATURES_EN = [
  'Unlimited access to all lessons',
  'Play Survival Stage Mode',
  'Daily Challenge — all difficulties',
];

const WebPaywallModal: React.FC<WebPaywallModalProps> = ({ open, onClose, isEnglishCopy }) => {
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
            {isEnglishCopy
              ? '7-day free trial, then ¥4,980/month'
              : '7日間無料トライアル、以降 ¥4,980/月'}
          </p>
        </div>

        <ul className="space-y-2 mb-6 text-sm text-gray-200 list-disc list-inside">
          {features.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <button
          type="button"
          className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all duration-200 shadow-lg hover:shadow-amber-500/30"
          onClick={() => {
            onClose();
            window.location.hash = '#pricing';
          }}
        >
          {isEnglishCopy ? 'View Plans' : 'プランを見る'}
        </button>

        <button
          type="button"
          className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          onClick={onClose}
        >
          {isEnglishCopy ? 'Not now' : '今はしない'}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default WebPaywallModal;
