import React, { useEffect, useState } from 'react';
import { FaCrown, FaPlay } from 'react-icons/fa';
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
import {
  isMainQuestBlockedForSoftLanding,
  shouldPrioritizeSoftLandingGuidance,
} from '@/utils/softLandingGuidance';
import { readSoftLandingSessionDismissed } from '@/utils/softLandingResume';
import { fetchSoftLandingCandidates } from '@/platform/supabaseCourses';
import { resolveNextSoftLandingCourse } from '@/utils/softLanding';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import WebPaywallModal from '@/components/ui/WebPaywallModal';

const MainQuestResumeModal: React.FC = () => {
  const [progress, setProgress] = useState<MainQuestProgress | null>(null);
  const [open, setOpen] = useState(false);
  const [premiumUpsell, setPremiumUpsell] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
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
        if (cancelled || !data?.nextLesson || !profile?.id) {
          return;
        }
        setProgress(data);
        const mainQuestBlocked = isMainQuestBlockedForSoftLanding(data);
        const candidates = await fetchSoftLandingCandidates(profile.id);
        const nextSoftLandingCourse = resolveNextSoftLandingCourse(candidates);
        const softLandingGuidanceActive = shouldPrioritizeSoftLandingGuidance({
          isPremiumMember,
          mainQuestBlocked,
          nextCourse: nextSoftLandingCourse,
          sessionDismissed: readSoftLandingSessionDismissed(),
        });
        if (softLandingGuidanceActive) {
          return;
        }
        const shouldShow = shouldShowMainQuestResumePrompt({
          lastPlayedAt: data.lastPlayedAt,
          sessionAlreadyShown: readMainQuestResumeSessionShown(),
        });
        if (!shouldShow) {
          return;
        }

        const nextBlockNumber = data.nextLesson.block_number ?? 1;
        if (isMainQuestBlockPlayable(nextBlockNumber, isPremiumMember)) {
          setPremiumUpsell(false);
          setOpen(true);
          return;
        }

        if (!isPremiumMember) {
          setPremiumUpsell(true);
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPremiumMember, profile?.id]);

  const nextLesson = progress?.nextLesson ?? null;

  const handleResume = () => {
    if (!nextLesson) {
      return;
    }
    markMainQuestResumeSessionShown();
    setOpen(false);
    window.location.hash = buildLessonDetailHash(nextLesson.id, { autoStart: true });
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

  const handleOpenPaywall = () => {
    markMainQuestResumeSessionShown();
    setOpen(false);
    setShowPaywall(true);
  };

  return (
    <>
      {open && nextLesson ? (
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
                {premiumUpsell
                  ? (isEnglishCopy ? 'Continue Main Quest with Premium' : 'プレミアムでメインクエストを続ける')
                  : (isEnglishCopy ? 'Resume Main Quest?' : 'メインクエストを再開しますか？')}
              </h3>
              {premiumUpsell ? (
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                  {isEnglishCopy
                    ? 'You cleared Chapter 1. Unlock Premium to play Chapter 2 and beyond.'
                    : '第1チャプターをクリアしました。第2チャプター以降はプレミアムでプレイできます。'}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3">
              {premiumUpsell ? (
                <button
                  type="button"
                  onClick={handleOpenPaywall}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-4 text-base font-bold text-black shadow-lg transition-colors hover:from-amber-400 hover:to-orange-400"
                >
                  <FaCrown className="text-sm" aria-hidden />
                  {isEnglishCopy ? 'See Premium plans' : 'プレミアムを見る'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-colors hover:from-cyan-500 hover:to-blue-500"
                >
                  <FaPlay className="text-sm" aria-hidden />
                  {isEnglishCopy ? 'Resume' : '続きから再開'}
                </button>
              )}
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
      ) : null}
      <WebPaywallModal
        open={showPaywall}
        onClose={() => { setShowPaywall(false); }}
        isEnglishCopy={isEnglishCopy}
        source="resume_modal"
      />
    </>
  );
};

export default MainQuestResumeModal;
