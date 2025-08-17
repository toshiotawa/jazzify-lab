// MidiController.ts - TypeScript版MIDIコントローラー

import { platform } from './src/platform';

// 型定義
export interface MidiDevice {
  id: string;
  name: string;
}

export interface MidiMessage {
  data: Uint8Array;
}

export interface MidiInput {
  id: string;
  name?: string;
  state: string;
  type: string;
  onmidimessage: ((event: { data: Uint8Array }) => void) | null;
}

export interface MidiAccess {
  inputs: Map<string, MidiInput>;
  onstatechange: ((event: { port: MidiInput }) => void) | null;
}

export interface ToneSampler {
  triggerAttack(note: string, time?: number, velocity?: number): void;
  triggerRelease(note: string, time?: number): void;
  toDestination(): ToneSampler;
}

export interface ToneFrequency {
  toNote(): string;
}

export interface ToneStatic {
  Sampler: new (options: {
    urls: Record<string, string>;
    baseUrl: string;
  }) => ToneSampler;
  Frequency: (frequency: number, unit: string) => ToneFrequency;
  context: {
    state: string;
  };
  start(): Promise<void>;
}

export interface MidiControllerOptions {
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface GameInstance {
  lastSeekTime: number;
  seekCooldownTime: number;
  isJustAfterSeek: boolean;
  isInLoop: boolean;
  isSkipping: boolean;
}

// Tone.jsのグローバル宣言
declare global {
  interface Window {
    Tone: ToneStatic;
  }
  
  interface Navigator {
    requestMIDIAccess(): Promise<MidiAccess>;
  }
}

export class MIDIController {
  private readonly onNoteOn: (note: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private midiAccess: MidiAccess | null = null;
  private readonly activeNotes = new Set<number>();
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private currentDeviceId: string | null = null;
  private readonly errorDisplays = new Map<string, Element>();
  private readonly sampler: ToneSampler;

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

    // 初期化を非同期で実行
    this.initialize().catch((error) => {
      console.error('Failed to initialize MIDI controller:', error);
    });
  }

  private async initialize(): Promise<void> {
    try {
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

      this.midiAccess.onstatechange = (event): void => {
        console.log('MIDI state changed:', event);
        
        if (event.port.type === 'input' && 
            event.port.id === this.currentDeviceId && 
            event.port.state === 'disconnected') {
          this.disconnectDevice(event.port.id);
        }
        
        this.updateDeviceList();
      };

      this.updateDeviceList();
      this.setupMIDIControls();

    } catch (error) {
      console.error('MIDI Error:', error);
      this.notifyConnectionChange(false);
      this.showError('Failed to initialize MIDI');
      throw error;
    }
  }

  private setupMIDIControls(): void {
    const controls = [
      {
        select: platform.getElementById('settings-midi-devices'),
        error: platform.querySelector('#settings-modal .midi-error')
      }
    ];

    controls.forEach(({ select, error }) => {
      if (!select) return;

      // プラットフォーム要素の安全な保存
      if (error && error.nativeElement) {
        this.errorDisplays.set(select.id || 'unknown', error.nativeElement as Element);
      }

      platform.addEventListener(select, 'change', (event) => {
        const target = event.target as HTMLSelectElement;
        const selectedId = target.value;
        
        if (selectedId) {
          if (this.currentDeviceId) {
            this.disconnectDevice(this.currentDeviceId);
          }
          this.connectDevice(selectedId);
        } else {
          if (this.currentDeviceId) {
            this.disconnectDevice(this.currentDeviceId);
          }
        }
      });
    });
  }

  private showError(message: string, selectId?: string): void {
    if (selectId) {
      const errorDisplay = this.errorDisplays.get(selectId);
      if (errorDisplay) {
        errorDisplay.textContent = message;
        (errorDisplay as HTMLElement).style.display = 'block';
      }
    } else {
      this.errorDisplays.forEach((display) => {
        if (display) {
          display.textContent = message;
          (display as HTMLElement).style.display = 'block';
        }
      });
    }
  }

  private hideError(selectId?: string): void {
    if (selectId) {
      const errorDisplay = this.errorDisplays.get(selectId);
      if (errorDisplay) {
        (errorDisplay as HTMLElement).style.display = 'none';
      }
    } else {
      this.errorDisplays.forEach((display) => {
        if (display) {
          (display as HTMLElement).style.display = 'none';
        }
      });
    }
  }

  private updateDeviceList(): void {
    const deviceSelects = platform.querySelectorAll('.midi-devices');
    
    deviceSelects.forEach((deviceSelect) => {
      // プラットフォーム要素の安全な操作
      const nativeSelect = deviceSelect.nativeElement as HTMLSelectElement;
      if (!nativeSelect) return;

      const currentSelection = nativeSelect.value;
      nativeSelect.innerHTML = '<option value="">No MIDI device connected</option>';

      this.getDeviceList().forEach((device) => {
        const option = platform.createElement('option');
        const nativeOption = option.nativeElement as HTMLOptionElement;
        if (nativeOption) {
          nativeOption.value = device.id;
          nativeOption.textContent = device.name;
          nativeOption.selected = device.id === this.currentDeviceId;
          nativeSelect.appendChild(nativeOption);
        }
      });

      if (this.currentDeviceId && 
          !Array.from(nativeSelect.options).some((opt) => opt.value === this.currentDeviceId)) {
        nativeSelect.value = '';
        this.currentDeviceId = null;
        this.notifyConnectionChange(false);
      }
    });
  }

  public getDeviceList(): MidiDevice[] {
    if (!this.midiAccess) return [];
    
    const devices: MidiDevice[] = [];
    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || `Unknown Device (${input.id})`
      });
    });
    return devices;
  }

  private handleMIDIMessage = (message: { data: Uint8Array }): void => {
    // シーク・ループ時はMIDI処理を軽量化
    if (this.isSeekingOrLooping()) {
      return;
    }
    
    const [status, note, velocity] = Array.from(message.data);
    
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
      // ユーザージェスチャーで AudioContext を resume
      if (window.Tone.context.state !== "running") {
        await window.Tone.start();
      }
      
      const noteName = window.Tone.Frequency(note, "midi").toNote();
      const normalizedVelocity = velocity / 127; // 0〜1 に正規化

      // Sampler で演奏開始
      this.sampler.triggerAttack(noteName, undefined, normalizedVelocity);
      this.onNoteOn(note);
    } catch (error) {
      console.error('Failed to handle note on:', error);
    }
  }

  private handleNoteOff(note: number): void {
    try {
      const noteName = window.Tone.Frequency(note, "midi").toNote();

      // Sampler で演奏停止
      this.sampler.triggerRelease(noteName);
      this.onNoteOff(note);
    } catch (error) {
      console.error('Failed to handle note off:', error);
    }
  }
  
  // シーク・ループ状態をチェック
  private isSeekingOrLooping(): boolean {
    const gameInstance = platform.getGlobalProperty('gameInstance') as GameInstance | undefined;
    
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

  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange && typeof this.onConnectionChange === 'function') {
      this.onConnectionChange(connected);
    }
  }

  public connectDevice(deviceId: string): void {
    if (!this.midiAccess) {
      console.warn('MIDI access not available');
      return;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = this.handleMIDIMessage;
      this.currentDeviceId = deviceId;
      console.log(`Connected to MIDI device: ${input.name}`);
      this.notifyConnectionChange(true);
      this.hideError();
      this.updateDeviceList();
    } else {
      console.error(`MIDI device not found: ${deviceId}`);
      this.showError(`Device not found: ${deviceId}`);
    }
  }

  public disconnectDevice(deviceId: string): void {
    if (!this.midiAccess) {
      console.warn('MIDI access not available');
      return;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      input.onmidimessage = null;
      this.currentDeviceId = null;
      console.log(`Disconnected from MIDI device: ${input.name}`);
      this.notifyConnectionChange(false);
      this.updateDeviceList();
    }
  }

  public disconnect(): void {
    if (this.currentDeviceId) {
      this.disconnectDevice(this.currentDeviceId);
    }
    
    this.activeNotes.clear();
    this.notifyConnectionChange(false);
    
    console.log('MIDI controller disconnected');
  }

  // 公開プロパティ・メソッド
  public isConnected(): boolean {
    return this.currentDeviceId !== null;
  }

  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  public getActiveNotes(): Set<number> {
    return new Set(this.activeNotes); // 不変性のためコピーを返す
  }

  public setConnectionChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }
}

export default MIDIController; 