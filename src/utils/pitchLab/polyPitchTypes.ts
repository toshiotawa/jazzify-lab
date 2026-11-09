export type PolyPitchEngineId =
  | 'pesto'
  | 'pitchplease-fast'
  | 'pitchplease-piano'
  | 'effetune-immediate'
  | 'effetune-revised-40ms';

export interface PolyPitchFrame {
  engineId: PolyPitchEngineId;
  contentTimeSec: number;
  emitTimeSec: number;
  activeMidis: readonly number[];
}

export interface PolyPitchTrialLabel {
  onsetTimeSec: number;
  sustainEndTimeSec: number;
  expectedMidis: readonly number[];
  /** true = 単音を時間揃えで加算した混合（演奏ではない） */
  additiveMix?: boolean;
}

export interface PolyPitchTrialMetrics {
  engineId: PolyPitchEngineId;
  chordConfirmed: boolean;
  confirmLatencyMs: number | null;
  spuriousMidiRate: number | null;
  octaveErrorRate: number | null;
  missingMidiRate: number | null;
  monoHit: boolean | null;
  falseOnDuringSilence: boolean;
  sustainFrameCount: number;
}

export const EFFETUNE_LEVEL_THRESHOLD = 0.5;
export const MIDI_PIANO_MIN = 21;
export const MIDI_PIANO_MAX = 108;
export const CHORD_CONFIRM_STABLE_FRAMES = 3;
