import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { clearUserStatsCache } from './supabaseUserStats';

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
  reward_claimed: boolean;
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
  }, 1000 * 60 * 3); // 最適化: 3分キャッシュ（短いTTLで最新情報を確保）
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
  // 空のINクエリ防止
  if (!songsData || songsData.length === 0) {
    return [];
  }
  
  // 曲IDのリストを作成
  const songIds = songsData.map(song => song.song_id);
  if (songIds.length === 0) {
    return [];
  }
  
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
    // 空のINクエリ防止
    if (!songsData || songsData.length === 0) {
      return {};
    }
    
    // 曲IDのリストを作成
    const songIds = songsData.map((song: any) => song.song_id);
    // songIdsが空なら進捗クエリはスキップ
    let progressData: any[] | null = [];
    if (songIds.length > 0) {
      const { data: pd } = await supabase
        .from('user_song_progress')
        .select('song_id, clear_count')
        .eq('user_id', user.id)
        .in('song_id', songIds);
      progressData = pd || [];
    }
    
    // 進捗データをマップ化
    const progressMap = new Map();
    if (progressData && progressData.length > 0) {
      (progressData as any[]).forEach((item: any) => {
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
    // ミッション完了としてマーク（報酬はまだ未受取）
    const { error: missionError } = await supabase
      .from('user_challenge_progress')
      .upsert({
        user_id: user.id,
        challenge_id: missionId,
        clear_count: songProgress.length,
        completed: true,
        reward_claimed: false  // 報酬は未受取のままにする
      });
    
    if (missionError) throw new Error('ミッション完了の更新に失敗しました');
  }
  
  clearSupabaseCache();
  // 統計キャッシュをクリア
  clearUserStatsCache();
  return true;
}

export async function claimReward(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  
  try {
    // ミッション情報を取得
    const { data: mission, error: missionError } = await supabase
      .from('challenges')
      .select('reward_multiplier, diary_count')
      .eq('id', missionId)
      .single();
    
    if (missionError) throw missionError;
    
    // ミッションの曲情報を取得
    const { data: missionSongs, error: songsError } = await supabase
      .from('challenge_tracks')
      .select('song_id, clears_required')
      .eq('challenge_id', missionId);
    
    if (songsError) throw songsError;
    
    // 実際の進捗を計算
    let totalRequired = 0;
    let totalCompleted = 0;
    
    // 日記ミッションの場合
    if (mission.diary_count && mission.diary_count > 0) {
      totalRequired = mission.diary_count;
      // 日記の進捗を取得
      const { data: diaryProgress, error: diaryError } = await supabase
        .from('user_challenge_progress')
        .select('clear_count')
        .eq('user_id', user.id)
        .eq('challenge_id', missionId)
        .maybeSingle();
      
      if (diaryError) throw diaryError;
      totalCompleted = diaryProgress?.clear_count || 0;
    } else {
      // 曲ミッションの場合
      totalRequired = missionSongs.length;
      
      // 各曲の進捗を確認
      for (const song of missionSongs) {
        const { data: songProgress } = await supabase
          .from('user_song_progress')
          .select('clear_count')
          .eq('user_id', user.id)
          .eq('song_id', song.song_id)
          .maybeSingle();
        
        const requiredCount = song.clears_required || 1;
        const actualCount = songProgress?.clear_count || 0;
        
        if (actualCount >= requiredCount) {
          totalCompleted++;
        }
      }
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
      .eq('user_id', user.id)
      .eq('challenge_id', missionId)
      .maybeSingle();
    
    if (progressError) {
      // reward_claimed列が存在しない場合のエラー
      if (progressError.code === '42703') {
        console.warn('reward_claimed列が存在しません。マイグレーションが必要です。');
        // 代替手段：completed列のみでチェック
        const { data: fallbackProgress, error: fallbackError } = await supabase
          .from('user_challenge_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('challenge_id', missionId)
          .maybeSingle();
        
        if (fallbackError) throw fallbackError;
        
        // completedがtrueの場合は既に報酬を受け取ったとみなす
        if (fallbackProgress?.completed) {
          throw new Error('このミッションの報酬は既に受け取っています');
        }
      } else {
        throw progressError;
      }
    } else {
      // reward_claimed列が存在する場合の通常処理
      if (existingProgress?.reward_claimed) {
        throw new Error('このミッションの報酬は既に受け取っています');
      }
    }
    
    // ① 報酬受取フラグを設定（reward_claimed列が存在する場合のみ）
    try {
      // まずレコードが存在するかチェック
      const { data: existingRecord } = await supabase
        .from('user_challenge_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', missionId)
        .maybeSingle();
      
      if (existingRecord) {
        // レコードが存在する場合は更新
        const { error: updateError } = await supabase
          .from('user_challenge_progress')
          .update({ reward_claimed: true })
          .eq('user_id', user.id)
          .eq('challenge_id', missionId);
        
        if (updateError) {
          // reward_claimed列が存在しない場合はcompletedをtrueに設定
          if (updateError.code === '42703') {
            const { error: fallbackUpdateError } = await supabase
              .from('user_challenge_progress')
              .update({ completed: true })
              .eq('user_id', user.id)
              .eq('challenge_id', missionId);
            
            if (fallbackUpdateError) throw fallbackUpdateError;
          } else {
            throw updateError;
          }
        }
      } else {
        // レコードが存在しない場合は新規作成
        const { error: insertError } = await supabase
          .from('user_challenge_progress')
          .insert({
            user_id: user.id,
            challenge_id: missionId,
            clear_count: totalCompleted,
            completed: true,
            reward_claimed: true
          });
        
        if (insertError) {
          // reward_claimed列が存在しない場合はcompletedのみで作成
          if (insertError.code === '42703') {
            const { error: fallbackInsertError } = await supabase
              .from('user_challenge_progress')
              .insert({
                user_id: user.id,
                challenge_id: missionId,
                clear_count: totalCompleted,
                completed: true
              });
            
            if (fallbackInsertError) throw fallbackInsertError;
          } else {
            throw insertError;
          }
        }
      }
    } catch (updateError: any) {
      if (updateError.code === '42703') {
        // reward_claimed列が存在しない場合はcompletedをtrueに設定
        const { error: fallbackUpdateError } = await supabase
          .from('user_challenge_progress')
          .update({ completed: true })
          .eq('user_id', user.id)
          .eq('challenge_id', missionId);
        
        if (fallbackUpdateError) throw fallbackUpdateError;
      } else {
        throw updateError;
      }
    }

    // ② ミッション固有のXP付与（正しいaddXp関数を使用）
    const rewardXP = mission?.reward_multiplier || 2000; // デフォルト2000XP
    
    // addXp関数をインポートして使用
    const { addXp } = await import('@/platform/supabaseXp');
    
    // ギルド倍率の取得
    let guildMultiplier = 1;
    try {
      const { getMyGuild, fetchGuildMemberMonthlyXp } = await import('@/platform/supabaseGuilds');
      const { computeGuildBonus } = await import('@/utils/guildBonus');
      const myGuild = await getMyGuild();
      if (myGuild) {
        const perMember = await fetchGuildMemberMonthlyXp(myGuild.id);
        const contributors = perMember.filter(x => Number(x.monthly_xp || 0) >= 1).length;
        guildMultiplier = computeGuildBonus(myGuild.level || 1, contributors).totalMultiplier;
      }
    } catch {}

    const xpResult = await addXp({
      songId: null, // ミッション報酬なので曲IDはnull
      baseXp: rewardXP, // 報酬XPを基本XPとして使用
      speedMultiplier: 1, // ミッション報酬なので速度倍率は1
      rankMultiplier: 1, // ミッション報酬なのでランク倍率は1
      transposeMultiplier: 1, // ミッション報酬なので移調倍率は1
      membershipMultiplier: 1, // ミッション報酬なので会員倍率は1
      missionMultiplier: 1 * guildMultiplier, // ギルドボーナスを適用
      reason: 'mission_clear', // ミッション報酬の理由を明示的に指定
    });
    
    clearSupabaseCache();
    // 統計キャッシュをクリア
    clearUserStatsCache();
    
    // XP獲得情報を返す
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('level')
      .eq('id', user.id)
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
