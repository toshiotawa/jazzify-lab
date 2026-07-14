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

const CHAPTER_PREMIUM_UPSELL_COPY = {
  ja: {
    label: 'チャプター 1 完了',
    heading: 'ドとソで、ジャズの返事ができた！',
    body: 'ドとソだけで聴いて返す。アドリブの最初の一歩をクリアしました。',
    nextChapterLabel: '次のチャプター',
    nextChapterTitle: 'Cブルースのコードをつかむ',
    nextChapterBody: 'コードの響きと進行をつかむ。使える要素を増やしながら、自分のフレーズへ進みます。',
    continueLabel: '次のチャプターへ',
    stayLabel: 'あとでホームに戻る',
  },
  en: {
    label: 'CHAPTER 1 COMPLETE',
    heading: 'You can answer jazz with Do and Sol!',
    body: 'Hear and answer with Do and Sol. You cleared the first step of improvising.',
    nextChapterLabel: 'Next chapter',
    nextChapterTitle: 'Get a Grip on C Blues Chords',
    nextChapterBody: 'Learn chord colors and the blues progression. Add more tools and build your own phrases.',
    continueLabel: 'Continue to the next chapter',
    stayLabel: 'Return home later',
  },
} as const;

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

  const premiumUpsellCopy = isEnglishCopy
    ? CHAPTER_PREMIUM_UPSELL_COPY.en
    : CHAPTER_PREMIUM_UPSELL_COPY.ja;

  const heading = (() => {
    if (kind === 'chapterCompletePremiumUpsell') {
      return premiumUpsellCopy.heading;
    }
    switch (kind) {
      case 'chapterCompleteWithNext':
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
    if (kind === 'chapterCompletePremiumUpsell') {
      return premiumUpsellCopy.body;
    }
    switch (kind) {
      case 'chapterCompleteWithNext':
        return isEnglishCopy
          ? 'Congratulations! Ready for the next quest?'
          : 'おめでとうございます！次のクエストに進みますか？';
      case 'chapterCompleteOnly':
        return isEnglishCopy
          ? 'Congratulations on clearing this chapter!'
          : 'チャプタークリアおめでとうございます！';
      case 'nextQuest':
      default:
        return isEnglishCopy ? 'Go to the next quest?' : '次のクエストに進みますか？';
    }
  })();

  const stayLabel = (() => {
    if (kind === 'chapterCompletePremiumUpsell') {
      return premiumUpsellCopy.stayLabel;
    }
    return kind === 'chapterCompleteOnly'
      ? (isEnglishCopy ? 'OK' : 'OK')
      : (isEnglishCopy ? 'Stay on this page' : 'このまま留まる');
  })();

  const continueLabel = kind === 'chapterCompletePremiumUpsell'
    ? premiumUpsellCopy.continueLabel
    : (isEnglishCopy ? 'Continue' : '次へ進む');

  const showContinue = kind !== 'chapterCompleteOnly'
    && kind !== 'chapterCompletePremiumUpsell'
    && onContinue !== undefined;
  const showPremium = kind === 'chapterCompletePremiumUpsell' && onPremium !== undefined;

  if (kind === 'chapterCompletePremiumUpsell') {
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
          className="relative mx-4 max-w-md rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quest-completion-modal-title"
        >
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              {premiumUpsellCopy.label}
            </p>
            <div className="mb-3 mt-3 text-4xl" aria-hidden>
              🎉
            </div>
            <h3 id="quest-completion-modal-title" className="text-xl font-bold text-white">
              {heading}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{body}</p>
          </div>

          <div className="mb-5 rounded-lg border border-slate-600/80 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
              {premiumUpsellCopy.nextChapterLabel}
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {premiumUpsellCopy.nextChapterTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              {premiumUpsellCopy.nextChapterBody}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {showPremium ? (
              <button
                type="button"
                onClick={onPremium}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
              >
                {continueLabel}
                <FaChevronRight className="h-3 w-3" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onStay}
              className="text-sm text-gray-400 transition-colors hover:text-gray-300"
            >
              {stayLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button
            type="button"
            onClick={onStay}
            className="flex-1 rounded-lg bg-slate-600 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-500"
          >
            {stayLabel}
          </button>
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
        </div>
      </div>
    </div>
  );
};

export default QuestCompletionModal;
