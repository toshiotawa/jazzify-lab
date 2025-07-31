import { getSupabaseClient, fetchWithCache } from './supabaseClient';
import { Lesson, LessonSong, ClearConditions } from '@/types';

// レッスンキャッシュキー生成関数
export const LESSONS_CACHE_KEY = (courseId: string) => `lessons:${courseId}`;

/**
 * 特定のコースIDに紐づくレッスンを取得します。
 * @param {string} courseId
 * @param {Object} options オプション
 * @param {boolean} options.forceRefresh キャッシュを無視して最新データを取得
 * @returns {Promise<Lesson[]>}
 */
export async function fetchLessonsByCourse(
  courseId: string, 
  { forceRefresh = false } = {}
): Promise<Lesson[]> {
  const cacheKey = LESSONS_CACHE_KEY(courseId);

  if (forceRefresh) {
    // キャッシュをバイパスして直接取得
    const { data, error } = await getSupabaseClient()
      .from('lessons')
      .select(`
        *,
        lesson_songs (
          *,
          songs (id, title, artist),
          fantasy_stage:fantasy_stages (*)
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      // console.error(`Error fetching lessons for course ${courseId}:`, error);
      throw error;
    }

    // 新しいデータでキャッシュを更新
    const supabaseClient = await import('./supabaseClient');
    supabaseClient.clearCacheByKey(cacheKey);
    
    return data || [];
  }

  const { data, error } = await fetchWithCache<Lesson>(
    cacheKey,
    async () => await getSupabaseClient()
      .from('lessons')
      .select(`
        *,
        lesson_songs (
          *,
          songs (id, title, artist),
          fantasy_stage:fantasy_stages (*)
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    60 * 1000 // 1分キャッシュ
  );

  if (error) {
    // console.error(`Error fetching lessons for course ${courseId}:`, error);
    throw error;
  }
  return data || [];
}

/**
 * 特定のレッスンIDでレッスンを取得します。
 * @param {string} lessonId
 * @returns {Promise<Lesson>}
 */
export async function fetchLessonById(lessonId: string): Promise<Lesson> {
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .select(`
      *,
      lesson_songs (
        *,
        songs (id, title, artist)
      )
    `)
    .eq('id', lessonId)
    .single();

  if (error) {
    // console.error(`Error fetching lesson ${lessonId}:`, error);
    throw error;
  }
  return data as Lesson;
}

type LessonData = Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'lesson_songs' | 'videos' | 'songs'>;

/**
 * 新しいレッスンを追加します。
 * @param {LessonData} lessonData
 * @returns {Promise<Lesson>}
 */
export async function addLesson(lessonData: LessonData): Promise<Lesson> {
  const insertData = { 
    ...lessonData, 
    order_index: lessonData.order_index ?? 1,
    block_number: lessonData.block_number ?? 1
  };
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // console.error('Error adding lesson:', error);
    throw error;
  }
  return data as Lesson;
}

/**
 * 既存のレッスンを更新します。
 * @param {string} id
 * @param {Partial<LessonData>} updates
 * @returns {Promise<Lesson>}
 */
export async function updateLesson(id: string, updates: Partial<LessonData>): Promise<Lesson> {
  const updateData = { 
    ...updates, 
    order_index: updates.order_index ?? undefined,
    block_number: updates.block_number ?? undefined
  };
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // console.error(`Error updating lesson ${id}:`, error);
    throw error;
  }
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
    // console.error(`Error deleting lesson ${id}:`, error);
    throw error;
  }
}


// --- Lesson Songs ---

type LessonSongData = {
  lesson_id: string;
  song_id: string;
  clear_conditions?: ClearConditions;
};

type FantasyLessonSongData = {
  lesson_id: string;
  fantasy_stage_id: string;
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
    // console.error('Error adding song to lesson:', error);
    throw error;
  }
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
    // console.error(`Error removing song ${songId} from lesson ${lessonId}:`, error);
    throw error;
  }
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
    // console.error(`Error updating lesson song conditions for ${lessonSongId}:`, error);
    throw error;
  }
  
  return data as LessonSong;
}

/**
 * レッスンにファンタジーステージを追加します。
 * @param {FantasyLessonSongData} fantasyLessonSongData
 * @returns {Promise<LessonSong>}
 */
export async function addFantasyStageToLesson(fantasyLessonSongData: FantasyLessonSongData): Promise<LessonSong> {
  // order_indexを自動計算
  const { data: existingItems } = await getSupabaseClient()
    .from('lesson_songs')
    .select('order_index')
    .eq('lesson_id', fantasyLessonSongData.lesson_id)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = existingItems && existingItems.length > 0 
    ? (existingItems[0].order_index || 0) + 1 
    : 0;
    
  const { data, error } = await getSupabaseClient()
    .from('lesson_songs')
    .insert({
      lesson_id: fantasyLessonSongData.lesson_id,
      song_id: null, // 明示的にnullを設定
      fantasy_stage_id: fantasyLessonSongData.fantasy_stage_id,
      is_fantasy: true,
      clear_conditions: fantasyLessonSongData.clear_conditions,
      order_index: nextOrderIndex
    })
    .select(`
      *,
      fantasy_stage:fantasy_stages (*)
    `)
    .single();
  
  if (error) {
    // console.error('Error adding fantasy stage to lesson:', error);
    throw error;
  }
  
  return data as LessonSong;
}

/**
 * レッスンからファンタジーステージを削除します。
 * @param {string} lessonId
 * @param {string} fantasyStageId
 */
export async function removeFantasyStageFromLesson(lessonId: string, fantasyStageId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_songs')
    .delete()
    .eq('lesson_id', lessonId)
    .eq('fantasy_stage_id', fantasyStageId);

  if (error) {
    // console.error(`Error removing fantasy stage ${fantasyStageId} from lesson ${lessonId}:`, error);
    throw error;
  }
} 