/**
 * VoiceInputController - 音声入力によるピッチ検出コントローラー
 * WASMピッチ検出器を使用した低レイテンシ単音検出（iOS対応）
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
  private readonly noteOnThreshold = 0.02;  // 感度を上げる（0.05→0.02）
  private readonly noteOffThreshold = 0.01; // 感度を上げる（0.03→0.01）
  private readonly pyinThreshold = 0.15;    // 閾値を緩和（0.1→0.15）
  private readonly silenceThreshold = 0.005; // 無音閾値を下げる（0.01→0.005）

  // ノート状態
  private currentNote = -1;
  private lastDetectedNote = -1;
  private consecutiveFrames = 0;
  private readonly consecutiveFramesThreshold = 1; // 即座に反応（2→1）
  private pitchHistory: number[] = [];
  private readonly pitchHistorySize = 3; // 履歴サイズを縮小（4→3）
  private isNoteOn = false;
  private processCounter = 0; // 処理カウンター

  // iOS対応
  private readonly isIOSDevice: boolean;

  // 周波数テーブル
  private noteFrequencies: Map<number, number> = new Map();

  constructor(callbacks: VoiceInputCallbacks) {
    this.onNoteOn = callbacks.onNoteOn;
    this.onNoteOff = callbacks.onNoteOff;
    this.onConnectionChange = callbacks.onConnectionChange;
    this.onError = callbacks.onError;
    this.isIOSDevice = isIOS();

    // 周波数テーブル初期化 (A0 = 21 ~ C8 = 108)
    for (let i = 21; i <= 108; i++) {
      const frequency = 440 * Math.pow(2, (i - 69) / 12);
      this.noteFrequencies.set(i, frequency);
    }

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
  async getAudioDevices(): Promise<AudioDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      // まず権限を取得
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

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
        this.processCounter = 0;
        this.pitchHistory = [];
        this.currentNote = -1;
        this.isNoteOn = false;
        log.info('🔧 WASMリングバッファ設定完了 ptr:', this.ringBufferPtr, 'size:', this.ringSize);
        log.info('🔧 ピッチ検出パラメータ: noteOnThreshold=', this.noteOnThreshold, 'pyinThreshold=', this.pyinThreshold);
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

      // Workletにリングバッファ情報を送信
      this.workletNode.port.postMessage({
        type: 'init',
        ptr: this.ringBufferPtr,
        ringSize: this.ringSize
      });

      // サンプル受信処理
      this.workletNode.port.onmessage = (e) => {
        if (e.data.type === 'samples') {
          this.processLowLatencySamples(e.data.samples);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
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
        this.processAudioData(dataArray);
      }, 10); // 10ms間隔で低レイテンシ

      this.isProcessing = true;
      return;
    }

    this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
    this.scriptNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.processAudioData(inputData);
    };

    source.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
    this.isProcessing = true;

    log.info('✅ ScriptProcessor設定完了');
  }

  /** 低レイテンシサンプル処理（リングバッファ経由） */
  private processLowLatencySamples(samples: Float32Array): void {
    if (!this.wasmModule || !this.wasmMemory || !this.isProcessing) {
      return;
    }

    // メモリ検証
    const currentMemory = this.wasmModule.get_memory();
    const requiredBytes = this.ringBufferPtr + (this.ringSize * 4);
    if (requiredBytes > currentMemory.buffer.byteLength) {
      return;
    }

    const ringBuffer = new Float32Array(currentMemory.buffer, this.ringBufferPtr, this.ringSize);

    // 入力信号レベルチェック
    let maxAmplitude = 0;
    for (let i = 0; i < samples.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(samples[i]));
    }

    // サンプルをリングバッファにコピー
    for (let i = 0; i < samples.length; i++) {
      ringBuffer[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % this.ringSize;
    }

    // 処理カウンターをインクリメント
    this.processCounter++;

    // 毎回ピッチ検出を実行（レイテンシ改善）
    const frequency = this.wasmModule.process_audio_block(this.writeIndex);

    if (frequency > 0 && frequency >= this.minFrequency && frequency <= this.maxFrequency) {
      this.handleDetectedPitch(frequency, maxAmplitude);
    } else if (maxAmplitude < this.silenceThreshold) {
      this.handleNoPitch();
    }
  }

  /** 通常のオーディオデータ処理 */
  private processAudioData(inputData: Float32Array): void {
    if (!this.isProcessing || !this.wasmModule) {
      return;
    }

    // 最大振幅計算
    let maxAmplitude = 0;
    for (let i = 0; i < inputData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(inputData[i]));
    }

    // ノート状態更新（閾値を緩和）
    if (!this.isNoteOn && maxAmplitude > this.noteOnThreshold) {
      this.isNoteOn = true;
      log.info(`🎤 音声検出開始: 振幅=${maxAmplitude.toFixed(4)}`);
    } else if (this.isNoteOn && maxAmplitude < this.noteOffThreshold) {
      this.isNoteOn = false;
      this.handleNoPitch();
      return;
    }

    if (!this.isNoteOn) {
      return;
    }

    // WASMでピッチ検出
    const dataLength = inputData.length;
    const byteLength = dataLength * Float32Array.BYTES_PER_ELEMENT;
    const ptr = this.wasmModule.alloc(byteLength);
    
    const wasmArray = new Float32Array(this.wasmModule.get_memory().buffer, ptr, dataLength);
    wasmArray.set(inputData);
    
    const frequency = this.wasmModule.analyze_pitch(ptr, byteLength, this.sampleRate, this.pyinThreshold);
    this.wasmModule.free(ptr, byteLength);

    if (frequency > 0 && frequency >= this.minFrequency && frequency <= this.maxFrequency) {
      this.handleDetectedPitch(frequency, maxAmplitude);
    } else if (maxAmplitude >= this.silenceThreshold) {
      // 音は検出されているがピッチが検出できない場合もNoPitchを呼ばない
      // これにより、ノイズでノートがオフになるのを防ぐ
    } else {
      this.handleNoPitch();
    }
  }

  /** ピッチ検出時のハンドリング */
  private handleDetectedPitch(frequency: number, amplitude: number): void {
    const midiNote = this.frequencyToMidi(frequency);
    
    // ピッチ履歴更新
    this.pitchHistory.push(midiNote);
    if (this.pitchHistory.length > this.pitchHistorySize) {
      this.pitchHistory.shift();
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
      // ベロシティを振幅から計算（最小32、最大127）
      const velocity = Math.min(127, Math.max(32, Math.round(amplitude * 1000)));
      this.onNoteOn(stableNote, velocity);
      log.info(`🎤 Note On: ${stableNote} (${this.midiToNoteName(stableNote)}) freq=${frequency.toFixed(1)}Hz amp=${amplitude.toFixed(3)}`);
    }
  }

  /** ピッチ未検出時のハンドリング */
  private handleNoPitch(): void {
    this.pitchHistory.push(-1);
    if (this.pitchHistory.length > this.pitchHistorySize) {
      this.pitchHistory.shift();
    }

    const silentFrames = this.pitchHistory.filter(p => p === -1).length;
    if (silentFrames >= this.consecutiveFramesThreshold && this.currentNote !== -1) {
      this.onNoteOff(this.currentNote);
      devLog.debug(`🎵 Note Off: ${this.currentNote}`);
      this.currentNote = -1;
      this.isNoteOn = false;
    }
  }

  /** 安定したノートを取得 */
  private getStableNote(): number {
    // 履歴が1つでもあればすぐに反応
    if (this.pitchHistory.length === 0) {
      return -1;
    }

    // 履歴が1つの場合はそのノートを返す（即座反応）
    if (this.pitchHistory.length === 1) {
      return this.pitchHistory[0] !== -1 ? this.pitchHistory[0] : -1;
    }

    const windowSize = Math.min(3, this.pitchHistory.length);
    const recentHistory = this.pitchHistory.slice(-windowSize);

    // ノート出現回数カウント
    const noteCounts = new Map<number, number>();
    for (const note of recentHistory) {
      if (note !== -1) {
        noteCounts.set(note, (noteCounts.get(note) ?? 0) + 1);
      }
    }

    // 最頻ノートを検索（条件を緩和）
    let mostCommonNote = -1;
    let maxCount = 0;

    for (const [note, count] of noteCounts) {
      if (count > maxCount) {
        mostCommonNote = note;
        maxCount = count;
      }
    }

    // 最近のノートと近い場合（±2半音まで許容）
    if (mostCommonNote !== -1) {
      const lastNote = recentHistory[recentHistory.length - 1];
      if (lastNote !== -1 && Math.abs(lastNote - mostCommonNote) <= 2) {
        return mostCommonNote;
      }
      // 最新のノートを優先
      return lastNote !== -1 ? lastNote : mostCommonNote;
    }

    return mostCommonNote;
  }

  /** 周波数からMIDIノート番号に変換 */
  private frequencyToMidi(frequency: number): number {
    let closestNote = 48;
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

  /** MIDIノート番号から音名に変換 */
  private midiToNoteName(note: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const noteName = noteNames[note % 12];
    return `${noteName}${octave}`;
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

    this.currentDeviceId = null;
    this.pitchHistory = [];
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
