import type { Course } from '@/types';
import {
  CHORD_RUN_BEGINNER_COURSE_ID,
  pickMainQuestPreviewCourses,
} from '@/utils/mainQuestPreviewCourses';

const baseCourse = (overrides: Partial<Course> & Pick<Course, 'id' | 'title'>): Course => ({
  description: '',
  order_index: 0,
  premium_only: false,
  is_tutorial: false,
  audience: 'both',
  difficulty_tier: 'beginner',
  is_developer_only: false,
  is_main_course: false,
  is_visible: true,
  ...overrides,
});

describe('pickMainQuestPreviewCourses', () => {
  it('puts Chord Run beginner first even when order_index is higher', () => {
    const chordRun = baseCourse({
      id: CHORD_RUN_BEGINNER_COURSE_ID,
      title: 'Chord Run',
      order_index: 99,
    });
    const other = baseCourse({ id: 'other-a', title: 'Other A', order_index: 1 });
    const picked = pickMainQuestPreviewCourses([other, chordRun]);
    expect(picked[0]?.id).toBe(CHORD_RUN_BEGINNER_COURSE_ID);
    expect(picked).toHaveLength(2);
  });

  it('returns first three sorted courses when Chord Run is absent', () => {
    const courses = [
      baseCourse({ id: 'a', title: 'A', order_index: 3 }),
      baseCourse({ id: 'b', title: 'B', order_index: 1 }),
      baseCourse({ id: 'c', title: 'C', order_index: 2 }),
      baseCourse({ id: 'd', title: 'D', order_index: 4 }),
    ];
    const picked = pickMainQuestPreviewCourses(courses);
    expect(picked.map(c => c.id)).toEqual(['b', 'c', 'a']);
  });
});
