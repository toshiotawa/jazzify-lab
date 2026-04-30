import { describe, expect, it } from 'vitest';
import {
  earTrainingStageDisplayDescription,
  earTrainingStageDisplayTitle,
  fantasyStageDisplayDescription,
  fantasyStageDisplayName,
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

  it('英語で title_en が無いときは日本語 title にフォールバックしない', () => {
    expect(lessonSongDisplayTitle({ title: '日本語のみ' }, true)).toBe('');
  });

  it('title が null のときは空文字', () => {
    expect(lessonSongDisplayTitle({ title: null }, false)).toBe('');
  });

  it('英語で title_en が空白のみのときは空文字', () => {
    expect(lessonSongDisplayTitle({ title: 'JA', title_en: '   ' }, true)).toBe('');
  });
});

const baseFantasy = {
  name: '日本語名',
  name_en: 'English name',
  description: '日本語説明',
  description_en: 'English description',
};

describe('fantasyStageDisplayName', () => {
  it('英語 UI では name_en を返す', () => {
    expect(fantasyStageDisplayName(baseFantasy, true)).toBe('English name');
  });

  it('英語 UI で name_en が無いときは空', () => {
    expect(fantasyStageDisplayName({ ...baseFantasy, name_en: null }, true)).toBe('');
  });

  it('日本語 UI では name を返す', () => {
    expect(fantasyStageDisplayName({ ...baseFantasy, name_en: null }, false)).toBe('日本語名');
  });
});

describe('fantasyStageDisplayDescription', () => {
  it('英語 UI では description_en を返す', () => {
    expect(fantasyStageDisplayDescription(baseFantasy, true)).toBe('English description');
  });

  it('英語 UI で description_en が無いときは空', () => {
    expect(fantasyStageDisplayDescription({ ...baseFantasy, description_en: null }, true)).toBe('');
  });

  it('日本語 UI では description を返す', () => {
    expect(fantasyStageDisplayDescription({ ...baseFantasy, description_en: null }, false)).toBe('日本語説明');
  });
});

const baseEarTraining = {
  title: '耳コピタイトル',
  title_en: 'Ear title',
  description: '耳コピ説明',
  description_en: 'Ear body',
};

describe('earTrainingStageDisplayTitle', () => {
  it('英語 UI では title_en を返す', () => {
    expect(earTrainingStageDisplayTitle(baseEarTraining, true)).toBe('Ear title');
  });

  it('英語 UI で title_en が無いときは空', () => {
    expect(earTrainingStageDisplayTitle({ ...baseEarTraining, title_en: null }, true)).toBe('');
  });
});

describe('earTrainingStageDisplayDescription', () => {
  it('英語 UI では description_en を返す', () => {
    expect(earTrainingStageDisplayDescription(baseEarTraining, true)).toBe('Ear body');
  });

  it('英語 UI で description_en が無いときは空', () => {
    expect(earTrainingStageDisplayDescription({ ...baseEarTraining, description_en: null }, true)).toBe('');
  });

  it('日本語 UI では description を返す', () => {
    expect(earTrainingStageDisplayDescription({ ...baseEarTraining, description_en: null }, false)).toBe(
      '耳コピ説明',
    );
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

  it('英語でチュートリアルブロックは block_name_en が無くても Tutorial とする', () => {
    expect(
      lessonDisplayBlockName(
        {
          title: 'x',
          description: 'y',
          block_number: 1,
          block_name: 'チュートリアル',
        },
        true,
      ),
    ).toBe('Tutorial');
  });

  it('日本語 UI ではチュートリアルブロック名をそのまま表示する', () => {
    expect(
      lessonDisplayBlockName(
        {
          title: 'x',
          description: 'y',
          block_number: 1,
          block_name: 'チュートリアル',
        },
        false,
      ),
    ).toBe('チュートリアル');
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
