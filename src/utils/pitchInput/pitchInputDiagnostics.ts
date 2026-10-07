import type {
  PitchInputDiagnosticSnapshot,
  PitchObservation,
  PestoShiftSemitones,
  TrackerRejectReason,
} from '@/utils/pitchInput/pitchInputTypes';
import { PESTO_MODEL_ID, PESTO_TARGET_SAMPLE_RATE } from '@/utils/pitchInput/pitchInputTypes';

const RING_SIZE = 128;

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx] ?? 0;
};

export interface PitchInputDiagnosticsConfig {
  deviceLabel: string | null;
  sampleRate: number | null;
  requestedEchoCancellation: boolean;
  actualEchoCancellation: boolean | null;
  shiftSemitones: PestoShiftSemitones;
  generationId: number;
}

export class PitchInputDiagnostics {
  private readonly ring: PitchObservation[] = Array.from({ length: RING_SIZE }, () => ({
    generationId: 0, sourceStartSample: 0, sourceEndSample: 0, sourceEndTimeSec: 0,
    shiftSemitones: 0, modelMidi: null, concertMidi: null, confidence: 0,
    modelVolume: 0, rawRmsDbfs: -120, inferenceMs: 0, queueAgeMs: 0,
    discontinuity: false, rejectReason: 'none',
  }));
  private observationCount = 0;
  private writeIndex = 0;
  private droppedSamples = 0;
  private discontinuities = 0;
  private lastDiscontinuityReason: string | null = null;
  private lastGapMs = 0;
  private modelResetCount = 0;
  private cacheRecoveryCount = 0;
  private readonly processingDurations = new Float32Array(RING_SIZE);
  private processingWriteIndex = 0;
  private processingCount = 0;
  private config: PitchInputDiagnosticsConfig;
  private warmupFramesRemaining = 0;
  private lastRejectReason: TrackerRejectReason = 'none';

  constructor(config: PitchInputDiagnosticsConfig) {
    this.config = config;
  }

  updateConfig(partial: Partial<PitchInputDiagnosticsConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  setWarmupFrames(frames: number): void {
    this.warmupFramesRemaining = Math.max(0, frames);
  }

  tickWarmup(): void {
    if (this.warmupFramesRemaining > 0) {
      this.warmupFramesRemaining -= 1;
    }
  }

  recordDrop(sampleCount: number): void {
    this.droppedSamples += sampleCount;
  }

  recordDiscontinuity(reason: string, sourceGapSamples = 0): void {
    this.discontinuities += 1;
    this.lastDiscontinuityReason = reason;
    this.recordSourceGap(sourceGapSamples);
  }

  recordSourceGap(sampleCount: number): void {
    this.lastGapMs = sampleCount / PESTO_TARGET_SAMPLE_RATE * 1000;
  }

  recordModelReset(): void {
    this.modelResetCount += 1;
  }

  recordCacheRecovery(): void {
    this.cacheRecoveryCount += 1;
  }

  recordProcessingDuration(durationMs: number): void {
    this.processingDurations[this.processingWriteIndex] = durationMs;
    this.processingWriteIndex = (this.processingWriteIndex + 1) % RING_SIZE;
    this.processingCount = Math.min(RING_SIZE, this.processingCount + 1);
  }

  recordObservation(obs: PitchObservation): void {
    this.lastRejectReason = obs.rejectReason;
    Object.assign(this.ring[this.writeIndex], obs);
    this.writeIndex = (this.writeIndex + 1) % RING_SIZE;
    this.observationCount = Math.min(RING_SIZE, this.observationCount + 1);
  }

  snapshot(queueDepthMs: number): PitchInputDiagnosticSnapshot {
    const observations = this.ring.slice(0, this.observationCount);
    const queueAges = observations.map((o) => o.queueAgeMs);
    const inferenceMs = observations.map((o) => o.inferenceMs);
    const last = this.observationCount > 0
      ? this.ring[(this.writeIndex - 1 + this.ring.length) % this.ring.length]
      : undefined;

    return {
      deviceLabel: this.config.deviceLabel,
      sampleRate: this.config.sampleRate,
      requestedEchoCancellation: this.config.requestedEchoCancellation,
      actualEchoCancellation: this.config.actualEchoCancellation,
      modelId: PESTO_MODEL_ID,
      shiftSemitones: this.config.shiftSemitones,
      generationId: this.config.generationId,
      droppedSamples: this.droppedSamples,
      discontinuities: this.discontinuities,
      lastDiscontinuityReason: this.lastDiscontinuityReason,
      lastGapMs: this.lastGapMs,
      modelResetCount: this.modelResetCount,
      cacheRecoveryCount: this.cacheRecoveryCount,
      processingMsP95: percentile(Array.from(this.processingDurations.subarray(0, this.processingCount)), 0.95),
      queueDepthMs,
      queueAgeMsP50: percentile(queueAges, 0.5),
      queueAgeMsP95: percentile(queueAges, 0.95),
      inferenceMsP50: percentile(inferenceMs, 0.5),
      inferenceMsP95: percentile(inferenceMs, 0.95),
      preprocessMsP50: 0,
      preprocessMsP95: 0,
      lastModelMidi: last?.modelMidi ?? null,
      lastConcertMidi: last?.concertMidi ?? null,
      lastConfidence: last?.confidence ?? 0,
      lastRawRmsDbfs: last?.rawRmsDbfs ?? null,
      lastModelVolume: last?.modelVolume ?? null,
      lastSourceEndTimeSec: last?.sourceEndTimeSec ?? null,
      lastRejectReason: this.lastRejectReason,
      warmupFramesRemaining: this.warmupFramesRemaining,
    };
  }
}
