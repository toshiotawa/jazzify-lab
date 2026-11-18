import {
  DEFAULT_POLY_ONSET_CONFIG,
  MIDI_PIANO_MAX,
  MIDI_PIANO_MIN,
  PITCH_PLEASE_PIANO_THRESHOLDS,
} from '@/utils/pitchInput/polyPitchActiveSet';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import {
  capturedVoiceInputChannelCount,
  VOICE_INPUT_CHANNEL_UNAVAILABLE,
} from '@/utils/pitchInput/polyPitchCaptureStream';
import {
  createPolyInputLevelMeter,
  type PolyInputLevelMeter,
} from '@/utils/pitchInput/polyInputLevelMeter';
import { parsePolyPitchWorkerMessage } from '@/utils/pitchInput/polyPitchWorkerMessages';
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
const CAPTURE_WORKLET_URL = '/js/audio/pesto-capture-worklet.js?v=input-channel-2';

const resolveGetUserMediaError = (error: unknown, inputChannel: 1 | 2): string => {
  if (inputChannel === 2 && error instanceof DOMException && error.name === 'OverconstrainedError') {
    return VOICE_INPUT_CHANNEL_UNAVAILABLE;
  }
  return MICROPHONE_ERROR;
};

interface OwnedPitchResources {
  stream: MediaStream | null;
  ownsStream: boolean;
  audioContext: AudioContext | null;
  worker: Worker | null;
  workerChannel: MessageChannel | null;
  workletNode: AudioWorkletNode | null;
  silentGain: GainNode | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  inputLevelMeter: PolyInputLevelMeter | null;
  generationId: number;
}

const emptyOwnedPitchResources = (): OwnedPitchResources => ({
  stream: null,
  ownsStream: false,
  audioContext: null,
  worker: null,
  workerChannel: null,
  workletNode: null,
  silentGain: null,
  sourceNode: null,
  inputLevelMeter: null,
  generationId: 0,
});

const readTrackLatencySec = (track: MediaStreamTrack | undefined): number | null => {
  if (!track) return null;
  const settings = track.getSettings();
  if (!('latency' in settings)) return null;
  const latency = settings.latency;
  return typeof latency === 'number' && Number.isFinite(latency) && latency > 0
    ? latency
    : null;
};

const resolveCachedInputLatencySec = (
  stream: MediaStream | null,
  audioContext: AudioContext | null,
): number => {
  const trackLatency = readTrackLatencySec(stream?.getAudioTracks()[0]);
  if (trackLatency !== null) return trackLatency;
  if (audioContext && typeof audioContext.baseLatency === 'number' && Number.isFinite(audioContext.baseLatency)) {
    return audioContext.baseLatency;
  }
  return 0;
};

const resolveDomTimeStampMs = (
  audioContextTime: number | undefined,
  audioContext: AudioContext | null,
  inputLatencySec: number,
): number | undefined => {
  if (typeof audioContextTime !== 'number' || !Number.isFinite(audioContextTime)) {
    return undefined;
  }
  if (!audioContext) return undefined;
  const adjustedCtxTime = audioContextTime - inputLatencySec;
  const deltaSec = adjustedCtxTime - audioContext.currentTime;
  return performance.now() + deltaSec * 1000;
};

const resolveAudioContextConstructor = (): typeof AudioContext | null => {
  if (typeof globalThis.AudioContext === 'function') {
    return globalThis.AudioContext;
  }
  const maybeWebkit = globalThis as typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };
  if (typeof maybeWebkit.webkitAudioContext === 'function') {
    return maybeWebkit.webkitAudioContext;
  }
  return null;
};

const releaseActivePolyNotes = (
  active: Uint8Array,
  onNoteOff: (midi: number) => void,
): void => {
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    if (active[midi] === 0) continue;
    active[midi] = 0;
    onNoteOff(midi);
  }
};

export class PolyPitchVoiceInput {
  private readonly activeNotes = new Uint8Array(128);
  private readonly diagFrameBatch: number[][][] = [];
  private readonly diagInputDbBatch: Array<number | null> = [];
  private stream: MediaStream | null = null;
  private ownsStream = false;
  private audioContext: AudioContext | null = null;
  private worker: Worker | null = null;
  private workerChannel: MessageChannel | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private silentGain: GainNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private inputLevelMeter: PolyInputLevelMeter | null = null;
  private cachedInputLatencySec = 0;
  private generationId = 0;
  private readyKernel: string | null = null;
  private readySampleRate = 0;
  private callbacks: PolyPitchVoiceCallbacks | null = null;
  private inputChannel: 1 | 2 = 1;
  private echoCancellation = true;
  private expectedPitchClassMask = 0;
  private diagConnectRecorded = false;
  private operation: Promise<void> = Promise.resolve();
  private sessionId = 0;
  private workerStartupComplete = false;
  private workerReadyResolver: (() => void) | null = null;
  private workerReadyRejecter: ((error: Error) => void) | null = null;
  private workerReadyTimeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
  private diagnosticUnsubscribe: (() => void) | null = null;

  setExpectedPitchClassMask(mask: number): void {
    this.expectedPitchClassMask = mask & 0xfff;
    this.worker?.postMessage({
      type: 'setExpectedPitchClassMask',
      mask: this.expectedPitchClassMask,
    });
  }

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

  private clearWorkerReadyWait(): void {
    if (this.workerReadyTimeoutId !== null) {
      globalThis.clearTimeout(this.workerReadyTimeoutId);
      this.workerReadyTimeoutId = null;
    }
    this.workerReadyResolver = null;
    this.workerReadyRejecter = null;
  }

  private failWorkerReady(message: string): void {
    const rejecter = this.workerReadyRejecter;
    this.clearWorkerReadyWait();
    rejecter?.(new Error(message));
  }

  private waitForWorkerReady(): Promise<void> {
    this.workerStartupComplete = false;
    return new Promise((resolve, reject) => {
      this.workerReadyTimeoutId = globalThis.setTimeout(() => {
        this.clearWorkerReadyWait();
        reject(new Error(PITCH_PLEASE_START_ERROR));
      }, 30_000);
      this.workerReadyResolver = () => {
        this.workerStartupComplete = true;
        this.clearWorkerReadyWait();
        resolve();
      };
      this.workerReadyRejecter = reject;
    });
  }

  private syncDiagnosticsToWorker(): void {
    if (!this.worker) return;
    const enabled = pitchDiagnosticRecording.hasRecording || pitchDiagnosticRecording.enabled;
    this.worker.postMessage({ type: 'setDiagnostics', enabled });
  }

  private readonly onDiagnosticStateChange = (): void => {
    this.syncDiagnosticsToWorker();
    if (!pitchDiagnosticRecording.hasRecording && !pitchDiagnosticRecording.enabled) return;
    this.maybeRecordPolyConnect();
    if (!this.inputLevelMeter && this.stream) {
      this.inputLevelMeter = createPolyInputLevelMeter(this.stream);
    }
  };

  private onWorkerMessage = (event: MessageEvent): void => {
    const data = parsePolyPitchWorkerMessage(event.data);
    if (!data) return;
    const { type } = data;

    if (type === 'ready') {
      this.readyKernel = typeof data.kernel === 'string' ? data.kernel : null;
      this.readySampleRate = typeof data.sampleRate === 'number' ? data.sampleRate : 0;
      this.workerReadyResolver?.();
      return;
    }

    if (type === 'error') {
      const message = typeof data.message === 'string' && data.message.length > 0
        ? data.message
        : PITCH_PLEASE_START_ERROR;
      if (!this.workerStartupComplete && this.workerReadyRejecter) {
        this.failWorkerReady(message);
        return;
      }
      this.handleWorkerError(message);
      return;
    }

    if (type === 'polyDiagFrame' && data.levels) {
      this.recordPolyFrameSample(data.levels, data.inputDb ?? null);
      return;
    }

    const callbacks = this.callbacks;
    if (!callbacks) return;

    if (type === 'noteOn' && typeof data.note === 'number') {
      if (pitchDiagnosticRecording.enabled) {
        pitchDiagnosticRecording.record('polyNote', {
          engine: ENGINE,
          midi: data.note,
          kind: 'on',
          level: data.level,
        });
      }
      const domTimeStampMs = resolveDomTimeStampMs(
        data.audioContextTime,
        this.audioContext,
        this.cachedInputLatencySec,
      );
      this.activeNotes[data.note] = 1;
      callbacks.onNoteOn(data.note, domTimeStampMs);
      return;
    }

    if (type === 'noteOff' && typeof data.note === 'number') {
      if (pitchDiagnosticRecording.enabled) {
        pitchDiagnosticRecording.record('polyNote', {
          engine: ENGINE,
          midi: data.note,
          kind: 'off',
          level: data.level,
        });
      }
      this.activeNotes[data.note] = 0;
      callbacks.onNoteOff(data.note);
    }
  };

  private handleWorkerError(message: string): void {
    pitchDiagnosticRecording.record('polyError', { engine: ENGINE, message });
    this.callbacks?.onError?.(message);
    if (!this.workerStartupComplete) return;
    void this.disconnect();
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

    this.activeNotes.fill(0);
    this.inputChannel = inputChannel;
    this.echoCancellation = echoCancellation;
    this.diagFrameBatch.length = 0;
    this.diagInputDbBatch.length = 0;
    this.diagConnectRecorded = false;
    this.readyKernel = null;
    this.readySampleRate = 0;
    this.workerStartupComplete = false;
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

      const capturedChannels = capturedVoiceInputChannelCount(stream);
      if (inputChannel === 2 && (capturedChannels === null || capturedChannels < 2)) {
        await this.abandonOwned(owned);
        pitchDiagnosticRecording.recordPolyConnectionFailure(VOICE_INPUT_CHANNEL_UNAVAILABLE);
        callbacks.onError?.(VOICE_INPUT_CHANNEL_UNAVAILABLE);
        callbacks.onConnectionChange?.(false);
        this.dropCallbacks(callbacks);
        return false;
      }

      const AudioContextClass = resolveAudioContextConstructor();
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported');
      }

      owned.audioContext = new AudioContextClass({
        sampleRate: 48_000,
        latencyHint: 'interactive',
      });
      if (owned.audioContext.state === 'suspended') {
        await owned.audioContext.resume();
      }
      this.cachedInputLatencySec = resolveCachedInputLatencySec(stream, owned.audioContext);

      owned.worker = new Worker(
        new URL('../../workers/polyPitchWorker.ts', import.meta.url),
        { type: 'module' },
      );
      owned.worker.addEventListener('message', this.onWorkerMessage);
      owned.worker.addEventListener('error', () => {
        if (!this.workerStartupComplete && this.workerReadyRejecter) {
          this.failWorkerReady(PITCH_PLEASE_START_ERROR);
          return;
        }
        this.handleWorkerError(PITCH_PLEASE_START_ERROR);
      });

      owned.workerChannel = new MessageChannel();
      owned.worker.postMessage({ type: 'connectPort' }, [owned.workerChannel.port1]);

      const diagnosticsEnabled = pitchDiagnosticRecording.hasRecording || pitchDiagnosticRecording.enabled;
      owned.generationId = 1;
      this.generationId = owned.generationId;
      const readyWait = this.waitForWorkerReady();
      owned.worker.postMessage({
        type: 'init',
        generationId: owned.generationId,
        diagnosticsEnabled,
        expectedPitchClassMask: this.expectedPitchClassMask,
      });
      try {
        await readyWait;
      } catch (startupError) {
        const message = startupError instanceof Error && startupError.message.length > 0
          ? startupError.message
          : PITCH_PLEASE_START_ERROR;
        await this.abandonOwned(owned);
        pitchDiagnosticRecording.recordPolyConnectionFailure(message);
        callbacks.onError?.(message);
        callbacks.onConnectionChange?.(false);
        this.dropCallbacks(callbacks);
        return false;
      }

      if (sessionId !== this.sessionId) {
        await this.abandonOwned(owned);
        this.dropCallbacks(callbacks);
        return false;
      }

      await owned.audioContext.audioWorklet.addModule(CAPTURE_WORKLET_URL);
      owned.workletNode = new AudioWorkletNode(
        owned.audioContext,
        'pesto-capture-processor',
        {
          channelCountMode: 'max',
          channelInterpretation: 'discrete',
          processorOptions: { inputChannel: inputChannel - 1 },
        },
      );
      owned.workletNode.port.postMessage({
        type: 'connectWorker',
        port: owned.workerChannel.port2,
      }, [owned.workerChannel.port2]);
      owned.workletNode.port.postMessage({
        type: 'resetCapture',
        generationId: owned.generationId,
      });

      owned.silentGain = owned.audioContext.createGain();
      owned.silentGain.gain.value = 0;
      owned.silentGain.connect(owned.audioContext.destination);
      owned.sourceNode = owned.audioContext.createMediaStreamSource(stream);
      owned.sourceNode.connect(owned.workletNode);
      owned.workletNode.connect(owned.silentGain);

      if (diagnosticsEnabled) {
        owned.inputLevelMeter = createPolyInputLevelMeter(stream);
      }

      this.stream = owned.stream;
      this.ownsStream = owned.ownsStream;
      this.audioContext = owned.audioContext;
      this.worker = owned.worker;
      this.workerChannel = owned.workerChannel;
      this.workletNode = owned.workletNode;
      this.silentGain = owned.silentGain;
      this.sourceNode = owned.sourceNode;
      this.inputLevelMeter = owned.inputLevelMeter;
      this.generationId = owned.generationId;
      committed = true;
      this.diagnosticUnsubscribe = pitchDiagnosticRecording.subscribe(this.onDiagnosticStateChange);
      this.recordPolyConnectIfNeeded();
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

  private async abandonOwned(owned: OwnedPitchResources): Promise<void> {
    this.clearWorkerReadyWait();
    this.flushDiagFrameBatch();
    owned.worker?.removeEventListener('message', this.onWorkerMessage);
    owned.worker?.terminate();
    owned.worker = null;
    owned.workerChannel = null;
    owned.sourceNode?.disconnect?.();
    owned.sourceNode = null;
    owned.workletNode?.disconnect();
    owned.workletNode = null;
    owned.silentGain?.disconnect();
    owned.silentGain = null;
    owned.inputLevelMeter?.dispose();
    owned.inputLevelMeter = null;
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
    releaseActivePolyNotes(this.activeNotes, (midi) => callbacks.onNoteOff(midi));
    this.callbacks = null;
    this.diagConnectRecorded = false;
  }

  private async release(): Promise<void> {
    this.clearWorkerReadyWait();
    this.diagnosticUnsubscribe?.();
    this.diagnosticUnsubscribe = null;
    this.flushDiagFrameBatch();
    this.worker?.removeEventListener('message', this.onWorkerMessage);
    this.worker?.terminate();
    this.worker = null;
    this.workerChannel = null;
    this.workerStartupComplete = false;
    this.sourceNode?.disconnect?.();
    this.sourceNode = null;
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.silentGain?.disconnect();
    this.silentGain = null;
    this.inputLevelMeter?.dispose();
    this.inputLevelMeter = null;
    if (this.audioContext) {
      await this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
    if (this.ownsStream) {
      this.stream?.getTracks().forEach((track) => track.stop());
    }
    this.stream = null;
    this.ownsStream = false;
    this.cachedInputLatencySec = 0;
    const callbacks = this.callbacks;
    releaseActivePolyNotes(this.activeNotes, (midi) => callbacks?.onNoteOff(midi));
    callbacks?.onConnectionChange?.(false);
    this.callbacks = null;
    this.diagConnectRecorded = false;
    this.readyKernel = null;
    this.readySampleRate = 0;
  }

  private recordPolyConnectIfNeeded(): void {
    pitchDiagnosticRecording.clearLastPolyConnectionError();
    this.maybeRecordPolyConnect();
  }

  private maybeRecordPolyConnect(): void {
    if (this.diagConnectRecorded) return;
    if (!pitchDiagnosticRecording.hasRecording && !pitchDiagnosticRecording.enabled) return;
    this.diagConnectRecorded = true;
    pitchDiagnosticRecording.record('polyConnect', {
      engine: ENGINE,
      echoCancellation: this.echoCancellation,
      inputChannel: this.inputChannel,
      thresholds: PITCH_PLEASE_PIANO_THRESHOLDS,
      onsetConfig: DEFAULT_POLY_ONSET_CONFIG,
      kernel: this.readyKernel,
      sampleRate: this.readySampleRate,
    });
  }

  private flushDiagFrameBatch(): void {
    if (!pitchDiagnosticRecording.enabled || this.diagFrameBatch.length === 0) return;
    pitchDiagnosticRecording.record('polyFrames', {
      engine: ENGINE,
      frames: this.diagFrameBatch.splice(0),
      inputDb: this.diagInputDbBatch.splice(0),
      cpuLoad: 0,
    });
  }

  private recordPolyFrameSample(levels: number[][], inputDb: number | null): void {
    if (!pitchDiagnosticRecording.enabled) return;
    this.maybeRecordPolyConnect();
    if (!this.inputLevelMeter && this.stream) {
      this.inputLevelMeter = createPolyInputLevelMeter(this.stream);
    }
    const measuredDb = this.inputLevelMeter?.sampleInputDb() ?? inputDb;
    this.diagFrameBatch.push(levels);
    this.diagInputDbBatch.push(measuredDb);
    if (this.diagFrameBatch.length < DIAG_FRAME_BATCH_SIZE) return;
    this.flushDiagFrameBatch();
  }
}