import React from 'react';
import { FaChevronRight } from 'react-icons/fa';
import {
  defenseBlockCompleteBodyCopy,
  defenseBlockCompleteSoftLandingLabel,
  defenseBlockCompleteTrialLabel,
} from '@/utils/defenseTrainingGuidance';

interface DefenseBlockCompleteModalProps {
  isEnglishCopy: boolean;
  onPremium: () => void;
  onSoftLanding: () => void;
  onDismiss: () => void;
}

export const DefenseBlockCompleteModal: React.FC<DefenseBlockCompleteModalProps> = ({
  isEnglishCopy,
  onPremium,
  onSoftLanding,
  onDismiss,
}) => {
  const label = isEnglishCopy ? 'FLOOR 1 COMPLETE' : '第1階層 クリア';
  const heading = isEnglishCopy
    ? 'You cleared the first floor!'
    : '第1階層をクリアしました！';
  const nextLabel = isEnglishCopy ? 'Next up' : '次のステップ';
  const nextTitle = isEnglishCopy ? 'Advanced Phrase Defense' : 'Advanced フレーズディフェンス';
  const nextBody = isEnglishCopy
    ? 'Unlock harder stages and keep building your defense skills.'
    : 'より難しいステージを解放して、ディフェンス力を伸ばしましょう。';
  const stayLabel = isEnglishCopy ? 'Back to map' : 'マップに戻る';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isEnglishCopy ? 'Close dialog' : 'ダイアログを閉じる'}
        onClick={onDismiss}
      />
      <div
        className="relative mx-4 max-w-md rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="defense-block-complete-title"
      >
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {label}
          </p>
          <h3 id="defense-block-complete-title" className="mt-3 text-xl font-bold text-white">
            {heading}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            {defenseBlockCompleteBodyCopy(isEnglishCopy)}
          </p>
        </div>

        <div className="mb-5 rounded-lg border border-slate-600/80 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            {nextLabel}
          </p>
          <p className="mt-2 text-base font-semibold text-white">{nextTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">{nextBody}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSoftLanding}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
          >
            {defenseBlockCompleteSoftLandingLabel(isEnglishCopy)}
            <FaChevronRight className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onPremium}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-500 bg-slate-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          >
            {defenseBlockCompleteTrialLabel(isEnglishCopy)}
            <FaChevronRight className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-gray-400 transition-colors hover:text-gray-300"
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
