import type { GameScore, GameSettings, JudgmentResult, NoteData } from '@/types';
import type { LegendGuideHighlightPayload, LegendWorkerResponse } from './protocol';
import { type LegendSharedMemoryViews, createLegendSharedMemory, writeClockValue, ClockIndex } from './sharedMemory';

export interface LegendRuntimeCallbacks {
  onState: (state: { currentTime: number; score: GameScore; combo: number }) => void;
  onJudgment: (judgment: JudgmentResult) => void;
  onGuideHighlight: (payload: LegendGuideHighlightPayload) => void;
}

export interface LegendRuntimeOptions extends LegendRuntimeCallbacks {
  settings: GameSettings;
  maxSharedNotes?: number;
}

export class LegendRuntime {
  private worker: Worker;
  private readonly sharedViews: LegendSharedMemoryViews;
  private readonly callbacks: LegendRuntimeCallbacks;
  private audioContext: AudioContext | null = null;
  private clockInterval: number | null = null;

  constructor(options: LegendRuntimeOptions) {
    this.callbacks = {
      onState: options.onState,
      onJudgment: options.onJudgment,
      onGuideHighlight: options.onGuideHighlight,
    };
    const { buffers, views } = createLegendSharedMemory(options.maxSharedNotes);
    this.sharedViews = views;
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = this.handleWorkerMessage;
    this.worker.postMessage({
      type: 'INIT',
      payload: {
        settings: options.settings,
        shared: buffers,
      },
    });
  }

  getSharedViews(): LegendSharedMemoryViews {
    return this.sharedViews;
  }

  bindAudioContext(audioContext: AudioContext): void {
    if (this.audioContext === audioContext && this.clockInterval !== null) {
      return;
    }
    this.audioContext = audioContext;
    this.startClockBridge();
  }

  loadSong(notes: NoteData[]): void {
    this.worker.postMessage({
      type: 'LOAD_SONG',
      payload: { notes },
    });
  }

  updateSettings(settings: GameSettings): void {
    this.worker.postMessage({ type: 'SET_SETTINGS', payload: { settings } });
  }

  start(startAt: number, audioTime?: number): void {
    this.worker.postMessage({
      type: 'START',
      payload: {
        audioTime: this.resolveAudioTime(audioTime),
        startAt,
      },
    });
  }

  pause(audioTime?: number): void {
    this.worker.postMessage({
      type: 'PAUSE',
      payload: { audioTime: this.resolveAudioTime(audioTime) },
    });
  }

  stop(): void {
    this.worker.postMessage({ type: 'STOP' });
  }

  seek(time: number, audioTime?: number): void {
    this.worker.postMessage({
      type: 'SEEK',
      payload: { time, audioTime: this.resolveAudioTime(audioTime) },
    });
  }

  noteOn(note: number, audioTime?: number, velocity?: number): void {
    this.worker.postMessage({
      type: 'NOTE_ON',
      payload: { note, audioTime: this.resolveAudioTime(audioTime), velocity },
    });
  }

  requestStateSnapshot(): void {
    this.worker.postMessage({ type: 'REQUEST_STATE_SNAPSHOT' });
  }

  dispose(): void {
    if (this.clockInterval !== null) {
      window.clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    this.worker.terminate();
  }

  private startClockBridge(): void {
    if (!this.audioContext) return;
    if (this.clockInterval !== null) return;
    const pump = () => {
      if (!this.audioContext) {
        return;
      }
      const seconds = this.audioContext.currentTime;
      writeClockValue(this.sharedViews.clock, ClockIndex.AudioTimeNs, seconds);
    };
    pump();
    this.clockInterval = window.setInterval(pump, 4);
  }

  private handleWorkerMessage = (event: MessageEvent<LegendWorkerResponse>): void => {
    const message = event.data;
    switch (message.type) {
      case 'STATE':
        this.callbacks.onState(message.payload);
        return;
      case 'JUDGMENT':
        this.callbacks.onJudgment(message.payload);
        return;
      case 'GUIDE_HIGHLIGHT':
        this.callbacks.onGuideHighlight(message.payload);
        return;
      case 'READY':
      case 'ERROR':
      default:
        return;
    }
  };

  private resolveAudioTime(explicit?: number): number {
    if (typeof explicit === 'number') {
      return explicit;
    }
    if (this.audioContext) {
      return this.audioContext.currentTime;
    }
    return performance.now() / 1000;
  }
}
