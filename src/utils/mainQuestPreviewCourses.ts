import type { Course } from '@/types';
import { sortCoursesByDifficultyThenOrder } from '@/utils/courseDifficulty';

/** uuid_generate_v5(ns, 'course-chord-run-beginner') */
export const CHORD_RUN_BEGINNER_COURSE_ID = '5fff9e19-f04a-595f-b666-b9dcf4aa765c';

const MAIN_QUEST_PREVIEW_LIMIT = 3;

/** メインクエスト（#lessons）の目的別コースプレビュー用。Chord Run 初級を先頭に固定する。 */
export function pickMainQuestPreviewCourses(courses: Course[]): Course[] {
  const sorted = sortCoursesByDifficultyThenOrder(courses);
  const chordRun = sorted.find(c => c.id === CHORD_RUN_BEGINNER_COURSE_ID);
  if (!chordRun) {
    return sorted.slice(0, MAIN_QUEST_PREVIEW_LIMIT);
  }
  const rest = sorted.filter(c => c.id !== CHORD_RUN_BEGINNER_COURSE_ID);
  return [chordRun, ...rest].slice(0, MAIN_QUEST_PREVIEW_LIMIT);
}
