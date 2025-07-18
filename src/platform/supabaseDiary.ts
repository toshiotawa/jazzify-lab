import { getSupabaseClient } from '@/platform/supabaseClient';
import { addXp } from '@/platform/supabaseXp';
import { fetchActiveMonthlyMissions, incrementDiaryProgress } from '@/platform/supabaseMissions';
import { clearCacheByKey } from '@/platform/supabaseClient';

export interface Diary {
  id: string;
  user_id: string;
  content: string;
  practice_date: string; // yyyy-mm-dd
  created_at: string;
  likes: number;
  comment_count: number;
  nickname?: string;
  avatar_url?: string;
  level: number;
  rank: string;
  image_url?: string; // URL of the uploaded image for the diary entry
}

export interface DiaryComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  nickname: string;
  avatar_url?: string;
}

export async function fetchDiaries(limit = 20): Promise<Diary[]> {
  const supabase = getSupabaseClient();
  
  // 日記とプロフィール情報を取得
  const { data: diariesData, error } = await supabase
    .from('practice_diaries')
    .select('*, profiles(nickname, avatar_url, level, rank, email)')
    .order('practice_date', { ascending: false })
    .limit(limit * 2); // 余裕をもって多めに取得してフィルタリング後に制限
    
  if (error) throw error;
  if (!diariesData) return [];

  // 自動作成されたプロフィール（nickname = email）のユーザーの日記を除外
  const filteredDiaries = diariesData.filter((diary: any) => {
    const profile = diary.profiles;
    return profile && profile.nickname && profile.nickname !== profile.email;
  });

  // 日記IDのリストを作成
  const diaryIds = filteredDiaries.slice(0, limit).map(diary => diary.id);
  
  // 一括でいいね数とコメント数を取得
  const [likesData, commentsData] = await Promise.all([
    supabase
      .from('diary_likes')
      .select('diary_id')
      .in('diary_id', diaryIds)
      .then(result => {
        const likesMap = new Map();
        if (result.data) {
          result.data.forEach((item: any) => {
            likesMap.set(item.diary_id, (likesMap.get(item.diary_id) || 0) + 1);
          });
        }
        return likesMap;
      }),
    supabase
      .from('diary_comments')
      .select('diary_id')
      .in('diary_id', diaryIds)
      .then(result => {
        const commentsMap = new Map();
        if (result.data) {
          result.data.forEach((item: any) => {
            commentsMap.set(item.diary_id, (commentsMap.get(item.diary_id) || 0) + 1);
          });
        }
        return commentsMap;
      })
  ]);
  
  const diariesWithLikes = filteredDiaries.slice(0, limit).map((diary: any) => ({
    id: diary.id,
    user_id: diary.user_id,
    content: diary.content,
    practice_date: diary.practice_date,
    created_at: diary.created_at,
    likes: likesData.get(diary.id) || 0,
    comment_count: commentsData.get(diary.id) || 0,
    nickname: diary.profiles?.nickname || 'User',
    avatar_url: diary.profiles?.avatar_url,
    level: diary.profiles?.level || 1,
    rank: diary.profiles?.rank || 'free',
    image_url: diary.image_url,
  } as Diary));

  return diariesWithLikes;
}

export async function fetchUserDiaries(userId: string): Promise<{
  diaries: Array<{
    id: string;
    content: string;
    practice_date: string;
    created_at: string;
    likes: number;
    comment_count: number;
    image_url?: string;
  }>;
  profile: {
    nickname: string;
    avatar_url?: string;
    level: number;
    rank: string;
    bio?: string | null;
    twitter_handle?: string | null;
    selected_title?: string | null;
  };
}> {
  const supabase = getSupabaseClient();

  // ユーザーの日記を取得
  const { data: diariesData, error: diariesError } = await supabase
    .from('practice_diaries')
    .select('id, content, practice_date, created_at, image_url')
    .eq('user_id', userId)
    .order('practice_date', { ascending: false });

  if (diariesError) throw new Error(`日記の取得に失敗しました: ${diariesError.message}`);

  // 日記IDのリストを作成
  const diaryIds = (diariesData || []).map(diary => diary.id);
  
  // 一括でいいね数とコメント数を取得
  const [likesData, commentsData] = await Promise.all([
    supabase
      .from('diary_likes')
      .select('diary_id')
      .in('diary_id', diaryIds)
      .then(result => {
        const likesMap = new Map();
        if (result.data) {
          result.data.forEach((item: any) => {
            likesMap.set(item.diary_id, (likesMap.get(item.diary_id) || 0) + 1);
          });
        }
        return likesMap;
      }),
    supabase
      .from('diary_comments')
      .select('diary_id')
      .in('diary_id', diaryIds)
      .then(result => {
        const commentsMap = new Map();
        if (result.data) {
          result.data.forEach((item: any) => {
            commentsMap.set(item.diary_id, (commentsMap.get(item.diary_id) || 0) + 1);
          });
        }
        return commentsMap;
      })
  ]);
  
  const diariesWithLikes = (diariesData || []).map((diary) => ({
    ...diary,
    likes: likesData.get(diary.id) || 0,
    comment_count: commentsData.get(diary.id) || 0,
  }));

  // ユーザープロフィールを取得
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('nickname, avatar_url, level, rank, bio, twitter_handle, selected_title')
    .eq('id', userId)
    .single();

  if (profileError) throw new Error(`ユーザー情報の取得に失敗しました: ${profileError.message}`);

  return {
    diaries: diariesWithLikes,
    profile: profileData,
  };
}

export async function createDiary(content: string, imageUrl?: string): Promise<{
  success: boolean;
  xpGained: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  missionsUpdated: number;
  diaryId: string;
}> {
  const supabase = getSupabaseClient();
  const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');

  // 今日すでに投稿していないかチェック
  const { data: existing } = await supabase
    .from('practice_diaries')
    .select('id')
    .eq('user_id', user.id)
    .eq('practice_date', today)
    .single();
    
  if (existing) {
    throw new Error('本日はすでに日記を投稿済みです');
  }

  // プロフィール情報取得（現在のレベルを確認するため）
  const { data: profile } = await supabase
    .from('profiles')
    .select('level, rank')
    .eq('id', user.id)
    .single();
    
  const currentLevel = profile?.level || 1;
  const membershipRank = profile?.rank || 'free';

  // フリープランのユーザーは日記を投稿できない
  if (membershipRank === 'free') {
    throw new Error('フリープランでは日記を投稿できません。スタンダードプラン以上にアップグレードしてください。');
  }

  // 日記投稿
  const { data: diaryData, error } = await supabase.from('practice_diaries').insert({
    user_id: user.id,
    content,
    practice_date: today,
    image_url: imageUrl,
  }).select('id').single();
  if (error) throw new Error(`日記の保存に失敗しました: ${error.message}`);

  // ミッション進捗更新（1日1回まで）
  let missionsUpdated = 0;
  try {
    // 今日の日記投稿によるミッション進捗履歴をチェック
    const { count: todayMissionProgressCount } = await supabase
      .from('xp_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('reason', 'diary_post')
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    console.log('日記投稿 - 今日のミッション進捗履歴数:', todayMissionProgressCount);

    // 今日まだ日記投稿でミッション進捗を増やしていない場合のみ進捗を増やす
    if (!todayMissionProgressCount || todayMissionProgressCount === 0) {
      const missions = await fetchActiveMonthlyMissions();
      console.log('日記投稿 - アクティブなミッション数:', missions.length);
      
      for (const m of missions) {
        if (m.diary_count) {
          console.log('日記投稿 - 日記ミッション処理中:', { 
            missionId: m.id, 
            title: m.title, 
            diaryCount: m.diary_count,
            startDate: m.start_date,
            endDate: m.end_date
          });
          
          // 実際の日記数を再計算して進捗を更新
          const { count: actualDiaryCount } = await supabase
            .from('practice_diaries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('practice_date', m.start_date)
            .lte('practice_date', m.end_date);
          
          console.log('日記投稿 - 実際の日記数:', actualDiaryCount);
          
          // 進捗を実際の日記数に更新（完了フラグも設定）
          const { error: upsertError } = await supabase
            .from('user_challenge_progress')
            .upsert({
              user_id: user.id,
              challenge_id: m.id,
              clear_count: actualDiaryCount || 0,
              completed: (actualDiaryCount || 0) >= m.diary_count
            });
          
          if (upsertError) {
            console.error('日記投稿 - ミッション進捗更新エラー:', upsertError);
          } else {
            console.log('日記投稿 - ミッション進捗更新成功:', {
              missionId: m.id,
              clearCount: actualDiaryCount || 0,
              completed: (actualDiaryCount || 0) >= m.diary_count
            });
          }
          
          missionsUpdated++;
        }
      }
    } else {
      console.log('日記投稿 - 今日は既にミッション進捗を更新済み');
    }
  } catch (e) {
    console.warn('ミッション進捗の更新でエラーが発生しました:', e);
    // ミッションエラーは致命的ではないので続行
  }

  // 会員ランクに応じたXP倍率を適用
  const membershipMultiplier = membershipRank === 'premium' ? 1.5 : membershipRank === 'platinum' ? 2 : 1;

  // 既に本日日記投稿でXP獲得済みか確認
  const { count: xpTodayCount } = await supabase
    .from('xp_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('reason', 'diary_post')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');

  console.log('日記投稿 - 今日のXP獲得履歴数:', xpTodayCount);

  let xpResult: { gainedXp: number; totalXp: number; level: number } = { gainedXp:0, totalXp:0, level:currentLevel } as any;

  if (!xpTodayCount || xpTodayCount === 0) {
    console.log('日記投稿 - XP獲得処理開始');
    xpResult = await addXp({
      songId: null,
      baseXp: 5000,
      speedMultiplier: 1,
      rankMultiplier: 1,
      transposeMultiplier: 1,
      membershipMultiplier,
      reason: 'diary_post'
    });
    console.log('日記投稿 - XP獲得完了:', { gainedXp: xpResult.gainedXp, totalXp: xpResult.totalXp, level: xpResult.level });
  } else {
    console.log('日記投稿 - 今日は既にXP獲得済み');
    // XP 付与なし
    const { data: prof } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
    xpResult = { gainedXp:0, totalXp: prof?.xp || 0, level: prof?.level || currentLevel } as any;
  }

  // ミッション進捗のキャッシュをクリア
  const userMissionProgressCacheKey = `user_mission_progress:${user.id}`;
  clearCacheByKey(userMissionProgressCacheKey);
  console.log('日記投稿 - ミッション進捗キャッシュをクリア:', userMissionProgressCacheKey);

  return {
    success: true,
    xpGained: xpResult.gainedXp,
    totalXp: xpResult.totalXp,
    level: xpResult.level,
    levelUp: xpResult.level > currentLevel,
    missionsUpdated,
    diaryId: diaryData.id,
  };
}

export async function likeDiary(diaryId: string) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // 日記の所有者を確認
  const { data: diary, error: diaryError } = await supabase
    .from('practice_diaries')
    .select('user_id')
    .eq('id', diaryId)
    .single();
    
  if (diaryError || !diary) {
    throw new Error('日記が見つかりません');
  }
  
  // 自分の日記にはいいねできない
  if (diary.user_id === user.id) {
    throw new Error('自分の日記にはいいねできません');
  }
  
  // 既にいいね済みかチェック
  const { data: existingLike } = await supabase
    .from('diary_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('diary_id', diaryId)
    .single();
    
  if (existingLike) {
    throw new Error('既にいいね済みです');
  }
  
  await supabase.from('diary_likes').insert({ user_id: user.id, diary_id: diaryId }).throwOnError();
}

export async function updateDiary(diaryId: string, content: string, imageUrl?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');

  const updateData: any = { content };
  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl;
  }

  const { error } = await supabase
    .from('practice_diaries')
    .update(updateData)
    .eq('id', diaryId)
    .eq('user_id', user.id);
    
  if (error) throw new Error(`日記の更新に失敗しました: ${error.message}`);
}

export async function fetchComments(diaryId: string): Promise<DiaryComment[]> {
  type Row = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: { nickname: string; avatar_url?: string } | null;
  };

  const { data: rawData, error } = await getSupabaseClient()
    .from('diary_comments')
    .select('id, user_id, content, created_at, profiles(nickname, avatar_url)')
    .eq('diary_id', diaryId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const data = rawData as unknown as Row[] | null;
  if (!data) return [];

  // 型ガード: profiles が必ず存在する前提だが、null チェック
  return data.map((d) => {
    const profile = d.profiles ?? { nickname: 'User' };
    return {
      id: d.id,
      user_id: d.user_id,
      content: d.content,
      created_at: d.created_at,
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
    } satisfies DiaryComment;
  });
}

export async function addComment(diaryId: string, content: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  const { error } = await supabase.from('diary_comments').insert({
    diary_id: diaryId,
    user_id: user.id,
    content
  });
  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  const { error } = await supabase.from('diary_comments').delete().eq('id', commentId).eq('user_id', user.id);
  if (error) throw error;
}

export interface DiaryLikeUser {
  user_id: string;
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
}

export async function fetchDiaryLikes(diaryId: string, limit = 50): Promise<DiaryLikeUser[]> {
  const supabase = getSupabaseClient();

  // 1. diary_likes から user_id を取得
  const { data: likeRows, error: likeErr } = await supabase
    .from('diary_likes')
    .select('user_id')
    .eq('diary_id', diaryId)
    .limit(limit);

  if (likeErr) throw likeErr;
  if (!likeRows || likeRows.length === 0) return [];

  const userIds = likeRows.map(r => r.user_id);

  // 2. profiles からユーザー情報を取得
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, level, rank')
    .in('id', userIds);

  if (profErr) throw profErr;

  return (profiles || []).map(p => ({
    user_id: p.id as string,
    nickname: p.nickname || 'User',
    avatar_url: p.avatar_url || undefined,
    level: p.level || 1,
    rank: p.rank || 'free',
  }));
}

export async function deleteDiary(diaryId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  
  // 削除対象の日記の日付を取得
  const { data: diary } = await supabase
    .from('practice_diaries')
    .select('practice_date')
    .eq('id', diaryId)
    .eq('user_id', user.id)
    .single();
  
  if (!diary) throw new Error('日記が見つかりません');
  
  // 日記を削除
  const { error } = await supabase
    .from('practice_diaries')
    .delete()
    .eq('id', diaryId)
    .eq('user_id', user.id);
  if (error) throw new Error(`日記の削除に失敗しました: ${error.message}`);
  
  // 削除された日記がミッション進捗に影響する場合は進捗を調整
  try {
    const missions = await fetchActiveMonthlyMissions();
    for (const mission of missions) {
      if (mission.diary_count) {
        // 該当期間の日記数を再計算
        const { count: actualDiaryCount } = await supabase
          .from('practice_diaries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('practice_date', mission.start_date)
          .lte('practice_date', mission.end_date);
        
        // 進捗を実際の日記数に更新
        await supabase
          .from('user_challenge_progress')
          .upsert({
            user_id: user.id,
            challenge_id: mission.id,
            clear_count: actualDiaryCount || 0,
            completed: (actualDiaryCount || 0) >= mission.diary_count
          });
      }
    }
  } catch (e) {
    console.warn('ミッション進捗の調整でエラーが発生しました:', e);
  }

  // ミッション進捗のキャッシュをクリア
  const userMissionProgressCacheKey = `user_mission_progress:${user.id}`;
  clearCacheByKey(userMissionProgressCacheKey);
  console.log('日記削除 - ミッション進捗キャッシュをクリア:', userMissionProgressCacheKey);
}