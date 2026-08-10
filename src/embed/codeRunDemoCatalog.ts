import type {
  StageDefinition,
  SurvivalChordProgressionEntry,
  SurvivalRunDialogueScript,
} from '@/components/survival/SurvivalStageDefinitions';
import type { SurvivalMapCategory } from '@/components/survival/SurvivalTypes';
import { buildAllowedChordsForSuffix } from '@/utils/survivalQuestionTypes';

/** ランダム出題か進行固定かを判別可能ユニオンで明示する */
export type CodeRunDemoChordSource =
  | { readonly kind: 'random'; readonly allowedChords: readonly string[] }
  | { readonly kind: 'progression'; readonly progression?: readonly SurvivalChordProgressionEntry[] };

export interface CodeRunDemoConfig {
  readonly id: string;
  readonly mapCategory: SurvivalMapCategory;
  readonly stageNumber: number;
  readonly chordSource: CodeRunDemoChordSource;
  readonly hintMode: boolean;
  readonly timeLimitSec: number;
  readonly lpLocale: 'ja' | 'en';
  readonly utmCampaign: string;
  readonly runDialogueScript?: SurvivalRunDialogueScript;
}

const CFG_MAJOR_SINGLE_NOTES = buildAllowedChordsForSuffix(['C', 'D', 'E', 'F', 'G'], '_note');

const DEMO_II_V_I_PROGRESSION: readonly SurvivalChordProgressionEntry[] = [
  {
    name: 'Dm7(9)',
    voicing: [53, 57, 60, 64],
    voicingNames: ['F3', 'A3', 'C4', 'E4'],
    keyFifths: 0,
  },
  {
    name: 'G7(9.13)',
    voicing: [53, 57, 59, 64],
    voicingNames: ['F3', 'A3', 'B3', 'E4'],
    keyFifths: 0,
  },
  {
    name: 'CM7(9)',
    voicing: [52, 55, 59, 62],
    voicingNames: ['E3', 'G3', 'B3', 'D4'],
    keyFifths: 0,
  },
];

const buildSingleNoteDialogueScript = (): SurvivalRunDialogueScript => ({
  lines: [
    {
      atSeconds: 1,
      speaker: 'fai',
      text: '矢印キーかスティックで移動。音を弾くとジャンプ！空中でもう一度弾くと2段ジャンプもできるよ。',
      textEn: 'Move with arrow keys or the stick. Play a note to jump — play again in mid-air for a double jump!',
      durationSeconds: 5,
    },
    {
      atSeconds: 12,
      speaker: 'fai',
      text: '鍵盤のハイライトを頼りに、ゴールまで走ろう。',
      textEn: 'Follow the keyboard highlights and reach the goal.',
      durationSeconds: 4,
    },
    {
      atSeconds: 45,
      speaker: 'fai',
      text: '続きは Jazzify で学べるよ。',
      textEn: 'Keep learning with Jazzify.',
      durationSeconds: 4,
    },
  ],
});

const buildChordDialogueScript = (): SurvivalRunDialogueScript => ({
  lines: [
    {
      atSeconds: 1,
      speaker: 'fai',
      text: '矢印キーかスティックで移動。コードを弾くとジャンプ！空中でもう一度弾くと2段ジャンプもできるよ。',
      textEn: 'Move with arrow keys or the stick. Play the chord to jump — play again in mid-air for a double jump!',
      durationSeconds: 5,
    },
    {
      atSeconds: 12,
      speaker: 'fai',
      text: '鍵盤のハイライトを頼りに、ゴールまで走ろう。',
      textEn: 'Follow the keyboard highlights and reach the goal.',
      durationSeconds: 4,
    },
    {
      atSeconds: 45,
      speaker: 'fai',
      text: '続きは Jazzify で学べるよ。',
      textEn: 'Keep learning with Jazzify.',
      durationSeconds: 4,
    },
  ],
});

export const CODE_RUN_DEMOS: Readonly<Record<string, CodeRunDemoConfig>> = {
  demo_1: {
    id: 'demo_1',
    mapCategory: 'basic',
    stageNumber: 122,
    chordSource: { kind: 'random', allowedChords: CFG_MAJOR_SINGLE_NOTES },
    hintMode: true,
    timeLimitSec: 120,
    lpLocale: 'ja',
    utmCampaign: 'code_run_demo_single_notes_ja',
    runDialogueScript: buildSingleNoteDialogueScript(),
  },
  demo_2: {
    id: 'demo_2',
    mapCategory: 'basic',
    stageNumber: 122,
    chordSource: { kind: 'random', allowedChords: CFG_MAJOR_SINGLE_NOTES },
    hintMode: true,
    timeLimitSec: 120,
    lpLocale: 'en',
    utmCampaign: 'code_run_demo_single_notes_en',
    runDialogueScript: buildSingleNoteDialogueScript(),
  },
  demo_3: {
    id: 'demo_3',
    mapCategory: 'basic',
    stageNumber: 122,
    chordSource: { kind: 'progression', progression: DEMO_II_V_I_PROGRESSION },
    hintMode: true,
    timeLimitSec: 120,
    lpLocale: 'ja',
    utmCampaign: 'code_run_demo_ii_v_i_ja',
    runDialogueScript: buildChordDialogueScript(),
  },
  demo_4: {
    id: 'demo_4',
    mapCategory: 'basic',
    stageNumber: 122,
    chordSource: { kind: 'progression', progression: DEMO_II_V_I_PROGRESSION },
    hintMode: true,
    timeLimitSec: 120,
    lpLocale: 'en',
    utmCampaign: 'code_run_demo_ii_v_i_en',
    runDialogueScript: buildChordDialogueScript(),
  },
};

export const resolveCodeRunDemo = (id: string | null): CodeRunDemoConfig | null => {
  if (!id) return null;
  const trimmed = id.trim();
  return CODE_RUN_DEMOS[trimmed] ?? null;
};

export const buildCodeRunDemoLpUrl = (
  config: CodeRunDemoConfig,
  options?: { readonly from?: string | null },
): string => {
  const host = config.lpLocale === 'en' ? 'https://en.jazzify.jp/' : 'https://jazzify.jp/';
  const params = new URLSearchParams({
    utm_source: 'embed_demo',
    utm_medium: 'iframe',
    utm_campaign: config.utmCampaign,
  });
  const from = options?.from?.trim();
  if (from) {
    params.set('utm_content', from);
  }
  return `${host}?${params.toString()}`;
};

export const applyDemoChordSourceToStage = (
  stage: StageDefinition,
  chordSource: CodeRunDemoChordSource,
): StageDefinition => {
  if (chordSource.kind === 'random') {
    return {
      ...stage,
      stageType: 'random',
      allowedChords: [...chordSource.allowedChords],
      chordProgression: undefined,
    };
  }
  return {
    ...stage,
    stageType: 'progression',
    allowedChords: [],
    ...(chordSource.progression !== undefined
      ? { chordProgression: [...chordSource.progression] }
      : {}),
  };
};

export const applyDemoConfigToStage = (
  stage: StageDefinition,
  config: CodeRunDemoConfig,
): StageDefinition => {
  const withChords = applyDemoChordSourceToStage(stage, config.chordSource);
  return {
    ...withChords,
    ...(config.runDialogueScript ? { runDialogueScript: config.runDialogueScript } : {}),
  };
};
