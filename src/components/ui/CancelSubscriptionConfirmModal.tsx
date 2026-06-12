import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

export interface CancelSubscriptionConfirmModalProps {
  open: boolean;
  periodEndLabel: string | null;
  pendingPlanCode: string | null;
  isEnglishCopy: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelSubscriptionConfirmModal: React.FC<CancelSubscriptionConfirmModalProps> = ({
  open,
  periodEndLabel,
  pendingPlanCode,
  isEnglishCopy,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const title = isEnglishCopy
    ? 'Cancel your subscription?'
    : 'サブスクリプションを解約しますか？';

  const bodyLines = isEnglishCopy
    ? [
      'Your cancellation will be scheduled. You can keep using premium features until the end of the current billing period.',
      periodEndLabel ? `Access until: ${periodEndLabel}` : null,
      pendingPlanCode ? 'Your scheduled plan change will also be cancelled.' : null,
    ]
    : [
      '解約を予約しても、現在の請求期間の終了日まではプレミアム機能を利用できます。期間終了後は自動更新されません。',
      periodEndLabel ? `利用期限: ${periodEndLabel}` : null,
      pendingPlanCode ? '予約中のプラン変更も取り消されます。' : null,
    ];

  const cancelLabel = isEnglishCopy ? 'Keep subscription' : '解約しない';
  const confirmLabel = isEnglishCopy ? 'Cancel subscription' : '解約する';
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
        aria-labelledby="cancel-subscription-title"
        className="relative w-full max-w-md rounded-2xl border border-red-700/35 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-2xl my-auto"
      >
        <button
          type="button"
          aria-label={closeLabel}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-slate-800/80 transition-colors"
          onClick={onClose}
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>

        <h2 id="cancel-subscription-title" className="text-lg font-semibold text-gray-100 pr-8">
          {title}
        </h2>

        <div className="mt-4 space-y-2 text-sm text-gray-300">
          {bodyLines.filter((line): line is string => line !== null).map(line => (
            <p key={line}>{line}</p>
          ))}
        </div>

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
            className="btn btn-sm btn-outline text-red-300 border-red-700/50 hover:bg-red-900/30"
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

export default CancelSubscriptionConfirmModal;
