import { getSupabaseClient, fetchWithCache, clearCacheByKey, invalidateCacheKey } from '@/platform/supabaseClient';

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  is_unlocked?: boolean;
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
  clears_required: number;
  notation_setting: string;
}

/**
 * レッスン進捗のキャッシュキー
 */
export const LESSON_PROGRESS_CACHE_KEY = (courseId: string, userId: string) =>
  `lesson_progress_${courseId}_${userId}`;

/**
 * ユーザーの特定コースのレッスン進捗を取得
 */
export async function fetchUserLessonProgress(
  courseId: string, 
  targetUserId?: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {}
): Promise<LessonProgress[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');
  
  // 取得対象のユーザーID（指定がなければ自分）
  const userId = targetUserId || user.id;

  const key = LESSON_PROGRESS_CACHE_KEY(courseId, userId);
  
  // forceRefresh = true の場合はキャッシュクリア
  if (forceRefresh) {
    clearCacheByKey(key);
  }

  const { data, error } = await fetchWithCache(
    key,
    async () => await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId),
    1000 * 30 // 30秒キャッシュ
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
  
  // レッスン完了時にブロック完了をチェック
  if (completed) {
    await checkAndUnlockNextBlock(userId, courseId, lessonId);
  }
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
      is_unlocked: true,
      unlock_date: now,
      updated_at: now,
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) throw new Error(`レッスンの解放に失敗しました: ${error.message}`);
}

/**
 * ブロック単位でレッスンを解放
 */
export async function unlockBlock(courseId: string, blockNumber: number, targetUserId?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');
  
  // 更新対象のユーザーID（指定がなければ自分）
  const userId = targetUserId || user.id;

  // ブロックに属するレッスンを取得
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('block_number', blockNumber);

  if (lessonsError) throw new Error(`レッスンの取得に失敗しました: ${lessonsError.message}`);
  
  if (!lessons || lessons.length === 0) {
    throw new Error('指定されたブロックにレッスンが存在しません');
  }

  // 各レッスンを解放
  const now = new Date().toISOString();
  const progressRecords = lessons.map(lesson => ({
    user_id: userId,
    lesson_id: lesson.id,
    course_id: courseId,
    completed: false,
    is_unlocked: true,
    unlock_date: now,
    updated_at: now,
  }));

  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert(progressRecords, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) throw new Error(`ブロックの解放に失敗しました: ${error.message}`);
}

/**
 * ブロック単位でレッスンを施錠
 */
export async function lockBlock(courseId: string, blockNumber: number, targetUserId?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');
  
  // 更新対象のユーザーID（指定がなければ自分）
  const userId = targetUserId || user.id;

  // ブロックに属するレッスンを取得
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('block_number', blockNumber);

  if (lessonsError) throw new Error(`レッスンの取得に失敗しました: ${lessonsError.message}`);
  
  if (!lessons || lessons.length === 0) {
    throw new Error('指定されたブロックにレッスンが存在しません');
  }

  // ブロック内のレッスンを一括で施錠（is_unlocked=false）
  const { error } = await supabase
    .from('user_lesson_progress')
    .update({ 
      is_unlocked: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('lesson_id', lessons.map(l => l.id));

  if (error) throw new Error(`ブロックの施錠に失敗しました: ${error.message}`);
}

/**
 * ブロック完了をチェックして次のブロックを解放
 */
async function checkAndUnlockNextBlock(userId: string, courseId: string, completedLessonId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 完了したレッスンのブロック番号を取得
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('block_number')
    .eq('id', completedLessonId)
    .single();

  if (lessonError || !lesson) return;

  const blockNumber = lesson.block_number;

  // ブロックの完了状態をチェック
  const { data: isCompleted, error: checkError } = await supabase
    .rpc('check_block_completion', {
      p_user_id: userId,
      p_course_id: courseId,
      p_block_number: blockNumber
    });

  if (checkError || !isCompleted) return;

  // 次のブロックを解放
  await supabase
    .rpc('unlock_next_block', {
      p_user_id: userId,
      p_course_id: courseId,
      p_completed_block: blockNumber
    });
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