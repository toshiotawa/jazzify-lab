import React, { useEffect, useState } from 'react';
import { useToast } from '@/stores/toastStore';
import { UserProfile, fetchAllUsers, updateUserRank, setAdminFlag } from '@/platform/supabaseAdmin';
import { fetchUserLessonProgress, updateLessonProgress, unlockLesson, LessonProgress } from '@/platform/supabaseLessonProgress';
import { fetchCoursesWithDetails } from '@/platform/supabaseCourses';
import { Course } from '@/types';
import { FaEdit, FaLock, FaUnlock, FaCheck } from 'react-icons/fa';

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
      const progress = await fetchUserLessonProgress(courseId);
      // 選択したユーザーの進捗をフィルタリング
      const userSpecificProgress = progress.filter(p => p.user_id === userId);
      setUserLessonProgress(userSpecificProgress);
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
              <div className="space-y-2">
                {selectedCourse.lessons?.map((lesson, index) => {
                  const progress = userLessonProgress.find(p => p.lesson_id === lesson.id);
                  const isCompleted = progress?.completed || false;
                  const isUnlocked = progress !== undefined;
                  
                  return (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {index + 1}. {lesson.title}
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