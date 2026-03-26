import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Course, CourseAudience, CourseDifficultyTier } from '@/types';
import { fetchCoursesWithDetails, addCourse, updateCourse, deleteCourse } from '@/platform/supabaseCourses';
import { clearSupabaseCache } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';
import { FaArrowUp, FaArrowDown, FaGripVertical } from 'react-icons/fa';
import {
  COURSE_DIFFICULTY_LABELS,
  COURSE_DIFFICULTY_TIER_ORDER,
  normalizeCourseDifficultyTier,
  sortCoursesByDifficultyThenOrder,
} from '@/utils/courseDifficulty';

const AUDIENCE_OPTIONS: { value: CourseAudience; label: string }[] = [
  { value: 'both', label: '日本＋グローバル' },
  { value: 'japan', label: '日本専用' },
  { value: 'global', label: 'グローバル専用' },
];

const DIFFICULTY_OPTIONS: { value: CourseDifficultyTier; label: string }[] = COURSE_DIFFICULTY_TIER_ORDER.map(
  value => ({ value, label: `${COURSE_DIFFICULTY_LABELS[value].ja} (${COURSE_DIFFICULTY_LABELS[value].en})` }),
);

type CourseFormData = Pick<Course, 'title' | 'description' | 'premium_only' | 'difficulty_tier' | 'is_visible'> & {
  audience: CourseAudience;
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
  const { register, handleSubmit, reset, setValue } = useForm<CourseFormData>({
    defaultValues: {
      title: '',
      description: '',
      premium_only: true,
      audience: 'both',
      difficulty_tier: 'beginner',
      is_visible: true,
    },
  });
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCoursesWithDetails({ includeHidden: true });
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
      setValue('audience', course.audience ?? 'both');
      setValue('difficulty_tier', normalizeCourseDifficultyTier(course.difficulty_tier));
      setValue('is_visible', course.is_visible !== false);
    } else {
      setSelectedCourse(null);
      reset({
        title: '',
        description: '',
        premium_only: true,
        audience: 'both',
        difficulty_tier: 'beginner',
        is_visible: true,
      });
    }
    dialogRef.current?.showModal();
  };
  
  const closeDialog = () => {
    dialogRef.current?.close();
  }

  const onSubmit = async (formData: CourseFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedCourse) {
        await updateCourse(selectedCourse.id, {
          ...formData,
          difficulty_tier: formData.difficulty_tier,
        });
        toast.success('コースを更新しました。');
      } else {
        const tier = normalizeCourseDifficultyTier(formData.difficulty_tier);
        const sameTier = courses.filter(c => normalizeCourseDifficultyTier(c.difficulty_tier) === tier);
        const newOrderIndex =
          sameTier.length > 0 ? Math.max(...sameTier.map(c => c.order_index)) + 10 : 0;
        await addCourse({
          title: formData.title,
          description: formData.description,
          premium_only: formData.premium_only,
          audience: formData.audience,
          difficulty_tier: tier,
          order_index: newOrderIndex,
          is_visible: formData.is_visible,
        });
        toast.success('新しいコースを追加しました。');
      }
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

  const handleMoveUpInTier = async (course: Course) => {
    const tier = normalizeCourseDifficultyTier(course.difficulty_tier);
    const group = sortCoursesByDifficultyThenOrder(courses).filter(
      c => normalizeCourseDifficultyTier(c.difficulty_tier) === tier,
    );
    const idx = group.findIndex(c => c.id === course.id);
    if (idx <= 0 || isSorting) return;

    setIsSorting(true);
    const prev = group[idx - 1];
    const cur = group[idx];
    try {
      await Promise.all([
        updateCourse(cur.id, { order_index: prev.order_index }),
        updateCourse(prev.id, { order_index: cur.order_index }),
      ]);
      await loadCourses();
      toast.success('並び順を更新しました。');
    } catch (error: unknown) {
      toast.error('並び順の更新に失敗しました。');
      console.error(error);
    } finally {
      setIsSorting(false);
    }
  };

  const handleMoveDownInTier = async (course: Course) => {
    const tier = normalizeCourseDifficultyTier(course.difficulty_tier);
    const group = sortCoursesByDifficultyThenOrder(courses).filter(
      c => normalizeCourseDifficultyTier(c.difficulty_tier) === tier,
    );
    const idx = group.findIndex(c => c.id === course.id);
    if (idx < 0 || idx >= group.length - 1 || isSorting) return;

    setIsSorting(true);
    const next = group[idx + 1];
    const cur = group[idx];
    try {
      await Promise.all([
        updateCourse(cur.id, { order_index: next.order_index }),
        updateCourse(next.id, { order_index: cur.order_index }),
      ]);
      await loadCourses();
      toast.success('並び順を更新しました。');
    } catch (error: unknown) {
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
  
  const sortedCourses = useMemo(() => sortCoursesByDifficultyThenOrder(courses), [courses]);

  const tierGroupedRows = useMemo(() => {
    const rows: (
      | { kind: 'header'; tier: CourseDifficultyTier }
      | { kind: 'course'; course: Course; indexInTier: number; tierSize: number }
    )[] = [];
    for (const tier of COURSE_DIFFICULTY_TIER_ORDER) {
      const inTier = sortedCourses.filter(c => normalizeCourseDifficultyTier(c.difficulty_tier) === tier);
      if (inTier.length === 0) continue;
      rows.push({ kind: 'header', tier });
      inTier.forEach((course, indexInTier) => {
        rows.push({ kind: 'course', course, indexInTier, tierSize: inTier.length });
      });
    }
    return rows;
  }, [sortedCourses]);

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
              <th className="min-w-[200px]">難易度</th>
              <th>コースタイトル</th>
              <th>レッスン数</th>
              <th>対象地域</th>
              <th>プレミアム限定</th>
              <th>一覧表示</th>
              <th className="text-right">アクション</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center">読み込み中...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center text-red-500">
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
                <td colSpan={9} className="text-center text-gray-400">
                  コースがありません。新規コースを追加してください。
                </td>
              </tr>
            ) : tierGroupedRows.map(row => {
              if (row.kind === 'header') {
                return (
                  <tr key={`h-${row.tier}`} className="bg-slate-800/80">
                    <td colSpan={9} className="font-semibold text-sm py-2">
                      {COURSE_DIFFICULTY_LABELS[row.tier].ja}（{COURSE_DIFFICULTY_LABELS[row.tier].en}）
                    </td>
                  </tr>
                );
              }
              const { course, indexInTier, tierSize } = row;
              return (
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
                        onClick={() => handleMoveUpInTier(course)}
                        disabled={indexInTier === 0 || isSorting}
                        aria-label="上に移動（同一難易度内）"
                      >
                        <FaArrowUp />
                      </button>
                      <button 
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleMoveDownInTier(course)}
                        disabled={indexInTier >= tierSize - 1 || isSorting}
                        aria-label="下に移動（同一難易度内）"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </td>
                  <td className="text-sm text-gray-300">
                    {COURSE_DIFFICULTY_LABELS[normalizeCourseDifficultyTier(course.difficulty_tier)].ja}
                  </td>
                  <td className="font-medium">{course.title}</td>
                  <td>{course.lessons?.length || 0}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      course.audience === 'global' ? 'bg-blue-600 text-white' :
                      course.audience === 'japan' ? 'bg-red-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {AUDIENCE_OPTIONS.find(o => o.value === (course.audience || 'both'))?.label || '日本＋グローバル'}
                    </span>
                  </td>
                  <td>{course.premium_only ? '✔' : ''}</td>
                  <td>{course.is_visible !== false ? '✔' : '—'}</td>
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
                    <td colSpan={9} className="p-0">
                      <div className="p-4 bg-slate-800/50">
                        <h4 className="font-semibold mb-2">コース詳細</h4>
                        <p className="text-sm text-gray-400 mb-4">{course.description || '説明はありません。'}</p>
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
            );
            })}
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
            <div>
              <label htmlFor="audience" className="label">
                <span className="label-text">対象地域</span>
              </label>
              <select id="audience" {...register('audience')} className="select select-bordered w-full">
                {AUDIENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="difficulty_tier" className="label">
                <span className="label-text">難易度（一覧のセクション）</span>
              </label>
              <select
                id="difficulty_tier"
                {...register('difficulty_tier')}
                className="select select-bordered w-full"
              >
                {DIFFICULTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">プレミアム限定</span> 
                <input type="checkbox" {...register('premium_only')} className="toggle toggle-primary" />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">レッスン一覧に表示</span>
                <input type="checkbox" {...register('is_visible', { valueAsBoolean: true })} className="toggle toggle-primary" />
              </label>
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