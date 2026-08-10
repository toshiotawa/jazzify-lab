import React from 'react';
import { FaChevronRight } from 'react-icons/fa';
import type { SoftLandingOfferCourse, SoftLandingOfferEntry } from '@/utils/analytics/softLandingOffer';
import { courseDisplayDescription, courseDisplayTitle } from '@/utils/courseCopy';

export interface SoftLandingOfferModalProps {
  open: boolean;
  course: SoftLandingOfferCourse | null;
  isEnglishCopy: boolean;
  entry: SoftLandingOfferEntry;
  onAccept: () => void;
  onDismiss: () => void;
}

export const SoftLandingOfferModal: React.FC<SoftLandingOfferModalProps> = ({
  open,
  course,
  isEnglishCopy,
  onAccept,
  onDismiss,
}) => {
  if (!open || !course) {
    return null;
  }

  const courseTitle = courseDisplayTitle(course, isEnglishCopy);
  const courseDesc = courseDisplayDescription(course, isEnglishCopy);
  const heading = isEnglishCopy
    ? `Try "${courseTitle}"?`
    : `「${courseTitle}」へ進みますか？`;
  const body = isEnglishCopy
    ? 'Block 1 is free. Continue your jazz journey with a guided course.'
    : '第1ブロックを無料で体験できます。コースで学びを続けましょう。';
  const acceptLabel = isEnglishCopy ? 'Start free' : '無料で始める';
  const dismissLabel = isEnglishCopy ? 'Maybe later' : 'あとで';

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
        aria-labelledby="soft-landing-offer-title"
      >
        <div className="mb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {isEnglishCopy ? 'Free preview' : '無料プレビュー'}
          </p>
          <div className="mb-3 mt-3 text-4xl" aria-hidden>
            🎹
          </div>
          <h3 id="soft-landing-offer-title" className="text-xl font-bold text-white">
            {heading}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">{body}</p>
        </div>

        {courseDesc ? (
          <div className="mb-5 rounded-lg border border-slate-600/80 bg-slate-900/70 p-4">
            <p className="text-sm leading-relaxed text-gray-300">{courseDesc}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
          >
            {acceptLabel}
            <FaChevronRight className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-gray-400 transition-colors hover:text-gray-300"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoftLandingOfferModal;
