/**
 * サバイバル開始前: 練習（HINT）/ 本番の確認モーダル
 */

import React, { useEffect, useState } from 'react';
import type { StageDefinition } from './SurvivalStageDefinitions';
import {
  formatSurvivalEncounterLabel,
  formatSurvivalStageModeLabel,
  STAGE_KILL_QUOTA,
  STAGE_TIME_LIMIT_SECONDS,
} from './SurvivalStageDefinitions';

export type SurvivalRunPrepVariant = 'lesson' | 'map';

interface SurvivalRunPrepModalProps {
  isOpen: boolean;
  variant: SurvivalRunPrepVariant;
  stage: StageDefinition | null;
  isEnglishCopy: boolean;
  /** モーダルを開いたときの初期 HINT（練習）状態 */
  initialHintMode: boolean;
  onCancel: () => void;
  /** true = HINT（練習） */
  onConfirm: (hintMode: boolean) => void;
}

const SurvivalRunPrepModal: React.FC<SurvivalRunPrepModalProps> = ({
  isOpen,
  variant,
  stage,
  isEnglishCopy,
  initialHintMode,
  onCancel,
  onConfirm,
}) => {
  const [hintLocal, setHintLocal] = useState(initialHintMode);

  useEffect(() => {
    if (isOpen) {
      setHintLocal(initialHintMode);
    }
  }, [isOpen, initialHintMode]);

  if (!isOpen || !stage) {
    return null;
  }

  const title =
    variant === 'lesson'
      ? isEnglishCopy
        ? 'Start survival task'
        : 'サバイバル課題を開始'
      : isEnglishCopy
        ? 'Start stage'
        : 'ステージを開始';

  const modeLine = formatSurvivalStageModeLabel(stage, isEnglishCopy);
  const encounterLine = formatSurvivalEncounterLabel(stage, isEnglishCopy);
  const stageTitle = isEnglishCopy ? stage.nameEn : stage.name;

  const practiceLabel = isEnglishCopy ? 'Practice (HINT)' : '練習（HINT）';
  const realLabel = isEnglishCopy ? 'Performance' : '本番';
  const cancelLabel = isEnglishCopy ? 'Back' : '戻る';
  const startLabel = isEnglishCopy ? 'Start' : '開始';

  const clearSummary =
    variant === 'lesson'
      ? isEnglishCopy
        ? `Clear: survive ${STAGE_TIME_LIMIT_SECONDS}s and defeat ${STAGE_KILL_QUOTA} enemies (performance mode saves lesson progress).`
        : `クリア条件: ${STAGE_TIME_LIMIT_SECONDS}秒生存 + ${STAGE_KILL_QUOTA}体撃破（本番時のみレッスン進捗が保存されます）。`
      : isEnglishCopy
        ? `Objective: ${STAGE_TIME_LIMIT_SECONDS}s survival + ${STAGE_KILL_QUOTA} defeats (HINT does not record clears).`
        : `目標: ${STAGE_TIME_LIMIT_SECONDS}秒生存 + ${STAGE_KILL_QUOTA}体撃破（HINT時はクリア記録されません）。`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#1a1025] to-[#0a0610] p-6 text-white shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-amber-100">{title}</h2>
        <div className="mb-4 space-y-1 text-sm text-gray-200">
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Stage' : 'ステージ'}: </span>
            <span className="font-medium">{stageTitle}</span>
          </div>
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Mode' : '出題'}: </span>
            <span>{modeLine}</span>
          </div>
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Encounter' : '戦闘'}: </span>
            <span>{encounterLine}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">{clearSummary}</p>
        </div>

        <fieldset className="mb-5 space-y-2">
          <legend className="mb-2 text-sm font-semibold text-gray-300">
            {isEnglishCopy ? 'Run mode' : 'プレイモード'}
          </legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="survival-run-mode"
              checked={!hintLocal}
              onChange={() => setHintLocal(false)}
              className="radio radio-sm radio-warning"
            />
            <span>{realLabel}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="survival-run-mode"
              checked={hintLocal}
              onChange={() => setHintLocal(true)}
              className="radio radio-sm radio-warning"
            />
            <span>{practiceLabel}</span>
          </label>
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
          <button
            type="button"
            className="btn btn-warning btn-sm sm:btn-md"
            onClick={() => onConfirm(hintLocal)}
          >
            {startLabel}
          </button>
          <button type="button" className="btn btn-ghost btn-sm text-gray-300 sm:btn-md" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurvivalRunPrepModal;
