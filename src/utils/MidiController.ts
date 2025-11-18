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

// ToneSamplerインターフェースを拡張
interface ToneSampler {
  triggerAttack(note: string, time?: number, velocity?: number): void;
  triggerRelease(note: string, time?: number): void;
  toDestination(): ToneSampler;
  active?: any[];
}

// ピアノ音源インターフェース（@tonejs/piano 互換）
interface PianoInstrument {
  keyDown(options: { note: string; velocity?: number }): void;
  keyUp(options: { note: string }): void;
  pedalDown(): void;
  pedalUp(): void;
  toDestination(): PianoInstrument;
  load(): Promise<void>;
  volume?: { value: number };
}

type AudioQualityMode = 'light' | 'piano';
interface InitializeAudioOptions {
  light?: boolean;
  requireInteraction?: boolean;
  forceReinitialize?: boolean;
}

// 共通音声再生システム
let globalSampler: ToneSampler | null = null;
let globalPiano: PianoInstrument | null = null;
let usingPianoInstrument = false;
let audioSystemInitialized = false;
let userInteracted = false;
let resolveUserInteraction: (() => void) | null = null;
let pendingInteractionPromise: Promise<void> | null = null;

const SALAMANDER_BASE_URL = 'https://tonejs.github.io/audio/salamander/';
const LIGHT_SAMPLER_URLS: Record<string, string> = {
  A2: 'A2.mp3',
  'D#3': 'Ds3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3'
};
const FULL_SAMPLER_URLS: Record<string, string> = {
  A1: 'A1.mp3',
  C2: 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2: 'A2.mp3',
  C3: 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3'
};
type SamplerQuality = 'none' | 'light' | 'full';
let samplerQuality: SamplerQuality = 'none';
let samplerUpgradePromise: Promise<void> | null = null;
let initializingPromise: Promise<void> | null = null;
let preferredAudioQuality: AudioQualityMode = 'light';

// アクティブなノートを追跡するSet
const activeNotes = new Set<string>();
// サスティン状態（フォールバック用）
let sustainOn = false;
const sustainedNotes = new Set<string>();

const ensureUserInteractionListeners = () => {
  if (typeof document === 'undefined' || userInteracted || pendingInteractionPromise) {
    return;
  }
  pendingInteractionPromise = new Promise((resolve) => {
    resolveUserInteraction = resolve;
  });
  const events: Array<keyof DocumentEventMap> = ['pointerdown', 'touchstart', 'keydown'];
  const handleInteraction = () => {
    userInteracted = true;
    events.forEach((eventName) => document.removeEventListener(eventName, handleInteraction, true));
    resolveUserInteraction?.();
    resolveUserInteraction = null;
  };
  events.forEach((eventName) =>
    document.addEventListener(eventName, handleInteraction, { passive: true, capture: true })
  );
};

/**
 * ユーザーインタラクションの検出
 */
const detectUserInteraction = (): Promise<void> => {
  if (userInteracted) {
    return Promise.resolve();
  }

  try {
    const tone: any = typeof window !== 'undefined' ? (window as any).Tone : null;
    if (tone?.context?.state === 'running') {
      userInteracted = true;
      return Promise.resolve();
    }
  } catch {}

  ensureUserInteractionListeners();
  if (pendingInteractionPromise) {
    return pendingInteractionPromise;
  }
  return Promise.resolve();
};

if (typeof document !== 'undefined') {
  ensureUserInteractionListeners();
}

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

const disposeGlobalPianoInstance = () => {
  if (!globalPiano) return;
  try {
    if (typeof (globalPiano as any).dispose === 'function') {
      (globalPiano as any).dispose();
    }
  } catch (error) {
    console.warn('⚠️ Failed to dispose piano instrument:', error);
  }
  globalPiano = null;
  usingPianoInstrument = false;
};

const resetSamplerState = () => {
  disposeSampler(globalSampler);
  globalSampler = null;
  samplerQuality = 'none';
};

const ensureToneAvailable = async (): Promise<typeof import('tone')> => {
  if (typeof window === 'undefined') {
    throw new Error('Tone.js is not available in this environment');
  }
  if (!(window as any).Tone) {
    const ToneModule = await import('tone');
    (window as any).Tone = ToneModule;
    return ToneModule;
  }
  return (window as any).Tone;
};

const scheduleFullSamplerUpgrade = (): void => {
  if (samplerQuality === 'full' || samplerUpgradePromise || usingPianoInstrument) {
    return;
  }

  const Tone = (typeof window !== 'undefined') ? (window as any).Tone : null;
  if (!Tone) return;

  samplerUpgradePromise = (async () => {
    try {
      const upgradedSampler: ToneSampler = new Tone.Sampler({
        urls: FULL_SAMPLER_URLS,
        baseUrl: SALAMANDER_BASE_URL
      }).toDestination();

      await Tone.loaded();

      const previousVolume = (globalSampler as any)?.volume?.value ?? 0;
      disposeSampler(globalSampler);
      globalSampler = upgradedSampler;
      if ((globalSampler as any).volume && Number.isFinite(previousVolume)) {
        (globalSampler as any).volume.value = previousVolume;
      }
      samplerQuality = 'full';
      console.log('✅ Salamander sampler upgraded to full quality');
      samplerUpgradePromise = null;
    } catch (error) {
      console.warn('⚠️ Failed to upgrade Salamander sampler:', error);
      samplerUpgradePromise = null;
    }
  })();
};

/**
 * 音声システムの初期化（遅延最適化設定付き）
 */
export const initializeAudioSystem = async (opts?: InitializeAudioOptions): Promise<void> => {
  const requireInteraction = opts?.requireInteraction !== false;
  const forceReinitialize = opts?.forceReinitialize ?? false;
  const prefersLight = opts?.light ?? (preferredAudioQuality !== 'piano');

  if (initializingPromise) {
    if (!forceReinitialize) {
      return initializingPromise;
    }
    await initializingPromise;
  }

  initializingPromise = (async () => {
    if (forceReinitialize) {
      disposeGlobalPianoInstance();
      resetSamplerState();
      audioSystemInitialized = false;
    } else if (audioSystemInitialized) {
      const hasPiano = usingPianoInstrument;
      const matchesPreference = prefersLight
        ? !hasPiano && samplerQuality === 'light'
        : hasPiano || (!hasPiano && samplerQuality === 'full');
      if (matchesPreference) {
        return;
      }
    }

    if (requireInteraction && !userInteracted) {
      await detectUserInteraction();
    }

    const Tone = await ensureToneAvailable();

    try {
      const optimizedContext = new Tone.Context({
        latencyHint: 'interactive',
        lookAhead: 0,
      } as any);
      Tone.setContext(optimizedContext);
    } catch (contextError) {
      console.warn('⚠️ Tone.js context optimization failed:', contextError);
    }

    if (Tone.context?.state !== 'running') {
      try {
        await Tone.context.resume();
      } catch {}
    }

    if (!prefersLight) {
      disposeGlobalPianoInstance();
    } else {
      resetSamplerState();
    }

    const samplerUrls = prefersLight ? LIGHT_SAMPLER_URLS : FULL_SAMPLER_URLS;
    globalSampler = new (Tone as any).Sampler({
      urls: samplerUrls,
      baseUrl: SALAMANDER_BASE_URL,
    }).toDestination();
    samplerQuality = prefersLight ? 'light' : 'full';

    if (globalSampler && (globalSampler as any).envelope) {
      (globalSampler as any).envelope.attack = 0.001;
    }

    if (prefersLight) {
      (Tone as any)
        .loaded()
        .catch(() => {});
      scheduleFullSamplerUpgrade();
    } else {
      await (Tone as any).loaded();
    }

    audioSystemInitialized = true;
  })();

  try {
    await initializingPromise;
  } finally {
    initializingPromise = null;
  }
};

/**
 * 既に軽量サンプラーで初期化済みでも、@tonejs/piano へアップグレードする
 */
export const upgradeAudioSystemToFull = async (): Promise<void> => {
  preferredAudioQuality = 'piano';
  try {
    if (!userInteracted) {
      await detectUserInteraction();
    }
    const Tone = await ensureToneAvailable();
    try {
      const optimizedContext = new Tone.Context({ latencyHint: 'interactive', lookAhead: 0 } as any);
      Tone.setContext(optimizedContext);
      if (Tone.context?.state !== 'running') {
        await Tone.context.resume();
      }
    } catch {}

    if (usingPianoInstrument && globalPiano) {
      return;
    }

    disposeGlobalPianoInstance();
    resetSamplerState();

    try {
      const PianoModule: any = await import('@tonejs/piano/build/piano/Piano.js');
      const PianoCtor = PianoModule.Piano ?? PianoModule.default ?? PianoModule;
      const piano: PianoInstrument = new PianoCtor({ velocities: 5, release: true, pedal: true }).toDestination();
      await piano.load();
      globalPiano = piano;
      usingPianoInstrument = true;
      audioSystemInitialized = true;
    } catch (e) {
      console.warn('⚠️ Failed to upgrade to @tonejs/piano:', e);
    }
  } catch (error) {
    console.warn('⚠️ upgradeAudioSystemToFull failed:', error);
  }
};

export const setAudioQualityMode = async (mode: AudioQualityMode): Promise<void> => {
  if (mode === preferredAudioQuality) {
    if (mode === 'piano' && !usingPianoInstrument) {
      await upgradeAudioSystemToFull();
    }
    if (mode === 'light' && usingPianoInstrument) {
      disposeGlobalPianoInstance();
      await initializeAudioSystem({ light: true, requireInteraction: false, forceReinitialize: true });
    }
    return;
  }

  preferredAudioQuality = mode;
  if (mode === 'piano') {
    await upgradeAudioSystemToFull();
    return;
  }
  disposeGlobalPianoInstance();
  await initializeAudioSystem({ light: true, requireInteraction: false, forceReinitialize: true });
};

/**
 * 共通音声再生: ノートオン
 */
export const playNote = async (note: number, velocity: number = 127): Promise<void> => {
  try {
    // 音声システム初期化チェック
    if (!audioSystemInitialized || (!globalSampler && !globalPiano)) {
      await initializeAudioSystem();
    }

    // ユーザージェスチャーで AudioContext を resume
    if ((window as any).Tone.context.state !== "running") {
      await (window as any).Tone.start();
    }
    
    const noteName = (window as any).Tone.Frequency(note, "midi").toNote();
    const normalizedVelocity = velocity / 127; // 0〜1 に正規化

    // 既に持続中のノートは解放キューから除外（再打鍵扱い）
    sustainedNotes.delete(noteName);

    // 既に再生中のノートがある場合は一旦停止
    if (activeNotes.has(noteName)) {
      try {
        if (usingPianoInstrument && globalPiano) {
          globalPiano.keyUp({ note: noteName });
        } else if (globalSampler) {
          globalSampler.triggerRelease(noteName);
        }
      } catch (error) {
        console.warn('⚠️ Failed to release existing note:', error);
      }
    }

    // 再生開始（音源に応じて分岐）
    if (usingPianoInstrument && globalPiano) {
      globalPiano.keyDown({ note: noteName, velocity: normalizedVelocity });
    } else if (globalSampler) {
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
    if (!globalSampler && !globalPiano) {
      console.warn('⚠️ Audio system not initialized');
      return;
    }

    const noteName = (window as any).Tone.Frequency(note, "midi").toNote();
    
    // アクティブノートから削除
    activeNotes.delete(noteName);
    
    // 音源に応じてリリース
    if (usingPianoInstrument && globalPiano) {
      try {
        globalPiano.keyUp({ note: noteName });
      } catch (error) {
        console.warn('⚠️ Failed to keyUp note:', error);
      }
    } else if (globalSampler && typeof globalSampler.triggerRelease === 'function') {
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
    // 0-1 の範囲を -40dB から 0dB にマッピング
    const volumeDb = volume === 0 ? -Infinity : Math.log10(volume) * 20;

    if (usingPianoInstrument && globalPiano && (globalPiano as any).volume) {
      (globalPiano as any).volume.value = volumeDb;
      return;
    }
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
  private readonly lightAudio: boolean;

  constructor(options: MidiControllerOptions & { playMidiSound?: boolean }) {
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange || null;
    this.playMidiSound = options.playMidiSound ?? true; // デフォルトは音を鳴らす
    this.lightAudio = (options as any).lightAudio ?? (preferredAudioQuality !== 'piano');

    console.log('🎹 MIDI Controller initialized (using global audio system)');
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🎹 MIDI Controller already initialized');
      return;
    }

    try {
      // 共通音声システムを初期化（LPなど軽量指定の考慮）
      await initializeAudioSystem({ light: this.lightAudio });
      
      // MIDI API の存在確認
      if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
        const help = '詳しくは /help/ios-midi をご覧ください。';
        const message = isIOS
          ? 'iPhone/iPad では Safari 等で Web MIDI API が利用できません。App Store の Web MIDI Browser の利用をご検討ください。'
          : 'Web MIDI API is not supported';
        throw new Error(`${message} ${help}`);
      }

      this.midiAccess = await navigator.requestMIDIAccess();

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
        // 自動復旧を試行
        void this.checkAndRestoreConnection();
        // デバイスリスト更新のコールバックを呼び出し
        this.notifyConnectionChange(this.isConnected());
      };

      this.isInitialized = true;

    } catch (error) {
      console.error('❌ MIDI Error:', error);
      this.notifyConnectionChange(false);
      throw error;
    }
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
          if (usingPianoInstrument && globalPiano) {
            if (controllerValue >= 64) {
              globalPiano.pedalDown();
            } else {
              globalPiano.pedalUp();
            }
          } else {
            // フォールバック: サスティン疑似処理
            if (controllerValue >= 64) {
              sustainOn = true;
            } else {
              sustainOn = false;
              // 保持していたノートをまとめてリリース
              sustainedNotes.forEach((n) => {
                try {
                  globalSampler?.triggerRelease(n);
                } catch {}
              });
              sustainedNotes.clear();
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to process sustain pedal:', e);
        }
      }
    }
  };

  private async handleNoteOn(note: number, velocity: number): Promise<void> {
    try {
      // playMidiSoundフラグがtrueの場合のみ共通の音声再生を実行
      if (this.playMidiSound) {
        await playNote(note, velocity);
      }
      
      // アクティブノーツに追加
      this.activeNotes.add(note);
      
      // PIXI.js キーハイライト
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, true);
      }
      
      // ゲームエンジンに通知
      this.onNoteOn(note, velocity);
      
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