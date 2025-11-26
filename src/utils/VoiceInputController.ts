/**
 * VoiceInputController - WASM ベースの低レイテンシ音声入力コントローラー
 * 単音ピッチ検出用、iOS対応
 */

import init, {
  analyze_pitch,
  alloc,
  free,
  get_memory,
  init_pitch_detector,
  get_ring_buffer_ptr,
  get_ring_buffer_size,
  process_audio_block
} from '@/wasm/pitch_detector.js';
import { log } from '@/utils/logger';

// iOS検出ユーティリティ
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
};

export interface VoiceInputCallbacks {
  onNoteOn: (note: number, velocity?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface VoiceInputOptions {
  /** ノイズゲート閾値（0-1、デフォルト: 0.05） */
  noiseGateThreshold?: number;
  /** 安定性フレーム数（デフォルト: 2） */
  stabilityFrames?: number;
  /** 最小周波数（デフォルト: 27.5 Hz = A0） */
  minFrequency?: number;
  /** 最大周波数（デフォルト: 4186.01 Hz = C8） */
  maxFrequency?: number;
}

interface AudioDevice {
  id: string;
  name: string;
}

export class VoiceInputController {
  private callbacks: VoiceInputCallbacks;
  private options: Required<VoiceInputOptions>;
  
  // Audio関連
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  
  // WASM関連
  private wasmMemory: WebAssembly.Memory | null = null;
  private wasmInitialized = false;
  private ringBufferPtr = 0;
  private ringSize = 0;
  private writeIndex = 0;
  
  // 状態管理
  private isProcessing = false;
  private isIOSDevice: boolean;
  private currentDeviceId: string | null = null;
  private sampleRate = 44100;
  
  // ピッチ検出用
  private pitchHistory: number[] = [];
  private currentNote = -1;
  private lastStableNote = -1;
  private consecutiveFrames = 0;
  private isNoteOn = false;
  
  // 周波数テーブル
  private noteFrequencies: Map<number, number>;
  
  // バッファ
  private bufferSize = 512;
  private samples: Float32Array;
  private accumulatedSamples: Float32Array;
  
  // PYIN閾値
  private pyinThreshold = 0.1;
  private silenceThreshold = 0.01;
  private noteOnThreshold = 0.05;
  private noteOffThreshold = 0.03;

  constructor(callbacks: VoiceInputCallbacks, options: VoiceInputOptions = {}) {
    this.callbacks = callbacks;
    this.options = {
      noiseGateThreshold: options.noiseGateThreshold ?? 0.05,
      stabilityFrames: options.stabilityFrames ?? 2,
      minFrequency: options.minFrequency ?? 27.5,
      maxFrequency: options.maxFrequency ?? 4186.01
    };
    
    this.isIOSDevice = isIOS();
    this.noteFrequencies = new Map();
    this.samples = new Float32Array(this.bufferSize);
    this.accumulatedSamples = new Float32Array(0);
    
    this.initializeNoteFrequencies();
    
    if (this.isIOSDevice) {
      log.info('🎤 iOS環境を検出。特別なオーディオ処理を適用します。');
    }
  }

  /**
   * WASM モジュールを初期化
   */
  async initialize(): Promise<boolean> {
    try {
      log.info('🎤 WASM ピッチ検出器を初期化中...');
      await init();
      this.wasmMemory = get_memory() as WebAssembly.Memory;
      this.wasmInitialized = true;
      log.info('✅ WASM ピッチ検出器の初期化完了');
      return true;
    } catch (error) {
      log.error('❌ WASM ピッチ検出器の初期化に失敗:', error);
      return false;
    }
  }

  /**
   * 利用可能なマイクデバイス一覧を取得
   */
  async getAvailableDevices(): Promise<AudioDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      log.warn('⚠️ enumerateDevices がサポートされていません');
      return [];
    }

    try {
      // 許可を得るために一度 getUserMedia を呼ぶ
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(track => track.stop());
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `マイク ${device.deviceId.slice(0, 4)}`
        }));
      
      return audioInputs;
    } catch (error) {
      log.error('❌ マイクデバイス一覧の取得に失敗:', error);
      return [];
    }
  }

  /**
   * 指定デバイスに接続
   */
  async connect(deviceId?: string): Promise<boolean> {
    try {
      log.info('🎤 マイク接続を開始:', deviceId || 'デフォルト');

      // 既存の接続をクリーンアップ
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // getUserMedia の存在確認
      if (!navigator.mediaDevices?.getUserMedia) {
        log.error('❌ getUserMedia がサポートされていません');
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
        }
      });

      // AudioContext の作成または再利用
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioContextClass = window.AudioContext || 
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        
        if (!AudioContextClass) {
          log.error('❌ Web Audio API がサポートされていません');
          return false;
        }
        
        this.audioContext = new AudioContextClass();
      }

      // iOS: suspended 状態の場合は resume
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sampleRate = this.audioContext.sampleRate;
      log.info(`🎤 AudioContext 状態: ${this.audioContext.state}, サンプルレート: ${this.sampleRate}`);

      // WASM ピッチ検出器を初期化
      if (this.wasmInitialized) {
        init_pitch_detector(this.sampleRate);
        this.ringBufferPtr = get_ring_buffer_ptr();
        this.ringSize = get_ring_buffer_size();
        log.info(`🎤 リングバッファ: ptr=${this.ringBufferPtr}, size=${this.ringSize}`);
      }

      // オーディオソースを作成
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorklet または ScriptProcessor をセットアップ
      if (window.AudioWorkletNode && this.audioContext.audioWorklet) {
        await this.setupAudioWorklet(source);
      } else {
        this.setupScriptProcessor(source);
      }

      this.currentDeviceId = deviceId || null;
      this.isProcessing = true;
      this.notifyConnectionChange(true);
      
      log.info('✅ マイク接続完了');
      return true;
    } catch (error) {
      log.error('❌ マイク接続に失敗:', error);
      this.notifyConnectionChange(false);
      return false;
    }
  }

  /**
   * 接続を切断
   */
  async disconnect(): Promise<void> {
    log.info('🎤 マイク接続を切断中...');
    
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

    // 現在のノートをリリース
    if (this.currentNote !== -1) {
      this.callbacks.onNoteOff(this.currentNote);
      this.currentNote = -1;
    }

    // iOS では AudioContext を閉じずに suspend
    if (this.audioContext) {
      if (this.isIOSDevice) {
        await this.audioContext.suspend();
      } else {
        await this.audioContext.close();
        this.audioContext = null;
      }
    }

    this.currentDeviceId = null;
    this.notifyConnectionChange(false);
    
    log.info('✅ マイク切断完了');
  }

  /**
   * 現在の接続状態を取得
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
   * リソースを解放
   */
  destroy(): void {
    void this.disconnect();
    this.wasmMemory = null;
    this.wasmInitialized = false;
  }

  // ================== Private Methods ==================

  private initializeNoteFrequencies(): void {
    // A0(21) から C8(108) までの周波数テーブル
    for (let note = 21; note <= 108; note++) {
      const frequency = 440 * Math.pow(2, (note - 69) / 12);
      this.noteFrequencies.set(note, frequency);
    }
  }

  private async setupAudioWorklet(source: MediaStreamAudioSourceNode): Promise<void> {
    if (!this.audioContext) return;

    try {
      await this.audioContext.audioWorklet.addModule('/js/audio/audio-worklet-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

      // リングバッファ情報を送信
      this.workletNode.port.postMessage({
        type: 'init',
        ptr: this.ringBufferPtr,
        ringSize: this.ringSize
      });

      this.workletNode.port.onmessage = (e) => {
        if (e.data.type === 'samples') {
          this.processLowLatencySamples(e.data.samples);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
      
      log.info('✅ AudioWorklet セットアップ完了');
    } catch (error) {
      log.warn('⚠️ AudioWorklet 初期化失敗、ScriptProcessor にフォールバック:', error);
      this.setupScriptProcessor(source);
    }
  }

  private setupScriptProcessor(source: MediaStreamAudioSourceNode): void {
    if (!this.audioContext) return;

    this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
    
    this.scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.processAudioData(inputData);
    };

    source.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
    
    log.info('✅ ScriptProcessor セットアップ完了');
  }

  private processLowLatencySamples(samples: Float32Array): void {
    if (!this.isProcessing || !this.wasmMemory) {
      this.processAudioData(samples);
      return;
    }

    if (!this.ringBufferPtr || !this.ringSize) {
      this.processAudioData(samples);
      return;
    }

    const currentMemory = get_memory() as WebAssembly.Memory;
    const requiredBytes = this.ringBufferPtr + (this.ringSize * 4);
    
    if (requiredBytes > currentMemory.buffer.byteLength) {
      this.processAudioData(samples);
      return;
    }

    const ringBuffer = new Float32Array(currentMemory.buffer, this.ringBufferPtr, this.ringSize);

    // サンプルをリングバッファにコピー
    for (let i = 0; i < samples.length; i++) {
      ringBuffer[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % this.ringSize;
    }

    // 32サンプルごとに処理（超低レイテンシ）
    if ((this.writeIndex & 0x1F) === 0) {
      const frequency = process_audio_block(this.writeIndex);
      
      if (frequency > 0 && frequency >= this.options.minFrequency && frequency <= this.options.maxFrequency) {
        this.handleDetectedPitch(frequency);
      } else {
        this.handleNoPitch();
      }
    }
  }

  private processAudioData(inputData: Float32Array): void {
    if (!this.isProcessing) return;

    // 累積バッファに追加
    const newBuffer = new Float32Array(this.accumulatedSamples.length + inputData.length);
    newBuffer.set(this.accumulatedSamples);
    newBuffer.set(inputData, this.accumulatedSamples.length);
    this.accumulatedSamples = newBuffer;

    // bufferSize 以上になったら処理
    while (this.accumulatedSamples.length >= this.bufferSize) {
      const block = this.accumulatedSamples.subarray(0, this.bufferSize);
      this.processBlock(block);

      const remaining = new Float32Array(this.accumulatedSamples.length - this.bufferSize);
      remaining.set(this.accumulatedSamples.subarray(this.bufferSize));
      this.accumulatedSamples = remaining;
    }
  }

  private processBlock(block: Float32Array): void {
    this.samples.set(block);

    // 最大振幅を計算
    let maxAmplitude = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(this.samples[i]));
    }

    // ノート状態を更新
    this.updateNoteState(maxAmplitude);

    if (!this.isNoteOn) {
      this.resetDetection();
      return;
    }

    // 無音チェック
    if (maxAmplitude < this.silenceThreshold) {
      this.resetDetection();
      return;
    }

    // WASM でピッチ分析
    if (this.wasmInitialized) {
      const dataLength = this.samples.length;
      const byteLength = dataLength * Float32Array.BYTES_PER_ELEMENT;
      const ptr = alloc(byteLength);
      const wasmArray = new Float32Array((get_memory() as WebAssembly.Memory).buffer, ptr, dataLength);
      wasmArray.set(this.samples);

      const frequency = analyze_pitch(ptr, byteLength, this.sampleRate, this.pyinThreshold);
      free(ptr, byteLength);

      if (frequency > 0 && frequency >= this.options.minFrequency && frequency <= this.options.maxFrequency) {
        this.handleDetectedPitch(frequency);
      } else {
        this.handleNoPitch();
      }
    }
  }

  private handleDetectedPitch(frequency: number): void {
    const midiNote = this.getClosestNote(frequency);

    // ピッチ履歴を更新
    this.pitchHistory.push(midiNote);
    if (this.pitchHistory.length > this.options.stabilityFrames + 2) {
      this.pitchHistory.shift();
    }

    // 安定したノートを取得
    const stableNote = this.getStableNote();
    
    if (stableNote !== -1 && stableNote !== this.currentNote) {
      // ノート変更を検出
      if (this.currentNote !== -1) {
        this.callbacks.onNoteOff(this.currentNote);
      }
      this.currentNote = stableNote;
      this.callbacks.onNoteOn(stableNote);
    }

    this.isNoteOn = true;
  }

  private handleNoPitch(): void {
    this.pitchHistory.push(-1);
    if (this.pitchHistory.length > this.options.stabilityFrames + 2) {
      this.pitchHistory.shift();
    }

    // 無音フレームが続いたらノートオフ
    const silentFrames = this.pitchHistory.filter(p => p === -1).length;
    if (silentFrames >= this.options.stabilityFrames && this.currentNote !== -1) {
      this.callbacks.onNoteOff(this.currentNote);
      this.currentNote = -1;
      this.isNoteOn = false;
    }
  }

  private getStableNote(): number {
    if (this.pitchHistory.length < this.options.stabilityFrames) {
      return -1;
    }

    const recentHistory = this.pitchHistory.slice(-this.options.stabilityFrames);
    const noteCounts = new Map<number, number>();

    for (const note of recentHistory) {
      if (note !== -1) {
        noteCounts.set(note, (noteCounts.get(note) || 0) + 1);
      }
    }

    let mostCommonNote = -1;
    let maxCount = 0;
    const minRequired = Math.ceil(this.options.stabilityFrames * 0.5);

    for (const [note, count] of noteCounts) {
      if (count > maxCount && count >= minRequired) {
        mostCommonNote = note;
        maxCount = count;
      }
    }

    return mostCommonNote;
  }

  private getClosestNote(frequency: number): number {
    let closestNote = 60; // C4
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

  private updateNoteState(amplitude: number): void {
    if (!this.isNoteOn && amplitude > this.noteOnThreshold) {
      this.isNoteOn = true;
    } else if (this.isNoteOn && amplitude < this.noteOffThreshold) {
      this.isNoteOn = false;
    }
  }

  private resetDetection(): void {
    if (this.currentNote !== -1) {
      this.callbacks.onNoteOff(this.currentNote);
    }
    this.currentNote = -1;
    this.consecutiveFrames = 0;
    this.lastStableNote = -1;
    this.pitchHistory = [];
  }

  private notifyConnectionChange(connected: boolean): void {
    this.callbacks.onConnectionChange?.(connected);
  }
}

export default VoiceInputController;
