import { connectEffetuneLive, disconnectEffetuneLive, type EffetuneLabLiveHandle } from '@/utils/pitchLab/effetuneLab';
import {
  createPitchPleaseLab,
  startPitchPleaseOnStream,
  stopPitchPlease,
  type PitchPleaseLabHandle,
} from '@/utils/pitchLab/pitchPleaseLab';
import {
  DEFAULT_POLY_ONSET_CONFIG,
  EFFETUNE_POLY_THRESHOLDS,
  PITCH_PLEASE_FAST_THRESHOLDS,
  PITCH_PLEASE_PIANO_THRESHOLDS,
  createPolyOnsetTracker,
  fillLevelsFromEffeTune,
  fillLevelsFromPitchPleaseProbs,
  releasePolyMidiMask,
  resetPolyOnsetTracker,
  snapshotPolyLevelsForDiagnostics,
  stepPolyOnsetTracker,
  type PolyNoteEdgeKind,
  type PolyOnsetThresholds,
} from '@/utils/pitchInput/polyPitchActiveSet';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import type { PolyphonicVoiceEngine } from '@/utils/pitchInput/voicePitchEngine';

export interface PolyPitchVoiceCallbacks {
  onNoteOn: (note: number, domTimeStampMs?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

const DIAG_FRAME_INTERVAL = 16;

const microphoneConstraints = (deviceId?: string, echoCancellation = true): MediaTrackConstraints => ({
  deviceId: deviceId ? { exact: deviceId } : undefined,
  echoCancellation,
  noiseSuppression: false,
  autoGainControl: false,
});

export class PolyPitchVoiceInput {
  private readonly tracker = createPolyOnsetTracker();
  private readonly levels = new Float32Array(128);
  private stream: MediaStream | null = null;
  private ownsStream = false;
  private audioContext: AudioContext | null = null;
  private pitchPlease: PitchPleaseLabHandle | null = null;
  private effetune: EffetuneLabLiveHandle | null = null;
  private callbacks: PolyPitchVoiceCallbacks | null = null;
  private engine: PolyphonicVoiceEngine | null = null;
  private thresholds: PolyOnsetThresholds = PITCH_PLEASE_FAST_THRESHOLDS;
  private diagFrameCounter = 0;
  private diagConnectRecorded = false;

  async connect(
    engine: PolyphonicVoiceEngine,
    callbacks: PolyPitchVoiceCallbacks,
    deviceId?: string,
    echoCancellation = true,
  ): Promise<boolean> {
    await this.disconnect();
    resetPolyOnsetTracker(this.tracker);
    this.engine = engine;
    this.thresholds = engine === 'effetune'
      ? EFFETUNE_POLY_THRESHOLDS
      : engine === 'pitchplease-piano'
        ? PITCH_PLEASE_PIANO_THRESHOLDS
        : PITCH_PLEASE_FAST_THRESHOLDS;
    this.diagFrameCounter = 0;
    this.diagConnectRecorded = false;
    this.callbacks = callbacks;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneConstraints(deviceId, echoCancellation),
        video: false,
      });
      this.stream = stream;
      this.ownsStream = true;
      if (engine === 'effetune') {
        const context = new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' });
        this.audioContext = context;
        if (context.state === 'suspended') await context.resume();
        this.effetune = await connectEffetuneLive(
          context,
          stream,
          null,
          undefined,
          (frame) => {
            fillLevelsFromEffeTune(
              this.levels,
              frame.levels,
              frame.firstMidi,
              frame.divisionsPerSemitone,
            );
            this.emitEdges();
          },
        );
      } else {
        const model = engine === 'pitchplease-piano' ? 'piano' : 'fast';
        this.pitchPlease = createPitchPleaseLab(model, null, undefined, (frame) => {
          fillLevelsFromPitchPleaseProbs(this.levels, frame.probs);
          this.emitEdges();
        });
        const started = await startPitchPleaseOnStream(this.pitchPlease, stream);
        if (!started) {
          await this.disconnect();
          callbacks.onError?.('PitchPlease を開始できませんでした');
          return false;
        }
      }
      this.recordPolyConnect(engine, echoCancellation);
      callbacks.onConnectionChange?.(true);
      return true;
    } catch {
      await this.disconnect();
      callbacks.onError?.('マイクへのアクセスに失敗しました');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pitchPlease) stopPitchPlease(this.pitchPlease);
    this.pitchPlease = null;
    if (this.effetune) disconnectEffetuneLive(this.effetune);
    this.effetune = null;
    if (this.audioContext) {
      await this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
    if (this.ownsStream) {
      this.stream?.getTracks().forEach((track) => track.stop());
    }
    this.stream = null;
    this.ownsStream = false;
    const callbacks = this.callbacks;
    releasePolyMidiMask(this.tracker.emitted, (midi) => callbacks?.onNoteOff(midi));
    resetPolyOnsetTracker(this.tracker);
    callbacks?.onConnectionChange?.(false);
    this.callbacks = null;
    this.engine = null;
    this.diagConnectRecorded = false;
  }

  private recordPolyConnect(engine: PolyphonicVoiceEngine, echoCancellation: boolean): void {
    if (!pitchDiagnosticRecording.enabled || this.diagConnectRecorded) return;
    this.diagConnectRecorded = true;
    pitchDiagnosticRecording.record('polyConnect', {
      engine,
      echoCancellation,
      thresholds: this.thresholds,
      onsetConfig: DEFAULT_POLY_ONSET_CONFIG,
    });
  }

  private recordPolyFrameSample(): void {
    if (!pitchDiagnosticRecording.enabled) return;
    this.diagFrameCounter += 1;
    if (this.diagFrameCounter % DIAG_FRAME_INTERVAL !== 0) return;
    pitchDiagnosticRecording.record('polyFrames', {
      engine: this.engine,
      levels: snapshotPolyLevelsForDiagnostics(this.levels),
    });
  }

  private emitEdges(): void {
    const callbacks = this.callbacks;
    if (!callbacks) return;
    const now = performance.now();
    this.recordPolyFrameSample();
    stepPolyOnsetTracker(
      this.tracker,
      this.levels,
      this.thresholds,
      DEFAULT_POLY_ONSET_CONFIG,
      (midi, kind: PolyNoteEdgeKind) => {
        if (pitchDiagnosticRecording.enabled) {
          pitchDiagnosticRecording.record('polyNote', {
            engine: this.engine,
            midi,
            kind,
            level: Math.round(this.levels[midi] * 100),
          });
        }
        callbacks.onNoteOn(midi, now);
      },
      (midi) => {
        if (pitchDiagnosticRecording.enabled) {
          pitchDiagnosticRecording.record('polyNote', {
            engine: this.engine,
            midi,
            kind: 'off',
            level: Math.round(this.levels[midi] * 100),
          });
        }
        callbacks.onNoteOff(midi);
      },
    );
  }
}
