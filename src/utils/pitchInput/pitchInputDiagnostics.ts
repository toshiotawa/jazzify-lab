import type {
  PitchInputDiagnosticSnapshot,
  PitchObservation,
  PestoShiftSemitones,
  TrackerRejectReason,
} from '@/utils/pitchInput/pitchInputTypes';
import { PESTO_MODEL_ID } from '@/utils/pitchInput/pitchInputTypes';

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
  private ring: PitchObservation[] = [];
  private writeIndex = 0;
  private droppedSamples = 0;
  private discontinuities = 0;
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

  recordDiscontinuity(): void {
    this.discontinuities += 1;
  }

  recordObservation(obs: PitchObservation): void {
    this.lastRejectReason = obs.rejectReason;
    if (this.ring.length < RING_SIZE) {
      this.ring.push(obs);
    } else {
      this.ring[this.writeIndex] = obs;
      this.writeIndex = (this.writeIndex + 1) % RING_SIZE;
    }
  }

  snapshot(queueDepthMs: number): PitchInputDiagnosticSnapshot {
    const queueAges = this.ring.map((o) => o.queueAgeMs);
    const inferenceMs = this.ring.map((o) => o.inferenceMs);
    const last = this.ring.length > 0
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
      lastRejectReason: this.lastRejectReason,
      warmupFramesRemaining: this.warmupFramesRemaining,
    };
  }
}
