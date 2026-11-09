import { MIDI_PIANO_MAX, MIDI_PIANO_MIN } from '@/utils/pitchLab/polyPitchTypes';

export const POLY_MIDI_COUNT = 128;
export const EFFETUNE_NOTE_ON_LEVEL = 0.5;
export const EFFETUNE_NOTE_OFF_LEVEL = 0.35;

export const createPolyMidiMask = (): Uint8Array => new Uint8Array(POLY_MIDI_COUNT);

/** 前フレームとの差分だけを ON/OFF にする。mask は破壊的に更新する。 */
export const applyPolyMidiMask = (
  mask: Uint8Array,
  nextOn: Uint8Array,
  onNoteOn: (midi: number) => void,
  onNoteOff: (midi: number) => void,
): void => {
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const next = nextOn[midi];
    if (mask[midi] === next) continue;
    mask[midi] = next;
    if (next === 1) onNoteOn(midi);
    else onNoteOff(midi);
  }
};

export const fillMaskFromMidis = (target: Uint8Array, midis: readonly number[]): void => {
  target.fill(0);
  for (let i = 0; i < midis.length; i += 1) {
    const midi = midis[i];
    if (midi >= MIDI_PIANO_MIN && midi <= MIDI_PIANO_MAX) target[midi] = 1;
  }
};

/** 5 cent ビンの最大値。既にオンの鍵はオフ閾値まで維持する。 */
export const fillMaskFromEffeTuneLevels = (
  target: Uint8Array,
  previous: Uint8Array,
  levels: Float32Array | readonly number[],
  firstMidi: number,
  divisionsPerSemitone: number,
): void => {
  target.fill(0);
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const centerIndex = 2 + (midi - firstMidi) * divisionsPerSemitone;
    let maxLevel = 0;
    for (let d = 0; d < divisionsPerSemitone; d += 1) {
      const idx = centerIndex + d;
      if (idx < 0 || idx >= levels.length) continue;
      const level = levels[idx];
      if (level > maxLevel) maxLevel = level;
    }
    const threshold = previous[midi] === 1 ? EFFETUNE_NOTE_OFF_LEVEL : EFFETUNE_NOTE_ON_LEVEL;
    if (maxLevel >= threshold) target[midi] = 1;
  }
};

export const releasePolyMidiMask = (
  mask: Uint8Array,
  onNoteOff: (midi: number) => void,
): void => {
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    if (mask[midi] !== 1) continue;
    mask[midi] = 0;
    onNoteOff(midi);
  }
};
