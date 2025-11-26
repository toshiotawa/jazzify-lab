/**
 * VoicePitchDetector - WASM/YINベースの軽量低レイテンシ音声ピッチ検出器
 * iOS Safari対応、単音検出に最適化
 */

import initWasm, {
  init_pitch_detector,
  analyze_pitch,
  alloc,
  free,
  get_memory
} from '@/wasm/pitch_detector';
import { log } from '@/utils/logger';

/** ピッチ検出結果 */
export interface PitchDetectionResult {
  /** 検出されたMIDIノート番号（0-127）、検出できなかった場合はnull */
  midiNote: number | null;
  /** 検出された周波数（Hz）、検出できなかった場合は0 */
  frequency: number;
  /** 信頼度（0-1） */
  confidence: number;
  /** タイムスタンプ */
  timestamp: number;
}

/** VoicePitchDetectorの設定オプション */
export interface VoicePitchDetectorOptions {
  /** ノート検出時のコールバック */
  onNoteDetected: (midiNote: number) => void;
  /** ノートオフ時のコールバック（オプション） */
  onNoteOff?: (midiNote: number) => void;
  /** YIN閾値（低いほど厳格、デフォルト: 0.15） */
  yinThreshold?: number;
  /** 最小信頼度（デフォルト: 0.8） */
  minConfidence?: number;
  /** 分析バッファサイズ（サンプル数、デフォルト: 2048） */
  bufferSize?: number;
  /** ノート安定化フレーム数（デフォルト: 2） */
  stabilizationFrames?: number;
}

// iOS/Safari検出
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
};

const isSafari = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
};

/**
 * 周波数をMIDIノート番号に変換
 */
const frequencyToMidiNote = (frequency: number): number => {
  if (frequency <= 0) return -1;
  // A4 = 440Hz = MIDI 69
  const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
  return Math.max(0, Math.min(127, midiNote));
};

/**
 * MIDIノート番号を周波数に変換
 */
const midiNoteToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * VoicePitchDetector - 音声入力からのピッチ検出
 */
export class VoicePitchDetector {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  
  private wasmInitialized = false;
  private isRunning = false;
  private animationFrameId: number | null = null;
  
  // 設定
  private readonly yinThreshold: number;
  private readonly minConfidence: number;
  private readonly bufferSize: number;
  private readonly stabilizationFrames: number;
  
  // コールバック
  private readonly onNoteDetected: (midiNote: number) => void;
  private readonly onNoteOff?: (midiNote: number) => void;
  
  // 状態管理
  private currentNote: number | null = null;
  private noteStabilityCount = 0;
  private lastDetectedNote: number | null = null;
  private silenceFrameCount = 0;
  private readonly silenceThreshold = 5; // 無音判定フレーム数
  
  // WASM用バッファ
  private wasmBufferPtr: number | null = null;
  private wasmBufferSize = 0;
  private sampleRate = 44100;
  
  // 時間領域バッファ（AudioNode用）
  private timeDomainBuffer: Float32Array | null = null;

  constructor(options: VoicePitchDetectorOptions) {
    this.onNoteDetected = options.onNoteDetected;
    this.onNoteOff = options.onNoteOff;
    this.yinThreshold = options.yinThreshold ?? 0.15;
    this.minConfidence = options.minConfidence ?? 0.8;
    this.bufferSize = options.bufferSize ?? 2048;
    this.stabilizationFrames = options.stabilizationFrames ?? 2;
  }

  /**
   * マイクアクセス権限をリクエストして初期化
   */
  async initialize(): Promise<boolean> {
    try {
      log.info('🎤 VoicePitchDetector: 初期化開始');
      
      // WASM初期化
      await this.initializeWasm();
      
      // AudioContext作成（iOS対応）
      await this.createAudioContext();
      
      // マイクアクセス
      await this.requestMicrophoneAccess();
      
      // オーディオノードのセットアップ
      this.setupAudioNodes();
      
      log.info('✅ VoicePitchDetector: 初期化完了');
      return true;
    } catch (error) {
      log.error('❌ VoicePitchDetector: 初期化失敗', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * WASM初期化
   */
  private async initializeWasm(): Promise<void> {
    if (this.wasmInitialized) return;
    
    try {
      await initWasm();
      init_pitch_detector(this.sampleRate);
      
      // バッファ確保
      this.wasmBufferSize = this.bufferSize;
      this.wasmBufferPtr = alloc(this.wasmBufferSize * 4); // Float32 = 4 bytes
      
      this.wasmInitialized = true;
      log.info('✅ WASM ピッチ検出器初期化完了');
    } catch (error) {
      log.error('❌ WASM初期化エラー:', error);
      throw new Error('WASM pitch detector initialization failed');
    }
  }

  /**
   * AudioContext作成（iOS Safari対応）
   */
  private async createAudioContext(): Promise<void> {
    if (this.audioContext) return;
    
    const AudioContextClass = window.AudioContext || 
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported');
    }
    
    // iOS/Safariでは低レイテンシ設定
    const options: AudioContextOptions = {
      latencyHint: 'interactive',
    };
    
    // iOSでは特定のサンプルレートを指定しない方が安定
    if (!isIOS()) {
      options.sampleRate = 44100;
    }
    
    this.audioContext = new AudioContextClass(options);
    this.sampleRate = this.audioContext.sampleRate;
    
    // サンプルレート変更に対応してWASMを再初期化
    if (this.wasmInitialized) {
      init_pitch_detector(this.sampleRate);
    }
    
    // iOS Safariではresumeが必要
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    log.info(`🔊 AudioContext作成完了 (sampleRate: ${this.sampleRate}Hz, state: ${this.audioContext.state})`);
  }

  /**
   * マイクアクセスをリクエスト
   */
  private async requestMicrophoneAccess(): Promise<void> {
    try {
      // iOS Safari対応の制約設定
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // iOS用の追加設定
          ...(isIOS() || isSafari() ? {} : {
            sampleRate: { ideal: 44100 },
            channelCount: { exact: 1 },
          }),
        },
        video: false,
      };
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      log.info('✅ マイクアクセス許可取得');
    } catch (error) {
      log.error('❌ マイクアクセス拒否:', error);
      throw new Error('Microphone access denied');
    }
  }

  /**
   * オーディオノードのセットアップ
   */
  private setupAudioNodes(): void {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('AudioContext or MediaStream not available');
    }
    
    // ソースノード
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // 解析ノード
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.bufferSize * 2;
    this.analyserNode.smoothingTimeConstant = 0;
    
    // 時間領域バッファ
    this.timeDomainBuffer = new Float32Array(this.bufferSize);
    
    // ScriptProcessorNode（低レイテンシ処理用）
    // 注: AudioWorkletの方が推奨だが、iOSでの互換性のためScriptProcessorを使用
    this.scriptProcessor = this.audioContext.createScriptProcessor(
      256, // 低レイテンシのため小さいバッファ
      1,
      1
    );
    
    this.scriptProcessor.onaudioprocess = this.processAudio.bind(this);
    
    // 接続
    this.sourceNode.connect(this.analyserNode);
    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
    
    log.info('🔗 オーディオノード接続完了');
  }

  /**
   * 音声処理コールバック
   */
  private processAudio(_event: AudioProcessingEvent): void {
    if (!this.isRunning || !this.analyserNode || !this.timeDomainBuffer) {
      return;
    }
    
    // 時間領域データを取得（型互換性のためキャスト）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyserNode.getFloatTimeDomainData(this.timeDomainBuffer as any);
    
    // ピッチ検出
    const result = this.detectPitch(this.timeDomainBuffer);
    
    // ノート処理
    this.processDetectedNote(result);
  }

  /**
   * ピッチ検出（WASM使用）
   */
  private detectPitch(samples: Float32Array): PitchDetectionResult {
    if (!this.wasmInitialized || this.wasmBufferPtr === null) {
      return { midiNote: null, frequency: 0, confidence: 0, timestamp: performance.now() };
    }
    
    try {
      // WASMメモリにサンプルをコピー
      const memory = get_memory() as WebAssembly.Memory | undefined;
      if (!memory?.buffer) {
        return { midiNote: null, frequency: 0, confidence: 0, timestamp: performance.now() };
      }
      
      const wasmMemory = new Float32Array(
        memory.buffer,
        this.wasmBufferPtr,
        this.wasmBufferSize
      );
      
      // サンプル数が足りない場合はゼロパディング
      const copyLength = Math.min(samples.length, this.wasmBufferSize);
      wasmMemory.set(samples.subarray(0, copyLength));
      if (copyLength < this.wasmBufferSize) {
        wasmMemory.fill(0, copyLength);
      }
      
      // ピッチ検出実行
      const frequency = analyze_pitch(
        this.wasmBufferPtr,
        this.wasmBufferSize,
        this.sampleRate,
        this.yinThreshold
      );
      
      // 結果処理
      if (frequency > 0 && frequency >= 50 && frequency <= 2000) {
        const midiNote = frequencyToMidiNote(frequency);
        const expectedFreq = midiNoteToFrequency(midiNote);
        const cents = 1200 * Math.log2(frequency / expectedFreq);
        const confidence = Math.max(0, 1 - Math.abs(cents) / 50);
        
        return {
          midiNote: confidence >= this.minConfidence ? midiNote : null,
          frequency,
          confidence,
          timestamp: performance.now(),
        };
      }
      
      return { midiNote: null, frequency: 0, confidence: 0, timestamp: performance.now() };
    } catch (error) {
      log.warn('ピッチ検出エラー:', error);
      return { midiNote: null, frequency: 0, confidence: 0, timestamp: performance.now() };
    }
  }

  /**
   * 検出ノートの処理（安定化・デバウンス）
   */
  private processDetectedNote(result: PitchDetectionResult): void {
    const detectedNote = result.midiNote;
    
    if (detectedNote === null) {
      // 無音検出
      this.silenceFrameCount++;
      
      if (this.silenceFrameCount >= this.silenceThreshold && this.currentNote !== null) {
        // ノートオフ
        if (this.onNoteOff) {
          this.onNoteOff(this.currentNote);
        }
        this.currentNote = null;
        this.noteStabilityCount = 0;
      }
      return;
    }
    
    // ノート検出
    this.silenceFrameCount = 0;
    
    if (detectedNote === this.lastDetectedNote) {
      this.noteStabilityCount++;
    } else {
      this.noteStabilityCount = 1;
      this.lastDetectedNote = detectedNote;
    }
    
    // 安定化フレーム数に達したらノート発火
    if (this.noteStabilityCount >= this.stabilizationFrames) {
      if (detectedNote !== this.currentNote) {
        // 新しいノート
        if (this.currentNote !== null && this.onNoteOff) {
          this.onNoteOff(this.currentNote);
        }
        
        this.currentNote = detectedNote;
        this.onNoteDetected(detectedNote);
      }
    }
  }

  /**
   * 検出開始
   */
  start(): void {
    if (this.isRunning) return;
    
    if (!this.audioContext || !this.analyserNode) {
      log.warn('⚠️ VoicePitchDetector: 初期化されていません');
      return;
    }
    
    // AudioContextを再開（iOS対応）
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
    
    this.isRunning = true;
    this.currentNote = null;
    this.lastDetectedNote = null;
    this.noteStabilityCount = 0;
    this.silenceFrameCount = 0;
    
    log.info('▶️ VoicePitchDetector: 検出開始');
  }

  /**
   * 検出停止
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 現在のノートをオフ
    if (this.currentNote !== null && this.onNoteOff) {
      this.onNoteOff(this.currentNote);
    }
    
    this.currentNote = null;
    this.lastDetectedNote = null;
    
    log.info('⏹️ VoicePitchDetector: 検出停止');
  }

  /**
   * リソース解放
   */
  destroy(): void {
    this.stop();
    this.cleanup();
    log.info('🗑️ VoicePitchDetector: 破棄完了');
  }

  /**
   * クリーンアップ
   */
  private cleanup(): void {
    // ScriptProcessor切断
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }
    
    // ソースノード切断
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // Analyser切断
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    
    // メディアストリーム停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // AudioContext終了
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    
    // WASMバッファ解放
    if (this.wasmBufferPtr !== null && this.wasmBufferSize > 0) {
      try {
        free(this.wasmBufferPtr, this.wasmBufferSize * 4);
      } catch {
        // ignore
      }
      this.wasmBufferPtr = null;
      this.wasmBufferSize = 0;
    }
    
    this.timeDomainBuffer = null;
  }

  /**
   * 検出中かどうか
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * 現在検出中のノート
   */
  get activeNote(): number | null {
    return this.currentNote;
  }
}

export default VoicePitchDetector;
