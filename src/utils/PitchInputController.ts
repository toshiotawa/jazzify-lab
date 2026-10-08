/**
 * PitchInputController - PESTO v2 ONNX による音声入力コントローラー
 */

import { log } from '@/utils/logger';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { isPitchDiagnosticsEnabled } from '@/utils/pitchInput/pitchInputDevFlags';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import {
  downloadPitchFrameTrace,
  downloadPitchFrameTraceEntries,
  type PitchFrameTraceEntry,
} from '@/utils/pitchInput/pitchFrameTrace';
import {
  EMPTY_EXPECTED_PITCH_CANDIDATES,
  type ExpectedPitchCandidates,
} from '@/utils/pitchInput/expectedPitchCandidates';
import type { PitchInputDiagnosticSnapshot, PestoShiftSemitones } from '@/utils/pitchInput/pitchInputTypes';
const voiceUserMessage = (ja: string, en: string): string =>
  shouldUseEnglishCopy() ? en : ja;

const channelUnavailableMessage = (): string => voiceUserMessage(
  '入力2を選択できません。ブラウザから2チャンネルの音声を取得できていません。入力1または別の入力デバイスを選択してください。',
  'Input 2 is unavailable: the browser did not provide two audio channels. Select Input 1 or another input device.',
);

// 権限取得と本接続で同じ設定を使い、ブラウザ既定の AGC/NS を引き継がない。
const microphoneConstraints = (deviceId?: string, echoCancellation = true, inputChannel: 1 | 2 = 1): MediaTrackConstraints => ({
  deviceId: deviceId ? { exact: deviceId } : undefined,
  channelCount: inputChannel === 2 ? { exact: 2 } : { ideal: 2 },
  echoCancellation,
  noiseSuppression: false,
  autoGainControl: false,
});

export interface PitchInputCallbacks {
  onNoteOn: (note: number, velocity?: number, domTimeStampMs?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

interface AudioDeviceInfo {
  deviceId: string;
  label: string;
}

interface GetAudioDevicesOptions {
  requestPermission?: boolean;
}

export interface PitchInputLatencyStats {
  inputChannel: 1 | 2 | null;
  captureChannelCount: number | null;
  inputError: string | null;
  captureIntervalMs: number | null;
  inferenceMs: number | null;
  inputLevelDb: number | null;
  diagnostics: PitchInputDiagnosticSnapshot | null;
}

const isVoiceInputSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof window !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia);

export class PitchInputController {
  private static readonly activeControllers = new Set<PitchInputController>();

  static setDiagnosticRecording(enabled: boolean): void {
    if (enabled) pitchDiagnosticRecording.start();
    else pitchDiagnosticRecording.stop();
    for (const controller of PitchInputController.activeControllers) {
      controller.configureDiagnostics();
      controller.recordDiagnostic('recordingState');
    }
  }

  static async downloadDiagnostics(): Promise<void> {
    const requests: Promise<void>[] = [];
    for (const controller of PitchInputController.activeControllers) {
      controller.recordDiagnostic('exportState');
      requests.push(controller.requestDiagnosticState());
    }
    await Promise.all(requests);
    pitchDiagnosticRecording.download();
  }

  private requestDiagnosticState(): Promise<void> {
    const worker = this.worker;
    if (!worker || !pitchDiagnosticRecording.enabled) return Promise.resolve();
    return new Promise((resolve) => {
      const finish = (): void => {
        clearTimeout(timeout);
        worker.removeEventListener('message', onMessage);
        resolve();
      };
      const onMessage = (event: MessageEvent<{ type?: string }>): void => {
        if (event.data?.type !== 'diagnosticState') return;
        this.recordDiagnostic('workerState', { state: event.data });
        finish();
      };
      // A stalled Worker must not prevent downloading the history already collected.
      const timeout = setTimeout(() => {
        this.recordDiagnostic('workerStateTimeout');
        finish();
      }, 1500);
      worker.addEventListener('message', onMessage);
      worker.postMessage({ type: 'dumpDiagnostics' });
    });
  }

  private static _permissionGranted = false;
  private static _cachedStream: MediaStream | null = null;
  private static _latestLatencyStats: PitchInputLatencyStats = {
    inputChannel: null,
    captureChannelCount: null,
    inputError: null,
    captureIntervalMs: null,
    inferenceMs: null,
    inputLevelDb: null,
    diagnostics: null,
  };

  static isPermissionGranted(): boolean {
    return PitchInputController._permissionGranted;
  }

  static getLatencyStats(): PitchInputLatencyStats {
    return PitchInputController._latestLatencyStats;
  }

  static downloadFrameTrace(): void {
    downloadPitchFrameTrace();
  }

  async requestFrameTraceDump(): Promise<void> {
    const worker = this.worker;
    if (!worker || !isPitchDiagnosticsEnabled()) {
      downloadPitchFrameTrace();
      return;
    }
    await new Promise<void>((resolve) => {
      const onMessage = (event: MessageEvent<{ type?: string; entries?: PitchFrameTraceEntry[] }>): void => {
        if (event.data?.type !== 'frameTrace') {
          return;
        }
        worker.removeEventListener('message', onMessage);
        downloadPitchFrameTraceEntries(event.data.entries ?? []);
        resolve();
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage({ type: 'dumpFrameTrace' });
    });
  }

  private static resetLatencyStats(): void {
    PitchInputController._latestLatencyStats = {
      inputChannel: null,
      captureChannelCount: null,
      inputError: null,
      captureIntervalMs: null,
      inferenceMs: null,
      inputLevelDb: null,
      diagnostics: null,
    };
  }

  static clearCachedPermission(): void {
    if (PitchInputController._cachedStream) {
      PitchInputController._cachedStream.getTracks().forEach((t) => t.stop());
      PitchInputController._cachedStream = null;
    }
    PitchInputController._permissionGranted = false;
  }

  private onNoteOn: (note: number, velocity?: number, domTimeStampMs?: number) => void;
  private onNoteOff: (note: number) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private onError?: (error: string) => void;

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private silentGainNode: GainNode | null = null;
  private worker: Worker | null = null;
  private workerChannel: MessageChannel | null = null;
  private currentDeviceId: string | null = null;
  private isProcessing = false;
  private echoCancellation = true;
  private inputChannel: 1 | 2 = 1;
  private captureChannelCount: number | null = null;
  private sensitivityLevel = 5;
  private pitchStableFrames = 4;
  private expectedPitchMask = 0;
  private expectedPitchMidis: number[] = [];
  private repeatPitchClassMask = 0;
  private currentNote = -1;
  private cachedInputLatencySec = 0;
  private generationId = 0;
  private shiftSemitones: PestoShiftSemitones = 0;
  private diagnosticTrack: MediaStreamTrack | null = null;
  private lastMonitorAtMs: number | null = null;
  private lastNoteAtMs: number | null = null;
  private readonly diagnosticCleanups: (() => void)[] = [];

  private recordDiagnostic(event: string, details?: object): void {
    if (!pitchDiagnosticRecording.enabled) return;
    const now = performance.now();
    pitchDiagnosticRecording.record(event, {
      generationId: this.generationId,
      audioContextState: this.audioContext?.state ?? null,
      audioContextTime: this.audioContext?.currentTime ?? null,
      trackState: this.diagnosticTrack?.readyState ?? null,
      trackMuted: this.diagnosticTrack?.muted ?? null,
      visibility: document.visibilityState,
      processing: this.isProcessing,
      monitorAgeMs: this.lastMonitorAtMs === null ? null : now - this.lastMonitorAtMs,
      noteAgeMs: this.lastNoteAtMs === null ? null : now - this.lastNoteAtMs,
      currentNote: this.currentNote,
      echoCancellation: this.echoCancellation,
      inputChannel: this.inputChannel,
      captureChannelCount: this.captureChannelCount,
      sensitivity: this.sensitivityLevel,
      stableFrames: this.pitchStableFrames,
      shiftSemitones: this.shiftSemitones,
      expectedPitchMask: this.expectedPitchMask,
      expectedPitchMidis: this.expectedPitchMidis,
      repeatPitchClassMask: this.repeatPitchClassMask,
      ...details,
    });
  }

  private configureDiagnostics(): void {
    const settings = this.diagnosticTrack?.getSettings();
    this.worker?.postMessage({
      type: 'setDiagnostics',
      config: isPitchDiagnosticsEnabled() || pitchDiagnosticRecording.enabled
        ? {
            deviceLabel: this.diagnosticTrack?.label ?? null,
            sampleRate: settings?.sampleRate ?? this.audioContext?.sampleRate ?? null,
            requestedEchoCancellation: this.echoCancellation,
            actualEchoCancellation: settings?.echoCancellation ?? null,
            shiftSemitones: this.shiftSemitones,
            generationId: this.generationId,
          }
        : null,
    });
  }

  private watchDiagnosticEvents(target: EventTarget, events: readonly string[], prefix: string): void {
    for (const event of events) {
      const listener = (): void => this.recordDiagnostic(`${prefix}:${event}`);
      target.addEventListener(event, listener);
      this.diagnosticCleanups.push(() => target.removeEventListener(event, listener));
    }
  }
  /**
   * connect / disconnect は AudioContext と Worker（ONNX セッション 17MB）を作り直すため、
   * 並行実行すると孤児リソースが残る。直列化して必ず順番に処理する。
   */
  private opChain: Promise<void> = Promise.resolve();

  constructor(callbacks: PitchInputCallbacks) {
    this.onNoteOn = callbacks.onNoteOn;
    this.onNoteOff = callbacks.onNoteOff;
    this.onConnectionChange = callbacks.onConnectionChange;
    this.onError = callbacks.onError;
  }

  static isSupported(): boolean {
    return isVoiceInputSupported();
  }

  static isIOS(): boolean {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async getAudioDevices(options?: GetAudioDevicesOptions): Promise<AudioDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      if (options?.requestPermission && !PitchInputController._permissionGranted) {
        const ok = await PitchInputController.requestMicrophonePermission();
        if (!ok) return [];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`,
        }));
    } catch (error) {
      log.warn('オーディオデバイスリストの取得に失敗:', error);
      return [];
    }
  }

  static async requestMicrophonePermission(deviceId?: string, echoCancellation = true): Promise<boolean> {
    if (!isVoiceInputSupported() || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    if (PitchInputController._permissionGranted) {
      return true;
    }

    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (status.state === 'granted') {
          PitchInputController._permissionGranted = true;
          return true;
        }
      } catch {
        // Safari 等は未対応
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneConstraints(deviceId, echoCancellation),
        video: false,
      });
      if (PitchInputController._cachedStream) {
        PitchInputController._cachedStream.getTracks().forEach((t) => t.stop());
      }
      PitchInputController._cachedStream = stream;
      PitchInputController._permissionGranted = true;
      return true;
    } catch (error) {
      log.warn('マイク権限の取得に失敗:', error);
      return false;
    }
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.opChain.then(task, task);
    this.opChain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async connect(deviceId?: string, echoCancellation = true, inputChannel: 1 | 2 = 1): Promise<boolean> {
    return this.enqueue(() => this.connectInternal(deviceId, echoCancellation, inputChannel));
  }

  private async connectInternal(deviceId: string | undefined, echoCancellation: boolean, inputChannel: 1 | 2): Promise<boolean> {
    if (!PitchInputController.isSupported()) {
      this.onError?.(
        voiceUserMessage(
          '音声入力はこのブラウザでサポートされていません',
          'Voice input is not supported in this browser.',
        ),
      );
      return false;
    }

    let channelUnavailable = false;
    try {
      await this.disconnectInternal(false);
      this.echoCancellation = echoCancellation;
      this.inputChannel = inputChannel;
      this.captureChannelCount = null;
      PitchInputController.activeControllers.add(this);
      this.recordDiagnostic('connectStarted');

      const cached = PitchInputController._cachedStream;
      if (cached) {
        const tracks = cached.getAudioTracks();
        const cachedDeviceId = tracks[0]?.getSettings().deviceId;
        const isAlive = tracks.length > 0 && tracks[0].readyState === 'live';
        const deviceMatch = !deviceId || cachedDeviceId === deviceId;
        if (isAlive && deviceMatch) {
          this.mediaStream = cached;
          PitchInputController._cachedStream = null;
          await tracks[0].applyConstraints(microphoneConstraints(deviceId, echoCancellation, inputChannel));
        } else {
          cached.getTracks().forEach((t) => t.stop());
          PitchInputController._cachedStream = null;
        }
      }

      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: microphoneConstraints(deviceId, echoCancellation, inputChannel),
          video: false,
        });
        PitchInputController._permissionGranted = true;
      }

      this.captureChannelCount = this.mediaStream.getAudioTracks()[0]?.getSettings().channelCount ?? null;
      if (inputChannel === 2 && (this.captureChannelCount === null || this.captureChannelCount < 2)) {
        channelUnavailable = true;
        throw new Error(channelUnavailableMessage());
      }

      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported');
      }

      this.audioContext = new AudioContextClass({
        sampleRate: 48000,
        latencyHint: 'interactive',
      });
      this.diagnosticTrack = this.mediaStream.getAudioTracks()[0] ?? null;
      this.watchDiagnosticEvents(this.audioContext, ['statechange'], 'audioContext');
      if (this.diagnosticTrack) {
        this.watchDiagnosticEvents(this.diagnosticTrack, ['mute', 'unmute', 'ended'], 'track');
      }
      this.watchDiagnosticEvents(document, ['visibilitychange'], 'document');
      this.watchDiagnosticEvents(window, ['pagehide', 'pageshow', 'offline', 'online'], 'window');

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.cachedInputLatencySec = this.resolveCachedInputLatencySec();

      await this.setupWorker();
      this.configureDiagnostics();
      await this.setupWorklet();

      const tracks = this.mediaStream.getAudioTracks();
      if (tracks.length > 0) {
        this.currentDeviceId = tracks[0].getSettings().deviceId ?? deviceId ?? null;
      }

      this.isProcessing = true;
      if (pitchDiagnosticRecording.enabled) {
        const settings = this.diagnosticTrack?.getSettings();
        this.recordDiagnostic('connected', { trackSettings: {
          sampleRate: settings?.sampleRate,
          channelCount: settings?.channelCount,
          echoCancellation: settings?.echoCancellation,
          noiseSuppression: settings?.noiseSuppression,
          autoGainControl: settings?.autoGainControl,
        } });
      }
      this.onConnectionChange?.(true);
      log.info('✅ PESTO 音声入力接続完了');
      return true;
    } catch (error) {
      this.recordDiagnostic('connectError', { message: error instanceof Error ? error.message : String(error) });
      await this.disconnectInternal(false);
      log.error('PESTO 音声入力接続エラー:', error);
      const inputError = channelUnavailable || (error instanceof Error && error.name === 'OverconstrainedError'
        && 'constraint' in error && error.constraint === 'channelCount')
        ? channelUnavailableMessage()
        : voiceUserMessage(
          'マイクへのアクセスに失敗しました。権限を確認してください。',
          'Could not access the microphone. Please check permissions.',
        );
      PitchInputController._latestLatencyStats = {
        ...PitchInputController._latestLatencyStats,
        inputError,
      };
      this.onError?.(inputError);
      return false;
    }
  }

  private resolveCachedInputLatencySec(): number {
    const track = this.mediaStream?.getAudioTracks()[0];
    if (track) {
      const settings = track.getSettings() as MediaTrackSettings & { latency?: number };
      if (
        typeof settings.latency === 'number'
        && Number.isFinite(settings.latency)
        && settings.latency > 0
      ) {
        return settings.latency;
      }
    }
    const ctx = this.audioContext;
    if (ctx && typeof ctx.baseLatency === 'number' && Number.isFinite(ctx.baseLatency)) {
      return ctx.baseLatency;
    }
    return 0;
  }

  private resolveDomTimeStampMs(audioContextTime: number | undefined): number | undefined {
    if (typeof audioContextTime !== 'number' || !Number.isFinite(audioContextTime)) {
      return undefined;
    }
    const ctx = this.audioContext;
    if (!ctx) return undefined;
    const adjustedCtxTime = audioContextTime - this.cachedInputLatencySec;
    const deltaSec = adjustedCtxTime - ctx.currentTime;
    return performance.now() + deltaSec * 1000;
  }

  private async setupWorker(): Promise<void> {
    this.worker = new Worker(
      new URL('../workers/pestoPitchWorker.ts', import.meta.url),
      { type: 'module' },
    );

    this.workerChannel = new MessageChannel();
    this.worker.postMessage({ type: 'connectPort' }, [this.workerChannel.port1]);
    this.worker.addEventListener('error', (event: ErrorEvent) => {
      this.recordDiagnostic('workerError', { message: event.message });
    });
    this.worker.addEventListener('messageerror', () => this.recordDiagnostic('workerMessageError'));

    this.worker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'noteOn') {
        if (this.currentNote !== -1 && this.currentNote !== data.note) {
          this.onNoteOff(this.currentNote);
        }
        this.currentNote = data.note;
        this.lastNoteAtMs = performance.now();
        if (pitchDiagnosticRecording.enabled) {
          this.recordDiagnostic('noteOn', { note: data.note, audioContextTimeOfNote: data.audioContextTime });
        }
        const domTimeStampMs = this.resolveDomTimeStampMs(data.audioContextTime);
        this.onNoteOn(data.note, 64, domTimeStampMs);
      } else if (data?.type === 'noteOff') {
        if (pitchDiagnosticRecording.enabled) this.recordDiagnostic('noteOff', { note: data.note });
        if (this.currentNote === data.note) {
          this.onNoteOff(data.note);
          this.currentNote = -1;
        }
      } else if (data?.type === 'monitor') {
        if (pitchDiagnosticRecording.enabled) this.recordDiagnostic('monitor', { monitor: data });
        this.lastMonitorAtMs = performance.now();
        PitchInputController._latestLatencyStats = {
          inputChannel: this.inputChannel,
          captureChannelCount: this.captureChannelCount,
          inputError: null,
          captureIntervalMs: typeof data.captureIntervalMs === 'number'
            ? data.captureIntervalMs
            : null,
          inferenceMs: typeof data.inferenceMs === 'number'
            ? data.inferenceMs
            : null,
          inputLevelDb: typeof data.inputLevelDb === 'number' && Number.isFinite(data.inputLevelDb)
            ? data.inputLevelDb
            : null,
          diagnostics: (isPitchDiagnosticsEnabled() || pitchDiagnosticRecording.enabled) && data.diagnostics
            ? data.diagnostics as PitchInputDiagnosticSnapshot
            : null,
        };
      } else if (data?.type === 'error') {
        this.recordDiagnostic('inferenceError', { message: data.message });
        this.onError?.(data.message);
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Worker init timeout')), 30000);
      const onReady = (event: MessageEvent): void => {
        if (event.data?.type === 'ready') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', onReady);
          resolve();
        } else if (event.data?.type === 'error') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', onReady);
          reject(new Error(event.data.message));
        }
      };
      this.worker?.addEventListener('message', onReady);
      this.generationId += 1;
      const track = this.mediaStream?.getAudioTracks()[0];
      const settings = track?.getSettings();
      this.worker?.postMessage({
        type: 'init',
        sensitivity: this.sensitivityLevel,
        generationId: this.generationId,
        shiftSemitones: this.shiftSemitones,
        config: {
          pitchStableFrames: this.pitchStableFrames,
          fastResponse: this.pitchStableFrames <= 2,
        },
        expectedPitchMask: this.expectedPitchMask,
        expectedPitchMidis: this.expectedPitchMidis,
        repeatPitchClassMask: this.repeatPitchClassMask,
        diagnostics: isPitchDiagnosticsEnabled() || pitchDiagnosticRecording.enabled
          ? {
              deviceLabel: track?.label ?? null,
              sampleRate: typeof settings?.sampleRate === 'number' ? settings.sampleRate : null,
              requestedEchoCancellation: this.echoCancellation,
              actualEchoCancellation: typeof settings?.echoCancellation === 'boolean'
                ? settings.echoCancellation
                : null,
            }
          : undefined,
      });
    });
  }

  private async setupWorklet(): Promise<void> {
    if (!this.audioContext || !this.mediaStream || !this.workerChannel) {
      throw new Error('AudioContext, mediaStream, or worker channel not initialized');
    }

    await this.audioContext.audioWorklet.addModule('/js/audio/pesto-capture-worklet.js?v=input-channel-2');
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'pesto-capture-processor',
      {
        channelCountMode: 'max',
        channelInterpretation: 'discrete',
        processorOptions: { inputChannel: this.inputChannel - 1 },
      },
    );
    this.workletNode.addEventListener('processorerror', () => this.recordDiagnostic('workletProcessorError'));

    this.workletNode.port.postMessage({
      type: 'connectWorker',
      port: this.workerChannel.port2,
    }, [this.workerChannel.port2]);
    this.workletNode.port.postMessage({
      type: 'resetCapture',
      generationId: this.generationId,
    });

    if (!this.silentGainNode) {
      this.silentGainNode = this.audioContext.createGain();
      this.silentGainNode.gain.value = 0;
      this.silentGainNode.connect(this.audioContext.destination);
    }

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(this.workletNode);
    this.workletNode.connect(this.silentGainNode);
  }

  setSensitivity(level: number): void {
    this.sensitivityLevel = Math.max(1, Math.min(10, Math.round(level)));
    this.recordDiagnostic('sensitivityChanged');
    this.worker?.postMessage({
      type: 'setSensitivity',
      sensitivity: this.sensitivityLevel,
    });
    this.postOnsetConfig();
  }

  setPitchStableFrames(frames: number): void {
    this.pitchStableFrames = Math.max(1, Math.min(8, Math.round(frames)));
    this.recordDiagnostic('stableFramesChanged');
    this.postOnsetConfig();
  }

  /** Phrase Defense の期待 pitch class。0 で補助オフ。自由演奏では 0 のまま。 */
  setExpectedPitchMask(mask: number): void {
    this.setExpectedPitchCandidates({
      ...EMPTY_EXPECTED_PITCH_CANDIDATES,
      pitchClassMask: mask,
    });
  }

  setExpectedPitchCandidates(candidates: ExpectedPitchCandidates): void {
    this.expectedPitchMask = candidates.pitchClassMask & 0xfff;
    this.expectedPitchMidis = candidates.midis.map((midi) => Math.round(midi));
    this.repeatPitchClassMask = candidates.repeatPitchClassMask & 0xfff;
    this.worker?.postMessage({
      type: 'setExpectedPitchCandidates',
      mask: this.expectedPitchMask,
      midis: this.expectedPitchMidis,
      repeatPitchClassMask: this.repeatPitchClassMask,
    });
  }

  private postOnsetConfig(): void {
    this.worker?.postMessage({
      type: 'setOnsetConfig',
      config: {
        pitchStableFrames: this.pitchStableFrames,
        fastResponse: this.pitchStableFrames <= 2,
      },
    });
  }

  /** 低音読み取り。接続中の切替はキャッシュを捨てて新しい世代で再開する。 */
  setLowRegister(enabled: boolean): void {
    const next: PestoShiftSemitones = enabled ? 12 : 0;
    const changed = this.shiftSemitones !== next;
    this.shiftSemitones = next;
    if (changed) this.recordDiagnostic('lowRegisterChanged');
    if (!changed || !this.worker) return;
    this.generationId += 1;
    this.worker.postMessage({
      type: 'setShiftSemitones',
      shiftSemitones: next,
      generationId: this.generationId,
    });
    this.workletNode?.port.postMessage({
      type: 'resetCapture',
      generationId: this.generationId,
    });
  }

  getSensitivity(): number {
    return this.sensitivityLevel;
  }

  isConnected(): boolean {
    return this.isProcessing && this.mediaStream !== null;
  }

  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  async disconnect(): Promise<void> {
    await this.enqueue(() => this.disconnectInternal(true));
  }

  private async disconnectInternal(notify: boolean): Promise<void> {
    if (this.audioContext || this.worker) this.recordDiagnostic('disconnect');
    PitchInputController.activeControllers.delete(this);
    for (const cleanup of this.diagnosticCleanups) cleanup();
    this.diagnosticCleanups.length = 0;
    this.diagnosticTrack = null;
    this.lastMonitorAtMs = null;
    this.lastNoteAtMs = null;
    this.isProcessing = false;
    this.cachedInputLatencySec = 0;
    PitchInputController.resetLatencyStats();

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    // port1/port2 は Worker と Worklet へ transfer 済みで detach されている。
    // 参照を捨てるだけでよく、close() を呼ぶ意味はない。
    this.workerChannel = null;

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.silentGainNode) {
      try {
        this.silentGainNode.disconnect();
      } catch {
        // ignore
      }
      this.silentGainNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }

    if (this.currentNote !== -1) {
      this.onNoteOff(this.currentNote);
      this.currentNote = -1;
    }

    this.currentDeviceId = null;
    if (notify) {
      this.onConnectionChange?.(false);
    }
  }

  destroy(): void {
    void this.disconnect();
  }
}
