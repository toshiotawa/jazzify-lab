import type { PitchPleaseError } from '@markusstrasser/pitchplease';
import {
  createPitchPleaseLab,
  startPitchPleaseOnStream,
  stopPitchPlease,
  type PitchPleaseLabHandle,
} from '@/utils/pitchLab/pitchPleaseLab';
import {
  DEFAULT_POLY_ONSET_CONFIG,
  PITCH_PLEASE_PIANO_THRESHOLDS,
  createPolyOnsetTracker,
  fillLevelsFromPitchPleaseProbs,
  releasePolyMidiMask,
  resetPolyOnsetTracker,
  snapshotPolyLevelsForDiagnostics,
  stepPolyOnsetTracker,
} from '@/utils/pitchInput/polyPitchActiveSet';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import {
  isolateVoiceInputChannel,
  VOICE_INPUT_CHANNEL_UNAVAILABLE,
} from '@/utils/pitchInput/polyPitchCaptureStream';
import { voiceMicrophoneConstraints } from '@/utils/pitchInput/voiceMicrophoneSupport';

export interface PolyPitchVoiceCallbacks {
  onNoteOn: (note: number, domTimeStampMs?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

const DIAG_FRAME_BATCH_SIZE = 16;
const PITCH_PLEASE_START_ERROR = 'PitchPlease を開始できませんでした';
const MICROPHONE_ERROR = 'マイクへのアクセスに失敗しました';
const ENGINE = 'pitchplease-piano';

const resolveGetUserMediaError = (error: unknown, inputChannel: 1 | 2): string => {
  if (inputChannel === 2 && error instanceof DOMException && error.name === 'OverconstrainedError') {
    return VOICE_INPUT_CHANNEL_UNAVAILABLE;
  }
  return MICROPHONE_ERROR;
};

interface OwnedPitchResources {
  stream: MediaStream | null;
  ownsStream: boolean;
  pitchPlease: PitchPleaseLabHandle | null;
  isolationContext: AudioContext | null;
}

const emptyOwnedPitchResources = (): OwnedPitchResources => ({
  stream: null,
  ownsStream: false,
  pitchPlease: null,
  isolationContext: null,
});

export class PolyPitchVoiceInput {
  private readonly tracker = createPolyOnsetTracker();
  private readonly levels = new Float32Array(128);
  private readonly diagFrameBatch: number[][][] = [];
  private stream: MediaStream | null = null;
  private ownsStream = false;
  private isolationContext: AudioContext | null = null;
  private pitchPlease: PitchPleaseLabHandle | null = null;
  private callbacks: PolyPitchVoiceCallbacks | null = null;
  private inputChannel: 1 | 2 = 1;
  private diagConnectRecorded = false;
  private operation: Promise<void> = Promise.resolve();
  private sessionId = 0;
  private startupError: string | null = null;

  async connect(
    callbacks: PolyPitchVoiceCallbacks,
    deviceId?: string,
    echoCancellation = true,
    inputChannel: 1 | 2 = 1,
  ): Promise<boolean> {
    const sessionId = this.sessionId + 1;
    this.sessionId = sessionId;
    return this.enqueue(() => this.connectSession(
      sessionId,
      callbacks,
      deviceId,
      echoCancellation,
      inputChannel,
    ));
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
    callbacks: PolyPitchVoiceCallbacks,
    deviceId: string | undefined,
    echoCancellation: boolean,
    inputChannel: 1 | 2,
  ): Promise<boolean> {
    await this.release();
    if (sessionId !== this.sessionId) return false;

    resetPolyOnsetTracker(this.tracker);
    this.inputChannel = inputChannel;
    this.diagFrameBatch.length = 0;
    this.diagConnectRecorded = false;
    this.startupError = null;
    this.callbacks = callbacks;
    const owned = emptyOwnedPitchResources();
    let committed = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: voiceMicrophoneConstraints(deviceId, echoCancellation, inputChannel),
        video: false,
      });
      owned.stream = stream;
      owned.ownsStream = true;
      if (sessionId !== this.sessionId) {
        await this.abandonOwned(owned);
        this.dropCallbacks(callbacks);
        return false;
      }

      let detectorStream = stream;
      try {
        const isolated = await isolateVoiceInputChannel(stream, inputChannel);
        detectorStream = isolated.stream;
        owned.isolationContext = isolated.context;
      } catch (error) {
        await this.abandonOwned(owned);
        if (sessionId === this.sessionId) {
          const message = error instanceof Error && error.message === 'voice-input-channel-unavailable'
            ? VOICE_INPUT_CHANNEL_UNAVAILABLE
            : MICROPHONE_ERROR;
          pitchDiagnosticRecording.recordPolyConnectionFailure(message);
          callbacks.onError?.(message);
          callbacks.onConnectionChange?.(false);
          this.dropCallbacks(callbacks);
        } else {
          this.dropCallbacks(callbacks);
        }
        return false;
      }
      if (sessionId !== this.sessionId) {
        await this.abandonOwned(owned);
        this.dropCallbacks(callbacks);
        return false;
      }

      owned.pitchPlease = createPitchPleaseLab(
        'piano',
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
      const started = await startPitchPleaseOnStream(owned.pitchPlease, detectorStream);
      if (sessionId !== this.sessionId) {
        await this.abandonOwned(owned);
        this.dropCallbacks(callbacks);
        return false;
      }
      if (!started || this.startupError) {
        await this.abandonOwned(owned);
        const message = this.startupError ?? PITCH_PLEASE_START_ERROR;
        pitchDiagnosticRecording.recordPolyConnectionFailure(message);
        callbacks.onError?.(message);
        callbacks.onConnectionChange?.(false);
        this.dropCallbacks(callbacks);
        return false;
      }

      this.stream = owned.stream;
      this.ownsStream = owned.ownsStream;
      this.pitchPlease = owned.pitchPlease;
      this.isolationContext = owned.isolationContext;
      committed = true;
      this.recordPolyConnect(echoCancellation);
      callbacks.onConnectionChange?.(true);
      return true;
    } catch (error) {
      if (!committed) await this.abandonOwned(owned);
      if (sessionId !== this.sessionId) {
        this.dropCallbacks(callbacks);
        return false;
      }
      if (committed) {
        await this.release();
      } else {
        const message = resolveGetUserMediaError(error, inputChannel);
        pitchDiagnosticRecording.recordPolyConnectionFailure(message);
        callbacks.onError?.(message);
        callbacks.onConnectionChange?.(false);
        this.dropCallbacks(callbacks);
      }
      return false;
    }
  }

  private handlePitchPleaseError(sessionId: number, error: PitchPleaseError): void {
    if (sessionId !== this.sessionId) return;
    const message = error.message.length > 0 ? error.message : PITCH_PLEASE_START_ERROR;
    pitchDiagnosticRecording.record('polyError', { engine: ENGINE, message });
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
    if (owned.isolationContext) {
      await owned.isolationContext.close().catch(() => undefined);
      owned.isolationContext = null;
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
    this.diagConnectRecorded = false;
  }

  private async release(): Promise<void> {
    this.flushDiagFrameBatch();
    if (this.pitchPlease) stopPitchPlease(this.pitchPlease);
    this.pitchPlease = null;
    if (this.isolationContext) {
      await this.isolationContext.close().catch(() => undefined);
      this.isolationContext = null;
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
    this.diagConnectRecorded = false;
    this.startupError = null;
  }

  private recordPolyConnect(echoCancellation: boolean): void {
    pitchDiagnosticRecording.clearLastPolyConnectionError();
    if (!pitchDiagnosticRecording.enabled || this.diagConnectRecorded) return;
    this.diagConnectRecorded = true;
    pitchDiagnosticRecording.record('polyConnect', {
      engine: ENGINE,
      echoCancellation,
      inputChannel: this.inputChannel,
      thresholds: PITCH_PLEASE_PIANO_THRESHOLDS,
      onsetConfig: DEFAULT_POLY_ONSET_CONFIG,
    });
  }

  private flushDiagFrameBatch(): void {
    if (!pitchDiagnosticRecording.enabled || this.diagFrameBatch.length === 0) return;
    pitchDiagnosticRecording.record('polyFrames', {
      engine: ENGINE,
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
      PITCH_PLEASE_PIANO_THRESHOLDS,
      DEFAULT_POLY_ONSET_CONFIG,
      (midi) => {
        if (pitchDiagnosticRecording.enabled) {
          pitchDiagnosticRecording.record('polyNote', {
            engine: ENGINE,
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
            engine: ENGINE,
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
