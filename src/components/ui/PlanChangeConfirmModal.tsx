import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import {
  formatBillingAmountLabel,
  planIntervalLabel,
  PREMIUM_PRICING_JPY,
} from '@/utils/premiumPricing';

export interface PlanChangeConfirmModalProps {
  open: boolean;
  target: 'monthly' | 'yearly';
  periodEndLabel: string | null;
  isEnglishCopy: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PlanChangeConfirmModal: React.FC<PlanChangeConfirmModalProps> = ({
  open,
  target,
  periodEndLabel,
  isEnglishCopy,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const targetPlanCode = target === 'yearly' ? 'core_yearly' : 'core_monthly';
  const currentPlanCode = target === 'yearly' ? 'core_monthly' : 'core_yearly';
  const targetInterval = planIntervalLabel(targetPlanCode, isEnglishCopy ? 'en' : 'ja');
  const currentInterval = planIntervalLabel(currentPlanCode, isEnglishCopy ? 'en' : 'ja');
  const nextBillingLabel = formatBillingAmountLabel(
    targetPlanCode,
    isEnglishCopy ? 'en' : 'ja',
  );
  const periodEnd = periodEndLabel ?? (isEnglishCopy ? 'your next renewal date' : '次回更新日');

  const title = isEnglishCopy
    ? `Switch to the ${targetInterval} plan?`
    : `${targetInterval}プランに変更しますか？`;

  const bodyLines = isEnglishCopy
    ? [
      `Your current ${currentInterval} plan stays active until ${periodEnd}.`,
      `You will switch to the ${targetInterval} plan on your next renewal date.`,
      nextBillingLabel ? `Next charge: ${nextBillingLabel}` : null,
      'No additional charge today.',
    ]
    : [
      `現在の${currentInterval}プランは${periodEnd}までそのまま利用できます。`,
      `次回更新日から${targetInterval}プランに切り替わります。`,
      nextBillingLabel ? `次回請求額：${nextBillingLabel}` : null,
      '本日の追加請求：なし',
    ];

  const cancelLabel = isEnglishCopy ? 'Cancel' : 'キャンセル';
  const confirmLabel = isEnglishCopy
    ? `Switch to ${targetInterval} plan`
    : `${targetInterval}プランに変更する`;
  const closeLabel = isEnglishCopy ? 'Close' : '閉じる';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-change-title"
        className="relative w-full max-w-md rounded-2xl border border-blue-700/35 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-2xl my-auto"
      >
        <button
          type="button"
          aria-label={closeLabel}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-slate-800/80 transition-colors"
          onClick={onClose}
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>

        <h2 id="plan-change-title" className="text-lg font-semibold text-gray-100 pr-8">
          {title}
        </h2>

        <div className="mt-4 space-y-2 text-sm text-gray-300">
          {bodyLines.filter((line): line is string => line !== null).map(line => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {isEnglishCopy
            ? `Amounts shown in JPY (¥${PREMIUM_PRICING_JPY.monthly.toLocaleString('en-US')} / month, ¥${PREMIUM_PRICING_JPY.yearly.toLocaleString('en-US')} / year). Receipts follow Lemon Squeezy.`
            : '表示金額は円建てです。決済・領収書は Lemon Squeezy 上の表示に従います。'}
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (isEnglishCopy ? 'Processing…' : '処理中…') : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PlanChangeConfirmModal;
