import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Course, Lesson, ClearConditions, FantasyStage } from '@/types';
import { Song as SongData } from '@/platform/supabaseSongs';
import { fetchCoursesSimple } from '@/platform/supabaseCourses';
import { fetchSongs } from '@/platform/supabaseSongs';
import { fetchLessonsByCourse, addLesson, updateLesson, deleteLesson, addSongToLesson, removeSongFromLesson, updateLessonSongConditions, addFantasyStageToLesson, removeFantasyStageFromLesson, LESSONS_CACHE_KEY } from '@/platform/supabaseLessons';
import { fetchFantasyStages } from '@/platform/supabaseFantasyStages';
import { invalidateCacheKey, clearSupabaseCache } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';
import { FaMusic, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaGripVertical, FaDragon } from 'react-icons/fa';
import { FantasyStageSelector } from './FantasyStageSelector';
import { uploadLessonVideo, uploadLessonAttachment, deleteLessonAttachmentByKey, deleteLessonVideoByKey } from '@/platform/r2Storage';
import { addLessonVideoR2, fetchLessonAttachments, addLessonAttachment as insertLessonAttachment, deleteLessonAttachment as removeLessonAttachment, fetchLessonVideos, deleteLessonVideoRecord, LessonVideo } from '@/platform/supabaseLessonContent';

type LessonFormData = Pick<Lesson, 'title' | 'description' | 'assignment_description' | 'order_index' | 'block_number'>;

type SongFormData = {
  song_id: string;
  clear_conditions: ClearConditions;
};

type ContentFormData = {
  content_type: 'song' | 'fantasy';
  song_id?: string;
  fantasy_stage_id?: string;
  clear_conditions: ClearConditions;
};

export const LessonManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [availableSongs, setAvailableSongs] = useState<SongData[]>([]);
  const [availableFantasyStages, setAvailableFantasyStages] = useState<FantasyStage[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [currentLessons, setCurrentLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [attachmentsByLesson, setAttachmentsByLesson] = useState<Record<string, any[]>>({});
  const [videosByLesson, setVideosByLesson] = useState<Record<string, LessonVideo[]>>({});
  const videoInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<LessonFormData>();
  const { register: registerSong, handleSubmit: handleSubmitSong, reset: resetSong, setValue: setValueSong, watch: watchSong } = useForm<SongFormData>();
  const { register: registerContent, handleSubmit: handleSubmitContent, reset: resetContent, setValue: setValueContent, watch: watchContent } = useForm<ContentFormData>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const songDialogRef = useRef<HTMLDialogElement>(null);
  const contentDialogRef = useRef<HTMLDialogElement>(null);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, songsData, fantasyStagesData] = await Promise.all([
        fetchCoursesSimple(),
        fetchSongs('lesson'),
        fetchFantasyStages()
      ]);
      setCourses(coursesData);
      setAvailableSongs(songsData);
      setAvailableFantasyStages(fantasyStagesData);

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

  const loadLessonExtras = async (lessonId: string) => {
    try {
      const attachments = await fetchLessonAttachments(lessonId);
      setAttachmentsByLesson(prev => ({ ...prev, [lessonId]: attachments }));
      const videos = await fetchLessonVideos(lessonId);
      setVideosByLesson(prev => ({ ...prev, [lessonId]: videos }));
    } catch (e) {
      console.error('Failed to load attachments:', e);
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
    songDialogRef.current?.showModal();
  };

  const closeSongDialog = () => {
    songDialogRef.current?.close();
  };
  
  const openContentDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    resetContent({
      content_type: 'song',
      clear_conditions: {
        key: 0,
        speed: 1.0,
        rank: 'B',
        count: 1,
        notation_setting: 'both'
      }
    });
    contentDialogRef.current?.showModal();
  };
  
  const closeContentDialog = () => {
    contentDialogRef.current?.close();
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
  
  const onSubmitContent = async (formData: ContentFormData) => {
    if (!selectedLesson || !selectedCourseId) return;
    
    setIsSubmitting(true);
    try {
      let newLessonSong;
      
      if (formData.content_type === 'song' && formData.song_id) {
        newLessonSong = await addSongToLesson({
          lesson_id: selectedLesson.id,
          song_id: formData.song_id,
          clear_conditions: formData.clear_conditions
        });
      } else if (formData.content_type === 'fantasy' && formData.fantasy_stage_id) {
        newLessonSong = await addFantasyStageToLesson({
          lesson_id: selectedLesson.id,
          fantasy_stage_id: formData.fantasy_stage_id,
          clear_conditions: formData.clear_conditions
        });
      } else {
        throw new Error('コンテンツが選択されていません');
      }
      
      setCurrentLessons(prev =>
        prev.map(lesson => 
          lesson.id === selectedLesson.id 
            ? { ...lesson, lesson_songs: [...(lesson.lesson_songs || []), newLessonSong] }
            : lesson
        )
      );
      
      toast.success(formData.content_type === 'song' ? '楽曲を追加しました。' : 'ファンタジーステージを追加しました。');
      
      invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
      setTimeout(() => loadLessons(true), 500);
      
      closeContentDialog();
    } catch (error) {
      toast.error('課題の追加に失敗しました。');
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
  
  const handleRemoveContent = async (lessonId: string, lessonSongId: string, isFantasy: boolean, contentId: string) => {
    if (!selectedCourseId) return;
    
    const confirmMessage = isFantasy ? 'このファンタジーステージをレッスンから削除しますか？' : 'この曲をレッスンから削除しますか？';
    
    if (window.confirm(confirmMessage)) {
      try {
        if (isFantasy) {
          await removeFantasyStageFromLesson(lessonId, contentId);
        } else {
          await removeSongFromLesson(lessonId, contentId);
        }
        
        setCurrentLessons(prev =>
          prev.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, lesson_songs: lesson.lesson_songs?.filter(ls => ls.id !== lessonSongId) || [] }
              : lesson
          )
        );
        
        toast.success(isFantasy ? 'ファンタジーステージを削除しました。' : '曲を削除しました。');
        
        invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
        setTimeout(() => loadLessons(true), 500);
      } catch (error) {
        toast.error('課題の削除に失敗しました。');
        console.error('削除エラーの詳細:', error);
      }
    }
  };

  const toggleExpand = (lessonId: string) => {
    const willExpand = !expandedLessons.has(lessonId);
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
    if (willExpand) {
      loadLessonExtras(lessonId);
    }
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
                    <button className="btn btn-ghost btn-sm text-blue-500" onClick={() => openContentDialog(lesson)}>
                      <FaMusic className="mr-1" /> 課題追加
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
                        <h5 className="font-semibold mb-2">レッスン課題</h5>
                        {lesson.lesson_songs && lesson.lesson_songs.length > 0 ? (
                          <div className="space-y-2">
                            {lesson.lesson_songs.map(ls => {
                              if (ls.is_fantasy) {
                                // ファンタジーステージの表示
                                const stage = ls.fantasy_stage;
                                return (
                                  <div key={ls.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                    <div>
                                      <FaDragon className="inline-block mr-2 text-purple-400" />
                                      <span className="font-medium">{stage?.name || '不明なステージ'}</span>
                                      <span className="text-xs text-purple-400 ml-2">[ファンタジー]</span>
                                      <span className="text-xs text-gray-400 ml-2">
                                        ({stage?.stage_number || '?'}, 
                                        ランク: {ls.clear_conditions?.rank || 'B'},
                                        {ls.clear_conditions?.requires_days 
                                          ? `${ls.clear_conditions?.daily_count || 1}回 × ${ls.clear_conditions?.count || 1}日間`
                                          : `${ls.clear_conditions?.count || 1}回`})
                                      </span>
                                    </div>
                                    <button 
                                      className="btn btn-ghost btn-xs text-red-500"
                                      onClick={() => handleRemoveContent(lesson.id, ls.id, true, ls.fantasy_stage_id!)}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                );
                              } else {
                                // 楽曲の表示
                                const song = availableSongs.find(s => s.id === ls.song_id);
                                return (
                                  <div key={ls.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                    <div>
                                      <FaMusic className="inline-block mr-2 text-blue-400" />
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
                                    <button 
                                      className="btn btn-ghost btn-xs text-red-500"
                                      onClick={() => handleRemoveContent(lesson.id, ls.id, false, ls.song_id!)}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">課題が登録されていません。</p>
                        )}

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold mb-2">動画</h5>
                            <div className="flex items-center gap-2 mb-3">
                              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" className="file-input file-input-bordered file-input-sm" />
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                  const file = videoInputRef.current?.files?.[0];
                                  if (!file) return;
                                  try {
                                    const uploaded = await uploadLessonVideo(file, lesson.id);
                                    await addLessonVideoR2(lesson.id, { url: uploaded.url, r2_key: uploaded.key, content_type: uploaded.contentType });
                                    toast.success('動画をアップロードしました');
                                    invalidateCacheKey(LESSONS_CACHE_KEY(selectedCourseId));
                                    await loadLessonExtras(lesson.id);
                                  } catch (e) {
                                    toast.error('動画のアップロードに失敗しました');
                                    console.error(e);
                                  } finally {
                                    if (videoInputRef.current) videoInputRef.current.value = '';
                                  }
                                }}
                              >アップロード</button>
                            </div>
                            <p className="text-xs text-gray-400">対応: mp4 / mov / webm / m4v, 最大200MB</p>
                            <div className="mt-3 space-y-2">
                              {(videosByLesson[lesson.id] || []).map(v => (
                                <div key={v.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                  <div className="text-sm">
                                    { (v as any).video_url ? (
                                      <a href={(v as any).video_url} target="_blank" rel="noreferrer" className="underline">R2動画</a>
                                    ) : (
                                      <span className="text-gray-300">Bunny/外部動画</span>
                                    )}
                                    <span className="text-xs text-gray-400 ml-2">順序: {v.order_index ?? 0}</span>
                                  </div>
                                  <button
                                    className="btn btn-ghost btn-xs text-red-500"
                                    onClick={async () => {
                                      if (!window.confirm('この動画を削除しますか？（R2にある場合はファイルも削除）')) return;
                                      try {
                                        await deleteLessonVideoRecord(v.id);
                                        if ((v as any).r2_key) {
                                          try { await deleteLessonVideoByKey((v as any).r2_key); } catch {}
                                        }
                                        toast.success('動画を削除しました');
                                        await loadLessonExtras(lesson.id);
                                      } catch (e) {
                                        toast.error('動画の削除に失敗しました');
                                        console.error(e);
                                      }
                                    }}
                                  >削除</button>
                                </div>
                              ))}
                              <button className="btn btn-ghost btn-xs" onClick={() => loadLessonExtras(lesson.id)}>再読み込み</button>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-2">添付ファイル</h5>
                            <div className="flex items-center gap-2 mb-3">
                              <input ref={attachmentInputRef} type="file" accept="application/pdf,audio/mpeg,audio/wav,audio/mp4" className="file-input file-input-bordered file-input-sm" />
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                  const file = attachmentInputRef.current?.files?.[0];
                                  if (!file) return;
                                  try {
                                    const uploaded = await uploadLessonAttachment(file, lesson.id);
                                    await insertLessonAttachment({
                                      lesson_id: lesson.id,
                                      file_name: uploaded.fileName,
                                      url: uploaded.url,
                                      r2_key: uploaded.key,
                                      content_type: uploaded.contentType,
                                      size: uploaded.size,
                                    });
                                    toast.success('添付ファイルを追加しました');
                                    await loadLessonExtras(lesson.id);
                                  } catch (e) {
                                    toast.error('添付ファイルの追加に失敗しました');
                                    console.error(e);
                                  } finally {
                                    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
                                  }
                                }}
                              >追加</button>
                            </div>
                            <p className="text-xs text-gray-400">例: PDF, MP3, WAV, M4A, 最大50MB</p>
                            <div className="mt-3 space-y-2">
                              {(attachmentsByLesson[lesson.id] || []).map(att => (
                                <div key={att.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                  <a href={att.url} target="_blank" rel="noreferrer" className="text-sm underline">
                                    {att.file_name}
                                  </a>
                                  <button
                                    className="btn btn-ghost btn-xs text-red-500"
                                    onClick={async () => {
                                      if (!window.confirm('この添付ファイルを削除しますか？')) return;
                                      try {
                                        await removeLessonAttachment(att.id);
                                        await deleteLessonAttachmentByKey(att.r2_key);
                                        toast.success('添付ファイルを削除しました');
                                        await loadLessonExtras(lesson.id);
                                      } catch (e) {
                                        toast.error('削除に失敗しました');
                                        console.error(e);
                                      }
                                    }}
                                  >削除</button>
                                </div>
                              ))}
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => loadLessonExtras(lesson.id)}
                              >再読み込み</button>
                            </div>
                          </div>
                        </div>
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
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      
      <dialog ref={contentDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg">レッスンに課題を追加</h3>
          <form onSubmit={handleSubmitContent(onSubmitContent)} className="space-y-4 mt-4">
            <div>
              <label className="label"><span className="label-text">課題タイプ *</span></label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    {...registerContent('content_type')} 
                    value="song" 
                    className="radio radio-primary" 
                    defaultChecked
                  />
                  <span className="ml-2">楽曲</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    {...registerContent('content_type')} 
                    value="fantasy" 
                    className="radio radio-primary" 
                  />
                  <span className="ml-2">ファンタジーステージ</span>
                </label>
              </div>
            </div>
            
            {watchContent && watchContent('content_type') === 'song' ? (
              <div>
                <label className="label"><span className="label-text">曲を選択 *</span></label>
                <select {...registerContent('song_id', { required: true })} className="select select-bordered w-full">
                  <option value="">-- 曲を選択してください --</option>
                  {availableSongs.map(song => (
                    <option key={song.id} value={song.id}>
                      {song.title} {song.artist && `- ${song.artist}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="label"><span className="label-text">ファンタジーステージを選択 *</span></label>
                <FantasyStageSelector 
                  selectedStageId={watchContent('fantasy_stage_id') || null}
                  onStageSelect={(stageId) => setValueContent('fantasy_stage_id', stageId)}
                />
              </div>
            )}
            
            {watchContent && watchContent('content_type') === 'song' && (
              <>
                <div>
                  <label className="label"><span className="label-text">キー調整</span></label>
                  <input 
                    type="number" 
                    {...registerContent('clear_conditions.key')} 
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
                    {...registerContent('clear_conditions.speed')} 
                    className="input input-bordered w-full" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    defaultValue={1.0}
                  />
                </div>
                <div>
                  <label className="label"><span className="label-text">楽譜表示設定</span></label>
                  <select {...registerContent('clear_conditions.notation_setting')} className="select select-bordered w-full" defaultValue="both">
                    <option value="notes_chords">ノート＆コード</option>
                    <option value="chords_only">コードのみ</option>
                    <option value="both">両方</option>
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="label"><span className="label-text">最低ランク</span></label>
              <select {...registerContent('clear_conditions.rank')} className="select select-bordered w-full" defaultValue="B">
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
                  {...registerContent('clear_conditions.requires_days')} 
                  className="checkbox checkbox-sm" 
                />
                <span className="text-sm">日数でカウント（チェックなし: 回数でカウント）</span>
              </label>
            </div>
            
            {watchContent && watchContent('clear_conditions.requires_days') && (
              <div>
                <label className="label"><span className="label-text">1日あたりの必要クリア回数</span></label>
                <input 
                  type="number" 
                  {...registerContent('clear_conditions.daily_count')} 
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
                  {watchContent && watchContent('clear_conditions.requires_days') ? '必要日数' : '最低クリア回数'}
                </span>
              </label>
              <input 
                type="number" 
                {...registerContent('clear_conditions.count')} 
                className="input input-bordered w-full" 
                min="1" 
                max="30"
                defaultValue={1}
              />
            </div>
            
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={closeContentDialog}>キャンセル</button>
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