import { getSupabaseClient, clearSupabaseCache } from './supabaseClient';
import { Lesson, LessonSong, ClearConditions } from '@/types';

// Note: Lessons are tightly coupled to courses, so we don't use fetchWithCache here.
// The cache for 'courses' which contains lessons is cleared when lessons change.

/**
 * 特定のコースIDに紐づくレッスンを取得します。
 * @param {string} courseId
 * @returns {Promise<Lesson[]>}
 */
export async function fetchLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .select(`
      *,
      lesson_songs (
        *,
        songs (id, title, artist)
      )
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true });

  if (error) {
    console.error(`Error fetching lessons for course ${courseId}:`, error);
    throw error;
  }
  return data || [];
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
  const { data, error } = await getSupabaseClient()
    .from('lesson_songs')
    .insert(lessonSongData)
    .select()
    .single();
  
  if (error) {
    console.error('Error adding song to lesson:', error);
    throw error;
  }
  clearSupabaseCache();
  return data as LessonSong;
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
 * @param {string} lessonSongId
 * @param {ClearConditions} updates
 * @returns {Promise<LessonSong>}
 */
export async function updateLessonSongConditions(lessonSongId: string, updates: ClearConditions): Promise<LessonSong> {
    const { data, error } = await getSupabaseClient()
    .from('lesson_songs')
    .update({ clear_conditions: updates })
    .eq('id', lessonSongId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating lesson song conditions for ${lessonSongId}:`, error);
    throw error;
  }
  clearSupabaseCache();
  return data as LessonSong;
} 