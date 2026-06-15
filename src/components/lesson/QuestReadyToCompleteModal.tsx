import React from 'react';
import { questReadyToCompletePromptCopy } from '@/utils/lessonCompletionCopy';

export interface QuestReadyToCompleteModalProps {
  isEnglishCopy: boolean;
  onComplete: () => void;
  onLater: () => void;
}

export const QuestReadyToCompleteModal: React.FC<QuestReadyToCompleteModalProps> = ({
  isEnglishCopy,
  onComplete,
  onLater,
}) => {
  const copy = questReadyToCompletePromptCopy(isEnglishCopy);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isEnglishCopy ? 'Close dialog' : 'ダイアログを閉じる'}
        onClick={onLater}
      />
      <div
        className="relative mx-4 max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-ready-to-complete-modal-title"
      >
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🎉
          </div>
          <h3 id="quest-ready-to-complete-modal-title" className="text-xl font-bold text-white">
            {copy.heading}
          </h3>
          <p className="mt-2 text-sm text-gray-300">{copy.body}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onComplete}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-4 text-base font-bold text-white shadow-lg ring-2 ring-emerald-400/50 transition-colors hover:from-emerald-500 hover:to-green-500"
          >
            {copy.complete}
          </button>
          <button
            type="button"
            onClick={onLater}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-600 hover:text-white"
          >
            {copy.later}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestReadyToCompleteModal;
