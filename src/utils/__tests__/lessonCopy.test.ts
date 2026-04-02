import { describe, expect, it } from 'vitest';
import {
  lessonDisplayBlockName,
  lessonDisplayDescription,
  lessonDisplayTitle,
  lessonSongDisplayTitle,
} from '@/utils/lessonCopy';

const baseLesson = {
  title: '日本語タイトル',
  description: '日本語説明',
  block_number: 2,
  block_name: '第1番',
};

describe('lessonDisplayTitle', () => {
  it('英語で title_en を優先する', () => {
    expect(
      lessonDisplayTitle({ ...baseLesson, title_en: 'EN Title' }, true),
    ).toBe('EN Title');
  });

  it('英語でも title_en が無ければ title', () => {
    expect(lessonDisplayTitle(baseLesson, true)).toBe('日本語タイトル');
  });
});

describe('lessonDisplayDescription', () => {
  it('英語で description_en を優先する', () => {
    expect(
      lessonDisplayDescription({ ...baseLesson, description_en: 'EN body' }, true),
    ).toBe('EN body');
  });
});

describe('lessonSongDisplayTitle', () => {
  it('英語で title_en を優先する', () => {
    expect(
      lessonSongDisplayTitle({ title: '日本語', title_en: 'English title' }, true),
    ).toBe('English title');
  });

  it('英語でも title_en が無ければ title', () => {
    expect(lessonSongDisplayTitle({ title: '日本語のみ' }, true)).toBe('日本語のみ');
  });

  it('title が null のときは空文字', () => {
    expect(lessonSongDisplayTitle({ title: null }, false)).toBe('');
  });
});

describe('lessonDisplayBlockName', () => {
  it('英語で block_name_en を優先する', () => {
    expect(
      lessonDisplayBlockName({ ...baseLesson, block_name_en: 'No. 1' }, true),
    ).toBe('No. 1');
  });

  it('英語で block_name_en が無ければ block_name', () => {
    expect(lessonDisplayBlockName(baseLesson, true)).toBe('第1番');
  });

  it('名前が無いときはブロック番号ラベル', () => {
    expect(
      lessonDisplayBlockName(
        { title: 't', description: 'd', block_number: 3, block_name: null },
        true,
      ),
    ).toBe('Block 3');
  });
});
