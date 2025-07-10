import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Course, Lesson, fetchCourses, createCourse, fetchLessons, createLesson } from '@/platform/supabaseLessons';
import { MembershipRank } from '@/platform/supabaseSongs';
import { useToast } from '@/stores/toastStore';

const LessonManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const { register, handleSubmit, reset } = useForm<{ title: string; description: string; min_rank: MembershipRank }>();
  const { register: regLesson, handleSubmit: handleLessonSubmit, reset: resetLesson } = useForm<{ title: string }>();
  const toast = useToast();

  const loadCourses = async () => {
    const data = await fetchCourses();
    setCourses(data);
  };

  const loadLessons = async (courseId: string) => {
    const data = await fetchLessons(courseId);
    setLessons(data);
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => {
    if (selectedCourse) loadLessons(selectedCourse.id);
  }, [selectedCourse]);

  const onCreateCourse = async (v: any) => {
    try {
      await createCourse({ ...v, description: v.description ?? null });
      toast('コースを追加しました','success');
      reset();
      await loadCourses();
    } catch(e) {
      toast('コース追加に失敗しました','error');
    }
  };

  const onCreateLesson = async (v: any) => {
    if (!selectedCourse) return;
    try {
      await createLesson({ course_id: selectedCourse.id, title: v.title, description: null, order_index: lessons.length });
      toast('レッスンを追加しました','success');
      resetLesson();
      await loadLessons(selectedCourse.id);
    } catch(e) {
      toast('レッスン追加に失敗しました','error');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Course List & Add */}
      <div>
        <h3 className="text-xl font-bold mb-2">コース一覧</h3>
        <ul className="space-y-1 mb-4 max-h-60 overflow-auto">
          {courses.map(c => (
            <li key={c.id} className={`p-2 rounded cursor-pointer ${selectedCourse?.id===c.id?'bg-slate-700':'hover:bg-slate-800'}`} onClick={()=>setSelectedCourse(c)}>
              {c.title} <span className="text-xs text-gray-400">({c.min_rank})</span>
            </li>
          ))}
        </ul>

        <form className="space-y-2" onSubmit={handleSubmit(onCreateCourse)}>
          <input className="input input-bordered w-full" placeholder="コースタイトル" {...register('title',{required:true})} />
          <textarea className="textarea textarea-bordered w-full" placeholder="説明 (任意)" {...register('description')} />
          <select className="select select-bordered w-full" {...register('min_rank')} defaultValue="premium">
            <option value="free">フリー</option>
            <option value="standard">スタンダード</option>
            <option value="premium">プレミアム</option>
            <option value="platinum">プラチナ</option>
          </select>
          <button className="btn btn-sm btn-primary w-full" type="submit">コース追加</button>
        </form>
      </div>

      {/* Lessons of selected course */}
      {selectedCourse && (
        <div>
          <h3 className="text-xl font-bold mb-2">{selectedCourse.title} のレッスン</h3>
          <ul className="space-y-1 mb-4 max-h-60 overflow-auto">
            {lessons.map(l => (
              <li key={l.id} className="p-2 rounded bg-slate-800/50">#{l.order_index+1} {l.title}</li>
            ))}
          </ul>
          <form className="space-y-2" onSubmit={handleLessonSubmit(onCreateLesson)}>
            <input className="input input-bordered w-full" placeholder="レッスンタイトル" {...regLesson('title',{required:true})} />
            <button className="btn btn-sm btn-secondary w-full" type="submit">レッスン追加</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LessonManager; 