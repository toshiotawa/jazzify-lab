import type { EarTrainingStage, FantasyStage, Lesson } from '@/types';

/** DB 上のチュートリアルブロック既定名（block_name_en 未設定時の英語 UI 用） */
const TUTORIAL_LESSON_BLOCK_NAME_JA = 'チュートリアル';
const TUTORIAL_LESSON_BLOCK_NAME_EN = 'Tutorial';

type LessonLocalized = Pick<Lesson, 'title' | 'block_number' | 'block_name'> & {
  description?: string;
  title_en?: string | null;
  description_en?: string | null;
  block_name_en?: string | null;
};

type LessonSongTitleFields = {
  title: string | null | undefined;
  title_en?: string | null;
};

export const lessonSongDisplayTitle = (song: LessonSongTitleFields, isEnglish: boolean): string => {
  if (isEnglish) {
    const en = song.title_en?.trim();
    return en ?? '';
  }
  return song.title ?? '';
};

type FantasyStageLocaleFields = Pick<FantasyStage, 'name' | 'name_en' | 'description' | 'description_en'>;

/** 英語 UI では name_en のみ（未設定なら空＝日本語にフォールバックしない） */
export const fantasyStageDisplayName = (stage: FantasyStageLocaleFields, isEnglish: boolean): string => {
  if (isEnglish) {
    return stage.name_en?.trim() ?? '';
  }
  return stage.name;
};

/** 英語 UI では description_en のみ（未設定なら空） */
export const fantasyStageDisplayDescription = (
  stage: FantasyStageLocaleFields,
  isEnglish: boolean,
): string => {
  if (isEnglish) {
    return stage.description_en?.trim() ?? '';
  }
  return stage.description?.trim() ?? '';
};

type EarTrainingStageLocaleFields = Pick<EarTrainingStage, 'title' | 'title_en' | 'description' | 'description_en'>;

/** 英語 UI では title_en のみ（未設定なら空） */
export const earTrainingStageDisplayTitle = (stage: EarTrainingStageLocaleFields, isEnglish: boolean): string => {
  if (isEnglish) {
    return stage.title_en?.trim() ?? '';
  }
  return stage.title ?? '';
};

/**
 * 英語 UI: description_en のみ。無ければ空（呼び出し側で汎用フォールバック可）。
 * 日本語 UI: description のみ。
 */
export const earTrainingStageDisplayDescription = (
  stage: EarTrainingStageLocaleFields,
  isEnglish: boolean,
): string => {
  if (isEnglish) {
    return stage.description_en?.trim() ?? '';
  }
  return stage.description?.trim() ?? '';
};

const QUEST_TITLE_PREFIX_JA = /^クエスト\d+[：:]\s*/;
const QUEST_TITLE_PREFIX_EN = /^Quest\s+\d+[：:]\s*/i;

export const stripQuestTitlePrefix = (title: string, isEnglish: boolean): string => {
  const pattern = isEnglish ? QUEST_TITLE_PREFIX_EN : QUEST_TITLE_PREFIX_JA;
  return title.replace(pattern, '').trim();
};

export const lessonDisplayTitle = (lesson: LessonLocalized, isEnglish: boolean): string => {
  const raw = isEnglish && lesson.title_en ? lesson.title_en : lesson.title;
  return stripQuestTitlePrefix(raw, isEnglish);
};

export const lessonDisplayDescription = (lesson: LessonLocalized, isEnglish: boolean): string => {
  if (isEnglish && lesson.description_en) {
    return lesson.description_en;
  }
  return lesson.description ?? '';
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
