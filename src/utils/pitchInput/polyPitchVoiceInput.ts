import type { PitchPleaseError } from '@markusstrasser/pitchplease';
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
  type PolyOnsetThresholds,
} from '@/utils/pitchInput/polyPitchActiveSet';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import { PitchInputController } from '@/utils/PitchInputController';
import type { PolyphonicVoiceEngine } from '@/utils/pitchInput/voicePitchEngine';

export interface PolyPitchVoiceCallbacks {
  onNoteOn: (note: number, domTimeStampMs?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

const DIAG_FRAME_BATCH_SIZE = 16;
const PITCH_PLEASE_START_ERROR = 'PitchPlease を開始できませんでした';
const MICROPHONE_ERROR = 'マイクへのアクセスに失敗しました';

interface OwnedPitchResources {
  stream: MediaStream | null;
  ownsStream: boolean;
  pitchPlease: PitchPleaseLabHandle | null;
  effetune: EffetuneLabLiveHandle | null;
  audioContext: AudioContext | null;
}

const emptyOwnedPitchResources = (): OwnedPitchResources => ({
  stream: null,
  ownsStream: false,
  pitchPlease: null,
  effetune: null,
  audioContext: null,
});

const microphoneConstraints = (deviceId?: string, echoCancellation = true): MediaTrackConstraints => ({
  deviceId: deviceId ? { exact: deviceId } : undefined,
  echoCancellation,
  noiseSuppression: false,
  autoGainControl: false,
});

export class PolyPitchVoiceInput {
  private readonly tracker = createPolyOnsetTracker();
  private readonly levels = new Float32Array(128);
  private readonly diagFrameBatch: number[][][] = [];
  private stream: MediaStream | null = null;
  private ownsStream = false;
  private audioContext: AudioContext | null = null;
  private pitchPlease: PitchPleaseLabHandle | null = null;
  private effetune: EffetuneLabLiveHandle | null = null;
  private callbacks: PolyPitchVoiceCallbacks | null = null;
  private engine: PolyphonicVoiceEngine | null = null;
  private thresholds: PolyOnsetThresholds = PITCH_PLEASE_FAST_THRESHOLDS;
  private diagConnectRecorded = false;
  private operation: Promise<void> = Promise.resolve();
  private sessionId = 0;
  private startupError: string | null = null;

  async connect(
    engine: PolyphonicVoiceEngine,
    callbacks: PolyPitchVoiceCallbacks,
    deviceId?: string,
    echoCancellation = true,
  ): Promise<boolean> {
    const sessionId = this.sessionId + 1;
    this.sessionId = sessionId;
    return this.enqueue(() => this.connectSession(sessionId, engine, callbacks, deviceId, echoCancellation));
  }

  async disconnect(): Promise<void> {
    this.sessionId += 1;
    return this.enqueue(() => this.release());
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.operation.then(task, task);
    this.operation = run.then(() => undefined, () => undefined);
    return run;
  }

  private async connectSession(
    sessionId: number,
    engine: PolyphonicVoiceEngine,
    callbacks: PolyPitchVoiceCallbacks,
    deviceId: string | undefined,
    echoCancellation: boolean,
  ): Promise<boolean> {
    await this.release();
    if (sessionId !== this.sessionId) return false;

    resetPolyOnsetTracker(this.tracker);
    this.engine = engine;
    this.thresholds = engine === 'effetune'
      ? EFFETUNE_POLY_THRESHOLDS
      : engine === 'pitchplease-piano'
        ? PITCH_PLEASE_PIANO_THRESHOLDS
        : PITCH_PLEASE_FAST_THRESHOLDS;
    this.diagFrameBatch.length = 0;
    this.diagConnectRecorded = false;
    this.startupError = null;
    this.callbacks = callbacks;
    const owned = emptyOwnedPitchResources();
    let committed = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneConstraints(deviceId, echoCancellation),
        video: false,
      });
      owned.stream = stream;
      owned.ownsStream = true;
      if (sessionId !== this.sessionId) {
        await this.abandonOwned(owned);
        this.dropCallbacks(callbacks);
        return false;
      }

      if (engine === 'effetune') {
        const context = new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' });
        owned.audioContext = context;
        if (context.state === 'suspended') await context.resume();
        if (sessionId !== this.sessionId) {
          await this.abandonOwned(owned);
          this.dropCallbacks(callbacks);
          return false;
        }
        owned.effetune = await connectEffetuneLive(
          context,
          stream,
          null,
          undefined,
          (frame) => {
            if (sessionId !== this.sessionId) return;
            fillLevelsFromEffeTune(
              this.levels,
              frame.levels,
              frame.firstMidi,
              frame.divisionsPerSemitone,
            );
            this.emitEdges();
          },
        );
        if (sessionId !== this.sessionId) {
          await this.abandonOwned(owned);
          this.dropCallbacks(callbacks);
          return false;
        }
      } else {
        const model = engine === 'pitchplease-piano' ? 'piano' : 'fast';
        owned.pitchPlease = createPitchPleaseLab(
          model,
          null,
          undefined,
          (frame) => {
            if (sessionId !== this.sessionId) return;
            fillLevelsFromPitchPleaseProbs(this.levels, frame.probs);
            this.emitEdges();
          },
          (error) => {
            this.handlePitchPleaseError(sessionId, error);
          },
        );
        const started = await startPitchPleaseOnStream(owned.pitchPlease, stream);
        if (sessionId !== this.sessionId) {
          await this.abandonOwned(owned);
          this.dropCallbacks(callbacks);
          return false;
        }
        if (!started || this.startupError) {
          await this.abandonOwned(owned);
          if (!this.startupError) callbacks.onError?.(PITCH_PLEASE_START_ERROR);
          callbacks.onConnectionChange?.(false);
          this.dropCallbacks(callbacks);
          return false;
        }
      }

      if (sessionId !== this.sessionId) {
        await this.abandonOwned(owned);
        this.dropCallbacks(callbacks);
        return false;
      }

      this.stream = owned.stream;
      this.ownsStream = owned.ownsStream;
      this.pitchPlease = owned.pitchPlease;
      this.effetune = owned.effetune;
      this.audioContext = owned.audioContext;
      committed = true;
      this.recordPolyConnect(engine, echoCancellation);
      callbacks.onConnectionChange?.(true);
      return true;
    } catch {
      if (!committed) await this.abandonOwned(owned);
      if (sessionId !== this.sessionId) {
        this.dropCallbacks(callbacks);
        return false;
      }
      if (committed) {
        await this.release();
      } else {
        callbacks.onError?.(MICROPHONE_ERROR);
        callbacks.onConnectionChange?.(false);
        this.dropCallbacks(callbacks);
      }
      return false;
    }
  }

  private handlePitchPleaseError(sessionId: number, error: PitchPleaseError): void {
    if (sessionId !== this.sessionId) return;
    const message = error.message.length > 0 ? error.message : PITCH_PLEASE_START_ERROR;
    pitchDiagnosticRecording.record('polyError', { engine: this.engine, message });
    this.callbacks?.onError?.(message);
    if (!this.pitchPlease) {
      this.startupError = message;
      return;
    }
    void this.disconnect();
  }

  private async abandonOwned(owned: OwnedPitchResources): Promise<void> {
    this.flushDiagFrameBatch();
    if (owned.pitchPlease) stopPitchPlease(owned.pitchPlease);
    owned.pitchPlease = null;
    if (owned.effetune) disconnectEffetuneLive(owned.effetune);
    owned.effetune = null;
    if (owned.audioContext) {
      await owned.audioContext.close().catch(() => undefined);
      owned.audioContext = null;
    }
    if (owned.ownsStream) {
      owned.stream?.getTracks().forEach((track) => track.stop());
    }
    owned.stream = null;
    owned.ownsStream = false;
  }

  private dropCallbacks(callbacks: PolyPitchVoiceCallbacks): void {
    if (this.callbacks !== callbacks) return;
    releasePolyMidiMask(this.tracker.emitted, (midi) => callbacks.onNoteOff(midi));
    resetPolyOnsetTracker(this.tracker);
    this.callbacks = null;
    this.engine = null;
    this.diagConnectRecorded = false;
  }

  private async release(): Promise<void> {
    this.flushDiagFrameBatch();
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
    this.startupError = null;
  }

  private recordPolyConnect(engine: PolyphonicVoiceEngine, echoCancellation: boolean): void {
    if (!pitchDiagnosticRecording.enabled || this.diagConnectRecorded) return;
    this.diagConnectRecorded = true;
    pitchDiagnosticRecording.record('polyConnect', {
      engine,
      echoCancellation,
      thresholds: this.thresholds,
      onsetConfig: DEFAULT_POLY_ONSET_CONFIG,
      activeMonoPitchControllers: PitchInputController.getActiveControllerCount(),
    });
  }

  private flushDiagFrameBatch(): void {
    if (!pitchDiagnosticRecording.enabled || this.diagFrameBatch.length === 0) return;
    pitchDiagnosticRecording.record('polyFrames', {
      engine: this.engine,
      frames: this.diagFrameBatch.splice(0),
    });
  }

  private recordPolyFrameSample(): void {
    if (!pitchDiagnosticRecording.enabled) return;
    this.diagFrameBatch.push(snapshotPolyLevelsForDiagnostics(this.levels));
    if (this.diagFrameBatch.length < DIAG_FRAME_BATCH_SIZE) return;
    this.flushDiagFrameBatch();
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
      (midi) => {
        if (pitchDiagnosticRecording.enabled) {
          pitchDiagnosticRecording.record('polyNote', {
            engine: this.engine,
            midi,
            kind: 'on',
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
