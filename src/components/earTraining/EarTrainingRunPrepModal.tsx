/**
 * 耳コピバトル レッスン開始前: 練習 / 本番の確認モーダル
 */

import React, { useEffect, useState } from 'react';
import type { EarTrainingStage } from '@/types';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';

interface EarTrainingRunPrepModalProps {
  isOpen: boolean;
  stage: EarTrainingStage | null;
  isEnglishCopy: boolean;
  /** URL 等からの初期値（true = 練習） */
  initialPracticeMode: boolean;
  onCancel: () => void;
  /** true = 練習（practiceMode） */
  onConfirm: (practiceMode: boolean) => void;
}

const EarTrainingRunPrepModal: React.FC<EarTrainingRunPrepModalProps> = ({
  isOpen,
  stage,
  isEnglishCopy,
  initialPracticeMode,
  onCancel,
  onConfirm,
}) => {
  const [practiceLocal, setPracticeLocal] = useState(initialPracticeMode);

  useEffect(() => {
    if (isOpen) {
      setPracticeLocal(initialPracticeMode);
    }
  }, [isOpen, initialPracticeMode]);

  if (!isOpen || !stage) {
    return null;
  }

  const title = isEnglishCopy ? 'Start battle lesson task' : 'バトル課題を開始';
  const stageTitle = isEnglishCopy ? (stage.title_en ?? stage.title) : stage.title;
  const cancelLabel = isEnglishCopy ? 'Back' : '戻る';
  const startLabel = isEnglishCopy ? 'Start' : '開始';
  const realLabel = isEnglishCopy ? 'Performance' : '本番';
  const practiceLabel = isEnglishCopy ? 'Practice' : '練習';
  const clearSummary = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);
  const lessonNote = isEnglishCopy
    ? 'Lesson progress is saved only in performance mode.'
    : 'レッスン進捗が保存されるのは本番モードのみです。';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#0f1729] to-[#050810] p-6 text-white shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-cyan-100">{title}</h2>
        <div className="mb-4 space-y-1 text-sm text-gray-200">
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Stage' : 'ステージ'}: </span>
            <span className="font-medium">{stageTitle}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">{clearSummary}</p>
          <p className="text-xs leading-relaxed text-cyan-200/90">{lessonNote}</p>
        </div>

        <fieldset className="mb-5 space-y-2">
          <legend className="mb-2 text-sm font-semibold text-gray-300">
            {isEnglishCopy ? 'Run mode' : 'プレイモード'}
          </legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="ear-training-lesson-run-mode"
              checked={!practiceLocal}
              onChange={() => setPracticeLocal(false)}
              className="radio radio-sm radio-info"
            />
            <span>{realLabel}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="ear-training-lesson-run-mode"
              checked={practiceLocal}
              onChange={() => setPracticeLocal(true)}
              className="radio radio-sm radio-info"
            />
            <span>{practiceLabel}</span>
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCancel} className="btn btn-outline btn-sm flex-1 border-white/30">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(practiceLocal)}
            className="btn btn-info btn-sm flex-1 font-sans"
          >
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EarTrainingRunPrepModal;
