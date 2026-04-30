import type { Lesson } from '@/types';

/** DB 上のチュートリアルブロック既定名（block_name_en 未設定時の英語 UI 用） */
const TUTORIAL_LESSON_BLOCK_NAME_JA = 'チュートリアル';
const TUTORIAL_LESSON_BLOCK_NAME_EN = 'Tutorial';

type LessonLocalized = Pick<Lesson, 'title' | 'description' | 'block_number' | 'block_name'> & {
  title_en?: string | null;
  description_en?: string | null;
  block_name_en?: string | null;
};

type LessonSongTitleFields = {
  title: string | null | undefined;
  title_en?: string | null;
};

export const lessonSongDisplayTitle = (song: LessonSongTitleFields, isEnglish: boolean): string => {
  if (isEnglish && song.title_en) {
    return song.title_en;
  }
  return song.title ?? '';
};

export const lessonDisplayTitle = (lesson: LessonLocalized, isEnglish: boolean): string => {
  if (isEnglish && lesson.title_en) {
    return lesson.title_en;
  }
  return lesson.title;
};

export const lessonDisplayDescription = (lesson: LessonLocalized, isEnglish: boolean): string => {
  if (isEnglish && lesson.description_en) {
    return lesson.description_en;
  }
  return lesson.description;
};

export const lessonDisplayBlockName = (lesson: LessonLocalized, isEnglish: boolean): string => {
  const blockNumber = lesson.block_number ?? 1;
  if (isEnglish && lesson.block_name_en) {
    return lesson.block_name_en;
  }
  if (lesson.block_name) {
    if (isEnglish && lesson.block_name === TUTORIAL_LESSON_BLOCK_NAME_JA) {
      return TUTORIAL_LESSON_BLOCK_NAME_EN;
    }
    return lesson.block_name;
  }
  return isEnglish ? `Block ${blockNumber}` : `ブロック ${blockNumber}`;
};
