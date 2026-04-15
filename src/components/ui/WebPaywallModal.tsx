import React from 'react';
import { createPortal } from 'react-dom';
import { FaGem, FaTimes, FaMusic, FaGamepad, FaBookOpen, FaCalendarDay, FaCrown, FaUsers } from 'react-icons/fa';

interface WebPaywallModalProps {
  open: boolean;
  onClose: () => void;
  isEnglishCopy: boolean;
}

const FEATURES_JA = [
  { icon: FaBookOpen, text: 'すべてのレッスンが無制限' },
  { icon: FaGamepad, text: 'サバイバル ステージモードでプレイ' },
  { icon: FaCalendarDay, text: 'デイリーチャレンジ 全難易度' },
  { icon: FaMusic, text: 'ファンタジー＆レジェンドモード' },
  { icon: FaUsers, text: 'コミュニティ機能（日記・ランキング）' },
  { icon: FaCrown, text: 'ミッション機能' },
];

const FEATURES_EN = [
  { icon: FaBookOpen, text: 'Unlimited access to all lessons' },
  { icon: FaGamepad, text: 'Play Survival Stage Mode' },
  { icon: FaCalendarDay, text: 'Daily Challenge — all difficulties' },
  { icon: FaMusic, text: 'Fantasy & Legend modes' },
  { icon: FaUsers, text: 'Community features (diary, rankings)' },
  { icon: FaCrown, text: 'Missions' },
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
            <FaGem className="text-2xl text-amber-400" />
          </div>
          <h3 className="text-xl font-bold">
            {isEnglishCopy ? 'Upgrade to Premium' : 'プレミアムにアップグレード'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {isEnglishCopy
              ? '7-day free trial • then ¥4,980/month'
              : '7日間無料トライアル・以降 ¥4,980/月'}
          </p>
        </div>

        <ul className="space-y-3 mb-6">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm">
              <f.icon className="text-amber-400 shrink-0" />
              <span className="text-gray-200">{f.text}</span>
            </li>
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
