/**
 * リアルタイムピッチ検出サービス
 * 
 * AudioWorklet + WASM (YIN/PYIN) によるリアルタイムピッチ検出
 * iOS Safari対応: ScriptProcessorNodeフォールバック付き
 * 低レイテンシ（~15-25ms）での単音ピッチ検出を実現
 * 
 * シングルトンパターンでグローバル管理
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
export type StatusCallback = (status: PitchDetectorStatus) => void;

// ステータス情報
export interface PitchDetectorStatus {
  isInitialized: boolean;
  isRunning: boolean;
  isLegacyMode: boolean;
  error: string | null;
  detectionCount: number;
  currentNote: number | null;
  lastPitch: PitchResult | null;
}

// サービス設定
export interface PitchDetectorConfig {
  sampleRate?: number;          // サンプルレート (default: 48000)
  bufferSize?: number;          // バッファサイズ (default: 2048)
  hopSize?: number;             // ホップサイズ (default: 512)
  yinThreshold?: number;        // YIN閾値 (default: 0.15)
  minConfidence?: number;       // 最小信頼度 (default: 0.7)
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
  minConfidence: 0.6,  // iOSではノイズが多いため緩めに
  noteOnThreshold: 2,
  noteOffThreshold: 4,
  minFrequency: 60,
  maxFrequency: 2000
};

// iOS検出
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// AudioWorkletサポート検出
const supportsAudioWorklet = (): boolean => {
  try {
    return typeof AudioWorkletNode !== 'undefined' && 
           typeof window !== 'undefined' &&
           'audioWorklet' in AudioContext.prototype;
  } catch {
    return false;
  }
};

export class PitchDetectorService {
  private config: Required<PitchDetectorConfig>;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  
  // WASM関連
  private wasmModule: PitchDetectorWasm | null = null;
  private wasmMemory: WebAssembly.Memory | null = null;
  private sampleBuffer: Float32Array | null = null;
  private sampleBufferPtr: number = 0;
  
  // 処理用バッファ（ScriptProcessorNode用）
  private processingBuffer: Float32Array | null = null;
  private bufferWriteIndex = 0;
  
  // 状態管理
  private isInitialized = false;
  private isRunning = false;
  private useScriptProcessor = false;
  private currentNote: number | null = null;
  private noteConfirmCount = 0;
  private noNoteCount = 0;
  private lastProcessTime = 0;
  private detectionCount = 0;
  private lastPitch: PitchResult | null = null;
  private errorMessage: string | null = null;
  
  // コールバック（複数リスナー対応）
  private pitchCallbacks: Set<PitchCallback> = new Set();
  private noteOnCallbacks: Set<NoteOnCallback> = new Set();
  private noteOffCallbacks: Set<NoteOffCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  
  constructor(config: PitchDetectorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // iOSの場合はScriptProcessorNodeを使用
    if (isIOS() || !supportsAudioWorklet()) {
      this.useScriptProcessor = true;
      log.info('🎤 iOS/レガシーモード: ScriptProcessorNodeを使用');
    }
  }
  
  /**
   * 現在のステータスを取得
   */
  getStatus(): PitchDetectorStatus {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      isLegacyMode: this.useScriptProcessor,
      error: this.errorMessage,
      detectionCount: this.detectionCount,
      currentNote: this.currentNote,
      lastPitch: this.lastPitch
    };
  }
  
  /**
   * ステータス変更を通知
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(cb => cb(status));
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
      log.info(`   iOS: ${isIOS()}, AudioWorklet: ${supportsAudioWorklet()}, ScriptProcessor: ${this.useScriptProcessor}`);
      
      this.errorMessage = null;
      
      // WASMモジュールをロード
      await this.loadWasmModule();
      
      // AudioContextを作成
      await this.createAudioContext();
      
      this.isInitialized = true;
      log.info('✅ PitchDetectorService initialized successfully');
      this.notifyStatusChange();
      
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : '初期化に失敗しました';
      log.error('❌ Failed to initialize PitchDetectorService:', error);
      this.notifyStatusChange();
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
      
      // 処理用バッファを確保
      this.processingBuffer = new Float32Array(this.config.bufferSize);
      
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
      
      // iOSではサンプルレートを指定しない方が安定する場合がある
      const contextOptions: AudioContextOptions = {
        latencyHint: 'interactive'
      };
      
      // 非iOS環境ではサンプルレートを指定
      if (!isIOS()) {
        contextOptions.sampleRate = this.config.sampleRate;
      }
      
      this.audioContext = new AudioContextClass(contextOptions);
      
      // 実際のサンプルレートを設定に反映
      this.config.sampleRate = this.audioContext.sampleRate;
      log.info(`🔧 AudioContext sampleRate: ${this.audioContext.sampleRate}`);
      
      // AudioWorkletを使用する場合のみロード
      if (!this.useScriptProcessor) {
        try {
          await this.audioContext.audioWorklet.addModule('/js/audio/pitch-detection-processor.js');
          log.info('✅ AudioWorklet loaded');
        } catch (workletError) {
          log.warn('⚠️ AudioWorklet failed, falling back to ScriptProcessorNode:', workletError);
          this.useScriptProcessor = true;
        }
      }
      
      log.info(`✅ AudioContext created (sampleRate: ${this.audioContext.sampleRate}, useScriptProcessor: ${this.useScriptProcessor})`);
      
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      
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
      this.errorMessage = null;
      
      // AudioContextを再開（iOSでは必須）
      if (this.audioContext) {
        if (this.audioContext.state === 'suspended') {
          log.info('🔧 Resuming AudioContext...');
          await this.audioContext.resume();
        }
        log.info(`🔧 AudioContext state: ${this.audioContext.state}`);
      }
      
      // マイク入力を取得
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { 
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } : {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };
      
      log.info('🎤 Requesting microphone access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      log.info('✅ Microphone access granted');
      
      // 入力ノードを作成
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      if (this.useScriptProcessor) {
        // ScriptProcessorNode（レガシー）を使用
        this.setupScriptProcessor();
      } else {
        // AudioWorkletを使用
        this.setupAudioWorklet();
      }
      
      this.isRunning = true;
      this.currentNote = null;
      this.noteConfirmCount = 0;
      this.noNoteCount = 0;
      this.bufferWriteIndex = 0;
      this.lastProcessTime = performance.now();
      this.detectionCount = 0;
      
      log.info('✅ Pitch detection started');
      this.notifyStatusChange();
      
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'マイクの開始に失敗しました';
      log.error('❌ Failed to start pitch detection:', error);
      this.notifyStatusChange();
      throw error;
    }
  }
  
  /**
   * AudioWorkletをセットアップ
   */
  private setupAudioWorklet(): void {
    if (!this.audioContext) return;
    
    log.info('🔧 Setting up AudioWorklet...');
    
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pitch-detection-processor');
    
    // Workletからのメッセージをハンドル
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'samples') {
        this.processSamples(event.data.samples, event.data.timestamp);
      }
    };
    
    // ノードを接続
    this.sourceNode!.connect(this.workletNode);
    
    // Workletを有効化
    this.workletNode.port.postMessage({ type: 'enable' });
    this.workletNode.port.postMessage({ type: 'setHopSize', hopSize: this.config.hopSize });
    
    log.info('✅ AudioWorklet setup complete');
  }
  
  /**
   * ScriptProcessorNodeをセットアップ（iOS/レガシーフォールバック）
   */
  private setupScriptProcessor(): void {
    if (!this.audioContext) return;
    
    log.info('🔧 Setting up ScriptProcessorNode (legacy mode)...');
    
    // ScriptProcessorNodeを作成（バッファサイズは2の累乗）
    const bufferSize = 2048; // 約42ms @ 48kHz
    this.scriptProcessorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    let processCount = 0;
    
    this.scriptProcessorNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      
      processCount++;
      if (processCount % 100 === 1) {
        // デバッグログ（100フレームに1回）
        const maxAmp = Math.max(...Array.from(inputData).map(Math.abs));
        log.info(`🎤 Audio input: maxAmp=${maxAmp.toFixed(4)}, samples=${inputData.length}`);
      }
      
      // バッファにデータを蓄積
      if (!this.processingBuffer) return;
      
      for (let i = 0; i < inputData.length; i++) {
        this.processingBuffer[this.bufferWriteIndex] = inputData[i];
        this.bufferWriteIndex++;
        
        // バッファが満杯になったら処理
        if (this.bufferWriteIndex >= this.config.bufferSize) {
          this.processSamples(this.processingBuffer, performance.now());
          this.bufferWriteIndex = 0;
        }
      }
    };
    
    // ノードを接続
    this.sourceNode!.connect(this.scriptProcessorNode);
    this.scriptProcessorNode.connect(this.audioContext.destination);
    
    log.info('✅ ScriptProcessorNode setup complete');
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
    
    // ScriptProcessorNodeを切断
    if (this.scriptProcessorNode) {
      this.scriptProcessorNode.disconnect();
      this.scriptProcessorNode = null;
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
    if (this.currentNote !== null) {
      this.noteOffCallbacks.forEach(cb => cb(this.currentNote!));
    }
    
    this.isRunning = false;
    this.currentNote = null;
    this.lastPitch = null;
    
    log.info('✅ Pitch detection stopped');
    this.notifyStatusChange();
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
    const copyLength = Math.min(samples.length, this.config.bufferSize);
    this.sampleBuffer.set(samples.subarray(0, copyLength));
    
    // ピッチを検出
    const frequency = this.wasmModule.analyze_pitch(
      this.sampleBufferPtr,
      this.config.bufferSize,
      this.config.sampleRate,
      this.config.yinThreshold
    );
    
    this.detectionCount++;
    
    // 処理時間をログ（低頻度）
    const now = performance.now();
    if (now - this.lastProcessTime > 2000) {
      log.info(`🎤 Pitch: ${frequency > 0 ? frequency.toFixed(1) + 'Hz' : 'none'}, count: ${this.detectionCount}`);
      this.lastProcessTime = now;
    }
    
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
    
    this.lastPitch = result;
    this.pitchCallbacks.forEach(cb => cb(result));
    
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
        
        // 信頼度をベロシティに変換 (64-127)
        const velocity = Math.round(64 + confidence * 63);
        
        log.info(`🎵 Note ON: MIDI ${midiNote} (confidence: ${(confidence * 100).toFixed(1)}%, callbacks: ${this.noteOnCallbacks.size})`);
        
        // すべてのコールバックを呼び出し
        this.noteOnCallbacks.forEach(cb => {
          try {
            cb(midiNote, velocity);
          } catch (err) {
            log.error('❌ NoteOn callback error:', err);
          }
        });
        this.notifyStatusChange();
      }
    } else if (this.currentNote !== midiNote) {
      // ノートが変わった場合
      this.noteConfirmCount++;
      
      if (this.noteConfirmCount >= this.config.noteOnThreshold) {
        // 前のノートをオフ
        log.info(`🎵 Note OFF: MIDI ${this.currentNote} (callbacks: ${this.noteOffCallbacks.size})`);
        this.noteOffCallbacks.forEach(cb => {
          try {
            cb(this.currentNote!);
          } catch (err) {
            log.error('❌ NoteOff callback error:', err);
          }
        });
        
        // 新しいノートをオン
        this.currentNote = midiNote;
        this.noteConfirmCount = 0;
        
        const velocity = Math.round(64 + confidence * 63);
        log.info(`🎵 Note ON: MIDI ${midiNote} (confidence: ${(confidence * 100).toFixed(1)}%, callbacks: ${this.noteOnCallbacks.size})`);
        this.noteOnCallbacks.forEach(cb => {
          try {
            cb(midiNote, velocity);
          } catch (err) {
            log.error('❌ NoteOn callback error:', err);
          }
        });
        this.notifyStatusChange();
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
      log.info(`🎵 Note OFF: MIDI ${this.currentNote} (timeout)`);
      this.noteOffCallbacks.forEach(cb => cb(this.currentNote!));
      this.currentNote = null;
      this.noNoteCount = 0;
      this.notifyStatusChange();
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
   * コールバックを追加
   */
  addCallbacks(callbacks: {
    onPitch?: PitchCallback;
    onNoteOn?: NoteOnCallback;
    onNoteOff?: NoteOffCallback;
    onStatus?: StatusCallback;
  }): void {
    if (callbacks.onPitch) this.pitchCallbacks.add(callbacks.onPitch);
    if (callbacks.onNoteOn) this.noteOnCallbacks.add(callbacks.onNoteOn);
    if (callbacks.onNoteOff) this.noteOffCallbacks.add(callbacks.onNoteOff);
    if (callbacks.onStatus) this.statusCallbacks.add(callbacks.onStatus);
    
    log.info(`📝 Callbacks added - noteOn: ${this.noteOnCallbacks.size}, noteOff: ${this.noteOffCallbacks.size}, pitch: ${this.pitchCallbacks.size}`);
  }
  
  /**
   * コールバックを削除
   */
  removeCallbacks(callbacks: {
    onPitch?: PitchCallback;
    onNoteOn?: NoteOnCallback;
    onNoteOff?: NoteOffCallback;
    onStatus?: StatusCallback;
  }): void {
    if (callbacks.onPitch) this.pitchCallbacks.delete(callbacks.onPitch);
    if (callbacks.onNoteOn) this.noteOnCallbacks.delete(callbacks.onNoteOn);
    if (callbacks.onNoteOff) this.noteOffCallbacks.delete(callbacks.onNoteOff);
    if (callbacks.onStatus) this.statusCallbacks.delete(callbacks.onStatus);
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
    this.processingBuffer = null;
    this.isInitialized = false;
    
    // コールバックをクリア
    this.pitchCallbacks.clear();
    this.noteOnCallbacks.clear();
    this.noteOffCallbacks.clear();
    this.statusCallbacks.clear();
    
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
  
  /**
   * ScriptProcessorNodeを使用中かどうか
   */
  isUsingScriptProcessor(): boolean {
    return this.useScriptProcessor;
  }
}

// ===== グローバルシングルトン管理 =====

let globalPitchDetectorInstance: PitchDetectorService | null = null;

/**
 * グローバルなピッチ検出サービスを取得（シングルトン）
 */
export const getGlobalPitchDetector = (): PitchDetectorService => {
  if (!globalPitchDetectorInstance) {
    globalPitchDetectorInstance = new PitchDetectorService();
  }
  return globalPitchDetectorInstance;
};

/**
 * グローバルなピッチ検出サービスを破棄
 */
export const destroyGlobalPitchDetector = async (): Promise<void> => {
  if (globalPitchDetectorInstance) {
    await globalPitchDetectorInstance.destroy();
    globalPitchDetectorInstance = null;
  }
};

// 旧API互換性のため（非推奨）
export const getPitchDetectorService = getGlobalPitchDetector;
export const destroyPitchDetectorService = destroyGlobalPitchDetector;
