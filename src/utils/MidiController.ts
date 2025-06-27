/**
 * MIDI コントローラー
 * Web MIDI API を使用してMIDI入力を処理し、ゲームエンジンと連携
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

export class MIDIController {
  private readonly onNoteOn: (note: number, velocity?: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private midiAccess: MIDIAccess | null = null;
  private readonly activeNotes = new Set<number>();
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private currentDeviceId: string | null = null;
  private readonly sampler: ToneSampler;
  private isInitialized = false;
  
  // PIXI.js レンダラーのキーハイライト用コールバック
  private onKeyHighlight?: (note: number, active: boolean) => void;
  
  // MIDI入力の有効/無効状態
  private isEnabled = false;

  constructor(options: MidiControllerOptions) {
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;
    this.onConnectionChange = options.onConnectionChange || null;

    // Tone.jsの存在確認
    if (typeof window === 'undefined' || !window.Tone) {
      throw new Error('Tone.js is not available');
    }

    // Salamander サンプラーの初期化
    this.sampler = new window.Tone.Sampler({
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

    console.log('🎹 MIDI Controller initialized');
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🎹 MIDI Controller already initialized');
      return;
    }

    try {
      console.log('🎹 MIDI Controller initialization starting...');
      
      // MIDI API の存在確認
      if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API is not supported');
      }

      console.log('🎹 Requesting MIDI access...');
      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('✅ MIDI access granted:', this.midiAccess);

      // 初期デバイス一覧を表示
      const initialDevices = this.getDeviceList();
      console.log(`🎹 Initial MIDI devices found: ${initialDevices.length}`, initialDevices);

      this.midiAccess!.onstatechange = (event): void => {
        console.log('🎹 MIDI state changed:', event);
        
        if (event.port) {
          const port = event.port;
          console.log('  - Port:', port);
          console.log('  - Type:', port.type);
          console.log('  - State:', port.state);
          console.log('  - Name:', port.name);
          
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
      console.log('✅ MIDI Controller initialized successfully');

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
    
    console.log(`🎹 MIDI Message received:`, {
      raw: Array.from(message.data),
      status: `0x${status.toString(16)}`,
      note,
      velocity
    });
    
    // ノートオン
    if ((status & 0xf0) === 0x90 && velocity > 0) {
      console.log(`🎵 Processing Note ON: ${note} velocity: ${velocity}`);
      this.handleNoteOn(note, velocity);
    }
    // ノートオフ
    else if ((status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)) {
      console.log(`🎵 Processing Note OFF: ${note}`);
      this.handleNoteOff(note);
    } else {
      console.log(`🎹 Other MIDI message: status=0x${status.toString(16)}, data1=${note}, data2=${velocity}`);
    }
  };

  private async handleNoteOn(note: number, velocity: number): Promise<void> {
    try {
      // ユーザージェスチャーで AudioContext を resume
      if (window.Tone.context.state !== "running") {
        await window.Tone.start();
      }
      
      const noteName = window.Tone.Frequency(note, "midi").toNote();
      const normalizedVelocity = velocity / 127; // 0〜1 に正規化

      // Sampler で演奏開始
      this.sampler.triggerAttack(noteName, undefined, normalizedVelocity);
      
      // アクティブノーツに追加
      this.activeNotes.add(note);
      
      // PIXI.js キーハイライト
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, true);
      }
      
      // ゲームエンジンに通知
      this.onNoteOn(note, velocity);
      
      console.log(`🎵 MIDI Note ON: ${note} (${noteName}) velocity: ${velocity}`);
    } catch (error) {
      console.error('❌ Failed to handle note on:', error);
    }
  }

  private handleNoteOff(note: number): void {
    try {
      const noteName = window.Tone.Frequency(note, "midi").toNote();

      // Sampler で演奏停止
      this.sampler.triggerRelease(noteName);
      
      // アクティブノーツから削除
      this.activeNotes.delete(note);
      
      // PIXI.js キーハイライト解除
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, false);
      }
      
      // ゲームエンジンに通知
      this.onNoteOff(note);
      
      console.log(`🎵 MIDI Note OFF: ${note} (${noteName})`);
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
      console.log('🎹 MIDI access not available, returning empty device list');
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
    
    console.log(`🎹 Available MIDI devices: ${devices.length}`, devices);
    return devices;
  }

  public connectDevice(deviceId: string): boolean {
    console.log(`🎹 Attempting to connect to device: ${deviceId}`);
    
    if (!this.midiAccess) {
      console.warn('⚠️ MIDI access not available');
      return false;
    }

    console.log('🎹 Available MIDI inputs:', Array.from(this.midiAccess.inputs.keys()));
    
    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      console.log(`🎹 Found MIDI input:`, {
        id: input.id,
        name: input.name,
        state: input.state,
        type: (input as any).type
      });
      
      // 既存の接続を切断
      if (this.currentDeviceId) {
        console.log(`🔌 Disconnecting previous device: ${this.currentDeviceId}`);
        this.disconnectDevice(this.currentDeviceId);
      }

      input.onmidimessage = this.handleMIDIMessage;
      this.currentDeviceId = deviceId;
      this.isEnabled = true; // デバイス接続時にMIDI入力を有効化
      
      console.log(`✅ Connected to MIDI device: ${input.name} (${deviceId})`);
      console.log(`🎹 MIDI message handler set:`, typeof input.onmidimessage);
      console.log(`🎹 MIDI input enabled: ${this.isEnabled}`);
      
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
      console.warn('⚠️ MIDI access not available');
      return;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = null;
      console.log(`🔌 Disconnected from MIDI device: ${input.name} (${deviceId})`);
    }
    
    if (this.currentDeviceId === deviceId) {
      this.currentDeviceId = null;
      this.isEnabled = false; // デバイス切断時にMIDI入力を無効化
      this.activeNotes.clear();
      this.notifyConnectionChange(false);
      
      console.log(`🎹 MIDI input disabled: ${this.isEnabled}`);
    }
  }

  public disconnect(): void {
    if (this.currentDeviceId) {
      this.disconnectDevice(this.currentDeviceId);
    }
    
    this.isEnabled = false; // 完全切断時にも無効化
    this.activeNotes.clear();
    this.notifyConnectionChange(false);
    
    console.log('🔌 MIDI controller disconnected');
    console.log(`🎹 MIDI input disabled: ${this.isEnabled}`);
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
    console.log(`🎹 MIDI input ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  public isInputEnabled(): boolean {
    return this.isEnabled;
  }

  public async destroy(): Promise<void> {
    this.disconnect();
    this.isInitialized = false;
    console.log('🔌 MIDI Controller destroyed');
  }

  /**
   * MIDI音源の音量を更新
   */
  public updateVolume(volume: number): void {
    if (this.sampler) {
      try {
        // 0-1 の範囲を -40dB から 0dB にマッピング
        const volumeDb = volume === 0 ? -Infinity : Math.log10(volume) * 20;
        (this.sampler as any).volume.value = volumeDb;
        console.log(`🎹 MIDI Controller volume updated: ${volume} (${volumeDb.toFixed(1)}dB)`);
      } catch (error) {
        console.error('❌ Failed to update MIDI controller volume:', error);
      }
    }
  }
}

export default MIDIController; 