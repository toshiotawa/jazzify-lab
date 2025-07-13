import React, { useEffect, useState } from 'react';
import { useToast } from '@/stores/toastStore';
import { UserProfile, fetchAllUsers, updateUserRank, setAdminFlag } from '@/platform/supabaseAdmin';
import { fetchUserLessonProgress, updateLessonProgress, unlockLesson, unlockBlock, LessonProgress } from '@/platform/supabaseLessonProgress';
import { fetchCoursesWithDetails } from '@/platform/supabaseCourses';
import { Course, Lesson } from '@/types';
import { FaEdit, FaLock, FaUnlock, FaCheck, FaLockOpen } from 'react-icons/fa';

const ranks = ['free','standard','premium','platinum'] as const;

type Rank = typeof ranks[number];

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userLessonProgress, setUserLessonProgress] = useState<LessonProgress[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersData, coursesData] = await Promise.all([
        fetchAllUsers(),
        fetchCoursesWithDetails()
      ]);
      setUsers(usersData);
      setCourses(coursesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{load();},[]);

  const handleRankChange = async (id:string, rank:Rank)=>{
    try {
      await updateUserRank(id, rank);
      toast.success('ランクを更新しました');
      await load();
    } catch(e){
      toast.error('更新に失敗しました');
    }
  };

  const toggleAdmin = async(id:string, isAdmin:boolean)=>{
    try {
      await setAdminFlag(id, isAdmin);
      toast.success('Admin 権限を更新しました');
      await load();
    } catch(e){
      toast.error('更新に失敗しました');
    }
  };

  const openProgressModal = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowProgressModal(true);
    if (courses.length > 0) {
      setSelectedCourse(courses[0]);
      await loadUserProgress(user.id, courses[0].id);
    }
  };

  const loadUserProgress = async (userId: string, courseId: string) => {
    try {
      const progress = await fetchUserLessonProgress(courseId, userId);
      setUserLessonProgress(progress);
    } catch (e) {
      console.error('Failed to load progress:', e);
      setUserLessonProgress([]);
    }
  };

  const handleToggleLessonProgress = async (lessonId: string, currentCompleted: boolean) => {
    if (!selectedUser || !selectedCourse) return;
    
    try {
      await updateLessonProgress(lessonId, selectedCourse.id, !currentCompleted, selectedUser.id);
      toast.success(currentCompleted ? 'レッスンを未完了に変更しました' : 'レッスンを完了に変更しました');
      await loadUserProgress(selectedUser.id, selectedCourse.id);
    } catch (e) {
      toast.error('更新に失敗しました');
    }
  };

  const handleUnlockLesson = async (lessonId: string) => {
    if (!selectedUser || !selectedCourse) return;
    
    try {
      await unlockLesson(lessonId, selectedCourse.id, selectedUser.id);
      toast.success('レッスンを解放しました');
      await loadUserProgress(selectedUser.id, selectedCourse.id);
    } catch (e) {
      toast.error('解放に失敗しました');
    }
  };

  const handleUnlockBlock = async (blockNumber: number) => {
    if (!selectedUser || !selectedCourse) return;
    
    try {
      await unlockBlock(selectedCourse.id, blockNumber, selectedUser.id);
      toast.success(`ブロック${blockNumber}を解放しました`);
      await loadUserProgress(selectedUser.id, selectedCourse.id);
    } catch (e) {
      toast.error('ブロックの解放に失敗しました');
    }
  };

  // レッスンをブロックごとにグループ化
  const groupLessonsByBlock = (lessons: Lesson[] | undefined) => {
    if (!lessons) return {};
    
    const blocks: { [key: number]: Lesson[] } = {};
    lessons.forEach(lesson => {
      const blockNumber = lesson.block_number || Math.ceil((lesson.order_index + 1) / 5);
      if (!blocks[blockNumber]) {
        blocks[blockNumber] = [];
      }
      blocks[blockNumber].push(lesson);
    });
    
    return blocks;
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">ユーザー管理</h3>
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
                <th className="py-1 px-2">レッスン</th>
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
                    <select className="select select-xs w-20" value={u.rank} onChange={e=>handleRankChange(u.id, e.target.value as Rank)}>
                      {ranks.map(r=>(<option key={r} value={r}>{r}</option>))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={u.is_admin} onChange={e=>toggleAdmin(u.id, e.target.checked)} />
                  </td>
                  <td className="py-1 px-2 text-right text-xs">Lv{u.level}</td>
                  <td className="py-1 px-2">
                    <button 
                      className="btn btn-xs btn-ghost"
                      onClick={() => openProgressModal(u)}
                    >
                      <FaEdit />
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
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">
              {selectedUser.nickname} のレッスン進捗管理
            </h3>
            
            {/* コース選択 */}
            <div className="mb-4">
              <label className="label">
                <span className="label-text">コース選択</span>
              </label>
              <select 
                className="select select-bordered w-full"
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

            {/* レッスン一覧 */}
            {selectedCourse && (
              <div className="space-y-4">
                {Object.entries(groupLessonsByBlock(selectedCourse.lessons)).map(([blockNumber, blockLessons]) => {
                  const blockNum = parseInt(blockNumber);
                  const blockProgress = blockLessons.map(lesson => 
                    userLessonProgress.find(p => p.lesson_id === lesson.id)
                  );
                  const isBlockUnlocked = blockProgress.some(p => p?.is_unlocked);
                  const isBlockCompleted = blockProgress.every(p => p?.completed);
                  
                  return (
                    <div key={blockNum} className="border border-slate-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-300">
                          ブロック {blockNum} {isBlockCompleted && '✅'}
                        </h4>
                        {!isBlockUnlocked && (
                          <button
                            className="btn btn-xs btn-primary"
                            onClick={() => handleUnlockBlock(blockNum)}
                          >
                            <FaLockOpen className="mr-1" />
                            ブロック解放
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {blockLessons.sort((a, b) => a.order_index - b.order_index).map((lesson, index) => {
                          const progress = userLessonProgress.find(p => p.lesson_id === lesson.id);
                          const isCompleted = progress?.completed || false;
                          const isUnlocked = progress?.is_unlocked || false;
                          
                          return (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium">
                                  {lesson.order_index + 1}. {lesson.title}
                                </span>
                                {isCompleted && <FaCheck className="text-emerald-500" />}
                                {!isUnlocked && <FaLock className="text-gray-500" />}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {!isUnlocked ? (
                                  <button
                                    className="btn btn-xs btn-primary"
                                    onClick={() => handleUnlockLesson(lesson.id)}
                                  >
                                    <FaUnlock className="mr-1" />
                                    解放
                                  </button>
                                ) : (
                                  <button
                                    className={`btn btn-xs ${isCompleted ? 'btn-success' : 'btn-ghost'}`}
                                    onClick={() => handleToggleLessonProgress(lesson.id, isCompleted)}
                                  >
                                    {isCompleted ? '完了済み' : '未完了'}
                                  </button>
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
            )}

            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowProgressModal(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager; 