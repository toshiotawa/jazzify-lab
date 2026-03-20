import type { Course } from '@/types';

type CourseLocalizedFields = Pick<Course, 'title'> & {
  title_en?: string | null;
  description?: string;
  description_en?: string | null;
};

export const courseDisplayTitle = (course: CourseLocalizedFields, isEnglish: boolean): string => {
  if (isEnglish && course.title_en) {
    return course.title_en;
  }
  return course.title;
};

export const courseDisplayDescription = (
  course: CourseLocalizedFields,
  isEnglish: boolean,
): string | undefined => {
  if (isEnglish && course.description_en) {
    return course.description_en;
  }
  return course.description;
};
