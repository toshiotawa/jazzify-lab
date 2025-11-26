/**
 * AudioPitchController
 * リアルタイムピッチ検出によるマイク入力コントローラー
 * 
 * 対応プラットフォーム:
 * - iOS Safari (Web MIDI Browser app推奨)
 * - Android Chrome
 * - Windows/Mac Chrome, Firefox, Safari, Edge
 * 
 * 使用ライブラリ: pitchy (YINアルゴリズム)
 */

import { PitchDetector } from 'pitchy';
import { log } from '@/utils/logger';

// ===== 型定義 =====

export interface AudioPitchControllerOptions {
  /** ノートオン時のコールバック */
  onNoteOn: (note: number, velocity?: number) => void;
  /** ノートオフ時のコールバック */
  onNoteOff: (note: number) => void;
  /** 接続状態変更時のコールバック */
  onConnectionChange?: (connected: boolean) => void;
  /** ピッチ検出時のコールバック（デバッグ用） */
  onPitchDetected?: (frequency: number, clarity: number, midiNote: number) => void;
  /** バッファサイズ (デフォルト: 2048) */
  bufferSize?: number;
  /** 検出の明瞭度しきい値 (0-1, デフォルト: 0.9) */
  clarityThreshold?: number;
  /** 最小検出周波数 (Hz, デフォルト: 60) - ギター最低音付近 */
  minFrequency?: number;
  /** 最大検出周波数 (Hz, デフォルト: 2000) */
  maxFrequency?: number;
  /** ノート安定化のための連続検出回数 (デフォルト: 2) */
  noteStabilityCount?: number;
  /** ノートオフまでの無音フレーム数 (デフォルト: 8) */
  silenceFramesForNoteOff?: number;
}

interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  supportsAudioWorklet: boolean;
}

// ===== ヘルパー関数 =====

/**
 * 周波数からMIDIノート番号に変換
 * A4 = 440Hz = MIDI 69
 */
const frequencyToMidiNote = (frequency: number): number => {
  if (frequency <= 0) return -1;
  return Math.round(12 * Math.log2(frequency / 440) + 69);
};

/**
 * プラットフォーム情報を取得
 */
const getPlatformInfo = (): PlatformInfo => {
  if (typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      supportsAudioWorklet: false
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (/Macintosh/.test(ua) && 'ontouchend' in document);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  
  // AudioWorklet対応チェック
  const supportsAudioWorklet = typeof AudioWorkletNode !== 'undefined' && 
    typeof AudioContext !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (AudioContext.prototype as unknown as { audioWorklet?: unknown }).audioWorklet !== 'undefined';

  return { isIOS, isAndroid, isSafari, isChrome, isFirefox, supportsAudioWorklet };
};

// ===== AudioPitchController クラス =====

export class AudioPitchController {
  private readonly onNoteOn: (note: number, velocity?: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private readonly onConnectionChange?: (connected: boolean) => void;
  private readonly onPitchDetected?: (frequency: number, clarity: number, midiNote: number) => void;
  
  // 設定
  private readonly bufferSize: number;
  private clarityThreshold: number; // 動的に変更可能
  private readonly minFrequency: number;
  private readonly maxFrequency: number;
  private readonly noteStabilityCount: number;
  private readonly silenceFramesForNoteOff: number;
  
  // オーディオ関連
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pitchDetector: PitchDetector<Float32Array<ArrayBuffer>> | null = null;
  private inputBuffer: Float32Array<ArrayBuffer> | null = null;
  
  // 状態管理
  private isEnabled = false;
  private isInitialized = false;
  private animationFrameId: number | null = null;
  private currentNote: number | null = null;
  private consecutiveNoteCount = 0;
  private silenceFrameCount = 0;
  private lastDetectedNote: number | null = null;
  
  // PIXI.js連携用
  private onKeyHighlight?: (note: number, active: boolean) => void;
  
  // プラットフォーム情報
  private readonly platformInfo: PlatformInfo;

  constructor(options: AudioPitchControllerOptions) {
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange;
    this.onPitchDetected = options.onPitchDetected;
    
    // 設定値（クロスプラットフォーム最適化）
    this.bufferSize = options.bufferSize ?? 2048;
    this.clarityThreshold = options.clarityThreshold ?? 0.9;
    this.minFrequency = options.minFrequency ?? 60;  // E1付近
    this.maxFrequency = options.maxFrequency ?? 2000; // C7付近
    this.noteStabilityCount = options.noteStabilityCount ?? 2;
    this.silenceFramesForNoteOff = options.silenceFramesForNoteOff ?? 8;
    
    this.platformInfo = getPlatformInfo();
    
    log.info('🎤 AudioPitchController initialized', {
      platform: this.platformInfo,
      bufferSize: this.bufferSize,
      clarityThreshold: this.clarityThreshold
    });
  }

  /**
   * マイク入力の初期化
   * ユーザージェスチャー後に呼び出す必要がある
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('🎤 AudioPitchController already initialized');
      return;
    }

    try {
      log.info('🎤 Initializing AudioPitchController...');
      
      // マイクへのアクセス権限を要求
      await this.requestMicrophoneAccess();
      
      // AudioContext を作成
      await this.createAudioContext();
      
      // ピッチ検出器をセットアップ
      this.setupPitchDetector();
      
      this.isInitialized = true;
      log.info('✅ AudioPitchController initialized successfully');
      
    } catch (error) {
      log.error('❌ AudioPitchController initialization failed:', error);
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  /**
   * マイクへのアクセス権限を要求
   */
  private async requestMicrophoneAccess(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('このブラウザはマイク入力に対応していません。');
    }

    try {
      // iOS Safari対策: 明示的にオーディオのみを要求
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // iOS Safari では channelCount を明示的に指定
          ...(this.platformInfo.isIOS ? { channelCount: 1 } : {})
        },
        video: false
      };

      log.info('🎤 Requesting microphone access...', { constraints });
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      log.info('✅ Microphone access granted', {
        tracks: this.mediaStream.getAudioTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          settings: t.getSettings()
        }))
      });
      
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('マイクが見つかりません。マイクが接続されているか確認してください。');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('マイクが他のアプリで使用中です。他のアプリを閉じてから再試行してください。');
      }
      throw new Error(`マイクへのアクセスに失敗しました: ${err.message ?? 'Unknown error'}`);
    }
  }

  /**
   * AudioContext を作成
   */
  private async createAudioContext(): Promise<void> {
    // iOS Safari 対応: webkitAudioContext もチェック
    const AudioContextClass = window.AudioContext || 
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('このブラウザは Web Audio API に対応していません。');
    }

    // 低レイテンシ設定
    const contextOptions: AudioContextOptions = {
      latencyHint: 'interactive',
      sampleRate: this.platformInfo.isIOS ? 44100 : undefined // iOS は 44100 を推奨
    };

    this.audioContext = new AudioContextClass(contextOptions);
    
    log.info('🎤 AudioContext created', {
      sampleRate: this.audioContext.sampleRate,
      state: this.audioContext.state,
      baseLatency: (this.audioContext as unknown as { baseLatency?: number }).baseLatency,
      outputLatency: (this.audioContext as unknown as { outputLatency?: number }).outputLatency
    });

    // iOS Safari 対応: suspended 状態からの resume
    if (this.audioContext.state === 'suspended') {
      log.info('🎤 AudioContext is suspended, attempting to resume...');
      await this.audioContext.resume();
      log.info('✅ AudioContext resumed');
    }

    // ソースノードを作成
    if (!this.mediaStream) {
      throw new Error('MediaStream is not available');
    }
    
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // AnalyserNode を作成（ピッチ検出用）
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.bufferSize * 2;
    this.analyserNode.smoothingTimeConstant = 0;
    
    // ソースを Analyser に接続（出力はしない）
    this.sourceNode.connect(this.analyserNode);
    
    // 入力バッファを初期化
    this.inputBuffer = new Float32Array(this.bufferSize);
  }

  /**
   * ピッチ検出器をセットアップ
   */
  private setupPitchDetector(): void {
    if (!this.audioContext || !this.inputBuffer) {
      throw new Error('AudioContext or inputBuffer is not available');
    }
    
    // pitchy の PitchDetector を初期化
    this.pitchDetector = PitchDetector.forFloat32Array(this.bufferSize);
    
    log.info('🎤 PitchDetector initialized', {
      bufferSize: this.bufferSize,
      sampleRate: this.audioContext.sampleRate
    });
  }

  /**
   * ピッチ検出を開始
   */
  public start(): void {
    if (!this.isInitialized) {
      log.warn('⚠️ AudioPitchController not initialized. Call initialize() first.');
      return;
    }
    
    if (this.isEnabled) {
      log.info('🎤 Already started');
      return;
    }

    this.isEnabled = true;
    this.startDetectionLoop();
    this.notifyConnectionChange(true);
    
    log.info('✅ AudioPitchController started');
  }

  /**
   * ピッチ検出を停止
   */
  public stop(): void {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;
    this.stopDetectionLoop();
    
    // 現在発音中のノートがあればオフにする
    if (this.currentNote !== null) {
      this.triggerNoteOff(this.currentNote);
      this.currentNote = null;
    }
    
    this.notifyConnectionChange(false);
    
    log.info('🎤 AudioPitchController stopped');
  }

  /**
   * ピッチ検出ループを開始
   */
  private startDetectionLoop(): void {
    const detectPitch = (): void => {
      if (!this.isEnabled || !this.analyserNode || !this.inputBuffer || !this.pitchDetector || !this.audioContext) {
        return;
      }

      // 時間領域データを取得
      this.analyserNode.getFloatTimeDomainData(this.inputBuffer);
      
      // ピッチを検出
      const [frequency, clarity] = this.pitchDetector.findPitch(
        this.inputBuffer, 
        this.audioContext.sampleRate
      );
      
      // 周波数範囲チェックと明瞭度チェック
      const isValidPitch = 
        frequency >= this.minFrequency && 
        frequency <= this.maxFrequency && 
        clarity >= this.clarityThreshold;
      
      if (isValidPitch) {
        const midiNote = frequencyToMidiNote(frequency);
        
        // デバッグコールバック
        if (this.onPitchDetected) {
          this.onPitchDetected(frequency, clarity, midiNote);
        }
        
        this.handleDetectedNote(midiNote, clarity);
      } else {
        this.handleSilence();
      }
      
      // 次のフレームをスケジュール
      this.animationFrameId = requestAnimationFrame(detectPitch);
    };

    detectPitch();
  }

  /**
   * ピッチ検出ループを停止
   */
  private stopDetectionLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 検出されたノートを処理
   */
  private handleDetectedNote(midiNote: number, clarity: number): void {
    this.silenceFrameCount = 0;

    // 同じノートが連続で検出された場合
    if (midiNote === this.lastDetectedNote) {
      this.consecutiveNoteCount++;
    } else {
      this.consecutiveNoteCount = 1;
      this.lastDetectedNote = midiNote;
    }

    // ノート安定化: 連続検出回数がしきい値に達したら発音
    if (this.consecutiveNoteCount >= this.noteStabilityCount) {
      if (this.currentNote !== midiNote) {
        // 前のノートがあればオフにする
        if (this.currentNote !== null) {
          this.triggerNoteOff(this.currentNote);
        }
        
        // 新しいノートをオンにする
        this.triggerNoteOn(midiNote, Math.round(clarity * 127));
        this.currentNote = midiNote;
      }
    }
  }

  /**
   * 無音状態を処理
   */
  private handleSilence(): void {
    this.consecutiveNoteCount = 0;
    this.lastDetectedNote = null;
    this.silenceFrameCount++;

    // 一定フレーム無音が続いたらノートオフ
    if (this.silenceFrameCount >= this.silenceFramesForNoteOff && this.currentNote !== null) {
      this.triggerNoteOff(this.currentNote);
      this.currentNote = null;
    }
  }

  /**
   * ノートオンをトリガー
   */
  private triggerNoteOn(note: number, velocity: number = 100): void {
    // キーハイライト
    if (this.onKeyHighlight) {
      this.onKeyHighlight(note, true);
    }
    
    // コールバック
    this.onNoteOn(note, velocity);
  }

  /**
   * ノートオフをトリガー
   */
  private triggerNoteOff(note: number): void {
    // キーハイライト解除
    if (this.onKeyHighlight) {
      this.onKeyHighlight(note, false);
    }
    
    // コールバック
    this.onNoteOff(note);
  }

  /**
   * 接続状態変更を通知
   */
  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  // ===== 公開メソッド =====

  /**
   * 接続状態を取得
   */
  public isConnected(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  /**
   * 入力が有効かどうか
   */
  public isInputEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 入力を有効/無効にする
   */
  public setEnabled(enabled: boolean): void {
    if (enabled && !this.isEnabled) {
      this.start();
    } else if (!enabled && this.isEnabled) {
      this.stop();
    }
  }

  /**
   * キーハイライトコールバックを設定
   */
  public setKeyHighlightCallback(callback: (note: number, active: boolean) => void): void {
    this.onKeyHighlight = callback;
    log.info('🎤 Key highlight callback set');
  }

  /**
   * 明瞭度しきい値を動的に変更
   */
  public setClarityThreshold(threshold: number): void {
    this.clarityThreshold = Math.max(0, Math.min(1, threshold));
    log.info('🎤 Clarity threshold updated:', this.clarityThreshold);
  }

  /**
   * 利用可能なオーディオ入力デバイスを取得
   */
  public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      log.error('❌ Failed to enumerate audio devices:', error);
      return [];
    }
  }

  /**
   * 特定のオーディオ入力デバイスを選択
   */
  public async selectAudioInputDevice(deviceId: string): Promise<boolean> {
    try {
      // 既存のストリームを停止
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }

      // 新しいデバイスでストリームを取得
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });

      // ソースノードを再作成
      if (this.audioContext && this.analyserNode) {
        if (this.sourceNode) {
          this.sourceNode.disconnect();
        }
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.sourceNode.connect(this.analyserNode);
      }

      log.info('✅ Audio input device selected:', deviceId);
      return true;
    } catch (error) {
      log.error('❌ Failed to select audio input device:', error);
      return false;
    }
  }

  /**
   * リソースを解放
   */
  public async destroy(): Promise<void> {
    log.info('🎤 Destroying AudioPitchController...');
    
    this.stop();

    // ソースノードの切断
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // 既に切断されている場合は無視
      }
      this.sourceNode = null;
    }

    // メディアストリームの停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }

    // AudioContext のクローズ
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {
        // 既にクローズされている場合は無視
      }
      this.audioContext = null;
    }

    this.analyserNode = null;
    this.pitchDetector = null;
    this.inputBuffer = null;
    this.isInitialized = false;

    log.info('✅ AudioPitchController destroyed');
  }

  /**
   * プラットフォーム情報を取得
   */
  public getPlatformInfo(): PlatformInfo {
    return { ...this.platformInfo };
  }

  /**
   * 現在のサンプルレートを取得
   */
  public getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 0;
  }

  /**
   * iOS Safari での AudioContext resume（ユーザージェスチャー後に呼び出す）
   */
  public async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      log.info('✅ AudioContext resumed via user gesture');
    }
  }
}

export default AudioPitchController;
