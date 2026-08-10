import { getAppRouteSearchParams } from '@/utils/appPaths';
import { isLessonBlockPlayable } from '@/utils/softLanding';

/** レッスン文脈付きの Fantasy ルートか（素の #fantasy は false） */
export const hasFantasyLessonContext = (
  location: Pick<Location, 'search' | 'hash'>,
): boolean => {
  const params = getAppRouteSearchParams(location);
  return Boolean(params.get('lessonId') && params.get('lessonSongId'));
};

/** 非プレミアムユーザーが通過可能な Fantasy ルートか */
export const isFantasyRouteAllowedForLimitedUser = (
  location: Pick<Location, 'search' | 'hash'>,
): boolean => hasFantasyLessonContext(location);

/** レッスン課題のブロック可否を検証（ルーティング通過後の最終ゲート） */
export async function verifyLessonPlayAccessForFreeUser(lessonId: string): Promise<boolean> {
  const { fetchLessonByIdForDetail } = await import('@/platform/supabaseLessons');
  const { fetchCourseById } = await import('@/platform/supabaseCourses');
  const lesson = await fetchLessonByIdForDetail(lessonId);
  if (!lesson?.course_id) {
    return false;
  }
  const course = await fetchCourseById(lesson.course_id);
  if (!course) {
    return false;
  }
  return isLessonBlockPlayable(course, lesson.block_number ?? 1, false);
}
