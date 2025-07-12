import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Course, Lesson, Song } from '@/types';
import { fetchCoursesWithDetails } from '@/platform/supabaseCourses';
import { fetchSongs } from '@/platform/supabaseSongs';
import { addLesson, updateLesson, deleteLesson } from '@/platform/supabaseLessons';
import { useToast } from '@/stores/toastStore';

type LessonFormData = Pick<Lesson, 'title' | 'description' | 'assignment_description' | 'order'>;

export const LessonManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const toast = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<LessonFormData>();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const coursesData = await fetchCoursesWithDetails();
        setCourses(coursesData);
        if (coursesData.length > 0) {
          const firstCourseId = coursesData[0].id;
          setSelectedCourseId(firstCourseId);
        }
      } catch (error) {
        toast.error('コースデータの読み込みに失敗しました。');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [toast]);

  const lessons = useMemo(() => {
    const course = courses.find(c => c.id === selectedCourseId);
    return course?.lessons.sort((a, b) => a.order - b.order) || [];
  }, [selectedCourseId, courses]);

  const openDialog = (lesson?: Lesson) => {
    if (lesson) {
      setSelectedLesson(lesson);
      setValue('title', lesson.title);
      setValue('description', lesson.description || '');
      setValue('assignment_description', lesson.assignment_description || '');
      setValue('order', lesson.order);
    } else {
      setSelectedLesson(null);
      const newOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 10 : 10;
      reset({ title: '', description: '', assignment_description: '', order: newOrder });
    }
    dialogRef.current?.showModal();
  };
  
  const closeDialog = () => {
    dialogRef.current?.close();
  }

  const onSubmit = async (formData: LessonFormData) => {
    if (!selectedCourseId) {
        toast.error('コースが選択されていません。');
        return;
    }
    setIsSubmitting(true);
    try {
      const lessonData = {
        title: formData.title,
        description: formData.description,
        assignment_description: formData.assignment_description,
        order: Number(formData.order) || 0, // Ensure order is a number
      };

      if (selectedLesson) {
        await updateLesson(selectedLesson.id, lessonData);
        toast.success('レッスンを更新しました。');
      } else {
        await addLesson({ ...lessonData, course_id: selectedCourseId });
        toast.success('新しいレッスンを追加しました。');
      }
      
      const updatedCourses = await fetchCoursesWithDetails();
      setCourses(updatedCourses);
      closeDialog();
    } catch (error) {
      toast.error('レッスンの保存に失敗しました。');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこのレッスンを削除しますか？')) {
      try {
        await deleteLesson(id);
        toast.success('レッスンを削除しました。');
        const updatedCourses = await fetchCoursesWithDetails();
        setCourses(updatedCourses);
      } catch (error) {
        toast.error('レッスンの削除に失敗しました。');
        console.error(error);
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">レッスン管理</h2>
        <button className="btn btn-primary" onClick={() => openDialog()} disabled={!selectedCourseId}>
          新規レッスン追加
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="course-select" className="label">
          <span className="label-text">コースを選択</span>
        </label>
        <select
          id="course-select"
          className="select select-bordered w-full max-w-xs"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          disabled={loading}
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-700">
        <table className="table w-full">
          <thead>
            <tr>
              <th>順序</th>
              <th>レッスンタイトル</th>
              <th>曲数</th>
              <th className="text-right">アクション</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center">読み込み中...</td></tr>
            ) : lessons.map(lesson => (
              <tr key={lesson.id}>
                <td>{lesson.order}</td>
                <td>{lesson.title}</td>
                <td>{lesson.lesson_songs?.length || 0}</td>
                <td className="text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => openDialog(lesson)}>編集</button>
                  <button className="btn btn-ghost btn-sm text-red-500" onClick={() => handleDelete(lesson.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{selectedLesson ? 'レッスンの編集' : '新規レッスンの作成'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="label"><span className="label-text">タイトル *</span></label>
              <input {...register('title', { required: true })} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label"><span className="label-text">順序</span></label>
              <input type="number" {...register('order')} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label"><span className="label-text">レッスン説明</span></label>
              <textarea {...register('description')} className="textarea textarea-bordered w-full" rows={3}></textarea>
            </div>
            <div>
              <label className="label"><span className="label-text">課題説明</span></label>
              <textarea {...register('assignment_description')} className="textarea textarea-bordered w-full" rows={3}></textarea>
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

export default LessonManager; 