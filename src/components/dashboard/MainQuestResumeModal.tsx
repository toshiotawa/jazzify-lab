import React, { useEffect, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { fetchMainQuestProgress, MainQuestProgress } from '@/platform/supabaseCourses';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import {
  markMainQuestResumeSessionShown,
  readMainQuestResumeSessionShown,
  shouldShowMainQuestResumePrompt,
} from '@/utils/mainQuestResume';

const MainQuestResumeModal: React.FC = () => {
  const [progress, setProgress] = useState<MainQuestProgress | null>(null);
  const [open, setOpen] = useState(false);
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMainQuestProgress();
        if (cancelled || !data?.nextLesson) {
          return;
        }
        setProgress(data);
        const shouldShow = shouldShowMainQuestResumePrompt({
          lastPlayedAt: data.lastPlayedAt,
          nextLessonBlockNumber: data.nextLesson.block_number,
          sessionAlreadyShown: readMainQuestResumeSessionShown(),
        });
        if (shouldShow && isMainQuestBlockPlayable(data.nextLesson.block_number, isPremiumMember)) {
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPremiumMember]);

  if (!open || !progress?.nextLesson) {
    return null;
  }

  const nextLesson = progress.nextLesson;
  const nextTitle = isEnglishCopy
    ? (nextLesson.title_en ?? nextLesson.title)
    : nextLesson.title;
  const questLabel = isEnglishCopy
    ? `Quest ${nextLesson.order_index + 1}`
    : `クエスト${nextLesson.order_index + 1}`;

  const handleResume = () => {
    markMainQuestResumeSessionShown();
    setOpen(false);
    window.location.hash = `#lesson-detail?id=${nextLesson.id}`;
  };

  const handleQuestList = () => {
    markMainQuestResumeSessionShown();
    setOpen(false);
    window.location.hash = '#lessons';
  };

  const handleClose = () => {
    markMainQuestResumeSessionShown();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isEnglishCopy ? 'Close dialog' : 'ダイアログを閉じる'}
        onClick={handleClose}
      />
      <div
        className="relative mx-4 max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="main-quest-resume-modal-title"
      >
        <div className="mb-4 text-center">
          <h3 id="main-quest-resume-modal-title" className="text-xl font-bold text-white">
            {isEnglishCopy ? 'Continue where you left off?' : '前回の続きから再開しますか？'}
          </h3>
          <p className="mt-2 text-sm text-gray-300">
            {isEnglishCopy
              ? `You can continue from ${questLabel} "${nextTitle}".`
              : `${questLabel}「${nextTitle}」から続けられます。`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-colors hover:from-cyan-500 hover:to-blue-500"
          >
            <FaPlay className="text-sm" aria-hidden />
            {isEnglishCopy ? 'Resume' : '続きから再開'}
          </button>
          <button
            type="button"
            onClick={handleQuestList}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-600 hover:text-white"
          >
            {isEnglishCopy ? 'View quest list' : 'クエスト一覧を見る'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-slate-700/60 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-slate-600 hover:text-gray-200"
          >
            {isEnglishCopy ? 'Close' : '閉じる'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainQuestResumeModal;
