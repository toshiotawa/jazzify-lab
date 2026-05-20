import type {
  SurvivalStageIntroLine,
  SurvivalStageIntroMapCategory,
  SurvivalStageIntroScript,
} from './survivalStageIntroScriptTypes';
import { SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';

const LINE_DURATION = SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS;

const OPENING: SurvivalStageIntroLine = {
  atSeconds: 2,
  text: { ja: 'また会ったね、ファイだよ。', en: "Hey again — it's Fai." },
};

const BLOCK_BOSS: SurvivalStageIntroLine = {
  atSeconds: 10,
  text: {
    ja: 'ブロックごとの最終ステージにボスがいるよ。',
    en: 'Each block ends with a boss stage.',
  },
};

const HINT_MODE: SurvivalStageIntroLine = {
  atSeconds: 14,
  text: {
    ja: 'HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。',
    en: 'Switch between HINT practice and performance mode. Clears are saved in performance mode only.',
  },
};

const STICK: SurvivalStageIntroLine = {
  atSeconds: 18,
  text: { ja: 'バーチャルスティックで移動しよう。', en: 'Move with the virtual stick.' },
};

const KEYBOARD_HINT: SurvivalStageIntroLine = {
  atSeconds: 22,
  text: {
    ja: '光っている鍵盤の色を演奏しよう。',
    en: 'Play the highlighted key colors on the keyboard.',
  },
};

const CORRECT_GREEN: SurvivalStageIntroLine = {
  atSeconds: 26,
  text: {
    ja: '正解したら緑色になるよ。（正解したら次の音へ）',
    en: 'Correct notes turn green. (Then you move to the next note.)',
  },
};

const COMBO_BUILD: SurvivalStageIntroLine = {
  atSeconds: 30,
  text: {
    ja: '5秒以内に正解し続けるとコンボゲージが溜まるよ。',
    en: 'Keep answering within 5 seconds to build the combo gauge.',
  },
};

const COMBO_MAX: SurvivalStageIntroLine = {
  atSeconds: 34,
  text: {
    ja: 'コンボゲージがMAXになるとゲージ技が発動するよ。',
    en: 'When the combo gauge maxes out, your gauge skill triggers.',
  },
};

const PHRASE_ATTACK: SurvivalStageIntroLine = {
  atSeconds: 26,
  text: {
    ja: '小節が弾けると強い攻撃が発動するよ。',
    en: 'Clear a measure to unleash a strong attack.',
  },
};

const CLEAR_90: SurvivalStageIntroLine = {
  atSeconds: 38,
  text: { ja: '90秒間生き残ったらクリアだ。', en: 'Survive for 90 seconds to clear.' },
};

const CLEAR_90_PHR: SurvivalStageIntroLine = {
  atSeconds: 30,
  text: { ja: '90秒間生き残ったらクリアだ。', en: 'Survive for 90 seconds to clear.' },
};

const CLOSING: SurvivalStageIntroLine = {
  atSeconds: 42,
  text: { ja: '全ステージ制覇目指して頑張ろう。', en: "Let's aim to conquer every stage!" },
};

const CLOSING_PHR: SurvivalStageIntroLine = {
  atSeconds: 34,
  text: { ja: '全ステージ制覇目指して頑張ろう。', en: "Let's aim to conquer every stage!" },
};

const basicCourse: SurvivalStageIntroLine = {
  atSeconds: 6,
  text: {
    ja: 'ここは Basic コース。コードの種類ごとに基礎を鍛える場所だよ。',
    en: 'This is the Basic course — train fundamentals chord by chord.',
  },
};

const songsCourse: SurvivalStageIntroLine = {
  atSeconds: 6,
  text: {
    ja: 'ここは Songs コース。ジャズスタンダードのコード進行を演奏する場所だよ。',
    en: 'This is the Songs course — play jazz standard progressions.',
  },
};

const phrasesCourse: SurvivalStageIntroLine = {
  atSeconds: 6,
  text: {
    ja: 'ここは Phrases コース。小節ごとにコードを演奏するフレーズモードだよ。',
    en: 'This is the Phrases course — chord-by-measure phrase battles.',
  },
};

export const buildBundledSurvivalStageIntroScript = (
  mapCategory: SurvivalStageIntroMapCategory,
): SurvivalStageIntroScript => {
  if (mapCategory === 'phrases') {
    return {
      lineDurationSeconds: LINE_DURATION,
      lines: [
        OPENING,
        phrasesCourse,
        BLOCK_BOSS,
        HINT_MODE,
        STICK,
        KEYBOARD_HINT,
        PHRASE_ATTACK,
        CLEAR_90_PHR,
        CLOSING_PHR,
      ],
    };
  }
  const course = mapCategory === 'basic' ? basicCourse : songsCourse;
  return {
    lineDurationSeconds: LINE_DURATION,
    lines: [
      OPENING,
      course,
      BLOCK_BOSS,
      HINT_MODE,
      STICK,
      KEYBOARD_HINT,
      CORRECT_GREEN,
      COMBO_BUILD,
      COMBO_MAX,
      CLEAR_90,
      CLOSING,
    ],
  };
};
