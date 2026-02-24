import { getSupabaseClient, fetchWithCache, clearCacheByPattern, clearCacheByKey } from './supabaseClient';
import { Course } from '@/types';
import { resolveCourseAccess, type MembershipRank } from '@/utils/lessonAccess';

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
        ),
        prerequisites:course_prerequisites!course_prerequisites_course_id_fkey (
          prerequisite_course_id,
          prerequisite_course:courses!course_prerequisites_prerequisite_course_id_fkey (
            id,
            title
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

  const { data, error } = await fetchWithCache(
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
          ),
          prerequisites:course_prerequisites!course_prerequisites_course_id_fkey (
            prerequisite_course_id,
            prerequisite_course:courses!course_prerequisites_prerequisite_course_id_fkey (
              id,
              title
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
  const { data, error } = await fetchWithCache(
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

/**
 * ユーザーのコース完了状況を取得します
 * レッスン進捗から各コースの完了状況を判定します
 * @param {string} userId
 * @returns {Promise<string[]>} 完了したコースIDの配列
 */
export async function fetchUserCompletedCourses(userId: string): Promise<string[]> {
  try {
    // 全コースとユーザーのレッスン進捗を取得
    const [coursesData, progressData] = await Promise.all([
      fetchCoursesWithDetails(),
      getSupabaseClient()
        .from('user_lesson_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', userId)
        .eq('completed', true)
    ]);

    if (progressData.error) {
      console.error('Error fetching user lesson progress:', progressData.error);
      return [];
    }

    const completedLessons = progressData.data || [];
    const completedCourseIds: string[] = [];

    // 各コースについて、すべてのレッスンが完了しているかチェック
    for (const course of coursesData) {
      if (!course.lessons || course.lessons.length === 0) continue;

      const courseLessonIds = course.lessons.map(lesson => lesson.id);
      const completedLessonIds = completedLessons
        .filter(progress => progress.course_id === course.id)
        .map(progress => progress.lesson_id);

      // コース内のすべてのレッスンが完了している場合
      const allLessonsCompleted = courseLessonIds.every(lessonId => 
        completedLessonIds.includes(lessonId)
      );

      if (allLessonsCompleted && courseLessonIds.length > 0) {
        completedCourseIds.push(course.id);
      }
    }

    return completedCourseIds;
  } catch (error) {
    console.error('Error fetching user completed courses:', error);
    return [];
  }
}

/**
 * ユーザーがコースにアクセス可能かどうかを判定します（前提条件とランク制限、管理者アンロックを含む）
 * @param {Course} course
 * @param {string} userRank
 * @param {string[]} completedCourseIds
 * @param {boolean} isUnlocked user_course_progressのis_unlockedフラグ
 * @returns {object} { canAccess: boolean, reason?: string, manualUnlockApplied?: boolean, manualUnlockSuppressed?: boolean, manualLockApplied?: boolean, prerequisitesMet: boolean, rankAllows: boolean, requiresPremium: boolean }
 */
export function canAccessCourse(
  course: Course, 
  userRank: MembershipRank, 
  completedCourseIds: string[] = [],
  isUnlocked: boolean | null = null
): {
  canAccess: boolean;
  reason?: string;
  manualUnlockApplied?: boolean;
  manualUnlockSuppressed?: boolean;
  manualLockApplied?: boolean;
  prerequisitesMet: boolean;
  rankAllows: boolean;
  requiresPremium: boolean;
} {
  const result = resolveCourseAccess({
    course,
    userRank,
    completedCourseIds,
    manualOverride: isUnlocked,
  });

  return {
    canAccess: result.canAccess,
    reason: result.reason,
    manualUnlockApplied: result.manualUnlockApplied,
    manualUnlockSuppressed: result.manualUnlockSuppressed,
    manualLockApplied: result.manualLockApplied,
    prerequisitesMet: result.prerequisitesMet,
    rankAllows: result.rankAllows,
    requiresPremium: result.requiresPremium,
  };
}

/**
 * 単一のコースを取得します（前提コースの最小情報を含む）
 * @param {string} id
 * @returns {Promise<Course | null>}
 */
export async function fetchCourseById(id: string): Promise<Course | null> {
  const { data, error } = await getSupabaseClient()
    .from('courses')
    .select(`
      *,
      prerequisites:course_prerequisites!course_prerequisites_course_id_fkey (
        prerequisite_course_id,
        prerequisite_course:courses!course_prerequisites_prerequisite_course_id_fkey (
          id,
          title
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course by id:', error);
    return null;
  }
  return (data as Course) || null;
}

/**
 * ユーザーのコースアンロック状況を取得します
 * @param {string} userId
 * @returns {Promise<Record<string, boolean | null>>} コースIDをキーとするアンロック状況
 */
export async function fetchUserCourseUnlockStatus(userId: string): Promise<Record<string, boolean | null>> {
  try {
    const cacheKey = `user_course_unlock_status:${userId}`;
    const { data, error } = await fetchWithCache(
      cacheKey,
      async () => await getSupabaseClient()
        .from('user_course_progress')
        .select('course_id, is_unlocked')
        .eq('user_id', userId),
      1000 * 60 * 5 // 5分キャッシュ
    );

    if (error) {
      console.error('Error fetching user course unlock status:', error);
      return {};
    }

    const unlockStatus: Record<string, boolean | null> = {};
    data?.forEach((item) => {
      unlockStatus[item.course_id] = item.is_unlocked;
    });

    return unlockStatus;
  } catch (error) {
    console.error('Error fetching user course unlock status:', error);
    return {};
  }
}

/**
 * 管理者によるコースロック（RPC呼び出し）
 * @param {string} userId
 * @param {string} courseId
 */
export async function adminLockCourse(userId: string, courseId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('admin_lock_course', {
      p_user_id: userId,
      p_course_id: courseId
    });

  if (error) {
    console.error('Error locking course:', error);
    throw error;
  }

  // 関連キャッシュをクリア
  clearCacheByPattern(/^courses/);
}

/**
 * 管理者によるコースアンロック（RPC呼び出し）
 * @param {string} userId
 * @param {string} courseId
 */
export async function adminUnlockCourse(userId: string, courseId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('admin_unlock_course', {
      p_user_id: userId,
      p_course_id: courseId
    });

  if (error) {
    console.error('Error unlocking course:', error);
    throw error;
  }

  // 関連キャッシュをクリア
  clearCacheByPattern(/^courses/);
}

/**
 * 前提条件チェックおよび依存コースの自動アンロック（RPC呼び出し）
 * @param {string} userId
 */
export async function unlockDependentCourses(userId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('unlock_dependent_courses', {
      p_user_id: userId
    });

  if (error) {
    console.error('Error unlocking dependent courses:', error);
    throw error;
  }

  // 関連キャッシュをクリア
  clearCacheByPattern(/^courses/);
}

/**
 * ユーザー自身によるコース手動解放（プラチナ/ブラック限定、回数無制限）
 */
export async function manualUnlockCourse(courseId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('manual_unlock_course', {
      p_course_id: courseId,
    });

  if (error) {
    throw new Error(`コースの手動解放に失敗しました: ${error.message}`);
  }

  clearCacheByPattern(/^courses/);
  clearCacheByPattern(/^user_course_unlock_status/);
}

/**
 * チュートリアルコースのID・レッスン一覧・ユーザー進捗を一括取得
 */
export interface TutorialProgress {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  nextLesson: { id: string; title: string; order_index: number } | null;
}

export async function fetchTutorialProgress(audience: 'global' | 'japan' = 'japan'): Promise<TutorialProgress | null> {
  const supabase = getSupabaseClient();

  const { data: courseData, error: courseError } = await fetchWithCache(
    `tutorial_course_${audience}`,
    async () => await supabase
      .from('courses')
      .select('id, title')
      .eq('is_tutorial', true)
      .eq('audience', audience)
      .limit(1)
      .single(),
    60 * 60 * 1000
  );

  if (courseError || !courseData) return null;

  const { data: lessons, error: lessonsError } = await fetchWithCache(
    `tutorial_lessons_${courseData.id}`,
    async () => await supabase
      .from('lessons')
      .select('id, title, order_index, block_number')
      .eq('course_id', courseData.id)
      .order('order_index', { ascending: true }),
    60 * 60 * 1000
  );

  if (lessonsError || !lessons) return null;

  const { getCurrentUserIdCached } = await import('./supabaseClient');
  const uid = await getCurrentUserIdCached();
  if (!uid) return null;

  const { data: progressData, error: progressError } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', uid)
    .eq('course_id', courseData.id)
    .eq('completed', true);

  if (progressError) return null;

  const completedSet = new Set((progressData || []).map(p => p.lesson_id));
  const completedLessons = completedSet.size;

  const nextLesson = lessons.find(l => !completedSet.has(l.id)) ?? null;

  return {
    courseId: courseData.id,
    courseTitle: courseData.title,
    totalLessons: lessons.length,
    completedLessons,
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, order_index: nextLesson.order_index } : null,
  };
}

export { clearCacheByPattern as clearSupabaseCache };
export { checkCoursePrerequisites } from '@/utils/lessonAccess';