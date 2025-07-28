import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Course, Lesson, ClearConditions } from '@/types';
import { Song as SongData } from '@/platform/supabaseSongs';
import { fetchCoursesSimple } from '@/platform/supabaseCourses';
import { fetchSongs } from '@/platform/supabaseSongs';
import { fetchLessonsByCourse, addLesson, updateLesson, deleteLesson, addSongToLesson, removeSongFromLesson, updateLessonSongConditions, LESSONS_CACHE_KEY } from '@/platform/supabaseLessons';
import { invalidateCacheKey, clearSupabaseCache } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';
import { FaMusic, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaGripVertical, FaDragon } from 'react-icons/fa';
import StageSelector from './StageSelector';
import { getSupabaseClient } from '@/platform/supabaseClient';

type LessonFormData = Pick<Lesson, 'title' | 'description' | 'assignment_description' | 'order_index' | 'block_number'>;

type SongFormData = {
  song_id: string;
  clear_conditions: ClearConditions;
};

type StageFormData = {
  fantasy_stage_id: string;
  clear_conditions: ClearConditions;
};

type LessonTaskMode = 'song' | 'fantasy';

export const LessonManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [availableSongs, setAvailableSongs] = useState<SongData[]>([]);
  const [availableStages, setAvailableStages] = useState<Array<{id:string; stage_number:string; name:string}>>([]);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [currentLessons, setCurrentLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [taskMode, setTaskMode] = useState<LessonTaskMode>('song');

  const toast = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<LessonFormData>();
  const { register: registerSong, handleSubmit: handleSubmitSong, reset: resetSong, setValue: setValueSong, watch: watchSong } = useForm<SongFormData>();
  const { register: registerStage, handleSubmit: handleSubmitStage, reset: resetStage, watch: watchStage } = useForm<StageFormData>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const songDialogRef = useRef<HTMLDialogElement>(null);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, songsData, stagesResult] = await Promise.all([
        fetchCoursesSimple(),
        fetchSongs('lesson'),
        getSupabaseClient()
          .from('fantasy_stages')
          .select('id, stage_number, name')
          .order('stage_number', { ascending: true })
      ]);
      setCourses(coursesData);
      setAvailableSongs(songsData);
      
      if (!stagesResult.error && stagesResult.data) {
        setAvailableStages(stagesResult.data);
      }

      if (!selectedCourseId || !coursesData.some(c => c.id === selectedCourseId)) {
        const firstCourseId = coursesData[0]?.id || '';
        setSelectedCourseId(firstCourseId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'データの読み込みに失敗しました。';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons(false);
    }
  }, [selectedCourseId]);

  const loadLessons = async (forceRefresh = false) => {
    if (!selectedCourseId) return;
    setLessonsLoading(true);
    setError(null);
    try {
      const data = await fetchLessonsByCourse(selectedCourseId, { forceRefresh });
      setCurrentLessons(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'レッスンの読み込みに失敗しました。';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading lessons:', error);
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
      const newOrder = currentLessons.length > 0 ? Math.max(...currentLessons.map(l => l.order_index)) + 1 : 0;
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
    resetStage({
      fantasy_stage_id: '',
      clear_conditions: {
        count: 1
      }
    });
    setTaskMode('song'); // デフォルトは曲モード
    songDialogRef.current?.showModal();
  };

  const closeSongDialog = () => {
    songDialogRef.current?.close();
  };

  const onSubmit = async (formData: LessonFormData) => {
    if (!selectedCourseId) return;
    
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
        
        setCurrentLessons(prev =>
          prev.map(l => l.id === selectedLesson.id ? updatedLesson : l)
        );
        
        toast.success('レッスンを更新しました。');
        
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        setTimeout(() => loadLessons(true), 500);
      } else {
        const newLesson = await addLesson({ ...lessonData, course_id: selectedCourseId });
        
        setCurrentLessons(prev => [...prev, newLesson]);
        
        toast.success('新しいレッスンを追加しました。');
        
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        setTimeout(() => loadLessons(true), 500);
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
      
      setCurrentLessons(prev =>
        prev.map(lesson => 
          lesson.id === selectedLesson.id 
            ? { ...lesson, lesson_songs: [...(lesson.lesson_songs || []), newLessonSong] }
            : lesson
        )
      );
      
      toast.success('曲を追加しました。');
      
      invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
      setTimeout(() => loadLessons(true), 500);
      
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
        
        setCurrentLessons(prev => prev.filter(l => l.id !== id));
        
        toast.success('レッスンを削除しました。');
        
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        setTimeout(() => loadLessons(true), 500);
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
        const lesson = currentLessons.find(l => l.id === lessonId);
        console.log('削除前の曲リスト:', lesson?.lesson_songs);
        
        await removeSongFromLesson(lessonId, songId);
        
        setCurrentLessons(prev =>
          prev.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, lesson_songs: lesson.lesson_songs?.filter(ls => ls.song_id !== songId) || [] }
              : lesson
          )
        );
        
        toast.success('曲を削除しました。');
        
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        setTimeout(() => loadLessons(true), 500);
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

  const handleClearCache = async () => {
    clearSupabaseCache();
    await loadInitialData();
    if (selectedCourseId) {
      await loadLessons(true);
    }
    toast.success('キャッシュをクリアし、データを再読み込みしました。');
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || isSorting) return;
    
    setIsSorting(true);
    const newLessons = [...currentLessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[index - 1];
    newLessons[index - 1] = temp;
    
    try {
      await Promise.all(
        newLessons.map((lesson, idx) => 
          updateLesson(lesson.id, { order_index: idx })
        )
      );
      
      invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
      setTimeout(() => loadLessons(true), 500);
      
      toast.success('並び順を更新しました。');
    } catch (error: any) {
      toast.error('並び順の更新に失敗しました。');
      console.error(error);
    } finally {
      setIsSorting(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === currentLessons.length - 1 || isSorting) return;
    
    setIsSorting(true);
    const newLessons = [...currentLessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[index + 1];
    newLessons[index + 1] = temp;
    
    try {
      await Promise.all(
        newLessons.map((lesson, idx) => 
          updateLesson(lesson.id, { order_index: idx })
        )
      );
      
      invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
      setTimeout(() => loadLessons(true), 500);
      
      toast.success('並び順を更新しました。');
    } catch (error: any) {
      toast.error('並び順の更新に失敗しました。');
      console.error(error);
    } finally {
      setIsSorting(false);
    }
  };

  const sortedLessons = useMemo(() => 
    [...currentLessons].sort((a, b) => a.order_index - b.order_index),
  [currentLessons]);

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

      <div className="relative overflow-x-auto rounded-md border border-gray-700">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-[50px]"></th>
              <th className="w-[100px]">並び順</th>
              <th>レッスンタイトル</th>
              <th>曲数</th>
              <th>ブロック</th>
              <th className="text-right">アクション</th>
            </tr>
          </thead>
          <tbody>
            {loading && currentLessons.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">読み込み中...</td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={6} className="text-center text-red-500">
                  <div className="py-4">
                    <p className="mb-2">エラー: {error}</p>
                    <button className="btn btn-sm btn-primary" onClick={() => loadLessons(true)}>
                      再読み込み
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && sortedLessons.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400">
                  レッスンがありません。新規レッスンを追加してください。
                </td>
              </tr>
            )}

            {sortedLessons.map((lesson, index) => (
              <React.Fragment key={lesson.id}>
                <tr>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleExpand(lesson.id)}>
                      {expandedLessons.has(lesson.id) ? '▼' : '▶'}
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
                        disabled={index === currentLessons.length - 1 || isSorting}
                        aria-label="下に移動"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </td>
                  <td className="font-medium">{lesson.title}</td>
                  <td>{lesson.lesson_songs?.length || 0}</td>
                  <td>ブロック {lesson.block_number || 1}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => openDialog(lesson)}>編集</button>
                    <button className="btn btn-ghost btn-sm text-blue-500" onClick={() => openSongDialog(lesson)}>
                      <FaMusic className="mr-1" /> 曲追加
                    </button>
                    <button className="btn btn-ghost btn-sm text-red-500" onClick={() => handleDelete(lesson.id)}>削除</button>
                  </td>
                </tr>
                {expandedLessons.has(lesson.id) && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div className="p-4 bg-slate-800/50">
                        <h5 className="font-semibold mb-2">レッスン内容</h5>
                        <p className="text-sm text-gray-400 mb-4">{lesson.description || '説明はありません。'}</p>
                        {lesson.assignment_description && (
                          <>
                            <h5 className="font-semibold mb-2">課題説明</h5>
                            <p className="text-sm text-gray-400 mb-4">{lesson.assignment_description}</p>
                          </>
                        )}
                        <h5 className="font-semibold mb-2">収録曲・課題</h5>
                        {lesson.lesson_songs && lesson.lesson_songs.length > 0 ? (
                          <div className="space-y-2">
                            {lesson.lesson_songs.map(ls => {
                              if (ls.is_fantasy) {
                                // ファンタジーステージ課題の場合
                                const stage = availableStages.find(s => s.id === ls.fantasy_stage_id);
                                return (
                                  <div key={ls.id || ls.fantasy_stage_id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                    <div className="flex items-center">
                                      <FaDragon className="mr-2 text-purple-400" />
                                      <div>
                                        <span className="font-medium">{stage ? `${stage.stage_number} : ${stage.name}` : '不明なステージ'}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                          (クリア回数: {ls.clear_conditions?.count || 1}回)
                                        </span>
                                      </div>
                                    </div>
                                    <button 
                                      className="btn btn-ghost btn-xs text-red-500"
                                      onClick={() => handleRemoveSong(lesson.id, ls.fantasy_stage_id || '')}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                );
                              } else {
                                // 通常の曲課題の場合
                                const song = availableSongs.find(s => s.id === ls.song_id);
                                return (
                                  <div key={ls.song_id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                    <div className="flex items-center">
                                      <FaMusic className="mr-2 text-blue-400" />
                                      <div>
                                        <span className="font-medium">{song?.title || '不明な曲'}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                          (キー: {ls.clear_conditions?.key || 0}, 
                                          速度: {ls.clear_conditions?.speed || 1.0}x, 
                                          ランク: {ls.clear_conditions?.rank || 'B'},
                                          {ls.clear_conditions?.requires_days 
                                            ? `${ls.clear_conditions?.daily_count || 1}回 × ${ls.clear_conditions?.count || 1}日間`
                                            : `${ls.clear_conditions?.count || 1}回`},
                                          楽譜: {ls.clear_conditions?.notation_setting === 'notes_chords' ? 'ノート＆コード' : 
                                                 ls.clear_conditions?.notation_setting === 'chords_only' ? 'コードのみ' : '両方'})
                                        </span>
                                      </div>
                                    </div>
                                    <button 
                                      className="btn btn-ghost btn-xs text-red-500"
                                      onClick={() => handleRemoveSong(lesson.id, ls.song_id)}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">曲・課題が登録されていません。</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            
            {lessonsLoading && (
              <tr>
                <td colSpan={6} className="text-center text-xs text-gray-400">同期中…</td>
              </tr>
            )}
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

      <dialog ref={songDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg">レッスン課題を追加</h3>
          {/* --- タスクモード切替 --- */}
          <div className="tabs tabs-boxed mb-4">
            <a className={`tab ${taskMode==='song'?'tab-active':''}`} onClick={()=>setTaskMode('song')}>
              <FaMusic className="mr-1"/> 通常曲
            </a>
            <a className={`tab ${taskMode==='fantasy'?'tab-active':''}`} onClick={()=>setTaskMode('fantasy')}>
              <FaDragon className="mr-1"/> ファンタジーステージ
            </a>
          </div>
          
          {/* ========= 曲課題フォーム ========= */}
          {taskMode === 'song' && (
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
あ              <select {...registerSong('clear_conditions.rank')} className="select select-bordered w-full" defaultValue="B">
                <option value="S">S</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
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
          )}
          
          {/* ========= ステージ課題フォーム ========= */}
          {taskMode === 'fantasy' && (
          <form onSubmit={handleSubmitStage(async (data) => {
            if (!selectedLesson || !selectedCourseId) return;
            
            setIsSubmitting(true);
            try {
              const lessonSongData = {
                lesson_id: selectedLesson.id,
                song_id: null,
                clear_conditions: data.clear_conditions,
                is_fantasy: true,
                fantasy_stage_id: data.fantasy_stage_id
              };
              console.log('ファンタジーステージ課題追加データ:', lessonSongData);
              
              await addSongToLesson(lessonSongData as any);
              
              invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
              setTimeout(() => loadLessons(true), 500);
              
              toast.success('ステージ課題を追加しました。');
              closeSongDialog();
            } catch (error) {
              toast.error('ステージ課題の追加に失敗しました。');
              console.error('ファンタジーステージ課題追加エラー:', error);
            } finally {
              setIsSubmitting(false);
            }
          })} className="space-y-4 mt-4">
            <div>
              <label className="label"><span className="label-text">ステージ *</span></label>
              <StageSelector {...registerStage('fantasy_stage_id', { required: true })} />
            </div>
            <div>
              <label className="label">
                <span className="label-text">達成条件</span>
              </label>
              <label className="flex items-center space-x-2 mb-2">
                <input 
                  type="checkbox" 
                  {...registerStage('clear_conditions.requires_days')} 
                  className="checkbox checkbox-sm" 
                />
                <span className="text-sm">日数でカウント（チェックなし: 回数でカウント）</span>
              </label>
            </div>
            {watchStage && watchStage('clear_conditions.requires_days') && (
              <div>
                <label className="label"><span className="label-text">1日あたりの必要クリア回数</span></label>
                <input 
                  type="number" 
                  {...registerStage('clear_conditions.daily_count')} 
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
                  {watchStage && watchStage('clear_conditions.requires_days') ? '必要日数' : '最低クリア回数'}
                </span>
              </label>
              <input 
                type="number" 
                {...registerStage('clear_conditions.count')} 
                className="input input-bordered w-full"
                min="1"
                max="10"
                defaultValue={1}
              />
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={closeSongDialog}>キャンセル</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '追加中...' : '追加'}
              </button>
            </div>
          </form>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default LessonManager; 