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

export async function createDiary(content: string) {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().substring(0, 10);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not logged in');

  const { error } = await supabase.from('practice_diaries').insert({
    user_id: user.id,
    content,
    practice_date: today,
  });
  if (error) throw error;

  // ミッション進捗
  const missions = await fetchActiveMonthlyMissions();
  for (const m of missions) {
    if (m.diary_count) await incrementDiaryProgress(m.id);
  }

  await addXp({
    songId: null,
    baseXp: 5000,
    speedMultiplier: 1,
    rankMultiplier: 1,
    transposeMultiplier: 1,
    membershipMultiplier: 1,
  });
}

export async function likeDiary(diaryId: string) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('diary_likes').insert({ user_id: user.id, diary_id: diaryId }).throwOnError();
} 