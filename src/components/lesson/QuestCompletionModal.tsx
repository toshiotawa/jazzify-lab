import React from 'react';
import { FaChevronRight } from 'react-icons/fa';
import type { Lesson } from '@/types';
import type { QuestCompletionModalKind } from '@/utils/lessonNavigation';
import { getLessonBlockInfo } from '@/utils/lessonNavigation';

export interface QuestCompletionModalProps {
  kind: QuestCompletionModalKind;
  currentLesson: Lesson;
  nextLesson: Lesson | null;
  isEnglishCopy: boolean;
  onStay: () => void;
  onContinue?: () => void;
  onPremium?: () => void;
}

export const QuestCompletionModal: React.FC<QuestCompletionModalProps> = ({
  kind,
  currentLesson,
  nextLesson,
  isEnglishCopy,
  onStay,
  onContinue,
  onPremium,
}) => {
  const blockInfo = getLessonBlockInfo(currentLesson, { isEnglishCopy });
  const chapterLabel = isEnglishCopy
    ? `Chapter ${blockInfo.blockNumber}`
    : `チャプター ${blockInfo.blockNumber}`;

  const heading = (() => {
    switch (kind) {
      case 'chapterCompleteWithNext':
      case 'chapterCompletePremiumUpsell':
      case 'chapterCompleteOnly':
        return isEnglishCopy
          ? `${chapterLabel} complete!`
          : `${chapterLabel} 完了！`;
      case 'nextQuest':
      default:
        return isEnglishCopy ? 'Quest complete!' : 'クエスト完了！';
    }
  })();

  const body = (() => {
    switch (kind) {
      case 'chapterCompleteWithNext':
        return isEnglishCopy
          ? 'Congratulations! Ready for the next quest?'
          : 'おめでとうございます！次のクエストに進みますか？';
      case 'chapterCompletePremiumUpsell':
        return isEnglishCopy
          ? 'Congratulations! Chapters 2+ require Premium.'
          : 'おめでとうございます！第2チャプター以降はプレミアムでプレイできます。';
      case 'chapterCompleteOnly':
        return isEnglishCopy
          ? 'Congratulations on clearing this chapter!'
          : 'チャプタークリアおめでとうございます！';
      case 'nextQuest':
      default:
        return isEnglishCopy ? 'Go to the next quest?' : '次のクエストに進みますか？';
    }
  })();

  const stayLabel = kind === 'chapterCompleteOnly'
    ? (isEnglishCopy ? 'OK' : 'OK')
    : (isEnglishCopy ? 'Stay on this page' : 'このまま留まる');

  const continueLabel = isEnglishCopy ? 'Continue' : '次へ進む';
  const premiumLabel = isEnglishCopy ? 'Continue with Premium' : 'プレミアムで続ける';
  const showStay = kind !== 'chapterCompletePremiumUpsell';
  const showContinue = kind !== 'chapterCompleteOnly'
    && kind !== 'chapterCompletePremiumUpsell'
    && onContinue !== undefined;
  const showPremium = kind === 'chapterCompletePremiumUpsell' && onPremium !== undefined;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isEnglishCopy ? 'Close dialog' : 'ダイアログを閉じる'}
        onClick={onStay}
      />
      <div
        className="relative mx-4 max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-completion-modal-title"
      >
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🎉
          </div>
          <h3 id="quest-completion-modal-title" className="text-xl font-bold text-white">
            {heading}
          </h3>
          <p className="mt-2 text-sm text-gray-300">{body}</p>
          {nextLesson && showContinue ? (
            <p className="mt-1 text-sm font-medium text-blue-300">{nextLesson.title}</p>
          ) : null}
        </div>
        <div className="flex gap-3">
          {showStay ? (
            <button
              type="button"
              onClick={onStay}
              className="flex-1 rounded-lg bg-slate-600 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-500"
            >
              {stayLabel}
            </button>
          ) : null}
          {showContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
            >
              {continueLabel}
              <FaChevronRight className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
          {showPremium ? (
            <button
              type="button"
              onClick={onPremium}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
            >
              {premiumLabel}
              <FaChevronRight className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QuestCompletionModal;
