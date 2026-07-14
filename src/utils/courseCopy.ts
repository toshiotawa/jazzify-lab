import type { Course } from '@/types';
import { hasNonEmptyEnglishField } from '@/utils/localeField';

type CourseLocalizedFields = Pick<Course, 'title'> & {
  title_en?: string | null;
  description?: string;
  description_en?: string | null;
};

const hasEnglishCourseTitle = (course: Pick<Course, 'title_en'>): boolean =>
  hasNonEmptyEnglishField(course.title_en);

export const courseDisplayTitle = (course: CourseLocalizedFields, isEnglish: boolean): string => {
  if (isEnglish) {
    return course.title_en?.trim() ?? '';
  }
  return course.title;
};

export const courseDisplayDescription = (
  course: CourseLocalizedFields,
  isEnglish: boolean,
): string | undefined => {
  if (isEnglish) {
    return course.description_en?.trim() || undefined;
  }
  return course.description;
};

export const filterCoursesForEnglishUi = <T extends Pick<Course, 'title_en'>>(courses: T[]): T[] =>
  courses.filter((course) => hasEnglishCourseTitle(course));
