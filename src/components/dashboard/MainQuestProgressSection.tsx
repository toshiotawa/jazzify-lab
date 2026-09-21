import React, { useEffect, useState } from 'react';
import {
  fetchMainQuestProgress,
  MainQuestProgress,
  resolveMainQuestInstrument,
} from '@/platform/supabaseCourses';
import { FaChevronRight, FaStar } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { lessonDisplayTitle } from '@/utils/lessonCopy';

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
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const instrument = resolveMainQuestInstrument(profile?.instrument ?? null);
        const data = await fetchMainQuestProgress(instrument);
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
  }, [profile?.instrument]);

  if (loading || !progress || progress.totalLessons <= 0) return null;

  const { completedLessons, nextLesson } = progress;
  const nextLessonDisplayTitle =
    nextLesson == null ? '' : lessonDisplayTitle(nextLesson, isEnglishCopy);
  const allCompleted = completedLessons >= progress.totalLessons;
  const progressPercent = progress.totalLessons > 0
    ? Math.round((completedLessons / progress.totalLessons) * 100)
    : 0;
  const quotedNextLessonTitle = formatQuotedQuestTitle(nextLessonDisplayTitle, isEnglishCopy);

  const sectionTitle = isEnglishCopy ? 'Main Quest' : 'メインクエスト';
  const allCompletedText = isEnglishCopy
    ? 'Main Quest complete!'
    : 'メインクエストをすべて完了しました！';
  const goToMainQuestText = isEnglishCopy ? 'To Main Quest →' : 'メインクエストへ→';

  const handleGoToMainQuest = (): void => {
    window.location.hash = `#course?id=${progress.courseId}`;
  };

  return (
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

      <div className="min-w-0 space-y-3">
        {allCompleted ? (
          <p className="text-emerald-400 font-medium text-sm">
            {allCompletedText}
          </p>
        ) : nextLesson ? (
          <p className="text-sm text-gray-300 truncate sm:whitespace-normal">
            {isEnglishCopy ? (
              <>Complete <span className="text-amber-300 font-semibold">{quotedNextLessonTitle}</span></>
            ) : (
              <><span className="text-amber-300 font-semibold">{quotedNextLessonTitle}</span>を完了しましょう</>
            )}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleGoToMainQuest}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold font-accent transition-colors"
        >
          <span className="whitespace-nowrap">{goToMainQuestText}</span>
          <FaChevronRight className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default MainQuestProgressSection;
