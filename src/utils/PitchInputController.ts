/**
 * PitchInputController - PESTO v2 ONNX による音声入力コントローラー
 */

import { log } from '@/utils/logger';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const voiceUserMessage = (ja: string, en: string): string =>
  shouldUseEnglishCopy() ? en : ja;

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
  captureIntervalMs: number | null;
  inferenceMs: number | null;
}

const isVoiceInputSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof window !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia);

export class PitchInputController {
  private static _permissionGranted = false;
  private static _cachedStream: MediaStream | null = null;
  private static _latestLatencyStats: PitchInputLatencyStats = {
    captureIntervalMs: null,
    inferenceMs: null,
  };

  static isPermissionGranted(): boolean {
    return PitchInputController._permissionGranted;
  }

  static getLatencyStats(): PitchInputLatencyStats {
    return PitchInputController._latestLatencyStats;
  }

  private static resetLatencyStats(): void {
    PitchInputController._latestLatencyStats = {
      captureIntervalMs: null,
      inferenceMs: null,
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
  private sensitivityLevel = 5;
  private currentNote = -1;
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

  static async requestMicrophonePermission(deviceId?: string): Promise<boolean> {
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
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined },
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

  async connect(deviceId?: string): Promise<boolean> {
    return this.enqueue(() => this.connectInternal(deviceId));
  }

  private async connectInternal(deviceId?: string): Promise<boolean> {
    if (!PitchInputController.isSupported()) {
      this.onError?.(
        voiceUserMessage(
          '音声入力はこのブラウザでサポートされていません',
          'Voice input is not supported in this browser.',
        ),
      );
      return false;
    }

    try {
      await this.disconnectInternal(false);

      const cached = PitchInputController._cachedStream;
      if (cached) {
        const tracks = cached.getAudioTracks();
        const cachedDeviceId = tracks[0]?.getSettings().deviceId;
        const isAlive = tracks.length > 0 && tracks[0].readyState === 'live';
        const deviceMatch = !deviceId || cachedDeviceId === deviceId;
        if (isAlive && deviceMatch) {
          this.mediaStream = cached;
          PitchInputController._cachedStream = null;
        } else {
          cached.getTracks().forEach((t) => t.stop());
          PitchInputController._cachedStream = null;
        }
      }

      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        });
        PitchInputController._permissionGranted = true;
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

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      await this.setupWorker();
      await this.setupWorklet();

      const tracks = this.mediaStream.getAudioTracks();
      if (tracks.length > 0) {
        this.currentDeviceId = tracks[0].getSettings().deviceId ?? deviceId ?? null;
      }

      this.isProcessing = true;
      this.onConnectionChange?.(true);
      log.info('✅ PESTO 音声入力接続完了');
      return true;
    } catch (error) {
      log.error('PESTO 音声入力接続エラー:', error);
      this.onError?.(
        voiceUserMessage(
          'マイクへのアクセスに失敗しました。権限を確認してください。',
          'Could not access the microphone. Please check permissions.',
        ),
      );
      return false;
    }
  }

  private resolveDomTimeStampMs(audioContextTime: number | undefined): number | undefined {
    if (typeof audioContextTime !== 'number' || !Number.isFinite(audioContextTime)) {
      return undefined;
    }
    const ctx = this.audioContext;
    if (!ctx) return undefined;
    const deltaSec = audioContextTime - ctx.currentTime;
    return performance.now() + deltaSec * 1000;
  }

  private async setupWorker(): Promise<void> {
    this.worker = new Worker(
      new URL('../workers/pestoPitchWorker.ts', import.meta.url),
      { type: 'module' },
    );

    this.workerChannel = new MessageChannel();
    this.worker.postMessage({ type: 'connectPort' }, [this.workerChannel.port1]);

    this.worker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'noteOn') {
        if (this.currentNote !== -1 && this.currentNote !== data.note) {
          this.onNoteOff(this.currentNote);
        }
        this.currentNote = data.note;
        const domTimeStampMs = this.resolveDomTimeStampMs(data.audioContextTime);
        this.onNoteOn(data.note, 64, domTimeStampMs);
      } else if (data?.type === 'noteOff') {
        if (this.currentNote === data.note) {
          this.onNoteOff(data.note);
          this.currentNote = -1;
        }
      } else if (data?.type === 'monitor') {
        PitchInputController._latestLatencyStats = {
          captureIntervalMs: typeof data.captureIntervalMs === 'number'
            ? data.captureIntervalMs
            : null,
          inferenceMs: typeof data.inferenceMs === 'number'
            ? data.inferenceMs
            : null,
        };
      } else if (data?.type === 'error') {
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
      this.worker?.postMessage({
        type: 'init',
        sensitivity: this.sensitivityLevel,
      });
    });
  }

  private async setupWorklet(): Promise<void> {
    if (!this.audioContext || !this.mediaStream || !this.workerChannel) {
      throw new Error('AudioContext, mediaStream, or worker channel not initialized');
    }

    await this.audioContext.audioWorklet.addModule('/js/audio/pesto-capture-worklet.js');
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'pesto-capture-processor',
    );

    this.workletNode.port.postMessage({
      type: 'connectWorker',
      port: this.workerChannel.port2,
    }, [this.workerChannel.port2]);

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
    this.worker?.postMessage({
      type: 'setSensitivity',
      sensitivity: this.sensitivityLevel,
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
    this.isProcessing = false;
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
