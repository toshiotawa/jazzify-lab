import type {
  SurvivalStageIntroMapCategory,
  SurvivalStageIntroScript,
} from './survivalStageIntroScriptTypes';
import { SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';

const LINE_DURATION = SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS;

/** 第一ブロック末尾ボス。各 map_category で同一文言（ユーザー指定・共通）。 */
export function buildBundledSurvivalBlockBossIntroScript(
  _category: SurvivalStageIntroMapCategory,
): SurvivalStageIntroScript {
  return {
    lineDurationSeconds: LINE_DURATION,
    lines: [
      { atSeconds: 2, text: { ja: 'ボス戦だよ！', en: "It's boss time!" } },
      {
        atSeconds: 6,
        text: {
          ja: 'ボスの予備動作をきちんと見て、避けながら弾こう！',
          en: 'Watch the boss telegraphs closely — dodge and keep playing your chords!',
        },
      },
      {
        atSeconds: 10,
        text: {
          ja: '難しかったら前のステージに戻って復習しよう。',
          en: "If it's rough, jump back earlier and rehearse.",
        },
      },
      {
        atSeconds: 14,
        text: {
          ja: 'MIDIキーボードでのプレイがおすすめ',
          en: 'We recommend playing with a MIDI keyboard.',
        },
      },
    ],
  };
}
