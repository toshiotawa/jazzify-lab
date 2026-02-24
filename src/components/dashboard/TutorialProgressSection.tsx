import React, { useEffect, useState } from 'react';
import { fetchTutorialProgress, TutorialProgress } from '@/platform/supabaseCourses';
import { FaGraduationCap, FaPlay } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const CIRCLE_SIZE = 64;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TutorialProgressSection: React.FC = () => {
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const isStandardGlobal = profile?.rank === 'standard_global';
  const audience: 'global' | 'japan' = isStandardGlobal ? 'global' : 'japan';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTutorialProgress(audience);
        if (!cancelled) setProgress(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [audience]);

  if (loading || !progress) return null;

  const { totalLessons, completedLessons, nextLesson } = progress;
  const ratio = totalLessons > 0 ? completedLessons / totalLessons : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const allCompleted = completedLessons >= totalLessons;

  const handlePlay = () => {
    if (nextLesson) {
      window.location.hash = `#lesson-detail?id=${nextLesson.id}`;
    }
  };

  const sectionTitle = isEnglishCopy ? 'Tutorial' : 'チュートリアル';
  const allCompletedText = isEnglishCopy ? 'All tutorials completed!' : 'すべてのチュートリアルを完了しました！';
  const startButtonText = isEnglishCopy ? 'Start Lesson' : 'レッスンを始める';

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FaGraduationCap className="text-cyan-400 text-lg" />
        <h3 className="text-base font-semibold">{sectionTitle}</h3>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
          <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} className="-rotate-90">
            <circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#334155"
              strokeWidth={STROKE_WIDTH}
            />
            <circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={allCompleted ? '#10b981' : '#06b6d4'}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {completedLessons}/{totalLessons}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {allCompleted ? (
            <p className="text-emerald-400 font-medium text-sm">
              {allCompletedText}
            </p>
          ) : nextLesson ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate sm:whitespace-normal">
                  {isEnglishCopy ? (
                    <>Complete <span className="text-cyan-400 font-semibold">Lesson {nextLesson.order_index + 1}: {nextLesson.title}</span></>
                  ) : (
                    <><span className="text-cyan-400 font-semibold">レッスン{nextLesson.order_index + 1}：{nextLesson.title}</span>を完了しましょう</>
                  )}
                </p>
              </div>
              <button
                onClick={handlePlay}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors w-full sm:w-auto"
                aria-label={`${nextLesson.title} を開始`}
              >
                <FaPlay className="text-xs ml-0.5" />
                <span className="whitespace-nowrap">{startButtonText}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TutorialProgressSection;
