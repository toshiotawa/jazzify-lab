import { getSupabaseClient, fetchWithCache } from '@/platform/supabaseClient';

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  completion_date?: string;
  unlock_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonRequirement {
  lesson_id: string;
  song_id: string;
  key_offset: number;
  min_speed: number;
  min_rank: string;
  min_clear_count: number;
  notation_setting: string;
}

/**
 * ユーザーの特定コースのレッスン進捗を取得
 */
export async function fetchUserLessonProgress(courseId: string): Promise<LessonProgress[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  const cacheKey = `lesson_progress:${user.id}:${courseId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId),
    1000 * 60 * 5 // 5分キャッシュ
  );

  if (error) throw new Error(`進捗データの取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * レッスンの進捗を更新
 */
export async function updateLessonProgress(
  lessonId: string, 
  courseId: string, 
  completed: boolean,
  targetUserId?: string // 管理者が他のユーザーの進捗を更新する場合
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');
  
  // 更新対象のユーザーID（指定がなければ自分）
  const userId = targetUserId || user.id;

  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed,
      completion_date: completed ? now : null,
      updated_at: now,
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) throw new Error(`進捗の更新に失敗しました: ${error.message}`);
}

/**
 * レッスンを解放
 */
export async function unlockLesson(lessonId: string, courseId: string, targetUserId?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');
  
  // 更新対象のユーザーID（指定がなければ自分）
  const userId = targetUserId || user.id;

  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed: false,
      unlock_date: now,
      updated_at: now,
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) throw new Error(`レッスンの解放に失敗しました: ${error.message}`);
}

/**
 * レッスンの要件を取得
 */
export async function fetchLessonRequirements(lessonId: string): Promise<LessonRequirement[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('lesson_songs')
    .select('*')
    .eq('lesson_id', lessonId);

  if (error) throw new Error(`レッスン要件の取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * ユーザーの全体的なレッスン統計を取得
 */
export async function fetchUserLessonStats(): Promise<{
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  currentStreak: number;
}> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  // ユーザーのレッスン進捗を取得
  const { data: progressData, error } = await supabase
    .from('user_lesson_progress')
    .select('completed, completion_date')
    .eq('user_id', user.id);

  if (error) throw new Error(`統計データの取得に失敗しました: ${error.message}`);

  const progress = progressData || [];
  const completedLessons = progress.filter(p => p.completed).length;
  const totalLessons = progress.length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // 連続完了日数を計算（簡易版）
  const completedDates = progress
    .filter(p => p.completed && p.completion_date)
    .map(p => p.completion_date!)
    .sort()
    .reverse();

  let currentStreak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const dateStr of completedDates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      currentStreak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalLessons,
    completedLessons,
    completionRate,
    currentStreak,
  };
} 