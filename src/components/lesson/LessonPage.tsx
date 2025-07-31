import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Course, Lesson } from '@/types';
import { fetchCoursesWithDetails, fetchUserCompletedCourses, fetchUserCourseUnlockStatus, canAccessCourse } from '@/platform/supabaseCourses';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgress, unlockLesson, LessonProgress } from '@/platform/supabaseLessonProgress';
import { subscribeRealtime } from '@/platform/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { 
  FaArrowLeft, 
  FaLock, 
  FaUnlock,
  FaCheck, 
  FaPlay, 
  FaStar, 
  FaVideo,
  FaMusic 
} from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import { LessonRequirementProgress, fetchMultipleLessonRequirementsProgress } from '@/platform/supabaseLessonRequirements';
import { clearNavigationCacheForCourse } from '@/utils/lessonNavigation';

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

  useEffect(() => {
    const checkHash = () => {
      const isLessonsPage = window.location.hash === '#lessons';
      const wasOpen = open;
      setOpen(isLessonsPage);
      
      // レッスン詳細から戻ってきた場合は強制再読み込み
      if (isLessonsPage && !wasOpen && profile && selectedCourse) {
        // // console.log('レッスン詳細から戻ってきたため、データを強制再読み込み');
        // ナビゲーションキャッシュをクリア
        clearNavigationCacheForCourse(selectedCourse.id);
        loadLessons(selectedCourse.id);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [open, profile, selectedCourse]);

  useEffect(() => {
    if (open && profile) {
      loadData();
    }
  }, [open, profile, loadData]);

  useEffect(() => {
    if (selectedCourse) {
      loadLessons(selectedCourse.id);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse?.id) {
      loadLessons(selectedCourse.id);
    }
  }, [selectedCourse?.id]);

  // リアルタイム更新監視を追加（最適化版）
  useEffect(() => {
    // 最適化: レッスンページが開いている場合のみ監視
    if (!open || !selectedCourse) return;

    // 最適化: 管理者またはレッスン編集権限がある場合のみ監視
    const shouldMonitor = profile?.isAdmin || profile?.rank === 'premium' || profile?.rank === 'platinum';
    if (!shouldMonitor) return;

    // レッスンテーブルの変更を監視（最適化: キャッシュクリアを最小限に）
    const unsubscribeLessons = subscribeRealtime(
      'lesson-changes',
      'lessons',
      '*',
      (payload: unknown) => {
        // // console.log('Lesson data changed, reloading...', payload);
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
      (payload: unknown) => {
        // // console.log('Lesson songs data changed, reloading...', payload);
        if (selectedCourse) {
          loadLessons(selectedCourse.id);
        }
      },
      { clearCache: false } // キャッシュクリアを無効化
    );

    return () => {
      unsubscribeLessons();
      unsubscribeLessonSongs();
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
      
      // 全コースの進捗データを並行取得して完了率を計算
      if (profile) {
        try {
          const courseProgressPromises = sortedCourses.map(async (course) => {
            try {
              const [courseProgressData, courseLessonsData] = await Promise.all([
                fetchUserLessonProgress(course.id),
                fetchLessonsByCourse(course.id)
              ]);
              
              if (courseLessonsData.length === 0) return [course.id, 0];
              
              const completedCount = courseProgressData.filter(p => p.completed).length;
              const completionRate = Math.round((completedCount / courseLessonsData.length) * 100);
              
              return [course.id, completionRate];
            } catch (error) {
              // console.error(`Failed to load progress for course ${course.id}:`, error);
              return [course.id, 0];
            }
          });

          const courseProgressResults = await Promise.all(courseProgressPromises);
          const progressMap = Object.fromEntries(courseProgressResults) as Record<string, number>;
          setAllCoursesProgress(progressMap);
        } catch (error) {
          // console.error('Error loading course progress data:', error);
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
    } catch (e: unknown) {
      toast.error('コースの読み込みに失敗しました');
      // console.error('Error loading courses:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      // // console.log(`Loading lessons for course: ${courseId}`);
      
      // レッスンデータ、進捗データ、要件進捗を並行取得
      const [lessonsData, progressData, requirementsMap] = await Promise.all([
        fetchLessonsByCourse(courseId),
        fetchUserLessonProgress(courseId),
        fetchLessonsByCourse(courseId).then(lessons => {
          const lessonIds = lessons.map(lesson => lesson.id);
          return fetchMultipleLessonRequirementsProgress(lessonIds);
        })
      ]);
      
      // // console.log(`Loaded ${lessonsData.length} lessons`);
      
      setLessonRequirementsProgress(requirementsMap);
      setLessons(lessonsData);
      
      // レッスンデータが空で、以前にレッスンがあった場合は強制再読み込み
      if (lessonsData.length === 0 && lessons.length > 0) {
        // // console.log('Empty lessons detected, forcing cache bypass and reload...');
        // キャッシュをクリアしてもう一度読み込み
        const { clearSupabaseCache } = await import('@/platform/supabaseClient');
        clearSupabaseCache();
        
        // 少し待ってから再度読み込み
        setTimeout(async () => {
          try {
            const retryLessonsData = await fetchLessonsByCourse(courseId);
            // // console.log(`Retry loaded ${retryLessonsData.length} lessons`);
            
            // Requirements progress も再取得
            const retryLessonIds = retryLessonsData.map(lesson => lesson.id);
            const retryRequirementsMap = await fetchMultipleLessonRequirementsProgress(retryLessonIds);
            
            setLessons(retryLessonsData);
            setLessonRequirementsProgress(retryRequirementsMap);
            
            // 進捗データも再取得
            const retryProgressData = await fetchUserLessonProgress(courseId);
            const retryProgressMap: Record<string, LessonProgress> = {};
            retryProgressData.forEach((p: LessonProgress) => {
              retryProgressMap[p.lesson_id] = p;
            });
            setProgress(retryProgressMap);
          } catch (retryError) {
            // console.error('Retry loading failed:', retryError);
          }
        }, 100);
        return;
      }
      
      // 進捗データをマッピング
      const progressMap: Record<string, LessonProgress> = {};
      progressData.forEach((p: LessonProgress) => {
        progressMap[p.lesson_id] = p;
      });
      
      // ブロック1のレッスンで進捗がないものを自動的に作成（解放状態で）
      const block1Lessons = lessonsData.filter(lesson => {
        const blockNumber = lesson.block_number || 1;
        return blockNumber === 1;
      });
      
      for (const lesson of block1Lessons) {
        if (!progressMap[lesson.id]) {
          try {
            // ブロック1のレッスンは自動的に解放
            await unlockLesson(lesson.id, courseId);
          } catch (e) {
            // console.error('Failed to auto-unlock block 1 lesson:', e);
          }
        }
      }
      
      // 再度進捗を取得（新しく作成されたものを含む）
      const updatedProgressData = await fetchUserLessonProgress(courseId);
      const updatedProgressMap: Record<string, LessonProgress> = {};
      updatedProgressData.forEach((p: LessonProgress) => {
        updatedProgressMap[p.lesson_id] = p;
      });
      
      setProgress(updatedProgressMap);
      
      // 選択中のコースの進捗率を再計算してallCoursesProgressを更新
      if (lessonsData.length > 0) {
        const completedCount = updatedProgressData.filter(p => p.completed).length;
        const completionRate = Math.round((completedCount / lessonsData.length) * 100);
        setAllCoursesProgress(prev => ({
          ...prev,
          [courseId]: completionRate
        }));
      }
    } catch (e: unknown) {
      toast.error('レッスンデータの読み込みに失敗しました');
      // console.error('Error loading lessons:', e);
    }
  };


  const isLessonUnlocked = (lesson: Lesson, index: number): boolean => {
    // データベースのis_unlockedフィールドを確認
    const lessonProgress = progress[lesson.id];
    if (lessonProgress && lessonProgress.is_unlocked !== undefined) {
      return lessonProgress.is_unlocked;
    }
    
    // プログレスがない場合は、ブロック1（最初の5レッスン）は解放
          const blockNumber = lesson.block_number || 1;
    return blockNumber === 1;
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

  const handleLessonClick = (lesson: Lesson, index: number) => {
    if (!isLessonUnlocked(lesson, index)) {
      toast.warning('前のレッスンを完了してください');
      return;
    }
    
    // レッスン詳細画面に遷移 (今後実装)
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

  if (!profile || isGuest) {
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="戻る"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-xl font-bold">レッスン</h1>
            <div className="w-8" /> {/* スペーサー */}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">読み込み中...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* コース一覧サイドバー */}
              <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                  <h2 className="text-lg font-semibold">コース一覧</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ 
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}>
                  {courses.map((course: Course) => {
                    const courseUnlockFlag = courseUnlockStatus[course.id] !== undefined ? courseUnlockStatus[course.id] : null;
                    const accessResult = canAccessCourse(course, profile?.rank || 'free', completedCourseIds, courseUnlockFlag);
                    const accessible = accessResult.canAccess;
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
                          } else {
                            toast.warning(accessResult.reason || 'このコースにはアクセスできません');
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium truncate flex items-center gap-2">
                            {course.title}
                            {courseUnlockFlag === true && (
                              <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <FaUnlock className="text-xs" />
                                管理者解放
                              </span>
                            )}
                            {courseUnlockFlag === false && (
                              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <FaLock className="text-xs" />
                                管理者ロック
                              </span>
                            )}
                            {!accessible && courseUnlockFlag === null && <FaLock className="text-xs text-gray-400" />}
                          </h3>
                        </div>

                        {/* 前提条件表示 */}
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-400 mb-1">前提コース:</p>
                            <div className="flex flex-wrap gap-1">
                              {course.prerequisites.map((prereq, index) => (
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

                        {/* ロック状態の注意文言 */}
                        {!accessible && (
                          <div className={`mb-2 p-2 rounded border ${
                            courseUnlockFlag === false 
                              ? 'bg-red-900/30 border-red-600' 
                              : 'bg-orange-900/30 border-orange-600'
                          }`}>
                            <p className={`text-xs ${
                              courseUnlockFlag === false 
                                ? 'text-red-300' 
                                : 'text-orange-300'
                            }`}>
                              {courseUnlockFlag === false 
                                ? '管理者によりロックされています。前提コースを完了すると自動で解放されます。'
                                : accessResult.reason
                              }
                            </p>
                          </div>
                        )}
                      
                        {/* コース進捗バー */}
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
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedCourse ? (
                  <>
                    <div className="p-6 border-b border-slate-700">
                      <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
                      {selectedCourse.description && (
                        <p className="text-gray-400">{selectedCourse.description}</p>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-6">
                        {Object.entries(groupLessonsByBlock(lessons)).map(([blockNumber, blockLessons]) => {
                          const blockNum = parseInt(blockNumber);
                          const isBlockUnlocked = blockLessons.some(lesson => progress[lesson.id]?.is_unlocked);
                          const isBlockCompleted = blockLessons.every(lesson => progress[lesson.id]?.completed);

                          return (
                            <div key={blockNum} className="bg-slate-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white">
                                  ブロック {blockNum}
                                </h4>
                                {isBlockCompleted ? (
                                  <span className="flex items-center text-emerald-500">
                                    <FaCheck className="mr-1" /> 完了
                                  </span>
                                ) : isBlockUnlocked ? (
                                  <span className="text-blue-500">解放中</span>
                                ) : (
                                  <span className="flex items-center text-gray-400">
                                    <FaLock className="mr-1" /> ロック中 - 前のブロックを全て完了してください
                                  </span>
                                )}
                              </div>
                              <div className="space-y-4">
                                {blockLessons.sort((a, b) => a.order_index - b.order_index).map((lesson, index) => {
                                  const unlocked = isLessonUnlocked(lesson, lesson.order_index);
                                  const completed = progress[lesson.id]?.completed || false;
                                  const completionRate = getLessonCompletionRate(lesson);
                                  
                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`p-4 rounded-lg border-2 transition-all ${
                                        unlocked
                                          ? completed
                                            ? 'border-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/30 cursor-pointer'
                                            : 'border-blue-500 bg-blue-900/20 hover:bg-blue-900/30 cursor-pointer'
                                          : 'border-gray-600 bg-gray-800/20'
                                      }`}
                                      onClick={() => handleLessonClick(lesson, lesson.order_index)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                          {/* レッスン番号とアイコン */}
                                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                                            unlocked
                                              ? completed
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-blue-600 text-white'
                                              : 'bg-gray-600 text-gray-400'
                                          }`}>
                                            {unlocked ? (
                                              completed ? <FaCheck /> : <FaPlay />
                                            ) : (
                                              <FaLock />
                                            )}
                                          </div>

                                          {/* レッスン情報 */}
                                          <div>
                                            <h3 className={`text-lg font-semibold ${
                                              unlocked ? 'text-white' : 'text-gray-400'
                                            }`}>
                                              {lesson.title}
                                            </h3>
                                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                                              <span>レッスン {lesson.order_index}</span>
                                              <div className="flex items-center space-x-1">
                                                <FaVideo className="w-3 h-3" />
                                                <span>動画</span>
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                <FaMusic className="w-3 h-3" />
                                                <span>実習</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* ステータス表示 */}
                                        <div className="text-right">
                                          {completed && (
                                            <div className="flex items-center space-x-1 text-emerald-400 mb-2">
                                              <FaStar className="w-4 h-4" />
                                              <span className="text-sm font-medium">完了</span>
                                            </div>
                                          )}
                                          
                                          {unlocked && (
                                            <div className="w-32">
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