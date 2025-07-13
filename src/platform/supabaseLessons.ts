import { getSupabaseClient, clearSupabaseCache, fetchWithCache } from './supabaseClient';
import { Lesson, LessonSong, ClearConditions } from '@/types';

// Note: Lessons are tightly coupled to courses, so we don't use fetchWithCache here.
// The cache for 'courses' which contains lessons is cleared when lessons change.

/**
 * 特定のコースIDに紐づくレッスンを取得します。
 * @param {string} courseId
 * @returns {Promise<Lesson[]>}
 */
export async function fetchLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const { data, error } = await fetchWithCache<any>(
    `lessons:${courseId}`,
    async () => await getSupabaseClient()
      .from('lessons')
      .select(`
        *,
        lesson_songs (
          lesson_id,
          song_id,
          key_offset,
          min_speed,
          min_rank,
          min_clear_count,
          notation_setting,
          songs (id, title, artist)
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    60 * 1000 // 1分キャッシュ
  );

  if (error) {
    console.error(`Error fetching lessons for course ${courseId}:`, error);
    throw error;
  }
  
  // lesson_songsの個別カラムをclear_conditionsオブジェクトに変換
  const lessons = (data || []).map((lesson: any) => ({
    ...lesson,
    lesson_songs: lesson.lesson_songs?.map((ls: any) => ({
      id: `${ls.lesson_id}_${ls.song_id}`, // 仮のID生成
      lesson_id: ls.lesson_id,
      song_id: ls.song_id,
      clear_conditions: {
        key: ls.key_offset || 0,
        speed: ls.min_speed || 1.0,
        rank: ls.min_rank || 'B',
        count: ls.min_clear_count || 1
      },
      created_at: new Date().toISOString(), // 仮の値
      songs: ls.songs
    }))
  }));
  
  return lessons as Lesson[];
}

type LessonData = Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'lesson_songs'>;

/**
 * 新しいレッスンを追加します。
 * @param {LessonData} lessonData
 * @returns {Promise<Lesson>}
 */
export async function addLesson(lessonData: LessonData): Promise<Lesson> {
  const insertData = { ...lessonData, order_index: lessonData.order_index ?? 0 };
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error adding lesson:', error);
    throw error;
  }
  clearSupabaseCache(); // Clear all caches, including courses
  return data as Lesson;
}

/**
 * 既存のレッスンを更新します。
 * @param {string} id
 * @param {Partial<LessonData>} updates
 * @returns {Promise<Lesson>}
 */
export async function updateLesson(id: string, updates: Partial<LessonData>): Promise<Lesson> {
  const updateData = { ...updates, order_index: updates.order_index ?? undefined };
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating lesson ${id}:`, error);
    throw error;
  }
  clearSupabaseCache();
  return data as Lesson;
}

/**
 * レッスンを削除します。
 * @param {string} id
 */
export async function deleteLesson(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting lesson ${id}:`, error);
    throw error;
  }
  clearSupabaseCache();
}


// --- Lesson Songs ---

type LessonSongData = {
  lesson_id: string;
  song_id: string;
  clear_conditions?: ClearConditions;
};

/**
 * レッスンに曲を追加します。
 * @param {LessonSongData} lessonSongData
 * @returns {Promise<LessonSong>}
 */
export async function addSongToLesson(lessonSongData: LessonSongData): Promise<LessonSong> {
  // clear_conditionsを個別のカラムに変換
  const insertData: any = {
    lesson_id: lessonSongData.lesson_id,
    song_id: lessonSongData.song_id,
    key_offset: lessonSongData.clear_conditions?.key || 0,
    min_speed: lessonSongData.clear_conditions?.speed || 1.0,
    min_rank: lessonSongData.clear_conditions?.rank || 'B',
    min_clear_count: lessonSongData.clear_conditions?.count || 1,
    notation_setting: 'both' // デフォルト値
  };
  
  const { data, error } = await getSupabaseClient()
    .from('lesson_songs')
    .insert(insertData)
    .select(`
      lesson_id,
      song_id,
      key_offset,
      min_speed,
      min_rank,
      min_clear_count,
      notation_setting
    `)
    .single();
  
  if (error) {
    console.error('Error adding song to lesson:', error);
    throw error;
  }
  
  // song情報を別途取得
  const { data: songData } = await getSupabaseClient()
    .from('songs')
    .select('id, title, artist')
    .eq('id', data.song_id)
    .single();
  
  clearSupabaseCache();
  
  // 個別カラムをclear_conditionsオブジェクトに変換
  const lessonSong: LessonSong = {
    id: `${data.lesson_id}_${data.song_id}`,
    lesson_id: data.lesson_id,
    song_id: data.song_id,
    clear_conditions: {
      key: data.key_offset || 0,
      speed: data.min_speed || 1.0,
      rank: data.min_rank || 'B',
      count: data.min_clear_count || 1
    },
    created_at: new Date().toISOString(),
    songs: songData || { id: data.song_id, title: '', artist: '' }
  };
  
  return lessonSong;
}

/**
 * レッスンから曲を削除します。
 * @param {string} lessonId
 * @param {string} songId
 */
export async function removeSongFromLesson(lessonId: string, songId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_songs')
    .delete()
    .eq('lesson_id', lessonId)
    .eq('song_id', songId);

  if (error) {
    console.error(`Error removing song ${songId} from lesson ${lessonId}:`, error);
    throw error;
  }
  clearSupabaseCache();
}

/**
 * レッスン曲のクリア条件を更新します。
 * @param {string} lessonId
 * @param {string} songId
 * @param {ClearConditions} updates
 * @returns {Promise<LessonSong>}
 */
export async function updateLessonSongConditions(lessonId: string, songId: string, updates: ClearConditions): Promise<LessonSong> {
    // clear_conditionsを個別のカラムに変換
    const updateData = {
      key_offset: updates.key,
      min_speed: updates.speed,
      min_rank: updates.rank,
      min_clear_count: updates.count
    };
    
    const { data, error } = await getSupabaseClient()
    .from('lesson_songs')
    .update(updateData)
    .eq('lesson_id', lessonId)
    .eq('song_id', songId)
    .select(`
      lesson_id,
      song_id,
      key_offset,
      min_speed,
      min_rank,
      min_clear_count,
      notation_setting
    `)
    .single();

  if (error) {
    console.error(`Error updating lesson song conditions for lesson ${lessonId}, song ${songId}:`, error);
    throw error;
  }
  
  // song情報を別途取得
  const { data: songData } = await getSupabaseClient()
    .from('songs')
    .select('id, title, artist')
    .eq('id', data.song_id)
    .single();
  
  clearSupabaseCache();
  
  // 個別カラムをclear_conditionsオブジェクトに変換
  const lessonSong: LessonSong = {
    id: `${data.lesson_id}_${data.song_id}`,
    lesson_id: data.lesson_id,
    song_id: data.song_id,
    clear_conditions: {
      key: data.key_offset || 0,
      speed: data.min_speed || 1.0,
      rank: data.min_rank || 'B',
      count: data.min_clear_count || 1
    },
    created_at: new Date().toISOString(),
    songs: songData || { id: data.song_id, title: '', artist: '' }
  };
  
  return lessonSong;
} 