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
import {
  GameEngine as GameEngineCore,
  type EngineClockConfig,
  type GameEngineUpdate,
  type GameEngineState
} from '@/workers/gameEngineCore';

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

const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
const supportsWorker = typeof Worker !== 'undefined';
const canUseWorker = supportsSharedArrayBuffer && supportsWorker;

export class GameEngine {
  private worker: Worker | null = null;
  private readonly sharedViews: SharedNoteViews | null;
  private readonly reader: SharedNoteBufferReader | null;
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

  private inlineEngine: GameEngineCore | null = null;
  private readonly mode: 'worker' | 'inline';

  constructor(settings: GameSettings, options?: { maxNotes?: number }) {
    this.settings = { ...settings };
    this.maxNotes = options?.maxNotes ?? 512;
    if (canUseWorker) {
      this.mode = 'worker';
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
    } else {
      this.mode = 'inline';
      this.sharedViews = null;
      this.reader = null;
      this.inlineEngine = new GameEngineCore({ ...settings });
      this.inlineEngine.setUpdateCallback((update) => {
        this.handleInlineUpdate(update);
      });
      this.inlineEngine.setJudgmentCallback((judgment) => {
        this.forwardJudgment(judgment);
      });
      this.inlineEngine.setKeyHighlightCallback((pitch, timestamp) => {
        this.keyHighlightCallback?.(pitch, timestamp);
      });
    }
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
          activeNotes: this.sharedViews?.isShared ? [] : event.activeNotes,
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
    if (this.mode !== 'worker' || !this.worker) {
      return;
    }
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
    if (this.mode === 'inline' && this.inlineEngine) {
      this.inlineEngine.setJudgmentCallback((judgment) => {
        this.forwardJudgment(judgment);
      });
    }
  }
  
  addJudgmentListener(listener: (judgment: JudgmentResult) => void): () => void {
    this.judgmentListeners.add(listener);
    return () => {
      this.judgmentListeners.delete(listener);
    };
  }

  setKeyHighlightCallback(callback: (pitch: number, timestamp: number) => void): void {
    this.keyHighlightCallback = callback;
    if (this.mode === 'inline' && this.inlineEngine) {
      this.inlineEngine.setKeyHighlightCallback(callback);
    }
  }

  loadSong(notes: NoteData[]): void {
    this.notes = notes;
    if (this.mode === 'worker') {
      this.reader?.setMetadata(notes);
      this.postMessage({ type: 'LOAD_SONG', notes });
    } else if (this.inlineEngine) {
      this.inlineEngine.loadSong(notes);
      this.handleInlineUpdate(this.inlineEngine.getState());
    }
  }

  start(clock: ClockSyncPayload): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'START', clock });
    } else {
      this.inlineEngine?.start(clock as EngineClockConfig);
    }
  }

  resume(clock: ClockSyncPayload): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'RESUME', clock });
    } else {
      this.inlineEngine?.resume(clock as EngineClockConfig);
    }
  }

  pause(): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'PAUSE' });
    } else {
      this.inlineEngine?.pause();
    }
  }

  stop(): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'STOP' });
    } else {
      this.inlineEngine?.stop();
    }
  }

  seek(time: number, clock: ClockSyncPayload): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'SEEK', time, clock });
    } else {
      this.inlineEngine?.seek(time, clock as EngineClockConfig);
      this.handleInlineUpdate(this.inlineEngine!.getState());
    }
  }

  handleInput(note: number): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'HANDLE_INPUT', note });
    } else {
      const hit = this.inlineEngine?.handleInput(note);
      if (hit && this.inlineEngine) {
        const judgment = this.inlineEngine.processHit(hit);
        this.forwardJudgment(judgment);
      }
    }
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    if (this.mode === 'worker') {
      this.postMessage({ type: 'UPDATE_SETTINGS', settings: this.settings });
    } else {
      this.inlineEngine?.updateSettings({ ...settings });
    }
  }

  getState(): GameEngineState {
    if (this.mode === 'worker') {
      return {
        ...defaultState,
        currentTime: this.lastUpdate.currentTime,
        activeNotes: this.sharedViews?.isShared ? [] : this.lastUpdate.activeNotes,
        score: { ...this.lastUpdate.score },
        timing: { ...this.lastUpdate.timing },
        abRepeat: { start: null, end: null, enabled: false }
      };
    }
    return this.inlineEngine ? this.inlineEngine.getState() : { ...defaultState };
  }

  getSharedNoteReader(): SharedNoteBufferReader | null {
    return this.reader;
  }

  destroy(): void {
    if (this.mode === 'worker') {
      this.postMessage({ type: 'DESTROY' });
      this.worker?.terminate();
    } else {
      this.inlineEngine?.destroy();
    }
  }
  
  private handleInlineUpdate(update: GameEngineUpdate): void {
    this.lastUpdate = update;
    this.updateCallback?.(update);
    this.listeners.forEach(listener => listener(update));
  }

  private forwardJudgment(judgment: JudgmentResult): void {
    this.judgmentCallback?.(judgment);
    this.judgmentListeners.forEach((listener) => listener(judgment));
  }
}