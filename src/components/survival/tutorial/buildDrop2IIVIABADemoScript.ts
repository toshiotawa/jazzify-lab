import type {
  SurvivalTutorialScriptPayloadV3,
  SurvivalTutorialV3DemoChordEvent,
} from './survivalTutorialV3ScriptTypes';

/** 100BPM Drop2 II-V-I ABA デモ BGM（ピアノ + 2小節ドラムループ）。 */
export const DROP2_IIVI_ABA_DEMO_BGM_URL_JA =
  'https://jazzify-cdn.com/sozai/drop2_iivi_aba_demo_100bpm_bgm.mp3';

/** 英語ナレーション版（未アップロード時は url_ja / url にフォールバック）。 */
export const DROP2_IIVI_ABA_DEMO_BGM_URL_EN =
  'https://jazzify-cdn.com/sozai/drop2_iivi_aba_demo_100bpm_bgm_en.mp3';

const VOICING = {
  dm7Closed: {
    name: 'Dm7 closed',
    voicing: [53, 57, 60, 64] as const,
    voicingNames: ['F3', 'A3', 'C4', 'E4'] as const,
    voicing_staves: [2, 2, 1, 1] as const,
    keyFifths: 0,
  },
  dm7Drop2: {
    name: 'Dm7',
    voicing: [48, 53, 57, 64] as const,
    voicingNames: ['C3', 'F3', 'A3', 'E4'] as const,
    voicing_staves: [2, 2, 2, 1] as const,
    keyFifths: 0,
  },

  g7Closed: {
    name: 'G7 closed',
    voicing: [53, 57, 59, 64] as const,
    voicingNames: ['F3', 'A3', 'B3', 'E4'] as const,
    voicing_staves: [2, 2, 2, 1] as const,
    keyFifths: 0,
  },
  g7Drop2: {
    name: 'G7',
    voicing: [47, 53, 57, 64] as const,
    voicingNames: ['B2', 'F3', 'A3', 'E4'] as const,
    voicing_staves: [2, 2, 2, 1] as const,
    keyFifths: 0,
  },

  cm7Closed: {
    name: 'CM7 closed',
    voicing: [52, 55, 59, 62] as const,
    voicingNames: ['E3', 'G3', 'B3', 'D4'] as const,
    voicing_staves: [2, 2, 2, 1] as const,
    keyFifths: 0,
  },
  cm7Drop2: {
    name: 'CM7',
    voicing: [47, 52, 55, 62] as const,
    voicingNames: ['B2', 'E3', 'G3', 'D4'] as const,
    voicing_staves: [2, 2, 2, 1] as const,
    keyFifths: 0,
  },

  g7Right: {
    name: 'G7 RH',
    voicing: [53, 57, 64] as const,
    voicingNames: ['F3', 'A3', 'E4'] as const,
    voicing_staves: [2, 2, 1] as const,
    keyFifths: 0,
  },
  cm7Right: {
    name: 'CM7 RH',
    voicing: [52, 55, 62] as const,
    voicingNames: ['E3', 'G3', 'D4'] as const,
    voicing_staves: [2, 2, 1] as const,
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

const noteEvent = (
  midi: number,
  noteName: string,
  startBeat: number,
  durationBeats: number,
  measureNumber: number,
  chordName = '',
  staff: 1 | 2 = midi >= 60 ? 1 : 2,
): SurvivalTutorialV3DemoChordEvent => ({
  startBeat,
  durationBeats,
  chordName,
  voicing: [midi],
  voicingNames: [noteName],
  voicing_staves: [staff],
  measureNumber,
  keyFifths: 0,
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

/** Block1 Quest1 (Key of C & F) サバイバルデモプレイ台本。 */
export const buildDrop2IIVIABADemoScript = (): SurvivalTutorialScriptPayloadV3 => ({
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
          ja: 'Drop2じゃ。',
          en: 'This is Drop 2.',
          speaker: 'jajii',
        },
        {
          ja: 'Drop2？',
          en: 'Drop 2?',
          speaker: 'fai',
        },
        {
          ja: 'クローズド・ボイシングを、弾きやすく広げる技じゃ。',
          en: 'It spreads a closed voicing into a playable shape.',
          speaker: 'jajii',
        },
        {
          ja: '今日は Dm7、G7、CM7。II-V-Iで見るぞい。',
          en: 'Today, Dm7, G7, CM7. We will see it in a II-V-I.',
          speaker: 'jajii',
        },
      ],

      chords: [
        chordDefToEvent(VOICING.dm7Closed, measureStartBeat(1), 4, 1),

        noteEvent(53, 'F3', measureStartBeat(2) + 0, 1, 2, '3rd'),
        noteEvent(57, 'A3', measureStartBeat(2) + 1, 1, 2, '5th'),
        noteEvent(60, 'C4', measureStartBeat(2) + 2, 1, 2, '7th'),
        noteEvent(64, 'E4', measureStartBeat(2) + 3, 1, 2, '9th'),

        chordDefToEvent(VOICING.g7Closed, measureStartBeat(3), 4, 3),
        chordDefToEvent(VOICING.cm7Closed, measureStartBeat(4), 4, 4),

        chordDefToEvent(VOICING.dm7Closed, measureStartBeat(5), 2, 5),
        noteEvent(60, 'C4', measureStartBeat(5) + 2, 1, 5, '2nd from top'),
        noteEvent(48, 'C3', measureStartBeat(5) + 3, 1, 5, 'drop'),

        chordDefToEvent(VOICING.dm7Drop2, measureStartBeat(6), 4, 6),
        restMeasureEvent(7),

        chordDefToEvent(VOICING.g7Closed, measureStartBeat(8), 4, 8),
        noteEvent(59, 'B3', measureStartBeat(9), 2, 9, '2nd from top'),
        noteEvent(47, 'B2', measureStartBeat(9) + 2, 2, 9, 'drop'),
        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(10), 4, 10),

        chordDefToEvent(VOICING.cm7Closed, measureStartBeat(11), 4, 11),
        noteEvent(59, 'B3', measureStartBeat(12), 2, 12, '2nd from top'),
        noteEvent(47, 'B2', measureStartBeat(12) + 2, 2, 12, 'drop'),
        chordDefToEvent(VOICING.cm7Drop2, measureStartBeat(13), 4, 13),

        restMeasureEvent(14),

        chordDefToEvent(VOICING.dm7Drop2, measureStartBeat(15), 4, 15),
        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(16), 4, 16),

        noteEvent(48, 'C3', measureStartBeat(17), 2, 17, 'Dm7 LH'),
        noteEvent(47, 'B2', measureStartBeat(17) + 2, 2, 17, 'G7 LH'),

        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(18), 4, 18),
        chordDefToEvent(VOICING.cm7Drop2, measureStartBeat(19), 4, 19),

        chordDefToEvent(VOICING.g7Right, measureStartBeat(20), 2, 20),
        chordDefToEvent(VOICING.cm7Right, measureStartBeat(20) + 2, 2, 20),

        restMeasureEvent(21),

        chordDefToEvent(VOICING.dm7Drop2, measureStartBeat(22), 4, 22),
        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(23), 4, 23),
        chordDefToEvent(VOICING.cm7Drop2, measureStartBeat(24), 4, 24),

        restMeasureEvent(25),

        chordDefToEvent(VOICING.dm7Drop2, measureStartBeat(26), 2, 26),
        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(26) + 2, 2, 26),
        chordDefToEvent(VOICING.cm7Drop2, measureStartBeat(27), 4, 27),

        chordDefToEvent(VOICING.dm7Drop2, measureStartBeat(28), 2, 28),
        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(28) + 2, 2, 28),
        chordDefToEvent(VOICING.cm7Drop2, measureStartBeat(29), 4, 29),

        chordDefToEvent(VOICING.dm7Drop2, measureStartBeat(30), 2, 30),
        chordDefToEvent(VOICING.g7Drop2, measureStartBeat(30) + 2, 2, 30),
        chordDefToEvent(VOICING.cm7Drop2, measureStartBeat(31), 4, 31),
      ],

      lines: [
        {
          ja: 'まずはクローズド・ボイシングじゃ。ルートは抜いて、コードの中身を近くに集める。',
          en: 'First, a closed voicing. Omit the root and gather the chord tones close together.',
          speaker: 'jajii',
          startBeat: measureStartBeat(1),
          durationBeats: 4,
        },
        {
          ja: 'Dm7は、3・5・7・9。F、A、C、Eじゃ。',
          en: 'Dm7 is 3, 5, 7, 9. F, A, C, E.',
          speaker: 'jajii',
          startBeat: measureStartBeat(2),
          durationBeats: 4,
        },
        {
          ja: 'G7は、7・9・3・13。F、A、B、Eじゃ。',
          en: 'G7 is 7, 9, 3, 13. F, A, B, E.',
          speaker: 'jajii',
          startBeat: measureStartBeat(3),
          durationBeats: 4,
        },
        {
          ja: 'CM7は、3・5・7・9。E、G、B、Dじゃ。',
          en: 'CM7 is 3, 5, 7, 9. E, G, B, D.',
          speaker: 'jajii',
          startBeat: measureStartBeat(4),
          durationBeats: 4,
        },
        {
          ja: 'では Dm7 に戻るぞい。この、上から2番目の C を見るんじゃ。',
          en: 'Now back to Dm7. Look at the C, the second note from the top.',
          speaker: 'jajii',
          startBeat: measureStartBeat(5),
          durationBeats: 2,
        },
        {
          ja: 'その C を、1オクターブ下に落とす。',
          en: 'Drop that C down one octave.',
          speaker: 'jajii',
          startBeat: measureStartBeat(5) + 2,
          durationBeats: 2,
        },
        {
          ja: 'これが Dm7 の Drop2 じゃ。C、F、A、E。',
          en: 'This is Dm7 Drop 2. C, F, A, E.',
          speaker: 'jajii',
          startBeat: measureStartBeat(6),
          durationBeats: 4,
        },
        {
          ja: '理屈を増やしすぎるな。上から2番目を落とす。それだけじゃ。',
          en: 'Do not overthink it. Drop the second note from the top. That is it.',
          speaker: 'jajii',
          startBeat: measureStartBeat(7),
          durationBeats: 4,
        },
        {
          ja: 'G7 でも同じじゃ。まずはクローズド。',
          en: 'Same for G7. First, closed.',
          speaker: 'jajii',
          startBeat: measureStartBeat(8),
          durationBeats: 4,
        },
        {
          ja: '上から2番目の B を落とす。',
          en: 'Drop the B, the second note from the top.',
          speaker: 'jajii',
          startBeat: measureStartBeat(9),
          durationBeats: 4,
        },
        {
          ja: 'これが G7 の Drop2。B、F、A、E。',
          en: 'This is G7 Drop 2. B, F, A, E.',
          speaker: 'jajii',
          startBeat: measureStartBeat(10),
          durationBeats: 4,
        },
        {
          ja: 'CM7 でも同じ。まずはクローズド。',
          en: 'Same for CM7. First, closed.',
          speaker: 'jajii',
          startBeat: measureStartBeat(11),
          durationBeats: 4,
        },
        {
          ja: '上から2番目の B を下に落とす。',
          en: 'Drop the B, the second note from the top.',
          speaker: 'jajii',
          startBeat: measureStartBeat(12),
          durationBeats: 4,
        },
        {
          ja: 'これが CM7 の Drop2。B、E、G、D。',
          en: 'This is CM7 Drop 2. B, E, G, D.',
          speaker: 'jajii',
          startBeat: measureStartBeat(13),
          durationBeats: 4,
        },
        {
          ja: 'ここからが大事じゃ。進行で見るぞい。',
          en: 'Now the important part. Watch the progression.',
          speaker: 'jajii',
          startBeat: measureStartBeat(14),
          durationBeats: 4,
        },
        {
          ja: 'Dm7 から G7。',
          en: 'Dm7 to G7.',
          speaker: 'fai',
          startBeat: measureStartBeat(15),
          durationBeats: 4,
        },
        {
          ja: '左手だけ見ろ。C から B に半音下がるだけじゃ。',
          en: 'Watch only the left hand. C moves down to B.',
          speaker: 'jajii',
          startBeat: measureStartBeat(16),
          durationBeats: 4,
        },
        {
          ja: 'C、B。ここだけで II-V の感じが出る。',
          en: 'C, B. This alone gives the II-V sound.',
          speaker: 'jajii',
          startBeat: measureStartBeat(17),
          durationBeats: 4,
        },
        {
          ja: '次は G7 から CM7。',
          en: 'Next, G7 to CM7.',
          speaker: 'fai',
          startBeat: measureStartBeat(18),
          durationBeats: 4,
        },
        {
          ja: '左手の B はキープじゃ。',
          en: 'Keep the left-hand B.',
          speaker: 'jajii',
          startBeat: measureStartBeat(19),
          durationBeats: 4,
        },
        {
          ja: '右手の3声が、スケール上に下がる。F-A-E から E-G-D。',
          en: 'The three right-hand notes move down the scale. F-A-E to E-G-D.',
          speaker: 'jajii',
          startBeat: measureStartBeat(20),
          durationBeats: 4,
        },
        {
          ja: 'つまり、全部を動かそうとしなくていい。動く場所だけ見ればよい。',
          en: 'So you do not need to move everything. Watch only the moving parts.',
          speaker: 'jajii',
          startBeat: measureStartBeat(21),
          durationBeats: 4,
        },
        {
          ja: '流れで弾くぞい。Dm7。',
          en: 'Now in flow. Dm7.',
          speaker: 'jajii',
          startBeat: measureStartBeat(22),
          durationBeats: 4,
        },
        {
          ja: 'G7。左手が半音下がる。',
          en: 'G7. The left hand moves down a half step.',
          speaker: 'jajii',
          startBeat: measureStartBeat(23),
          durationBeats: 4,
        },
        {
          ja: 'CM7。左手はキープ、右手が下がる。',
          en: 'CM7. Keep the left hand, move the right hand down.',
          speaker: 'jajii',
          startBeat: measureStartBeat(24),
          durationBeats: 4,
        },
        {
          ja: 'もう一度じゃ。見る場所は少ない。',
          en: 'Again. There are only a few things to watch.',
          speaker: 'jajii',
          startBeat: measureStartBeat(25),
          durationBeats: 4,
        },
        {
          ja: 'Dm7、G7。',
          en: 'Dm7, G7.',
          speaker: 'fai',
          startBeat: measureStartBeat(26),
          durationBeats: 4,
        },
        {
          ja: 'CM7。',
          en: 'CM7.',
          speaker: 'fai',
          startBeat: measureStartBeat(27),
          durationBeats: 4,
        },
        {
          ja: '最後にもう一回。形を耳と手に焼きつけるんじゃ。',
          en: 'One last time. Burn the shape into your ears and hands.',
          speaker: 'jajii',
          startBeat: measureStartBeat(28),
          durationBeats: 4,
        },
        {
          ja: 'Drop2は、難しい名前ではない。上から2番目を落とした形じゃ。',
          en: 'Drop 2 is not a difficult name. It is the shape made by dropping the second note from the top.',
          speaker: 'jajii',
          startBeat: measureStartBeat(29),
          durationBeats: 4,
        },
        {
          ja: 'II-V-Iでは、左手と右手の動きが少ない。そこがこの形の強みじゃ。',
          en: 'In a II-V-I, the left and right hands move very little. That is the strength of this shape.',
          speaker: 'jajii',
          startBeat: measureStartBeat(30),
          durationBeats: 4,
        },
        {
          ja: 'まずはこの3つだけ覚えろ。Dm7、G7、CM7じゃ。',
          en: 'For now, learn only these three. Dm7, G7, CM7.',
          speaker: 'jajii',
          startBeat: measureStartBeat(31),
          durationBeats: 4,
        },
      ],

    },

    { type: 'finish' },
  ],

  finish: { showCta: true },
});
