import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Course } from '@/types';
import { fetchCoursesWithDetails, addCourse, updateCourse, deleteCourse, setCoursePrerequisites } from '@/platform/supabaseCourses';
import { clearSupabaseCache } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';
import { FaArrowUp, FaArrowDown, FaGripVertical } from 'react-icons/fa';

type CourseFormData = Pick<Course, 'title' | 'description' | 'premium_only'> & {
  prerequisite_ids: string[];
};

export const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [isSorting, setIsSorting] = useState(false);

  const toast = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<CourseFormData>();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCoursesWithDetails();
      setCourses(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'コースの読み込みに失敗しました。';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (course?: Course) => {
    if (course) {
      setSelectedCourse(course);
      setValue('title', course.title);
      setValue('description', course.description || '');
      setValue('premium_only', course.premium_only ?? true);
      setValue('prerequisite_ids', course.prerequisites?.map(p => p.prerequisite_course_id) || []);
    } else {
      setSelectedCourse(null);
      reset({ title: '', description: '', premium_only: true, prerequisite_ids: [] });
    }
    dialogRef.current?.showModal();
  };
  
  const closeDialog = () => {
    dialogRef.current?.close();
  }

  const onSubmit = async (formData: CourseFormData) => {
    setIsSubmitting(true);
    try {
      let courseId: string;
      
      if (selectedCourse) {
        await updateCourse(selectedCourse.id, {
          title: formData.title,
          description: formData.description,
          premium_only: formData.premium_only
        });
        courseId = selectedCourse.id;
        toast.success('コースを更新しました。');
      } else {
        const newOrderIndex = courses.length > 0 ? Math.max(...courses.map(c => c.order_index)) + 10 : 0;
        const newCourse = await addCourse({
          title: formData.title,
          description: formData.description,
          premium_only: formData.premium_only,
          order_index: newOrderIndex,
        });
        courseId = newCourse.id;
        toast.success('新しいコースを追加しました。');
      }
      
      // 前提条件を更新
      await setCoursePrerequisites(courseId, formData.prerequisite_ids);
      
      await loadCourses();
      closeDialog();
    } catch (error: any) {
      toast.error(`コースの保存に失敗しました: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこのコースを削除しますか？関連するすべてのレッスンも削除されます。')) {
      try {
        await deleteCourse(id);
        toast.success('コースを削除しました。');
        await loadCourses();
      } catch (error: any) {
        toast.error(`コースの削除に失敗しました: ${error.message}`);
        console.error(error);
      }
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || isSorting) return;
    
    setIsSorting(true);
    const newCourses = [...sortedCourses];
    const temp = newCourses[index];
    newCourses[index] = newCourses[index - 1];
    newCourses[index - 1] = temp;
    
    // 並び順を更新
    try {
      await Promise.all(
        newCourses.map((course, idx) => 
          updateCourse(course.id, { order_index: idx * 10 })
        )
      );
      await loadCourses();
      toast.success('並び順を更新しました。');
    } catch (error: any) {
      toast.error('並び順の更新に失敗しました。');
      console.error(error);
    } finally {
      setIsSorting(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === sortedCourses.length - 1 || isSorting) return;
    
    setIsSorting(true);
    const newCourses = [...sortedCourses];
    const temp = newCourses[index];
    newCourses[index] = newCourses[index + 1];
    newCourses[index + 1] = temp;
    
    // 並び順を更新
    try {
      await Promise.all(
        newCourses.map((course, idx) => 
          updateCourse(course.id, { order_index: idx * 10 })
        )
      );
      await loadCourses();
      toast.success('並び順を更新しました。');
    } catch (error: any) {
      toast.error('並び順の更新に失敗しました。');
      console.error(error);
    } finally {
      setIsSorting(false);
    }
  };

  const toggleExpand = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };
  
  const sortedCourses = useMemo(() => 
    [...courses].sort((a, b) => a.order_index - b.order_index),
  [courses]);

  const handleClearCache = async () => {
    clearSupabaseCache();
    await loadCourses();
    toast.success('キャッシュをクリアし、データを再読み込みしました。');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">コース管理</h2>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleClearCache}>
            キャッシュクリア
          </button>
          <button className="btn btn-primary" onClick={() => openDialog()}>
            新規コース追加
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-700">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-[50px]"></th>
              <th className="w-[100px]">並び順</th>
              <th>コースタイトル</th>
              <th>レッスン数</th>
              <th>前提条件数</th>
              <th>プレミアム限定</th>
              <th className="text-right">アクション</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center">読み込み中...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center text-red-500">
                  <div className="py-4">
                    <p className="mb-2">エラー: {error}</p>
                    <button className="btn btn-sm btn-primary" onClick={loadCourses}>
                      再読み込み
                    </button>
                  </div>
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400">
                  コースがありません。新規コースを追加してください。
                </td>
              </tr>
            ) : sortedCourses.map((course, index) => (
              <React.Fragment key={course.id}>
                <tr>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleExpand(course.id)}>
                      {expandedCourses.has(course.id) ? '▼' : '▶'}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <FaGripVertical className="text-gray-400" />
                      <button 
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isSorting}
                        aria-label="上に移動"
                      >
                        <FaArrowUp />
                      </button>
                      <button 
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedCourses.length - 1 || isSorting}
                        aria-label="下に移動"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </td>
                  <td className="font-medium">{course.title}</td>
                  <td>{course.lessons?.length || 0}</td>
                  <td>{course.prerequisites?.length || 0}</td>
                  <td>{course.premium_only ? '✔' : ''}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => openDialog(course)}>
                      編集
                    </button>
                    <button className="btn btn-ghost btn-sm text-red-500" onClick={() => handleDelete(course.id)}>
                      削除
                    </button>
                  </td>
                </tr>
                {expandedCourses.has(course.id) && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="p-4 bg-slate-800/50">
                        <h4 className="font-semibold mb-2">コース詳細</h4>
                        <p className="text-sm text-gray-400 mb-4">{course.description || '説明はありません。'}</p>
                        
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <>
                            <h5 className="font-semibold mb-2">前提条件コース</h5>
                            <ul className="list-disc pl-5 mb-4">
                              {course.prerequisites.map(prereq => (
                                <li key={prereq.prerequisite_course_id} className="text-sm text-gray-400">
                                  {sortedCourses.find(c => c.id === prereq.prerequisite_course_id)?.title || 'Unknown Course'}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        
                        <h5 className="font-semibold mb-2">レッスン一覧</h5>
                        {course.lessons && course.lessons.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {course.lessons.map(lesson => (
                              <li key={lesson.id}>{lesson.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400">このコースにはまだレッスンがありません。</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{selectedCourse ? 'コースの編集' : '新規コースの作成'}</h3>
          <p className="py-4">コースの情報を入力してください。</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="title" className="label">
                <span className="label-text">タイトル</span>
              </label>
              <input id="title" {...register('title', { required: true })} className="input input-bordered w-full" />
            </div>
            <div>
              <label htmlFor="description" className="label">
                <span className="label-text">説明</span>
              </label>
              <textarea id="description" {...register('description')} className="textarea textarea-bordered w-full" />
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">プレミアム限定</span> 
                <input type="checkbox" {...register('premium_only')} className="toggle toggle-primary" />
              </label>
            </div>
            <div>
              <label htmlFor="prerequisites" className="label">
                <span className="label-text">前提条件コース</span>
              </label>
              <select 
                id="prerequisites"
                multiple
                {...register('prerequisite_ids')}
                className="select select-bordered w-full h-32"
                size={5}
              >
                {sortedCourses
                  .filter(c => c.id !== selectedCourse?.id) // 自分自身は選択不可
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Ctrlキー（Macではコマンドキー）を押しながらクリックで複数選択
              </p>
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={closeDialog}>キャンセル</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}; 