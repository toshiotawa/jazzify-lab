import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Course, CourseDifficultyTier } from '@/types';
import { fetchCoursesForLessonList, fetchUserCompletedCourses, canAccessCourse } from '@/platform/supabaseCourses';
import { fetchUserLessonProgressAll } from '@/platform/supabaseLessonProgress';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { courseDisplayDescription, courseDisplayTitle, filterCoursesForEnglishUi } from '@/utils/courseCopy';
import {
  COURSE_DIFFICULTY_TIER_ORDER,
  difficultyTierLabel,
  normalizeCourseDifficultyTier,
  sortCoursesByDifficultyThenOrder,
} from '@/utils/courseDifficulty';
import { useGeoStore } from '@/stores/geoStore';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { shouldIncludeDeveloperLessonCoursesForUser } from '@/utils/environment';
import { LessonMapAudio, LESSON_MAP_BGM_URL } from '@/utils/LessonMapAudio';
import { FaCheck, FaChevronRight, FaLock } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';
import { cn } from '@/utils/cn';
import { useAppRouteOpen } from '@/hooks/useAppRouteOpen';

const CourseListPage: React.FC = () => {
  const open = useAppRouteOpen({
    hash: '#courses',
    path: (pathname) => pathname === '/main/courses',
  });
  const [specificCourses, setSpecificCourses] = useState<Course[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [allCoursesProgress, setAllCoursesProgress] = useState<Record<string, number>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const toast = useToast();
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { effectiveRank } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');
  const [showPaywall, setShowPaywall] = useState(false);

  const visibleSpecificCourses = useMemo(
    () => (isEnglishCopy ? filterCoursesForEnglishUi(specificCourses) : specificCourses),
    [isEnglishCopy, specificCourses],
  );

  useEffect(() => {
    if (!open || !profile) return;
    if (LessonMapAudio.isMuted()) {
      return undefined;
    }
    const cancelDeferredBgm = LessonMapAudio.scheduleDeferredBgm(LESSON_MAP_BGM_URL);
    return () => {
      cancelDeferredBgm();
      LessonMapAudio.stopBgm();
    };
  }, [open, profile]);

  useEffect(() => {
    if (!open || !profile) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const includeDevCourses = shouldIncludeDeveloperLessonCoursesForUser(profile.isAdmin);
        const [coursesData, completedCourses, progressRows] = await Promise.all([
          fetchCoursesForLessonList({ includeDeveloperCourses: includeDevCourses }),
          fetchUserCompletedCourses(profile.id, { includeDeveloperCourses: includeDevCourses }),
          fetchUserLessonProgressAll(),
        ]);

        const audienceFilter = isEnglishCopy ? 'global' : 'japan';
        const visibleForAudience = coursesData.filter(c => {
          const audience = c.audience || 'both';
          return audience === 'both' || audience === audienceFilter;
        });
        const sortedSpecific = sortCoursesByDifficultyThenOrder(
          visibleForAudience.filter(c => c.is_main_course !== true),
        );

        if (cancelled) return;
        setSpecificCourses(sortedSpecific);
        setCompletedCourseIds(completedCourses);

        const counts: Record<string, number> = {};
        const completedCountByCourse: Record<string, number> = {};
        sortedSpecific.forEach(course => {
          counts[course.id] = course.lessons?.length ?? 0;
        });

        progressRows.forEach(progress => {
          completedCountByCourse[progress.course_id] = completedCountByCourse[progress.course_id] ?? 0;
          if (progress.completed) {
            completedCountByCourse[progress.course_id] += 1;
          }
        });

        const progressMap: Record<string, number> = {};
        sortedSpecific.forEach(course => {
          const total = counts[course.id] ?? 0;
          const completed = completedCountByCourse[course.id] ?? 0;
          progressMap[course.id] = total > 0 ? Math.round((completed / total) * 100) : 0;
        });

        setLessonCounts(counts);
        setAllCoursesProgress(progressMap);
      } catch {
        toast.error(isEnglishCopy ? 'Failed to load courses' : 'コースの読み込みに失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => { cancelled = true; };
  }, [open, profile, isEnglishCopy, toast]);

  const coursesByTier = useMemo(() => {
    const sorted = sortCoursesByDifficultyThenOrder(visibleSpecificCourses);
    const map = new Map<CourseDifficultyTier, Course[]>();
    for (const tier of COURSE_DIFFICULTY_TIER_ORDER) {
      map.set(tier, []);
    }
    for (const course of sorted) {
      const tier = normalizeCourseDifficultyTier(course.difficulty_tier);
      const list = map.get(tier);
      if (list) {
        list.push(course);
      }
    }
    return map;
  }, [visibleSpecificCourses]);

  const openCourse = useCallback((courseId: string) => {
    window.location.hash = `#course?id=${courseId}`;
  }, []);

  if (!open) return null;

  if (!profile) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">
            {isEnglishCopy ? 'Courses require login' : 'コースはログインユーザー専用です'}
          </h4>
          <p className="text-center text-gray-300">
            {isEnglishCopy ? 'Please log in to access courses.' : 'コース機能を利用するにはログインが必要です。'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="btn btn-sm btn-primary w-full"
              onClick={() => { window.location.hash = '#login'; }}
            >
              {isEnglishCopy ? 'Log In / Sign Up' : 'ログイン / 会員登録'}
            </button>
            <button
              className="btn btn-sm btn-outline w-full"
              onClick={() => { window.location.href = '/main#dashboard'; }}
            >
              {isEnglishCopy ? 'Back to Dashboard' : 'ダッシュボードに戻る'}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const renderCourseCard = (course: Course) => {
    const accessResult = canAccessCourse(course, effectiveRank, completedCourseIds, isEnglishCopy);
    const accessible = accessResult.canAccess;
    const isSoftLandingPreview = accessResult.kind === 'soft_landing_preview';
    const isDenied = accessResult.kind === 'denied';
    const progress = allCoursesProgress[course.id] ?? 0;
    const count = lessonCounts[course.id] ?? 0;
    const isCompleted = progress === 100;
    const courseDesc = courseDisplayDescription(course, isEnglishCopy);
    const cardInteractive = accessible;

    return (
      <button
        key={course.id}
        className={cn(
          'group relative text-left w-full border transition-all duration-200 rounded-xl p-5',
          isCompleted
            ? 'border-emerald-500/40 bg-emerald-900/10 hover:bg-emerald-900/20'
            : cardInteractive
              ? 'border-violet-400/20 bg-[rgba(12,8,30,0.78)] hover:bg-violet-950/40 hover:border-violet-300/45'
              : 'border-slate-700/40 bg-slate-800/30 opacity-60 cursor-not-allowed',
        )}
        onClick={() => {
          if (accessible) {
            openCourse(course.id);
          } else if (isDenied && course.premium_only) {
            setShowPaywall(true);
          } else if (isDenied) {
            toast.warning(accessResult.reason || (isEnglishCopy ? 'Cannot access this course' : 'このコースにはアクセスできません'));
          }
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide border',
                normalizeCourseDifficultyTier(course.difficulty_tier) === 'tutorial'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : normalizeCourseDifficultyTier(course.difficulty_tier) === 'beginner'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                    : normalizeCourseDifficultyTier(course.difficulty_tier) === 'intermediate'
                      ? 'bg-amber-500/15 text-amber-200 border-amber-500/25'
                      : 'bg-rose-500/15 text-rose-200 border-rose-500/25',
              )}
            >
              {difficultyTierLabel(normalizeCourseDifficultyTier(course.difficulty_tier), isEnglishCopy)}
            </span>
            {isSoftLandingPreview ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold tracking-wide border border-emerald-400/30">
                {isEnglishCopy ? 'Block 1 free' : '第1ブロック無料'}
              </span>
            ) : course.premium_only ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold tracking-wide">
                Premium
              </span>
            ) : null}
            {isDenied && <FaLock className="text-xs text-gray-500" />}
            {isCompleted && <FaCheck className="text-sm text-emerald-400" />}
          </div>
          {cardInteractive && (
            <FaChevronRight className="text-gray-500 group-hover:text-violet-200 transition-colors shrink-0 mt-1" />
          )}
        </div>

        <h3 className="font-semibold mb-1.5 line-clamp-2 text-base">
          {courseDisplayTitle(course, isEnglishCopy)}
        </h3>

        {courseDesc && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{courseDesc}</p>
        )}

        {isDenied && accessResult.reason && (
          <p className="text-[11px] text-orange-300/80 mb-3">{accessResult.reason}</p>
        )}

        <div className="mt-auto">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
            <span>
              {count} {isEnglishCopy ? 'quests' : 'クエスト'}
            </span>
            <span className={isCompleted ? 'text-emerald-400 font-medium' : ''}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-900/70 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isCompleted ? 'bg-emerald-500' : 'bg-violet-500')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col text-white bg-gradient-game">
      <GameHeader />
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-5 py-4 sm:py-5 space-y-4">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">
                {isEnglishCopy ? 'Courses' : 'コース'}
              </h1>
              <p className="text-sm text-violet-200/70">
                {isEnglishCopy ? 'Choose focused courses outside the main quest.' : 'メインクエスト以外のコースを選べます。'}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {COURSE_DIFFICULTY_TIER_ORDER.map(tier => {
                  const list = coursesByTier.get(tier) ?? [];
                  if (list.length === 0) return null;
                  const barClass =
                    tier === 'tutorial'
                      ? 'bg-cyan-500'
                      : tier === 'beginner'
                        ? 'bg-emerald-500'
                        : tier === 'intermediate'
                          ? 'bg-amber-500'
                          : 'bg-rose-500';
                  return (
                    <section key={tier}>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className={`w-1 h-5 ${barClass} rounded-full`} />
                        {difficultyTierLabel(tier, isEnglishCopy)}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {list.map(renderCourseCard)}
                      </div>
                    </section>
                  );
                })}

                {visibleSpecificCourses.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <p>{isEnglishCopy ? 'No courses available.' : '利用可能なコースがありません。'}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglishCopy} source="lesson_list" />
    </div>
  );
};

export default CourseListPage;
