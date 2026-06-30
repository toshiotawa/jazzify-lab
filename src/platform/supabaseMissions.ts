import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { clearUserStatsCache } from './supabaseUserStats';
import { requireUserId } from '@/platform/authHelpers';

export type MissionAudienceType = 'domestic' | 'global' | 'both';

export interface Mission {
  id: string;
  type: 'weekly' | 'monthly';
  category: 'diary' | 'fantasy_clear' | 'survival_clear';
  diary_count?: number | null;
  title: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  audience_type: MissionAudienceType;
  start_date: string;
  end_date: string;
  clears_required?: number | null;
  reward_multiplier: number;
}

export interface UserMissionProgress {
  challenge_id: string;
  clear_count: number;
  completed: boolean;
  reward_claimed: boolean;
}

function getTodayJSTString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().substring(0, 10);
}

export async function fetchActiveMonthlyMissions(): Promise<Mission[]> {
  const today = getTodayJSTString();
  const key = `missions:monthly:${today}`;
  const { data, error } = await fetchWithCache(key, async () => {
    const result = await getSupabaseClient()
      .from('challenges')
      .select('id,type,category,diary_count,title,title_en,description,description_en,audience_type,start_date,end_date,reward_multiplier')
      .eq('type', 'monthly')
      .lte('start_date', today)
      .gte('end_date', today)
      .neq('category', 'song_clear');
    return result;
  }, 1000 * 60 * 3);
  if (error) throw error;

  return (data ?? []).map((mission: Mission) => ({
    ...mission,
    audience_type: mission.audience_type || 'domestic',
  }));
}

/**
 * ユーザーのプランに応じてミッションをフィルタリング
 */
export function filterMissionsByPlan(missions: Mission[], rank: string | null | undefined): Mission[] {
  if (!rank) return [];
  const isGlobal = rank === 'standard_global';
  return missions.filter(m => {
    if (m.audience_type === 'both') return true;
    if (isGlobal) return m.audience_type === 'global';
    return m.audience_type === 'domestic';
  });
}

export async function incrementDiaryProgress(missionId: string) {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();
  await supabase.rpc('increment_diary_progress',{ _user_id:userId, _mission_id:missionId });
  clearSupabaseCache();
}

export async function fetchUserMissionProgress(): Promise<UserMissionProgress[]> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();
  const key = `user_mission_progress:${userId}`;
  const { data, error } = await fetchWithCache(
    key,
    async () => await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId),
    1000 * 60 // TTL 60s に延長
  );
  if (error) throw error;
  return data as UserMissionProgress[];
}


export async function claimReward(missionId: string) {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();
  
  try {
    // ミッション情報を取得（category を含む）
    const { data: mission, error: missionError } = await supabase
      .from('challenges')
      .select('reward_multiplier, diary_count, category')
      .eq('id', missionId)
      .single();
    
    if (missionError) throw missionError;
    
    // 実際の進捗を計算
    let totalRequired = 0;
    let totalCompleted = 0;

    if (mission.category === 'diary') {
      // 日記ミッション
      totalRequired = mission.diary_count || 0;
      const { data: diaryProgress, error: diaryError } = await supabase
        .from('user_challenge_progress')
        .select('clear_count')
        .eq('user_id', userId)
        .eq('challenge_id', missionId)
        .maybeSingle();
      if (diaryError) throw diaryError;
      totalCompleted = diaryProgress?.clear_count || 0;
    } else if (mission.category === 'fantasy_clear') {
      // ファンタジーステージ・ミッション（通常のファンタジーモードとは完全分離）
      const { data: tracks, error: tracksError } = await supabase
        .from('challenge_fantasy_tracks')
        .select('fantasy_stage_id, clears_required')
        .eq('challenge_id', missionId);
      if (tracksError) throw tracksError;
      const trackList = tracks || [];
      totalRequired = trackList.length;

      for (const tr of trackList) {
        const { data: p } = await supabase
          .from('user_challenge_fantasy_progress')
          .select('clear_count')
          .eq('user_id', userId)
          .eq('challenge_id', missionId)
          .eq('fantasy_stage_id', tr.fantasy_stage_id)
          .maybeSingle();
        const required = tr.clears_required || 1;
        const actual = p?.clear_count || 0;
        if (actual >= required) totalCompleted++;
      }
    } else if (mission.category === 'survival_clear') {
      const { data: tracks, error: tracksError } = await supabase
        .from('challenge_survival_stages')
        .select('stage_number, clears_required')
        .eq('challenge_id', missionId);
      if (tracksError) throw tracksError;
      const trackList = tracks || [];
      totalRequired = trackList.length;

      for (const tr of trackList) {
        const { data: p } = await supabase
          .from('user_challenge_survival_progress')
          .select('clear_count')
          .eq('user_id', userId)
          .eq('challenge_id', missionId)
          .eq('stage_number', tr.stage_number)
          .maybeSingle();
        const required = tr.clears_required || 1;
        const actual = p?.clear_count || 0;
        if (actual >= required) totalCompleted++;
      }
    } else {
      throw new Error('サポートされていないミッションカテゴリです');
    }
    
    // ミッションが完了しているかチェック
    const isMissionCompleted = totalCompleted >= totalRequired && totalRequired > 0;
    if (!isMissionCompleted) {
      throw new Error('ミッションが完了していません');
    }
    
    // 既に報酬を受け取っているかチェック
    const { data: existingProgress, error: progressError } = await supabase
      .from('user_challenge_progress')
      .select('reward_claimed, completed')
      .eq('user_id', userId)
      .eq('challenge_id', missionId)
      .maybeSingle();
    
    if (progressError) {
      if (progressError.code === '42703') {
        console.warn('reward_claimed列が存在しません。マイグレーションが必要です。');
        const { data: fallbackProgress, error: fallbackError } = await supabase
          .from('user_challenge_progress')
          .select('completed')
          .eq('user_id', userId)
          .eq('challenge_id', missionId)
          .maybeSingle();
        if (fallbackError) throw fallbackError;
        if (fallbackProgress?.completed) {
          throw new Error('このミッションの報酬は既に受け取っています');
        }
      } else {
        throw progressError;
      }
    } else {
      if (existingProgress?.reward_claimed) {
        throw new Error('このミッションの報酬は既に受け取っています');
      }
    }
    
    // ① 報酬受取フラグを設定
    try {
      const { data: existingRecord } = await supabase
        .from('user_challenge_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', missionId)
        .maybeSingle();
      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('user_challenge_progress')
          .update({ reward_claimed: true, completed: true, clear_count: totalCompleted })
          .eq('user_id', userId)
          .eq('challenge_id', missionId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_challenge_progress')
          .insert({
            user_id: userId,
            challenge_id: missionId,
            clear_count: totalCompleted,
            completed: true,
            reward_claimed: true,
          });
        if (insertError) throw insertError;
      }
    } catch (updateError: any) {
      if (updateError.code === '42703') {
        const { error: fallbackUpdateError } = await supabase
          .from('user_challenge_progress')
          .update({ completed: true, clear_count: totalCompleted })
          .eq('user_id', userId)
          .eq('challenge_id', missionId);
        if (fallbackUpdateError) throw fallbackUpdateError;
      } else {
        throw updateError;
      }
    }

    // ② XP付与
    const rewardXP = mission?.reward_multiplier || 2000;
    const { addXp } = await import('@/platform/supabaseXp');

    const xpResult = await addXp({
      songId: null,
      baseXp: rewardXP,
      speedMultiplier: 1,
      rankMultiplier: 1,
      transposeMultiplier: 1,
      membershipMultiplier: 1,
      missionMultiplier: 1,
      reason: 'mission_clear',
    });
    
    clearSupabaseCache();
    // 統計キャッシュをクリア
    clearUserStatsCache();
    
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('level')
      .eq('id', userId)
      .maybeSingle();
    
    return {
      gainedXp: xpResult.gainedXp,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
      levelUp: xpResult.level > (currentProfile?.level || 1)
    };
  } catch (error) {
    console.error('claimReward error:', error);
    throw error;
  }
}
