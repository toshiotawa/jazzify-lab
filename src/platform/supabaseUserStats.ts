import { getSupabaseClient, getCurrentUserIdCached } from './supabaseClient';
import { requireUserId } from '@/platform/authHelpers';

export interface UserStats {
  missionCompletedCount: number;
  lessonCompletedCount: number;
}

// キャッシュ用の変数
let statsCache: { [userId: string]: { data: UserStats; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分

/**
 * ユーザーの統計情報を取得
 */
export async function fetchUserStats(userId?: string): Promise<UserStats> {
  const supabase = getSupabaseClient();
  const uid = await getCurrentUserIdCached();
  if (!uid && !userId) throw new Error('ログインが必要です');
  const targetUserId = userId || (uid as string);

  // キャッシュチェック
  const cached = statsCache[targetUserId];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // ミッションとレッスンの統計を並行取得
    const [missionResult, lessonResult] = await Promise.all([
      supabase
        .from('user_challenge_progress')
        .select('challenge_id')
        .eq('user_id', targetUserId)
        .eq('completed', true),
      supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', targetUserId)
        .eq('completed', true)
    ]);

    // エラーチェック
    if (missionResult.error) {
      throw new Error(`ミッション統計の取得に失敗しました: ${missionResult.error.message}`);
    }
    if (lessonResult.error) {
      throw new Error(`レッスン統計の取得に失敗しました: ${lessonResult.error.message}`);
    }

    const result = {
      missionCompletedCount: missionResult.data?.length || 0,
      lessonCompletedCount: lessonResult.data?.length || 0,
    };

    // キャッシュに保存
    statsCache[targetUserId] = {
      data: result,
      timestamp: Date.now()
    };

    return result;
  } catch (error) {
    console.error('ユーザー統計の取得に失敗:', error);
    return {
      missionCompletedCount: 0,
      lessonCompletedCount: 0,
    };
  }
}

/**
 * 統計キャッシュをクリア
 */
export function clearUserStatsCache(userId?: string): void {
  if (userId) {
    delete statsCache[userId];
  } else {
    statsCache = {};
  }
} 