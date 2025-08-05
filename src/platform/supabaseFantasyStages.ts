import { getSupabaseClient } from './supabaseClient';
import { FantasyStage } from '../types';

/**
 * ファンタジーステージ一覧を取得
 */
export async function fetchFantasyStages(): Promise<FantasyStage[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('fantasy_stages')
    .select('*')
    .order('stage_number', { ascending: true });
    
  if (error) {
    console.error('Error fetching fantasy stages:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * 特定のファンタジーステージを取得
 */
export async function fetchFantasyStageById(stageId: string): Promise<FantasyStage> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('fantasy_stages')
    .select('*')
    .eq('id', stageId)
    .single();
    
  if (error) {
    console.error('Error fetching fantasy stage:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Fantasy stage not found');
  }
  
  return data;
}

/**
 * ステージ番号でファンタジーステージを取得
 */
export async function fetchFantasyStageByNumber(stageNumber: string): Promise<FantasyStage | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('fantasy_stages')
    .select('*')
    .eq('stage_number', stageNumber)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching fantasy stage by number:', error);
    throw error;
  }
  
  return data;
}

/**
 * アクティブなファンタジーステージのみ取得（将来の拡張用）
 */
export async function fetchActiveFantasyStages(): Promise<FantasyStage[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('fantasy_stages')
    .select('*')
    .order('stage_number', { ascending: true });
    
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
} | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('fantasy_user_progress')
    .select('current_stage_number, total_cleared_stages, wizard_rank')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - 新規ユーザーの場合
      return null;
    }
    console.error('Error fetching fantasy user progress:', error);
    throw error;
  }
  
  if (!data) return null;
  
  // snake_caseからcamelCaseに変換
  return {
    currentStageNumber: data.current_stage_number,
    totalClearedStages: data.total_cleared_stages || 0,
    wizardRank: data.wizard_rank
  };
}

/**
 * ユーザーのファンタジーモードクリア済みステージ数を取得
 */
export async function fetchFantasyClearedStageCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  // まずユーザー進捗から取得を試みる
  const progress = await fetchFantasyUserProgress(userId);
  if (progress) {
    return progress.totalClearedStages;
  }
  
  // 進捗レコードがない場合は、クリア記録から直接カウント
  const { count, error } = await supabase
    .from('fantasy_stage_clears')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('clear_type', 'clear');
    
  if (error) {
    console.error('Error counting fantasy cleared stages:', error);
    return 0;
  }
  
  return count || 0;
}