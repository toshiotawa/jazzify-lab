/**
 * AudioController.ts - 高度なピッチ検出システム
 * WASM統合、リアルタイム音響処理、HMMによる音符安定化を実装
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
} from './src/wasm/pitch_detector.js';

import type { 
  AudioControllerOptions, 
  SpectralPeak, 
  SpectralAnalysis, 
  PitchResult,
  PitchCandidate,
  PitchHistory,
  AudioProcessingSettings,
  WASMModule
} from './src/types';

// WASM外部モジュール初期化
let wasmMemory: WebAssembly.Memory | null = null;
let wasmInstance: any = null;

// iOS検出ユーティリティ
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
};

/**
 * 隠れマルコフモデル（HMM）プロセッサ
 * ピッチ検出の安定性向上のため状態遷移を管理
 */
class HMMProcessor {
  private readonly minNote: number;
  private readonly maxNote: number;
  private readonly numStates: number;
  private readonly currentStateProbs: Float32Array;
  private readonly transitionMatrix: Float32Array;

  constructor(minNote: number = 21, maxNote: number = 108) {
    this.minNote = minNote;
    this.maxNote = maxNote;
    this.numStates = maxNote - minNote + 1;
    this.currentStateProbs = new Float32Array(this.numStates);
    this.transitionMatrix = new Float32Array(this.numStates * this.numStates);
    
    // 初期化: 均等分布
    this.currentStateProbs.fill(1 / this.numStates);
    this.calculateTransitionProbabilities();
  }

  private calculateTransitionProbabilities(): void {
    const sameNoteProb = 0.6;
    const stepProb = 0.3;

    for (let i = 0; i < this.numStates; i++) {
      // 同一音維持
      this.transitionMatrix[i * this.numStates + i] = sameNoteProb;
      
      // 半音～2全音程度の移動
      for (let j = Math.max(0, i-4); j <= Math.min(this.numStates-1, i+4); j++) {
        if (j !== i) {
          this.transitionMatrix[i * this.numStates + j] = stepProb / 8;
        }
      }
      
      // 大きな跳躍
      const remainingProb = 1 - (sameNoteProb + stepProb);
      const largeJumpNotes = this.numStates - 9;
      if (largeJumpNotes > 0) {
        for (let j = 0; j < this.numStates; j++) {
          if (Math.abs(i - j) > 4) {
            this.transitionMatrix[i * this.numStates + j] += remainingProb / largeJumpNotes;
          }
        }
      }
    }
  }

  public update(observations: Float32Array): void {
    const newProbs = new Float32Array(this.numStates);
    
    for (let j = 0; j < this.numStates; j++) {
      let sum = 0;
      for (let i = 0; i < this.numStates; i++) {
        sum += this.currentStateProbs[i] * this.transitionMatrix[i * this.numStates + j];
      }
      newProbs[j] = sum * observations[j];
    }
    
    // 正規化
    const total = newProbs.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let i = 0; i < this.numStates; i++) {
        this.currentStateProbs[i] = newProbs[i] / total;
      }
    }
  }

  public getMostProbableNote(): number {
    let maxProb = 0;
    let bestNote = -1;
    
    for (let i = 0; i < this.numStates; i++) {
      if (this.currentStateProbs[i] > maxProb) {
        maxProb = this.currentStateProbs[i];
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
  private readonly onNoteOn: (note: number, velocity?: number) => void;
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
  private activeNote: number | null = null;

  // オーディオパラメータ
  private sampleRate: number | null = null;
  private readonly processingSettings: AudioProcessingSettings;

  // バッファ管理
  private readonly samples: Float32Array;
  private readonly lowFreqSamples: Float32Array;
  private accumulatedSamples: Float32Array = new Float32Array(0);
  private readonly pitchHistory: PitchHistory[] = [];
  private readonly pitchHistorySize: number = 3;
  private pitchProbabilityBuffer: Float32Array[] = [];

  // ノート状態
  private lastDetectedNote: number = -1;
  private consecutiveFrames: number = 0;
  private lastStableNote: number = -1;
  private currentNote: number = -1;
  private lastNoteOnTime: number = 0;
  private lastDetectedFrequency: number = 0;
  private isNoteOn: boolean = false;
  private lastPitchConfidence: number = 0.0;

  // WASM統合
  private ringBufferPtr: number = 0;
  private ringSize: number = 0;
  private writeIndex: number = 0;

  // 周波数テーブルとHMM
  private readonly noteFrequencies = new Map<number, number>();
  private readonly hmmProcessor: HMMProcessor;

  // キーハイライトコールバック（MIDIController統合用）
  private keyHighlightCallback: ((note: number, active: boolean) => void) | null = null;
  
  // PIXIレンダラーエフェクト用コールバック（GameEngine統合用）
  private keyPressEffectCallback: ((note: number) => void) | null = null;

  private outputGainNode: GainNode | null = null;

  constructor(options: AudioControllerOptions) {
    console.log('[AudioController] Constructor called');
    
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange || null;

    // 処理設定の初期化
    this.processingSettings = {
      bufferSize: 512,
      lowFreqBufferSize: 1024,
      minFrequency: 27.5,
      maxFrequency: 4186.01,
      amplitudeThreshold: 0.1,
      consecutiveFramesThreshold: 1,
      noteOnThreshold: 0.05,
      noteOffThreshold: 0.03,
      maxAllowedPitchChange: 1.5,
      lowFrequencyThreshold: 200.0,
      lowFrequencyAmplitudeThreshold: 0.08,
      veryLowFreqThreshold: 100.0,
      pyinThreshold: 0.1,
      silenceThreshold: 0.01,
      adaptiveBuffering: true,
    };

    // バッファ初期化
    this.samples = new Float32Array(this.processingSettings.bufferSize);
    this.lowFreqSamples = new Float32Array(this.processingSettings.lowFreqBufferSize);

    // プラットフォーム検出
    this.isIOSDevice = isIOS();
    if (this.isIOSDevice) {
      console.log('iOS環境を検出しました。特別なオーディオ処理を適用します。');
    }

    // システム初期化
    this.initializeNoteFrequencies();
    this.hmmProcessor = new HMMProcessor();
    
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
      console.log("WASM モジュールの初期化を開始");
      wasmInstance = await init();
      wasmMemory = get_memory();
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

      // AudioContextの作成または再利用
      let needNewContext = true;
      if (this.isIOSDevice && this.audioContext) {
        if (this.audioContext.state === 'suspended') {
          try {
            console.log('iOS: 既存のAudioContextを再開します');
            await this.audioContext.resume();
            needNewContext = false;
          } catch (e) {
            console.warn('既存のAudioContextの再開に失敗しました:', e);
            needNewContext = true;
          }
        } else if (this.audioContext.state === 'running') {
          console.log('iOS: 既存のAudioContextは既に実行中です');
          needNewContext = false;
        }
      }

      if (needNewContext || !this.audioContext) {
        if (this.audioContext && !this.isIOSDevice) {
          console.log('既存のAudioContextを閉じます');
          await this.audioContext.close();
        }
        console.log('新しいAudioContextを作成します');
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.sampleRate = this.audioContext.sampleRate;
        console.log('[AudioController] New AudioContext created. State:', this.audioContext.state, 'Sample Rate:', this.sampleRate);
      } else {
        this.sampleRate = this.audioContext.sampleRate;
        console.log('[AudioController] Using existing AudioContext. State:', this.audioContext.state, 'Sample Rate:', this.sampleRate);
      }

      // オーディオソースの作成
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      console.log('MediaStreamSourceを作成しました');

      // ブラウザに応じた処理を選択
      if (window.AudioWorkletNode) {
        console.log('AudioWorkletを使用します');
        await this.setupAudioWorklet(source);
      } else {
        console.log('ScriptProcessorNodeを使用します');
        this.createScriptProcessorFallback(source);
      }

      // 現在のデバイスIDを記録
      const tracks = this.mediaStream.getAudioTracks();
      if (tracks.length > 0) {
        const settings = tracks[0].getSettings();
        this.currentDeviceId = settings.deviceId || deviceId;
        
        // すべてのオーディオデバイス選択リストを同期
        document.querySelectorAll('.audio-devices').forEach(select => {
          (select as HTMLSelectElement).value = this.currentDeviceId || '';
        });
        console.log('デバイスセレクトボックスを同期しました');
      }

      this.notifyConnectionChange(true);
      this.hideError();
      console.log('オーディオデバイス接続完了:', deviceId);
      
      // デバイスリストを更新
      await this.updateDeviceList();
      
      return true;
    } catch (error) {
      console.error('オーディオデバイス接続エラー:', error);
      this.showError('Failed to connect to audio device. Please ensure microphone permissions are granted.');
      return false;
    }
  }

  /**
   * AudioWorkletの設定
   */
  private async setupAudioWorklet(source: MediaStreamAudioSourceNode): Promise<void> {
    try {
      console.log('Setting up AudioWorklet, sample rate:', this.audioContext!.sampleRate);
      
      // Wait for WASM to be ready
      if (!wasmMemory) {
        console.log('Waiting for WASM to initialize...');
        await new Promise<void>(resolve => {
          const checkWasm = () => {
            if (wasmMemory) {
              resolve();
            } else {
              setTimeout(checkWasm, 10);
            }
          };
          checkWasm();
        });
      }
      
      // Initialize WASM pitch detector with sample rate
      console.log('Initializing WASM pitch detector');
      init_pitch_detector(this.audioContext!.sampleRate);
      
      await this.audioContext!.audioWorklet.addModule('/js/audio/audio-worklet-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext!, 'audio-processor');
      
      // Get ring buffer pointer and size from WASM
      const ringBufferPtr = get_ring_buffer_ptr();
      const ringSize = get_ring_buffer_size();
      
      console.log('Ring buffer ptr:', ringBufferPtr, 'size:', ringSize);
      
      // Store reference for WorkletNode to access WASM memory
      this.ringBufferPtr = ringBufferPtr;
      this.ringSize = ringSize;
      this.writeIndex = 0;
      
      // Initialize AudioWorklet with ring buffer info (without memory object)
      this.workletNode.port.postMessage({
        type: 'init',
        ptr: ringBufferPtr,
        ringSize: ringSize
      });
      
      // Create or reuse GainNode for smooth volume ramp
      if (!this.outputGainNode) {
        this.outputGainNode = this.audioContext!.createGain();
        this.outputGainNode.gain.value = 0; // start muted
      }

      this.workletNode.port.onmessage = (e) => {
        console.log('Received message from AudioWorklet:', e.data.type);
        if (e.data.type === 'samples') {
          // Process samples with new low-latency method
          this.processLowLatencySamples(e.data.samples);
        } else if (e.data.samples) {
          // Fallback to old method if needed
          console.log('Using fallback processAudioData');
          this.processAudioData(e.data.samples);
        } else {
          console.log('Unknown message type:', e.data);
        }
      };
      
      source.connect(this.workletNode);
      this.workletNode.connect(this.outputGainNode);
      this.outputGainNode.connect(this.audioContext!.destination);
      this.fadeInOutput();
      this.isProcessing = true;
      console.log('AudioWorkletNode設定完了 (リングバッファモード)');
    } catch (workletError) {
      console.warn('AudioWorklet初期化エラー、ScriptProcessorにフォールバック:', workletError);
      this.createScriptProcessorFallback(source);
    }
  }

  /**
   * ScriptProcessorフォールバック
   */
  private createScriptProcessorFallback(source: MediaStreamAudioSourceNode): void {
    // audioContextがnullの場合は再作成
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      if (this.audioContext.state !== 'running') {
        this.audioContext.resume();
      }
      
      this.sampleRate = this.audioContext.sampleRate;
      // sourceも再作成が必要
      if (this.mediaStream) {
        source = this.audioContext.createMediaStreamSource(this.mediaStream);
      } else {
        console.error('メディアストリームが存在しません');
        throw new Error('メディアストリームが利用できません');
      }
    }

    // 一部のブラウザではcreateScriptProcessorが非推奨または利用不可
    if (typeof this.audioContext.createScriptProcessor !== 'function') {
      console.warn('ScriptProcessorNodeがサポートされていません。AnalyserNodeフォールバックを使用します');
      // AnalyserNodeを使ったフォールバック
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.processingSettings.bufferSize * 2;
      source.connect(this.analyserNode);
      
      // データ取得用のタイマーを設定
      this.analyserTimer = window.setInterval(() => {
        const dataArray = new Float32Array(this.processingSettings.bufferSize);
        this.analyserNode!.getFloatTimeDomainData(dataArray);
        this.processAudioData(dataArray);
      }, 100); // 100msごとに処理
      
      return;
    }

    this.scriptNode = this.audioContext.createScriptProcessor(
      this.processingSettings.bufferSize,
      1,
      1
    );
    this.scriptNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.processAudioData(inputData);
    };
    source.connect(this.scriptNode);

    // Create or reuse GainNode
    if (!this.outputGainNode) {
      this.outputGainNode = this.audioContext!.createGain();
      this.outputGainNode.gain.value = 0;
    }

    this.scriptNode.connect(this.outputGainNode);
    this.outputGainNode.connect(this.audioContext!.destination);
    this.fadeInOutput();
    console.log('ScriptProcessorNode設定完了');
  }

  /**
   * 低遅延サンプル処理（WASM統合）
   */
  private processLowLatencySamples(samples: Float32Array): void {
    if (this.pauseProcessing) {
      return;
    }
    
    if (!wasmMemory || !wasmInstance) {
      this.processAudioData(samples);
      return;
    }
    
    if (!this.ringBufferPtr || !this.ringSize) {
      this.processAudioData(samples);
      return;
    }
    
    const currentMemory = get_memory();
    const requiredBytes = this.ringBufferPtr + (this.ringSize * 4);
    if (requiredBytes > currentMemory.buffer.byteLength) {
      console.error('Ring buffer pointer out of bounds!');
      this.processAudioData(samples);
      return;
    }
    
    const ringBuffer = new Float32Array(currentMemory.buffer, this.ringBufferPtr, this.ringSize);
    
    // サンプルをリングバッファにコピー
    for (let i = 0; i < samples.length; i++) {
      ringBuffer[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % this.ringSize;
    }
    
    // 32サンプルごとに処理（超低遅延）
    if ((this.writeIndex & 0x1F) === 0) {
      const frequency = process_audio_block(this.writeIndex);
      
      if (frequency > 0 && frequency >= this.processingSettings.minFrequency && frequency <= this.processingSettings.maxFrequency) {
        this.handleDetectedPitch(frequency);
      } else {
        this.handleNoPitch();
      }
    }
  }

  /**
   * 基本音声データ処理
   */
  private processAudioData(inputData: Float32Array): void {
    if (!this.isProcessing) return;

    // 累積バッファに今回のサンプルを追加
    if (!this.accumulatedSamples) {
      this.accumulatedSamples = new Float32Array(0);
    }
    const newBuffer = new Float32Array(this.accumulatedSamples.length + inputData.length);
    newBuffer.set(this.accumulatedSamples);
    newBuffer.set(inputData, this.accumulatedSamples.length);
    this.accumulatedSamples = newBuffer;

    // 累積サンプル数が bufferSize 以上になったらブロック毎に処理
    while (this.accumulatedSamples.length >= this.processingSettings.bufferSize) {
      // 先頭 bufferSize サンプルを切り出す
      const block = this.accumulatedSamples.subarray(0, this.processingSettings.bufferSize);
      this.processBlock(block);

      // プロセス済みのサンプルを除去
      const remaining = new Float32Array(this.accumulatedSamples.length - this.processingSettings.bufferSize);
      remaining.set(this.accumulatedSamples.subarray(this.processingSettings.bufferSize));
      this.accumulatedSamples = remaining;
    }
    
    // Adaptive buffering for low frequencies
    if (this.processingSettings.adaptiveBuffering && this.accumulatedSamples.length >= this.processingSettings.lowFreqBufferSize) {
      // Check if we might be dealing with low frequencies
      const preliminaryBlock = this.accumulatedSamples.subarray(0, this.processingSettings.bufferSize);
      const maxAmplitude = this.calculateMaxAmplitude(preliminaryBlock);
      
      if (maxAmplitude > this.processingSettings.noteOnThreshold) {
        // Perform a quick spectral analysis to check if low frequency content is present
        const spectral = this.analyzeSpectralContent(preliminaryBlock);
        if (spectral.centroid < this.processingSettings.veryLowFreqThreshold) {
          // Use larger buffer for low frequency detection
          const largeBlock = this.accumulatedSamples.subarray(0, this.processingSettings.lowFreqBufferSize);
          this.processLowFreqBlock(largeBlock);
          
          // Remove processed samples
          const remaining = new Float32Array(this.accumulatedSamples.length - this.processingSettings.lowFreqBufferSize);
          remaining.set(this.accumulatedSamples.subarray(this.processingSettings.lowFreqBufferSize));
          this.accumulatedSamples = remaining;
        }
      }
    }
  }

  private processLowFreqBlock(block: Float32Array): void {
    // Process low frequency content with larger buffer
    this.lowFreqSamples.set(block);
    
    // Calculate maximum amplitude
    const maxAmplitude = this.calculateMaxAmplitude(this.lowFreqSamples);
    
    // Update note state
    this.updateNoteState(maxAmplitude);
    
    if (!this.isNoteOn) {
      this.resetDetection();
      return;
    }
    
    // Analyze with larger buffer for better low frequency resolution
    const spectral = this.analyzeSpectralContent(this.lowFreqSamples);
    const pitchResult = this.analyzePitchLowFreq(this.lowFreqSamples, spectral);
    const frequency = pitchResult.frequency;
    const confidence = pitchResult.confidence;
    const observationProbs = pitchResult.observationProbs;
    
    // Record confidence
    this.lastPitchConfidence = confidence;
    
    this.processDetectedFrequency(frequency, observationProbs, confidence);
  }

  private processBlock(block: Float32Array): void {
    // このブロックはthis.bufferSize の長さになっている前提
    this.samples.set(block);

    // 最大振幅を計算（最適化コードはそのまま）
    let maxAmplitude = 0;
    let i = 0;
    const bufferSize = this.processingSettings.bufferSize;
    for (; i < bufferSize - 3; i += 4) {
      maxAmplitude = Math.max(maxAmplitude, 
        Math.max(
          Math.max(Math.abs(this.samples[i]), Math.abs(this.samples[i + 1])),
          Math.max(Math.abs(this.samples[i + 2]), Math.abs(this.samples[i + 3]))
        )
      );
    }
    for (; i < bufferSize; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(this.samples[i]));
    }
    
    // ノートの状態を更新
    this.updateNoteState(maxAmplitude);

    if (!this.isNoteOn) {
      this.resetDetection();
      return;
    }

    // PYINアルゴリズムで周波数を検出
    const spectral = this.analyzeSpectralContent(this.samples);
    const pitchResult = this.analyzePitch(this.samples, spectral);
    const frequency = pitchResult.frequency;
    const confidence = pitchResult.confidence;
    const observationProbs = pitchResult.observationProbs;
    
    // 信頼度の記録（デバッグ用）
    this.lastPitchConfidence = confidence;
    
    this.processDetectedFrequency(frequency, observationProbs, confidence);
  }

  private processDetectedFrequency(frequency: number, observationProbs?: Float32Array, confidence?: number): void {
    // PYIN の検出結果が信頼性が低い場合、spectral 分析を補完として使用
    if (frequency <= 0 || (confidence !== undefined && confidence < 0.4)) {
      const spectral = this.analyzeSpectralContent(this.samples);
      if (spectral.peaks.length > 0) {
        frequency = spectral.peaks[0].frequency;
        // スペクトル分析の信頼度を補正
        confidence = Math.min(0.7, spectral.clarity);
      } else {
        this.resetDetection();
        return;
      }
    }
    
    const currentTime = performance.now() / 1000;
    // 無音時の誤検出を防ぐため、計測された最大振幅が silenceThreshold 未満なら処理をスキップ
    const currentMaxAmplitude = this.calculateMaxAmplitude(this.samples);
    if (currentMaxAmplitude < this.processingSettings.silenceThreshold) {
      this.resetDetection();
      return;
    }

    // PYIN と spectral から候補となるノート番号を取得
    const pyinCandidate = this.getClosestNote(frequency);
    const spectralData = this.analyzeSpectralContent(this.samples);
    const spectralCandidate = spectralData.peaks.length > 0
      ? this.getClosestNote(spectralData.peaks[0].frequency)
      : pyinCandidate;
    
    // より信頼性の高い情報を使用
    let candidate: number;
    if (confidence !== undefined && confidence > 0.7) {
      // PYIN の信頼度が高い場合はその結果を優先
      candidate = pyinCandidate;
    } else {
      // スペクトル解析との比較で決定
      candidate = Math.abs(frequency - this.noteFrequencies.get(pyinCandidate)!) < 
                 Math.abs(spectralData.peaks[0]?.frequency - this.noteFrequencies.get(spectralCandidate)!) 
                 ? pyinCandidate : spectralCandidate;
    }

    // HMM による安定化処理
    if (observationProbs) {
      this.hmmProcessor.update(observationProbs);
      const hmmNote = this.hmmProcessor.getMostProbableNote();
      candidate = this.resolveNoteConflict(hmmNote, candidate);
    }

    // ピッチ履歴に追加
    this.updatePitchHistory(candidate, confidence || 0.5);

    // 安定したピッチを取得
    const stableNote = this.getStableNote();
    if (stableNote !== -1) {
      this.handleDetectedPitch(this.noteFrequencies.get(stableNote)!);
    }
  }

  /**
   * 検出されたピッチを処理
   */
  private handleDetectedPitch(frequency: number): void {
    if (this.isSeekingOrLooping()) {
      return;
    }

    const detectedNote = this.getClosestNote(frequency);
    const currentTime = performance.now() / 1000;

    // 前回と同じノートかチェック
    if (detectedNote === this.lastDetectedNote) {
      this.consecutiveFrames++;
    } else {
      // 新しいノートを検出
      if (this.activeNote !== null && this.activeNote !== detectedNote) {
        // 前のノートをoff
        this.onNoteOff(this.activeNote);
      }
      
      this.lastDetectedNote = detectedNote;
      this.consecutiveFrames = 1;
    }

    // 閾値を超えたらノートオン
    if (this.consecutiveFrames >= this.processingSettings.consecutiveFramesThreshold) {
      if (this.activeNote !== detectedNote) {
        // 前のノートがある場合はハイライト解除
        if (this.activeNote !== null && this.keyHighlightCallback) {
          this.keyHighlightCallback(this.activeNote, false);
        }
        
        this.activeNote = detectedNote;
        this.onNoteOn(detectedNote, 80); // デフォルトベロシティ
        this.lastNoteOnTime = currentTime;
        
        // 新しいノートのハイライト
        if (this.keyHighlightCallback) {
          this.keyHighlightCallback(detectedNote, true);
        }
        
        // キープレスエフェクト発火
        if (this.keyPressEffectCallback) {
          this.keyPressEffectCallback(detectedNote);
        }
      }
    }

    this.lastDetectedFrequency = frequency;
  }

  /**
   * ピッチが検出されなかった場合の処理
   */
  private handleNoPitch(): void {
    this.consecutiveFrames = 0;
    
    const currentTime = performance.now() / 1000;
    
    // 一定時間後にノートオフ
    if (this.activeNote !== null && (currentTime - this.lastNoteOnTime) > 0.1) {
      this.onNoteOff(this.activeNote);
      
      // ハイライト解除
      if (this.keyHighlightCallback) {
        this.keyHighlightCallback(this.activeNote, false);
      }
      
      this.activeNote = null;
    }
    
    this.resetDetection();
  }

  /**
   * 周波数からMIDIノート番号を取得
   */
  private getClosestNote(frequency: number): number {
    if (frequency <= 0) return -1;
    
    // 12平均律でMIDIノート番号を計算
    const noteNumber = Math.round(69 + 12 * Math.log2(frequency / 440));
    
    // 有効範囲（A0-C8: 21-108）内かチェック
    if (noteNumber < 21 || noteNumber > 108) {
      return -1;
    }
    
    return noteNumber;
  }

  /**
   * 最大振幅を計算
   */
  private calculateMaxAmplitude(samples: Float32Array): number {
    let maxAmplitude = 0;
    for (let i = 0; i < samples.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(samples[i]));
    }
    return maxAmplitude;
  }

  /**
   * ノート状態を更新
   */
  private updateNoteState(amplitude: number): void {
    if (amplitude > this.processingSettings.noteOnThreshold) {
      this.isNoteOn = true;
    } else if (amplitude < this.processingSettings.noteOffThreshold) {
      this.isNoteOn = false;
    }
  }

  /**
   * 検出をリセット
   */
  private resetDetection(): void {
    this.lastDetectedNote = -1;
    this.consecutiveFrames = 0;
    this.lastDetectedFrequency = 0;
  }

  /**
   * シークやループ中かチェック
   */
  private isSeekingOrLooping(): boolean {
    // gameInstanceへの参照が必要な場合は外部から提供される想定
    return false;
  }

  /**
   * ピッチ履歴を更新
   */
  private updatePitchHistory(note: number, confidence: number): void {
    const timestamp = performance.now() / 1000;
    
    this.pitchHistory.push({
      note,
      confidence,
      timestamp
    });
    
    // 履歴サイズを制限
    if (this.pitchHistory.length > this.pitchHistorySize) {
      this.pitchHistory.shift();
    }
  }

  /**
   * 安定したピッチを取得
   */
  private getStableNote(): number {
    if (this.pitchHistory.length < this.pitchHistorySize) {
      return -1;
    }

    // 最新の履歴から最も多く出現するノートを取得
    const noteCounts = new Map<number, number>();
    let totalConfidence = 0;

    for (const history of this.pitchHistory) {
      const count = noteCounts.get(history.note) || 0;
      noteCounts.set(history.note, count + 1);
      totalConfidence += history.confidence;
    }

    // 平均信頼度が閾値を下回る場合は安定していない
    const avgConfidence = totalConfidence / this.pitchHistory.length;
    if (avgConfidence < 0.6) {
      return -1;
    }

    // 最も多く出現するノートを返す
    let maxCount = 0;
    let stableNote = -1;

    for (const [note, count] of noteCounts) {
      if (count > maxCount) {
        maxCount = count;
        stableNote = note;
      }
    }

    // 過半数を超える必要がある
    return maxCount > this.pitchHistorySize / 2 ? stableNote : -1;
  }

  /**
   * HMMと現在の候補の競合を解決
   */
  private resolveNoteConflict(hmmNote: number, currentCandidate: number): number {
    // HMMの信頼度が高い場合はHMMを優先
    if (Math.abs(hmmNote - currentCandidate) <= 2) {
      return hmmNote;
    }
    
    // 大きく異なる場合は現在の候補を優先
    return currentCandidate;
  }

  /**
   * スペクトル分析
   */
  private analyzeSpectralContent(samples: Float32Array): SpectralAnalysis {
    // FFT計算
    const fftSize = Math.min(samples.length, 2048);
    const fftBuffer = new Float32Array(fftSize);
    fftBuffer.set(samples.subarray(0, fftSize));
    
    // ウィンドウ関数（Hanning window）適用
    for (let i = 0; i < fftSize; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
      fftBuffer[i] *= window;
    }

    const magnitudes = this.computeFFTMagnitude(fftBuffer);
    const peaks = this.findSpectralPeaks(magnitudes);
    const centroid = this.calculateSpectralCentroid(peaks);
    const spread = this.calculateSpectralSpread(peaks, centroid);

    // クラリティ（明瞭度）計算
    const clarity = peaks.length > 0 ? peaks[0].magnitude / (magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length) : 0;

    return {
      peaks,
      centroid,
      spread,
      clarity: Math.min(1.0, clarity)
    };
  }

  /**
   * PYIN ピッチ分析
   */
  private analyzePitch(samples: Float32Array, spectral: SpectralAnalysis): PitchResult {
    if (!wasmMemory || !this.sampleRate) {
      return this.fallbackPitchDetection(samples, spectral);
    }

    try {
      // WASM メモリにサンプルをコピー
      const ptr = alloc(samples.length * 4);
      const wasmBuffer = new Float32Array(wasmMemory.buffer, ptr, samples.length);
      wasmBuffer.set(samples);

      // WASM ピッチ分析実行
      const frequency = analyze_pitch(ptr, samples.length, this.sampleRate, this.processingSettings.pyinThreshold);
      
      // メモリ解放
      free(ptr, samples.length * 4);

      const confidence = this.calculatePYINConfidence(samples, frequency);
      
      return {
        frequency,
        confidence,
        observationProbs: this.calculateObservationProbs(spectral.peaks)
      };
    } catch (error) {
      console.warn('WASM pitch analysis failed, using fallback:', error);
      return this.fallbackPitchDetection(samples, spectral);
    }
  }

  /**
   * 低周波数用ピッチ分析
   */
  private analyzePitchLowFreq(samples: Float32Array, spectral: SpectralAnalysis): PitchResult {
    // より大きなバッファでより精密な分析
    const extendedSpectral = this.analyzeSpectralContent(samples);
    return this.analyzePitch(samples, extendedSpectral);
  }

  /**
   * フォールバック ピッチ検出
   */
  private fallbackPitchDetection(samples: Float32Array, spectral: SpectralAnalysis): PitchResult {
    if (spectral.peaks.length === 0) {
      return { frequency: 0, confidence: 0 };
    }

    // 最大ピークを基準とする
    const dominantPeak = spectral.peaks[0];
    const confidence = Math.min(1.0, spectral.clarity * 0.8);

    return {
      frequency: dominantPeak.frequency,
      confidence,
      observationProbs: this.calculateObservationProbs(spectral.peaks)
    };
  }

  /**
   * 観測確率計算
   */
  private calculateObservationProbs(peaks: SpectralPeak[]): Float32Array {
    const numStates = 88; // 88鍵盤
    const probs = new Float32Array(numStates);
    
    for (const peak of peaks) {
      const noteIndex = this.getClosestNote(peak.frequency) - 21; // A0 = 21
      if (noteIndex >= 0 && noteIndex < numStates) {
        probs[noteIndex] += peak.magnitude;
      }
    }
    
    // 正規化
    const total = probs.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let i = 0; i < numStates; i++) {
        probs[i] /= total;
      }
    }
    
    return probs;
  }

  /**
   * FFT magnitude 計算（簡易実装）
   */
  private computeFFTMagnitude(samples: Float32Array): Float32Array {
    const N = samples.length;
    const magnitudes = new Float32Array(N / 2);
    
    // 簡易DFT実装（実際の本格実装では高速FFTを使用）
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * Math.sin(angle);
      }
      
      magnitudes[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return magnitudes;
  }

  /**
   * スペクトルピーク検出
   */
  private findSpectralPeaks(magnitudes: Float32Array): SpectralPeak[] {
    const peaks: SpectralPeak[] = [];
    const threshold = Math.max(...magnitudes) * 0.1; // 最大値の10%以上
    
    for (let i = 1; i < magnitudes.length - 1; i++) {
      if (magnitudes[i] > magnitudes[i - 1] && 
          magnitudes[i] > magnitudes[i + 1] && 
          magnitudes[i] > threshold) {
        
        const frequency = (i * (this.sampleRate || 44100)) / (2 * magnitudes.length);
        peaks.push({
          frequency,
          magnitude: magnitudes[i],
          index: i
        });
      }
    }
    
    // magnitude で降順ソート
    peaks.sort((a, b) => b.magnitude - a.magnitude);
    
    // 最大10個のピークまで
    return peaks.slice(0, 10);
  }

  /**
   * スペクトル重心計算
   */
  private calculateSpectralCentroid(peaks: SpectralPeak[]): number {
    if (peaks.length === 0) return 0;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const peak of peaks) {
      weightedSum += peak.frequency * peak.magnitude;
      totalWeight += peak.magnitude;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * スペクトル拡散計算
   */
  private calculateSpectralSpread(peaks: SpectralPeak[], centroid: number): number {
    if (peaks.length === 0) return 0;
    
    let weightedVariance = 0;
    let totalWeight = 0;
    
    for (const peak of peaks) {
      const deviation = peak.frequency - centroid;
      weightedVariance += deviation * deviation * peak.magnitude;
      totalWeight += peak.magnitude;
    }
    
    return totalWeight > 0 ? Math.sqrt(weightedVariance / totalWeight) : 0;
  }

  /**
   * PYIN信頼度計算
   */
  private calculatePYINConfidence(samples: Float32Array, frequency: number): number {
    if (frequency <= 0) return 0;
    
    // 簡易信頼度計算（実際の実装ではより複雑な計算）
    const amplitude = this.calculateMaxAmplitude(samples);
    const normalizedAmp = Math.min(1.0, amplitude / 0.5);
    
    // 周波数が有効範囲内かチェック
    const inRange = frequency >= this.processingSettings.minFrequency && 
                   frequency <= this.processingSettings.maxFrequency;
    
    return inRange ? normalizedAmp * 0.8 : 0;
  }

  /**
   * デバイスリスト更新
   */
  public async updateDeviceList(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      // デバイスセレクトボックス更新
      document.querySelectorAll('.audio-devices').forEach(select => {
        const selectElement = select as HTMLSelectElement;
        selectElement.innerHTML = '<option value="">Select microphone...</option>';
        
        audioInputs.forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.label || `Microphone ${device.deviceId}`;
          selectElement.appendChild(option);
        });
      });
    } catch (error) {
      console.error('Failed to update device list:', error);
    }
  }

  /**
   * エラー表示
   */
  private showError(message: string, selectId?: string): void {
    const targetSelector = selectId ? `#${selectId}` : '.audio-devices';
    const elements = document.querySelectorAll(targetSelector);
    
    elements.forEach(element => {
      let errorDiv = element.parentElement?.querySelector('.error-message');
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1';
        element.parentElement?.appendChild(errorDiv);
      }
      errorDiv.textContent = message;
      this.errorDisplays.set(element.id, errorDiv);
    });
  }

  /**
   * エラー非表示
   */
  private hideError(selectId?: string): void {
    const targetSelector = selectId ? `#${selectId}` : '.audio-devices';
    const elements = document.querySelectorAll(targetSelector);
    
    elements.forEach(element => {
      const errorDiv = element.parentElement?.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.remove();
      }
      this.errorDisplays.delete(element.id);
    });
  }

  /**
   * 接続状態変更通知
   */
  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  /**
   * 処理の一時停止（シーク時など）
   */
  public pauseProcessingForSeek(): void {
    this.pauseProcessing = true;
    setTimeout(() => {
      this.pauseProcessing = false;
    }, 100);
  }

  /**
   * 接続状態取得
   */
  public isConnected(): boolean {
    return this.mediaStream !== null && this.isProcessing;
  }

  /**
   * 現在のデバイスID取得
   */
  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * リスニング開始
   */
  public startListening(): void {
    this.isProcessing = true;
    this.pauseProcessing = false;
    this.fadeInOutput();
  }

  /**
   * リスニング停止
   */
  public stopListening(): void {
    this.isProcessing = false;
    this.fadeOutOutput();
    if (this.activeNote !== null) {
      this.onNoteOff(this.activeNote);
      
      // ハイライト解除
      if (this.keyHighlightCallback) {
        this.keyHighlightCallback(this.activeNote, false);
      }
      
      this.activeNote = null;
    }
  }

  /**
   * キーハイライトコールバック設定（MIDIController統合用）
   */
  public setKeyHighlightCallback(callback: (note: number, active: boolean) => void): void {
    this.keyHighlightCallback = callback;
  }

  /**
   * キープレスエフェクトコールバック設定（PIXIレンダラー統合用）
   */
  public setKeyPressEffectCallback(callback: (note: number) => void): void {
    this.keyPressEffectCallback = callback;
  }

  /**
   * 処理有効状態取得
   */
  public get enabled(): boolean {
    return this.isProcessing;
  }

  /**
   * 処理有効状態設定
   */
  public set enabled(value: boolean) {
    if (value) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  /**
   * 設定更新
   */
  public updateConfig(config: any): void {
    // 設定に応じて処理パラメータを更新
    if (config.minFrequency !== undefined) {
      this.processingSettings.minFrequency = config.minFrequency;
    }
    if (config.maxFrequency !== undefined) {
      this.processingSettings.maxFrequency = config.maxFrequency;
    }
    if (config.amplitudeThreshold !== undefined) {
      this.processingSettings.amplitudeThreshold = config.amplitudeThreshold;
    }
    if (config.pyinThreshold !== undefined) {
      this.processingSettings.pyinThreshold = config.pyinThreshold;
      console.log(`🎤 PYIN threshold updated to: ${config.pyinThreshold}`);
    }
  }

  /**
   * オーディオ入力設定画面用のセットアップ
   */
  public setupAudioControls(): void {
    // デバイスリスト更新とイベントリスナー設定
    this.updateDeviceList();
  }

  /**
   * 切断処理
   */
  public async disconnect(): Promise<void> {
    this.isProcessing = false;
    
    // アクティブノートのハイライトを解除
    if (this.activeNote !== null) {
      this.onNoteOff(this.activeNote);
      
      if (this.keyHighlightCallback) {
        this.keyHighlightCallback(this.activeNote, false);
      }
      
      this.activeNote = null;
    }
    
    // メディアストリーム停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // AudioWorklet/ScriptProcessor切断
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    
    if (this.analyserTimer) {
      clearInterval(this.analyserTimer);
      this.analyserTimer = null;
    }
    
    // AudioContext終了（iOS以外）
    if (this.audioContext && !this.isIOSDevice) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.currentDeviceId = null;
    this.notifyConnectionChange(false);
  }

  private fadeInOutput(duration: number = 0.2): void {
    if (this.outputGainNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.outputGainNode.gain.cancelScheduledValues(now);
      this.outputGainNode.gain.setValueAtTime(0, now);
      this.outputGainNode.gain.linearRampToValueAtTime(1, now + duration);
    }
  }

  private fadeOutOutput(duration: number = 0.1): void {
    if (this.outputGainNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.outputGainNode.gain.cancelScheduledValues(now);
      this.outputGainNode.gain.setValueAtTime(this.outputGainNode.gain.value, now);
      this.outputGainNode.gain.linearRampToValueAtTime(0, now + duration);
    }
  }
} 