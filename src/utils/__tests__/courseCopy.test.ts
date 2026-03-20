import { describe, expect, it } from 'vitest';
import { courseDisplayDescription, courseDisplayTitle } from '@/utils/courseCopy';

describe('courseDisplayTitle', () => {
  it('英語モードで title_en があるときは title_en を返す', () => {
    expect(
      courseDisplayTitle({ title: '日本語', title_en: 'English' }, true),
    ).toBe('English');
  });

  it('英語モードでも title_en が空なら title にフォールバックする', () => {
    expect(courseDisplayTitle({ title: '日本語', title_en: null }, true)).toBe('日本語');
    expect(courseDisplayTitle({ title: '日本語' }, true)).toBe('日本語');
  });

  it('日本語モードでは常に title を返す', () => {
    expect(
      courseDisplayTitle({ title: '日本語', title_en: 'English' }, false),
    ).toBe('日本語');
  });
});

describe('courseDisplayDescription', () => {
  it('英語モードで description_en があるときはそれを返す', () => {
    expect(
      courseDisplayDescription(
        { title: 't', description: 'あ', description_en: 'A' },
        true,
      ),
    ).toBe('A');
  });

  it('英語モードで description_en が無いときは description にフォールバックする', () => {
    expect(
      courseDisplayDescription({ title: 't', description: 'あ' }, true),
    ).toBe('あ');
  });

  it('日本語モードでは description を返す', () => {
    expect(
      courseDisplayDescription(
        { title: 't', description: 'あ', description_en: 'A' },
        false,
      ),
    ).toBe('あ');
  });

  it('説明が無いときは undefined', () => {
    expect(courseDisplayDescription({ title: 't' }, true)).toBeUndefined();
    expect(courseDisplayDescription({ title: 't' }, false)).toBeUndefined();
  });
});
