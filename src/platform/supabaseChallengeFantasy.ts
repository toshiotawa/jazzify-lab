import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import type { FantasyStage, RepeatTranspositionMode } from '@/types';

export interface ChallengeFantasyTrack {
  challenge_id: string;
  fantasy_stage_id: string;
  clears_required: number;
  stage: Pick<FantasyStage, 'id' | 'stage_number' | 'name' | 'description' | 'mode'>;
  // timingモードステージ用の上書き設定
  override_repeat_transposition_mode?: RepeatTranspositionMode | null;
  override_start_key?: number | null;
}

export interface UserChallengeFantasyProgressItem {
  challenge_id: string;
  fantasy_stage_id: string;
  clear_count: number;
}

export async function getChallengeFantasyTracks(challengeId: string): Promise<ChallengeFantasyTrack[]> {
  const supabase = getSupabaseClient();
  const cacheKey = `challenge_fantasy_tracks:${challengeId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('challenge_fantasy_tracks')
      .select('challenge_id, fantasy_stage_id, clears_required, override_repeat_transposition_mode, override_start_key, fantasy_stages(id, stage_number, name, description, mode)')
      .eq('challenge_id', challengeId),
    1000 * 30
  );
  if (error) throw error;
  const rows = (data as unknown as Array<{
    challenge_id: string;
    fantasy_stage_id: string;
    clears_required: number;
    override_repeat_transposition_mode: RepeatTranspositionMode | null;
    override_start_key: number | null;
    fantasy_stages: { id: string; stage_number: string; name: string; description: string; mode: string };
  }>) || [];
  return rows.map((r) => ({
    challenge_id: r.challenge_id,
    fantasy_stage_id: r.fantasy_stage_id,
    clears_required: r.clears_required,
    override_repeat_transposition_mode: r.override_repeat_transposition_mode,
    override_start_key: r.override_start_key,
    stage: {
      id: r.fantasy_stages.id,
      stage_number: r.fantasy_stages.stage_number,
      name: r.fantasy_stages.name,
      description: r.fantasy_stages.description,
      mode: r.fantasy_stages.mode as FantasyStage['mode'],
    },
  }));
}

export interface AddFantasyStageOptions {
  clearsRequired: number;
  overrideRepeatTranspositionMode?: RepeatTranspositionMode | null;
  overrideStartKey?: number | null;
}

export async function addFantasyStageToChallenge(
  challengeId: string, 
  fantasyStageId: string, 
  clearsRequiredOrOptions: number | AddFantasyStageOptions
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 後方互換性のため、数値で渡された場合はclearsRequiredとして扱う
  const options: AddFantasyStageOptions = typeof clearsRequiredOrOptions === 'number' 
    ? { clearsRequired: clearsRequiredOrOptions }
    : clearsRequiredOrOptions;
  
  const { error } = await supabase
    .from('challenge_fantasy_tracks')
    .insert({
      challenge_id: challengeId,
      fantasy_stage_id: fantasyStageId,
      clears_required: options.clearsRequired,
      override_repeat_transposition_mode: options.overrideRepeatTranspositionMode ?? null,
      override_start_key: options.overrideStartKey ?? null,
    });
  if (error) throw error;
  clearSupabaseCache();
}

export interface UpdateFantasyStageOptions {
  clearsRequired?: number;
  overrideRepeatTranspositionMode?: RepeatTranspositionMode | null;
  overrideStartKey?: number | null;
}

export async function updateFantasyStageInChallenge(
  challengeId: string, 
  fantasyStageId: string, 
  clearsRequiredOrOptions: number | UpdateFantasyStageOptions
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 後方互換性のため、数値で渡された場合はclearsRequiredとして扱う
  const options: UpdateFantasyStageOptions = typeof clearsRequiredOrOptions === 'number' 
    ? { clearsRequired: clearsRequiredOrOptions }
    : clearsRequiredOrOptions;
  
  // 更新するフィールドを構築
  const updateFields: Record<string, unknown> = {};
  if (options.clearsRequired !== undefined) {
    updateFields.clears_required = options.clearsRequired;
  }
  if (options.overrideRepeatTranspositionMode !== undefined) {
    updateFields.override_repeat_transposition_mode = options.overrideRepeatTranspositionMode;
  }
  if (options.overrideStartKey !== undefined) {
    updateFields.override_start_key = options.overrideStartKey;
  }
  
  const { error } = await supabase
    .from('challenge_fantasy_tracks')
    .update(updateFields)
    .eq('challenge_id', challengeId)
    .eq('fantasy_stage_id', fantasyStageId);
  if (error) throw error;
  clearSupabaseCache();
}

export async function removeFantasyStageFromChallenge(challengeId: string, fantasyStageId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('challenge_fantasy_tracks')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('fantasy_stage_id', fantasyStageId);
  if (error) throw error;
  clearSupabaseCache();
}

export async function fetchUserChallengeFantasyProgress(challengeId: string): Promise<UserChallengeFantasyProgressItem[]> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();
  const cacheKey = `user_challenge_fantasy_progress:${userId}:${challengeId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_challenge_fantasy_progress')
      .select('challenge_id, fantasy_stage_id, clear_count')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId),
    1000 * 30
  );
  if (error) throw error;
  return (data as unknown as UserChallengeFantasyProgressItem[]) || [];
}

export async function incrementFantasyMissionProgressOnClear(challengeId: string, fantasyStageId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();
  const { error } = await supabase
    .from('user_challenge_fantasy_progress')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      fantasy_stage_id: fantasyStageId,
      clear_count: 1,
      last_cleared_at: new Date().toISOString(),
    }, { onConflict: 'user_id,challenge_id,fantasy_stage_id' } as never);
  if (error) throw error;
  clearSupabaseCache();
}

export interface MissionFantasyStageProgressItem {
  fantasy_stage_id: string;
  stage: Pick<FantasyStage, 'id' | 'stage_number' | 'name' | 'description'>;
  clear_count: number;
  required_count: number;
  is_completed: boolean;
}

export async function fetchMissionFantasyProgress(challengeId: string): Promise<MissionFantasyStageProgressItem[]> {
  const [tracks, userProgress] = await Promise.all([
    getChallengeFantasyTracks(challengeId),
    fetchUserChallengeFantasyProgress(challengeId),
  ]);
  const progressMap: Record<string, number> = {};
  for (const p of userProgress) {
    progressMap[p.fantasy_stage_id] = p.clear_count;
  }
  return tracks.map((t) => {
    const count = progressMap[t.fantasy_stage_id] || 0;
    const required = t.clears_required || 1;
    return {
      fantasy_stage_id: t.fantasy_stage_id,
      stage: t.stage,
      clear_count: count,
      required_count: required,
      is_completed: count >= required,
    };
  });
}