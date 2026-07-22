import type {
  SurvivalTutorialScriptPayloadV3,
  SurvivalTutorialV3DemoChordEvent,
} from './survivalTutorialV3ScriptTypes';
import {
  DROP2_IIVI_ABA_DEMO_BGM_URL_EN,
  DROP2_IIVI_ABA_DEMO_BGM_URL_JA,
} from './buildDrop2IIVIABADemoScript';

/**
 * Block2 Quest1 (Key of C & F) — B-A-B フォームの Drop2 II-V-I デモ。
 * ABA デモと同じ BGM 尺に合わせ、BAB 形（最低音が 3rd / 7th / 7th）を見せる。
 */
const VOICING = {
  dm7Bab: {
    name: 'Dm7',
    voicing: [53, 60, 64, 69] as const,
    voicingNames: ['F3', 'C4', 'E4', 'A4'] as const,
    voicing_staves: [2, 1, 1, 1] as const,
    keyFifths: 0,
  },
  g7Bab: {
    name: 'G7',
    voicing: [53, 59, 64, 69] as const,
    voicingNames: ['F3', 'B3', 'E4', 'A4'] as const,
    voicing_staves: [2, 1, 1, 1] as const,
    keyFifths: 0,
  },
  cm7Bab: {
    name: 'CM7',
    voicing: [52, 59, 62, 67] as const,
    voicingNames: ['E3', 'B3', 'D4', 'G4'] as const,
    voicing_staves: [2, 1, 1, 1] as const,
    keyFifths: 0,
  },
} as const;

const measureStartBeat = (measureNumber: number, beatsPerMeasure = 4): number =>
  (measureNumber - 1) * beatsPerMeasure;

const chordDefToEvent = (
  def: (typeof VOICING)[keyof typeof VOICING],
  startBeat: number,
  durationBeats: number,
  measureNumber: number,
): SurvivalTutorialV3DemoChordEvent => ({
  startBeat,
  durationBeats,
  chordName: def.name,
  voicing: [...def.voicing],
  voicingNames: [...def.voicingNames],
  voicing_staves: [...def.voicing_staves],
  measureNumber,
  keyFifths: def.keyFifths,
});

const restMeasureEvent = (
  measureNumber: number,
  beatsPerMeasure = 4,
): SurvivalTutorialV3DemoChordEvent => ({
  startBeat: measureStartBeat(measureNumber, beatsPerMeasure),
  durationBeats: beatsPerMeasure,
  chordName: '',
  voicing: [],
  measureNumber,
  keyFifths: 0,
});

/** Block2 Quest1 (Key of C & F) サバイバルデモプレイ台本（B-A-B）。 */
export const buildDrop2IIVIBABDemoScript = (): SurvivalTutorialScriptPayloadV3 => ({
  version: 3,

  ui: {
    hidePlayerHpBar: true,
    hideSettingsButton: true,
    hideBackButton: true,
    hideMidiToggle: true,
    showExitButton: true,
    playerInvincible: true,
    disableEnemyAttacks: true,
    keyboardHintsDefault: true,
  },

  content: {},

  scenes: [
    {
      type: 'demo_play',
      bpm: 100,
      beatsPerMeasure: 4,
      keyFifths: 0,
      audio: {
        url_ja: DROP2_IIVI_ABA_DEMO_BGM_URL_JA,
        url_en: DROP2_IIVI_ABA_DEMO_BGM_URL_EN,
        volume: 0.28,
      },

      introLines: [
        {
          ja: 'ブロック2じゃ。同じ Key of C & F でも、形が変わるぞい。',
          en: 'This is Block 2. Same Key of C and F, but the shape changes.',
          speaker: 'jajii',
        },
        {
          ja: 'B-A-B フォーム？',
          en: 'B-A-B form?',
          speaker: 'fai',
        },
        {
          ja: 'そうじゃ。A-B-A とは最低音の並びが違う。Dm7 は F、G7 も F、CM7 は E から始まる。',
          en: 'Yes. Unlike A-B-A, the bottom notes differ. Dm7 starts on F, G7 on F, CM7 on E.',
          speaker: 'jajii',
        },
      ],

      chords: [
        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(1), 4, 1),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(2), 4, 2),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(3), 4, 3),
        restMeasureEvent(4),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(5), 4, 5),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(6), 4, 6),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(7), 4, 7),
        restMeasureEvent(8),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(9), 2, 9),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(9) + 2, 2, 9),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(10), 4, 10),
        restMeasureEvent(11),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(12), 2, 12),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(12) + 2, 2, 12),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(13), 4, 13),
        restMeasureEvent(14),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(15), 4, 15),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(16), 4, 16),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(17), 4, 17),
        restMeasureEvent(18),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(19), 2, 19),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(19) + 2, 2, 19),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(20), 4, 20),
        restMeasureEvent(21),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(22), 4, 22),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(23), 4, 23),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(24), 4, 24),
        restMeasureEvent(25),

        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(26), 2, 26),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(26) + 2, 2, 26),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(27), 4, 27),
        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(28), 2, 28),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(28) + 2, 2, 28),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(29), 4, 29),
        chordDefToEvent(VOICING.dm7Bab, measureStartBeat(30), 2, 30),
        chordDefToEvent(VOICING.g7Bab, measureStartBeat(30) + 2, 2, 30),
        chordDefToEvent(VOICING.cm7Bab, measureStartBeat(31), 4, 31),
      ],

      lines: [
        {
          ja: 'これが B-A-B の Dm7 じゃ。最低音は F3。',
          en: 'This is B-A-B Dm7. The bottom note is F3.',
          speaker: 'jajii',
          startBeat: measureStartBeat(1),
          durationBeats: 4,
        },
        {
          ja: 'G7。左手の F はキープ、右手の中の音が動く。',
          en: 'G7. Keep the left-hand F; inner right-hand tones move.',
          speaker: 'jajii',
          startBeat: measureStartBeat(2),
          durationBeats: 4,
        },
        {
          ja: 'CM7。左手が半音下がって E になる。',
          en: 'CM7. The left hand drops a half step to E.',
          speaker: 'jajii',
          startBeat: measureStartBeat(3),
          durationBeats: 4,
        },
        {
          ja: 'ブロック1の A-B-A と最低音が違うのをよく見るんじゃ。',
          en: 'Notice how the bottom notes differ from Block 1 A-B-A.',
          speaker: 'jajii',
          startBeat: measureStartBeat(5),
          durationBeats: 8,
        },
        {
          ja: 'Dm7 → G7 → CM7。この3つを耳と手に覚えろ。',
          en: 'Dm7 to G7 to CM7. Memorize these three with ears and hands.',
          speaker: 'jajii',
          startBeat: measureStartBeat(9),
          durationBeats: 8,
        },
        {
          ja: 'もう一度。最低音 F → F → E じゃ。',
          en: 'Again. Bottom notes: F, F, then E.',
          speaker: 'fai',
          startBeat: measureStartBeat(15),
          durationBeats: 8,
        },
        {
          ja: 'バトルではこの B-A-B 形で弾くのじゃ。A-B-A と混ぜるなよ。',
          en: 'In battle, play this B-A-B shape. Do not mix it with A-B-A.',
          speaker: 'jajii',
          startBeat: measureStartBeat(22),
          durationBeats: 8,
        },
        {
          ja: '最後にもう一回。形を焼きつけるんじゃ。',
          en: 'One last time. Burn the shape in.',
          speaker: 'jajii',
          startBeat: measureStartBeat(26),
          durationBeats: 8,
        },
        {
          ja: 'よし。クイズとバトルで確かめるぞい。',
          en: 'Good. Confirm it in the quiz and battle.',
          speaker: 'jajii',
          startBeat: measureStartBeat(30),
          durationBeats: 4,
        },
      ],
    },

    { type: 'finish' },
  ],

  finish: { showCta: true },
});
