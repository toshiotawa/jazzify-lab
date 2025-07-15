import { getSupabaseClient } from '@/platform/supabaseClient';
import { addXp } from '@/platform/supabaseXp';
import { fetchActiveMonthlyMissions, incrementDiaryProgress } from '@/platform/supabaseMissions';

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

  // 各日記のいいね数を取得
  const diariesWithLikes = await Promise.all(
    filteredDiaries.slice(0, limit).map(async (diary: any) => {
      const { count: likeCount } = await supabase
        .from('diary_likes')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', diary.id);
      
      const { count: commentCount } = await supabase
        .from('diary_comments')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', diary.id);
      
      return {
        id: diary.id,
        user_id: diary.user_id,
        content: diary.content,
        practice_date: diary.practice_date,
        created_at: diary.created_at,
        likes: likeCount || 0,
        comment_count: commentCount || 0,
        nickname: diary.profiles?.nickname || 'User',
        avatar_url: diary.profiles?.avatar_url,
        level: diary.profiles?.level || 1,
        rank: diary.profiles?.rank || 'free',
      } as Diary;
    })
  );

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
    .select('id, content, practice_date, created_at')
    .eq('user_id', userId)
    .order('practice_date', { ascending: false });

  if (diariesError) throw new Error(`日記の取得に失敗しました: ${diariesError.message}`);

  // 各日記のいいね数とコメント数を取得
  const diariesWithLikes = await Promise.all(
    (diariesData || []).map(async (diary) => {
      const { count: likeCount } = await supabase
        .from('diary_likes')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', diary.id);
      
      const { count: commentCount } = await supabase
        .from('diary_comments')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', diary.id);
      
      return {
        ...diary,
        likes: likeCount || 0,
        comment_count: commentCount || 0,
      };
    })
  );

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

export async function createDiary(content: string): Promise<{
  success: boolean;
  xpGained: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  missionsUpdated: number;
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

  // 日記投稿
  const { error } = await supabase.from('practice_diaries').insert({
    user_id: user.id,
    content,
    practice_date: today,
  });
  if (error) throw new Error(`日記の保存に失敗しました: ${error.message}`);

  // ミッション進捗更新
  let missionsUpdated = 0;
  try {
    const missions = await fetchActiveMonthlyMissions();
    for (const m of missions) {
      if (m.diary_count) {
        await incrementDiaryProgress(m.id);
        missionsUpdated++;
      }
    }
  } catch (e) {
    console.warn('ミッション進捗の更新でエラーが発生しました:', e);
    // ミッションエラーは致命的ではないので続行
  }

  // 会員ランクに応じたXP倍率を適用
  const membershipMultiplier = membershipRank === 'premium' ? 1.5 : membershipRank === 'platinum' ? 2 : 1;

  // 既に本日XP獲得済みか確認
  const { count: xpTodayCount } = await supabase
    .from('xp_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('song_id', null)
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');

  let xpResult: { gainedXp: number; totalXp: number; level: number } = { gainedXp:0, totalXp:0, level:currentLevel } as any;

  if (!xpTodayCount || xpTodayCount === 0) {
    xpResult = await addXp({
      songId: null,
      baseXp: 5000,
      speedMultiplier: 1,
      rankMultiplier: 1,
      transposeMultiplier: 1,
      membershipMultiplier,
    });
  } else {
    // XP 付与なし
    const { data: prof } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
    xpResult = { gainedXp:0, totalXp: prof?.xp || 0, level: prof?.level || currentLevel } as any;
  }

  return {
    success: true,
    xpGained: xpResult.gainedXp,
    totalXp: xpResult.totalXp,
    level: xpResult.level,
    levelUp: xpResult.level > currentLevel,
    missionsUpdated,
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

export async function updateDiary(diaryId: string, content: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');

  const { error } = await supabase
    .from('practice_diaries')
    .update({ content })
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
  const { error } = await supabase
    .from('practice_diaries')
    .delete()
    .eq('id', diaryId)
    .eq('user_id', user.id);
  if (error) throw new Error(`日記の削除に失敗しました: ${error.message}`);
}