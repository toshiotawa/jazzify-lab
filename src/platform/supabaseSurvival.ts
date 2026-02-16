/**
 * サバイバルモード関連のSupabase操作
 */
import { getSupabaseClient } from './supabaseClient';

export type SurvivalDifficulty = 'veryeasy' | 'easy' | 'normal' | 'hard' | 'extreme';

export interface SurvivalHighScore {
  id: string;
  userId: string;
  difficulty: SurvivalDifficulty;
  characterId: string | null;
  survivalTimeSeconds: number;
  finalLevel: number;
  enemiesDefeated: number;
  createdAt: string;
  updatedAt: string;
}

export interface SurvivalHighScoreResult {
  score: SurvivalHighScore;
  isNewHighScore: boolean;
}

export interface SurvivalDifficultySettings {
  id: string;
  difficulty: SurvivalDifficulty;
  displayName: string;
  description: string | null;
  allowedChords: string[];
  enemySpawnRate: number;
  enemySpawnCount: number;
  enemyStatMultiplier: number;
  expMultiplier: number;
  itemDropRate: number;
  bgmOddWaveUrl: string | null;
  bgmEvenWaveUrl: string | null;
}

export interface UserBestSurvivalTime {
  bestSurvivalTime: number;
  bestDifficulty: SurvivalDifficulty | null;
}

let hasCharacterColumnCache: boolean | null = null;

const isCharacterColumnMissingError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) {
    return false;
  }
  if (error.code === '42703' || error.code === 'PGRST204') {
    return true;
  }
  return (error.message ?? '').includes('character_id');
};

const isCharacterConflictTargetError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) {
    return false;
  }
  if (error.code === '42P10') {
    return true;
  }
  return (error.message ?? '').includes('ON CONFLICT');
};

async function hasCharacterColumn(supabase: ReturnType<typeof getSupabaseClient>): Promise<boolean> {
  if (hasCharacterColumnCache !== null) {
    return hasCharacterColumnCache;
  }
  const { error } = await supabase
    .from('survival_high_scores')
    .select('character_id')
    .limit(1);
  if (isCharacterColumnMissingError(error)) {
    hasCharacterColumnCache = false;
    return false;
  }
  if (error) {
    throw error;
  }
  hasCharacterColumnCache = true;
  return true;
}

/**
 * ユーザーのサバイバルハイスコアを保存/更新
 */
export async function upsertSurvivalHighScore(
  userId: string,
  difficulty: SurvivalDifficulty,
  survivalTimeSeconds: number,
  finalLevel: number,
  enemiesDefeated: number,
  characterId: string | null = null
): Promise<SurvivalHighScoreResult> {
  const supabase = getSupabaseClient();
  
  try {
    const canUseCharacterScope = await hasCharacterColumn(supabase);

    // 既存のスコアを取得
    let existingQuery = supabase
      .from('survival_high_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('difficulty', difficulty);
    if (canUseCharacterScope) {
      existingQuery = characterId
        ? existingQuery.eq('character_id', characterId)
        : existingQuery.is('character_id', null);
    }
    const { data: existing, error: selectError } = await existingQuery.maybeSingle();
    
    if (selectError) {
      console.error('Failed to fetch existing survival high score:', selectError);
      throw selectError;
    }
    
    // 既存のスコアより低い場合は更新しない
    if (existing && existing.survival_time_seconds >= survivalTimeSeconds) {
      return {
        score: convertHighScore(existing),
        isNewHighScore: false
      };
    }
    
    const basePayload: Record<string, unknown> = {
      user_id: userId,
      difficulty,
      survival_time_seconds: survivalTimeSeconds,
      final_level: finalLevel,
      enemies_defeated: enemiesDefeated,
      updated_at: new Date().toISOString(),
    };
    const preferredPayload = canUseCharacterScope
      ? { ...basePayload, character_id: characterId }
      : basePayload;
    let { data, error } = await supabase
      .from('survival_high_scores')
      .upsert(preferredPayload, {
        onConflict: canUseCharacterScope ? 'user_id,difficulty,character_id' : 'user_id,difficulty'
      })
      .select()
      .single();

    if (error && canUseCharacterScope && isCharacterConflictTargetError(error)) {
      const fallback = await supabase
        .from('survival_high_scores')
        .upsert(basePayload, {
          onConflict: 'user_id,difficulty'
        })
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    
    if (error) {
      console.error('Failed to upsert survival high score:', error);
      throw error;
    }
    
    return {
      score: convertHighScore(data),
      isNewHighScore: true
    };
  } catch (error) {
    console.error('upsertSurvivalHighScore failed:', error);
    throw error;
  }
}

/**
 * ユーザーのサバイバルハイスコアを取得
 */
export async function fetchUserSurvivalHighScores(userId: string): Promise<SurvivalHighScore[]> {
  const supabase = getSupabaseClient();
  const canUseCharacterScope = await hasCharacterColumn(supabase).catch(() => false);
  let query = supabase
    .from('survival_high_scores')
    .select('*')
    .eq('user_id', userId)
    .order('survival_time_seconds', { ascending: false });
  if (canUseCharacterScope) {
    query = query.order('character_id', { ascending: true });
  }
  const { data, error } = await query;
  
  if (error) throw error;
  return (data ?? []).map(convertHighScore);
}

/**
 * ユーザーの最高生存時間を取得
 */
export async function fetchUserBestSurvivalTime(userId: string): Promise<UserBestSurvivalTime | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .rpc('rpc_get_user_best_survival_time', { target_user_id: userId });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const row = data[0];
    return {
      bestSurvivalTime: Number(row.best_survival_time) || 0,
      bestDifficulty: row.best_difficulty as SurvivalDifficulty | null,
    };
  } catch {
    // RPCが利用できない場合はフォールバック
    const scores = await fetchUserSurvivalHighScores(userId);
    if (scores.length === 0) return null;
    
    const best = scores[0];
    return {
      bestSurvivalTime: best.survivalTimeSeconds,
      bestDifficulty: best.difficulty,
    };
  }
}

/**
 * 難易度設定を取得
 */
export async function fetchSurvivalDifficultySettings(): Promise<SurvivalDifficultySettings[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('survival_difficulty_settings')
    .select('*')
    .order('difficulty');
  
  if (error) throw error;
  return (data ?? []).map(convertDifficultySettings);
}

/**
 * 難易度設定を更新（管理者のみ）
 */
export async function updateSurvivalDifficultySettings(
  difficulty: SurvivalDifficulty,
  settings: Partial<Omit<SurvivalDifficultySettings, 'id' | 'difficulty'>>
): Promise<SurvivalDifficultySettings> {
  const supabase = getSupabaseClient();
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (settings.displayName !== undefined) updateData.display_name = settings.displayName;
  if (settings.description !== undefined) updateData.description = settings.description;
  if (settings.allowedChords !== undefined) updateData.allowed_chords = settings.allowedChords;
  if (settings.enemySpawnRate !== undefined) updateData.enemy_spawn_rate = settings.enemySpawnRate;
  if (settings.enemySpawnCount !== undefined) updateData.enemy_spawn_count = settings.enemySpawnCount;
  if (settings.enemyStatMultiplier !== undefined) updateData.enemy_stat_multiplier = settings.enemyStatMultiplier;
  if (settings.expMultiplier !== undefined) updateData.exp_multiplier = settings.expMultiplier;
  if (settings.itemDropRate !== undefined) updateData.item_drop_rate = settings.itemDropRate;
  if (settings.bgmOddWaveUrl !== undefined) updateData.bgm_odd_wave_url = settings.bgmOddWaveUrl;
  if (settings.bgmEvenWaveUrl !== undefined) updateData.bgm_even_wave_url = settings.bgmEvenWaveUrl;
  
  const { data, error } = await supabase
    .from('survival_difficulty_settings')
    .update(updateData)
    .eq('difficulty', difficulty)
    .select()
    .single();
  
  if (error) throw error;
  return convertDifficultySettings(data);
}

// ===== キャラクター型 =====
export interface SurvivalCharacterRow {
  id: string;
  name: string;
  nameEn: string | null;
  avatarUrl: string;
  sortOrder: number;
  initialStats: Record<string, unknown>;
  initialSkills: Record<string, unknown>;
  initialMagics: Record<string, unknown>;
  level10Bonuses: Array<{ type: string; value: number; max?: number }>;
  excludedBonuses: string[];
  permanentEffects: Array<{ type: string; level: number }>;
  noMagic: boolean;
  abColumnMagic: boolean;
  bonusChoiceCount: number;
  hpRegenPerSecond: number;
  description: string | null;
  descriptionEn: string | null;
}

/**
 * サバイバルキャラクター一覧を取得
 */
export async function fetchSurvivalCharacters(): Promise<SurvivalCharacterRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('survival_characters')
    .select('*')
    .order('sort_order');
  
  if (error) throw error;
  return (data ?? []).map(convertCharacter);
}

/**
 * プロフィールのサバイバルキャラクターIDを更新
 */
export async function updateProfileSurvivalCharacter(
  userId: string,
  characterId: string | null
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ survival_character_id: characterId })
    .eq('id', userId);
  
  if (error) throw error;
}

// 変換ヘルパー
function convertCharacter(row: Record<string, unknown>): SurvivalCharacterRow {
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: (row.name_en as string) || null,
    avatarUrl: row.avatar_url as string,
    sortOrder: Number(row.sort_order) || 0,
    initialStats: (row.initial_stats as Record<string, unknown>) || {},
    initialSkills: (row.initial_skills as Record<string, unknown>) || {},
    initialMagics: (row.initial_magics as Record<string, unknown>) || {},
    level10Bonuses: (row.level_10_bonuses as Array<{ type: string; value: number; max?: number }>) || [],
    excludedBonuses: (row.excluded_bonuses as string[]) || [],
    permanentEffects: (row.permanent_effects as Array<{ type: string; level: number }>) || [],
    noMagic: Boolean(row.no_magic),
    abColumnMagic: Boolean(row.ab_column_magic),
    bonusChoiceCount: Number(row.bonus_choice_count) || 3,
    hpRegenPerSecond: Number(row.hp_regen_per_second) || 0,
    description: (row.description as string) || null,
    descriptionEn: (row.description_en as string) || null,
  };
}

function convertHighScore(row: Record<string, unknown>): SurvivalHighScore {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    difficulty: row.difficulty as SurvivalDifficulty,
    characterId: typeof row.character_id === 'string' ? row.character_id : null,
    survivalTimeSeconds: Number(row.survival_time_seconds) || 0,
    finalLevel: Number(row.final_level) || 1,
    enemiesDefeated: Number(row.enemies_defeated) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function convertDifficultySettings(row: Record<string, unknown>): SurvivalDifficultySettings {
  return {
    id: row.id as string,
    difficulty: row.difficulty as SurvivalDifficulty,
    displayName: row.display_name as string,
    description: row.description as string | null,
    allowedChords: (row.allowed_chords as string[]) || [],
    enemySpawnRate: Number(row.enemy_spawn_rate) || 3,
    enemySpawnCount: Number(row.enemy_spawn_count) || 2,
    enemyStatMultiplier: Number(row.enemy_stat_multiplier) || 1.0,
    expMultiplier: Number(row.exp_multiplier) || 1.0,
    itemDropRate: Number(row.item_drop_rate) || 0.1,
    bgmOddWaveUrl: row.bgm_odd_wave_url as string | null,
    bgmEvenWaveUrl: row.bgm_even_wave_url as string | null,
  };
}
