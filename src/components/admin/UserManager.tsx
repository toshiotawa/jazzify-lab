import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';
import { UserProfile, fetchAllUsers, updateUserRank, setAdminFlag, USERS_CACHE_KEY } from '@/platform/supabaseAdmin';
import { fetchUserLessonProgress, updateLessonProgress, unlockLesson, unlockBlock, lockBlock, LessonProgress, LESSON_PROGRESS_CACHE_KEY } from '@/platform/supabaseLessonProgress';
import { fetchCoursesWithDetails, fetchUserCourseUnlockStatus, adminLockCourse, adminUnlockCourse, COURSES_CACHE_KEY } from '@/platform/supabaseCourses';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { Course, Lesson } from '@/types';
import { FaEdit, FaLock, FaUnlock, FaCheck, FaLockOpen, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { invalidateCacheKey, clearSupabaseCache } from '@/platform/supabaseClient';

const ranks = ['free','standard','premium','platinum'] as const;

type Rank = typeof ranks[number];

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { profile } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userLessonProgress, setUserLessonProgress] = useState<LessonProgress[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [userCourseUnlockStatus, setUserCourseUnlockStatus] = useState<Record<string, boolean | null>>({});

  const load = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [usersData, coursesData] = await Promise.all([
        fetchAllUsers({ forceRefresh }),
        fetchCoursesWithDetails({ forceRefresh })
      ]);
      setUsers(usersData);
      setCourses(coursesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{load();},[]);

  const handleRankChange = async (id:string, rank:Rank)=>{
    // 管理者でない場合、自分以外のユーザーを更新できない
    if (!profile?.isAdmin && id !== profile?.id) {
      toast.error('自分以外のユーザーのステータスを変更する権限がありません');
      return;
    }

    try {
      // 楽観的更新
      setUsers(prev => prev.map(u => u.id === id ? { ...u, rank } : u));
      
      await updateUserRank(id, rank);
      
      // キャッシュを無効化してから再取得
      invalidateCacheKey(USERS_CACHE_KEY());
      await load(true);
      
      toast.success('ランクを更新しました');
    } catch(e){
      toast.error('更新に失敗しました');
      // エラー時はリロード
      await load(true);
    }
  };

  const toggleAdmin = async(id:string, isAdmin:boolean)=>{
    // 管理者でない場合、自分以外のユーザーを更新できない
    if (!profile?.isAdmin && id !== profile?.id) {
      toast.error('自分以外のユーザーのステータスを変更する権限がありません');
      return;
    }

    try {
      // 楽観的更新
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: isAdmin } : u));
      
      await setAdminFlag(id, isAdmin);
      
      // キャッシュを無効化してから再取得
      invalidateCacheKey(USERS_CACHE_KEY());
      await load(true);
      
      toast.success('Admin 権限を更新しました');
    } catch(e){
      toast.error('更新に失敗しました');
      // エラー時はリロード
      await load(true);
    }
  };

  const openProgressModal = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowProgressModal(true);
    
    // ユーザーのコースアンロック状況を取得
    try {
      const unlockStatus = await fetchUserCourseUnlockStatus(user.id);
      setUserCourseUnlockStatus(unlockStatus);
    } catch (error) {
      console.error('Failed to load course unlock status:', error);
      setUserCourseUnlockStatus({});
    }
    
    if (courses.length > 0) {
      setSelectedCourse(courses[0]);
      await loadUserProgress(user.id, courses[0].id);
    }
  };

  const loadUserProgress = async (
    userId: string,
    courseId: string,
    forceRefresh = false,
  ) => {
    try {
      const progress = await fetchUserLessonProgress(courseId, userId, { forceRefresh });
      setUserLessonProgress(progress);
    } catch (e) {
      console.error('Failed to load progress:', e);
      setUserLessonProgress([]);
    }
  };

  const handleToggleLessonProgress = async (lessonId: string, currentCompleted: boolean) => {
    if (!selectedUser || !selectedCourse) return;
    
    // ① 楽観的 UI 更新（即時反映）
    setUserLessonProgress(prev =>
      prev.map(p =>
        p.lesson_id === lessonId ? { ...p, completed: !currentCompleted } : p,
      ),
    );

    try {
      await updateLessonProgress(
        lessonId,
        selectedCourse.id,
        !currentCompleted,
        selectedUser.id,
      );

      // ② キャッシュ無効化
      invalidateCacheKey(
        LESSON_PROGRESS_CACHE_KEY(selectedCourse.id, selectedUser.id),
      );

      // ③ 正確なデータで再フェッチ（forceRefresh = true）
      await loadUserProgress(selectedUser.id, selectedCourse.id, true);
      toast.success(
        currentCompleted ? 'レッスンを未完了に変更しました' : 'レッスンを完了に変更しました',
      );
    } catch (e) {
      toast.error('更新に失敗しました');
      // ロールバック
      await loadUserProgress(selectedUser.id, selectedCourse.id, true);
    }
  };

  const handleUnlockLesson = async (lessonId: string) => {
    if (!selectedUser || !selectedCourse) return;
    
    // ① 楽観的 UI 更新（即時反映）
    setUserLessonProgress(prev =>
      prev.map(p =>
        p.lesson_id === lessonId ? { ...p, is_unlocked: true } : p,
      ),
    );
    
    try {
      await unlockLesson(lessonId, selectedCourse.id, selectedUser.id);

      // ② キャッシュ無効化
      invalidateCacheKey(
        LESSON_PROGRESS_CACHE_KEY(selectedCourse.id, selectedUser.id),
      );

      // ③ 正確なデータで再フェッチ（forceRefresh = true）
      await loadUserProgress(selectedUser.id, selectedCourse.id, true);
      toast.success('レッスンを解放しました');
    } catch (e) {
      toast.error('解放に失敗しました');
      // ロールバック
      await loadUserProgress(selectedUser.id, selectedCourse.id, true);
    }
  };

  // ブロック内のレッスンIDをキャッシュ
  const blockLessonsCache = useMemo(() => {
    if (!selectedCourse?.lessons) return {};
    
    const blocks: Record<number, string[]> = {};
    selectedCourse.lessons.forEach(lesson => {
      const blockNumber = lesson.block_number || 1;
      if (!blocks[blockNumber]) {
        blocks[blockNumber] = [];
      }
      blocks[blockNumber].push(lesson.id);
    });
    
    return blocks;
  }, [selectedCourse]);

  const handleToggleBlockLock = useCallback(async (blockNumber: number, shouldUnlock: boolean) => {
    if (!selectedUser || !selectedCourse) return;
    
    // ① 楽観的 UI 更新（即時反映）
    setUserLessonProgress((prev) =>
      prev.map((p) =>
        blockLessonsCache[blockNumber]?.includes(p.lesson_id)
          ? { ...p, is_unlocked: shouldUnlock }
          : p
      )
    );

    try {
      const api = shouldUnlock ? unlockBlock : lockBlock;
      await api(selectedCourse.id, blockNumber, selectedUser.id);

      // ② キャッシュ無効化
      invalidateCacheKey(
        LESSON_PROGRESS_CACHE_KEY(selectedCourse.id, selectedUser.id),
      );

      // ③ 正確なデータで再フェッチ（forceRefresh = true）
      await loadUserProgress(selectedUser.id, selectedCourse.id, true);
      toast.success(
        `ブロック${blockNumber}を${shouldUnlock ? '解放' : '施錠'}しました`
      );
    } catch (e) {
      toast.error('ブロックの更新に失敗しました');
      
      // エラー時はロールバック
      await loadUserProgress(selectedUser.id, selectedCourse.id, true);
    }
  }, [selectedUser, selectedCourse, blockLessonsCache, toast]);

  const handleToggleCourseUnlock = async (courseId: string, shouldUnlock: boolean) => {
    if (!selectedUser) return;
    
    // 楽観的UI更新
    setUserCourseUnlockStatus(prev => ({
      ...prev,
      [courseId]: shouldUnlock
    }));
    
    try {
      if (shouldUnlock) {
        await adminUnlockCourse(selectedUser.id, courseId);
      } else {
        await adminLockCourse(selectedUser.id, courseId);
      }
      
      // キャッシュクリアと状態更新
      invalidateCacheKey(COURSES_CACHE_KEY());
      if (selectedCourse) {
        invalidateCacheKey(LESSON_PROGRESS_CACHE_KEY(selectedCourse.id, selectedUser.id));
        await loadUserProgress(selectedUser.id, selectedCourse.id, true);
      }
      
      // 最新の状態を再取得
      const updatedStatus = await fetchUserCourseUnlockStatus(selectedUser.id);
      setUserCourseUnlockStatus(updatedStatus);
      
      toast.success(`コースを${shouldUnlock ? 'アンロック' : 'ロック'}しました`);
    } catch (error) {
      console.error('Course lock/unlock failed:', error);
      toast.error('コースのロック/アンロックに失敗しました');
      
      // エラー時はロールバック
      const currentStatus = await fetchUserCourseUnlockStatus(selectedUser.id);
      setUserCourseUnlockStatus(currentStatus);
    }
  };

  const handleClearCache = async () => {
    clearSupabaseCache();
    await load(true);
    toast.success('キャッシュをクリアし、データを再読み込みしました。');
  };

  // レッスンをブロックごとにグループ化
  const groupLessonsByBlock = (lessons: Lesson[] | undefined) => {
    if (!lessons) return {};
    
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

  // ブロックの状態を判定
  const getBlockStatus = (blockLessons: Lesson[], blockNumber: number) => {
    const blockProgress = blockLessons.map(lesson => 
      userLessonProgress.find(p => p.lesson_id === lesson.id)
    );
    
    const hasUnlockedLessons = blockProgress.some(p => p?.is_unlocked);
    const allLessonsCompleted = blockProgress.length > 0 && blockProgress.every(p => p?.completed);
    const completedCount = blockProgress.filter(p => p?.completed).length;
    
    return {
      isUnlocked: hasUnlockedLessons,
      isCompleted: allLessonsCompleted,
      completedCount,
      totalCount: blockLessons.length
    };
  };

  // レッスンの状態を判定（ブロック依存）
  const getLessonStatus = (lessonId: string, blockUnlocked: boolean) => {
    const progress = userLessonProgress.find(p => p.lesson_id === lessonId);
    return {
      // ブロックが開いていれば常にアクセス可能
      isUnlocked: blockUnlocked || progress?.is_unlocked || false,
      isCompleted: progress?.completed || false
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">ユーザー管理</h3>
        <button className="btn btn-secondary btn-sm" onClick={handleClearCache}>
          キャッシュクリア
        </button>
      </div>
      
      {/* 管理者でない場合の警告 */}
      {!profile?.isAdmin && (
        <div className="alert alert-warning mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>管理者権限がありません。自分のアカウントのみ編集可能です。</span>
          </div>
        </div>
      )}
      {loading? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-1 px-2">Nick</th>
                <th className="py-1 px-2 hidden sm:table-cell">Email</th>
                <th className="py-1 px-2">Rank</th>
                <th className="py-1 px-2">Admin</th>
                <th className="py-1 px-2 text-right">Level</th>
                <th className="py-1 px-2">レッスン管理</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=> (
                <tr key={u.id} className="border-b border-slate-800">
                  <td className="py-1 px-2">
                    <span className="truncate block max-w-[100px] sm:max-w-none">{u.nickname}</span>
                  </td>
                  <td className="py-1 px-2 text-xs text-gray-400 hidden sm:table-cell">
                    <span className="truncate block max-w-[150px]">{u.email}</span>
                  </td>
                  <td className="py-1 px-2">
                    <select 
                      className={`select select-xs w-20 ${!profile?.isAdmin && u.id !== profile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={u.rank} 
                      onChange={e=>handleRankChange(u.id, e.target.value as Rank)}
                      disabled={!profile?.isAdmin && u.id !== profile?.id}
                    >
                      {ranks.map(r=>(<option key={r} value={r}>{r}</option>))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <input 
                      type="checkbox" 
                      className={`checkbox checkbox-sm ${!profile?.isAdmin && u.id !== profile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      checked={u.is_admin} 
                      onChange={e=>toggleAdmin(u.id, e.target.checked)}
                      disabled={!profile?.isAdmin && u.id !== profile?.id}
                    />
                  </td>
                  <td className="py-1 px-2 text-right text-xs">Lv{u.level}</td>
                  <td className="py-1 px-2">
                    <button 
                      className={`btn btn-xs btn-primary ${!profile?.isAdmin && u.id !== profile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => openProgressModal(u)}
                      disabled={!profile?.isAdmin && u.id !== profile?.id}
                    >
                      <FaEdit className="mr-1" />
                      進捗管理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* レッスン進捗管理モーダル */}
      {showProgressModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowProgressModal(false)}
        >
          <div className="bg-slate-800 rounded-lg p-6 max-w-5xl max-h-[80vh] overflow-y-auto mx-4 w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {selectedUser.nickname} の進捗管理
              </h3>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => setShowProgressModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            {/* コース選択 */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text text-slate-300">コース選択</span>
              </label>
              <select 
                className="select select-bordered w-full bg-slate-700 text-white"
                value={selectedCourse?.id || ''}
                onChange={async (e) => {
                  const course = courses.find(c => c.id === e.target.value);
                  if (course) {
                    setSelectedCourse(course);
                    await loadUserProgress(selectedUser.id, course.id);
                  }
                }}
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* コースアクセス制御 */}
            {selectedCourse && (
              <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">コースアクセス制御</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-300">
                      {selectedCourse.title} のアクセス状況:
                    </span>
                    <div className="flex items-center space-x-2">
                      {userCourseUnlockStatus[selectedCourse.id] === true ? (
                        <div className="flex items-center space-x-1 text-green-400">
                          <FaUnlock className="text-sm" />
                          <span className="text-sm font-medium">管理者により解放済み</span>
                        </div>
                      ) : userCourseUnlockStatus[selectedCourse.id] === false ? (
                        <div className="flex items-center space-x-1 text-red-400">
                          <FaLock className="text-sm" />
                          <span className="text-sm font-medium">管理者によりロック済み</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-slate-400">
                          <FaCheck className="text-sm" />
                          <span className="text-sm font-medium">通常の前提条件に従う</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {userCourseUnlockStatus[selectedCourse.id] === false ? (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleToggleCourseUnlock(selectedCourse.id, true)}
                      >
                        <FaUnlock className="mr-1" />
                        コース解放
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleToggleCourseUnlock(selectedCourse.id, false)}
                      >
                        <FaLock className="mr-1" />
                        コースロック
                      </button>
                    )}
                    
                    {userCourseUnlockStatus[selectedCourse.id] !== undefined && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={async () => {
                          // 管理者アンロック状態をクリアして前提条件に従うようにする
                          setUserCourseUnlockStatus(prev => {
                            const newStatus = { ...prev };
                            delete newStatus[selectedCourse.id];
                            return newStatus;
                          });
                          
                          try {
                            // DBからレコードを削除することで前提条件判定に戻す
                            await getSupabaseClient()
                              .from('user_course_progress')
                              .delete()
                              .eq('user_id', selectedUser.id)
                              .eq('course_id', selectedCourse.id);
                            
                            // 最新の状態を再取得
                            const updatedStatus = await fetchUserCourseUnlockStatus(selectedUser.id);
                            setUserCourseUnlockStatus(updatedStatus);
                            
                            toast.success('通常の前提条件に戻しました');
                          } catch (error) {
                            console.error('Failed to reset course unlock status:', error);
                            toast.error('リセットに失敗しました');
                            
                            // エラー時はロールバック
                            const currentStatus = await fetchUserCourseUnlockStatus(selectedUser.id);
                            setUserCourseUnlockStatus(currentStatus);
                          }
                        }}
                        title="通常の前提条件に戻す"
                      >
                        前提条件に戻す
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 前提条件情報 */}
                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-600 rounded text-sm">
                    <span className="text-slate-300">前提条件:</span>
                    <div className="mt-1">
                      {selectedCourse.prerequisites.map((prereq, index) => (
                        <span key={prereq.prerequisite_course_id} className="inline-block bg-slate-500 px-2 py-1 rounded mr-2 mb-1">
                          {prereq.prerequisite_course.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 進捗概要 */}
            {selectedCourse && (
              <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">進捗概要</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {Object.keys(groupLessonsByBlock(selectedCourse.lessons)).length}
                    </div>
                    <div className="text-slate-400">総ブロック数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedCourse.lessons?.length || 0}
                    </div>
                    <div className="text-slate-400">総レッスン数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {userLessonProgress.filter(p => p.is_unlocked).length}
                    </div>
                    <div className="text-slate-400">解放済み</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {userLessonProgress.filter(p => p.completed).length}
                    </div>
                    <div className="text-slate-400">完了済み</div>
                  </div>
                </div>
              </div>
            )}

            {/* ブロック・レッスン管理 */}
            {selectedCourse && (
              <div className="space-y-6">
                {Object.entries(groupLessonsByBlock(selectedCourse.lessons))
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([blockNumber, blockLessons]) => {
                    const blockNum = parseInt(blockNumber);
                    const blockStatus = getBlockStatus(blockLessons, blockNum);
                    
                    return (
                      <div key={blockNum} className="border border-slate-600 rounded-lg overflow-hidden">
                        {/* ブロックヘッダー */}
                        <div className={`p-4 ${blockStatus.isCompleted ? 'bg-emerald-900/30' : blockStatus.isUnlocked ? 'bg-blue-900/30' : 'bg-slate-700'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-semibold text-white">
                                ブロック {blockNum}
                              </h4>
                              
                              {/* ブロック状態アイコン */}
                              <div className="flex items-center space-x-2">
                                {blockStatus.isUnlocked ? (
                                  <div className="flex items-center space-x-1 text-green-400">
                                    <FaUnlock className="text-sm" />
                                    <span className="text-xs">解放済み</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    <FaLock className="text-sm" />
                                    <span className="text-xs">未解放</span>
                                  </div>
                                )}
                                
                                {blockStatus.isCompleted && (
                                  <div className="flex items-center space-x-1 text-emerald-400">
                                    <FaCheck className="text-sm" />
                                    <span className="text-xs">完了</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* ブロック進捗 */}
                              <div className="text-sm text-slate-300">
                                {blockStatus.completedCount}/{blockStatus.totalCount} レッスン完了
                              </div>
                            </div>
                            
                            {/* ブロック操作ボタン */}
                            <div className="flex items-center space-x-2">
                              {blockStatus.isUnlocked ? (
                                <button
                                  className="btn btn-xs btn-warning"
                                  onClick={() => handleToggleBlockLock(blockNum, false)}
                                >
                                  <FaLock className="mr-1" />
                                  ブロック施錠
                                </button>
                              ) : (
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() => handleToggleBlockLock(blockNum, true)}
                                >
                                  <FaLockOpen className="mr-1" />
                                  ブロック解放
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* レッスン一覧 */}
                        <div className="p-4 space-y-3">
                          {blockLessons
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((lesson) => {
                              const lessonStatus = getLessonStatus(lesson.id, blockStatus.isUnlocked);
                              
                              return (
                                <div key={lesson.id} className={`p-3 rounded-lg border ${
                                  lessonStatus.isCompleted ? 'bg-emerald-900/20 border-emerald-600' :
                                  lessonStatus.isUnlocked ? 'bg-blue-900/20 border-blue-600' :
                                  'bg-slate-700 border-slate-600'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm font-medium text-white">
                                        {lesson.order_index + 1}. {lesson.title}
                                      </span>
                                      
                                      {/* レッスン状態アイコン */}
                                      <div className="flex items-center space-x-2">
                                        {lessonStatus.isUnlocked ? (
                                          <FaEye className="text-green-400 text-xs" title="アクセス可能" />
                                        ) : (
                                          <FaEyeSlash className="text-gray-500 text-xs" title="ブロック未解放" />
                                        )}
                                        
                                        {lessonStatus.isCompleted && (
                                          <FaCheck className="text-emerald-400 text-xs" title="完了済み" />
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* レッスン操作ボタン */}
                                    <div className="flex items-center space-x-2">
                                      {/* 完了切り替えボタンのみ */}
                                      <button
                                        className={`btn btn-xs ${lessonStatus.isCompleted ? 'btn-success' : 'btn-outline btn-success'}`}
                                        onClick={() => handleToggleLessonProgress(lesson.id, lessonStatus.isCompleted)}
                                        disabled={!lessonStatus.isUnlocked}
                                      >
                                        {lessonStatus.isCompleted ? (
                                          <>
                                            <FaCheck className="mr-1" />
                                            完了済み
                                          </>
                                        ) : (
                                          <>
                                            <FaTimes className="mr-1" />
                                            未完了
                                          </>
                                        )}
                                      </button>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager; 