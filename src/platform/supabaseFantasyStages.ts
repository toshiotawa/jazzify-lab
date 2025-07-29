import { getSupabaseClient } from './supabaseClient';
import { FantasyStage } from '../types';

/**
 * データベースのスネークケース形式をTypeScriptのキャメルケース形式に変換
 */
function transformFantasyStage(dbStage: any): FantasyStage {
  // デバッグ用
  console.log('🔄 Transforming stage data:', {
    stage_number: dbStage.stage_number,
    game_mode: dbStage.game_mode,
    pattern_type: dbStage.pattern_type,
    music_meta: dbStage.music_meta,
    audio_url: dbStage.audio_url
  });
  
  return {
    ...dbStage,
    // stage_mode はそのまま mode として使用（'single' | 'progression'）
    mode: dbStage.stage_mode || dbStage.mode || 'single',
    // game_mode → gameMode（'quiz' | 'rhythm'）
    gameMode: dbStage.game_mode,
    // 他のフィールドはそのまま（既にキャメルケース）
  };
}

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
  
  return (data || []).map(transformFantasyStage);
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
  
  return transformFantasyStage(data);
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
  
  return data ? transformFantasyStage(data) : null;
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
  
  return (data || []).map(transformFantasyStage);
}