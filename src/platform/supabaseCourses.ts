import { getSupabaseClient, fetchWithCache, clearCacheByPattern, clearCacheByKey } from './supabaseClient';
import { Course } from '@/types';

// コースキャッシュキー生成関数
export const COURSES_CACHE_KEY = () => 'courses';

/**
 * すべてのコースをレッスンと関連曲を含めて取得します。
 * @param {Object} options オプション
 * @param {boolean} options.forceRefresh キャッシュを無視して最新データを取得
 * @returns {Promise<Course[]>}
 */
export async function fetchCoursesWithDetails({ forceRefresh = false } = {}): Promise<Course[]> {
  const cacheKey = COURSES_CACHE_KEY();

  if (forceRefresh) {
    // キャッシュをバイパスして直接取得
    const { data, error } = await getSupabaseClient()
      .from('courses')
      .select(`
        *,
        lessons (
          *,
          lesson_songs (
            *,
            songs (id, title, artist)
          )
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching courses with details:', error);
      throw error;
    }

    // 新しいデータでキャッシュを更新
    clearCacheByKey(cacheKey);
    
    return data || [];
  }

  const { data, error } = await fetchWithCache<Course>(
    cacheKey,
    async () => await getSupabaseClient()
        .from('courses')
        .select(`
          *,
          lessons (
            *,
            lesson_songs (
              *,
              songs (id, title, artist)
            )
          )
        `)
        .order('created_at', { ascending: true }),
    60 * 60 * 1000 // 1時間キャッシュ
  );

  if (error) {
    console.error('Error fetching courses with details:', error);
    throw error;
  }
  return data || [];
}

/**
 * コース一覧を取得します（レッスン詳細なし・軽量版）
 * @returns {Promise<Course[]>}
 */
export async function fetchCoursesSimple(): Promise<Course[]> {
  const { data, error } = await fetchWithCache<Course>(
    'courses-simple',
    async () => await getSupabaseClient()
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true }),
    60 * 60 * 1000 // 1時間キャッシュ
  );

  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
  return data || [];
}

/**
 * 新しいコースを追加します。
 * @param {Omit<Course, 'id' | 'created_at' | 'updated_at' | 'lessons'>} courseData
 * @returns {Promise<Course>}
 */
export async function addCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'lessons'>): Promise<Course> {
  const { data, error } = await getSupabaseClient()
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) {
    console.error('Error adding course:', error);
    throw error;
  }

  // コース関連のキャッシュのみクリア
  clearCacheByPattern(/^courses/);
  return data as Course;
}

/**
 * 既存のコースを更新します。
 * @param {string} id
 * @param {Partial<Omit<Course, 'id' | 'created_at' | 'updated_at' | 'lessons'>>} updates
 * @returns {Promise<Course>}
 */
export async function updateCourse(id: string, updates: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at' | 'lessons'>>): Promise<Course> {
  const { data, error } = await getSupabaseClient()
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    throw error;
  }

  // コース関連のキャッシュのみクリア
  clearCacheByPattern(/^courses/);
  return data as Course;
}

/**
 * コースを削除します。
 * @param {string} id
 */
export async function deleteCourse(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    throw error;
  }

  // コース関連のキャッシュのみクリア
  clearCacheByPattern(/^courses/);
}

export { clearCacheByPattern as clearSupabaseCache }; 