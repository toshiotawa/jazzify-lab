import type { LessonMediaLocaleScope } from '@/types';

export type FetchLessonMediaAudience = 'all' | 'user';

export interface FetchLessonMediaOptions {
  /** 管理画面などは all（言語フィルタなし） */
  audience?: FetchLessonMediaAudience;
  /** audience が user のとき、英語 UI なら en_only + both */
  useEnglishUi?: boolean;
}

/** PostgREST `.or()` 用: 日本語 UI 向け */
export const lessonMediaLocaleOrFilterJaUi = 'locale_scope.eq.both,locale_scope.eq.ja_only';

/** PostgREST `.or()` 用: 英語 UI 向け */
export const lessonMediaLocaleOrFilterEnUi = 'locale_scope.eq.both,locale_scope.eq.en_only';

export function getLessonMediaLocaleOrFilter(useEnglishUi: boolean): string {
  return useEnglishUi ? lessonMediaLocaleOrFilterEnUi : lessonMediaLocaleOrFilterJaUi;
}

export function filterLessonMediaByLocale<T extends { locale_scope?: LessonMediaLocaleScope }>(
  items: T[],
  useEnglishUi: boolean
): T[] {
  return items.filter(item => {
    const scope = item.locale_scope ?? 'both';
    if (scope === 'both') {
      return true;
    }
    if (scope === 'ja_only') {
      return !useEnglishUi;
    }
    return useEnglishUi;
  });
}
