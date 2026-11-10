import { MIDI_PIANO_MAX, MIDI_PIANO_MIN } from '@/utils/pitchLab/polyPitchTypes';

export const POLY_MIDI_COUNT = 128;

export const EFFETUNE_NOTE_ON_LEVEL = 0.7;
export const EFFETUNE_NOTE_OFF_LEVEL = 0.45;

export const PITCH_PLEASE_FAST_THRESHOLDS = Object.freeze({ on: 0.7, off: 0.42 });
export const PITCH_PLEASE_PIANO_THRESHOLDS = Object.freeze({ on: 0.6, off: 0.36 });
export const EFFETUNE_POLY_THRESHOLDS = Object.freeze({
  on: EFFETUNE_NOTE_ON_LEVEL,
  off: EFFETUNE_NOTE_OFF_LEVEL,
});

export interface PolyOnsetThresholds {
  readonly on: number;
  readonly off: number;
}

export interface PolyOnsetTrackerConfig {
  /** この値以上なら 1 フレームで ON */
  readonly strongLevel: number;
  readonly fastConfirmFrames: number;
  readonly slowConfirmFrames: number;
  /** OFF 閾値を何フレーム連続下回ったら note-off するか */
  readonly releaseFrames: number;
  /** これより長く鳴っている隣は、後から来た音を抑えない */
  readonly neighborYoungFrames: number;
}

export const DEFAULT_POLY_ONSET_CONFIG: PolyOnsetTrackerConfig = Object.freeze({
  strongLevel: 0.9,
  fastConfirmFrames: 1,
  slowConfirmFrames: 4,
  releaseFrames: 10,
  neighborYoungFrames: 4,
});

export const createPolyMidiMask = (): Uint8Array => new Uint8Array(POLY_MIDI_COUNT);

export const fillLevelsFromPitchPleaseProbs = (
  levelOut: Float32Array,
  probs: Float32Array | readonly number[] | null,
): void => {
  levelOut.fill(0);
  if (!probs) return;
  const count = Math.min(probs.length, MIDI_PIANO_MAX - MIDI_PIANO_MIN + 1);
  for (let i = 0; i < count; i += 1) {
    levelOut[MIDI_PIANO_MIN + i] = probs[i];
  }
};

/** 5 cent ビンの最大値を鍵ごとのレベルにする。 */
export const fillLevelsFromEffeTune = (
  levelOut: Float32Array,
  levels: Float32Array | readonly number[],
  firstMidi: number,
  divisionsPerSemitone: number,
): void => {
  levelOut.fill(0);
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const centerIndex = 2 + (midi - firstMidi) * divisionsPerSemitone;
    let maxLevel = 0;
    for (let d = 0; d < divisionsPerSemitone; d += 1) {
      const idx = centerIndex + d;
      if (idx < 0 || idx >= levels.length) continue;
      const level = levels[idx];
      if (level > maxLevel) maxLevel = level;
    }
    levelOut[midi] = maxLevel;
  }
};

export interface PolyOnsetTracker {
  readonly emitted: Uint8Array;
  readonly confirmFrames: Int32Array;
  readonly releaseFrames: Int32Array;
  readonly framesSinceOn: Int32Array;
}

export const createPolyOnsetTracker = (): PolyOnsetTracker => ({
  emitted: createPolyMidiMask(),
  confirmFrames: new Int32Array(POLY_MIDI_COUNT),
  releaseFrames: new Int32Array(POLY_MIDI_COUNT),
  framesSinceOn: new Int32Array(POLY_MIDI_COUNT),
});

export const resetPolyOnsetTracker = (tracker: PolyOnsetTracker): void => {
  tracker.emitted.fill(0);
  tracker.confirmFrames.fill(0);
  tracker.releaseFrames.fill(0);
  tracker.framesSinceOn.fill(0);
};

const neighborSuppressesOnset = (
  midi: number,
  level: number,
  levels: Float32Array,
  thresholds: PolyOnsetThresholds,
  tracker: PolyOnsetTracker,
  config: PolyOnsetTrackerConfig,
): boolean => {
  for (const delta of [-1, 1] as const) {
    const neighbor = midi + delta;
    if (neighbor < MIDI_PIANO_MIN || neighbor > MIDI_PIANO_MAX) continue;
    const neighborLevel = levels[neighbor];
    if (neighborLevel < thresholds.on) continue;
    const neighborStronger = delta < 0 ? neighborLevel >= level : neighborLevel > level;
    if (!neighborStronger) continue;
    const neighborEstablished = tracker.emitted[neighbor] === 1
      && tracker.framesSinceOn[neighbor] > config.neighborYoungFrames;
    if (neighborEstablished) continue;
    return true;
  }
  return false;
};

/** 鍵ごとの確率レベルを打鍵・離鍵保持で note on/off にする。 */
export const stepPolyOnsetTracker = (
  tracker: PolyOnsetTracker,
  levels: Float32Array,
  thresholds: PolyOnsetThresholds,
  config: PolyOnsetTrackerConfig,
  onNoteOn: (midi: number) => void,
  onNoteOff: (midi: number) => void,
): void => {
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    if (tracker.emitted[midi] === 1) {
      tracker.framesSinceOn[midi] += 1;
    }
  }

  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const level = levels[midi];

    if (tracker.emitted[midi] !== 1) {
      if (level < thresholds.on) {
        tracker.confirmFrames[midi] = 0;
        continue;
      }
      if (neighborSuppressesOnset(midi, level, levels, thresholds, tracker, config)) {
        tracker.confirmFrames[midi] = 0;
        continue;
      }
      tracker.confirmFrames[midi] += 1;
      const required = level >= config.strongLevel
        ? config.fastConfirmFrames
        : config.slowConfirmFrames;
      if (tracker.confirmFrames[midi] < required) continue;
      tracker.emitted[midi] = 1;
      tracker.confirmFrames[midi] = 0;
      tracker.releaseFrames[midi] = 0;
      tracker.framesSinceOn[midi] = 0;
      onNoteOn(midi);
      continue;
    }

    if (level >= thresholds.off) {
      tracker.releaseFrames[midi] = 0;
      continue;
    }
    tracker.releaseFrames[midi] += 1;
    if (tracker.releaseFrames[midi] < config.releaseFrames) continue;
    tracker.emitted[midi] = 0;
    tracker.releaseFrames[midi] = 0;
    tracker.confirmFrames[midi] = 0;
    tracker.framesSinceOn[midi] = 0;
    onNoteOff(midi);
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

/** 診断用: 0.1 以上の鍵を [midi, prob×100] の配列に圧縮する。 */
export const snapshotPolyLevelsForDiagnostics = (
  levels: Float32Array,
  minLevel = 0.1,
): number[][] => {
  const out: number[][] = [];
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const level = levels[midi];
    if (level < minLevel) continue;
    out.push([midi, Math.round(level * 100)]);
  }
  return out;
};
