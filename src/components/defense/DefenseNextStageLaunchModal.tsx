import React from 'react';

interface DefenseNextStageLaunchModalProps {
  readonly stageTitle: string;
  readonly isEnglishCopy: boolean;
  readonly onStartPerformance: () => void;
  readonly onStartPractice: () => void;
  readonly onClose: () => void;
}

export const DefenseNextStageLaunchModal: React.FC<DefenseNextStageLaunchModalProps> = ({
  stageTitle,
  isEnglishCopy,
  onStartPerformance,
  onStartPractice,
  onClose,
}) => (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
    role="presentation"
  >
    <div
      className="relative mx-4 w-full max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="defense-next-stage-launch-title"
    >
      <h3 id="defense-next-stage-launch-title" className="text-center text-xl font-bold text-white">
        {stageTitle}
      </h3>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500"
          onClick={onStartPerformance}
        >
          {isEnglishCopy ? 'Performance' : '本番'}
        </button>
        <button
          type="button"
          className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600"
          onClick={onStartPractice}
        >
          {isEnglishCopy ? 'Practice' : '練習'}
        </button>
        <button
          type="button"
          className="w-full rounded-lg bg-slate-700/60 px-4 py-2 text-sm text-gray-400 hover:bg-slate-600 hover:text-gray-200"
          onClick={onClose}
        >
          {isEnglishCopy ? 'Close' : '閉じる'}
        </button>
      </div>
    </div>
  </div>
);
