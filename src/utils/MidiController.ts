/**
 * 共通音声システム + MIDI コントローラー
 * Web MIDI API + 共通音声再生ロジックで、MIDI/マウス/タッチ統合対応
 */

import type {
  MidiDevice,
  MidiMessage,
  MidiInput,
  MidiAccess,
  ToneFrequency,
  ToneStatic,
  MidiControllerOptions
} from '@/types';
import { FantasySoundManager } from './FantasySoundManager';

// ToneSamplerインターフェースを拡張
interface ToneSampler {
  triggerAttack(note: string, time?: number, velocity?: number): void;
  triggerRelease(note: string, time?: number): void;
  toDestination(): ToneSampler;
  active?: any[];
}

// 共通音声再生システム
let globalSampler: ToneSampler | null = null;
let audioSystemInitialized = false;
let userInteracted = false;

const SALAMANDER_BASE_URL = 'https://tonejs.github.io/audio/salamander/';
const LIGHT_SAMPLER_URLS: Record<string, string> = {
  A2: 'A2.mp3',
  'D#3': 'Ds3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3'
};

// アクティブなノートを追跡するSet
const activeNotes = new Set<string>();
// サスティン状態（フォールバック用）
let sustainOn = false;
const sustainedNotes = new Set<string>();

/** `detectUserInteraction` 待ちを解除するための参照（ステージ選択のクリックがマウントより先に終わる場合に使用） */
let pendingInteractionResolve: (() => void) | null = null;
let pendingInteractionCleanup: (() => void) | null = null;

/**
 * ステージ選択など、音声初期化より前に発生したユーザー操作を記録する。
 * `FantasyGameScreen` マウント前に発火したクリックは `detectUserInteraction` のリスナーに届かないため、ここで明示的に完了させる。
 */
export const markAudioUserInteraction = (): void => {
  if (userInteracted) {
    return;
  }
  userInteracted = true;
  pendingInteractionCleanup?.();
  pendingInteractionCleanup = null;
  const r = pendingInteractionResolve;
  pendingInteractionResolve = null;
  r?.();
};

/**
 * ユーザーインタラクションの検出
 */
const detectUserInteraction = (): Promise<void> => {
  return new Promise((resolve) => {
    if (userInteracted) {
      resolve();
      return;
    }

    // If Tone audio context is already running (e.g. Tone.start() was invoked),
    // treat it as an interaction to avoid requiring a second click.
    try {
      const tone: any = (typeof window !== 'undefined') ? (window as any).Tone : null;
      if (tone?.context?.state === 'running') {
        userInteracted = true;
        resolve();
        return;
      }
    } catch {}

    // iOS WebView: user already tapped native button to get here
    try {
      if (window.webkit?.messageHandlers?.gameCallback) {
        userInteracted = true;
        resolve();
        return;
      }
    } catch {}

    pendingInteractionResolve = resolve;

    const handleUserInteraction = () => {
      userInteracted = true;
      pendingInteractionCleanup?.();
      pendingInteractionCleanup = null;
      const r = pendingInteractionResolve;
      pendingInteractionResolve = null;
      r?.();
    };

    const cleanupListeners = () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    pendingInteractionCleanup = cleanupListeners;

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
  });
};

const disposeSampler = (sampler: ToneSampler | null): void => {
  if (!sampler) return;
  try {
    if (typeof (sampler as any).dispose === 'function') {
      (sampler as any).dispose();
    }
  } catch (error) {
    console.warn('⚠️ Failed to dispose sampler:', error);
  }
};

// 排他ロック: 並行呼び出しでも初期化は1回だけ実行される
let audioInitPromise: Promise<void> | null = null;

/**
 * 音声システムの初期化（遅延最適化設定付き）
 * 複数箇所から同時に呼ばれても安全（Promiseベースのシングルトン）
 */
export const initializeAudioSystem = (): Promise<void> => {
  if (audioSystemInitialized) return Promise.resolve();
  if (audioInitPromise) return audioInitPromise;
  audioInitPromise = doInitializeAudioSystem();
  return audioInitPromise;
};

const doInitializeAudioSystem = async (): Promise<void> => {
  try {
    console.log('🎹 Initializing optimized audio system...');
    
    await detectUserInteraction();
    
    if (typeof window === 'undefined' || !window.Tone) {
      console.warn('⚠️ Tone.js not available, attempting to load...');
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const Tone = await import('tone');
          (window as any).Tone = Tone;
          console.log('✅ Tone.js loaded dynamically');
          break;
        } catch (toneError) {
          retryCount++;
          console.warn(`⚠️ Dynamic import attempt ${retryCount} failed:`, toneError);
          
          if (retryCount >= maxRetries) {
            console.error('❌ All dynamic import attempts failed');
            audioInitPromise = null;
            throw new Error(`音声/MIDIシステム初期化に失敗 (ユーザーインタラクション後に再試行): ${toneError instanceof Error ? toneError.message : 'Unknown error'}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
        }
      }
    }

    const ToneLib: any = (window as any).Tone;
    const optimizedContext = new ToneLib.Context({
      latencyHint: 'interactive',
      lookAhead: 0
    });
    ToneLib.setContext(optimizedContext);

    globalSampler = new ToneLib.Sampler({
      urls: LIGHT_SAMPLER_URLS,
      baseUrl: SALAMANDER_BASE_URL
    }).toDestination();

    if (globalSampler && (globalSampler as any).envelope) {
      (globalSampler as any).envelope.attack = 0.001;
    }

    await ToneLib.loaded();

    audioSystemInitialized = true;
    console.log('✅ Optimized audio system initialized successfully');
    
  } catch (error) {
    audioInitPromise = null;
    console.error('❌ Audio system initialization failed:', error);
    throw error;
  }
};

/**
 * 共通音声再生: ノートオン
 */
export const playNote = async (note: number, velocity: number = 127): Promise<void> => {
  try {
    const normalizedVelocity = velocity / 127; // 0〜1 に正規化

    // 🎹 GM音源を優先使用（高品質なピアノ音）
    if (FantasySoundManager.isGMReady()) {
      FantasySoundManager.playGMNote(note, normalizedVelocity);
      activeNotes.add(note.toString());
      return;
    }

    // フォールバック: Tone.js Sampler
    // 音声システム初期化チェック
    if (!audioSystemInitialized || !globalSampler) {
      // FM合成音が使えるなら即時発音（CDN不要フォールバック）
      if (FantasySoundManager.isFMSynthReady()) {
        FantasySoundManager.playFMNote(note, normalizedVelocity);
        activeNotes.add(note.toString());
        initializeAudioSystem().catch(() => {});
        return;
      }
      await initializeAudioSystem();
    }

    // ユーザージェスチャーで AudioContext を resume
    if ((window as any).Tone.context.state !== "running") {
      // ラグ回避のため await せずに実行
      (window as any).Tone.start().catch(() => {});
    }
    
    const noteName = (window as any).Tone.Frequency(note, "midi").toNote();

    // 既に持続中のノートは解放キューから除外（再打鍵扱い）
    sustainedNotes.delete(noteName);

    // 既に再生中のノートがある場合は一旦停止
    if (activeNotes.has(noteName)) {
      try {
        globalSampler?.triggerRelease(noteName);
      } catch (error) {
        console.warn('⚠️ Failed to release existing note:', error);
      }
    }

    // 再生開始（音源に応じて分岐）
    if (globalSampler) {
      globalSampler.triggerAttack(noteName, undefined, normalizedVelocity);
    }
    activeNotes.add(noteName);
  } catch (error) {
    console.error('❌ Failed to play note:', error);
  }
};

/**
 * 共通音声再生: ノートオフ
 */
export const stopNote = (note: number): void => {
  try {
    // 🎹 GM音源のノートを停止
    if (FantasySoundManager.isGMReady()) {
      FantasySoundManager.stopGMNote(note);
      activeNotes.delete(note.toString());
      return;
    }

    // FM合成音のノートも停止
    FantasySoundManager.stopFMNote(note);

    // フォールバック: Tone.js Sampler
    if (!globalSampler) {
      return;
    }

    const noteName = (window as any).Tone.Frequency(note, "midi").toNote();
    
    // アクティブノートから削除
    activeNotes.delete(noteName);
    
    // 音源に応じてリリース
    if (globalSampler && typeof globalSampler.triggerRelease === 'function') {
      // サスティン中はリリースを遅延
      if (sustainOn) {
        sustainedNotes.add(noteName);
        return;
      }
      try {
        globalSampler.triggerRelease(noteName);
      } catch (error) {
        console.warn('⚠️ Failed to trigger release:', error);
        // エラーが発生してもクラッシュしないようにする
      }
    }
  } catch (error) {
    console.error('❌ Failed to stop note:', error);
  }
};

/**
 * 共通音声システムの音量更新
 */
export const updateGlobalVolume = (volume: number): void => {
  try {
    // GM音源のピアノ音量を更新
    FantasySoundManager.setGMPianoVolume(volume);
    
    // フォールバック用: Tone.js Samplerの音量も更新
    // 0-1 の範囲を -40dB から 0dB にマッピング
    const volumeDb = volume === 0 ? -Infinity : Math.log10(volume) * 20;

    if (globalSampler && (globalSampler as any).volume) {
      (globalSampler as any).volume.value = volumeDb;
    }
  } catch (error) {
    console.error('❌ Failed to update global volume:', error);
  }
};

export class MIDIController {
  private readonly onNoteOn: (note: number, velocity?: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private midiAccess: MIDIAccess | null = null;
  private readonly activeNotes = new Set<number>();
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private currentDeviceId: string | null = null;
  private isInitialized = false;
  
  // PIXI.js レンダラーのキーハイライト用コールバック
  private onKeyHighlight?: (note: number, active: boolean) => void;
  
  // MIDI入力の有効/無効状態（初期値をtrueに変更）
  private isEnabled = true; // ★ デフォルトでMIDI入力を有効にする
  
  // 音声再生制御フラグ
  private readonly playMidiSound: boolean;

  private nativeMIDICleanup: (() => void) | null = null;

  constructor(options: MidiControllerOptions & { playMidiSound?: boolean }) {
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange || null;
    this.playMidiSound = options.playMidiSound ?? true;

    this.setupNativeMIDIBridge();
  }

  private setupNativeMIDIBridge(): void {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('platform') !== 'ios') return;

    const handler = (status: number, note: number, velocity: number) => {
      if (!this.isEnabled) return;
      const command = status & 0xf0;
      if (command === 0x90 && velocity > 0) {
        this.handleNoteOn(note, velocity);
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        this.handleNoteOff(note);
      }
    };
    window.onNativeMidiMessage = handler;
    this.nativeMIDICleanup = () => {
      if (window.onNativeMidiMessage === handler) {
        window.onNativeMidiMessage = undefined;
      }
    };
  }

  // MIDI APIが利用可能かどうか
  private midiSupported = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🎹 MIDI Controller already initialized');
      return;
    }

    try {
      // 共通音声システムを初期化（ユーザーインタラクション待ちを含む）
      await initializeAudioSystem();

      // MIDI API の存在確認
      if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
        if (isIOS) {
          console.log('📱 iOS detected: Web MIDI API not available, touch/click input will be used');
        } else {
          console.log('⚠️ Web MIDI API not supported in this browser, touch/click input will be used');
        }
        this.midiSupported = false;
        this.isInitialized = true;
        return;
      }

      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.midiSupported = true;

      this.midiAccess!.onstatechange = (event): void => {
        if (event.port) {
          const port: any = event.port;
          if (port.type === 'input' && this.currentDeviceId) {
            if (port.id === this.currentDeviceId && port.state === 'disconnected') {
              this.disconnectDevice(port.id);
            } else if (port.id === this.currentDeviceId && port.state === 'connected') {
              try {
                const input = this.midiAccess!.inputs.get(port.id);
                if (input) {
                  input.onmidimessage = this.handleMIDIMessage;
                  this.isEnabled = true;
                  this.notifyConnectionChange(true);
                }
              } catch {}
            }
          }
        }
        void this.checkAndRestoreConnection();
        this.notifyConnectionChange(this.isConnected());
      };

      this.isInitialized = true;

    } catch (error) {
      console.error('❌ MIDI Error:', error);
      this.midiSupported = false;
      this.isInitialized = true;
      this.notifyConnectionChange(false);
    }
  }

  /**
   * MIDI APIが利用可能かどうかを返す
   */
  public isMidiSupported(): boolean {
    return this.midiSupported;
  }

  private handleMIDIMessage = (message: any): void => {
    // MIDI入力が無効な場合は処理をスキップ
    if (!this.isEnabled) {
      console.log('🎹 MIDI input disabled, skipping message');
      return;
    }
    
    const [status, data1, data2] = Array.from(message.data) as [number, number, number];
    const command = status & 0xf0;

    // ノートオン（velocity > 0）
    if (command === 0x90 && data2 > 0) {
      this.handleNoteOn(data1, data2);
    }
    // ノートオフ（velocity = 0 または 0x80）
    else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      this.handleNoteOff(data1);
    }
    // コントロールチェンジ（サスティンなど）
    else if (command === 0xB0) {
      const controllerNumber = data1;
      const controllerValue = data2;
      // CC64: サスティンペダル
        if (controllerNumber === 64) {
          try {
            if (controllerValue >= 64) {
              sustainOn = true;
            } else {
              sustainOn = false;
              sustainedNotes.forEach((n) => {
                try {
                  globalSampler?.triggerRelease(n);
                } catch {}
              });
              sustainedNotes.clear();
            }
          } catch (e) {
            console.warn('⚠️ Failed to process sustain pedal:', e);
          }
        }
    }
  };

  private handleNoteOn(note: number, velocity: number): void {
    try {
      // アクティブノーツに追加
      this.activeNotes.add(note);
      
      // PIXI.js キーハイライト
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, true);
      }
      
      // ゲーム判定を最優先にするため、先にエンジンへ通知
      this.onNoteOn(note, velocity);

      // 音声再生は後続で実行（判定遅延を避ける）
      if (this.playMidiSound) {
        void playNote(note, velocity).catch((error) => {
          console.error('❌ Failed to play note:', error);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to handle note on:', error);
    }
  }

  private handleNoteOff(note: number): void {
    try {
      // 共通音声システムを使用
      stopNote(note);
      
      // アクティブノーツから削除
      this.activeNotes.delete(note);
      
      // PIXI.js キーハイライト解除
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, false);
      }
      
      // ゲームエンジンに通知
      this.onNoteOff(note);
      
    } catch (error) {
      console.error('❌ Failed to handle note off:', error);
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange && typeof this.onConnectionChange === 'function') {
      this.onConnectionChange(connected);
    }
  }

  public getDeviceList(): MidiDevice[] {
    if (!this.midiAccess) {
      return [];
    }
    
    const devices: MidiDevice[] = [];
    this.midiAccess.inputs.forEach((input: any) => {
      devices.push({
        id: input.id,
        name: input.name || `Unknown Device (${input.id})`,
        manufacturer: '',
        connected: input.state === 'connected'
      });
    });
    
    return devices;
  }

  public async connectDevice(deviceId: string): Promise<boolean> {
    // 初期化が完了するまで待機してレースコンディションを防ぐ
    await this.initialize();

    if (!this.midiAccess) {
      console.warn('⚠️ MIDI access not available');
      return false;
    }
    
    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      // 既存の接続を切断
      if (this.currentDeviceId) {
        this.disconnectDevice(this.currentDeviceId);
      }

      input.onmidimessage = this.handleMIDIMessage;
      this.currentDeviceId = deviceId;
      this.isEnabled = true; // デバイス接続時にMIDI入力を明示的に有効化
      
      console.log(`✅ Connected to MIDI device: ${input.name} (${deviceId})`);
      
      this.notifyConnectionChange(true);
      return true;
    } else {
      console.error(`❌ MIDI device not found: ${deviceId}`);
      console.log('🎹 Available devices:', this.getDeviceList());
      return false;
    }
  }

  public disconnectDevice(deviceId: string): void {
    if (!this.midiAccess) {
      return;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = null;
    }
    
    if (this.currentDeviceId === deviceId) {
      this.currentDeviceId = null;
      this.isEnabled = false; // デバイス切断時にMIDI入力を無効化
      this.activeNotes.clear();
      this.notifyConnectionChange(false);
    }
  }

  public disconnect(): void {
    if (this.currentDeviceId) {
      this.disconnectDevice(this.currentDeviceId);
    }
    
    this.isEnabled = false; // 完全切断時にも無効化
    this.activeNotes.clear();
    this.notifyConnectionChange(false);
  }

  // 公開プロパティ・メソッド
  public isConnected(): boolean {
    return this.currentDeviceId !== null;
  }

  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * 現在選択されているデバイスとの接続状態を確認し、必要に応じて再接続する
   * @returns 接続が成功したかどうか
   */
  public async checkAndRestoreConnection(): Promise<boolean> {
    if (!this.currentDeviceId) {
      return false;
    }

    // 現在のデバイスが実際に接続されているか確認
    if (!this.midiAccess) {
      console.warn('⚠️ MIDI access not available');
      return false;
    }

    const input = this.midiAccess.inputs.get(this.currentDeviceId);
    if (!input || input.state !== 'connected') {
      console.log('🔄 Device disconnected, attempting to reconnect...');
      return this.connectDevice(this.currentDeviceId);
    }

    // 既に接続されているが、メッセージハンドラが設定されていない場合
    if (!input.onmidimessage) {
      console.log('🔧 Restoring message handler for connected device');
      input.onmidimessage = this.handleMIDIMessage;
      this.isEnabled = true;
      this.notifyConnectionChange(true);
    }

    return true;
  }

  public getCurrentDeviceName(): string | null {
    if (!this.currentDeviceId || !this.midiAccess) return null;
    
    const input = this.midiAccess.inputs.get(this.currentDeviceId);
    return input?.name || null;
  }

  public getActiveNotes(): Set<number> {
    return new Set(this.activeNotes); // 不変性のためコピーを返す
  }

  public setConnectionChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }
  
  public setKeyHighlightCallback(callback: (note: number, active: boolean) => void): void {
    this.onKeyHighlight = callback;
    console.log('🎹 Key highlight callback set');
  }
  
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  public isInputEnabled(): boolean {
    return this.isEnabled;
  }

  public hasKeyHighlightCallback(): boolean {
    return !!this.onKeyHighlight;
  }

  public async destroy(): Promise<void> {
    this.disconnect();
    this.nativeMIDICleanup?.();
    this.nativeMIDICleanup = null;
    this.isInitialized = false;
  }

  /**
   * MIDI音源の音量を更新（共通システム経由）
   */
  public updateVolume(volume: number): void {
    updateGlobalVolume(volume);
  }

  // シーク・ループ状態をチェック
  private isSeekingOrLooping(): boolean {
    const gameInstance = (window as any).gameInstance;
    
    if (gameInstance) {
      const now = Date.now();
      const isInSeekCooldown = (now - gameInstance.lastSeekTime) < gameInstance.seekCooldownTime;
      return gameInstance.isJustAfterSeek || 
             gameInstance.isInLoop || 
             gameInstance.isSkipping || 
             isInSeekCooldown;
    }
    return false;
  }
}

export default MIDIController; 