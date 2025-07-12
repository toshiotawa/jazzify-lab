import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { MembershipRank, Song } from '@/platform/supabaseSongs';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  min_rank: MembershipRank;
}

export interface LessonSong {
  id: string;
  lesson_id: string;
  song_id: string;
  order_index: number;
  songs: Song; // join した song の情報
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  lesson_songs: LessonSong[];
}

/* Courses */
export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await fetchWithCache('courses:all', async () =>
    await getSupabaseClient().from('courses').select('*').order('created_at', { ascending: false }),
    1000 * 60,
  );
  if (error) throw error;
  clearSupabaseCache();
  return data as Course[];
}

export async function createCourse(course: Omit<Course, 'id'>): Promise<void> {
  const { error } = await getSupabaseClient().from('courses').insert(course);
  if (error) throw error;
  clearSupabaseCache();
}

/* Lessons */
export async function fetchLessons(courseId: string): Promise<Lesson[]> {
  const key = `lessons:${courseId}`;
  const { data, error } = await fetchWithCache(key, async () =>
    await getSupabaseClient()
      .from('lessons')
      .select('*, lesson_songs(*, songs(*))')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    1000 * 60,
  );
  if (error) throw error;
  const lessons = (data || []).map(lesson => ({
    ...lesson,
    lesson_songs: (lesson.lesson_songs || []).filter((ls: any) => ls.songs !== null),
  }));
  return lessons as Lesson[];
}

export async function createLesson(lesson: Omit<Lesson, 'id' | 'lesson_songs'>): Promise<void> {
  const { error } = await getSupabaseClient().from('lessons').insert(lesson);
  if (error) throw error;
  clearSupabaseCache();
}

/* Lesson Songs */
export async function addSongToLesson(lessonId: string, songId: string, orderIndex: number): Promise<void> {
    const { error } = await getSupabaseClient()
        .from('lesson_songs')
        .insert({ lesson_id: lessonId, song_id: songId, order_index: orderIndex });
    if (error) throw error;
    clearSupabaseCache();
}

export async function removeSongFromLesson(lessonSongId: string, lessonId: string): Promise<void> {
    const { error } = await getSupabaseClient().from('lesson_songs').delete().eq('id', lessonSongId);
    if (error) throw error;
    clearSupabaseCache();
}

export async function updateLessonSongOrder(updates: { id: string; order_index: number }[], lessonId: string): Promise<void> {
    const { error } = await getSupabaseClient().from('lesson_songs').upsert(updates);
    if (error) throw error;
    clearSupabaseCache();
} 