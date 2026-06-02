import type {
  SurvivalTutorialScriptPayloadV3,
  SurvivalTutorialV3DemoChordEvent,
} from './survivalTutorialV3ScriptTypes';

const DRUMS160_URL =
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';

const VOICING = {
  dm7: {
    name: 'Dm7',
    voicing: [53, 57, 60, 64] as const,
    voicingNames: ['F3', 'A3', 'C4', 'E4'] as const,
    voicing_staves: [2, 2, 2, 2] as const,
    keyFifths: 0,
  },
  g7: {
    name: 'G7',
    voicing: [53, 57, 59, 64] as const,
    voicingNames: ['F3', 'A3', 'B3', 'E4'] as const,
    voicing_staves: [2, 2, 2, 1] as const,
    keyFifths: 0,
  },
  cm7: {
    name: 'CM7',
    voicing: [52, 55, 59, 62] as const,
    voicingNames: ['E3', 'G3', 'B3', 'D4'] as const,
    voicing_staves: [2, 2, 2, 2] as const,
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

const halfBeatChordsInMeasure = (
  measureNumber: number,
  def: (typeof VOICING)[keyof typeof VOICING],
  beatsPerMeasure = 4,
): readonly SurvivalTutorialV3DemoChordEvent[] => {
  const base = measureStartBeat(measureNumber, beatsPerMeasure);
  const count = Math.floor(beatsPerMeasure / 0.5);
  const events: SurvivalTutorialV3DemoChordEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    events.push(chordDefToEvent(def, base + i * 0.5, 0.5, measureNumber));
  }
  return events;
};

/** 160BPM デモプレイ検証台本（developer-demo-play-v3）。DB seed と整合。 */
export const buildSurvivalDeveloperDemoPlayV3Script = (): SurvivalTutorialScriptPayloadV3 => ({
  version: 3,
  audioTracks: {
    drum_loop: { url: DRUMS160_URL, volume: 0.35 },
  },
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
      bpm: 160,
      beatsPerMeasure: 4,
      keyFifths: 0,
      introLines: [
        {
          ja: 'デモプレイを見てみよう。',
          en: 'Let us watch a demo play.',
          speaker: 'fai',
        },
        {
          ja: 'BGMに合わせて和音が進む。お前は見るだけじゃ。',
          en: 'Chords move with the BGM. You just watch.',
          speaker: 'jajii',
        },
      ],
      chords: [
        chordDefToEvent(VOICING.dm7, 0, 2, 1),
        chordDefToEvent(VOICING.g7, 4, 2, 2),
        chordDefToEvent(VOICING.cm7, 8, 2, 3),
        ...halfBeatChordsInMeasure(4, VOICING.cm7),
        ...halfBeatChordsInMeasure(5, VOICING.g7),
        ...halfBeatChordsInMeasure(6, VOICING.cm7),
        ...halfBeatChordsInMeasure(7, VOICING.cm7),
      ],
      lines: [
        {
          ja: 'Dm7、2拍。',
          en: 'Dm7, two beats.',
          speaker: 'fai',
          startBeat: 0,
          durationBeats: 2,
        },
        {
          ja: '3拍目はジャ爺の番じゃ。',
          en: 'Third beat is my line.',
          speaker: 'jajii',
          startBeat: 2,
          durationBeats: 2,
        },
        {
          ja: 'G7、2拍。',
          en: 'G7, two beats.',
          speaker: 'fai',
          startBeat: 4,
          durationBeats: 2,
        },
        {
          ja: '続けて見せてやる。',
          en: 'Keep watching.',
          speaker: 'jajii',
          startBeat: 6,
          durationBeats: 2,
        },
        {
          ja: 'CM7、2拍。',
          en: 'CM7, two beats.',
          speaker: 'fai',
          startBeat: 8,
          durationBeats: 2,
        },
        {
          ja: 'ここから速くなるぞ。',
          en: 'It speeds up here.',
          speaker: 'jajii',
          startBeat: 10,
          durationBeats: 2,
        },
        {
          ja: 'CM7、0.5拍刻み。',
          en: 'CM7 in half-beat steps.',
          speaker: 'fai',
          startBeat: 12,
          durationBeats: 2,
        },
        {
          ja: 'リズムに乗れ。',
          en: 'Ride the rhythm.',
          speaker: 'jajii',
          startBeat: 14,
          durationBeats: 2,
        },
        {
          ja: 'G7、0.5拍刻み。',
          en: 'G7 in half-beat steps.',
          speaker: 'fai',
          startBeat: 16,
          durationBeats: 2,
        },
        {
          ja: 'まだまだ続く。',
          en: 'Still going.',
          speaker: 'jajii',
          startBeat: 18,
          durationBeats: 2,
        },
        {
          ja: 'CM7、0.5拍刻み。',
          en: 'CM7 in half-beat steps.',
          speaker: 'fai',
          startBeat: 20,
          durationBeats: 2,
        },
        {
          ja: '集中して見るんじゃ。',
          en: 'Watch closely.',
          speaker: 'jajii',
          startBeat: 22,
          durationBeats: 2,
        },
        {
          ja: '最後のCM7。',
          en: 'Final CM7.',
          speaker: 'fai',
          startBeat: 24,
          durationBeats: 2,
        },
        {
          ja: 'デモはここまでじゃ。',
          en: 'Demo ends here.',
          speaker: 'jajii',
          startBeat: 26,
          durationBeats: 2,
        },
      ],
      endHoldBeats: 4,
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});
