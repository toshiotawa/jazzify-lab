/**
 * 共通音声システム + MIDI コントローラー
 * Web MIDI API + 共通音声再生ロジックで、MIDI/マウス/タッチ統合対応
 */

import type {
  MidiDevice,
  MidiMessage,
  MidiInput,
  MidiAccess,
  ToneSampler,
  ToneFrequency,
  ToneStatic,
  MidiControllerOptions
} from '@/types';

// 共通音声再生システム
let globalSampler: ToneSampler | null = null;
let audioSystemInitialized = false;

/**
 * 音声システムの初期化（遅延最適化設定付き）
 */
export const initializeAudioSystem = async (): Promise<void> => {
  if (audioSystemInitialized) {
    console.log('🎹 Audio system already initialized');
    return;
  }

  try {
    console.log('🎹 Initializing optimized audio system...');
    
    // Tone.jsの存在確認
    if (typeof window === 'undefined' || !window.Tone) {
      throw new Error('Tone.js is not available');
    }

    // 遅延最適化設定: "interactive" モード + lookAhead=0
    const optimizedContext = new window.Tone.Context({
      latencyHint: "interactive",   // Chrome/Edge なら20ms前後
      lookAhead: 0                  // Tone の内部スケジューリングをオフ
    });
    
    // Tone.jsのコンテキストを最適化済みに切り替え
    window.Tone.setContext(optimizedContext);
    
    console.log('✅ Tone.js context optimized for low latency');

    // Salamander サンプラーの初期化
    globalSampler = new window.Tone.Sampler({
      urls: {
        "A1": "A1.mp3",
        "C2": "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        "A2": "A2.mp3",
        "C3": "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        "A3": "A3.mp3",
        "C4": "C4.mp3"
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();

    // 立ち上がりを限界まで短く（型安全性確保）
    if (globalSampler && (globalSampler as any).envelope) {
      (globalSampler as any).envelope.attack = 0.001;
    }

    // 全サンプルのプリロード完了を待機
    await window.Tone.loaded();
    console.log('✅ All audio samples preloaded and decoded');

    audioSystemInitialized = true;
    console.log('✅ Optimized audio system initialized successfully');
    
  } catch (error) {
    console.error('❌ Audio system initialization failed:', error);
    throw error;
  }
};

/**
 * 共通音声再生: ノートオン
 */
export const playNote = async (note: number, velocity: number = 127): Promise<void> => {
  try {
    // 音声システム初期化チェック
    if (!audioSystemInitialized || !globalSampler) {
      await initializeAudioSystem();
    }

    // ユーザージェスチャーで AudioContext を resume
    if (window.Tone.context.state !== "running") {
      await window.Tone.start();
    }
    
    const noteName = window.Tone.Frequency(note, "midi").toNote();
    const normalizedVelocity = velocity / 127; // 0〜1 に正規化

    // Sampler で演奏開始（最適化済み）
    globalSampler!.triggerAttack(noteName, undefined, normalizedVelocity);
  } catch (error) {
    console.error('❌ Failed to play note:', error);
  }
};

/**
 * 共通音声再生: ノートオフ
 */
export const stopNote = (note: number): void => {
  try {
    if (!globalSampler) {
      console.warn('⚠️ Audio system not initialized');
      return;
    }

    const noteName = window.Tone.Frequency(note, "midi").toNote();
    globalSampler.triggerRelease(noteName);
  } catch (error) {
    console.error('❌ Failed to stop note:', error);
  }
};

/**
 * 共通音声システムの音量更新
 */
export const updateGlobalVolume = (volume: number): void => {
  if (globalSampler) {
    try {
      // 0-1 の範囲を -40dB から 0dB にマッピング
      const volumeDb = volume === 0 ? -Infinity : Math.log10(volume) * 20;
      (globalSampler as any).volume.value = volumeDb;
    } catch (error) {
      console.error('❌ Failed to update global volume:', error);
    }
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

  constructor(options: MidiControllerOptions) {
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange || null;

    console.log('🎹 MIDI Controller initialized (using global audio system)');
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🎹 MIDI Controller already initialized');
      return;
    }

    try {
      // 共通音声システムを初期化
      await initializeAudioSystem();
      
      // MIDI API の存在確認
      if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API is not supported');
      }

      this.midiAccess = await navigator.requestMIDIAccess();

      this.midiAccess!.onstatechange = (event): void => {
        if (event.port) {
          const port = event.port;
          if (port.type === 'input' && 
              port.id === this.currentDeviceId && 
              port.state === 'disconnected') {
            this.disconnectDevice(port.id);
          }
        }
        
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
    
    const [status, note, velocity] = Array.from(message.data) as [number, number, number];
    
    // ノートオン
    if ((status & 0xf0) === 0x90 && velocity > 0) {
      this.handleNoteOn(note, velocity);
    }
    // ノートオフ
    else if ((status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)) {
      this.handleNoteOff(note);
    }
  };

  private async handleNoteOn(note: number, velocity: number): Promise<void> {
    try {
      // 共通音声システムを使用
      await playNote(note, velocity);
      
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

  public connectDevice(deviceId: string): boolean {
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
}

export default MIDIController; 