import {
  filterLessonMediaByLocale,
  getLessonMediaLocaleOrFilter,
  lessonMediaLocaleOrFilterEnUi,
  lessonMediaLocaleOrFilterJaUi,
} from '@/utils/lessonMediaLocale';

describe('lessonMediaLocale', () => {
  describe('getLessonMediaLocaleOrFilter', () => {
    it('returns ja filter when not English UI', () => {
      expect(getLessonMediaLocaleOrFilter(false)).toBe(lessonMediaLocaleOrFilterJaUi);
    });

    it('returns en filter when English UI', () => {
      expect(getLessonMediaLocaleOrFilter(true)).toBe(lessonMediaLocaleOrFilterEnUi);
    });
  });

  describe('filterLessonMediaByLocale', () => {
    const items = [
      { id: '1', locale_scope: 'both' as const },
      { id: '2', locale_scope: 'ja_only' as const },
      { id: '3', locale_scope: 'en_only' as const },
      { id: '4' },
    ];

    it('Japanese UI: both, ja_only, and missing scope', () => {
      expect(filterLessonMediaByLocale(items, false).map(x => x.id)).toEqual(['1', '2', '4']);
    });

    it('English UI: both, en_only, and missing scope', () => {
      expect(filterLessonMediaByLocale(items, true).map(x => x.id)).toEqual(['1', '3', '4']);
    });
  });
});
