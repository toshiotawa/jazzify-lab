import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Course, Lesson } from '@/types';
import { fetchCoursesWithDetails, fetchUserCompletedCourses, fetchUserCourseUnlockStatus, canAccessCourse } from '@/platform/supabaseCourses';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgress, unlockLesson, LessonProgress, fetchUserLessonProgressAll } from '@/platform/supabaseLessonProgress';
import { subscribeRealtime } from '@/platform/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { 
  FaLock, 
  FaUnlock,
  FaCheck, 
  FaStar, 
  FaGraduationCap
} from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import { LessonRequirementProgress, fetchAggregatedRequirementsProgress } from '@/platform/supabaseLessonRequirements';
import { clearNavigationCacheForCourse } from '@/utils/lessonNavigation';
import { buildLessonAccessGraph, LessonAccessGraph } from '@/utils/lessonAccess';
import { useHighQualityPianoPreload } from '@/hooks/useHighQualityPianoPreload';

/**
 * レッスン学習画面
 * Hash: #lessons で表示
 */
const LessonPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [lessonRequirementsProgress, setLessonRequirementsProgress] = useState<Record<string, LessonRequirementProgress[]>>({});
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [courseUnlockStatus, setCourseUnlockStatus] = useState<Record<string, boolean | null>>({});
  const [allCoursesProgress, setAllCoursesProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { profile, isGuest } = useAuthStore();
  const toast = useToast();
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const lessonAccessGraph = useMemo<LessonAccessGraph>(() => {
    if (lessons.length === 0) {
      return { lessonStates: {}, blockStates: {} };
    }
    return buildLessonAccessGraph({
      lessons,
      progressMap: progress as Record<string, LessonProgress | undefined>,
      userRank: profile?.rank,
    });
  }, [lessons, progress, profile?.rank]);
  useHighQualityPianoPreload();

  useEffect(() => {
    const checkHash = () => {
      const isLessonsPage = window.location.hash === '#lessons';
      const wasOpen = open;
      setOpen(isLessonsPage);
      
      // レッスン詳細から戻ってきた場合は強制再読み込み
      if (isLessonsPage && !wasOpen && profile && selectedCourse) {
        // ナビゲーションキャッシュをクリア
        clearNavigationCacheForCourse(selectedCourse.id);
        loadLessons(selectedCourse.id);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [open, profile, selectedCourse]);

  // 重複呼び出し防止: selectedCourse変更時に一度だけ実行
  useEffect(() => {
    if (selectedCourse?.id) {
      loadLessons(selectedCourse.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.id]);

  // リアルタイム更新監視を追加（最適化版）
  useEffect(() => {
    // 最適化: レッスンページが開いている場合のみ監視
    if (!open || !selectedCourse) return;

    // 最適化: 管理者またはレッスン編集権限がある場合のみ監視
    const shouldMonitor = profile?.isAdmin || profile?.rank === 'premium' || profile?.rank === 'platinum' || profile?.rank === 'black';
    if (!shouldMonitor) return;

    // レッスンテーブルの変更を監視（最適化: キャッシュクリアを最小限に）
    const unsubscribeLessons = subscribeRealtime(
      'lesson-changes',
      'lessons',
      '*',
      (_payload: unknown) => {
        // データが変更されたら現在のコースのレッスンを再読み込み
        if (selectedCourse) {
          loadLessons(selectedCourse.id);
        }
      },
      { clearCache: false } // キャッシュクリアを無効化
    );

    // lesson_songsテーブルの変更も監視（最適化: キャッシュクリアを最小限に）
    const unsubscribeLessonSongs = subscribeRealtime(
      'lesson-songs-changes',
      'lesson_songs',
      '*',
      (_payload: unknown) => {
        if (selectedCourse) {
          loadLessons(selectedCourse.id);
        }
      },
      { clearCache: false } // キャッシュクリアを無効化
    );

    // 要件進捗の変更（user_lesson_requirements_progress）を監視し、該当キャッシュをピンポイント無効化
    const unsubscribeReqs = subscribeRealtime(
      'lesson-reqs-progress',
      'user_lesson_requirements_progress',
      '*',
      async (_payload: unknown) => {
        try {
          const { clearCacheByPattern } = await import('@/platform/supabaseClient');
          // 現在のコースのレッスンIDに関する集約キャッシュのみ無効化
          if (selectedCourse) {
            const lessons = await fetchLessonsByCourse(selectedCourse.id);
            const lessonIds = lessons.map(l => l.id).sort();
            const pattern = new RegExp(`multiple_lesson_requirements_progress:.*:${lessonIds.join(',')}`);
            clearCacheByPattern(pattern);
            // 画面の要件進捗を再取得
            const map = await fetchAggregatedRequirementsProgress(lessonIds, { forceRefresh: true });
            setLessonRequirementsProgress(map);
          }
        } catch {}
      },
      { clearCache: false }
    );

    return () => {
      unsubscribeLessons();
      unsubscribeLessonSongs();
      unsubscribeReqs();
    };
  }, [open, selectedCourse, profile?.isAdmin, profile?.rank]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, completedCourses, unlockStatus] = await Promise.all([
        fetchCoursesWithDetails(),
        profile ? fetchUserCompletedCourses(profile.id) : Promise.resolve([]),
        profile ? fetchUserCourseUnlockStatus(profile.id) : Promise.resolve({} as Record<string, boolean | null>)
      ]);
      
      // 並び順でソート
      const sortedCourses = coursesData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      // すべてのコースを表示（アクセス制限は表示側で処理）
      setCourses(sortedCourses);
      setCompletedCourseIds(completedCourses);
      setCourseUnlockStatus(unlockStatus);
      
      // 全コースの進捗データを一括取得して完了率を計算（N→1クエリ）
      if (profile) {
        try {
          const [allProgress, lessonsByCourse] = await Promise.all([
            fetchUserLessonProgressAll(),
            Promise.all(sortedCourses.map(c => fetchLessonsByCourse(c.id)))
          ]);

          const lessonsCountByCourse: Record<string, number> = {};
          sortedCourses.forEach((c, idx) => {
            lessonsCountByCourse[c.id] = lessonsByCourse[idx].length;
          });

          const completedCountByCourse: Record<string, number> = {};
          allProgress.forEach(p => {
            if (!completedCountByCourse[p.course_id]) completedCountByCourse[p.course_id] = 0;
            if (p.completed) completedCountByCourse[p.course_id]++;
          });

          const progressMap: Record<string, number> = {};
          sortedCourses.forEach(c => {
            const total = lessonsCountByCourse[c.id] || 0;
            const completed = completedCountByCourse[c.id] || 0;
            progressMap[c.id] = total > 0 ? Math.round((completed / total) * 100) : 0;
          });

          setAllCoursesProgress(progressMap);
        } catch (error) {
          console.error('Error loading course progress data:', error);
        }
      }
      
      // アクセス可能な最初のコースを選択
      const firstAccessibleCourse = sortedCourses.find(course => {
        const courseUnlockFlag = unlockStatus[course.id] !== undefined ? unlockStatus[course.id] : null;
        const accessResult = canAccessCourse(course, profile?.rank || 'free', completedCourses, courseUnlockFlag);
        return accessResult.canAccess;
      });
      if (firstAccessibleCourse) {
        setSelectedCourse(firstAccessibleCourse);
      }
    } catch (e: any) {
      toast.error('コースの読み込みに失敗しました');
      console.error('Error loading courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && profile) {
      loadData();
    }
  }, [open, profile]);

  const loadLessons = async (courseId: string) => {
    try {
      const [lessonsData, progressData, requirementsMap] = await Promise.all([
        fetchLessonsByCourse(courseId),
        fetchUserLessonProgress(courseId),
        fetchLessonsByCourse(courseId).then(lessonList => {
          const lessonIds = lessonList.map(lesson => lesson.id);
          return fetchAggregatedRequirementsProgress(lessonIds);
        }),
      ]);

      setLessonRequirementsProgress(requirementsMap);
      setLessons(lessonsData);

      if (lessonsData.length === 0 && lessons.length > 0) {
        const { clearSupabaseCache } = await import('@/platform/supabaseClient');
        clearSupabaseCache();

        setTimeout(async () => {
          try {
            const retryLessonsData = await fetchLessonsByCourse(courseId);
            const retryLessonIds = retryLessonsData.map(lesson => lesson.id);
            const retryRequirementsMap = await fetchAggregatedRequirementsProgress(retryLessonIds, { forceRefresh: true });

            setLessons(retryLessonsData);
            setLessonRequirementsProgress(retryRequirementsMap);

            const retryProgressData = await fetchUserLessonProgress(courseId);
            const retryProgressMap: Record<string, LessonProgress> = {};
            retryProgressData.forEach((p: LessonProgress) => {
              retryProgressMap[p.lesson_id] = p;
            });
            setProgress(retryProgressMap);
          } catch (retryError) {
            console.error('Retry loading failed:', retryError);
          }
        }, 100);
        return;
      }

      const progressMap: Record<string, LessonProgress> = {};
      progressData.forEach((p: LessonProgress) => {
        progressMap[p.lesson_id] = p;
      });

      const block1Lessons = lessonsData.filter(lesson => (lesson.block_number || 1) === 1);

      for (const lesson of block1Lessons) {
        if (!progressMap[lesson.id]) {
          try {
            await unlockLesson(lesson.id, courseId);
          } catch (e) {
            console.error('Failed to auto-unlock block 1 lesson:', e);
          }
        }
      }

      const updatedProgressData = await fetchUserLessonProgress(courseId);
      const updatedProgressMap: Record<string, LessonProgress> = {};
      updatedProgressData.forEach((p: LessonProgress) => {
        updatedProgressMap[p.lesson_id] = p;
      });

      setProgress(updatedProgressMap);

      if (lessonsData.length > 0) {
        const completedCount = updatedProgressData.filter(p => p.completed).length;
        const completionRate = Math.round((completedCount / lessonsData.length) * 100);
        setAllCoursesProgress(prev => ({
          ...prev,
          [courseId]: completionRate,
        }));
      }
    } catch (e: any) {
      toast.error('レッスンデータの読み込みに失敗しました');
      console.error('Error loading lessons:', e);
    }
  };
  const getLessonCompletionRate = (lesson: Lesson): number => {
    const requirements = lessonRequirementsProgress[lesson.id] || [];
    if (requirements.length === 0) return 0;
    
    const completedCount = requirements.filter(req => req.is_completed).length;
    return Math.round((completedCount / requirements.length) * 100);
  };

  const getCourseCompletionRate = (course: Course): number => {
    // 事前計算されたコース進捗データから取得
    if (allCoursesProgress[course.id] !== undefined) {
      return allCoursesProgress[course.id];
    }
    
    // 選択中のコースで詳細データが利用可能な場合は計算
    if (course.id === selectedCourse?.id && lessons.length > 0) {
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter(lesson => progress[lesson.id]?.completed).length;
      return Math.round((completedLessons / totalLessons) * 100);
    }
    
    // デフォルトは0%
    return 0;
  };

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  const handleLessonClick = (lesson: Lesson) => {
    const accessState = lessonAccessGraph.lessonStates[lesson.id];
    if (!accessState?.isUnlocked) {
      toast.warning('このレッスンはまだ解放されていません');
      return;
    }

    window.location.hash = `#lesson-detail?id=${lesson.id}`;
  };

  const groupLessonsByBlock = (lessons: Lesson[]) => {
    const blocks: { [key: number]: Lesson[] } = {};
    lessons.forEach(lesson => {
      const blockNumber = lesson.block_number || 1;
      if (!blocks[blockNumber]) {
        blocks[blockNumber] = [];
      }
      blocks[blockNumber].push(lesson);
    });
    return blocks;
  };

  if (!open) return null;

  if (!profile || isGuest || profile.rank === 'standard_global') {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">レッスンはログインユーザー専用です</h4>
          <p className="text-center text-gray-300">レッスン機能を利用するにはログインが必要です。</p>
          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-sm btn-primary w-full" 
              onClick={() => { window.location.hash = '#login'; }}
            >
              ログイン / 会員登録
            </button>
            <button 
              className="btn btn-sm btn-outline w-full" 
              onClick={() => { window.location.href = '/main#dashboard'; }}
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
        <div className="bg-slate-900 text-white flex flex-col min-h-0">

          {/* ページ説明 */}
          <div className="px-6 pb-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center space-x-2 mb-1">
                <FaGraduationCap className="text-blue-400" />
                <h3 className="text-sm font-semibold">レッスンで体系的に学びましょう</h3>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm">
                コースからレッスンを選び、動画と実習で基礎から応用まで段階的に学習できます。前のブロックをクリアすると次が解放されます。
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">読み込み中...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* コース一覧サイドバー */}
              <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden min-h-0 md:h-full">
                <div className="p-4 border-b border-slate-700">
                  <h2 className="text-lg font-semibold">コース一覧</h2>
                </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
                    {courses.map((course: Course) => {
                      const courseUnlockFlag = courseUnlockStatus[course.id] !== undefined ? courseUnlockStatus[course.id] : null;
                      const accessResult = canAccessCourse(course, profile?.rank || 'free', completedCourseIds, courseUnlockFlag);
                      const accessible = accessResult.canAccess;
                      const manualUnlockBadgeVisible = accessResult.manualUnlockApplied === true;
                      const manualLockBadgeVisible = accessResult.manualLockApplied === true;

                      return (
                        <div
                          key={course.id}
                          className={`p-4 rounded-lg cursor-pointer transition-colors ${
                            selectedCourse?.id === course.id
                              ? 'bg-primary-600'
                              : accessible
                                ? 'bg-slate-700 hover:bg-slate-600'
                                : 'bg-slate-800 opacity-75'
                          }`}
                          onClick={() => {
                            if (accessible) {
                              setSelectedCourse(course);
                              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                setTimeout(() => {
                                  mainAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 50);
                              }
                            } else {
                              toast.warning(accessResult.reason || 'このコースにはアクセスできません');
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium truncate flex items-center gap-2">
                              {course.title}
                              {course.premium_only && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold tracking-wide">
                                  Premium
                                </span>
                              )}
                              {manualUnlockBadgeVisible && (
                                <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <FaUnlock className="text-xs" />
                                  管理者解放
                                </span>
                              )}
                              {manualLockBadgeVisible && (
                                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <FaLock className="text-xs" />
                                  管理者ロック
                                </span>
                              )}
                              {!accessible && courseUnlockFlag === null && <FaLock className="text-xs text-gray-400" />}
                            </h3>
                          </div>

                          {course.prerequisites && course.prerequisites.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-400 mb-1">前提コース:</p>
                              <div className="flex flex-wrap gap-1">
                                {course.prerequisites.map((prereq) => (
                                  <span
                                    key={prereq.prerequisite_course_id}
                                    className={`text-xs px-2 py-1 rounded ${
                                      completedCourseIds.includes(prereq.prerequisite_course_id)
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-orange-600 text-white'
                                    }`}
                                  >
                                    {prereq.prerequisite_course.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {!accessible && (
                            <div
                              className={`mb-2 p-2 rounded border ${
                                manualLockBadgeVisible
                                  ? 'bg-red-900/30 border-red-600'
                                  : 'bg-orange-900/30 border-orange-600'
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  manualLockBadgeVisible
                                    ? 'text-red-300'
                                    : 'text-orange-300'
                                }`}
                              >
                                {accessResult.reason || 'このコースには現在アクセスできません。'}
                              </p>
                            </div>
                          )}

                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>進捗</span>
                              <span>{getCourseCompletionRate(course)}%</span>
                            </div>
                            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${getCourseCompletionRate(course)}%` }}
                              />
                            </div>
                          </div>

                          {course.description && (
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* レッスン一覧メインエリア */}
              <div ref={mainAreaRef} className="flex-1 flex flex-col overflow-hidden min-h-0">
                {selectedCourse ? (
                  <>
                    <div className="p-6 border-b border-slate-700">
                      <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        {selectedCourse.title}
                        {selectedCourse.premium_only && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold tracking-wide">
                            Premium
                          </span>
                        )}
                      </h2>
                      {selectedCourse.description && (
                        <p className="text-gray-400">{selectedCourse.description}</p>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
                        <div className="space-y-6">
                          {Object.entries(groupLessonsByBlock(lessons)).map(([blockNumber, blockLessons]) => {
                            const blockNum = parseInt(blockNumber);
                            const blockState = lessonAccessGraph.blockStates[blockNum];
                            const isBlockUnlocked = blockState?.isUnlocked ?? false;
                            const isBlockCompleted = blockState?.isCompleted ?? false;
                            const manualBadgeVisible = blockState?.manualUnlockApplied === true;

                            return (
                              <div key={blockNum} className="bg-slate-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg font-semibold text-white">
                                    ブロック {blockNum}
                                  </h4>
                                  <div className="flex items-center gap-3 text-sm">
                                    {isBlockCompleted ? (
                                      <span className="flex items-center text-emerald-500">
                                        <FaCheck className="mr-1" /> 完了
                                      </span>
                                    ) : isBlockUnlocked ? (
                                      <span className="text-blue-500">解放中</span>
                                    ) : (
                                      <span className="flex items-center text-gray-400">
                                        <FaLock className="mr-1" /> 未解放 - 前のブロックを完了してください
                                      </span>
                                    )}
                                    {manualBadgeVisible && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                                        <FaUnlock /> 管理者解放
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  {blockLessons.sort((a, b) => a.order_index - b.order_index).map((lesson) => {
                                    const accessState = lessonAccessGraph.lessonStates[lesson.id];
                                    const unlocked = accessState?.isUnlocked ?? false;
                                    const completed = accessState?.isCompleted ?? (progress[lesson.id]?.completed || false);
                                    const completionRate = getLessonCompletionRate(lesson);

                                    return (
                                      <div
                                        key={lesson.id}
                                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                                          unlocked
                                            ? completed
                                              ? 'border-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/30 cursor-pointer'
                                              : 'border-blue-500 bg-blue-900/20 hover:bg-blue-900/30 cursor-pointer'
                                            : 'border-gray-600 bg-gray-800/20'
                                        }`}
                                        onClick={() => handleLessonClick(lesson)}
                                      >
                                        <div className="flex flex-col gap-3 sm:gap-4">
                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <h3
                                              className={`text-base sm:text-lg font-semibold ${
                                                unlocked ? 'text-white' : 'text-gray-400'
                                              }`}
                                            >
                                              {lesson.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="inline-flex items-center rounded px-3 py-1 bg-slate-700/60 text-gray-200">
                                                レッスン {lesson.order_index + 1}
                                              </span>
                                              {completed ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                                  <FaStar className="w-4 h-4" />
                                                  <span className="text-sm font-medium">完了</span>
                                                </span>
                                              ) : (
                                                !unlocked && (
                                                  <span className="inline-flex items-center gap-1 text-gray-400">
                                                    <FaLock className="w-3 h-3" />
                                                    ロック中
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          </div>

                                          {unlocked && (
                                            <div>
                                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>進捗</span>
                                                <span>{completionRate}%</span>
                                              </div>
                                              <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-blue-500 transition-all duration-300"
                                                  style={{ width: `${completionRate}%` }}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400">コースを選択してください</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage; 