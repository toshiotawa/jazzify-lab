import { getSupabaseClient } from './supabaseClient';

export interface FantasyStage {
  id: string;
  stage_number: string;
  name: string;
  description?: string;
  max_hp: number;
  enemy_count: number;
  enemy_hp: number;
  min_damage: number;
  max_damage: number;
  enemy_gauge_seconds: number;
  mode: 'single' | 'progression';
  allowed_chords: any[];
  chord_progression?: any[];
  show_sheet_music: boolean;
  show_guide: boolean;
  monster_icon?: string;
  bgm_url?: string;
  created_at: string;
  updated_at: string;
  simultaneous_monster_count?: number;
}

/**
 * 全てのファンタジーステージを取得
 */
export async function fetchAllFantasyStages(): Promise<FantasyStage[]> {
  const { data, error } = await getSupabaseClient()
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
 * レッスンのファンタジーステージクリア記録を保存
 */
export async function saveLessonFantasyClear(
  userId: string,
  lessonSongId: string,
  fantasyStageId: string,
  clearType: 'clear' | 'gameover',
  remainingHp: number,
  clearTime: number
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_fantasy_clears')
    .insert({
      user_id: userId,
      lesson_song_id: lessonSongId,
      fantasy_stage_id: fantasyStageId,
      clear_type: clearType,
      remaining_hp: remainingHp,
      clear_time: clearTime
    });

  if (error) {
    console.error('Error saving lesson fantasy clear:', error);
    throw error;
  }
}

/**
 * ミッションのファンタジーステージクリア記録を保存
 */
export async function saveMissionFantasyClear(
  userId: string,
  challengeId: string,
  fantasyStageId: string,
  clearType: 'clear' | 'gameover',
  remainingHp: number,
  clearTime: number
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('mission_fantasy_clears')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      fantasy_stage_id: fantasyStageId,
      clear_type: clearType,
      remaining_hp: remainingHp,
      clear_time: clearTime
    });

  if (error) {
    console.error('Error saving mission fantasy clear:', error);
    throw error;
  }
}

/**
 * レッスンのファンタジーステージクリア履歴を取得
 */
export async function fetchLessonFantasyClears(
  userId: string,
  lessonSongId: string,
  fantasyStageId: string
): Promise<Array<{ cleared_at: string; clear_type: string }>> {
  const { data, error } = await getSupabaseClient()
    .from('lesson_fantasy_clears')
    .select('cleared_at, clear_type')
    .eq('user_id', userId)
    .eq('lesson_song_id', lessonSongId)
    .eq('fantasy_stage_id', fantasyStageId)
    .eq('clear_type', 'clear')
    .order('cleared_at', { ascending: false });

  if (error) {
    console.error('Error fetching lesson fantasy clears:', error);
    throw error;
  }

  return data || [];
}

/**
 * ミッションのファンタジーステージクリア履歴を取得
 */
export async function fetchMissionFantasyClears(
  userId: string,
  challengeId: string,
  fantasyStageId: string
): Promise<Array<{ cleared_at: string; clear_type: string }>> {
  const { data, error } = await getSupabaseClient()
    .from('mission_fantasy_clears')
    .select('cleared_at, clear_type')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('fantasy_stage_id', fantasyStageId)
    .eq('clear_type', 'clear')
    .order('cleared_at', { ascending: false });

  if (error) {
    console.error('Error fetching mission fantasy clears:', error);
    throw error;
  }

  return data || [];
}