import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Course, Lesson, ClearConditions } from '@/types';
import { Song as SongData } from '@/platform/supabaseSongs';
import { fetchCoursesSimple } from '@/platform/supabaseCourses';
import { fetchSongs } from '@/platform/supabaseSongs';
import { fetchLessonsByCourse, addLesson, updateLesson, deleteLesson, addSongToLesson, removeSongFromLesson, updateLessonSongConditions, LESSONS_CACHE_KEY } from '@/platform/supabaseLessons';
import { invalidateCacheKey, clearSupabaseCache } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';
import { FaMusic, FaTrash, FaEdit } from 'react-icons/fa';

type LessonFormData = Pick<Lesson, 'title' | 'description' | 'assignment_description' | 'order_index' | 'block_number'>;

type SongFormData = {
  song_id: string;
  clear_conditions: ClearConditions;
};

export const LessonManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [availableSongs, setAvailableSongs] = useState<SongData[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [currentLessons, setCurrentLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const toast = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<LessonFormData>();
  const { register: registerSong, handleSubmit: handleSubmitSong, reset: resetSong, setValue: setValueSong, watch: watchSong } = useForm<SongFormData>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const songDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [coursesData, songsData] = await Promise.all([
          fetchCoursesSimple(),
          fetchSongs('lesson')
        ]);
        setCourses(coursesData);
        setAvailableSongs(songsData);
        
        if (coursesData.length > 0) {
          const firstCourseId = coursesData[0].id;
          setSelectedCourseId(firstCourseId);
        }
      } catch (error) {
        toast.error('データの読み込みに失敗しました。');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [toast]);

  // 選択されたコースが変更されたらレッスンを取得
  useEffect(() => {
    if (selectedCourseId) {
      loadLessons();
    }
  }, [selectedCourseId]);

  const loadLessons = async (forceRefresh = false) => {
    if (!selectedCourseId) return;
    
    setLessonsLoading(true);
    try {
      const lessonData = await fetchLessonsByCourse(selectedCourseId, { forceRefresh });
      setCurrentLessons(lessonData);
    } catch (error) {
      toast.error('レッスンの読み込みに失敗しました。');
      console.error(error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const openDialog = (lesson?: Lesson) => {
    if (lesson) {
      setSelectedLesson(lesson);
      setValue('title', lesson.title);
      setValue('description', lesson.description || '');
      setValue('assignment_description', lesson.assignment_description || '');
      setValue('order_index', lesson.order_index);
      setValue('block_number', lesson.block_number || 1);
    } else {
      setSelectedLesson(null);
      const newOrder = currentLessons.length > 0 ? Math.max(...currentLessons.map(l => l.order_index)) + 1 : 1;
      reset({ title: '', description: '', assignment_description: '', order_index: newOrder, block_number: 1 });
    }
    dialogRef.current?.showModal();
  };
  
  const closeDialog = () => {
    dialogRef.current?.close();
  }

  const openSongDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    resetSong({
      song_id: '',
      clear_conditions: {
        key: 0,
        speed: 1.0,
        rank: 'B',
        count: 1,
        notation_setting: 'both'
      }
    });
    songDialogRef.current?.showModal();
  };

  const closeSongDialog = () => {
    songDialogRef.current?.close();
  };

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
        order_index: Number(formData.order_index) || 0,
        block_number: Number(formData.block_number) || 1,
      };

      if (selectedLesson) {
        const updatedLesson = await updateLesson(selectedLesson.id, lessonData);
        
        // キャッシュを無効化してから再取得
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        
        // ① 画面を即時更新（オプティミスティック）
        setCurrentLessons(prev =>
          prev.map(l => (l.id === updatedLesson.id ? updatedLesson : l)),
        );
        
        toast.success('レッスンを更新しました。');
        
        // ② バックグラウンドで厳密データを再取得
        await loadLessons(true);
      } else {
        const newLesson = await addLesson({ ...lessonData, course_id: selectedCourseId });
        
        // キャッシュを無効化してから再取得
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        
        setCurrentLessons(prev => [...prev, newLesson]);
        
        toast.success('新しいレッスンを追加しました。');
        
        await loadLessons(true);
      }
      
      closeDialog();
    } catch (error) {
      toast.error('レッスンの保存に失敗しました。');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitSong = async (formData: SongFormData) => {
    if (!selectedLesson || !selectedCourseId) return;
    
    setIsSubmitting(true);
    try {
      const newLessonSong = await addSongToLesson({
        lesson_id: selectedLesson.id,
        song_id: formData.song_id,
        clear_conditions: formData.clear_conditions
      });
      
              // キャッシュを無効化してから再取得
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        
        // ① 画面を即時更新（オプティミスティック）
        setCurrentLessons(prev =>
          prev.map(lesson => 
            lesson.id === selectedLesson.id 
              ? { ...lesson, lesson_songs: [...(lesson.lesson_songs || []), newLessonSong] }
              : lesson
          )
        );
        
        toast.success('曲を追加しました。');
        
        // ② バックグラウンドで厳密データを再取得
        await loadLessons(true);
      
      closeSongDialog();
    } catch (error) {
      toast.error('曲の追加に失敗しました。');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedCourseId) return;
    
    if (window.confirm('本当にこのレッスンを削除しますか？')) {
      try {
        await deleteLesson(id);
        
        // キャッシュを無効化してから再取得
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        
        // ① 画面を即時更新（オプティミスティック）
        setCurrentLessons(prev => prev.filter(l => l.id !== id));
        
        toast.success('レッスンを削除しました。');
        
        // ② バックグラウンドで厳密データを再取得
        await loadLessons(true);
      } catch (error) {
        toast.error('レッスンの削除に失敗しました。');
        console.error(error);
      }
    }
  };

  const handleRemoveSong = async (lessonId: string, songId: string) => {
    if (!selectedCourseId) return;
    
    console.log('削除しようとしている曲:', { lessonId, songId });
    
    if (window.confirm('この曲をレッスンから削除しますか？')) {
      try {
        // 削除前の曲リストをログ出力
        const lesson = currentLessons.find(l => l.id === lessonId);
        console.log('削除前の曲リスト:', lesson?.lesson_songs);
        
        await removeSongFromLesson(lessonId, songId);
        
        // キャッシュを無効化してから再取得
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        
        // ① 画面を即時更新（オプティミスティック）
        setCurrentLessons(prev =>
          prev.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, lesson_songs: lesson.lesson_songs?.filter(ls => ls.song_id !== songId) || [] }
              : lesson
          )
        );
        
        toast.success('曲を削除しました。');
        
        // ② バックグラウンドで厳密データを再取得
        await loadLessons(true);
      } catch (error) {
        toast.error('曲の削除に失敗しました。');
        console.error('削除エラーの詳細:', error);
      }
    }
  };

  const toggleExpand = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourseId(e.target.value);
  };

  const handleClearCache = async () => {
    try {
      setLessonsLoading(true);
      await clearSupabaseCache();
      await loadLessons(true); // 強制的に再取得
      toast.success('キャッシュをクリアしました。');
    } catch (error) {
      toast.error('キャッシュのクリアに失敗しました。');
    } finally {
      setLessonsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">レッスン管理</h2>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleClearCache}>
            キャッシュクリア
          </button>
          <button className="btn btn-primary" onClick={() => openDialog()} disabled={!selectedCourseId}>
            新規レッスン追加
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="course-select" className="label">
          <span className="label-text">コースを選択</span>
        </label>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={handleCourseChange}
          className="select select-bordered w-full max-w-xs"
          disabled={loading}
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <button onClick={() => openDialog()} className="btn btn-primary">新しいレッスンを追加</button>
            <button onClick={handleClearCache} className="btn btn-ghost">キャッシュクリア</button>
          </div>

          {lessonsLoading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="space-y-4">
              {currentLessons.map((lesson) => (
                <div key={lesson.id} className="collapse collapse-arrow border border-base-300 bg-base-100">
                  <input
                    type="checkbox"
                    checked={expandedLessons.has(lesson.id)}
                    onChange={() => toggleExpand(lesson.id)}
                  />
                  <div className="collapse-title text-xl font-medium flex justify-between items-center">
                    <span>{lesson.order_index}. {lesson.title}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={(e) => { e.stopPropagation(); openDialog(lesson); }} className="btn btn-sm btn-circle btn-outline"><FaEdit /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }} className="btn btn-sm btn-circle btn-outline btn-error"><FaTrash /></button>
                    </div>
                  </div>
                  <div className="collapse-content">
                    <p>{lesson.description}</p>
                    <p><strong>課題:</strong> {lesson.assignment_description}</p>
                    <div className="divider">レッスン曲</div>
                    <div className="space-y-2">
                      {lesson.lesson_songs && lesson.lesson_songs.map(ls => (
                        <div key={ls.song_id} className="flex items-center justify-between p-2 rounded-lg bg-base-200">
                          <span>{availableSongs.find(s => s.id === ls.song_id)?.title || '不明な曲'}</span>
                          <button onClick={() => handleRemoveSong(lesson.id, ls.song_id)} className="btn btn-xs btn-error">削除</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => openSongDialog(lesson)} className="btn btn-sm btn-outline mt-4">
                      <FaMusic /> 曲を追加
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lesson Edit/Add Dialog */}
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
              <input type="number" {...register('order_index')} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label"><span className="label-text">レッスン説明</span></label>
              <textarea {...register('description')} className="textarea textarea-bordered w-full" rows={3}></textarea>
            </div>
            <div>
              <label className="label"><span className="label-text">課題説明</span></label>
              <textarea {...register('assignment_description')} className="textarea textarea-bordered w-full" rows={3}></textarea>
            </div>
            <div>
              <label className="label"><span className="label-text">ブロック</span></label>
              <input type="number" {...register('block_number')} className="input input-bordered w-full" />
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

      {/* 曲追加ダイアログ */}
      <dialog ref={songDialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">レッスンに曲を追加</h3>
          <form onSubmit={handleSubmitSong(onSubmitSong)} className="space-y-4 mt-4">
            <div>
              <label className="label"><span className="label-text">曲を選択 *</span></label>
              <select {...registerSong('song_id', { required: true })} className="select select-bordered w-full">
                <option value="">-- 曲を選択してください --</option>
                {availableSongs.map(song => (
                  <option key={song.id} value={song.id}>
                    {song.title} {song.artist && `- ${song.artist}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label"><span className="label-text">キー調整</span></label>
              <input 
                type="number" 
                {...registerSong('clear_conditions.key')} 
                className="input input-bordered w-full" 
                min="-12" 
                max="12"
                defaultValue={0}
              />
            </div>
            <div>
              <label className="label"><span className="label-text">最低速度</span></label>
              <input 
                type="number" 
                {...registerSong('clear_conditions.speed')} 
                className="input input-bordered w-full" 
                min="0.5" 
                max="2.0" 
                step="0.1"
                defaultValue={1.0}
              />
            </div>
            <div>
              <label className="label"><span className="label-text">最低ランク</span></label>
              <select {...registerSong('clear_conditions.rank')} className="select select-bordered w-full" defaultValue="B">
                <option value="S">S</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="label">
                <span className="label-text">達成条件</span>
              </label>
              <label className="flex items-center space-x-2 mb-2">
                <input 
                  type="checkbox" 
                  {...registerSong('clear_conditions.requires_days')} 
                  className="checkbox checkbox-sm" 
                />
                <span className="text-sm">日数でカウント（チェックなし: 回数でカウント）</span>
              </label>
            </div>
            {watchSong && watchSong('clear_conditions.requires_days') && (
              <div>
                <label className="label"><span className="label-text">1日あたりの必要クリア回数</span></label>
                <input 
                  type="number" 
                  {...registerSong('clear_conditions.daily_count')} 
                  className="input input-bordered w-full" 
                  min="1" 
                  max="20"
                  defaultValue={1}
                />
              </div>
            )}
            <div>
              <label className="label">
                <span className="label-text">
                  {watchSong && watchSong('clear_conditions.requires_days') ? '必要日数' : '最低クリア回数'}
                </span>
              </label>
              <input 
                type="number" 
                {...registerSong('clear_conditions.count')} 
                className="input input-bordered w-full" 
                min="1" 
                max="10"
                defaultValue={1}
              />
            </div>
            <div>
              <label className="label"><span className="label-text">楽譜表示設定</span></label>
              <select {...registerSong('clear_conditions.notation_setting')} className="select select-bordered w-full" defaultValue="both">
                <option value="notes_chords">ノート＆コード</option>
                <option value="chords_only">コードのみ</option>
                <option value="both">両方</option>
              </select>
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={closeSongDialog}>キャンセル</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '追加中...' : '追加'}
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