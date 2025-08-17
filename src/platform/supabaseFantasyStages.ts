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

export interface UpsertFantasyStagePayload {
  id?: string;
  stage_number: string;
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
  // 新規: ステージ種別（Basic/Advanced）
  stage_tier?: 'basic' | 'advanced';
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