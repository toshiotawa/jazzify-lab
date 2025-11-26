/**
 * AudioController - WASMピッチ検出による音声入力コントローラー
 * 
 * 特徴:
 * - 軽量・低レイテンシ
 * - 単音検出（モノフォニック）
 * - iOS対応
 */

// WASMモジュールの型定義
interface WasmModule {
  analyze_pitch: (ptr: number, length: number, sampleRate: number, yinThreshold: number) => number;
  init_pitch_detector: (sampleRate: number) => void;
  get_ring_buffer_ptr: () => number;
  get_ring_buffer_size: () => number;
  process_audio_block: (newWriteIndex: number) => number;
  alloc: (size: number) => number;
  free: (ptr: number, size: number) => void;
  get_memory: () => WebAssembly.Memory;
}

// Audio Worklet用のメッセージ型
interface WorkletMessage {
  type: 'samples' | 'init';
  samples?: Float32Array;
  ptr?: number;
  ringSize?: number;
}

// デバイス情報
export interface AudioDevice {
  id: string;
  name: string;
  isDefault?: boolean;
}

// コールバック型
type NoteOnCallback = (note: number) => void;
type NoteOffCallback = (note: number) => void;
type ConnectionChangeCallback = (connected: boolean) => void;

// iOS検出ユーティリティ
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || 
    (/Macintosh/.test(ua) && 'ontouchend' in document);
};

/**
 * AudioController クラス
 * マイク入力からピッチを検出し、MIDIノートに変換する
 */
export class AudioController {
  // コールバック
  private onNoteOn: NoteOnCallback | null = null;
  private onNoteOff: NoteOffCallback | null = null;
  private onConnectionChange: ConnectionChangeCallback | null = null;

  // Audio Context
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  
  // WASM関連
  private wasmModule: WasmModule | null = null;
  private wasmMemory: WebAssembly.Memory | null = null;
  private ringBufferPtr = 0;
  private ringSize = 0;
  private writeIndex = 0;
  
  // 状態
  private isProcessing = false;
  private currentDeviceId: string | null = null;
  private isIOSDevice = isIOS();
  
  // ピッチ検出パラメータ
  private readonly bufferSize = 512;
  private readonly minFrequency = 27.5;  // A0
  private readonly maxFrequency = 4186.01; // C8
  private readonly yinThreshold = 0.1;
  private readonly noteOnThreshold = 0.05;
  private readonly noteOffThreshold = 0.03;
  private sampleRate = 44100;
  
  // ピッチ履歴とノート状態
  private pitchHistory: number[] = [];
  private readonly pitchHistorySize = 3;
  private currentNote = -1;
  private isNoteOn = false;
  private lastDetectedFrequency = 0;
  
  // 周波数テーブル（MIDIノート -> 周波数）
  private noteFrequencies: Map<number, number> = new Map();
  
  constructor(onNoteOn?: NoteOnCallback, onNoteOff?: NoteOffCallback) {
    this.onNoteOn = onNoteOn || null;
    this.onNoteOff = onNoteOff || null;
    this.initializeNoteFrequencies();
  }

  /**
   * 周波数テーブル初期化（A0からC8まで）
   */
  private initializeNoteFrequencies(): void {
    for (let i = 21; i <= 108; i++) {
      const frequency = 440 * Math.pow(2, (i - 69) / 12);
      this.noteFrequencies.set(i, frequency);
    }
  }

  /**
   * WASMモジュールを初期化
   */
  async initWasm(): Promise<void> {
    if (this.wasmModule) return;
    
    try {
      const wasmUrl = new URL('/wasm/pitch_detector_bg.wasm', window.location.origin);
      const response = await fetch(wasmUrl);
      const wasmBytes = await response.arrayBuffer();
      
      const imports = {
        wbg: {
          __wbg_log_c222819a41e063d3: () => { /* Debug log disabled */ },
          __wbindgen_init_externref_table: () => {
            // Required by WASM bindgen
          },
          __wbindgen_memory: () => this.wasmMemory,
          __wbindgen_string_new: () => '',
          __wbindgen_throw: (ptr: number, len: number) => {
            throw new Error(`WASM error at ${ptr}:${len}`);
          }
        }
      };

      const { instance } = await WebAssembly.instantiate(wasmBytes, imports);
      this.wasmModule = instance.exports as unknown as WasmModule;
      this.wasmMemory = this.wasmModule.get_memory();
      
    } catch (error) {
      // WASM初期化失敗時はフォールバックモードで動作
      this.wasmModule = null;
    }
  }

  /**
   * コールバック設定
   */
  setCallbacks(
    onNoteOn: NoteOnCallback,
    onNoteOff: NoteOffCallback,
    onConnectionChange?: ConnectionChangeCallback
  ): void {
    this.onNoteOn = onNoteOn;
    this.onNoteOff = onNoteOff;
    if (onConnectionChange) {
      this.onConnectionChange = onConnectionChange;
    }
  }

  /**
   * オーディオデバイス一覧を取得
   */
  async getDevices(): Promise<AudioDevice[]> {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
      return [];
    }

    try {
      // まずマイク許可を取得（ラベル取得のため）
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      return audioInputs.map(device => ({
        id: device.deviceId,
        name: device.label || `マイク ${device.deviceId.slice(0, 4)}`,
        isDefault: device.deviceId === 'default'
      }));
    } catch {
      return [];
    }
  }

  /**
   * デバイスに接続
   */
  async connectDevice(deviceId?: string): Promise<boolean> {
    try {
      // 既存接続を切断
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // getUserMedia の存在確認
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        this.notifyConnectionChange(false);
        return false;
      }

      // マイク許可を取得
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // AudioContext作成
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.sampleRate = this.audioContext.sampleRate;

      // WASM初期化
      await this.initWasm();
      if (this.wasmModule) {
        this.wasmModule.init_pitch_detector(this.sampleRate);
        this.ringBufferPtr = this.wasmModule.get_ring_buffer_ptr();
        this.ringSize = this.wasmModule.get_ring_buffer_size();
        this.writeIndex = 0;
      }

      // オーディオソース作成
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorkletまたはScriptProcessor
      if (window.AudioWorkletNode) {
        await this.setupAudioWorklet(source);
      } else {
        this.setupScriptProcessor(source);
      }

      this.currentDeviceId = deviceId || null;
      this.isProcessing = true;
      this.notifyConnectionChange(true);
      
      return true;
    } catch {
      this.notifyConnectionChange(false);
      return false;
    }
  }

  /**
   * AudioWorkletセットアップ
   */
  private async setupAudioWorklet(source: MediaStreamAudioSourceNode): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Workletモジュール登録
      await this.audioContext.audioWorklet.addModule('/js/audio/audio-worklet-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

      // メッセージハンドラ
      this.workletNode.port.onmessage = (e: MessageEvent<WorkletMessage>) => {
        if (e.data.type === 'samples' && e.data.samples) {
          this.processAudioSamples(e.data.samples);
        }
      };

      // 初期化メッセージ
      this.workletNode.port.postMessage({
        type: 'init',
        ptr: this.ringBufferPtr,
        ringSize: this.ringSize
      });

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
    } catch {
      // フォールバック
      this.setupScriptProcessor(source);
    }
  }

  /**
   * ScriptProcessor フォールバック
   */
  private setupScriptProcessor(source: MediaStreamAudioSourceNode): void {
    if (!this.audioContext) return;

    this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
    this.scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.processAudioSamples(inputData);
    };
    
    source.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  /**
   * オーディオサンプルを処理
   */
  private processAudioSamples(samples: Float32Array): void {
    if (!this.isProcessing) return;

    // 振幅チェック
    let maxAmplitude = 0;
    for (let i = 0; i < samples.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(samples[i]));
    }

    // ノートオン/オフ状態更新
    if (!this.isNoteOn && maxAmplitude > this.noteOnThreshold) {
      this.isNoteOn = true;
    } else if (this.isNoteOn && maxAmplitude < this.noteOffThreshold) {
      this.isNoteOn = false;
      this.handleNoPitch();
      return;
    }

    if (!this.isNoteOn) return;

    // WASMピッチ検出
    let frequency = 0;
    if (this.wasmModule && this.wasmMemory) {
      frequency = this.detectPitchWithWasm(samples);
    } else {
      // フォールバック: 自己相関法
      frequency = this.detectPitchFallback(samples);
    }

    if (frequency > 0 && frequency >= this.minFrequency && frequency <= this.maxFrequency) {
      this.handleDetectedPitch(frequency);
    } else {
      this.handleNoPitch();
    }
  }

  /**
   * WASMでピッチ検出
   */
  private detectPitchWithWasm(samples: Float32Array): number {
    if (!this.wasmModule || !this.wasmMemory) return 0;

    try {
      const byteLength = samples.length * Float32Array.BYTES_PER_ELEMENT;
      const ptr = this.wasmModule.alloc(byteLength);
      const wasmArray = new Float32Array(this.wasmMemory.buffer, ptr, samples.length);
      wasmArray.set(samples);
      
      const frequency = this.wasmModule.analyze_pitch(
        ptr, 
        byteLength, 
        this.sampleRate, 
        this.yinThreshold
      );
      
      this.wasmModule.free(ptr, byteLength);
      return frequency;
    } catch {
      return 0;
    }
  }

  /**
   * フォールバック: 自己相関法によるピッチ検出
   */
  private detectPitchFallback(samples: Float32Array): number {
    const n = samples.length;
    const maxLag = Math.floor(this.sampleRate / this.minFrequency);
    const minLag = Math.floor(this.sampleRate / this.maxFrequency);
    
    let bestCorrelation = 0;
    let bestLag = 0;

    for (let lag = minLag; lag <= maxLag && lag < n; lag++) {
      let correlation = 0;
      for (let i = 0; i < n - lag; i++) {
        correlation += samples[i] * samples[i + lag];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    return bestLag > 0 ? this.sampleRate / bestLag : 0;
  }

  /**
   * 検出されたピッチを処理
   */
  private handleDetectedPitch(frequency: number): void {
    const midiNote = this.getClosestNote(frequency);
    
    // ピッチ履歴を更新
    this.pitchHistory.push(midiNote);
    if (this.pitchHistory.length > this.pitchHistorySize) {
      this.pitchHistory.shift();
    }

    // 安定したノートを取得
    const stableNote = this.getStableNote();
    if (stableNote !== -1 && stableNote !== this.currentNote) {
      if (this.currentNote !== -1) {
        this.onNoteOff?.(this.currentNote);
      }
      this.currentNote = stableNote;
      this.onNoteOn?.(stableNote);
    }

    this.lastDetectedFrequency = frequency;
  }

  /**
   * ピッチが検出されなかった場合
   */
  private handleNoPitch(): void {
    this.pitchHistory.push(-1);
    if (this.pitchHistory.length > this.pitchHistorySize) {
      this.pitchHistory.shift();
    }

    const silentFrames = this.pitchHistory.filter(p => p === -1).length;
    if (silentFrames >= 2 && this.currentNote !== -1) {
      this.onNoteOff?.(this.currentNote);
      this.currentNote = -1;
    }

    this.lastDetectedFrequency = 0;
  }

  /**
   * 周波数から最も近いMIDIノートを取得
   */
  private getClosestNote(frequency: number): number {
    let closestNote = 48; // C2
    let minDifference = Infinity;

    for (const [note, noteFreq] of this.noteFrequencies) {
      const difference = Math.abs(frequency - noteFreq);
      if (difference < minDifference) {
        minDifference = difference;
        closestNote = note;
      }
    }

    return closestNote;
  }

  /**
   * 安定したノートを取得
   */
  private getStableNote(): number {
    if (this.pitchHistory.length < 2) return -1;

    const recentHistory = this.pitchHistory.slice(-3);
    const noteCounts = new Map<number, number>();

    for (const note of recentHistory) {
      if (note !== -1) {
        noteCounts.set(note, (noteCounts.get(note) || 0) + 1);
      }
    }

    let mostCommonNote = -1;
    let maxCount = 0;
    const minRequiredCount = Math.ceil(recentHistory.length * 0.5);

    for (const [note, count] of noteCounts) {
      if (count > maxCount && count >= minRequiredCount) {
        mostCommonNote = note;
        maxCount = count;
      }
    }

    return mostCommonNote;
  }

  /**
   * 接続変更を通知
   */
  private notifyConnectionChange(connected: boolean): void {
    this.onConnectionChange?.(connected);
  }

  /**
   * デバイスから切断
   */
  async disconnect(): Promise<void> {
    this.isProcessing = false;

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      if (this.isIOSDevice) {
        // iOSではsuspend
        await this.audioContext.suspend();
      } else {
        await this.audioContext.close();
        this.audioContext = null;
      }
    }

    if (this.currentNote !== -1) {
      this.onNoteOff?.(this.currentNote);
      this.currentNote = -1;
    }

    this.currentDeviceId = null;
    this.pitchHistory = [];
    this.notifyConnectionChange(false);
  }

  /**
   * 現在接続中かどうか
   */
  isConnected(): boolean {
    return this.isProcessing && this.mediaStream !== null;
  }

  /**
   * 現在のデバイスIDを取得
   */
  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * リソースを破棄
   */
  async dispose(): Promise<void> {
    await this.disconnect();
    this.wasmModule = null;
    this.wasmMemory = null;
    this.onNoteOn = null;
    this.onNoteOff = null;
    this.onConnectionChange = null;
  }
}
