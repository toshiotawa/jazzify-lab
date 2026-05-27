/**
 * 風船ラッシュ開始前: 練習（HINT）/ 本番の確認（サバイバル SurvivalRunPrepModal の簡易版）
 */

import React, { useEffect, useState } from 'react';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';

export interface BalloonRushRunPrepModalProps {
  readonly isOpen: boolean;
  readonly stage: BalloonRushResolvedStage | null;
  readonly isEnglishCopy: boolean;
  readonly initialHintMode: boolean;
  readonly onCancel: () => void;
  /** true = HINT（練習、進捗なし） */
  readonly onConfirm: (hintMode: boolean) => void;
}

const BalloonRushRunPrepModal: React.FC<BalloonRushRunPrepModalProps> = ({
  isOpen,
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

  const title = isEnglishCopy ? 'Start balloon rush task' : '風船ラッシュを開始';

  const practiceLabel = isEnglishCopy ? 'Practice (HINT)' : '練習（HINT）';
  const realLabel = isEnglishCopy ? 'Performance' : '本番';
  const cancelLabel = isEnglishCopy ? 'Back' : '戻る';
  const startLabel = isEnglishCopy ? 'Start' : '開始';

  const stageTitle = isEnglishCopy ? stage.titleEn || stage.slug : stage.title || stage.slug;
  const modeLine =
    stage.stageType === 'progression'
      ? isEnglishCopy
        ? 'Progression chords'
        : 'プログレッションコード'
      : isEnglishCopy
        ? 'Random chords'
        : 'ランダムコード';

  const clearSummary = isEnglishCopy
    ? `Clear: pop ${stage.popQuota} balloons within ${stage.timeLimitSec}s (practice does not save progress).`
    : `クリア条件: ${stage.timeLimitSec}秒以内に風船を${stage.popQuota}個割る（練習時は進捗が保存されません）。`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-sky-500/35 bg-gradient-to-b from-[#0f1729] to-[#050810] p-6 text-white shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-sky-100">{title}</h2>
        <div className="mb-4 space-y-1 text-sm text-gray-200">
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Stage' : 'ステージ'}: </span>
            <span className="font-medium">{stageTitle}</span>
          </div>
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Mode' : '出題'}: </span>
            <span>{modeLine}</span>
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
              name="balloon-run-mode"
              checked={!hintLocal}
              onChange={() => setHintLocal(false)}
              className="radio radio-sm radio-info"
            />
            <span>{realLabel}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="balloon-run-mode"
              checked={hintLocal}
              onChange={() => setHintLocal(true)}
              className="radio radio-sm radio-info"
            />
            <span>{practiceLabel}</span>
          </label>
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
          <button type="button" className="btn btn-info btn-sm sm:btn-md" onClick={() => onConfirm(hintLocal)}>
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

export default BalloonRushRunPrepModal;
