import React from 'react';

interface DefenseEndlessContinueModalProps {
  readonly isEnglishCopy: boolean;
  readonly starRankLabel: string;
  readonly onContinueEndless: () => void;
  readonly onFinish: () => void;
}

export const DefenseEndlessContinueModal: React.FC<DefenseEndlessContinueModalProps> = ({
  isEnglishCopy,
  starRankLabel,
  onContinueEndless,
  onFinish,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-md rounded-2xl border border-amber-400/40 bg-slate-900 p-6 text-center shadow-xl">
      <p className="text-lg font-bold text-amber-200">
        {isEnglishCopy ? 'Stage clear!' : 'ステージクリア！'}
      </p>
      <p className="mt-2 text-2xl tracking-widest text-white">{starRankLabel}</p>
      <p className="mt-4 text-sm text-slate-200">
        {isEnglishCopy
          ? 'Keep going? (Endless mode)'
          : 'まだ続けますか？（エンドレスモード突入）'}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900"
          onClick={onContinueEndless}
        >
          {isEnglishCopy ? 'Yes' : 'はい'}
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-500 px-5 py-3 text-sm font-semibold text-slate-100"
          onClick={onFinish}
        >
          {isEnglishCopy ? 'No' : 'いいえ'}
        </button>
      </div>
    </div>
  </div>
);