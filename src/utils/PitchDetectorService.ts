/**
 * PitchDetectorService
 * リアルタイム音声入力からピッチを検出するサービス
 * Pitchfinder + AudioWorklet を使用して低レイテンシを実現
 */

import Pitchfinder from 'pitchfinder';
import { log } from './logger';

// ピッチ検出アルゴリズムの種類
export type PitchAlgorithm = 'YIN' | 'AMDF' | 'ACF2+' | 'DynamicWavelet';

// ピッチ検出結果
export interface PitchResult {
  frequency: number;      // 検出された周波数 (Hz)
  midiNote: number;       // MIDIノート番号 (0-127)
  noteName: string;       // 音名 (例: "A4", "C#5")
  confidence: number;     // 信頼度 (0-1)
  timestamp: number;      // タイムスタンプ
}

// サービス設定
export interface PitchDetectorConfig {
  algorithm?: PitchAlgorithm;
  bufferSize?: number;           // 256, 512, 1024, 2048
  minFrequency?: number;         // 最小検出周波数 (Hz)
  maxFrequency?: number;         // 最大検出周波数 (Hz)
  threshold?: number;            // 検出閾値 (YIN用: 0.1-0.3)
  sampleRate?: number;           // サンプルレート
  onPitchDetected?: (result: PitchResult) => void;
  onNoteOn?: (midiNote: number, velocity: number) => void;
  onNoteOff?: (midiNote: number) => void;
  onError?: (error: Error) => void;
}

// デフォルト設定
const DEFAULT_CONFIG: Required<Omit<PitchDetectorConfig, 'onPitchDetected' | 'onNoteOn' | 'onNoteOff' | 'onError'>> = {
  algorithm: 'YIN',
  bufferSize: 512,
  minFrequency: 65,       // C2 (低いギターの6弦)
  maxFrequency: 2100,     // C7 (高いピアノ)
  threshold: 0.15,
  sampleRate: 44100
};

// 音名の配列
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * 周波数からMIDIノート番号を計算
 * A4 = 440Hz = MIDI 69
 */
function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

/**
 * MIDIノート番号から音名を取得
 */
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * PitchDetectorService クラス
 * マイク入力からリアルタイムでピッチを検出するサービス
 */
export class PitchDetectorService {
  private config: Required<Omit<PitchDetectorConfig, 'onPitchDetected' | 'onNoteOn' | 'onNoteOff' | 'onError'>>;
  private callbacks: Pick<PitchDetectorConfig, 'onPitchDetected' | 'onNoteOn' | 'onNoteOff' | 'onError'>;
  
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  
  private detectPitch: ((buffer: Float32Array) => number | null) | null = null;
  
  private isRunning = false;
  private isInitialized = false;
  
  // ノート状態管理（ノートオン/オフ検出用）
  private currentNote: number | null = null;
  private noteHoldCount = 0;
  private silenceCount = 0;
  private readonly NOTE_HOLD_THRESHOLD = 2;    // 同じノートが連続で検出される回数
  private readonly SILENCE_THRESHOLD = 4;       // 無音と判定する連続回数
  
  // デバウンス用
  private lastDetectedNote: number | null = null;
  private lastDetectionTime = 0;
  private readonly DEBOUNCE_MS = 50;  // 50ms デバウンス
  
  constructor(config: PitchDetectorConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    this.callbacks = {
      onPitchDetected: config.onPitchDetected,
      onNoteOn: config.onNoteOn,
      onNoteOff: config.onNoteOff,
      onError: config.onError
    };
  }
  
  /**
   * サービスを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // AudioContext の作成
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'  // 低レイテンシモード
      });
      
      // サンプルレートを実際の値で更新
      this.config.sampleRate = this.audioContext.sampleRate;
      
      // Pitchfinder の初期化
      this.initializePitchfinder();
      
      // AudioWorklet の登録
      await this.audioContext.audioWorklet.addModule('/js/audio/pitch-processor.js');
      
      this.isInitialized = true;
      log.info('✅ PitchDetectorService 初期化完了');
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      log.error('❌ PitchDetectorService 初期化エラー:', err);
      this.callbacks.onError?.(err);
      throw err;
    }
  }
  
  /**
   * Pitchfinder アルゴリズムを初期化
   */
  private initializePitchfinder(): void {
    const { algorithm, threshold, sampleRate } = this.config;
    
    switch (algorithm) {
      case 'YIN':
        this.detectPitch = Pitchfinder.YIN({
          threshold: threshold,
          sampleRate: sampleRate
        });
        break;
        
      case 'AMDF':
        this.detectPitch = Pitchfinder.AMDF({
          sampleRate: sampleRate,
          minFrequency: this.config.minFrequency,
          maxFrequency: this.config.maxFrequency
        });
        break;
        
      case 'ACF2+':
        this.detectPitch = Pitchfinder.ACF2PLUS({
          sampleRate: sampleRate
        });
        break;
        
      case 'DynamicWavelet':
        this.detectPitch = Pitchfinder.DynamicWavelet({
          sampleRate: sampleRate
        });
        break;
        
      default:
        this.detectPitch = Pitchfinder.YIN({
          threshold: threshold,
          sampleRate: sampleRate
        });
    }
    
    log.info(`🎤 ピッチ検出アルゴリズム: ${algorithm}`);
  }
  
  /**
   * マイク入力を開始
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      log.warn('⚠️ PitchDetectorService は既に実行中です');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // マイクアクセスを取得
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,    // エコーキャンセルを無効化（楽器音用）
          noiseSuppression: false,    // ノイズ抑制を無効化
          autoGainControl: false,     // 自動ゲイン調整を無効化
          channelCount: 1,            // モノラル
          sampleRate: this.config.sampleRate
        },
        video: false
      });
      
      // AudioContext が suspend されている場合は resume
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // MediaStreamSource の作成
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      // AudioWorkletNode の作成
      this.workletNode = new AudioWorkletNode(this.audioContext!, 'pitch-processor');
      
      // バッファサイズを設定
      this.workletNode.port.postMessage({
        type: 'setBufferSize',
        size: this.config.bufferSize
      });
      
      // ワークレットからのメッセージ処理
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audioData') {
          this.processAudioData(event.data.buffer);
        }
      };
      
      // 接続
      this.sourceNode.connect(this.workletNode);
      // workletNode は出力なし（ピッチ検出のみ）
      
      this.isRunning = true;
      log.info('🎤 マイク入力開始');
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      log.error('❌ マイク入力開始エラー:', err);
      this.callbacks.onError?.(err);
      throw err;
    }
  }
  
  /**
   * 音声データを処理してピッチを検出
   */
  private processAudioData(buffer: Float32Array): void {
    if (!this.detectPitch) {
      return;
    }
    
    // ピッチ検出
    const frequency = this.detectPitch(buffer);
    const now = performance.now();
    
    // 周波数が検出されなかった場合
    if (frequency === null || frequency <= 0 || !isFinite(frequency)) {
      this.silenceCount++;
      
      // 無音が続いた場合、ノートオフを発火
      if (this.currentNote !== null && this.silenceCount >= this.SILENCE_THRESHOLD) {
        this.callbacks.onNoteOff?.(this.currentNote);
        this.currentNote = null;
        this.noteHoldCount = 0;
        this.lastDetectedNote = null;
      }
      return;
    }
    
    // 周波数範囲チェック
    if (frequency < this.config.minFrequency || frequency > this.config.maxFrequency) {
      return;
    }
    
    this.silenceCount = 0;
    
    // MIDIノート番号に変換
    const midiNote = frequencyToMidi(frequency);
    
    // 有効なMIDI範囲チェック (21 = A0, 108 = C8)
    if (midiNote < 21 || midiNote > 108) {
      return;
    }
    
    // 信頼度の計算（簡易版）
    // 周波数がMIDIノートの中心周波数に近いほど信頼度が高い
    const expectedFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const cents = 1200 * Math.log2(frequency / expectedFreq);
    const confidence = Math.max(0, 1 - Math.abs(cents) / 50);  // ±50セント以内で高信頼度
    
    // 低信頼度の検出は無視
    if (confidence < 0.5) {
      return;
    }
    
    // ピッチ検出結果をコールバック
    const result: PitchResult = {
      frequency,
      midiNote,
      noteName: midiToNoteName(midiNote),
      confidence,
      timestamp: now
    };
    this.callbacks.onPitchDetected?.(result);
    
    // ノートオン/オフの判定
    if (midiNote === this.lastDetectedNote) {
      this.noteHoldCount++;
      
      // 同じノートが連続で検出された場合、新しいノートとして認識
      if (this.currentNote !== midiNote && this.noteHoldCount >= this.NOTE_HOLD_THRESHOLD) {
        // デバウンスチェック
        if (now - this.lastDetectionTime < this.DEBOUNCE_MS) {
          return;
        }
        
        // 前のノートがあればノートオフ
        if (this.currentNote !== null) {
          this.callbacks.onNoteOff?.(this.currentNote);
        }
        
        // 新しいノートオン
        this.currentNote = midiNote;
        this.lastDetectionTime = now;
        const velocity = Math.round(confidence * 100);  // 信頼度をベロシティに変換
        this.callbacks.onNoteOn?.(midiNote, velocity);
      }
    } else {
      // 異なるノートが検出された場合、カウントをリセット
      this.lastDetectedNote = midiNote;
      this.noteHoldCount = 1;
    }
  }
  
  /**
   * マイク入力を停止
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    // ワークレットに停止を通知
    this.workletNode?.port.postMessage({ type: 'disable' });
    
    // 接続を解除
    this.sourceNode?.disconnect();
    this.workletNode?.disconnect();
    
    // MediaStream を停止
    this.mediaStream?.getTracks().forEach(track => track.stop());
    
    // 状態リセット
    this.sourceNode = null;
    this.workletNode = null;
    this.mediaStream = null;
    this.currentNote = null;
    this.noteHoldCount = 0;
    this.silenceCount = 0;
    this.lastDetectedNote = null;
    
    this.isRunning = false;
    log.info('🎤 マイク入力停止');
  }
  
  /**
   * サービスを破棄
   */
  async destroy(): Promise<void> {
    this.stop();
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.detectPitch = null;
    this.isInitialized = false;
    
    log.info('🎤 PitchDetectorService 破棄完了');
  }
  
  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<PitchDetectorConfig>): void {
    // コールバック更新
    if (newConfig.onPitchDetected !== undefined) {
      this.callbacks.onPitchDetected = newConfig.onPitchDetected;
    }
    if (newConfig.onNoteOn !== undefined) {
      this.callbacks.onNoteOn = newConfig.onNoteOn;
    }
    if (newConfig.onNoteOff !== undefined) {
      this.callbacks.onNoteOff = newConfig.onNoteOff;
    }
    if (newConfig.onError !== undefined) {
      this.callbacks.onError = newConfig.onError;
    }
    
    // アルゴリズム変更時は再初期化
    if (newConfig.algorithm && newConfig.algorithm !== this.config.algorithm) {
      this.config.algorithm = newConfig.algorithm;
      this.initializePitchfinder();
    }
    
    // 閾値の更新
    if (newConfig.threshold !== undefined) {
      this.config.threshold = newConfig.threshold;
      this.initializePitchfinder();
    }
    
    // バッファサイズの更新
    if (newConfig.bufferSize !== undefined && this.workletNode) {
      this.config.bufferSize = newConfig.bufferSize;
      this.workletNode.port.postMessage({
        type: 'setBufferSize',
        size: newConfig.bufferSize
      });
    }
  }
  
  /**
   * 実行中かどうか
   */
  get running(): boolean {
    return this.isRunning;
  }
  
  /**
   * 初期化済みかどうか
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * 現在の設定を取得
   */
  getConfig(): typeof this.config {
    return { ...this.config };
  }
}

// シングルトンインスタンス（オプション）
let instance: PitchDetectorService | null = null;

export function getPitchDetectorInstance(config?: PitchDetectorConfig): PitchDetectorService {
  if (!instance) {
    instance = new PitchDetectorService(config);
  }
  return instance;
}

export function destroyPitchDetectorInstance(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

export default PitchDetectorService;
