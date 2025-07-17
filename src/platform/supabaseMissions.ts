import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';

export interface MissionSong {
  song_id: string;
  key_offset: number;
  min_speed: number;
  min_rank: string;
  clears_required: number;
  notation_setting: string;
  songs?: { id: string; title: string; artist?: string };
}

export interface Mission {
  id: string;
  type: 'weekly' | 'monthly';
  diary_count?: number | null;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  clears_required?: number | null;
  reward_multiplier: number;
  songs?: MissionSong[];
}

export interface UserMissionProgress {
  challenge_id: string;
  clear_count: number;
  completed: boolean;
}

export interface MissionSongProgress {
  challenge_id: string;
  song_id: string;
  clear_count: number;
  required_count: number;
  is_completed: boolean;
  song?: { id: string; title: string; artist?: string };
  // クリア条件
  min_rank?: string;
  min_speed?: number;
  key_offset?: number;
  notation_setting?: string;
}

// JSTで今日の日付(yyyy-mm-dd)を取得
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
      .select('*, challenge_tracks(*, songs(id,title,artist))')
      .eq('type','monthly')
      .lte('start_date', today)  // 開始日が今日以前（今日を含む）
      .gte('end_date', today);   // 終了日が今日以降（今日を含む）
    
    console.log('fetchActiveMonthlyMissions raw data:', result);
    return result;
  }, 1000*30);
  if (error) throw error;
  
  // データを正しくマッピング
  const missions = data.map((mission: any) => ({
    ...mission,
    songs: mission.challenge_tracks?.map((track: any) => ({
      song_id: track.song_id,
      key_offset: track.key_offset || 0,
      min_speed: track.min_speed || 1.0,
      min_rank: track.min_rank || 'B',
      clears_required: track.clears_required || 1,
      notation_setting: track.notation_setting || 'both',
      songs: track.songs
    })) || []
  }));
  
  console.log('fetchActiveMonthlyMissions processed missions:', missions);
  return missions as Mission[];
}

export async function fetchMissionSongs(missionId: string): Promise<MissionSong[]> {
  const { data, error } = await getSupabaseClient()
    .from('challenge_tracks')
    .select('*, songs(id,title,artist)')
    .eq('challenge_id', missionId);
  if (error) throw error;
  return data as MissionSong[];
}

export async function incrementDiaryProgress(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('increment_diary_progress',{ _user_id:user.id, _mission_id:missionId });
  clearSupabaseCache();
}

export async function fetchUserMissionProgress(): Promise<UserMissionProgress[]> {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return [];
  const key = `user_mission_progress:${user.id}`;
  const { data, error } = await fetchWithCache(key, async () =>
    await supabase.from('user_challenge_progress').select('*').eq('user_id', user.id),
    1000*15,
  );
  if (error) throw error;
  return data as UserMissionProgress[];
}

/**
 * ミッションの曲進捗を取得
 */
export async function fetchMissionSongProgress(missionId: string): Promise<MissionSongProgress[]> {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // ミッションの曲一覧を取得
  const { data: songsData, error: songsError } = await supabase
    .from('challenge_tracks')
    .select('*, songs(id,title,artist)')
    .eq('challenge_id', missionId);
  
  if (songsError) throw songsError;
  
  // 曲IDのリストを作成
  const songIds = songsData.map(song => song.song_id);
  
  // 一括で進捗を取得
  const { data: progressData } = await supabase
    .from('user_song_progress')
    .select('song_id, clear_count')
    .eq('user_id', user.id)
    .in('song_id', songIds);
  
  // 進捗データをマップ化
  const progressMap = new Map();
  if (progressData) {
    progressData.forEach((item: any) => {
      progressMap.set(item.song_id, item.clear_count);
    });
  }
  
  const songProgress = songsData.map((song) => {
    const clearCount = progressMap.get(song.song_id) || 0;
    const requiredCount = song.clears_required || 1;
    
    return {
      challenge_id: missionId,
      song_id: song.song_id,
      clear_count: clearCount,
      required_count: requiredCount,
      is_completed: clearCount >= requiredCount,
      song: song.songs,
      // クリア条件を追加
      min_rank: song.min_rank,
      min_speed: song.min_speed,
      key_offset: song.key_offset,
      notation_setting: song.notation_setting
    };
  });
  
  return songProgress;
}

/**
 * 複数のミッションの曲進捗を一括取得
 */
export async function fetchMissionSongProgressAll(missionIds: string[]): Promise<Record<string, MissionSongProgress[]>> {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user || missionIds.length === 0) return {};
  
  try {
    // 全てのミッションの曲一覧を一括取得
    const { data: songsData, error: songsError } = await supabase
      .from('challenge_tracks')
      .select('challenge_id, song_id, min_rank, min_speed, key_offset, notation_setting, clears_required, songs(id,title,artist)')
      .in('challenge_id', missionIds);
    
    if (songsError) throw songsError;
    
    // 曲IDのリストを作成
    const songIds = songsData.map((song: any) => song.song_id);
    
    // 一括で進捗を取得
    const { data: progressData } = await supabase
      .from('user_song_progress')
      .select('song_id, clear_count')
      .eq('user_id', user.id)
      .in('song_id', songIds);
    
    // 進捗データをマップ化
    const progressMap = new Map();
    if (progressData) {
      progressData.forEach((item: any) => {
        progressMap.set(item.song_id, item.clear_count);
      });
    }
    
    // ミッションIDごとにグループ化
    const result: Record<string, MissionSongProgress[]> = {};
    
    songsData.forEach((song: any) => {
      const clearCount = progressMap.get(song.song_id) || 0;
      const requiredCount = song.clears_required || 1;
      
      const songProgress: MissionSongProgress = {
        challenge_id: song.challenge_id,
        song_id: song.song_id,
        clear_count: clearCount,
        required_count: requiredCount,
        is_completed: clearCount >= requiredCount,
        song: song.songs,
        min_rank: song.min_rank,
        min_speed: song.min_speed,
        key_offset: song.key_offset,
        notation_setting: song.notation_setting
      };
      
      if (!result[song.challenge_id]) {
        result[song.challenge_id] = [];
      }
      result[song.challenge_id].push(songProgress);
    });
    
    return result;
  } catch (error) {
    console.error('一括ミッション進捗取得エラー:', error);
    return {};
  }
}

/**
 * ミッションの曲をプレイする
 */
export async function playMissionSong(missionId: string, songId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  
  // ミッションの曲情報を取得
  const { data: songData, error: songError } = await supabase
    .from('challenge_tracks')
    .select('*, songs(*)')
    .eq('challenge_id', missionId)
    .eq('song_id', songId)
    .single();
  
  if (songError) throw new Error('曲情報の取得に失敗しました');
  
  return {
    song: songData.songs,
    conditions: {
      key_offset: songData.key_offset,
      min_speed: songData.min_speed,
      min_rank: songData.min_rank,
      clears_required: songData.clears_required,
      notation_setting: songData.notation_setting
    }
  };
}

/**
 * ミッションの曲クリア進捗を更新
 */
export async function updateMissionSongProgress(
  missionId: string, 
  songId: string, 
  rank: string,
  conditions: {
    min_rank: string;
    min_speed: number;
  }
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  
  // ランク条件をチェック
  const rankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
  const currentRankOrder = rankOrder[rank as keyof typeof rankOrder];
  const requiredRankOrder = rankOrder[conditions.min_rank as keyof typeof rankOrder];
  
  if (currentRankOrder < requiredRankOrder) {
    return false; // ランク条件を満たしていない
  }
  
  // 曲の進捗を更新
  const { data: existingProgress } = await supabase
    .from('user_song_progress')
    .select('clear_count')
    .eq('user_id', user.id)
    .eq('song_id', songId)
    .single();
  
  const currentCount = existingProgress?.clear_count || 0;
  const newCount = currentCount + 1;
  
  // 進捗を更新または挿入
  const { error: updateError } = await supabase
    .from('user_song_progress')
    .upsert({
      user_id: user.id,
      song_id: songId,
      clear_count: newCount,
      best_rank: rank,
      last_cleared_at: new Date().toISOString()
    });
  
  if (updateError) throw new Error('進捗の更新に失敗しました');
  
  // ミッション全体の進捗をチェック
  const songProgress = await fetchMissionSongProgress(missionId);
  const allCompleted = songProgress.every(song => song.is_completed);
  
  if (allCompleted) {
    // ミッション完了としてマーク
    const { error: missionError } = await supabase
      .from('user_challenge_progress')
      .upsert({
        user_id: user.id,
        challenge_id: missionId,
        clear_count: songProgress.length,
        completed: true
      });
    
    if (missionError) throw new Error('ミッション完了の更新に失敗しました');
  }
  
  clearSupabaseCache();
  return true;
}

export async function claimReward(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // ① 完了フラグ
  await supabase.from('user_challenge_progress')
    .update({ completed: true })
    .eq('user_id', user.id)
    .eq('challenge_id', missionId);

  // ② 固定 XP 付与（2000 XP）
  const { error } = await supabase.rpc('add_xp', {
    _user_id: user.id,
    _gained_xp: 2000,
    _reason: 'mission_clear'
  });
  if (error) throw error;
  
  clearSupabaseCache();
}
