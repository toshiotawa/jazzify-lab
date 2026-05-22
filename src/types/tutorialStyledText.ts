/**
 * チュートリアル台本の部分色付け（JA / EN で別々のスタイル）。
 * DB JSON の後方互換: `styled` が無ければ単色ボディ全文。
 */

export const TUTORIAL_HIGHLIGHT_RED = '#ef4444';

export const TUTORIAL_DIALOG_BODY_COLOR = '#ffffff';

export interface TutorialTextSegmentInput {
  readonly text: string;
  /** `styled.*` が使われるとき、省略するとハイライト赤 */
  readonly color?: string;
}

export interface TutorialStyledLocalizedText {
  readonly ja: string;
  readonly en: string;
  readonly styled?: {
    readonly ja?: readonly TutorialTextSegmentInput[];
    readonly en?: readonly TutorialTextSegmentInput[];
  };
}

/** 描画側向けに色まで解決したセグメント */
export interface TutorialResolvedTextSegment {
  readonly text: string;
  readonly color: string;
}

const pickStyledList = (
  styled: TutorialStyledLocalizedText['styled'],
  isEnglishCopy: boolean,
): readonly TutorialTextSegmentInput[] | undefined => {
  if (styled === undefined) return undefined;
  return isEnglishCopy ? styled.en : styled.ja;
};

const nonEmptySegments = (
  list: readonly TutorialTextSegmentInput[],
): readonly TutorialTextSegmentInput[] => list.filter(s => s.text.length > 0);

/**
 * プレーン `ja` / `en` と任意の `styled` から、表示用セグメント列を返す。
 * - `styled` にロケール用配列があり 1 件以上ならそれを使用（各セグメントの `color` 省略時は `TUTORIAL_HIGHLIGHT_RED`）
 * - それ以外は全文を単一の `TUTORIAL_DIALOG_BODY_COLOR` セグメントにする
 */
export const resolveTutorialStyledSegments = (
  text: TutorialStyledLocalizedText,
  isEnglishCopy: boolean,
): readonly TutorialResolvedTextSegment[] => {
  const rawPlain = isEnglishCopy ? text.en : text.ja;
  const rawStyled = pickStyledList(text.styled, isEnglishCopy);
  const cleaned = rawStyled ? nonEmptySegments(rawStyled) : [];
  if (cleaned.length > 0) {
    return cleaned.map(s => ({
      text: s.text,
      color: s.color ?? TUTORIAL_HIGHLIGHT_RED,
    }));
  }
  if (!rawPlain.trim()) {
    return [];
  }
  return [{ text: rawPlain, color: TUTORIAL_DIALOG_BODY_COLOR }];
};

export const segmentsToPlainString = (
  segments: readonly TutorialResolvedTextSegment[],
): string => segments.map(s => s.text).join('');

export const interpolateRemainingOnSegments = (
  segments: readonly TutorialResolvedTextSegment[],
  remaining: number,
): readonly TutorialResolvedTextSegment[] =>
  segments.map(s => ({
    ...s,
    text: s.text.split('{{remaining}}').join(String(remaining)),
  }));
