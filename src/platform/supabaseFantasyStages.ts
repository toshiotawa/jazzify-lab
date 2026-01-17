import { getSupabaseClient, fetchWithCache, clearCacheByPattern } from './supabaseClient';
import { FantasyStage, FantasyStageUsageType } from '../types';

/**
 * ファンタジーステージ一覧を取得（デフォルトで全ステージを返す）
 */
export async function fetchFantasyStages(): Promise<FantasyStage[]> {
  const supabase = getSupabaseClient();
  // 5分TTL（静的マスタ）
  const { data, error } = await fetchWithCache(
    'fantasy_stages:list',
    async () => await supabase
      .from('fantasy_stages')
      .select('*')
      .order('stage_number', { ascending: true, nullsFirst: false }),
    1000 * 60 * 5
  );
    
  if (error) {
    console.error('Error fetching fantasy stages:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * 使用タイプでフィルタリングしてファンタジーステージ一覧を取得
 * @param usageTypes 取得するステージの使用タイプ配列（例: ['fantasy', 'both'] でファンタジーモード用を取得）
 */
export async function fetchFantasyStagesByUsageType(
  usageTypes: FantasyStageUsageType[]
): Promise<FantasyStage[]> {
  const supabase = getSupabaseClient();
  const cacheKey = `fantasy_stages:by_usage:${usageTypes.sort().join(',')}`;
  
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('fantasy_stages')
      .select('*')
      .in('usage_type', usageTypes)
      .order('stage_number', { ascending: true, nullsFirst: false }),
    1000 * 60 * 5
  );
    
  if (error) {
    console.error('Error fetching fantasy stages by usage type:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * ファンタジーモード用ステージのみ取得（usage_type = 'fantasy' または 'both'）
 */
export async function fetchFantasyModeStages(): Promise<FantasyStage[]> {
  return fetchFantasyStagesByUsageType(['fantasy', 'both']);
}

/**
 * レッスンモード用ステージのみ取得（usage_type = 'lesson' または 'both'）
 */
export async function fetchLessonFantasyStages(): Promise<FantasyStage[]> {
  return fetchFantasyStagesByUsageType(['lesson', 'both']);
}

/**
 * レッスン専用ステージのみ取得（usage_type = 'lesson'）
 * 管理画面用
 */
export async function fetchLessonOnlyFantasyStages(): Promise<FantasyStage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    'fantasy_stages:lesson_only',
    async () => await supabase
      .from('fantasy_stages')
      .select('*')
      .eq('usage_type', 'lesson')
      .order('name', { ascending: true }),
    1000 * 60 * 5
  );
    
  if (error) {
    console.error('Error fetching lesson-only fantasy stages:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * 特定のファンタジーステージを取得
 */
export async function fetchFantasyStageById(stageId: string): Promise<FantasyStage> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    `fantasy_stages:by_id:${stageId}`,
    async () => await supabase
      .from('fantasy_stages')
      .select('*')
      .eq('id', stageId)
      .single(),
    1000 * 60 * 5
  );
    
  if (error) {
    console.error('Error fetching fantasy stage:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Fantasy stage not found');
  }
  
  return data as FantasyStage;
}

/**
 * ステージ番号でファンタジーステージを取得
 */
export async function fetchFantasyStageByNumber(stageNumber: string, stageTier: 'basic' | 'advanced' = 'basic'): Promise<FantasyStage | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    `fantasy_stages:by_number:${stageTier}:${stageNumber}`,
    async () => await supabase
      .from('fantasy_stages')
      .select('*')
      .eq('stage_number', stageNumber)
      .eq('stage_tier', stageTier)
      .single(),
    1000 * 60 * 5
  );
    
  if (error) {
    // PGRST116: No rows
    if ((error as any).code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching fantasy stage by number:', error);
    throw error;
  }
  
  return data as FantasyStage;
}

/**
 * アクティブなファンタジーステージのみ取得（将来の拡張用）
 */
export async function fetchActiveFantasyStages(): Promise<FantasyStage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    'fantasy_stages:active',
    async () => await supabase
      .from('fantasy_stages')
      .select('*')
      .order('stage_number', { ascending: true }),
    1000 * 60 * 5
  );
    
  if (error) {
    console.error('Error fetching active fantasy stages:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * ユーザーのファンタジーモード進捗情報を取得
 */
export async function fetchFantasyUserProgress(userId: string): Promise<{
  currentStageNumber: string;
  totalClearedStages: number;
  wizardRank: string;
  currentStageNumberBasic?: string;
  currentStageNumberAdvanced?: string;
} | null> {
  const supabase = getSupabaseClient();
  
  // 60s TTL（ユーザー進捗）
  const { data, error } = await fetchWithCache(
    `fantasy_user_progress:${userId}`,
    async () => await supabase
      .from('fantasy_user_progress')
      .select('current_stage_number, total_cleared_stages, wizard_rank, current_stage_number_basic, current_stage_number_advanced')
      .eq('user_id', userId)
      .single(),
    1000 * 60
  );
    
  if (error) {
    if ((error as any).code === 'PGRST116') {
      // No rows returned - 新規ユーザーの場合
      return null;
    }
    console.error('Error fetching fantasy user progress:', error);
    throw error;
  }
  
  if (!data) return null;
  
  // snake_caseからcamelCaseに変換
  return {
    currentStageNumber: (data as any).current_stage_number,
    totalClearedStages: (data as any).total_cleared_stages || 0,
    wizardRank: (data as any).wizard_rank,
    currentStageNumberBasic: (data as any).current_stage_number_basic,
    currentStageNumberAdvanced: (data as any).current_stage_number_advanced,
  };
}

/**
 * ユーザーのファンタジーモードクリア済みステージ数を取得（全Tier合算）
 */
export async function fetchFantasyClearedStageCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  // まずユーザー進捗から取得を試みる
  const progress = await fetchFantasyUserProgress(userId);
  if (progress) {
    return progress.totalClearedStages;
  }
  
  // 進捗レコードがない場合は、クリア記録から直接カウント
  const { count, error } = await fetchWithCache(
    `fantasy_stage_clears:count:${userId}`,
    async () => await supabase
      .from('fantasy_stage_clears')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('clear_type', 'clear'),
    1000 * 60
  );
    
  if (error) {
    console.error('Error counting fantasy cleared stages:', error);
    return 0;
  }
  
  return count || 0;
}

export interface UpsertFantasyStagePayload {
  id?: string;
  stage_number?: string | null;  // レッスン専用ステージではnull可
  name: string;
  description?: string;
  max_hp?: number;
  enemy_gauge_seconds?: number;
  enemy_count?: number;
  enemy_hp?: number;
  min_damage?: number;
  max_damage?: number;
  mode: 'single' | 'progression' | 'progression_order' | 'progression_random' | 'progression_timing';
  allowed_chords?: any[]; // ChordSpec[] or string[]
  chord_progression?: any[]; // ChordSpec[]
  chord_progression_data?: any; // JSON array
  show_guide?: boolean;
  bgm_url?: string | null;
  mp3_url?: string | null;
  simultaneous_monster_count?: number;
  bpm?: number;
  measure_count?: number;
  time_signature?: number;
  count_in_measures?: number;
  note_interval_beats?: number | null;
  play_root_on_correct?: boolean;
  // ステージ種別（Basic/Advanced）
  stage_tier?: 'basic' | 'advanced';
  // 使用タイプ（fantasy=ファンタジーモード専用, lesson=レッスンモード専用, both=両方）
  usage_type?: FantasyStageUsageType;
  // 楽譜モード: true の場合、敵のアイコンを楽譜画像に置き換え
  is_sheet_music_mode?: boolean;
  // 次ステージ開放に必要なクリア換算回数（Sランク=10回換算、それ以外=1回）
  required_clears_for_next?: number;
  // MusicXML（OSMD楽譜表示用）
  music_xml?: string | null;
  // 移調設定
  base_key_transposition?: number; // 基準キーの移調量（半音単位、±6）
  transposition_practice_enabled?: boolean; // 移調練習機能の有効/無効
}

/**
 * 新規ファンタジーステージを作成
 */
export async function createFantasyStage(payload: UpsertFantasyStagePayload): Promise<FantasyStage> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('fantasy_stages')
    .insert(payload as any)
    .select('*')
    .single();
  if (error) throw error;
  return data as FantasyStage;
}

/**
 * 既存ファンタジーステージを更新
 */
export async function updateFantasyStage(id: string, payload: Partial<UpsertFantasyStagePayload>): Promise<FantasyStage> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('fantasy_stages')
    .update(payload as any)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as FantasyStage;
}

/**
 * ステージを削除
 */
export async function deleteFantasyStage(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('fantasy_stages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * 指定Tierのクリア済みステージ数を取得
 */
export async function fetchFantasyClearedStageCountByTier(
  userId: string,
  tier: 'basic' | 'advanced'
): Promise<number> {
  const supabase = getSupabaseClient();
  // Tierに属するステージIDを取得
  const { data: stages, error: stageErr } = await fetchWithCache(
    `fantasy_stages:ids_by_tier:${tier}`,
    async () => await supabase
      .from('fantasy_stages')
      .select('id')
      .eq('stage_tier', tier),
    1000 * 60 * 5
  );
  if (stageErr) {
    console.error('Error fetching stages by tier:', stageErr);
    return 0;
  }
  const stageIds = (stages || []).map((s: any) => s.id);
  if (stageIds.length === 0) return 0;
  // 対象ステージに紐づくクリア件数をカウント
  const { count, error } = await fetchWithCache(
    `fantasy_clears_count_by_tier:${userId}:${tier}`,
    async () => await supabase
      .from('fantasy_stage_clears')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('clear_type', 'clear')
      .in('stage_id', stageIds),
    1000 * 60
  );
  if (error) {
    console.error('Error counting tiered cleared stages:', error);
    return 0;
  }
  return count || 0;
}

/**
 * ユーザーのファンタジークリア記録一覧（60s TTL）
 */
export async function fetchFantasyStageClearsList(userId: string): Promise<Array<{
  id: string;
  user_id: string;
  stage_id: string;
  cleared_at: string;
  score: number;
  clear_type: 'clear' | 'gameover';
  remaining_hp: number;
  total_questions: number;
  correct_answers: number;
}>> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    `fantasy_stage_clears:list:${userId}`,
    async () => await supabase
      .from('fantasy_stage_clears')
      .select('*')
      .eq('user_id', userId),
    1000 * 60
  );
  if (error) throw error;
  return (data || []) as any;
}

/**
 * ベーシック/アドバンスド別のクリア数を一括取得
 */
export async function fetchFantasyClearedStageCounts(
  userId: string
): Promise<{ basic: number; advanced: number; total: number }> {
  const [basic, advanced] = await Promise.all([
    fetchFantasyClearedStageCountByTier(userId, 'basic'),
    fetchFantasyClearedStageCountByTier(userId, 'advanced'),
  ]);
  return { basic, advanced, total: basic + advanced };
}

/**
 * ファンタジーステージクリア記録を保存（RPC関数を使用）
 * @returns クリア結果情報（best_rank, total_clear_credit, clear_count, is_new_best_rank）
 */
export interface UpsertFantasyStageClearResult {
  id: string;
  bestRank: string | null;
  totalClearCredit: number;
  clearCount: number;
  isNewBestRank: boolean;
}

export async function upsertFantasyStageClear(
  userId: string,
  stageId: string,
  score: number,
  clearType: 'clear' | 'gameover',
  remainingHp: number,
  maxHp: number,
  totalQuestions: number,
  correctAnswers: number,
  rank: string
): Promise<UpsertFantasyStageClearResult | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.rpc('upsert_fantasy_stage_clear', {
    p_user_id: userId,
    p_stage_id: stageId,
    p_score: score,
    p_clear_type: clearType,
    p_remaining_hp: remainingHp,
    p_max_hp: maxHp,
    p_total_questions: totalQuestions,
    p_correct_answers: correctAnswers,
    p_rank: rank
  });

  if (error) {
    console.error('Error upserting fantasy stage clear:', error);
    throw error;
  }

  if (data && data.length > 0) {
    const result = data[0];
    // キャッシュをクリア
    clearCacheByPattern(new RegExp(`^fantasy_stage_clears`));
    clearCacheByPattern(new RegExp(`^fantasy_user_progress:${userId}`));
    
    return {
      id: result.id,
      bestRank: result.best_rank,
      totalClearCredit: result.total_clear_credit,
      clearCount: result.clear_count,
      isNewBestRank: result.is_new_best_rank
    };
  }

  return null;
}

/**
 * 次ステージの開放状況を確認
 */
export interface NextStageUnlockStatus {
  currentClearCredit: number;
  requiredClears: number;
  isUnlocked: boolean;
  remainingClears: number;
}

export async function getNextStageUnlockStatus(
  userId: string,
  stageId: string
): Promise<NextStageUnlockStatus | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.rpc('get_next_stage_unlock_status', {
    p_user_id: userId,
    p_current_stage_id: stageId
  });

  if (error) {
    console.error('Error getting next stage unlock status:', error);
    return null;
  }

  if (data && data.length > 0) {
    const result = data[0];
    return {
      currentClearCredit: result.current_clear_credit,
      requiredClears: result.required_clears,
      isUnlocked: result.is_unlocked,
      remainingClears: result.remaining_clears
    };
  }

  return null;
}