import type { SurvivalMapCategory } from '@/platform/supabaseSurvival';
import type { SurvivalStageIntroScript } from './survivalStageIntroScriptTypes';

/** 開発者テスト: basic 9901（DB 未適用時のフォールバック）。 */
const DEV_DUAL_DIALOGUE: SurvivalStageIntroScript = {
  lineDurationSeconds: 4,
  lines: [
    {
      atSeconds: 2,
      speaker: 'fai',
      text: {
        ja: 'やあ、ファイだよ。2人でしゃべるテストだね。',
        en: "Hey, it's Fai. This is a two-character dialogue test.",
      },
    },
    {
      atSeconds: 6,
      speaker: 'jajii',
      text: {
        ja: 'わしはジャ爺じゃ。吹き出しは細めで頭の上じゃ。',
        en: "I'm Old Man Jajii. My bubble is narrower, above my head.",
      },
    },
    {
      atSeconds: 10,
      speaker: 'fai',
      text: {
        ja: 'ジャ爺が歩き回ると、吹き出しもついてくるよ。',
        en: "When Jajii drifts around, the bubble follows him.",
      },
    },
    {
      atSeconds: 14,
      speaker: 'jajii',
      text: {
        ja: 'ほほう、バッチリじゃな。では戦いも続けるかのう。',
        en: 'Ho ho, looks good. Shall we keep fighting, then?',
      },
    },
  ],
};

export const buildBundledSurvivalStagePlayDialogue = (
  mapCategory: SurvivalMapCategory,
  stageNumber: number,
): SurvivalStageIntroScript | null => {
  if (mapCategory === 'basic' && stageNumber === 9901) {
    return DEV_DUAL_DIALOGUE;
  }
  return null;
};
