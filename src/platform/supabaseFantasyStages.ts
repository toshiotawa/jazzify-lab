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
  
  // データ変換とデフォルト値設定
  return (data || []).map(stage => ({
    ...stage,
    game_type: stage.game_type || 'quiz',
    rhythm_pattern: stage.rhythm_pattern || 'random',
    bpm: stage.bpm || 120,
    time_signature: stage.time_signature || 4,
    loop_measures: stage.loop_measures || 8,
    mp3_url: stage.mp3_url || null,
    chord_progression_data: stage.chord_progression_data || []
  }));
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
  
  // データ変換とデフォルト値設定
  return {
    ...data,
    game_type: data.game_type || 'quiz',
    rhythm_pattern: data.rhythm_pattern || 'random',
    bpm: data.bpm || 120,
    time_signature: data.time_signature || 4,
    loop_measures: data.loop_measures || 8,
    mp3_url: data.mp3_url || null,
    chord_progression_data: data.chord_progression_data || []
  };
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
  
  if (!data) {
    return null;
  }
  
  // データ変換とデフォルト値設定
  return {
    ...data,
    game_type: data.game_type || 'quiz',
    rhythm_pattern: data.rhythm_pattern || 'random',
    bpm: data.bpm || 120,
    time_signature: data.time_signature || 4,
    loop_measures: data.loop_measures || 8,
    mp3_url: data.mp3_url || null,
    chord_progression_data: data.chord_progression_data || []
  };
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
  
  // データ変換とデフォルト値設定
  return (data || []).map(stage => ({
    ...stage,
    game_type: stage.game_type || 'quiz',
    rhythm_pattern: stage.rhythm_pattern || 'random',
    bpm: stage.bpm || 120,
    time_signature: stage.time_signature || 4,
    loop_measures: stage.loop_measures || 8,
    chord_progression_data: stage.chord_progression_data || []
  }));
}

/**
 * リズムモード専用のバリデーション関数
 */
export function validateRhythmStage(stage: FantasyStage): { 
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 基本バリデーション
  if (stage.game_type === 'rhythm') {
    
    // BPM範囲チェック
    if (stage.bpm && (stage.bpm < 60 || stage.bpm > 200)) {
      errors.push(`Invalid BPM: ${stage.bpm} (must be 60-200)`);
    }

    // 拍子チェック
    if (stage.time_signature && ![3, 4].includes(stage.time_signature)) {
      errors.push(`Invalid time signature: ${stage.time_signature} (must be 3 or 4)`);
    }

    // 小節数チェック
    if (stage.loop_measures && (stage.loop_measures < 4 || stage.loop_measures > 32)) {
      errors.push(`Invalid loop measures: ${stage.loop_measures} (must be 4-32)`);
    }

    // プログレッション専用チェック
    if (stage.rhythm_pattern === 'progression') {
      if (!stage.chord_progression_data || stage.chord_progression_data.length === 0) {
        errors.push('Progression pattern requires chord_progression_data');
      } else {
        // プログレッションデータの妥当性チェック
        stage.chord_progression_data.forEach((chord, index) => {
          if (!chord.chord || chord.chord.trim() === '') {
            errors.push(`Empty chord at index ${index}`);
          }
          if (chord.measure < 1 || (stage.loop_measures && chord.measure > stage.loop_measures)) {
            errors.push(`Invalid measure ${chord.measure} at index ${index}`);
          }
          if (chord.beat < 1 || (stage.time_signature && chord.beat > stage.time_signature)) {
            errors.push(`Invalid beat ${chord.beat} at index ${index}`);
          }
        });
      }
    }

    // ランダム専用チェック
    if (stage.rhythm_pattern === 'random') {
      if (!stage.allowed_chords || stage.allowed_chords.length === 0) {
        errors.push('Random pattern requires allowed_chords');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}