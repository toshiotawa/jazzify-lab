import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Course, Lesson, fetchCourses, createCourse, fetchLessons, createLesson, addSongToLesson, removeSongFromLesson, LessonSong } from '@/platform/supabaseLessons';
import { 
  LessonVideo, 
  fetchLessonVideos, 
  addLessonVideo, 
  deleteLessonVideo 
} from '@/platform/supabaseLessonContent';
import { MembershipRank, Song, fetchSongs } from '@/platform/supabaseSongs';
import { useToast, handleApiError } from '@/stores/toastStore';

// 曲追加モーダル
const AddSongModal: React.FC<{
  lesson: Lesson;
  onClose: () => void;
  onSongAdded: () => void;
}> = ({ lesson, onClose, onSongAdded }) => {
  const [lessonSongs, setLessonSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const songs = await fetchSongs('lesson');
        const existingSongIds = new Set(lesson.lesson_songs.map(ls => ls.song_id));
        setLessonSongs(songs.filter(s => !existingSongIds.has(s.id)));
      } catch (e) {
        toast.error(handleApiError(e, 'レッスン用曲リスト取得'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lesson.id, lesson.lesson_songs, toast]);

  const handleAddSong = async (songId: string) => {
    try {
      const orderIndex = lesson.lesson_songs.length;
      await addSongToLesson(lesson.id, songId, orderIndex);
      toast.success('曲をレッスンに追加しました');
      onSongAdded();
    } catch(e) {
      toast.error(handleApiError(e, 'レッスンへの曲追加'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md text-white space-y-4" onClick={e => e.stopPropagation()}>
        <h4 className="text-lg font-bold">レッスンに曲を追加</h4>
        {loading ? <p>読み込み中...</p> : (
          <ul className="space-y-2 max-h-96 overflow-auto">
            {lessonSongs.map(song => (
              <li key={song.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                <div>
                  <p>{song.title}</p>
                  <p className="text-xs text-gray-400">{song.artist}</p>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => handleAddSong(song.id)}>追加</button>
              </li>
            ))}
            {lessonSongs.length === 0 && <p className="text-sm text-gray-400">追加できるレッスン用の曲がありません。</p>}
          </ul>
        )}
        <button className="btn btn-sm btn-outline w-full" onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}

const LessonManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isAddSongModalOpen, setAddSongModalOpen] = useState(false);
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
    // 選択中のレッスン情報を更新
    if (selectedLesson) {
      const updatedLesson = data.find(l => l.id === selectedLesson.id);
      setSelectedLesson(updatedLesson || null);
    }
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => {
    if (selectedCourse) {
      loadLessons(selectedCourse.id);
      setSelectedLesson(null); // コース切り替え時にレッスン選択解除
    } else {
      setLessons([]);
      setSelectedLesson(null);
    }
  }, [selectedCourse]);

  const onCreateCourse = async (v: any) => {
    try {
      await createCourse({ ...v, description: v.description ?? null });
      toast.success('コースを追加しました', { title: '追加完了' });
      reset();
      await loadCourses();
    } catch(e) {
      toast.error(handleApiError(e, 'コース追加'), { title: '追加エラー' });
    }
  };

  const onCreateLesson = async (v: any) => {
    if (!selectedCourse) return;
    try {
      await createLesson({ course_id: selectedCourse.id, title: v.title, description: null, order_index: lessons.length });
      toast.success('レッスンを追加しました', { title: '追加完了' });
      resetLesson();
      await loadLessons(selectedCourse.id);
    } catch(e) {
      toast.error(handleApiError(e, 'レッスン追加'), { title: '追加エラー' });
    }
  };

  const handleRemoveSong = async (lessonSong: LessonSong) => {
    if (!selectedLesson) return;
    try {
      await removeSongFromLesson(lessonSong.id, selectedLesson.id);
      toast.success('レッスンから曲を削除しました');
      // lesson stateを直接更新するか、再取得するか
      await loadLessons(selectedLesson.course_id);
    } catch(e) {
      toast.error(handleApiError(e, 'レッスンからの曲削除'));
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List & Add */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">コース一覧</h3>
          <ul className="space-y-1 max-h-60 overflow-auto bg-slate-800/50 rounded-lg p-2">
            {courses.map(c => (
              <li key={c.id} className={`p-2 rounded cursor-pointer transition-colors ${selectedCourse?.id===c.id?'bg-slate-700':'hover:bg-slate-700/50'}`} onClick={()=>setSelectedCourse(c)}>
                <span className="truncate block">{c.title}</span>
                <span className="text-xs text-gray-400">({c.min_rank})</span>
              </li>
            ))}
          </ul>

          <form className="space-y-2" onSubmit={handleSubmit(onCreateCourse)}>
            <input className="input input-bordered w-full text-white" placeholder="コースタイトル" {...register('title',{required:true})} />
            <textarea className="textarea textarea-bordered w-full text-white" placeholder="説明 (任意)" rows={2} {...register('description')} />
            <select className="select select-bordered w-full text-white" {...register('min_rank')} defaultValue="premium">
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
          <div className="space-y-4">
            <h3 className="text-xl font-bold truncate">{selectedCourse.title} のレッスン</h3>
            <ul className="space-y-1 max-h-96 overflow-auto bg-slate-800/50 rounded-lg p-2">
              {lessons.map(l => (
                <li key={l.id} className={`p-2 rounded cursor-pointer transition-colors ${selectedLesson?.id===l.id?'bg-slate-700':'hover:bg-slate-700/50'}`} onClick={() => setSelectedLesson(l)}>
                  <span className="text-sm font-medium">#{l.order_index+1}</span>
                  <span className="ml-2 truncate">{l.title}</span>
                </li>
              ))}
            </ul>
            <form className="space-y-2" onSubmit={handleLessonSubmit(onCreateLesson)}>
              <input className="input input-bordered w-full text-white" placeholder="レッスンタイトル" {...regLesson('title',{required:true})} />
              <button className="btn btn-sm btn-secondary w-full" type="submit">レッスン追加</button>
            </form>
          </div>
        )}

        {/* Lesson Detail */}
        {selectedLesson && (
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-xl font-bold truncate">レッスン詳細: {selectedLesson.title}</h3>
            
            {/* 紐づく曲 */}
            <div className="space-y-2">
              <h4 className="font-semibold">課題曲</h4>
              <ul className="space-y-2">
                {selectedLesson.lesson_songs.sort((a,b) => a.order_index - b.order_index).map(ls => (
                  <li key={ls.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                    <div>
                      <p className="font-medium">{ls.songs.title}</p>
                      <p className="text-xs text-gray-400">{ls.songs.artist}</p>
                    </div>
                    <button className="btn btn-xs btn-error" onClick={() => handleRemoveSong(ls)}>削除</button>
                  </li>
                ))}
                {selectedLesson.lesson_songs.length === 0 && (
                  <p className="text-xs text-gray-400 p-2">このレッスンには曲がありません。</p>
                )}
              </ul>
              <button className="btn btn-sm btn-outline w-full" onClick={() => setAddSongModalOpen(true)}>曲を追加</button>
            </div>
            
            {/* TODO: 動画管理 */}
          </div>
        )}
      </div>

      {isAddSongModalOpen && selectedLesson && (
        <AddSongModal
          lesson={selectedLesson}
          onClose={() => setAddSongModalOpen(false)}
          onSongAdded={() => {
            setAddSongModalOpen(false);
            if (selectedCourse) loadLessons(selectedCourse.id);
          }}
        />
      )}
    </>
  );
};

export default LessonManager; 