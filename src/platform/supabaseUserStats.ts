import { getSupabaseClient } from './supabaseClient';

export interface UserStats {
  missionCompletedCount: number;
  lessonCompletedCount: number;
}

/**
 * ユーザーの統計情報を取得
 */
export async function fetchUserStats(userId?: string): Promise<UserStats> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');
  
  const targetUserId = userId || user.id;

  try {
    // ミッション完了数を取得（clear_countの合計を使用）
    const { data: missionData, error: missionError } = await supabase
      .from('user_challenge_progress')
      .select('clear_count')
      .eq('user_id', targetUserId)
      .eq('completed', true);

    if (missionError) throw new Error(`ミッション統計の取得に失敗しました: ${missionError.message}`);

    // clear_countの合計を計算
    const missionCompletedCount = (missionData ?? []).reduce((sum, record) => sum + (record.clear_count || 0), 0);

    // レッスン完了数を取得
    const { data: lessonData, error: lessonError } = await supabase
      .from('user_lesson_progress')
      .select('completed')
      .eq('user_id', targetUserId)
      .eq('completed', true);

    if (lessonError) throw new Error(`レッスン統計の取得に失敗しました: ${lessonError.message}`);

    return {
      missionCompletedCount,
      lessonCompletedCount: lessonData?.length || 0,
    };
  } catch (error) {
    console.error('ユーザー統計の取得に失敗:', error);
    return {
      missionCompletedCount: 0,
      lessonCompletedCount: 0,
    };
  }
} 