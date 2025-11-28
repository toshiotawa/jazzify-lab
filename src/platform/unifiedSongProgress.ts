import { getSupabaseClient, fetchWithCache } from './supabaseClient';

export interface UnifiedSongProgress {
  userId: string;
  songId: string;
  contextType: 'mission' | 'lesson' | 'general';
  contextId: string | null;
  clearCount: number;
  bestRank: string | null;
  bestScore: number | null;
  lastClearedAt: string | null;
}

/**
 * 統一的な楽曲進捗を取得する
 * @param userId ユーザーID
 * @param songId 楽曲ID
 * @param contextType コンテキストタイプ
 * @param contextId コンテキストID
 */
export async function getSongPlayProgress(
  userId: string,
  songId: string,
  contextType: 'mission' | 'lesson' | 'general',
  contextId: string | null = null
): Promise<UnifiedSongProgress | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('user_song_play_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .eq('context_type', contextType)
      .eq('context_id', contextId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching song play progress:', error);
      return null;
    }

    return {
      userId: data.user_id,
      songId: data.song_id,
      contextType: data.context_type,
      contextId: data.context_id,
      clearCount: data.clear_count,
      bestRank: data.best_rank,
      bestScore: data.best_score,
      lastClearedAt: data.last_cleared_at,
    };
  } catch (error) {
    console.error('Error fetching song play progress:', error);
    return null;
  }
}

/**
 * 楽曲クリア時の進捗を更新する
 * @param userId ユーザーID
 * @param songId 楽曲ID
 * @param contextType コンテキストタイプ
 * @param contextId コンテキストID
 * @param rank 今回のランク
 * @param score 今回のスコア
 */
export async function updateSongPlayProgress(
  userId: string,
  songId: string,
  contextType: 'mission' | 'lesson' | 'general',
  contextId: string | null,
  rank: string,
  score: number
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    // 現在の進捗を取得
    const currentProgress = await getSongPlayProgress(userId, songId, contextType, contextId);
    
    // ランクの比較（S > A > B > C > D > F）
    const rankOrder = { 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
    const currentRankValue = currentProgress?.bestRank ? rankOrder[currentProgress.bestRank as keyof typeof rankOrder] || 0 : 0;
    const newRankValue = rankOrder[rank as keyof typeof rankOrder] || 0;
    
    const newBestRank = newRankValue > currentRankValue ? rank : currentProgress?.bestRank || rank;
    const newBestScore = Math.max(score, currentProgress?.bestScore || 0);
    const newClearCount = (currentProgress?.clearCount || 0) + 1;
    
    const { error } = await supabase
      .from('user_song_play_progress')
      .upsert({
        user_id: userId,
        song_id: songId,
        context_type: contextType,
        context_id: contextId,
        clear_count: newClearCount,
        best_rank: newBestRank,
        best_score: newBestScore,
        last_cleared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,song_id,context_type,context_id'
      });

    if (error) {
      console.error('Error updating song play progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating song play progress:', error);
    return false;
  }
}

/**
 * 指定されたコンテキストのすべての楽曲進捗を取得する
 * @param userId ユーザーID
 * @param contextType コンテキストタイプ
 * @param contextId コンテキストID
 */
export async function getContextSongProgress(
  userId: string,
  contextType: 'mission' | 'lesson' | 'general',
  contextId: string | null = null
): Promise<UnifiedSongProgress[]> {
  const supabase = getSupabaseClient();
  
  try {
    const cacheKey = `user_song_play_progress:${userId}:${contextType}:${contextId ?? 'null'}`;
    const { data, error } = await fetchWithCache(
      cacheKey,
      async () => await supabase
        .from('user_song_play_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('context_type', contextType)
        .eq('context_id', contextId),
      1000 * 60
    );

    if (error) {
      console.error('Error fetching context song progress:', error);
      return [];
    }

    return data.map(row => ({
      userId: row.user_id,
      songId: row.song_id,
      contextType: row.context_type,
      contextId: row.context_id,
      clearCount: row.clear_count,
      bestRank: row.best_rank,
      bestScore: row.best_score,
      lastClearedAt: row.last_cleared_at,
    }));
  } catch (error) {
    console.error('Error fetching context song progress:', error);
    return [];
  }
}

export interface SongStats {
  clear_count: number;
  b_rank_plus_count?: number;
  best_score?: number;
  best_rank?: string;
  key_clears?: Record<string, number>;
}

/**
 * 汎用: user_song_stats を songId => stats にマップして返す（TTLキャッシュ付き）
 */
export async function fetchUserSongStatsMap(userId: string): Promise<Record<string, SongStats>> {
  const supabase = getSupabaseClient();
  const cacheKey = `user_song_stats_map:${userId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_song_stats')
      .select('song_id, clear_count, best_score, best_rank, b_rank_plus_count, key_clears')
      .eq('user_id', userId),
    1000 * 60 // 60s
  );
  if (error) {
    console.warn('fetchUserSongStatsMap error:', error);
    return {};
  }
  const map: Record<string, SongStats> = {};
  (data || []).forEach((stat: any) => {
    map[stat.song_id] = {
      clear_count: stat.clear_count,
      b_rank_plus_count: stat.b_rank_plus_count || 0,
      best_score: stat.best_score,
      best_rank: stat.best_rank,
      key_clears: stat.key_clears || {},
    };
  });
  return map;
}

/**
 * 特定の曲のキー別クリア回数を取得する
 */
export async function fetchSongKeyClears(userId: string, songId: string): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_song_stats')
    .select('key_clears')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .single();
  
  if (error) {
    if (error.code !== 'PGRST116') { // No rows found is not an error
      console.warn('fetchSongKeyClears error:', error);
    }
    return {};
  }
  
  return data?.key_clears || {};
}

/**
 * 統一進捗管理システムに移行する
 * @param userId ユーザーID
 * @param dryRun 実際に実行するかテストするか
 */
export async function migrateUserProgress(userId: string, dryRun: boolean = true): Promise<void> {
  const supabase = getSupabaseClient();
  
  try {
    // user_song_progressからの移行
    const { data: songProgress, error: songError } = await supabase
      .from('user_song_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (songError) {
      console.error('Error fetching user song progress:', songError);
      return;
    }

    // user_lesson_requirements_progressからの移行
    const { data: lessonProgress, error: lessonError } = await supabase
      .from('user_lesson_requirements_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (lessonError) {
      console.error('Error fetching user lesson progress:', lessonError);
      return;
    }

    // user_song_statsからの移行（general context）
    const { data: songStats, error: statsError } = await supabase
      .from('user_song_stats')
      .select('*')
      .eq('user_id', userId);
    
    if (statsError) {
      console.error('Error fetching user song stats:', statsError);
      return;
    }

    const migratedProgress = [
      // Mission progress
      ...songProgress.map(progress => ({
        user_id: progress.user_id,
        song_id: progress.song_id,
        context_type: 'mission',
        context_id: null, // We'll need to determine this from challenge data
        clear_count: progress.clear_count,
        best_rank: progress.best_rank,
        best_score: null,
        last_cleared_at: progress.last_cleared_at,
      })),
      // Lesson progress
      ...lessonProgress.map(progress => ({
        user_id: progress.user_id,
        song_id: progress.song_id,
        context_type: 'lesson',
        context_id: progress.lesson_id,
        clear_count: progress.clear_count,
        best_rank: progress.best_rank,
        best_score: null,
        last_cleared_at: progress.last_cleared_at,
      })),
      // General progress
      ...songStats.map(stats => ({
        user_id: stats.user_id,
        song_id: stats.song_id,
        context_type: 'general',
        context_id: null,
        clear_count: stats.clear_count,
        best_rank: stats.best_rank,
        best_score: stats.best_score,
        last_cleared_at: stats.last_played,
      })),
    ];

    if (dryRun) {
      console.log('Dry run - would migrate:', migratedProgress.length, 'progress records for user', userId);
      return;
    }

    // 実際の移行処理
    const { error: insertError } = await supabase
      .from('user_song_play_progress')
      .insert(migratedProgress);

    if (insertError) {
      console.error('Error inserting migrated progress:', insertError);
      return;
    }

    console.log('Successfully migrated', migratedProgress.length, 'progress records for user', userId);
  } catch (error) {
    console.error('Error during migration:', error);
  }
}