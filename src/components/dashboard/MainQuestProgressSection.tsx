import React, { useEffect, useState } from 'react';
import { fetchMainQuestProgress, MainQuestProgress } from '@/platform/supabaseCourses';
import { FaLock, FaPlay, FaStar } from 'react-icons/fa';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { lessonDisplayTitle } from '@/utils/lessonCopy';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { recordUserMilestoneFireAndForget } from '@/utils/analytics/milestones';
import { trackEvent } from '@/utils/analytics/ga';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';

const formatQuotedQuestTitle = (title: string, isEnglishCopy: boolean): string =>
  isEnglishCopy ? `"${title}"` : `「${title}」`;

const MainQuestProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/70">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
        style={{ width }}
      />
    </div>
  );
};

const MainQuestProgressSection: React.FC = () => {
  const [progress, setProgress] = useState<MainQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const { profile, pendingMainQuestAutoStart, consumeMainQuestAutoStart } = useAuthStore();
  const geoCountry = useGeoStore(s => s.country);
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
        if (!cancelled) {
          setProgress(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!pendingMainQuestAutoStart || !progress?.nextLesson || !profile) {
      return;
    }
    consumeMainQuestAutoStart();
    if (progress.nextLesson.order_index === 0) {
      recordUserMilestoneFireAndForget(profile.id, 'first_play');
      trackEvent('tutorial_begin', { tutorial_name: 'first_quest' });
    }
    if (isMainQuestBlockPlayable(progress.nextLesson.block_number, isPremiumMember)) {
      window.location.hash = `#lesson-detail?id=${progress.nextLesson.id}&autoStart=1`;
    }
  }, [pendingMainQuestAutoStart, progress, isPremiumMember, consumeMainQuestAutoStart, profile]);

  if (loading || !progress) return null;

  const { completedLessons, nextLesson } = progress;
  const nextLessonDisplayTitle =
    nextLesson == null
      ? ''
      : lessonDisplayTitle(nextLesson, isEnglishCopy);
  const nextLessonPlayable =
    nextLesson != null
    && isMainQuestBlockPlayable(nextLesson.block_number, isPremiumMember);
  const allCompleted = completedLessons >= progress.totalLessons;
  const progressPercent = progress.totalLessons > 0
    ? Math.round((completedLessons / progress.totalLessons) * 100)
    : 0;
  const quotedNextLessonTitle = formatQuotedQuestTitle(nextLessonDisplayTitle, isEnglishCopy);

  const handlePlay = () => {
    if (!nextLesson || !nextLessonPlayable) {
      return;
    }
    window.location.hash = buildLessonDetailHash(nextLesson.id, { autoStart: true });
  };

  const sectionTitle = isEnglishCopy ? 'Main Quest' : 'メインクエスト';
  const allCompletedText = isEnglishCopy
    ? 'Main Quest complete!'
    : 'メインクエストをすべて完了しました！';
  const startButtonText = isEnglishCopy ? 'Start Quest' : 'クエストを始める';
  const premiumGateText = isEnglishCopy
    ? 'Main Quest chapters 2+ require Premium.'
    : 'メインクエスト第2チャプター以降はプレミアムでプレイできます。';
  const premiumButtonText = isEnglishCopy ? 'View Premium' : 'プレミアムを見る';

  return (
    <>
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaStar className="text-cyan-400 text-lg" />
          <h3 className="text-base font-extrabold">{sectionTitle}</h3>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <MainQuestProgressBar percent={progressPercent} />
          <span className="shrink-0 text-xs font-semibold tabular-nums text-cyan-300">
            {progressPercent}%
          </span>
        </div>

        <div className="min-w-0">
          {allCompleted ? (
            <p className="text-emerald-400 font-medium text-sm">
              {allCompletedText}
            </p>
          ) : nextLesson && nextLessonPlayable ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate sm:whitespace-normal">
                  {isEnglishCopy ? (
                    <>Complete <span className="text-amber-300 font-semibold">{quotedNextLessonTitle}</span></>
                  ) : (
                    <><span className="text-amber-300 font-semibold">{quotedNextLessonTitle}</span>を完了しましょう</>
                  )}
                </p>
              </div>
              <button
                onClick={handlePlay}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold font-accent transition-colors w-full sm:w-auto"
                aria-label={isEnglishCopy ? `Start ${nextLessonDisplayTitle}` : `${nextLessonDisplayTitle} を開始`}
              >
                <FaPlay className="text-xs ml-0.5" />
                <span className="whitespace-nowrap">{startButtonText}</span>
              </button>
            </div>
          ) : nextLesson ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <p className="flex-1 text-sm text-amber-200">
                {premiumGateText}
              </p>
              <button
                type="button"
                onClick={() => setShowPaywall(true)}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-purple-600/85 hover:bg-purple-500 text-white text-sm font-bold transition-colors w-full sm:w-auto"
              >
                <FaLock className="text-xs" />
                <span className="whitespace-nowrap">{premiumButtonText}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <WebPaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        isEnglishCopy={isEnglishCopy}
        source="dashboard"
      />
    </>
  );
};

export default MainQuestProgressSection;
