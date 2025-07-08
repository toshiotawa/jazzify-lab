import { supabase } from './supabase'
import { Diary } from '@/types/diary'

export const fetchDiaries = async (userId?: string): Promise<Diary[]> => {
  const { data, error } = await supabase
    .from('diaries')
    .select('id, user_id, content, created_at, diary_likes(count), profiles(display_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    likes: row.diary_likes[0]?.count ?? 0,
    likedByUser: row.diary_likes.some((l: any) => l.user_id === userId),
    displayName: row.profiles?.display_name ?? null,
  }))
}

export const createDiary = async (content: string): Promise<void> => {
  const { error } = await supabase.from('diaries').insert({ content })
  if (error) throw error
}

export const toggleLike = async (diaryId: string, liked: boolean): Promise<void> => {
  if (liked) {
    const { error } = await supabase.from('diary_likes').delete().match({ diary_id: diaryId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('diary_likes').insert({ diary_id: diaryId })
    if (error) throw error
  }
}
