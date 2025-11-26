/**
 * リアルタイム音声ピッチ検出システム
 * pitchfinderライブラリを使用した低レイテンシ単音検出
 */

import { YIN } from 'pitchfinder';
import type { AudioPitchDetectorOptions } from '@/types';

// YINアルゴリズムを使用（単音検出に最適、低レイテンシ）

// MIDIノート番号の範囲（A0～C8）
const MIN_MIDI_NOTE = 21;
const MAX_MIDI_NOTE = 108;

// 周波数からMIDIノート番号に変換
const frequencyToMidiNote = (frequency: number): number | null => {
  if (frequency <= 0) return null;
  
  // A4 = 440Hz = MIDI 69
  const midiNote = 69 + 12 * Math.log2(frequency / 440);
  const roundedNote = Math.round(midiNote);
  
  // 範囲チェック
  if (roundedNote < MIN_MIDI_NOTE || roundedNote > MAX_MIDI_NOTE) {
    return null;
  }
  
  return roundedNote;
};

// 前回検出されたノートを追跡（ノートオフ検出用）
interface NoteState {
  note: number;
  confidence: number;
  lastDetectedTime: number;
  consecutiveDetections: number;
}

export class AudioPitchDetector {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private pitchDetector: ((buffer: Float32Array) => number | null) | null = null;
  
  private readonly onNoteOn: (note: number, velocity?: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private readonly onConnectionChange?: (connected: boolean) => void;
  
  private isEnabled = false;
  private isInitialized = false;
  private currentNoteState: NoteState | null = null;
  
  // ノート検出の閾値設定
  private readonly MIN_CONFIDENCE = 0.3; // 信頼度の最小値
  private readonly MIN_CONSECUTIVE_DETECTIONS = 2; // 連続検出回数（ノイズ除去）
  private readonly NOTE_OFF_TIMEOUT_MS = 100; // ノートオフ検出のタイムアウト
  
  // バッファサイズ（レイテンシと精度のバランス）
  private readonly BUFFER_SIZE = 2048; // 約46ms @ 44.1kHz
  
  constructor(options: AudioPitchDetectorOptions) {
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange;
  }
  
  /**
   * 音声入力システムの初期化
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Web Audio APIの確認
      if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('Web Audio API is not supported in this browser');
      }
      
      // AudioContextの作成
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive', // 低レイテンシモード
        sampleRate: 44100
      });
      
      // マイクアクセスの要求
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // エコーキャンセルはレイテンシを増やす可能性があるため無効化
          noiseSuppression: false, // ノイズサプレッションも無効化
          autoGainControl: false, // 自動ゲイン制御も無効化
          sampleRate: 44100,
          channelCount: 1 // モノラル
        }
      });
      
      // AnalyserNodeの作成
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.BUFFER_SIZE * 2; // 周波数分解能を上げる
      this.analyser.smoothingTimeConstant = 0.3; // スムージング（低レイテンシのため控えめに）
      
      // ScriptProcessorNodeの作成（リアルタイム処理用）
      this.scriptProcessor = this.audioContext.createScriptProcessor(this.BUFFER_SIZE, 1, 1);
      
      // 音声入力の接続
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);
      this.analyser.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
      
      // ピッチ検出器の初期化（YINアルゴリズム）
      this.pitchDetector = YIN({
        sampleRate: this.audioContext.sampleRate,
        threshold: 0.1, // 検出感度（低いほど敏感）
        probabilityThreshold: 0.1 // 信頼度の閾値
      });
      
      // オーディオ処理の開始
      this.scriptProcessor.onaudioprocess = this.handleAudioProcess.bind(this);
      
      this.isInitialized = true;
      this.notifyConnectionChange(true);
      
    } catch (error) {
      console.error('❌ Audio pitch detector initialization failed:', error);
      this.notifyConnectionChange(false);
      throw error;
    }
  }
  
  /**
   * オーディオデータの処理（リアルタイム）
   */
  private handleAudioProcess(event: AudioProcessingEvent): void {
    if (!this.isEnabled || !this.pitchDetector || !this.analyser) {
      return;
    }
    
    const inputBuffer = event.inputBuffer;
    const inputData = inputBuffer.getChannelData(0);
    
    // Float32Arrayに変換
    const buffer = new Float32Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      buffer[i] = inputData[i];
    }
    
    // ピッチ検出
    const frequency = this.pitchDetector(buffer);
    
    if (frequency && frequency > 0) {
      const midiNote = frequencyToMidiNote(frequency);
      
      if (midiNote !== null) {
        // 信号の強度を計算（簡易的な信頼度指標）
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          sumSquares += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        const confidence = Math.min(1.0, rms * 10); // 正規化（調整可能）
        
        this.processDetectedNote(midiNote, confidence);
      } else {
        // 範囲外の周波数
        this.handleNoteOff();
      }
    } else {
      // ピッチが検出されない
      this.handleNoteOff();
    }
  }
  
  /**
   * 検出されたノートの処理
   */
  private processDetectedNote(note: number, confidence: number): void {
    const now = Date.now();
    
    if (this.currentNoteState) {
      if (this.currentNoteState.note === note) {
        // 同じノートが連続検出
        this.currentNoteState.consecutiveDetections++;
        this.currentNoteState.lastDetectedTime = now;
        this.currentNoteState.confidence = Math.max(this.currentNoteState.confidence, confidence);
        
        // 信頼度と連続検出回数が閾値を超えたらノートオン
        if (
          this.currentNoteState.confidence >= this.MIN_CONFIDENCE &&
          this.currentNoteState.consecutiveDetections >= this.MIN_CONSECUTIVE_DETECTIONS
        ) {
          // 既にノートオン済みの場合は何もしない
          return;
        }
      } else {
        // 異なるノートが検出された
        // 前のノートをオフにする
        this.onNoteOff(this.currentNoteState.note);
        this.currentNoteState = null;
      }
    }
    
    // 新しいノートの検出開始
    if (!this.currentNoteState) {
      this.currentNoteState = {
        note,
        confidence,
        lastDetectedTime: now,
        consecutiveDetections: 1
      };
    }
    
    // 信頼度と連続検出回数が閾値を超えたらノートオン
    if (
      this.currentNoteState.confidence >= this.MIN_CONFIDENCE &&
      this.currentNoteState.consecutiveDetections >= this.MIN_CONSECUTIVE_DETECTIONS
    ) {
      // ノートオンイベントを発火（重複を防ぐため、初回のみ）
      if (this.currentNoteState.consecutiveDetections === this.MIN_CONSECUTIVE_DETECTIONS) {
        const velocity = Math.round(this.currentNoteState.confidence * 127);
        this.onNoteOn(this.currentNoteState.note, velocity);
      }
    }
  }
  
  /**
   * ノートオフの処理
   */
  private handleNoteOff(): void {
    if (!this.currentNoteState) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastDetection = now - this.currentNoteState.lastDetectedTime;
    
    // タイムアウト時間を超えたらノートオフ
    if (timeSinceLastDetection > this.NOTE_OFF_TIMEOUT_MS) {
      this.onNoteOff(this.currentNoteState.note);
      this.currentNoteState = null;
    }
  }
  
  /**
   * 音声入力を有効化
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      await this.audioContext?.resume();
    }
    
    this.isEnabled = true;
  }
  
  /**
   * 音声入力を無効化
   */
  public stop(): void {
    this.isEnabled = false;
    
    // 現在のノートをオフにする
    if (this.currentNoteState) {
      this.onNoteOff(this.currentNoteState.note);
      this.currentNoteState = null;
    }
  }
  
  /**
   * 接続の切断とクリーンアップ
   */
  public async disconnect(): Promise<void> {
    this.stop();
    
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    this.notifyConnectionChange(false);
  }
  
  /**
   * 接続状態の通知
   */
  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }
  
  /**
   * 接続状態の確認
   */
  public isConnected(): boolean {
    return this.isInitialized && this.mediaStream !== null;
  }
  
  /**
   * 有効/無効状態の確認
   */
  public isInputEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * 有効/無効状態の設定
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * 破棄処理
   */
  public async destroy(): Promise<void> {
    await this.disconnect();
  }
}
