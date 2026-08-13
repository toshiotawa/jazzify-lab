/**
 * 共通音声システム + MIDI コントローラー
 * Web MIDI API + 共通音声再生ロジックで、MIDI/マウス/タッチ統合対応
 */

import type {
  MidiDevice,
  MidiInput,
  MidiAccess,
  MidiControllerOptions
} from '@/types';
import { isIOSWebView, requestWebPlaybackAudioSession } from '@/utils/iosbridge';
import { FantasySoundManager } from './FantasySoundManager';

let audioSystemInitialized = false;
let userInteracted = false;

const activeNotes = new Set<string>();

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

let audioInitPromise: Promise<void> | null = null;

/**
 * 音声システムの初期化（ユーザー操作検出のみ）
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
    await detectUserInteraction();
    requestWebPlaybackAudioSession();
    audioSystemInitialized = true;
  } catch (error) {
    audioInitPromise = null;
    throw error;
  }
};

/**
 * 共通音声再生: ノートオン
 */
export const playNote = async (note: number, velocity: number = 127): Promise<void> => {
  try {
    const normalizedVelocity = velocity / 127;
    if (!FantasySoundManager.isGMReady()) {
      return;
    }
    FantasySoundManager.playGMNote(note, normalizedVelocity);
    activeNotes.add(note.toString());
  } catch {
    // ignore
  }
};

/**
 * 共通音声再生: ノートオフ
 */
export const stopNote = (note: number): void => {
  try {
    if (!FantasySoundManager.isGMReady()) {
      return;
    }
    FantasySoundManager.stopGMNote(note);
    activeNotes.delete(note.toString());
  } catch {
    // ignore
  }
};

/**
 * 共通音声システムの音量更新
 */
let cachedSharedMidiAccess: MIDIAccess | null = null;
let sharedMidiAccessPromise: Promise<MIDIAccess> | null = null;

/** Web MIDI API の共有インスタンス（MIDIController / useMidiDevices で共用） */
export const getSharedMidiAccess = (): Promise<MIDIAccess> => {
  if (cachedSharedMidiAccess) {
    return Promise.resolve(cachedSharedMidiAccess);
  }
  if (sharedMidiAccessPromise) {
    return sharedMidiAccessPromise;
  }
  if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
    return Promise.reject(new Error('Web MIDI API is not supported'));
  }
  sharedMidiAccessPromise = navigator.requestMIDIAccess({ sysex: false }).then((access) => {
    cachedSharedMidiAccess = access;
    return access;
  });
  return sharedMidiAccessPromise;
};

export const updateGlobalVolume = (volume: number): void => {
  try {
    FantasySoundManager.setGMPianoVolume(volume);
  } catch {
    // ignore
  }
};

export class MIDIController {
  private readonly onNoteOn: (note: number, velocity?: number, domTimeStampMs?: number) => void;
  private readonly onNoteOff: (note: number) => void;
  private midiAccess: MIDIAccess | null = null;
  private readonly activeNotes = new Set<number>();
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private currentDeviceId: string | null = null;
  private isInitialized = false;
  
  private onKeyHighlight?: (note: number, active: boolean) => void;
  private isEnabled = true;
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
    if (!isIOSWebView()) return;

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

  private midiSupported = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await initializeAudioSystem();

      if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
        this.midiSupported = false;
        this.isInitialized = true;
        return;
      }

      this.midiAccess = await getSharedMidiAccess();
      this.midiSupported = true;

      this.midiAccess.onstatechange = (event): void => {
        if (event.port) {
          const port = event.port;
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

    } catch {
      this.midiSupported = false;
      this.isInitialized = true;
      this.notifyConnectionChange(false);
    }
  }

  public isMidiSupported(): boolean {
    return this.midiSupported;
  }

  private handleMIDIMessage = (message: MIDIMessageEvent): void => {
    if (!this.isEnabled) {
      return;
    }
    
    const data = message.data;
    if (!data) return;
    const [status, data1, data2] = Array.from(data) as [number, number, number];
    const command = status & 0xf0;

    if (command === 0x90 && data2 > 0) {
      this.handleNoteOn(data1, data2, message.timeStamp);
    } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      this.handleNoteOff(data1);
    } else if (command === 0xB0) {
      const controllerNumber = data1;
      const controllerValue = data2;
      if (controllerNumber === 64) {
        try {
          FantasySoundManager.setSustainPedal(controllerValue >= 64);
        } catch {
          // ignore
        }
      }
    }
  };

  private handleNoteOn(note: number, velocity: number, domTimeStampMs?: number): void {
    try {
      this.activeNotes.add(note);
      
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, true);
      }
      
      this.onNoteOn(note, velocity, domTimeStampMs);

      if (this.playMidiSound) {
        void playNote(note, velocity).catch(() => {});
      }
      
    } catch {
      // ignore
    }
  }

  private handleNoteOff(note: number): void {
    try {
      stopNote(note);
      this.activeNotes.delete(note);
      
      if (this.onKeyHighlight) {
        this.onKeyHighlight(note, false);
      }
      
      this.onNoteOff(note);
      
    } catch {
      // ignore
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
    this.midiAccess.inputs.forEach((input: MIDIInput) => {
      if (/\bSession \d+$/i.test(input.name ?? '')) return;
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
    await this.initialize();

    if (!this.midiAccess) {
      return false;
    }
    
    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      if (this.currentDeviceId) {
        this.disconnectDevice(this.currentDeviceId);
      }

      input.onmidimessage = this.handleMIDIMessage;
      this.currentDeviceId = deviceId;
      this.isEnabled = true;
      
      this.notifyConnectionChange(true);
      return true;
    }
    return false;
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
      this.isEnabled = false;
      this.activeNotes.clear();
      this.notifyConnectionChange(false);
    }
  }

  public disconnect(): void {
    if (this.currentDeviceId) {
      this.disconnectDevice(this.currentDeviceId);
    }
    
    this.isEnabled = false;
    this.activeNotes.clear();
    this.notifyConnectionChange(false);
  }

  public isConnected(): boolean {
    return this.currentDeviceId !== null;
  }

  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  public async checkAndRestoreConnection(): Promise<boolean> {
    if (!this.currentDeviceId) {
      return false;
    }

    if (!this.midiAccess) {
      return false;
    }

    const input = this.midiAccess.inputs.get(this.currentDeviceId);
    if (!input || input.state !== 'connected') {
      return this.connectDevice(this.currentDeviceId);
    }

    if (!input.onmidimessage) {
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
    return new Set(this.activeNotes);
  }

  public setConnectionChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }
  
  public setKeyHighlightCallback(callback: (note: number, active: boolean) => void): void {
    this.onKeyHighlight = callback;
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
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.nativeMIDICleanup?.();
    this.nativeMIDICleanup = null;
    this.isInitialized = false;
  }

  public updateVolume(volume: number): void {
    updateGlobalVolume(volume);
  }
}

export default MIDIController;
