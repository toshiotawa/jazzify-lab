import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Course, Lesson } from '@/types';
import { fetchCourseById, canAccessCourse, fetchUserCompletedCourses } from '@/platform/supabaseCourses';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgress, unlockLesson, LessonProgress } from '@/platform/supabaseLessonProgress';
import { subscribeRealtime } from '@/platform/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { courseDisplayDescription, courseDisplayTitle } from '@/utils/courseCopy';
import { useGeoStore } from '@/stores/geoStore';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { shouldIncludeDeveloperLessonCoursesForUser } from '@/utils/environment';
import { FaArrowLeft } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import { LessonRequirementProgress, fetchAggregatedRequirementsProgress } from '@/platform/supabaseLessonRequirements';
import { clearNavigationCacheForCourse } from '@/utils/lessonNavigation';
import { buildLessonAccessGraph, LessonAccessGraph } from '@/utils/lessonAccess';
import LessonJourneyMap from './journey/LessonJourneyMap';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';

const CoursePage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [focusLessonId, setFocusLessonId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [lessonRequirementsProgress, setLessonRequirementsProgress] = useState<Record<string, LessonRequirementProgress[]>>({});
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

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const base = hash.split('?')[0];
      if (base === '#course') {
        setOpen(true);
        const params = new URLSearchParams(hash.split('?')[1] || '');
        setCourseId(params.get('id'));
        setFocusLessonId(params.get('focus'));
      } else {
        setOpen(false);
        setFocusLessonId(null);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (!open || !courseId || !profile) return;
    let cancelled = false;

    const loadCourseData = async () => {
      setLoading(true);
      try {
        const includeDevCourses = shouldIncludeDeveloperLessonCoursesForUser(profile.isAdmin);
        const [courseData, completedCourses] = await Promise.all([
          fetchCourseById(courseId, { includeDeveloperCourses: includeDevCourses }),
          fetchUserCompletedCourses(profile.id, { includeDeveloperCourses: includeDevCourses }),
        ]);

        if (cancelled) return;
        if (!courseData) {
          toast.error(isEnglishCopy ? 'Course not found' : 'コースが見つかりません');
          window.location.hash = '#lessons';
          return;
        }

        const accessResult = canAccessCourse(courseData, effectiveRank, completedCourses, isEnglishCopy);
        if (!accessResult.canAccess) {
          toast.warning(accessResult.reason || (isEnglishCopy ? 'Cannot access this course' : 'このコースにはアクセスできません'));
          window.location.hash = '#lessons';
          return;
        }

        if (courseData.is_main_course === true) {
          window.location.hash = '#lessons';
          return;
        }

        setCourse(courseData);
        clearNavigationCacheForCourse(courseId);

        const [lessonsData, progressData] = await Promise.all([
          fetchLessonsByCourse(courseId),
          fetchUserLessonProgress(courseId),
        ]);

        if (cancelled) return;
        setLessons(lessonsData);

        const progressMap: Record<string, LessonProgress> = {};
        progressData.forEach((p: LessonProgress) => {
          progressMap[p.lesson_id] = p;
        });

        const sortedForUnlock = [...lessonsData].sort((a, b) => {
          const blockA = a.block_number ?? 1;
          const blockB = b.block_number ?? 1;
          if (blockA !== blockB) return blockA - blockB;
          return a.order_index - b.order_index;
        });
        const firstUnlockLessons = courseData.is_main_course
          ? sortedForUnlock.slice(0, 1)
          : lessonsData.filter(l => (l.block_number || 1) === 1);
        for (const lesson of firstUnlockLessons) {
          if (!progressMap[lesson.id]) {
            try {
              await unlockLesson(lesson.id, courseId);
            } catch {
              // ignore
            }
          }
        }

        const updatedProgressData = await fetchUserLessonProgress(courseId);
        if (cancelled) return;

        const updatedMap: Record<string, LessonProgress> = {};
        updatedProgressData.forEach((p: LessonProgress) => {
          updatedMap[p.lesson_id] = p;
        });
        setProgress(updatedMap);

        const lessonIds = lessonsData.map(l => l.id);
        const reqMap = await fetchAggregatedRequirementsProgress(lessonIds);
        if (!cancelled) setLessonRequirementsProgress(reqMap);
      } catch {
        toast.error(isEnglishCopy ? 'Failed to load course data' : 'コースデータの読み込みに失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCourseData();
    return () => { cancelled = true; };
  }, [open, courseId, profile?.id, profile?.isAdmin, isEnglishCopy, effectiveRank]);

  useEffect(() => {
    if (!open || !courseId) return;
    const shouldMonitor = profile?.isAdmin || effectiveRank === 'premium' || effectiveRank === 'platinum' || effectiveRank === 'black';
    if (!shouldMonitor) return;

    const unsubLessons = subscribeRealtime('lesson-changes', 'lessons', '*', () => {
      if (courseId) void reloadLessons(courseId);
    }, { clearCache: false });

    const unsubSongs = subscribeRealtime('lesson-songs-changes', 'lesson_songs', '*', () => {
      if (courseId) void reloadLessons(courseId);
    }, { clearCache: false });

    const unsubReqs = subscribeRealtime('lesson-reqs-progress', 'user_lesson_requirements_progress', '*', async () => {
      if (!courseId) return;
      try {
        const { clearCacheByPattern } = await import('@/platform/supabaseClient');
        clearCacheByPattern(/lesson_req_progress:/);
        const lessonList = await fetchLessonsByCourse(courseId);
        const map = await fetchAggregatedRequirementsProgress(lessonList.map(l => l.id), { forceRefresh: true });
        setLessonRequirementsProgress(map);
      } catch { /* ignore */ }
    }, { clearCache: false });

    return () => { unsubLessons(); unsubSongs(); unsubReqs(); };
  }, [open, courseId, profile?.isAdmin, effectiveRank]);

  const reloadLessons = async (cId: string) => {
    try {
      const [lessonsData, progressData] = await Promise.all([
        fetchLessonsByCourse(cId),
        fetchUserLessonProgress(cId),
      ]);
      setLessons(lessonsData);
      const map: Record<string, LessonProgress> = {};
      progressData.forEach((p: LessonProgress) => { map[p.lesson_id] = p; });
      setProgress(map);
    } catch { /* ignore */ }
  };

  const lessonAccessGraph = useMemo<LessonAccessGraph>(() => {
    if (lessons.length === 0) return { lessonStates: {}, blockStates: {} };
    return buildLessonAccessGraph({
      lessons,
      progressMap: progress as Record<string, LessonProgress | undefined>,
      userRank: effectiveRank,
      enforceSequentialWithinBlocks: course?.is_main_course === true,
    });
  }, [lessons, progress, effectiveRank, course?.is_main_course]);

  const handleStartLesson = useCallback((lessonId: string) => {
    const state = lessonAccessGraph.lessonStates[lessonId];
    if (!state?.isUnlocked) {
      toast.warning(
        isEnglishCopy ? 'This quest is not yet unlocked' : 'このクエストはまだ解放されていません',
      );
      return;
    }
    window.location.hash = `#lesson-detail?id=${lessonId}`;
  }, [lessonAccessGraph, toast, isEnglishCopy]);

  if (!open) return null;

  if (!profile) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">
            {isEnglishCopy ? 'Login required' : 'ログインが必要です'}
          </h4>
          <button
            className="btn btn-sm btn-primary w-full"
            onClick={() => { window.location.hash = '#login'; }}
          >
            {isEnglishCopy ? 'Log In / Sign Up' : 'ログイン / 会員登録'}
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  const completedLessons = Object.values(progress).filter(p => p.completed).length;
  const totalLessons = lessons.length;
  const courseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const courseDesc = course ? courseDisplayDescription(course, isEnglishCopy) : undefined;

  return (
    <div
      className="w-full h-full flex flex-col text-white"
      style={{
        background: 'linear-gradient(to top, #050315 0%, #0b0624 45%, #150a32 100%)',
      }}
    >
      <GameHeader />
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-[1700px] mx-auto px-3 sm:px-5 py-4 space-y-4">
          <nav className="flex items-center gap-2 text-sm text-violet-200/75">
            <button
              className="hover:text-violet-100 transition-colors flex items-center gap-1.5"
              onClick={() => { window.location.hash = '#lessons'; }}
            >
              <FaArrowLeft className="text-xs" />
              {isEnglishCopy ? 'Quests' : 'クエスト'}
            </button>
            <span className="opacity-50">/</span>
            <span className="text-violet-50 truncate">
              {course ? courseDisplayTitle(course, isEnglishCopy) : '...'}
            </span>
          </nav>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-violet-200/75">
                  {isEnglishCopy ? 'Loading...' : '読み込み中...'}
                </p>
              </div>
            </div>
          ) : course ? (
            <>
              <div className="rounded-2xl border border-violet-400/20 bg-[rgba(15,8,42,0.6)] backdrop-blur-sm p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {course.is_tutorial && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          Tutorial
                        </span>
                      )}
                      {course.premium_only && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
                          Premium
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-violet-50 truncate">
                      {courseDisplayTitle(course, isEnglishCopy)}
                    </h1>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-bold text-amber-200">{courseProgress}%</span>
                    <p className="text-xs text-violet-200/70">
                      {completedLessons}/{totalLessons} {isEnglishCopy ? 'completed' : '完了'}
                    </p>
                  </div>
                </div>
                {courseDesc && (
                  <p className="text-sm text-violet-100/75">{courseDesc}</p>
                )}
                <div className="mt-3 h-1.5 bg-slate-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${courseProgress}%`,
                      background: courseProgress === 100
                        ? 'linear-gradient(to right, #7de3a7, #3ecf9b)'
                        : 'linear-gradient(to right, #c4b5fd, #8b5cf6)',
                    }}
                  />
                </div>
              </div>

              <LessonJourneyMap
                course={course}
                lessons={lessons}
                accessGraph={lessonAccessGraph}
                requirementsProgress={lessonRequirementsProgress}
                isEnglishCopy={isEnglishCopy}
                focusLessonId={focusLessonId}
                onStartLesson={handleStartLesson}
              />
            </>
          ) : null}
        </div>
      </div>
      <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
    </div>
  );
};

export default CoursePage;
