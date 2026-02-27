import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import { ALL_STAGES } from '@/components/survival/SurvivalStageDefinitions';

export interface ChallengeSurvivalStage {
  challenge_id: string;
  stage_number: number;
  clears_required: number;
  stage_name: string;
  stage_name_en: string;
  difficulty: string;
}

export interface UserChallengeSurvivalProgressItem {
  challenge_id: string;
  stage_number: number;
  clear_count: number;
}

export interface MissionSurvivalStageProgressItem {
  stage_number: number;
  stage_name: string;
  stage_name_en: string;
  difficulty: string;
  clear_count: number;
  required_count: number;
  is_completed: boolean;
}

export async function getChallengeSurvivalStages(challengeId: string): Promise<ChallengeSurvivalStage[]> {
  const supabase = getSupabaseClient();
  const cacheKey = `challenge_survival_stages:${challengeId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('challenge_survival_stages')
      .select('challenge_id, stage_number, clears_required')
      .eq('challenge_id', challengeId)
      .order('stage_number'),
    1000 * 30
  );
  if (error) throw error;
  const rows = (data as Array<{ challenge_id: string; stage_number: number; clears_required: number }>) || [];
  return rows.map(r => {
    const stageDef = ALL_STAGES.find(s => s.stageNumber === r.stage_number);
    return {
      challenge_id: r.challenge_id,
      stage_number: r.stage_number,
      clears_required: r.clears_required,
      stage_name: stageDef?.name ?? `Stage ${r.stage_number}`,
      stage_name_en: stageDef?.nameEn ?? `Stage ${r.stage_number}`,
      difficulty: stageDef?.difficulty ?? 'easy',
    };
  });
}

export async function addSurvivalStageToChallenge(
  challengeId: string,
  stageNumber: number,
  clearsRequired: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('challenge_survival_stages')
    .insert({
      challenge_id: challengeId,
      stage_number: stageNumber,
      clears_required: clearsRequired,
    });
  if (error) throw error;
  clearSupabaseCache();
}

export async function updateSurvivalStageInChallenge(
  challengeId: string,
  stageNumber: number,
  clearsRequired: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('challenge_survival_stages')
    .update({ clears_required: clearsRequired })
    .eq('challenge_id', challengeId)
    .eq('stage_number', stageNumber);
  if (error) throw error;
  clearSupabaseCache();
}

export async function removeSurvivalStageFromChallenge(
  challengeId: string,
  stageNumber: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('challenge_survival_stages')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('stage_number', stageNumber);
  if (error) throw error;
  clearSupabaseCache();
}

export async function fetchUserChallengeSurvivalProgress(challengeId: string): Promise<UserChallengeSurvivalProgressItem[]> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();
  const cacheKey = `user_challenge_survival_progress:${userId}:${challengeId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_challenge_survival_progress')
      .select('challenge_id, stage_number, clear_count')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId),
    1000 * 30
  );
  if (error) throw error;
  return (data as unknown as UserChallengeSurvivalProgressItem[]) || [];
}

export async function incrementSurvivalMissionProgressOnClear(
  challengeId: string,
  stageNumber: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  const { data: existing } = await supabase
    .from('user_challenge_survival_progress')
    .select('clear_count')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('stage_number', stageNumber)
    .maybeSingle();

  const newCount = (existing?.clear_count ?? 0) + 1;

  const { error } = await supabase
    .from('user_challenge_survival_progress')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      stage_number: stageNumber,
      clear_count: newCount,
      last_cleared_at: new Date().toISOString(),
    }, { onConflict: 'user_id,challenge_id,stage_number' } as never);
  if (error) throw error;
  clearSupabaseCache();
}

export async function fetchMissionSurvivalProgress(challengeId: string): Promise<MissionSurvivalStageProgressItem[]> {
  const [stages, userProgress] = await Promise.all([
    getChallengeSurvivalStages(challengeId),
    fetchUserChallengeSurvivalProgress(challengeId),
  ]);
  const progressMap: Record<number, number> = {};
  for (const p of userProgress) {
    progressMap[p.stage_number] = p.clear_count;
  }
  return stages.map(s => {
    const count = progressMap[s.stage_number] || 0;
    const required = s.clears_required || 1;
    return {
      stage_number: s.stage_number,
      stage_name: s.stage_name,
      stage_name_en: s.stage_name_en,
      difficulty: s.difficulty,
      clear_count: count,
      required_count: required,
      is_completed: count >= required,
    };
  });
}
