/**
 * AudioController.ts - TypeScript版オーディオコントローラー
 * 音響入力処理、ピッチ検出、WASM統合を管理
 */

import { platform } from '../../platform';

// WASM関数の型定義
interface WASMModule {
  [key: string]: any;
}

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

// 基本インターフェース
export interface AudioControllerOptions {
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface SpectralPeak {
  frequency: number;
  magnitude: number;
  index: number;
}

export interface SpectralAnalysis {
  peaks: SpectralPeak[];
  centroid: number;
  spread: number;
  clarity: number;
}

export interface PitchResult {
  frequency: number;
  confidence: number;
  observationProbs?: Float32Array;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export interface HMMState {
  noteProbs: Float32Array;
  prevStateProbs: Float32Array;
  transitionMatrix: Float32Array;
}

// WASM外部モジュール初期化
let wasmMemory: WebAssembly.Memory | null = null;
let wasmInstance: any = null;

// iOS検出ユーティリティ
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * 隠れマルコフモデル（HMM）プロセッサ
 * ピッチ検出の安定性向上のため状態遷移を管理
 */
class HMMProcessor {
  private readonly minNote: number;
  private readonly maxNote: number;
  private readonly numStates: number;
  private readonly stateProbs: Float32Array;
  private readonly prevStateProbs: Float32Array;
  private readonly transitionMatrix: Float32Array;

  constructor(minNote: number = 21, maxNote: number = 108) {
    this.minNote = minNote;
    this.maxNote = maxNote;
    this.numStates = maxNote - minNote + 1;
    this.stateProbs = new Float32Array(this.numStates);
    this.prevStateProbs = new Float32Array(this.numStates);
    this.transitionMatrix = new Float32Array(this.numStates * this.numStates);
    
    this.calculateTransitionProbabilities();
  }

  private calculateTransitionProbabilities(): void {
    // ピアノの演奏パターンに基づく遷移確率を計算
    for (let i = 0; i < this.numStates; i++) {
      for (let j = 0; j < this.numStates; j++) {
        const semitones = Math.abs(i - j);
        let probability: number;
        
        if (semitones === 0) {
          probability = 0.7; // 同じノート継続の高い確率
        } else if (semitones === 1) {
          probability = 0.15; // 半音階移動
        } else if (semitones <= 3) {
          probability = 0.1; // 近接ノート
        } else if (semitones === 12) {
          probability = 0.03; // オクターブ跳躍
        } else if (semitones <= 7) {
          probability = 0.01; // 中距離跳躍
        } else {
          probability = 0.001; // 大きな跳躍（稀）
        }
        
        this.transitionMatrix[i * this.numStates + j] = probability;
      }
    }
  }

  public update(observations: Float32Array): void {
    // Viterbiアルゴリズムによる最尤状態推定
    this.prevStateProbs.set(this.stateProbs);
    
    for (let j = 0; j < this.numStates; j++) {
      let maxProb = 0;
      for (let i = 0; i < this.numStates; i++) {
        const transitionProb = this.transitionMatrix[i * this.numStates + j];
        const prob = this.prevStateProbs[i] * transitionProb * observations[j];
        maxProb = Math.max(maxProb, prob);
      }
      this.stateProbs[j] = maxProb;
    }
    
    // 正規化
    const sum = this.stateProbs.reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      for (let i = 0; i < this.numStates; i++) {
        this.stateProbs[i] /= sum;
      }
    }
  }

  public getMostProbableNote(): number {
    let maxProb = 0;
    let bestNote = -1;
    
    for (let i = 0; i < this.numStates; i++) {
      if (this.stateProbs[i] > maxProb) {
        maxProb = this.stateProbs[i];
        bestNote = this.minNote + i;
      }
    }
    
    return bestNote;
  }
}

/**
 * メインのAudioControllerクラス
 * WASM統合、リアルタイム音響処理、ピッチ検出を統合管理
 */
export class AudioController {
  // コールバック関数
  private readonly onNoteOn: (note: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  // Web Audio API
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private analyserTimer: number | null = null;

  // デバイス管理
  private currentDeviceId: string | null = null;
  private readonly errorDisplays = new Map<string, Element>();

  // 処理状態
  private isProcessing: boolean = false;
  private pauseProcessing: boolean = false;
  private readonly isIOSDevice: boolean;

  // オーディオパラメータ
  private sampleRate: number | null = null;
  private readonly bufferSize: number = 512;
  private readonly lowFreqBufferSize: number = 1024;
  private readonly minFrequency: number = 27.5;
  private readonly maxFrequency: number = 4186.01;

  // 検出閾値
  private readonly amplitudeThreshold: number = 0.1;
  private readonly consecutiveFramesThreshold: number = 1;
  private readonly noteOnThreshold: number = 0.05;
  private readonly noteOffThreshold: number = 0.03;
  private readonly maxAllowedPitchChange: number = 1.5;
  private readonly lowFrequencyThreshold: number = 200.0;
  private readonly lowFrequencyAmplitudeThreshold: number = 0.08;
  private readonly veryLowFreqThreshold: number = 100.0;
  private readonly pyinThreshold: number = 0.1;
  private readonly silenceThreshold: number = 0.01;

  // アダプティブバッファリング
  private readonly adaptiveBuffering: boolean = true;

  // バッファ管理
  private readonly samples: Float32Array;
  private readonly lowFreqSamples: Float32Array;
  private accumulatedSamples: Float32Array = new Float32Array(0);
  private readonly pitchHistory: Array<{ note: number; confidence: number }> = [];
  private readonly pitchHistorySize: number = 3;
  private readonly pitchProbabilityBuffer: Float32Array[] = [];

  // ノート状態
  private lastDetectedNote: number = -1;
  private consecutiveFrames: number = 0;
  private lastStableNote: number = -1;
  private currentNote: number = -1;
  private lastNoteOnTime: number = 0;
  private lastDetectedFrequency: number = 0;
  private isNoteOn: boolean = false;
  private activeNote: number | null = null;
  private lastPitchConfidence: number = 0.0;

  // WASM統合
  private ringBufferPtr: number = 0;
  private ringSize: number = 0;
  private writeIndex: number = 0;

  // 周波数テーブルとHMM
  private readonly noteFrequencies = new Map<number, number>();
  private readonly hmmProcessor: HMMProcessor;

  constructor(options: AudioControllerOptions) {
    console.log('[AudioController] Constructor called');
    
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange || null;

    // バッファ初期化
    this.samples = new Float32Array(this.bufferSize);
    this.lowFreqSamples = new Float32Array(this.lowFreqBufferSize);

    // プラットフォーム検出
    this.isIOSDevice = isIOS();
    if (this.isIOSDevice) {
      console.log('iOS環境を検出しました。特別なオーディオ処理を適用します。');
    }

    // システム初期化
    this.initializeNoteFrequencies();
    this.hmmProcessor = new HMMProcessor();
    this.addDebugDisplay();
    
    // WASM初期化を非同期で実行
    this.initializeWASM().catch((error) => {
      console.error('Failed to initialize WASM:', error);
    });
  }

  /**
   * WASM モジュールの初期化
   */
  private async initializeWASM(): Promise<void> {
    try {
      // 動的インポートでWASMモジュールをロード
      const wasmModule = await import('../../wasm/pitch_detector.js');
      
      console.log("WASM モジュールの初期化を開始");
      wasmInstance = await wasmModule.default();
      wasmMemory = wasmInstance.get_memory();
      console.log("WASM モジュールが初期化されました");
    } catch (error) {
      console.error('WASM initialization failed:', error);
      throw error;
    }
  }

  /**
   * 周波数テーブルの初期化（A0からC8まで - 88鍵盤全体）
   */
  private initializeNoteFrequencies(): void {
    for (let i = 21; i <= 108; i++) {
      const frequency = 440 * Math.pow(2, (i - 69) / 12);
      this.noteFrequencies.set(i, frequency);
    }
  }

  /**
   * デバッグ表示の追加
   */
  private addDebugDisplay(): void {
    // デバッグ情報の表示エリアを作成
    const debugElement = platform.createElement('div');
    debugElement.id = 'audio-debug-info';
    debugElement.style.position = 'fixed';
    debugElement.style.top = '10px';
    debugElement.style.right = '10px';
    debugElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugElement.style.color = 'white';
    debugElement.style.padding = '10px';
    debugElement.style.borderRadius = '5px';
    debugElement.style.fontSize = '12px';
    debugElement.style.fontFamily = 'monospace';
    debugElement.style.zIndex = '9999';
    debugElement.style.display = 'none';
    
    const body = platform.getDocument().body;
    body.appendChild(debugElement);
  }

  public setConnectionChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  /**
   * オーディオデバイスに接続
   */
  public async connectDevice(deviceId: string): Promise<boolean> {
    try {
      console.log('オーディオデバイス接続を開始:', deviceId);
      
      // 既存の接続を切断 (ただしiOSではAudioContextは保持)
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => {
          console.log('既存のオーディオトラックを停止:', track.kind, track.label);
          track.stop();
        });
        this.mediaStream = null;
      }
      
      // getUserMedia の存在確認
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        console.warn('navigator.mediaDevices.getUserMedia is not supported in this environment.');
        this.showError('Microphone access is not supported.');
        this.notifyConnectionChange(false);
        return false;
      }

      // デバイスのアクセス許可を取得
      console.log('マイク許可を要求...');
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        console.log('マイク許可を取得しました:', 
          this.mediaStream.getAudioTracks().map(t => t.label).join(', '));
      } catch (getUserMediaError) {
        console.error('[AudioController] getUserMedia failed:', getUserMediaError);
        this.showError(`Failed to access microphone: ${(getUserMediaError as Error).message}`);
        this.notifyConnectionChange(false);
        return false;
      }

      // AudioContextの作成
      if (!this.audioContext) {
        console.log('新しいAudioContextを作成します');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sampleRate = this.audioContext.sampleRate;
        console.log('[AudioController] New AudioContext created. State:', this.audioContext.state, 'Sample Rate:', this.sampleRate);
      }

      // オーディオソースの作成と処理開始
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      console.log('MediaStreamSourceを作成しました');

      // 基本的な音声処理の設定
      this.setupBasicAudioProcessing(source);

      // 現在のデバイスIDを記録
      const tracks = this.mediaStream.getAudioTracks();
      if (tracks.length > 0) {
        const settings = tracks[0].getSettings();
        this.currentDeviceId = settings.deviceId || deviceId;
      }

      this.notifyConnectionChange(true);
      this.hideError();
      console.log('オーディオデバイス接続完了:', deviceId);
      
      return true;
    } catch (error) {
      console.error('オーディオデバイス接続エラー:', error);
      this.showError('Failed to connect to audio device. Please ensure microphone permissions are granted.');
      return false;
    }
  }

  /**
   * 基本的な音声処理の設定
   */
  private setupBasicAudioProcessing(source: MediaStreamAudioSourceNode): void {
    if (!this.audioContext) return;

    // ScriptProcessorを使用した基本的な処理
    this.scriptNode = this.audioContext.createScriptProcessor(
      this.bufferSize,
      1,
      1
    );
    this.scriptNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.processAudioData(inputData);
    };
    source.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
    this.isProcessing = true;
    console.log('基本音声処理設定完了');
  }

  /**
   * オーディオデータの処理
   */
  private processAudioData(inputData: Float32Array): void {
    if (!this.isProcessing) return;

    // 最大振幅を計算
    const maxAmplitude = this.calculateMaxAmplitude(inputData);
    
    // ノートの状態を更新
    this.updateNoteState(maxAmplitude);

    if (this.isNoteOn) {
      // 基本的なピッチ検出（将来的により高度なアルゴリズムに置き換え）
      const frequency = this.detectBasicPitch(inputData);
      if (frequency > 0) {
        const note = this.getClosestNote(frequency);
        if (note !== this.currentNote) {
          if (this.currentNote !== -1) {
            this.onNoteOff(this.currentNote);
          }
          this.currentNote = note;
          this.onNoteOn(note);
        }
      }
    } else if (this.currentNote !== -1) {
      this.onNoteOff(this.currentNote);
      this.currentNote = -1;
    }
  }

  /**
   * 最大振幅の計算
   */
  private calculateMaxAmplitude(samples: Float32Array): number {
    let max = 0;
    for (let i = 0; i < samples.length; i++) {
      max = Math.max(max, Math.abs(samples[i]));
    }
    return max;
  }

  /**
   * ノート状態の更新
   */
  private updateNoteState(amplitude: number): void {
    if (amplitude > this.noteOnThreshold) {
      this.isNoteOn = true;
    } else if (amplitude < this.noteOffThreshold) {
      this.isNoteOn = false;
    }
  }

  /**
   * 基本的なピッチ検出（自己相関関数）
   */
  private detectBasicPitch(samples: Float32Array): number {
    if (!this.sampleRate) return 0;
    
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < samples.length - period; i++) {
        correlation += samples[i] * samples[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? this.sampleRate / bestPeriod : 0;
  }

  /**
   * 周波数からMIDIノート番号への変換
   */
  private getClosestNote(frequency: number): number {
    // A4 = 440Hz = MIDIノート69
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }
  
  /**
   * オーディオ接続状態の通知
   */
  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  /**
   * エラー表示（デバイス固有）
   */
  private showError(message: string, selectId?: string): void {
    console.error('[AudioController]', message);
    
    const errorElement = platform.createElement('div');
    errorElement.className = 'audio-error-message';
    errorElement.textContent = message;
    errorElement.style.position = 'fixed';
    errorElement.style.top = '50px';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translateX(-50%)';
    errorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorElement.style.color = 'white';
    errorElement.style.padding = '10px';
    errorElement.style.borderRadius = '5px';
    errorElement.style.zIndex = '10000';
    
    if (selectId) {
      this.errorDisplays.set(selectId, errorElement);
    }
    
    const body = platform.getDocument().body;
    body.appendChild(errorElement);
    
    // 5秒後に自動削除
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
      if (selectId) {
        this.errorDisplays.delete(selectId);
      }
    }, 5000);
  }

  /**
   * エラー非表示
   */
  private hideError(selectId?: string): void {
    if (selectId && this.errorDisplays.has(selectId)) {
      const errorElement = this.errorDisplays.get(selectId);
      if (errorElement && errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
      this.errorDisplays.delete(selectId);
    } else {
      // 全てのエラー表示を削除
      const errorElements = platform.querySelectorAll('.audio-error-message');
      errorElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      this.errorDisplays.clear();
    }
  }

  /**
   * 接続状態の確認
   */
  public isConnected(): boolean {
    return this.mediaStream !== null && this.isProcessing;
  }

  /**
   * 現在のデバイスIDを取得
   */
  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * デバイス切断
   */
  public async disconnect(): Promise<void> {
    try {
      console.log('AudioController disconnecting...');
      
      this.isProcessing = false;
      
      if (this.analyserTimer) {
        clearInterval(this.analyserTimer);
        this.analyserTimer = null;
      }
      
      if (this.scriptNode) {
        this.scriptNode.disconnect();
        this.scriptNode = null;
      }
      
      if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode = null;
      }
      
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }
      
      this.currentDeviceId = null;
      this.notifyConnectionChange(false);
      
      console.log('AudioController disconnected successfully');
    } catch (error) {
      console.error('Error during AudioController disconnect:', error);
    }
  }

  /**
   * オーディオコントロールの設定（型定義に必要なメソッド）
   * UI要素の初期化と関連付けを行う
   */
  public setupAudioControls(): void {
    try {
      console.log('[AudioController] Setting up audio controls UI');
      
      // デバイスリストの更新
      this.updateDeviceList();
      
      // オーディオ入力設定UIの初期化
      this.initializeAudioUI();
      
      console.log('[AudioController] Audio controls setup completed');
    } catch (error) {
      console.error('[AudioController] Failed to setup audio controls:', error);
    }
  }

  /**
   * 音声入力開始
   */
  public startListening(): void {
    if (!this.isConnected()) {
      console.warn('[AudioController] Cannot start listening - not connected');
      return;
    }
    
    this.pauseProcessing = false;
    this.isProcessing = true;
    console.log('[AudioController] Started listening');
  }

  /**
   * 音声入力停止
   */
  public stopListening(): void {
    this.pauseProcessing = true;
    console.log('[AudioController] Stopped listening');
  }

  /**
   * 設定の更新
   */
  public updateConfig(config: any): void {
    try {
      console.log('[AudioController] Updating configuration:', config);
      
      // 設定の適用（必要に応じて拡張）
      if (config.sampleRate && this.audioContext) {
        console.log(`[AudioController] Sample rate update requested: ${config.sampleRate}`);
      }
      
      if (config.bufferSize) {
        console.log(`[AudioController] Buffer size update requested: ${config.bufferSize}`);
      }
      
    } catch (error) {
      console.error('[AudioController] Failed to update config:', error);
    }
  }

  /**
   * デバイスリストの更新
   */
  public async updateDeviceList(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('[AudioController] Available audio devices:', audioDevices.length);
      
      // UI要素の更新（存在する場合）
      const deviceSelect = platform.getElementById('audio-device-select') as any;
      if (deviceSelect) {
        // 既存のオプションをクリア
        deviceSelect.innerHTML = '';
        
        // デフォルトオプションを追加
        const defaultOption = platform.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Default Device';
        deviceSelect.appendChild(defaultOption);
        
        // デバイスオプションを追加
        audioDevices.forEach(device => {
          const option = platform.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.label || `Device ${device.deviceId.substring(0, 8)}`;
          deviceSelect.appendChild(option);
        });
      }
      
    } catch (error) {
      console.error('[AudioController] Failed to update device list:', error);
    }
  }

  /**
   * オーディオUI要素の初期化
   */
  private initializeAudioUI(): void {
    try {
      // デバイス選択イベントの設定
      const deviceSelect = platform.getElementById('audio-device-select') as any;
      if (deviceSelect) {
        const changeHandler = async (event: any) => {
          const deviceId = event.target.value;
          if (deviceId) {
            await this.connectDevice(deviceId);
          } else {
            await this.disconnect();
          }
        };
        
        platform.addEventListener(deviceSelect, 'change', changeHandler);
      }
      
      // その他のAudio UI要素の初期化
      this.initializeVolumeControls();
      this.initializeThresholdControls();
      
    } catch (error) {
      console.error('[AudioController] Failed to initialize audio UI:', error);
    }
  }

  /**
   * 音量コントロールの初期化
   */
  private initializeVolumeControls(): void {
    const volumeSlider = platform.getElementById('audio-volume-slider') as any;
    if (volumeSlider) {
      const volumeHandler = (event: any) => {
        const volume = parseFloat(event.target.value);
        console.log(`[AudioController] Volume changed: ${volume}`);
        // 音量調整の実装（必要に応じて）
      };
      
      platform.addEventListener(volumeSlider, 'input', volumeHandler);
    }
  }

  /**
   * 閾値コントロールの初期化
   */
  private initializeThresholdControls(): void {
    const thresholdSlider = platform.getElementById('audio-threshold-slider') as any;
    if (thresholdSlider) {
      const thresholdHandler = (event: any) => {
        const threshold = parseFloat(event.target.value);
        console.log(`[AudioController] Threshold changed: ${threshold}`);
        // 閾値調整の実装（必要に応じて）
      };
      
      platform.addEventListener(thresholdSlider, 'input', thresholdHandler);
    }
  }

  /**
   * シーク・ループ時の処理一時停止（既存最適化機能の保護）
   */
  public pauseProcessingForSeek(): void {
    this.pauseProcessing = true;
    console.log('[AudioController] Processing paused for seek operation');
    
    // 100ms後に自動復帰
    setTimeout(() => {
      this.pauseProcessing = false;
      console.log('[AudioController] Processing resumed after seek');
    }, 100);
  }

  /**
   * 有効状態の取得（型定義互換性のため）
   */
  public get enabled(): boolean {
    return this.isConnected();
  }

  /**
   * 有効状態の設定（型定義互換性のため）
   */
  public set enabled(value: boolean) {
    if (value && !this.isConnected()) {
      this.startListening();
    } else if (!value && this.isConnected()) {
      this.stopListening();
    }
  }
}

export default AudioController; 