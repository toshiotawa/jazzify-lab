/** PESTO 低音実験: 認識専用の半音シフト（tracker 前に復元する）。 */
export type PestoShiftSemitones = 0 | 12 | 24;

export interface CapturedChunk {
  generationId: number;
  sequence: number;
  sourceStartSample: number;
  sourceEndSample: number;
  sourceEndTimeSec: number;
  samples: Float32Array;
  /** 欠落直後のみ、保持した実PCMから復元した3976サンプルのモデル履歴。 */
  recoveryCache?: Float32Array;
  /** Worker 到着時刻。音声の時刻とは分離して待ち時間を測る。 */
  receivedTimeMs?: number;
  /** Workletで転送待ちした原音時間。 */
  captureQueueAgeMs?: number;
  rawRmsDbfs: number;
  rawPeak: number;
  clipCount: number;
}

export type TrackerRejectReason =
  | 'none'
  | 'voiced'
  | 'volume'
  | 'confidence'
  | 'stability'
  | 'invalidPitch'
  | 'warmup'
  | 'postDiscontinuity';

export interface PitchObservation {
  generationId: number;
  sourceStartSample: number;
  sourceEndSample: number;
  sourceEndTimeSec: number;
  shiftSemitones: PestoShiftSemitones;
  modelMidi: number | null;
  concertMidi: number | null;
  confidence: number;
  modelVolume: number;
  rawRmsDbfs: number;
  inferenceMs: number;
  queueAgeMs: number;
  discontinuity: boolean;
  rejectReason: TrackerRejectReason;
}

export interface PitchInputDiagnosticSnapshot {
  deviceLabel: string | null;
  sampleRate: number | null;
  requestedEchoCancellation: boolean;
  actualEchoCancellation: boolean | null;
  modelId: string;
  shiftSemitones: PestoShiftSemitones;
  generationId: number;
  droppedSamples: number;
  discontinuities: number;
  lastDiscontinuityReason?: string | null;
  lastGapMs?: number;
  modelResetCount?: number;
  cacheRecoveryCount?: number;
  processingMsP95?: number;
  queueDepthMs: number;
  queueAgeMsP50: number;
  queueAgeMsP95: number;
  inferenceMsP50: number;
  inferenceMsP95: number;
  preprocessMsP50: number;
  preprocessMsP95: number;
  lastModelMidi: number | null;
  lastConcertMidi: number | null;
  lastConfidence: number;
  lastRawRmsDbfs?: number | null;
  lastModelVolume?: number | null;
  lastSourceEndTimeSec?: number | null;
  lastRejectReason: TrackerRejectReason;
  warmupFramesRemaining: number;
}

export const PESTO_TARGET_SAMPLE_RATE = 48_000;
export const PESTO_CHUNK_SIZE = 240;
export const PESTO_BASE_FRAME_SEC = PESTO_CHUNK_SIZE / PESTO_TARGET_SAMPLE_RATE;
export const PESTO_QUEUE_LIMIT_MS = 40;
export const PESTO_WARMUP_FRAMES = 4;
export const PESTO_MODEL_ID = 'pesto-mir1k-g7-48000-240-refill-compact-v1';

export const decimationFactorForShift = (shift: PestoShiftSemitones): number => {
  if (shift === 12) return 2;
  if (shift === 24) return 4;
  return 1;
};

export const frameDurationMsForShift = (shift: PestoShiftSemitones): number =>
  PESTO_BASE_FRAME_SEC * decimationFactorForShift(shift) * 1000;
