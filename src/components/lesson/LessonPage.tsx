import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Course } from '@/types';
import { fetchCoursesWithDetails, fetchUserCompletedCourses, canAccessCourse } from '@/platform/supabaseCourses';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgressAll } from '@/platform/supabaseLessonProgress';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { courseDisplayDescription, courseDisplayTitle } from '@/utils/courseCopy';
import { useGeoStore } from '@/stores/geoStore';
import { FaLock, FaCheck, FaGraduationCap, FaChevronRight } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';

const LessonPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [allCoursesProgress, setAllCoursesProgress] = useState<Record<string, number>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { profile, isGuest } = useAuthStore();
  const toast = useToast();
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  useEffect(() => {
    const checkHash = () => {
      setOpen(window.location.hash === '#lessons');
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (!open || !profile) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const [coursesData, completedCourses] = await Promise.all([
          fetchCoursesWithDetails(),
          fetchUserCompletedCourses(profile.id),
        ]);

        const audienceFilter = isEnglishCopy ? 'global' : 'japan';
        const sorted = coursesData
          .filter(c => {
            const a = c.audience || 'both';
            return a === 'both' || a === audienceFilter;
          })
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        if (cancelled) return;
        setCourses(sorted);
        setCompletedCourseIds(completedCourses);

        const [allProgress, lessonsByCourse] = await Promise.all([
          fetchUserLessonProgressAll(),
          Promise.all(sorted.map(c => fetchLessonsByCourse(c.id))),
        ]);

        if (cancelled) return;

        const counts: Record<string, number> = {};
        const completedCountByCourse: Record<string, number> = {};

        sorted.forEach((c, idx) => {
          counts[c.id] = lessonsByCourse[idx].length;
        });

        allProgress.forEach(p => {
          if (!completedCountByCourse[p.course_id]) completedCountByCourse[p.course_id] = 0;
          if (p.completed) completedCountByCourse[p.course_id]++;
        });

        const progressMap: Record<string, number> = {};
        sorted.forEach(c => {
          const total = counts[c.id] || 0;
          const completed = completedCountByCourse[c.id] || 0;
          progressMap[c.id] = total > 0 ? Math.round((completed / total) * 100) : 0;
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
  }, [open, profile?.id]);

  const tutorialCourses = useMemo(
    () => courses.filter(c => c.is_tutorial),
    [courses],
  );
  const regularCourses = useMemo(
    () => courses.filter(c => !c.is_tutorial),
    [courses],
  );

  if (!open) return null;

  if (!profile || isGuest) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">
            {isEnglishCopy ? 'Lessons require login' : 'レッスンはログインユーザー専用です'}
          </h4>
          <p className="text-center text-gray-300">
            {isEnglishCopy ? 'Please log in to access lessons.' : 'レッスン機能を利用するにはログインが必要です。'}
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
    const accessResult = canAccessCourse(course, profile?.rank || 'free', completedCourseIds, isEnglishCopy);
    const accessible = accessResult.canAccess;
    const progress = allCoursesProgress[course.id] ?? 0;
    const count = lessonCounts[course.id] ?? 0;
    const isCompleted = progress === 100;
    const courseDesc = courseDisplayDescription(course, isEnglishCopy);

    return (
      <button
        key={course.id}
        className={`group relative text-left w-full rounded-xl border-2 p-5 transition-all duration-200 ${
          isCompleted
            ? 'border-emerald-500/40 bg-emerald-900/10 hover:bg-emerald-900/20'
            : accessible
              ? 'border-slate-600/60 bg-slate-800/60 hover:bg-slate-700/60 hover:border-primary-500/50'
              : 'border-slate-700/40 bg-slate-800/30 opacity-60 cursor-not-allowed'
        }`}
        onClick={() => {
          if (accessible) {
            window.location.hash = `#course?id=${course.id}`;
          } else {
            toast.warning(accessResult.reason || (isEnglishCopy ? 'Cannot access this course' : 'このコースにはアクセスできません'));
          }
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {course.is_tutorial && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold tracking-wide border border-cyan-500/30">
                Tutorial
              </span>
            )}
            {course.premium_only && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold tracking-wide">
                Premium
              </span>
            )}
            {!accessible && <FaLock className="text-xs text-gray-500" />}
            {isCompleted && <FaCheck className="text-sm text-emerald-400" />}
          </div>
          {accessible && (
            <FaChevronRight className="text-gray-500 group-hover:text-primary-400 transition-colors shrink-0 mt-1" />
          )}
        </div>

        <h3 className="font-semibold text-base mb-1.5 line-clamp-1">
          {courseDisplayTitle(course, isEnglishCopy)}
        </h3>

        {courseDesc && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{courseDesc}</p>
        )}

        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {course.prerequisites.map(prereq => (
              <span
                key={prereq.prerequisite_course_id}
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  completedCourseIds.includes(prereq.prerequisite_course_id)
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-600/40'
                    : 'bg-orange-600/30 text-orange-300 border border-orange-600/40'
                }`}
              >
                {courseDisplayTitle(prereq.prerequisite_course, isEnglishCopy)}
              </span>
            ))}
          </div>
        )}

        {!accessible && accessResult.reason && (
          <p className="text-[11px] text-orange-300/80 mb-3">{accessResult.reason}</p>
        )}

        <div className="mt-auto">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
            <span>
              {count} {isEnglishCopy ? 'lessons' : 'レッスン'}
            </span>
            <span className={isCompleted ? 'text-emerald-400 font-medium' : ''}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500' : 'bg-primary-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-600/20 border border-primary-500/30">
              <FaGraduationCap className="text-xl text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {isEnglishCopy ? 'Lessons' : 'レッスン'}
              </h1>
              <p className="text-sm text-gray-400">
                {isEnglishCopy
                  ? 'Learn systematically from basics to advanced topics'
                  : '基礎から応用まで体系的に学びましょう'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">
                  {isEnglishCopy ? 'Loading...' : '読み込み中...'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {tutorialCourses.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-cyan-500 rounded-full" />
                    {isEnglishCopy ? 'Getting Started' : 'はじめに'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutorialCourses.map(renderCourseCard)}
                  </div>
                </section>
              )}

              {regularCourses.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary-500 rounded-full" />
                    {isEnglishCopy ? 'Courses' : 'コース'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularCourses.map(renderCourseCard)}
                  </div>
                </section>
              )}

              {courses.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p>{isEnglishCopy ? 'No courses available.' : '利用可能なコースがありません。'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
