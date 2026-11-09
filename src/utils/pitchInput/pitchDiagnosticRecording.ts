import {
  encodePcm16Wav,
  layoutPcmWavSegments,
  type PcmWavSegmentMeta,
} from '@/utils/pitchInput/pcmWavEncoder';

interface DiagnosticEntry {
  elapsedMs: number;
  event: string;
  details: object;
}

export interface PitchDiagnosticPcmSegment {
  generationId: number;
  endSourceSample: number;
  endSourceTimeSec: number;
  inferenceIntervalMs: 5 | 10 | 20;
  echoCancellation: boolean;
  sampleRate: number;
  samples: Int16Array;
  totalWritten: number;
}

const RECORDING_CAPACITY = 6000;
const PCM_SEGMENT_CAPACITY = 4;
const PCM_SAMPLE_RATE = 48_000;

// Bounded history shared by input sessions; recording survives settings/game unmounts.
class PitchDiagnosticRecording {
  private entries: DiagnosticEntry[] = [];

  private writeIndex = 0;

  private totalEntries = 0;

  private startedAt = 0;

  private startedAtIso: string | null = null;

  private pcmSegments: PitchDiagnosticPcmSegment[] = [];

  enabled = false;

  get hasRecording(): boolean {
    return this.startedAtIso !== null;
  }

  get hasPcm(): boolean {
    return this.pcmSegments.length > 0;
  }

  start(): void {
    this.entries = [];
    this.writeIndex = 0;
    this.totalEntries = 0;
    this.pcmSegments = [];
    this.startedAt = performance.now();
    this.startedAtIso = new Date().toISOString();
    this.enabled = true;
    this.record('recordingStarted', {
      userAgent: navigator.userAgent,
      route: window.location.pathname + window.location.hash.split('?')[0],
    });
  }

  stop(): void {
    this.record('recordingStopped');
    this.enabled = false;
  }

  record(event: string, details: object = {}, force = false): void {
    if (!this.startedAtIso) {
      return;
    }
    if (!this.enabled && !force) {
      return;
    }
    const entry = { elapsedMs: performance.now() - this.startedAt, event, details };
    if (this.entries.length < RECORDING_CAPACITY) {
      this.entries.push(entry);
    } else {
      this.entries[this.writeIndex] = entry;
    }
    this.writeIndex = (this.writeIndex + 1) % RECORDING_CAPACITY;
    this.totalEntries += 1;
  }

  addPcmSegment(segment: PitchDiagnosticPcmSegment): void {
    if (this.pcmSegments.length >= PCM_SEGMENT_CAPACITY) {
      this.pcmSegments.shift();
    }
    this.pcmSegments.push(segment);
  }

  private pcmSegmentInputs() {
    return this.pcmSegments.map((segment) => ({
      samples: segment.samples,
      generationId: segment.generationId,
      endSourceSample: segment.endSourceSample,
      endSourceTimeSec: segment.endSourceTimeSec,
      inferenceIntervalMs: segment.inferenceIntervalMs,
      echoCancellation: segment.echoCancellation,
    }));
  }

  private pcmSegmentMeta(): PcmWavSegmentMeta[] {
    if (this.pcmSegments.length === 0) {
      return [];
    }
    return layoutPcmWavSegments(this.pcmSegmentInputs(), PCM_SAMPLE_RATE).pcmSegments;
  }

  snapshot() {
    const entries: DiagnosticEntry[] = [];
    const start = this.entries.length < RECORDING_CAPACITY ? 0 : this.writeIndex;
    for (let index = 0; index < this.entries.length; index += 1) {
      const entry = this.entries[(start + index) % this.entries.length];
      if (entry) entries.push(entry);
    }
    return {
      version: 1,
      startedAt: this.startedAtIso,
      exportedAt: new Date().toISOString(),
      elapsedMs: this.startedAtIso ? performance.now() - this.startedAt : 0,
      recording: this.enabled,
      overwrittenEntries: Math.max(0, this.totalEntries - RECORDING_CAPACITY),
      pcmSegments: this.pcmSegmentMeta(),
      entries,
    };
  }

  download(): void {
    const blob = new Blob([JSON.stringify(this.snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pitch-diagnostics-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  downloadPcm(): void {
    if (this.pcmSegments.length === 0) {
      return;
    }
    const { wav } = encodePcm16Wav(this.pcmSegmentInputs(), PCM_SAMPLE_RATE);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pitch-diagnostics-${Date.now()}.wav`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

export const pitchDiagnosticRecording = new PitchDiagnosticRecording();
