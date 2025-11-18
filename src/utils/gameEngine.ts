import type { GameScore, GameSettings, JudgmentResult, MusicalTiming, NoteData } from '@/types';
import {
  createSharedNoteBuffer,
  SharedNoteBufferReader,
  type SharedNoteViews
} from '@/workers/sharedNoteBuffer';
import type {
  ClockSyncPayload,
  GameLogicWorkerCommand,
  GameLogicWorkerEvent
} from '@/workers/gameLogicTypes';
import type { GameEngineUpdate, GameEngineState } from '@/workers/gameEngineCore';

const defaultScore: GameScore = {
  totalNotes: 0,
  goodCount: 0,
  missCount: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  score: 0,
  rank: 'D'
};

const defaultTiming: MusicalTiming = {
  currentTime: 0,
  audioTime: 0,
  latencyOffset: 0
};

const defaultState: GameEngineState = {
  currentTime: 0,
  activeNotes: [],
  score: { ...defaultScore },
  timing: { ...defaultTiming },
  abRepeat: { start: null, end: null, enabled: false }
};

type UpdateListener = (update: GameEngineUpdate) => void;

export class GameEngine {
  private worker: Worker;
  private readonly sharedViews: SharedNoteViews;
  private readonly reader: SharedNoteBufferReader;
  private readonly maxNotes: number;
  private settings: GameSettings;
  private notes: NoteData[] = [];
  private updateCallback: UpdateListener | null = null;
  private readonly listeners = new Set<UpdateListener>();
  private judgmentCallback: ((judgment: JudgmentResult) => void) | null = null;
  private readonly judgmentListeners = new Set<(judgment: JudgmentResult) => void>();
  private keyHighlightCallback: ((pitch: number, timestamp: number) => void) | null = null;
  private lastUpdate: GameEngineUpdate = {
    ...defaultState,
    currentTime: 0,
    timing: { ...defaultTiming },
    score: { ...defaultScore }
  };
  private ready = false;
  private readonly queue: GameLogicWorkerCommand[] = [];

  constructor(settings: GameSettings, options?: { maxNotes?: number }) {
    this.settings = { ...settings };
    this.maxNotes = options?.maxNotes ?? 512;
    this.sharedViews = createSharedNoteBuffer({ maxNotes: this.maxNotes });
    this.reader = new SharedNoteBufferReader(this.sharedViews);
    this.worker = new Worker(new URL('../workers/gameLogicWorker.ts', import.meta.url), {
      type: 'module'
    });
    this.worker.onmessage = (event: MessageEvent<GameLogicWorkerEvent>) => {
      this.handleWorkerEvent(event.data);
    };
    this.postMessage({
      type: 'INIT',
      settings: this.settings,
      notes: [],
      sharedBuffer: this.sharedViews.buffer,
      maxNotes: this.maxNotes,
      sharedBufferType: this.sharedViews.isShared ? 'shared' : 'array'
    });
  }

  private handleWorkerEvent(event: GameLogicWorkerEvent): void {
    switch (event.type) {
      case 'READY':
        this.ready = true;
        this.flushQueue();
        break;
      case 'UPDATE': {
        const frame: GameEngineUpdate = {
          currentTime: event.currentTime,
          activeNotes: [],
          timing: event.timing,
          score: event.score,
          abRepeatState: { start: null, end: null, enabled: false }
        };
        this.lastUpdate = frame;
        this.updateCallback?.(frame);
        this.listeners.forEach(listener => listener(frame));
        break;
      }
      case 'JUDGMENT':
        this.judgmentCallback?.(event.judgment);
        this.judgmentListeners.forEach(listener => listener(event.judgment));
        break;
      case 'KEY_HIGHLIGHT':
        this.keyHighlightCallback?.(event.payload.pitch, event.payload.timestamp);
        break;
      case 'ERROR':
        console.warn('[GameEngineWorker] Error:', event.message);
        break;
      default:
        break;
    }
  }

  private flushQueue(): void {
    while (this.ready && this.queue.length > 0) {
      const msg = this.queue.shift();
      if (msg) {
        this.worker.postMessage(msg);
      }
    }
  }

  private postMessage(message: GameLogicWorkerCommand): void {
    if (!this.ready && message.type !== 'INIT') {
      this.queue.push(message);
      return;
    }
    this.worker.postMessage(message);
  }

  setUpdateCallback(callback: UpdateListener): void {
    this.updateCallback = callback;
  }

  addUpdateListener(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setJudgmentCallback(callback: (judgment: JudgmentResult) => void): void {
    this.judgmentCallback = callback;
  }
  
  addJudgmentListener(listener: (judgment: JudgmentResult) => void): () => void {
    this.judgmentListeners.add(listener);
    return () => {
      this.judgmentListeners.delete(listener);
    };
  }

  setKeyHighlightCallback(callback: (pitch: number, timestamp: number) => void): void {
    this.keyHighlightCallback = callback;
  }

  loadSong(notes: NoteData[]): void {
    this.notes = notes;
    this.reader.setMetadata(notes);
    this.postMessage({ type: 'LOAD_SONG', notes });
  }

  start(clock: ClockSyncPayload): void {
    this.postMessage({ type: 'START', clock });
  }

  resume(clock: ClockSyncPayload): void {
    this.postMessage({ type: 'RESUME', clock });
  }

  pause(): void {
    this.postMessage({ type: 'PAUSE' });
  }

  stop(): void {
    this.postMessage({ type: 'STOP' });
  }

  seek(time: number, clock: ClockSyncPayload): void {
    this.postMessage({ type: 'SEEK', time, clock });
  }

  handleInput(note: number): void {
    this.postMessage({ type: 'HANDLE_INPUT', note });
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    this.postMessage({ type: 'UPDATE_SETTINGS', settings: this.settings });
  }

  getState(): GameEngineState {
    return {
      ...defaultState,
      currentTime: this.lastUpdate.currentTime,
      activeNotes: [],
      score: { ...this.lastUpdate.score },
      timing: { ...this.lastUpdate.timing },
      abRepeat: { start: null, end: null, enabled: false }
    };
  }

  getSharedNoteReader(): SharedNoteBufferReader {
    return this.reader;
  }

  destroy(): void {
    this.postMessage({ type: 'DESTROY' });
    this.worker.terminate();
  }
}