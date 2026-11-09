import { MIDI_PIANO_MAX, MIDI_PIANO_MIN } from '@/utils/pitchLab/polyPitchTypes';

export const POLY_MIDI_COUNT = 128;
/** 弱倍音を落とす。オンは PitchPlease 既定の 0.7 に合わせる。 */
export const EFFETUNE_NOTE_ON_LEVEL = 0.7;
export const EFFETUNE_NOTE_OFF_LEVEL = 0.45;
/** この時間連続して検出された音だけを ON にする。 */
export const POLY_NOTE_ON_CONFIRM_MS = 45;
/** この時間消えてから OFF にする。1フレームの欠落で再打鍵しない。 */
export const POLY_NOTE_OFF_RELEASE_MS = 120;

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
  levelOut?: Float32Array,
): void => {
  target.fill(0);
  levelOut?.fill(0);
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const centerIndex = 2 + (midi - firstMidi) * divisionsPerSemitone;
    let maxLevel = 0;
    for (let d = 0; d < divisionsPerSemitone; d += 1) {
      const idx = centerIndex + d;
      if (idx < 0 || idx >= levels.length) continue;
      const level = levels[idx];
      if (level > maxLevel) maxLevel = level;
    }
    if (levelOut) levelOut[midi] = maxLevel;
    const threshold = previous[midi] === 1 ? EFFETUNE_NOTE_OFF_LEVEL : EFFETUNE_NOTE_ON_LEVEL;
    if (maxLevel >= threshold) target[midi] = 1;
  }
};

export const fillMaskFromPitchPleaseNotes = (
  target: Uint8Array,
  levelOut: Float32Array,
  notes: readonly { midi: number }[],
  probs: Float32Array | readonly number[] | null,
): void => {
  target.fill(0);
  levelOut.fill(0);
  if (probs) {
    const count = Math.min(probs.length, MIDI_PIANO_MAX - MIDI_PIANO_MIN + 1);
    for (let i = 0; i < count; i += 1) levelOut[MIDI_PIANO_MIN + i] = probs[i];
  }
  for (let i = 0; i < notes.length; i += 1) {
    const midi = notes[i].midi;
    if (midi >= MIDI_PIANO_MIN && midi <= MIDI_PIANO_MAX) target[midi] = 1;
  }
};

/** 隣より弱い半音を落とす。同値は低い方の MIDI を残す。 */
export const suppressWeakerNeighbors = (
  mask: Uint8Array,
  levels: Float32Array | readonly number[],
  drop: Uint8Array,
): void => {
  drop.fill(0);
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    if (mask[midi] !== 1) continue;
    const level = levels[midi] ?? 0;
    const lower = midi > MIDI_PIANO_MIN ? (levels[midi - 1] ?? 0) : -1;
    const higher = midi < MIDI_PIANO_MAX ? (levels[midi + 1] ?? 0) : -1;
    if ((mask[midi - 1] === 1 && lower >= level) || (mask[midi + 1] === 1 && higher > level)) {
      drop[midi] = 1;
    }
  }
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    if (drop[midi] === 1) mask[midi] = 0;
  }
};

export interface PolyMidiGate {
  emitted: Uint8Array;
  pendingOnMs: Float64Array;
  pendingOffMs: Float64Array;
}

export const createPolyMidiGate = (): PolyMidiGate => ({
  emitted: createPolyMidiMask(),
  pendingOnMs: new Float64Array(POLY_MIDI_COUNT),
  pendingOffMs: new Float64Array(POLY_MIDI_COUNT),
});

export const resetPolyMidiGate = (gate: PolyMidiGate): void => {
  gate.emitted.fill(0);
  gate.pendingOnMs.fill(0);
  gate.pendingOffMs.fill(0);
};

/** 検出マスクを確定遅延と離鍵保持に通してから ON/OFF する。 */
export const stepPolyMidiGate = (
  gate: PolyMidiGate,
  detected: Uint8Array,
  nowMs: number,
  onNoteOn: (midi: number) => void,
  onNoteOff: (midi: number) => void,
  confirmMs = POLY_NOTE_ON_CONFIRM_MS,
  releaseMs = POLY_NOTE_OFF_RELEASE_MS,
): void => {
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    if (detected[midi] === 1) {
      gate.pendingOffMs[midi] = 0;
      if (gate.emitted[midi] === 1) {
        gate.pendingOnMs[midi] = 0;
        continue;
      }
      if (gate.pendingOnMs[midi] === 0) {
        gate.pendingOnMs[midi] = nowMs;
        continue;
      }
      if (nowMs - gate.pendingOnMs[midi] >= confirmMs) {
        gate.emitted[midi] = 1;
        gate.pendingOnMs[midi] = 0;
        onNoteOn(midi);
      }
      continue;
    }
    gate.pendingOnMs[midi] = 0;
    if (gate.emitted[midi] !== 1) {
      gate.pendingOffMs[midi] = 0;
      continue;
    }
    if (gate.pendingOffMs[midi] === 0) {
      gate.pendingOffMs[midi] = nowMs;
      continue;
    }
    if (nowMs - gate.pendingOffMs[midi] >= releaseMs) {
      gate.emitted[midi] = 0;
      gate.pendingOffMs[midi] = 0;
      onNoteOff(midi);
    }
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
