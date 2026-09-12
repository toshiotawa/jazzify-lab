import { getSupabaseClient, getCurrentUserIdCached } from './supabaseClient';

export interface UserStats {
  missionCompletedCount: number;
  lessonCompletedCount: number;
  dailyChallengeParticipationDays: number;
  /** `play_map_node_clears`（mode = code_run）の件数 */
  codeRunClearCount: number;
  /** `play_map_node_clears`（mode = defense）の件数 */
  defenseClearCount: number;
  survivalBestTimeSeconds: number;
  survivalBestDifficulty: string | null;
}

let statsCache: { [userId: string]: { data: UserStats; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分
const inflightRequests: { [userId: string]: Promise<UserStats> } = {};

/**
 * ユーザーの統計情報を取得
 */
export async function fetchUserStats(userId?: string): Promise<UserStats> {
  const supabase = getSupabaseClient();
  const uid = await getCurrentUserIdCached();
  if (!uid && !userId) throw new Error('ログインが必要です');
  const targetUserId = userId || (uid as string);

  const cached = statsCache[targetUserId];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  if (Object.prototype.hasOwnProperty.call(inflightRequests, targetUserId)) {
    return inflightRequests[targetUserId];
  }

  const request = fetchUserStatsInternal(supabase, targetUserId);
  inflightRequests[targetUserId] = request;

  try {
    const result = await request;
    return result;
  } finally {
    delete inflightRequests[targetUserId];
  }
}

async function fetchUserStatsInternal(supabase: ReturnType<typeof getSupabaseClient>, targetUserId: string): Promise<UserStats> {
  try {
    // ミッション、レッスン、デイリーチャレンジ、プレイマップクリア、サバイバルベストの統計を並行取得
    const [
      missionResult,
      lessonResult,
      dailyChallengeResult,
      codeRunClearResult,
      defenseClearResult,
      survivalResult,
    ] = await Promise.all([
      supabase
        .from('user_challenge_progress')
        .select('challenge_id')
        .eq('user_id', targetUserId)
        .eq('completed', true),
      supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', targetUserId)
        .eq('completed', true),
      // デイリーチャレンジの実施日数（played_onでDISTINCT）
      supabase
        .from('daily_challenge_records')
        .select('played_on')
        .eq('user_id', targetUserId),
      supabase
        .from('play_map_node_clears')
        .select('node_id, play_map_nodes!inner(play_map_blocks!inner(mode))', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('play_map_nodes.play_map_blocks.mode', 'code_run'),
      supabase
        .from('play_map_node_clears')
        .select('node_id, play_map_nodes!inner(play_map_blocks!inner(mode))', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('play_map_nodes.play_map_blocks.mode', 'defense'),
      // サバイバルモードのベストスコア（日記等）
      supabase
        .from('survival_high_scores')
        .select('survival_time_seconds, difficulty')
        .eq('user_id', targetUserId)
        .order('survival_time_seconds', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // エラーチェック
    if (missionResult.error) {
      throw new Error(`ミッション統計の取得に失敗しました: ${missionResult.error.message}`);
    }
    if (lessonResult.error) {
      throw new Error(`レッスン統計の取得に失敗しました: ${lessonResult.error.message}`);
    }
    if (dailyChallengeResult.error) {
      throw new Error(`デイリーチャレンジ統計の取得に失敗しました: ${dailyChallengeResult.error.message}`);
    }
    // survivalResult.errorは致命的ではないのでログのみ
    if (codeRunClearResult.error) {
      console.warn('コードランクリア数の取得に失敗:', codeRunClearResult.error.message);
    }
    if (defenseClearResult.error) {
      console.warn('ディフェンスクリア数の取得に失敗:', defenseClearResult.error.message);
    }
    if (survivalResult.error) {
      console.warn('サバイバル統計の取得に失敗:', survivalResult.error.message);
    }

    // 同じ日に複数の難易度をプレイしても1日としてカウント
    const uniqueDays = new Set(
      (dailyChallengeResult.data || []).map((r: { played_on: string }) => r.played_on)
    );

    const result = {
      missionCompletedCount: missionResult.data?.length || 0,
      lessonCompletedCount: lessonResult.data?.length || 0,
      dailyChallengeParticipationDays: uniqueDays.size,
      codeRunClearCount: codeRunClearResult.count ?? 0,
      defenseClearCount: defenseClearResult.count ?? 0,
      survivalBestTimeSeconds: Number(survivalResult.data?.survival_time_seconds) || 0,
      survivalBestDifficulty: survivalResult.data?.difficulty as string | null || null,
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
      dailyChallengeParticipationDays: 0,
      codeRunClearCount: 0,
      defenseClearCount: 0,
      survivalBestTimeSeconds: 0,
      survivalBestDifficulty: null,
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