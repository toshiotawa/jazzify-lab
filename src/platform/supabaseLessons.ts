import { getSupabaseClient } from '@/platform/supabaseClient';
import { MembershipRank } from '@/platform/supabaseSongs';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  min_rank: MembershipRank;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

/* Courses */
export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await getSupabaseClient()
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Course[];
}

export async function createCourse(course: Omit<Course, 'id'>): Promise<void> {
  const { error } = await getSupabaseClient().from('courses').insert(course);
  if (error) throw error;
}

/* Lessons */
export async function fetchLessons(courseId: string): Promise<Lesson[]> {
  const { data, error } = await getSupabaseClient()
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data as Lesson[];
}

export async function createLesson(lesson: Omit<Lesson, 'id'>): Promise<void> {
  const { error } = await getSupabaseClient().from('lessons').insert(lesson);
  if (error) throw error;
} 