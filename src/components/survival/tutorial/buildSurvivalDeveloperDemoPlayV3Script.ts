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

const C_MAJOR_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const midiToNoteName = (midi: number): string => {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
};

const nextCMajorScaleMidi = (midi: number): number => {
  const pc = ((midi % 12) + 12) % 12;
  const octaveBase = Math.floor(midi / 12) * 12;
  const idx = C_MAJOR_PITCH_CLASSES.findIndex((step) => step === pc);
  if (idx < 0) {
    return midi + 1;
  }
  if (idx === C_MAJOR_PITCH_CLASSES.length - 1) {
    return octaveBase + 12 + C_MAJOR_PITCH_CLASSES[0];
  }
  return octaveBase + C_MAJOR_PITCH_CLASSES[idx + 1];
};

const staffForMidi = (midi: number): 1 | 2 => (midi >= 60 ? 1 : 2);

const halfBeatSingleNotesInMeasures = (
  measureNumbers: readonly number[],
  startMidi: number,
  label: string,
  beatsPerMeasure = 4,
): readonly SurvivalTutorialV3DemoChordEvent[] => {
  const slotsPerMeasure = Math.floor(beatsPerMeasure / 0.5);
  const events: SurvivalTutorialV3DemoChordEvent[] = [];
  let midi = startMidi;

  for (const measureNumber of measureNumbers) {
    const base = measureStartBeat(measureNumber, beatsPerMeasure);
    for (let slot = 0; slot < slotsPerMeasure; slot += 1) {
      const name = midiToNoteName(midi);
      events.push({
        startBeat: base + slot * 0.5,
        durationBeats: 0.5,
        chordName: slot === 0 ? label : '',
        voicing: [midi],
        voicingNames: [name],
        voicing_staves: [staffForMidi(midi)],
        measureNumber,
        keyFifths: 0,
      });
      midi = nextCMajorScaleMidi(midi);
    }
  }

  return events;
};

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

/** 小節5〜8: 0.5拍刻みの C メジャー単音スケール上昇（鍵盤ハイライト検証用）。 */
export const DEMO_PLAY_HALF_BEAT_SCALE_START_MIDI = 60;

/** 160BPM デモプレイ検証台本（developer-demo-play-v3）。DB seed と整合。 */
export const buildSurvivalDeveloperDemoPlayV3Script = (): SurvivalTutorialScriptPayloadV3 => ({  version: 3,
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
        restMeasureEvent(4),
        ...halfBeatSingleNotesInMeasures([5, 6, 7, 8], DEMO_PLAY_HALF_BEAT_SCALE_START_MIDI, 'C maj'),
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
          ja: 'ここは休符。何も弾かんぞ。',
          en: 'This is a rest. Play nothing.',
          speaker: 'jajii',
          startBeat: 12,
          durationBeats: 4,
        },
        {
          ja: '単音、0.5拍刻み。ドから上昇じゃ。',
          en: 'Single notes, half-beat steps. Ascending from C.',
          speaker: 'fai',
          startBeat: 16,
          durationBeats: 2,
        },
        {
          ja: '鍵盤のハイライトを見ろ。',
          en: 'Watch the keyboard highlights.',
          speaker: 'jajii',
          startBeat: 18,
          durationBeats: 2,
        },
        {
          ja: 'スケールは続く。',
          en: 'The scale keeps going.',
          speaker: 'fai',
          startBeat: 20,
          durationBeats: 2,
        },
        {
          ja: 'まだまだ続く。',
          en: 'Still going.',
          speaker: 'jajii',
          startBeat: 22,
          durationBeats: 2,
        },
        {
          ja: '上に上がっていくぞ。',
          en: 'Climbing higher.',
          speaker: 'fai',
          startBeat: 24,
          durationBeats: 2,
        },
        {
          ja: '集中して見るんじゃ。',
          en: 'Watch closely.',
          speaker: 'jajii',
          startBeat: 26,
          durationBeats: 2,
        },
        {
          ja: '最後の音だ。',
          en: 'The final note.',
          speaker: 'fai',
          startBeat: 28,
          durationBeats: 2,
        },
        {
          ja: 'デモはここまでじゃ。',
          en: 'Demo ends here.',
          speaker: 'jajii',
          startBeat: 30,
          durationBeats: 2,
        },
      ],
      endHoldBeats: 4,
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});
