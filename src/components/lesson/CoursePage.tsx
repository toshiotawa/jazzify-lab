import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { lessonDisplayTitle } from '@/utils/lessonCopy';
import { useGeoStore } from '@/stores/geoStore';
import { FaLock, FaCheck, FaStar, FaChevronRight, FaArrowLeft } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import { LessonRequirementProgress, fetchAggregatedRequirementsProgress } from '@/platform/supabaseLessonRequirements';
import { clearNavigationCacheForCourse } from '@/utils/lessonNavigation';
import { buildLessonAccessGraph, LessonAccessGraph } from '@/utils/lessonAccess';

const CoursePage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [lessonRequirementsProgress, setLessonRequirementsProgress] = useState<Record<string, LessonRequirementProgress[]>>({});
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollToIncomplete = useRef(true);

  const { profile } = useAuthStore();
  const toast = useToast();
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const base = hash.split('?')[0];
      if (base === '#course') {
        setOpen(true);
        const params = new URLSearchParams(hash.split('?')[1] || '');
        setCourseId(params.get('id'));
      } else {
        setOpen(false);
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
        const [courseData, completedCourses] = await Promise.all([
          fetchCourseById(courseId),
          fetchUserCompletedCourses(profile.id),
        ]);

        if (cancelled) return;
        if (!courseData) {
          toast.error(isEnglishCopy ? 'Course not found' : 'コースが見つかりません');
          window.location.hash = '#lessons';
          return;
        }

        const accessResult = canAccessCourse(courseData, profile.rank, completedCourses, isEnglishCopy);
        if (!accessResult.canAccess) {
          toast.warning(accessResult.reason || (isEnglishCopy ? 'Cannot access this course' : 'このコースにはアクセスできません'));
          window.location.hash = '#lessons';
          return;
        }

        setCourse(courseData);
        setCompletedCourseIds(completedCourses);
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

        const block1Lessons = lessonsData.filter(l => (l.block_number || 1) === 1);
        for (const lesson of block1Lessons) {
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
  }, [open, courseId, profile?.id, isEnglishCopy]);

  useEffect(() => {
    if (!open || !courseId) return;
    const shouldMonitor = profile?.isAdmin || profile?.rank === 'premium' || profile?.rank === 'platinum' || profile?.rank === 'black';
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
  }, [open, courseId, profile?.isAdmin, profile?.rank]);

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
      userRank: profile?.rank,
    });
  }, [lessons, progress, profile?.rank]);

  useEffect(() => {
    if (!shouldScrollToIncomplete.current || lessons.length === 0 || loading) return;
    shouldScrollToIncomplete.current = false;

    const sorted = [...lessons].sort((a, b) => {
      const ba = a.block_number || 1;
      const bb = b.block_number || 1;
      return ba !== bb ? ba - bb : a.order_index - b.order_index;
    });

    const first = sorted.find(l => !(lessonAccessGraph.lessonStates[l.id]?.isCompleted));
    if (first && scrollRef.current) {
      requestAnimationFrame(() => {
        const el = scrollRef.current?.querySelector(`[data-lesson-id="${first.id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [lessons, loading, lessonAccessGraph]);

  const groupLessonsByBlock = (items: Lesson[]) => {
    const blocks: Record<number, Lesson[]> = {};
    const blockNames: Record<number, string> = {};
    items.forEach(lesson => {
      const bn = lesson.block_number || 1;
      if (!blocks[bn]) blocks[bn] = [];
      blocks[bn].push(lesson);
      if (!blockNames[bn]) {
        if (isEnglishCopy) {
          if (lesson.block_name_en) blockNames[bn] = lesson.block_name_en;
          else if (lesson.block_name) blockNames[bn] = lesson.block_name;
        } else if (lesson.block_name) {
          blockNames[bn] = lesson.block_name;
        }
      }
    });
    return { blocks, blockNames };
  };

  const getLessonCompletionRate = (lesson: Lesson): number => {
    const reqs = lessonRequirementsProgress[lesson.id] || [];
    if (reqs.length === 0) return 0;
    return Math.round((reqs.filter(r => r.is_completed).length / reqs.length) * 100);
  };

  const handleLessonClick = (lesson: Lesson) => {
    const state = lessonAccessGraph.lessonStates[lesson.id];
    if (!state?.isUnlocked) {
      toast.warning(isEnglishCopy ? 'This lesson is not yet unlocked' : 'このレッスンはまだ解放されていません');
      return;
    }
    window.location.hash = `#lesson-detail?id=${lesson.id}`;
  };

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
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <button
              className="hover:text-white transition-colors flex items-center gap-1.5"
              onClick={() => { window.location.hash = '#lessons'; }}
            >
              <FaArrowLeft className="text-xs" />
              {isEnglishCopy ? 'Lessons' : 'レッスン'}
            </button>
            <span>/</span>
            <span className="text-white truncate">
              {course ? courseDisplayTitle(course, isEnglishCopy) : '...'}
            </span>
          </nav>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">
                  {isEnglishCopy ? 'Loading...' : '読み込み中...'}
                </p>
              </div>
            </div>
          ) : course ? (
            <>
              {/* Course header */}
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {course.is_tutorial && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          Tutorial
                        </span>
                      )}
                      {course.premium_only && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold">
                          Premium
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl font-bold">{courseDisplayTitle(course, isEnglishCopy)}</h1>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-bold text-primary-400">{courseProgress}%</span>
                    <p className="text-xs text-gray-400">
                      {completedLessons}/{totalLessons} {isEnglishCopy ? 'completed' : '完了'}
                    </p>
                  </div>
                </div>
                {courseDesc && (
                  <p className="text-sm text-gray-400">{courseDesc}</p>
                )}
                <div className="mt-3 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      courseProgress === 100 ? 'bg-emerald-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${courseProgress}%` }}
                  />
                </div>
              </div>

              {/* Blocks */}
              <div className="space-y-5">
                {(() => {
                  const { blocks, blockNames } = groupLessonsByBlock(lessons);
                  return Object.entries(blocks).map(([blockNumber, blockLessons]) => {
                    const blockNum = parseInt(blockNumber);
                    const blockState = lessonAccessGraph.blockStates[blockNum];
                    const isBlockUnlocked = blockState?.isUnlocked ?? false;
                    const isBlockCompleted = blockState?.isCompleted ?? false;

                    return (
                      <div key={blockNum} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-base font-semibold">
                            {blockNames[blockNum] || `${isEnglishCopy ? 'Block' : 'ブロック'} ${blockNum}`}
                          </h3>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            isBlockCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isBlockUnlocked
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-slate-700/50 text-gray-500 border border-slate-600/30'
                          }`}>
                            {isBlockCompleted
                              ? (isEnglishCopy ? 'Completed' : '完了')
                              : isBlockUnlocked
                                ? (isEnglishCopy ? 'In Progress' : '進行中')
                                : (isEnglishCopy ? 'Locked' : '未解放')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {blockLessons
                            .sort((a, b) => a.order_index - b.order_index)
                            .map(lesson => {
                              const accessState = lessonAccessGraph.lessonStates[lesson.id];
                              const unlocked = accessState?.isUnlocked ?? false;
                              const completed = accessState?.isCompleted ?? (progress[lesson.id]?.completed || false);
                              const completionRate = getLessonCompletionRate(lesson);

                              return (
                                <button
                                  key={lesson.id}
                                  data-lesson-id={lesson.id}
                                  className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                                    unlocked
                                      ? completed
                                        ? 'border-emerald-500/30 bg-emerald-900/10 hover:bg-emerald-900/20'
                                        : 'border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 hover:border-primary-500/40'
                                      : 'border-slate-700/30 bg-slate-800/20 opacity-50 cursor-not-allowed'
                                  }`}
                                  onClick={() => handleLessonClick(lesson)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                                      completed
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : unlocked
                                          ? 'bg-primary-500/20 text-primary-400'
                                          : 'bg-slate-700/50 text-gray-500'
                                    }`}>
                                      {completed ? <FaCheck /> : unlocked ? (lesson.order_index + 1) : <FaLock className="text-xs" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-medium text-sm truncate ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                                          {lessonDisplayTitle(lesson, isEnglishCopy)}
                                        </span>
                                        {completed && <FaStar className="text-xs text-yellow-400 shrink-0" />}
                                      </div>
                                      {unlocked && !completed && completionRate > 0 && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <div className="flex-1 h-1 bg-slate-700/80 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-primary-500 rounded-full transition-all"
                                              style={{ width: `${completionRate}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] text-gray-400">{completionRate}%</span>
                                        </div>
                                      )}
                                    </div>

                                    {unlocked && (
                                      <FaChevronRight className="text-xs text-gray-500 shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
