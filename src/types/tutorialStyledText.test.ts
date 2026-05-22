import {
  interpolateRemainingOnSegments,
  resolveTutorialStyledSegments,
  segmentsToPlainString,
  TUTORIAL_DIALOG_BODY_COLOR,
  TUTORIAL_HIGHLIGHT_RED,
} from '@/types/tutorialStyledText';

const resolveJapaneseStyled = (): readonly ReturnType<
  typeof resolveTutorialStyledSegments
> =>
  resolveTutorialStyledSegments(
    {
      ja: 'full',
      en: 'full',
      styled: {
        ja: [{ text: 'A' }, { text: 'B', color: '#00ff00' }],
        en: [{ text: 'X' }],
      },
    },
    false,
  );

describe('resolveTutorialStyledSegments', () => {
  it('uses plain ja/en as single white segment when styled missing', () => {
    expect(
      resolveTutorialStyledSegments(
        {
          ja: 'こんにちは\nテスト',
          en: 'Hello\nTest',
        },
        false,
      ),
    ).toEqual([{ text: 'こんにちは\nテスト', color: TUTORIAL_DIALOG_BODY_COLOR }]);
    expect(
      resolveTutorialStyledSegments(
        {
          ja: 'こんにちは',
          en: 'Hello',
        },
        true,
      ),
    ).toEqual([{ text: 'Hello', color: TUTORIAL_DIALOG_BODY_COLOR }]);
  });

  it('uses styled list with default red when color omitted', () => {
    expect(resolveJapaneseStyled()).toEqual([
      { text: 'A', color: TUTORIAL_HIGHLIGHT_RED },
      { text: 'B', color: '#00ff00' },
    ]);
    expect(
      resolveTutorialStyledSegments(
        {
          ja: 'x',
          en: 'X only',
          styled: {
            en: [{ text: 'X only' }],
          },
        },
        true,
      ),
    ).toEqual([{ text: 'X only', color: TUTORIAL_HIGHLIGHT_RED }]);
  });

  it('drops empty segment entries', () => {
    expect(
      resolveTutorialStyledSegments(
        {
          ja: '-',
          en: '-',
          styled: {
            ja: [{ text: '' }, { text: 'のみ' }],
          },
        },
        false,
      ),
    ).toEqual([{ text: 'のみ', color: TUTORIAL_HIGHLIGHT_RED }]);
  });

  it('falls back to plain when styled list empties after filter', () => {
    expect(
      resolveTutorialStyledSegments(
        {
          ja: 'PLAIN',
          en: 'PLAIN',
          styled: { ja: [{ text: '' }] },
        },
        false,
      ),
    ).toEqual([{ text: 'PLAIN', color: TUTORIAL_DIALOG_BODY_COLOR }]);
  });

  it('returns empty array for blank plain', () => {
    expect(
      resolveTutorialStyledSegments({ ja: '   ', en: '   ' }, false),
    ).toEqual([]);
  });
});

describe('interpolateRemainingOnSegments', () => {
  it('replaces placeholder in segment text', () => {
    expect(
      interpolateRemainingOnSegments(
        [
          { text: 'あと{{remaining}}問', color: TUTORIAL_DIALOG_BODY_COLOR },
          { text: '!', color: TUTORIAL_HIGHLIGHT_RED },
        ],
        3,
      ),
    ).toEqual([
      { text: 'あと3問', color: TUTORIAL_DIALOG_BODY_COLOR },
      { text: '!', color: TUTORIAL_HIGHLIGHT_RED },
    ]);
  });
});

describe('segmentsToPlainString', () => {
  it('concatenates text', () => {
    expect(
      segmentsToPlainString([
        { text: 'a', color: '#fff' },
        { text: 'b', color: '#f00' },
      ]),
    ).toBe('ab');
  });
});
