/**
 * リアルタイムピッチ検出サービス
 * 
 * AudioWorklet + WASM (YIN/PYIN) によるリアルタイムピッチ検出
 * 低レイテンシ（~15ms）での単音ピッチ検出を実現
 */

import { log } from './logger';

// WASMモジュールの型定義
interface PitchDetectorWasm {
  init_pitch_detector: (sampleRate: number) => void;
  analyze_pitch: (ptr: number, length: number, sampleRate: number, yinThreshold: number) => number;
  alloc: (size: number) => number;
  free: (ptr: number, size: number) => void;
  get_memory: () => WebAssembly.Memory;
}

// ピッチ検出結果
export interface PitchResult {
  frequency: number;      // 検出された周波数 (Hz)
  midiNote: number;       // MIDIノート番号
  confidence: number;     // 信頼度 (0-1)
  timestamp: number;      // タイムスタンプ
}

// コールバック型
export type PitchCallback = (result: PitchResult) => void;
export type NoteOnCallback = (note: number, velocity: number) => void;
export type NoteOffCallback = (note: number) => void;

// サービス設定
export interface PitchDetectorConfig {
  sampleRate?: number;          // サンプルレート (default: 48000)
  bufferSize?: number;          // バッファサイズ (default: 2048)
  hopSize?: number;             // ホップサイズ (default: 512)
  yinThreshold?: number;        // YIN閾値 (default: 0.15)
  minConfidence?: number;       // 最小信頼度 (default: 0.8)
  noteOnThreshold?: number;     // ノートオン判定の連続検出回数 (default: 2)
  noteOffThreshold?: number;    // ノートオフ判定の無検出回数 (default: 3)
  minFrequency?: number;        // 最小周波数 (default: 60 Hz, ~B1)
  maxFrequency?: number;        // 最大周波数 (default: 2000 Hz, ~B6)
}

const DEFAULT_CONFIG: Required<PitchDetectorConfig> = {
  sampleRate: 48000,
  bufferSize: 2048,
  hopSize: 512,
  yinThreshold: 0.15,
  minConfidence: 0.8,
  noteOnThreshold: 2,
  noteOffThreshold: 3,
  minFrequency: 60,
  maxFrequency: 2000
};

export class PitchDetectorService {
  private config: Required<PitchDetectorConfig>;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  
  // WASM関連
  private wasmModule: PitchDetectorWasm | null = null;
  private wasmMemory: WebAssembly.Memory | null = null;
  private sampleBuffer: Float32Array | null = null;
  private sampleBufferPtr: number = 0;
  
  // 状態管理
  private isInitialized = false;
  private isRunning = false;
  private currentNote: number | null = null;
  private noteConfirmCount = 0;
  private noNoteCount = 0;
  
  // コールバック
  private onPitch: PitchCallback | null = null;
  private onNoteOn: NoteOnCallback | null = null;
  private onNoteOff: NoteOffCallback | null = null;
  
  constructor(config: PitchDetectorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * サービスの初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('🎤 PitchDetectorService already initialized');
      return;
    }
    
    try {
      log.info('🎤 Initializing PitchDetectorService...');
      
      // WASMモジュールをロード
      await this.loadWasmModule();
      
      // AudioContextを作成
      await this.createAudioContext();
      
      this.isInitialized = true;
      log.info('✅ PitchDetectorService initialized successfully');
      
    } catch (error) {
      log.error('❌ Failed to initialize PitchDetectorService:', error);
      throw error;
    }
  }
  
  /**
   * WASMモジュールのロード
   */
  private async loadWasmModule(): Promise<void> {
    try {
      log.info('🔧 Loading WASM pitch detector module...');
      
      // 動的インポート
      const wasmModule = await import('@/wasm/pitch_detector.js');
      
      // WASMを初期化
      await wasmModule.default();
      
      // モジュール参照を保存
      this.wasmModule = wasmModule as unknown as PitchDetectorWasm;
      
      // ピッチ検出器を初期化
      this.wasmModule.init_pitch_detector(this.config.sampleRate);
      
      // メモリ参照を取得
      this.wasmMemory = this.wasmModule.get_memory();
      
      // サンプルバッファを確保
      const bufferBytes = this.config.bufferSize * 4; // Float32 = 4 bytes
      this.sampleBufferPtr = this.wasmModule.alloc(bufferBytes);
      this.sampleBuffer = new Float32Array(
        this.wasmMemory.buffer,
        this.sampleBufferPtr,
        this.config.bufferSize
      );
      
      log.info('✅ WASM pitch detector loaded');
      
    } catch (error) {
      log.error('❌ Failed to load WASM module:', error);
      throw new Error('WASMピッチ検出モジュールのロードに失敗しました');
    }
  }
  
  /**
   * AudioContextの作成
   */
  private async createAudioContext(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || 
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported');
      }
      
      this.audioContext = new AudioContextClass({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });
      
      // AudioWorkletをロード
      await this.audioContext.audioWorklet.addModule('/js/audio/pitch-detection-processor.js');
      
      log.info('✅ AudioContext created with sample rate:', this.audioContext.sampleRate);
      
    } catch (error) {
      log.error('❌ Failed to create AudioContext:', error);
      throw error;
    }
  }
  
  /**
   * マイクデバイス一覧を取得
   */
  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      // デバイス一覧を取得するために一度権限をリクエスト
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => stream.getTracks().forEach(t => t.stop()));
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput');
      
    } catch (error) {
      log.error('❌ Failed to get audio input devices:', error);
      return [];
    }
  }
  
  /**
   * ピッチ検出を開始
   */
  async start(deviceId?: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isRunning) {
      log.warn('⚠️ PitchDetectorService is already running');
      return;
    }
    
    try {
      log.info('🎤 Starting pitch detection...');
      
      // AudioContextを再開
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // マイク入力を取得
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 入力ノードを作成
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      // AudioWorkletノードを作成
      this.workletNode = new AudioWorkletNode(this.audioContext!, 'pitch-detection-processor');
      
      // WorkletからのメッセージをハンドルW
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'samples') {
          this.processSamples(event.data.samples, event.data.timestamp);
        }
      };
      
      // ノードを接続
      this.sourceNode.connect(this.workletNode);
      
      // Workletを有効化
      this.workletNode.port.postMessage({ type: 'enable' });
      this.workletNode.port.postMessage({ type: 'setHopSize', hopSize: this.config.hopSize });
      
      this.isRunning = true;
      this.currentNote = null;
      this.noteConfirmCount = 0;
      this.noNoteCount = 0;
      
      log.info('✅ Pitch detection started');
      
    } catch (error) {
      log.error('❌ Failed to start pitch detection:', error);
      throw error;
    }
  }
  
  /**
   * ピッチ検出を停止
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    log.info('🎤 Stopping pitch detection...');
    
    // Workletを無効化
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'disable' });
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    // ソースノードを切断
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // メディアストリームを停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // 最後のノートをオフに
    if (this.currentNote !== null && this.onNoteOff) {
      this.onNoteOff(this.currentNote);
    }
    
    this.isRunning = false;
    this.currentNote = null;
    
    log.info('✅ Pitch detection stopped');
  }
  
  /**
   * サンプルデータを処理してピッチを検出
   */
  private processSamples(samples: Float32Array, timestamp: number): void {
    if (!this.wasmModule || !this.sampleBuffer || !this.wasmMemory) {
      return;
    }
    
    // WASMメモリが再割り当てされた場合に備えて更新
    if (this.sampleBuffer.buffer !== this.wasmMemory.buffer) {
      this.sampleBuffer = new Float32Array(
        this.wasmMemory.buffer,
        this.sampleBufferPtr,
        this.config.bufferSize
      );
    }
    
    // サンプルをWASMメモリにコピー
    this.sampleBuffer.set(samples.subarray(0, this.config.bufferSize));
    
    // ピッチを検出
    const frequency = this.wasmModule.analyze_pitch(
      this.sampleBufferPtr,
      this.config.bufferSize,
      this.config.sampleRate,
      this.config.yinThreshold
    );
    
    // 結果を処理
    this.processFrequency(frequency, timestamp);
  }
  
  /**
   * 検出された周波数を処理
   */
  private processFrequency(frequency: number, timestamp: number): void {
    // 無効な周波数をフィルタ
    if (frequency <= 0 || 
        frequency < this.config.minFrequency || 
        frequency > this.config.maxFrequency) {
      this.handleNoNote();
      return;
    }
    
    // 周波数をMIDIノートに変換
    const midiNote = this.frequencyToMidi(frequency);
    const confidence = this.calculateConfidence(frequency, midiNote);
    
    // 信頼度チェック
    if (confidence < this.config.minConfidence) {
      this.handleNoNote();
      return;
    }
    
    // ピッチ結果をコールバック
    const result: PitchResult = {
      frequency,
      midiNote,
      confidence,
      timestamp
    };
    
    if (this.onPitch) {
      this.onPitch(result);
    }
    
    // ノートオン/オフ処理
    this.handleNoteDetection(midiNote, confidence);
  }
  
  /**
   * ノート検出処理（ヒステリシス付き）
   */
  private handleNoteDetection(midiNote: number, confidence: number): void {
    this.noNoteCount = 0;
    
    if (this.currentNote === null) {
      // 新しいノートの開始判定
      this.noteConfirmCount++;
      
      if (this.noteConfirmCount >= this.config.noteOnThreshold) {
        this.currentNote = midiNote;
        this.noteConfirmCount = 0;
        
        if (this.onNoteOn) {
          // 信頼度をベロシティに変換 (64-127)
          const velocity = Math.round(64 + confidence * 63);
          this.onNoteOn(midiNote, velocity);
        }
      }
    } else if (this.currentNote !== midiNote) {
      // ノートが変わった場合
      this.noteConfirmCount++;
      
      if (this.noteConfirmCount >= this.config.noteOnThreshold) {
        // 前のノートをオフ
        if (this.onNoteOff) {
          this.onNoteOff(this.currentNote);
        }
        
        // 新しいノートをオン
        this.currentNote = midiNote;
        this.noteConfirmCount = 0;
        
        if (this.onNoteOn) {
          const velocity = Math.round(64 + confidence * 63);
          this.onNoteOn(midiNote, velocity);
        }
      }
    } else {
      // 同じノートが継続
      this.noteConfirmCount = 0;
    }
  }
  
  /**
   * ノートが検出されなかった場合の処理
   */
  private handleNoNote(): void {
    this.noteConfirmCount = 0;
    this.noNoteCount++;
    
    if (this.currentNote !== null && 
        this.noNoteCount >= this.config.noteOffThreshold) {
      if (this.onNoteOff) {
        this.onNoteOff(this.currentNote);
      }
      this.currentNote = null;
      this.noNoteCount = 0;
    }
  }
  
  /**
   * 周波数をMIDIノート番号に変換
   */
  private frequencyToMidi(frequency: number): number {
    // MIDI note = 69 + 12 * log2(frequency / 440)
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    return Math.round(midiFloat);
  }
  
  /**
   * 信頼度を計算（周波数とMIDIノートの一致度）
   */
  private calculateConfidence(frequency: number, midiNote: number): number {
    // 期待される周波数
    const expectedFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
    
    // セント差を計算
    const centsDiff = Math.abs(1200 * Math.log2(frequency / expectedFreq));
    
    // セント差を信頼度に変換（50セント以内で高信頼度）
    const confidence = Math.max(0, 1 - centsDiff / 50);
    
    return confidence;
  }
  
  /**
   * コールバックを設定
   */
  setCallbacks(callbacks: {
    onPitch?: PitchCallback;
    onNoteOn?: NoteOnCallback;
    onNoteOff?: NoteOffCallback;
  }): void {
    if (callbacks.onPitch) this.onPitch = callbacks.onPitch;
    if (callbacks.onNoteOn) this.onNoteOn = callbacks.onNoteOn;
    if (callbacks.onNoteOff) this.onNoteOff = callbacks.onNoteOff;
  }
  
  /**
   * 設定を更新
   */
  updateConfig(config: Partial<PitchDetectorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Workletのホップサイズを更新
    if (config.hopSize && this.workletNode) {
      this.workletNode.port.postMessage({ type: 'setHopSize', hopSize: config.hopSize });
    }
  }
  
  /**
   * サービスを破棄
   */
  async destroy(): Promise<void> {
    this.stop();
    
    // WASMメモリを解放
    if (this.wasmModule && this.sampleBufferPtr) {
      try {
        this.wasmModule.free(this.sampleBufferPtr, this.config.bufferSize * 4);
      } catch {
        // ignore
      }
    }
    
    // AudioContextを閉じる
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
    
    this.wasmModule = null;
    this.wasmMemory = null;
    this.sampleBuffer = null;
    this.isInitialized = false;
    
    log.info('🎤 PitchDetectorService destroyed');
  }
  
  /**
   * 実行中かどうか
   */
  isActive(): boolean {
    return this.isRunning;
  }
  
  /**
   * 初期化済みかどうか
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * 現在のノートを取得
   */
  getCurrentNote(): number | null {
    return this.currentNote;
  }
}

// シングルトンインスタンス（オプション）
let pitchDetectorInstance: PitchDetectorService | null = null;

export const getPitchDetectorService = (): PitchDetectorService => {
  if (!pitchDetectorInstance) {
    pitchDetectorInstance = new PitchDetectorService();
  }
  return pitchDetectorInstance;
};

export const destroyPitchDetectorService = async (): Promise<void> => {
  if (pitchDetectorInstance) {
    await pitchDetectorInstance.destroy();
    pitchDetectorInstance = null;
  }
};
