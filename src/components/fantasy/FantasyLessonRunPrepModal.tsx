/**
 * ファンタジー レッスン開始前: 練習 / 本番（チャレンジ）の確認モーダル
 */

import React, { useEffect, useState } from 'react';
import type { FantasyPlayMode, FantasyStage } from './FantasyGameEngine';

interface FantasyLessonRunPrepModalProps {
  isOpen: boolean;
  stage: FantasyStage | null;
  isEnglishCopy: boolean;
  /** URL 等: practice=1 のとき true（練習で開く） */
  initialPracticeMode: boolean;
  onCancel: () => void;
  /** 'practice' | 'challenge' */
  onConfirm: (playMode: FantasyPlayMode) => void;
}

const FantasyLessonRunPrepModal: React.FC<FantasyLessonRunPrepModalProps> = ({
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

  const title = isEnglishCopy ? 'Start fantasy lesson task' : 'ファンタジー課題を開始';
  const stageTitle =
    isEnglishCopy && stage.name_en?.trim()
      ? stage.name_en
      : stage.name;
  const cancelLabel = isEnglishCopy ? 'Back' : '戻る';
  const startLabel = isEnglishCopy ? 'Start' : '開始';
  const challengeLabel = isEnglishCopy ? 'Performance (challenge)' : '本番（チャレンジ）';
  const practiceLabel = isEnglishCopy ? 'Practice' : '練習';
  const lessonNote = isEnglishCopy
    ? 'Lesson progress is saved only in challenge mode.'
    : 'レッスン進捗が保存されるのは本番（チャレンジ）モードのみです。';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-purple-500/40 bg-gradient-to-b from-[#1a1028] to-[#0a0610] p-6 text-white shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-purple-100">{title}</h2>
        <div className="mb-4 space-y-1 text-sm text-gray-200">
          <div>
            <span className="text-gray-400">{isEnglishCopy ? 'Stage' : 'ステージ'}: </span>
            <span className="font-medium">{stageTitle}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-purple-200/90">{lessonNote}</p>
        </div>

        <fieldset className="mb-5 space-y-2">
          <legend className="mb-2 text-sm font-semibold text-gray-300">
            {isEnglishCopy ? 'Run mode' : 'プレイモード'}
          </legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="fantasy-lesson-run-mode"
              checked={!practiceLocal}
              onChange={() => setPracticeLocal(false)}
              className="radio radio-sm radio-secondary"
            />
            <span>{challengeLabel}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:bg-white/5">
            <input
              type="radio"
              name="fantasy-lesson-run-mode"
              checked={practiceLocal}
              onChange={() => setPracticeLocal(true)}
              className="radio radio-sm radio-secondary"
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
            onClick={() => onConfirm(practiceLocal ? 'practice' : 'challenge')}
            className="btn btn-secondary btn-sm flex-1 font-sans"
          >
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FantasyLessonRunPrepModal;
