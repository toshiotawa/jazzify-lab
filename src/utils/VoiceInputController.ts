/**
 * VoiceInputController - 音声入力によるピッチ検出コントローラー
 * WASMピッチ検出器を使用した低レイテンシ単音検出（iOS対応）
 * 
 * 最適化版:
 * - 処理スロットリングでUIスレッド負荷軽減
 * - 固定リングバッファでWASM連携
 * - 効率的なピッチ履歴管理
 */

import { log, devLog } from '@/utils/logger';

// WASM モジュールのインポート用型定義
type WasmPitchDetectorModule = {
  default: (module_or_path?: { module_or_path: string | URL } | string | URL | Promise<string | URL>) => Promise<InitOutput>;
  initSync: (module: { module: BufferSource | WebAssembly.Module } | BufferSource | WebAssembly.Module) => InitOutput;
  init_pitch_detector: (sample_rate: number) => void;
  get_ring_buffer_ptr: () => number;
  get_ring_buffer_size: () => number;
  process_audio_block: (new_write_index: number) => number;
  get_memory: () => WebAssembly.Memory;
  alloc: (size: number) => number;
  free: (ptr: number, size: number) => void;
  analyze_pitch: (ptr: number, length: number, sample_rate: number, yin_threshold: number) => number;
};

interface InitOutput {
  readonly memory: WebAssembly.Memory;
}

interface VoiceInputCallbacks {
  onNoteOn: (note: number, velocity?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

interface AudioDeviceInfo {
  deviceId: string;
  label: string;
}

interface GetAudioDevicesOptions {
  /** true の場合、デバイスラベル取得のために一度だけ権限要求を行う */
  requestPermission?: boolean;
}

// iOS検出ユーティリティ
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// サポート確認
const isVoiceInputSupported = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export class VoiceInputController {
  // コールバック
  private onNoteOn: (note: number, velocity?: number) => void;
  private onNoteOff: (note: number) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private onError?: (error: string) => void;

  // オーディオ関連
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private analyserTimer: ReturnType<typeof setInterval> | null = null;
  private silentGainNode: GainNode | null = null;
  private currentDeviceId: string | null = null;
  private isProcessing = false;

  // WASM関連
  private wasmModule: WasmPitchDetectorModule | null = null;
  private wasmMemory: WebAssembly.Memory | null = null;
  private ringBufferPtr = 0;
  private ringSize = 0;
  private writeIndex = 0;
  private wasmInitialized = false;

  // ピッチ検出パラメータ
  private sampleRate = 44100;
  private readonly bufferSize = 512; // 低レイテンシ用
  private readonly minFrequency = 27.5; // A0
  private readonly maxFrequency = 4186.01; // C8
  private noteOnThreshold = 0.008;
  private noteOffThreshold = 0.003;
  private readonly pyinThreshold = 0.15;
  private silenceThreshold = 0.002;
  private sensitivityLevel = 5;

  // ノート状態
  private currentNote = -1;
  private isNoteOn = false;

  // 🚀 最適化: 固定サイズピッチ履歴（レイテンシ重視で縮小）
  private readonly pitchHistorySize = 2; // 3→2に縮小（応答性向上）
  private pitchHistory: Int8Array = new Int8Array(this.pitchHistorySize);
  private pitchHistoryIndex = 0;
  private pitchHistoryCount = 0;

  // 🚀 超低レイテンシ最適化: 処理スロットリング
  private lastProcessTime = 0;
  private readonly minProcessInterval = 3; // 3ms間隔（約333Hz）- 最小レイテンシ
  private pendingSamples: Float32Array | null = null;
  private accumulatedSamples: Float32Array;
  private accumulatedLength = 0;
  private readonly targetAccumulationSize = 256; // 256サンプルで処理開始（約5ms相当@48kHz）

  // iOS対応
  private readonly isIOSDevice: boolean;

  // 周波数テーブル（事前計算）
  private noteFrequencies: Float32Array;
  private readonly noteMin = 21; // A0
  private readonly noteMax = 108; // C8

  constructor(callbacks: VoiceInputCallbacks) {
    this.onNoteOn = callbacks.onNoteOn;
    this.onNoteOff = callbacks.onNoteOff;
    this.onConnectionChange = callbacks.onConnectionChange;
    this.onError = callbacks.onError;
    this.isIOSDevice = isIOS();

    // 周波数テーブル初期化（事前計算）
    const noteCount = this.noteMax - this.noteMin + 1;
    this.noteFrequencies = new Float32Array(noteCount);
    for (let i = 0; i < noteCount; i++) {
      const note = this.noteMin + i;
      this.noteFrequencies[i] = 440 * Math.pow(2, (note - 69) / 12);
    }

    // 蓄積バッファ初期化
    this.accumulatedSamples = new Float32Array(this.targetAccumulationSize * 2);

    if (this.isIOSDevice) {
      log.info('🍎 iOS環境を検出: 特別なオーディオ処理を適用');
    }
  }

  /** サポート確認 */
  static isSupported(): boolean {
    return isVoiceInputSupported();
  }

  /** iOS判定 */
  static isIOS(): boolean {
    return isIOS();
  }

  /** WASM初期化 */
  async initializeWasm(): Promise<boolean> {
    if (this.wasmInitialized) {
      return true;
    }

    try {
      // 動的インポート
      const module = await import('@/wasm/pitch_detector.js') as WasmPitchDetectorModule;
      this.wasmModule = module;

      // WASMモジュール初期化
      await module.default('/wasm/pitch_detector_bg.wasm');
      this.wasmMemory = module.get_memory();

      log.info('✅ WASM ピッチ検出器初期化完了');
      this.wasmInitialized = true;
      return true;
    } catch (error) {
      log.error('❌ WASMピッチ検出器の初期化に失敗:', error);
      this.onError?.('WASMピッチ検出器の初期化に失敗しました');
      return false;
    }
  }

  /** 利用可能なオーディオ入力デバイス取得 */
  async getAudioDevices(options?: GetAudioDevicesOptions): Promise<AudioDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      if (options?.requestPermission) {
        const ok = await VoiceInputController.requestMicrophonePermission();
        if (!ok) {
          return [];
        }
      }

      // デバイスリスト取得
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`
        }));
    } catch (error) {
      log.warn('オーディオデバイスリストの取得に失敗:', error);
      return [];
    }
  }

  /**
   * マイク権限を要求する（権限付与後すぐに停止）
   * iOS ではユーザー操作（タップ等）の直後に呼ぶことを推奨。
   */
  static async requestMicrophonePermission(deviceId?: string): Promise<boolean> {
    if (!isVoiceInputSupported() || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined
        },
        video: false
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      log.warn('マイク権限の取得に失敗:', error);
      return false;
    }
  }

  /** デバイス接続 */
  async connect(deviceId?: string): Promise<boolean> {
    if (!VoiceInputController.isSupported()) {
      log.error('音声入力はこのブラウザでサポートされていません');
      this.onError?.('音声入力はこのブラウザでサポートされていません');
      return false;
    }

    // WASM初期化
    if (!await this.initializeWasm()) {
      return false;
    }

    try {
      // 既存接続のクリーンアップ
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      log.info('🎤 マイク許可を要求...');
      
      // マイクアクセス
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      log.info('✅ マイク許可取得:', 
        this.mediaStream.getAudioTracks().map(t => t.label).join(', '));

      // AudioContext作成
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioContextClass = window.AudioContext || 
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('AudioContext is not supported');
        }
        
        this.audioContext = new AudioContextClass();
      }

      // iOS: suspended状態の場合はresume
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sampleRate = this.audioContext.sampleRate;
      log.info('🔊 AudioContext サンプルレート:', this.sampleRate);

      // WASMピッチ検出器初期化
      if (this.wasmModule) {
        this.wasmModule.init_pitch_detector(this.sampleRate);
        this.ringBufferPtr = this.wasmModule.get_ring_buffer_ptr();
        this.ringSize = this.wasmModule.get_ring_buffer_size();
        this.writeIndex = 0;
        log.info('🔧 WASMリングバッファ設定完了 ptr:', this.ringBufferPtr, 'size:', this.ringSize);
      }

      // オーディオソース作成
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorklet または ScriptProcessor でセットアップ
      if (window.AudioWorkletNode) {
        await this.setupAudioWorklet(source);
      } else {
        this.setupScriptProcessor(source);
      }

      // デバイスID記録
      const tracks = this.mediaStream.getAudioTracks();
      if (tracks.length > 0) {
        const settings = tracks[0].getSettings();
        this.currentDeviceId = settings.deviceId ?? deviceId ?? null;
      }

      this.onConnectionChange?.(true);
      log.info('✅ 音声入力接続完了');
      return true;
    } catch (error) {
      log.error('音声入力接続エラー:', error);
      this.onError?.('マイクへのアクセスに失敗しました。権限を確認してください。');
      return false;
    }
  }

  /** AudioWorkletセットアップ */
  private async setupAudioWorklet(source: MediaStreamAudioSourceNode): Promise<void> {
    if (!this.audioContext || !this.wasmModule) {
      throw new Error('AudioContext or WASM module not initialized');
    }

    try {
      await this.audioContext.audioWorklet.addModule('/js/audio/audio-worklet-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      if (!this.silentGainNode) {
        this.silentGainNode = this.audioContext.createGain();
        this.silentGainNode.gain.value = 0;
        this.silentGainNode.connect(this.audioContext.destination);
      }

      // Workletにリングバッファ情報を送信
      this.workletNode.port.postMessage({
        type: 'init',
        ptr: this.ringBufferPtr,
        ringSize: this.ringSize
      });

      // サンプル受信処理（最適化版）
      this.workletNode.port.onmessage = (e) => {
        if (e.data.type === 'samples') {
          this.handleIncomingSamples(e.data.samples);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.silentGainNode);
      this.isProcessing = true;
      
      log.info('✅ AudioWorklet設定完了');
    } catch (error) {
      log.warn('AudioWorklet初期化失敗、ScriptProcessorにフォールバック:', error);
      this.setupScriptProcessor(source);
    }
  }

  /** ScriptProcessor フォールバック */
  private setupScriptProcessor(source: MediaStreamAudioSourceNode): void {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // ScriptProcessor非対応の場合はAnalyserNodeを使用
    if (typeof this.audioContext.createScriptProcessor !== 'function') {
      log.warn('ScriptProcessor非サポート、AnalyserNodeフォールバック');
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.bufferSize * 2;
      source.connect(this.analyserNode);

      this.analyserTimer = setInterval(() => {
        if (!this.analyserNode) return;
        const dataArray = new Float32Array(this.bufferSize);
        this.analyserNode.getFloatTimeDomainData(dataArray);
        this.handleIncomingSamples(dataArray);
      }, 16); // 16ms間隔（約60Hz）

      this.isProcessing = true;
      return;
    }

    this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
    this.scriptNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.handleIncomingSamples(inputData);
    };

    source.connect(this.scriptNode);
    if (!this.silentGainNode) {
      this.silentGainNode = this.audioContext.createGain();
      this.silentGainNode.gain.value = 0;
      this.silentGainNode.connect(this.audioContext.destination);
    }
    this.scriptNode.connect(this.silentGainNode);
    this.isProcessing = true;

    log.info('✅ ScriptProcessor設定完了');
  }

  /** 
   * 🚀 受信サンプルの処理（レイテンシ最適化版）
   * サンプルを蓄積してから一括処理することでオーバーヘッドを削減
   * レイテンシを下げるため、蓄積サイズを小さくしつつ処理間隔を短縮
   */
  private handleIncomingSamples(samples: Float32Array): void {
    if (!this.isProcessing || !this.wasmModule || !this.wasmMemory) {
      return;
    }

    // サンプルを蓄積バッファに追加（メモリ効率的な方法）
    const newLength = this.accumulatedLength + samples.length;
    
    // バッファ拡張が必要な場合（倍のサイズで確保してGC削減）
    if (newLength > this.accumulatedSamples.length) {
      const newBuffer = new Float32Array(Math.max(newLength * 2, 1024));
      newBuffer.set(this.accumulatedSamples.subarray(0, this.accumulatedLength));
      this.accumulatedSamples = newBuffer;
    }
    
    this.accumulatedSamples.set(samples, this.accumulatedLength);
    this.accumulatedLength = newLength;

    // 🚀 超低レイテンシ: 最小間隔チェック（さらに短縮）
    const now = performance.now();
    const elapsed = now - this.lastProcessTime;
    
    // 十分なサンプルが蓄積されたら即座に処理（レイテンシ最優先）
    if (this.accumulatedLength >= this.targetAccumulationSize && elapsed >= this.minProcessInterval) {
      this.lastProcessTime = now;
      this.processAccumulatedSamples();
    } else if (elapsed >= this.minProcessInterval * 2 && this.accumulatedLength >= this.targetAccumulationSize * 0.6) {
      // 🚀 応答性向上: 6ms経過で60%のサンプルでも処理開始
      this.lastProcessTime = now;
      this.processAccumulatedSamples();
    }
  }

  /** 蓄積されたサンプルを一括処理 */
  private processAccumulatedSamples(): void {
    if (!this.wasmModule || !this.wasmMemory || this.accumulatedLength === 0) {
      return;
    }

    const samples = this.accumulatedSamples.subarray(0, this.accumulatedLength);

    // 入力信号レベルチェック（SIMD風に4要素ずつ処理）
    let maxAmplitude = 0;
    let sumSquares = 0;
    const len = samples.length;
    const unrollLimit = len - (len % 4);
    
    let i = 0;
    while (i < unrollLimit) {
      const s0 = samples[i];
      const s1 = samples[i + 1];
      const s2 = samples[i + 2];
      const s3 = samples[i + 3];
      
      const a0 = Math.abs(s0);
      const a1 = Math.abs(s1);
      const a2 = Math.abs(s2);
      const a3 = Math.abs(s3);
      
      if (a0 > maxAmplitude) maxAmplitude = a0;
      if (a1 > maxAmplitude) maxAmplitude = a1;
      if (a2 > maxAmplitude) maxAmplitude = a2;
      if (a3 > maxAmplitude) maxAmplitude = a3;
      
      sumSquares += s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3;
      i += 4;
    }
    
    // 残りの要素
    while (i < len) {
      const s = samples[i];
      const a = Math.abs(s);
      if (a > maxAmplitude) maxAmplitude = a;
      sumSquares += s * s;
      i++;
    }
    
    const rms = Math.sqrt(sumSquares / len);
    const effectiveLevel = Math.max(maxAmplitude, rms * 2);

    // ノート状態更新
    if (!this.isNoteOn && effectiveLevel > this.noteOnThreshold) {
      this.isNoteOn = true;
      devLog.debug('🎤 Note state: ON (level:', effectiveLevel.toFixed(4), ')');
    } else if (this.isNoteOn && effectiveLevel < this.noteOffThreshold) {
      this.isNoteOn = false;
      devLog.debug('🎤 Note state: OFF (level:', effectiveLevel.toFixed(4), ')');
      this.handleNoPitch();
      this.accumulatedLength = 0;
      return;
    }

    // 完全な無音は除外
    if (effectiveLevel < this.silenceThreshold) {
      this.accumulatedLength = 0;
      return;
    }

    // メモリ検証
    const currentMemory = this.wasmModule.get_memory();
    const requiredBytes = this.ringBufferPtr + (this.ringSize * 4);
    if (requiredBytes > currentMemory.buffer.byteLength) {
      this.accumulatedLength = 0;
      return;
    }

    // リングバッファに書き込み
    const ringBuffer = new Float32Array(currentMemory.buffer, this.ringBufferPtr, this.ringSize);
    for (let j = 0; j < len; j++) {
      ringBuffer[this.writeIndex] = samples[j];
      this.writeIndex = (this.writeIndex + 1) % this.ringSize;
    }

    // WASMでピッチ検出
    const frequency = this.wasmModule.process_audio_block(this.writeIndex);

    if (frequency > 0 && frequency >= this.minFrequency && frequency <= this.maxFrequency) {
      this.handleDetectedPitch(frequency, maxAmplitude);
    } else if (this.isNoteOn) {
      this.handleNoPitch();
    }

    // 蓄積バッファをクリア
    this.accumulatedLength = 0;
  }

  /** ピッチ検出時のハンドリング */
  private handleDetectedPitch(frequency: number, amplitude: number): void {
    const midiNote = this.frequencyToMidi(frequency);
    
    // ピッチ履歴更新（リングバッファ方式）
    this.pitchHistory[this.pitchHistoryIndex] = midiNote;
    this.pitchHistoryIndex = (this.pitchHistoryIndex + 1) % this.pitchHistorySize;
    if (this.pitchHistoryCount < this.pitchHistorySize) {
      this.pitchHistoryCount++;
    }

    // 安定したノートを取得
    const stableNote = this.getStableNote();
    if (stableNote === -1) {
      return;
    }

    // ノート変更検出
    if (stableNote !== this.currentNote) {
      if (this.currentNote !== -1) {
        this.onNoteOff(this.currentNote);
        devLog.debug(`🎵 Note Off: ${this.currentNote} (${this.midiToNoteName(this.currentNote)})`);
      }
      this.currentNote = stableNote;
      this.onNoteOn(stableNote, 64);
      log.info(`🎵 Note On: ${stableNote} (${this.midiToNoteName(stableNote)}) freq=${frequency.toFixed(1)}Hz amp=${amplitude.toFixed(4)}`);
    }
  }

  /** ピッチ未検出時のハンドリング */
  private handleNoPitch(): void {
    // 履歴に-1を追加
    this.pitchHistory[this.pitchHistoryIndex] = -1;
    this.pitchHistoryIndex = (this.pitchHistoryIndex + 1) % this.pitchHistorySize;
    if (this.pitchHistoryCount < this.pitchHistorySize) {
      this.pitchHistoryCount++;
    }

    // 連続した無音フレームをカウント
    let silentFrames = 0;
    for (let i = 0; i < this.pitchHistoryCount; i++) {
      if (this.pitchHistory[i] === -1) {
        silentFrames++;
      }
    }

    if (silentFrames >= 1 && this.currentNote !== -1) {
      this.onNoteOff(this.currentNote);
      devLog.debug(`🎵 Note Off: ${this.currentNote}`);
      this.currentNote = -1;
      this.isNoteOn = false;
    }
  }

  /** 
   * 🚀 超低レイテンシ版: 安定したノートを取得
   * - 履歴サイズ 2 に最適化
   * - 連続した同じノートで即座に確定
   */
  private getStableNote(): number {
    // 🚀 履歴が 1 つでも即座に返す（レイテンシ最優先）
    if (this.pitchHistoryCount === 0) {
      return -1;
    }
    
    // 履歴が 1 つの場合、そのノートを返す
    if (this.pitchHistoryCount === 1) {
      const note = this.pitchHistory[0];
      return note !== -1 ? note : -1;
    }

    // 🚀 2つの履歴が同じなら即座に確定
    const note0 = this.pitchHistory[0];
    const note1 = this.pitchHistory[1];
    
    if (note0 === note1 && note0 !== -1) {
      return note0;
    }
    
    // 異なる場合は最新のノートを返す（応答性重視）
    const latestIndex = (this.pitchHistoryIndex - 1 + this.pitchHistorySize) % this.pitchHistorySize;
    const latestNote = this.pitchHistory[latestIndex];
    return latestNote !== -1 ? latestNote : -1;
  }

  /** 周波数からMIDIノート番号に変換（最適化版） */
  private frequencyToMidi(frequency: number): number {
    // 二分探索で最も近い周波数を見つける
    const noteCount = this.noteFrequencies.length;
    let left = 0;
    let right = noteCount - 1;
    
    while (left < right) {
      const mid = (left + right) >> 1;
      if (this.noteFrequencies[mid] < frequency) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // 前後の周波数と比較して最も近いものを選択
    let closestIndex = left;
    if (left > 0) {
      const diffLeft = Math.abs(frequency - this.noteFrequencies[left - 1]);
      const diffRight = Math.abs(frequency - this.noteFrequencies[left]);
      if (diffLeft < diffRight) {
        closestIndex = left - 1;
      }
    }
    
    return this.noteMin + closestIndex;
  }

  /** MIDIノート番号から音名に変換 */
  private midiToNoteName(note: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const noteName = noteNames[note % 12];
    return `${noteName}${octave}`;
  }

  /**
   * 音声認識の感度を設定（1-10）
   * 高い値 = より敏感（小さい音も検出）、低い値 = ノイズ耐性向上
   */
  setSensitivity(level: number): void {
    this.sensitivityLevel = Math.max(1, Math.min(10, Math.round(level)));
    const scale = Math.pow(10, (5 - this.sensitivityLevel) * 0.17);
    this.noteOnThreshold = 0.008 * scale;
    this.noteOffThreshold = 0.003 * scale;
    this.silenceThreshold = 0.002 * scale;
    log.info(`🎤 音声感度設定: レベル${this.sensitivityLevel} (noteOn=${this.noteOnThreshold.toFixed(5)}, noteOff=${this.noteOffThreshold.toFixed(5)})`);
  }

  /** 現在の感度レベルを取得 */
  getSensitivity(): number {
    return this.sensitivityLevel;
  }

  /** 接続状態確認 */
  isConnected(): boolean {
    return this.isProcessing && this.mediaStream !== null;
  }

  /** 現在のデバイスID取得 */
  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /** 切断 */
  async disconnect(): Promise<void> {
    log.info('🔌 音声入力切断開始');
    
    this.isProcessing = false;

    // Workletノード切断
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    // ScriptNode切断
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }

    // AnalyserNode切断
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.silentGainNode) {
      try {
        this.silentGainNode.disconnect();
      } catch (e) {
        log.warn('silentGainNode disconnect失敗:', e);
      }
      this.silentGainNode = null;
    }

    if (this.analyserTimer) {
      clearInterval(this.analyserTimer);
      this.analyserTimer = null;
    }

    // メディアストリーム停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // AudioContext処理
    if (this.audioContext) {
      if (this.isIOSDevice) {
        // iOSでは一時停止のみ
        try {
          await this.audioContext.suspend();
        } catch (e) {
          log.warn('AudioContext suspend失敗:', e);
        }
      } else {
        // 他環境ではクローズ
        try {
          await this.audioContext.close();
          this.audioContext = null;
        } catch (e) {
          log.warn('AudioContext close失敗:', e);
        }
      }
    }

    // ノート状態リセット
    if (this.currentNote !== -1) {
      this.onNoteOff(this.currentNote);
      this.currentNote = -1;
    }

    // 状態リセット
    this.currentDeviceId = null;
    this.pitchHistoryIndex = 0;
    this.pitchHistoryCount = 0;
    this.pitchHistory.fill(-1);
    this.accumulatedLength = 0;
    this.onConnectionChange?.(false);
    
    log.info('✅ 音声入力切断完了');
  }

  /** リソース破棄 */
  destroy(): void {
    void this.disconnect();
    this.wasmModule = null;
    this.wasmMemory = null;
    this.wasmInitialized = false;
  }
}

export default VoiceInputController;
