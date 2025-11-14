/**
 * 共通音声システム + MIDI コントローラー
 * Web MIDI API + 共通音声再生ロジックで、MIDI/マウス/タッチ統合対応
 */

import type {
  MidiDevice,
  MidiControllerOptions
} from '@/types';
import type { PolySynth, Synth, SynthOptions } from 'tone';

type ToneModule = typeof import('tone');
type ToneFilter = import('tone').Filter;
type ToneChorus = import('tone').Chorus;
type ToneReverb = import('tone').Reverb;
type ToneLimiter = import('tone').Limiter;

// 共通音声再生システム
let globalSynth: PolySynth<Synth<SynthOptions>> | null = null;
let audioSystemInitialized = false;
let userInteracted = false;
let pianoFilter: ToneFilter | null = null;
let pianoChorus: ToneChorus | null = null;
let pianoReverb: ToneReverb | null = null;
let pianoLimiter: ToneLimiter | null = null;

// アクティブなノートを追跡するSet
const activeNotes = new Set<string>();
// サスティン状態（フォールバック用）
let sustainOn = false;
const sustainedNotes = new Set<string>();

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
    
    const handleUserInteraction = () => {
      userInteracted = true;
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      resolve();
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
  });
};

/**
 * 音声システムの初期化（遅延最適化設定付き）
 */
export const initializeAudioSystem = async (opts?: { light?: boolean }): Promise<void> => {
  const lightMode = opts?.light ?? false;

  if (audioSystemInitialized && globalSynth) {
    if (typeof window !== 'undefined' && window.Tone) {
      configurePianoSound(window.Tone as ToneModule, lightMode);
    }
    return;
  }

  await detectUserInteraction();

  if (typeof window === 'undefined') {
    throw new Error('Tone.js can only run in a browser environment');
  }

  if (!window.Tone) {
    const Tone = await import('tone');
    window.Tone = Tone as ToneModule;
  }

  const Tone = window.Tone as ToneModule;

  try {
    await Tone.start();
  } catch (error) {
    console.error('❌ Failed to start Tone.js context:', error);
    throw error;
  }

  if (!globalSynth) {
    const voiceOptions = getPianoVoiceOptions(lightMode);
    globalSynth = new Tone.PolySynth(Tone.Synth, voiceOptions) as PolySynth<Synth<SynthOptions>>;
    globalSynth.volume.value = lightMode ? -8 : -4;
  }

  configurePianoSound(Tone, lightMode);

  audioSystemInitialized = true;
  console.log('✅ Lightweight synth audio system initialized');
};

/**
 * 既に軽量サンプラーで初期化済みでも、@tonejs/piano へアップグレードする
 */
export const upgradeAudioSystemToFull = async (): Promise<void> => {
  await initializeAudioSystem({ light: false });
};

/**
 * 共通音声再生: ノートオン
 */
export const playNote = async (note: number, velocity: number = 127): Promise<void> => {
  try {
    if (!audioSystemInitialized || !globalSynth) {
      await initializeAudioSystem({ light: velocity < 100 });
    }

    if (!globalSynth || !window.Tone) {
      return;
    }

    const synth = globalSynth;
    if (window.Tone.context.state !== 'running') {
      await window.Tone.context.resume();
    }
    
    const noteName = window.Tone.Frequency(note, "midi").toNote();
    const normalizedVelocity = Math.min(1, Math.max(0, velocity / 127));

    sustainedNotes.delete(noteName);

    if (activeNotes.has(noteName)) {
      synth.triggerRelease(noteName);
    }

    synth.triggerAttack(noteName, undefined, normalizedVelocity);
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
    if (!globalSynth || !window.Tone) {
      return;
    }

    const synth = globalSynth;
    const noteName = window.Tone.Frequency(note, "midi").toNote();
    
    // アクティブノートから削除
    activeNotes.delete(noteName);
    
    if (sustainOn) {
      sustainedNotes.add(noteName);
      return;
    }

    sustainedNotes.delete(noteName);
    synth.triggerRelease(noteName);
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

    if (globalSynth) {
      globalSynth.volume.value = volumeDb;
    }
  } catch (error) {
    console.error('❌ Failed to update global volume:', error);
  }
};

const getPianoVoiceOptions = (lightMode: boolean): Partial<SynthOptions> => ({
  oscillator: {
    type: lightMode ? 'triangle' : 'triangle8'
  },
  envelope: {
    attack: 0.003,
    decay: lightMode ? 0.14 : 0.26,
    sustain: lightMode ? 0.22 : 0.35,
    release: lightMode ? 1.4 : 2.8
  }
});

const configurePianoSound = (Tone: ToneModule, lightMode: boolean): void => {
  if (!globalSynth) {
    return;
  }

  if (!pianoFilter) {
    pianoFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 2600,
      rolloff: -12,
      Q: 1.2
    });
  }

  if (!pianoChorus) {
    pianoChorus = new Tone.Chorus({
      frequency: 1.6,
      delayTime: 2.4,
      depth: 0.35,
      spread: 70
    }).start();
  }

  if (!pianoReverb) {
    pianoReverb = new Tone.Reverb({
      decay: 2.6,
      wet: 0.2
    });
  }

  if (!pianoLimiter) {
    pianoLimiter = new Tone.Limiter(-1);
  }

  pianoFilter.set({
    frequency: lightMode ? 2200 : 2900,
    Q: lightMode ? 0.9 : 1.5
  });
  pianoChorus.set({
    depth: lightMode ? 0.18 : 0.35,
    wet: lightMode ? 0.08 : 0.18
  });
  pianoReverb.set({
    decay: lightMode ? 1.4 : 2.9,
    wet: lightMode ? 0.12 : 0.22,
    preDelay: 0.02
  });

  globalSynth.disconnect();
  pianoFilter.disconnect();
  pianoChorus.disconnect();
  pianoReverb.disconnect();
  pianoLimiter.disconnect();
  globalSynth.chain(pianoFilter, pianoChorus, pianoReverb, pianoLimiter, Tone.Destination);
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
    this.lightAudio = (options as any).lightAudio ?? false;

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
          const pedalDown = controllerValue >= 64;
          sustainOn = pedalDown;
        if (!pedalDown && globalSynth) {
          const synth = globalSynth;
          sustainedNotes.forEach((noteName) => {
            synth.triggerRelease(noteName);
          });
          sustainedNotes.clear();
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