import React, { useCallback, useEffect, useState } from 'react';
import { FaChevronRight, FaGift } from 'react-icons/fa';
import { fetchMainQuestProgress } from '@/platform/supabaseCourses';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import { useSoftLandingOffer } from '@/hooks/useSoftLandingOffer';
import SoftLandingOfferModal from '@/components/lesson/SoftLandingOfferModal';
import { courseDisplayTitle } from '@/utils/courseCopy';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import { getFirstBlock1LessonId } from '@/utils/softLanding';

const SoftLandingSection: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');
  const [mainQuestBlocked, setMainQuestBlocked] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const {
    nextCourse,
    reload,
    trackOfferViewed,
    trackOfferAccepted,
    trackOfferDismissed,
  } = useSoftLandingOffer({
    userId: profile?.id,
    enabled: !isPremiumMember,
    entry: 'dashboard',
  });

  useEffect(() => {
    if (isPremiumMember || !profile?.id) {
      setMainQuestBlocked(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const progress = await fetchMainQuestProgress();
        if (cancelled || !progress) {
          return;
        }
        const allCompleted = progress.completedLessons >= progress.totalLessons;
        const nextBlocked = progress.nextLesson != null
          && !isMainQuestBlockPlayable(progress.nextLesson.block_number, false);
        setMainQuestBlocked(allCompleted || nextBlocked);
      } catch {
        if (!cancelled) {
          setMainQuestBlocked(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isPremiumMember, profile?.id]);

  useEffect(() => {
    if (!isPremiumMember && mainQuestBlocked) {
      void reload({ forceRefresh: true });
    }
  }, [isPremiumMember, mainQuestBlocked, reload]);

  const handleOpenOffer = useCallback(() => {
    if (!nextCourse) {
      return;
    }
    trackOfferViewed(nextCourse.course);
    setShowOfferModal(true);
  }, [nextCourse, trackOfferViewed]);

  const handleAccept = useCallback(() => {
    if (!nextCourse) {
      setShowOfferModal(false);
      return;
    }
    trackOfferAccepted(nextCourse.course);
    setShowOfferModal(false);
    const firstLessonId = getFirstBlock1LessonId(nextCourse.course.lessons ?? []);
    if (firstLessonId) {
      window.location.hash = buildLessonDetailHash(firstLessonId, { autoStart: true });
    }
  }, [nextCourse, trackOfferAccepted]);

  const handleDismiss = useCallback(() => {
    if (nextCourse) {
      trackOfferDismissed(nextCourse.course);
    }
    setShowOfferModal(false);
  }, [nextCourse, trackOfferDismissed]);

  if (isPremiumMember || !mainQuestBlocked || !nextCourse) {
    return null;
  }

  const courseTitle = courseDisplayTitle(nextCourse.course, isEnglishCopy);
  const sectionTitle = isEnglishCopy ? 'Continue learning' : '学びを続ける';
  const body = isEnglishCopy
    ? `Try "${courseTitle}" — Block 1 is free.`
    : `「${courseTitle}」の第1ブロックを無料で体験できます。`;
  const cta = isEnglishCopy ? 'View course' : 'コースを見る';

  return (
    <>
      <div className="bg-slate-800 rounded-lg border border-emerald-500/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaGift className="text-emerald-400 text-lg" />
          <h3 className="text-base font-extrabold">{sectionTitle}</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">{body}</p>
        <button
          type="button"
          onClick={handleOpenOffer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
        >
          {cta}
          <FaChevronRight className="text-xs" aria-hidden />
        </button>
      </div>
      <SoftLandingOfferModal
        open={showOfferModal}
        course={nextCourse.course}
        isEnglishCopy={isEnglishCopy}
        entry="dashboard"
        onAccept={handleAccept}
        onDismiss={handleDismiss}
      />
    </>
  );
};

export default SoftLandingSection;
