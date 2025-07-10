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
  nickname?: string;
  avatar_url?: string;
}

export async function fetchDiaries(limit = 20): Promise<Diary[]> {
  const { data, error } = await getSupabaseClient()
    .from('practice_diaries')
    .select('*, profiles:nickname, profiles:avatar_url', { count: 'exact' })
    .order('practice_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as any;
}

export async function fetchUserDiaries(userId: string): Promise<{
  diaries: Array<{
    id: string;
    content: string;
    practice_date: string;
    created_at: string;
    likes: number;
  }>;
  profile: {
    nickname: string;
    avatar_url?: string;
    level: number;
    rank: string;
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

  // 各日記のいいね数を取得
  const diariesWithLikes = await Promise.all(
    (diariesData || []).map(async (diary) => {
      const { count } = await supabase
        .from('diary_likes')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', diary.id);
      
      return {
        ...diary,
        likes: count || 0,
      };
    })
  );

  // ユーザープロフィールを取得
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('nickname, avatar_url, level, rank')
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
  const today = new Date().toISOString().substring(0, 10);
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

  // XP加算
  const xpResult = await addXp({
    songId: null,
    baseXp: 5000,
    speedMultiplier: 1,
    rankMultiplier: 1,
    transposeMultiplier: 1,
    membershipMultiplier,
  });

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
  await supabase.from('diary_likes').insert({ user_id: user.id, diary_id: diaryId }).throwOnError();
} 