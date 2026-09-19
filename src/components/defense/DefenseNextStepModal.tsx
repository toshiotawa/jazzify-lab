import React from 'react';
import { FaChevronRight, FaDumbbell, FaGamepad } from 'react-icons/fa';
import {
  defenseGuidanceBodyCopy,
  defenseGuidancePrimaryLabel,
  trainingGuidancePrimaryLabel,
  type DefenseTrainingGuidance,
} from '@/utils/defenseTrainingGuidance';

interface DefenseNextStepModalProps {
  guidance: Exclude<DefenseTrainingGuidance, { kind: 'none' }>;
  isEnglishCopy: boolean;
  todayStreakUpdated?: boolean;
  onContinue: () => void;
  onDismiss: () => void;
}

export const DefenseNextStepModal: React.FC<DefenseNextStepModalProps> = ({
  guidance,
  isEnglishCopy,
  todayStreakUpdated = false,
  onContinue,
  onDismiss,
}) => {
  const heading = guidance.kind === 'openTraining'
    ? (isEnglishCopy ? 'Nice work!' : 'お疲れさまでした！')
    : (isEnglishCopy ? 'Ready for the next step?' : '次に進みますか？');
  const bodyCopy = defenseGuidanceBodyCopy(guidance, isEnglishCopy, todayStreakUpdated);
  const primaryLabel = guidance.kind === 'openDefense'
    ? defenseGuidancePrimaryLabel(guidance, isEnglishCopy)
    : trainingGuidancePrimaryLabel(isEnglishCopy, todayStreakUpdated);
  const Icon = guidance.kind === 'openTraining' ? FaDumbbell : FaGamepad;

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
        className="relative mx-4 max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="defense-next-step-modal-title"
      >
        <div className="mb-4 text-center">
          <h3 id="defense-next-step-modal-title" className="text-xl font-bold text-white">
            {heading}
          </h3>
          {bodyCopy && guidance.kind === 'openTraining' ? (
            <p className="mt-2 text-sm text-gray-300">{bodyCopy}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-colors hover:from-green-500 hover:to-emerald-500"
          >
            <Icon className="text-sm" aria-hidden />
            {primaryLabel}
            <FaChevronRight className="text-sm" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-lg bg-slate-700/60 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-slate-600 hover:text-gray-200"
          >
            {isEnglishCopy ? 'Back to map' : 'マップに戻る'}
          </button>
        </div>
      </div>
    </div>
  );
};
