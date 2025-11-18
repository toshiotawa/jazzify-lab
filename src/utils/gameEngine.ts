import type {
  ActiveNote,
  GameSettings,
  JudgmentResult,
  NoteData
} from '@/types';
import type { GameEngineDiff, GameEngineUpdate } from '@/utils/gameEngineCore';

type UpdateListener = (data: GameEngineUpdate) => void;
type DiffListener = (diff: GameEngineDiff) => void;

interface WorkerFramePayload {
  currentTime: number;
  additions: ActiveNote[];
  updates: Array<{
    id: string;
    y?: number;
    previousY?: number;
    state?: ActiveNote['state'];
    pitch?: number;
    noteName?: string;
    crossingLogged?: boolean;
  }>;
  removals: string[];
  judgments: JudgmentResult[];
  highlights: Array<{ pitch: number; timestamp: number }>;
  score: GameEngineUpdate['score'];
}

interface PendingMessage {
  type: string;
  payload?: unknown;
}

export class GameEngine {
  private worker: Worker;
  private isReady = false;
  private pendingMessages: PendingMessage[] = [];
  private updateCallback?: UpdateListener;
  private updateListeners: Set<UpdateListener> = new Set();
  private diffListeners: Set<DiffListener> = new Set();
  private judgmentCallback?: (judgment: JudgmentResult) => void;
  private keyHighlightCallback?: (pitch: number, timestamp: number) => void;
  private isPlaying = false;
  private audioContext: AudioContext | null = null;
  private manualStartTime = 0;
  private startTime = 0;
  private pausedTime = 0;
  private playbackSpeed = 1;
  private latencyOffset = 0;
  private rafId: number | null = null;
  private currentSettings: GameSettings;
  private activeNotesMap: Map<string, ActiveNote> = new Map();

  constructor(settings: GameSettings) {
    this.currentSettings = { ...settings };
    this.playbackSpeed = settings.playbackSpeed ?? 1;
    this.worker = new Worker(new URL('../workers/gameEngineWorker.ts', import.meta.url), {
      type: 'module'
    });
    this.worker.onmessage = this.handleWorkerMessage;
    this.post({
      type: 'INIT',
      payload: { settings: this.currentSettings }
    });
  }

  loadSong(notes: NoteData[]): void {
    this.post({ type: 'LOAD_SONG', payload: { notes } });
  }

  updateSettings(settings: GameSettings): void {
    this.currentSettings = { ...settings };
    this.playbackSpeed = settings.playbackSpeed ?? 1;
    this.post({ type: 'UPDATE_SETTINGS', payload: { settings: this.currentSettings } });
  }

  start(audioContext?: AudioContext): void {
    if (audioContext) {
      this.audioContext = audioContext;
      this.latencyOffset = this.computeLatencyOffset(audioContext);
      this.startTime =
        audioContext.currentTime - this.pausedTime / this.playbackSpeed - this.latencyOffset;
    } else {
      this.manualStartTime = performance.now() / 1000 - this.pausedTime / this.playbackSpeed;
    }
    this.isPlaying = true;
    this.post({ type: 'START' });
    this.beginTickLoop();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.post({ type: 'PAUSE' });
    if (this.audioContext) {
      this.pausedTime =
        (this.audioContext.currentTime - this.startTime - this.latencyOffset) * this.playbackSpeed;
    } else {
      const now = performance.now() / 1000;
      this.pausedTime = (now - this.manualStartTime) * this.playbackSpeed;
    }
    this.stopTickLoop();
  }

  resume(): void {
    if (this.isPlaying) return;
    this.start(this.audioContext ?? undefined);
  }

  stop(): void {
    this.isPlaying = false;
    this.pausedTime = 0;
    this.post({ type: 'STOP' });
    this.stopTickLoop();
  }

  seek(time: number): void {
    const safeTime = Math.max(0, time);
    this.pausedTime = safeTime;
    if (this.audioContext) {
      this.startTime =
        this.audioContext.currentTime - safeTime / this.playbackSpeed - this.latencyOffset;
    } else {
      this.manualStartTime = performance.now() / 1000 - safeTime / this.playbackSpeed;
    }
    this.post({ type: 'SEEK', payload: { time: safeTime } });
    this.activeNotesMap.clear();
  }

  handleInput(note: number): void {
    this.post({ type: 'HANDLE_INPUT', payload: { note } });
  }

  addUpdateListener(listener: UpdateListener): () => void {
    this.updateListeners.add(listener);
    return () => this.updateListeners.delete(listener);
  }

  addDiffListener(listener: DiffListener): () => void {
    this.diffListeners.add(listener);
    return () => this.diffListeners.delete(listener);
  }

  setUpdateCallback(callback: UpdateListener): void {
    this.updateCallback = callback;
  }

  setJudgmentCallback(callback: (judgment: JudgmentResult) => void): void {
    this.judgmentCallback = callback;
  }

  setKeyHighlightCallback(callback: (pitch: number, timestamp: number) => void): void {
    this.keyHighlightCallback = callback;
  }

  destroy(): void {
    this.stopTickLoop();
    this.worker.terminate();
    this.activeNotesMap.clear();
    this.pendingMessages = [];
    this.updateListeners.clear();
    this.diffListeners.clear();
  }

  private post(message: PendingMessage): void {
    if (this.isReady) {
      this.worker.postMessage(message);
      return;
    }
    this.pendingMessages.push(message);
  }

  private flushPendingMessages(): void {
    this.pendingMessages.forEach((message) => this.worker.postMessage(message));
    this.pendingMessages = [];
  }

  private handleWorkerMessage = (event: MessageEvent<{ type: string; payload?: unknown }>): void => {
    const { type, payload } = event.data;
    switch (type) {
      case 'READY':
        this.isReady = true;
        this.flushPendingMessages();
        break;
      case 'FRAME_UPDATE':
        this.applyFrame(payload as WorkerFramePayload);
        break;
      default:
        break;
    }
  };

  private applyFrame(payload: WorkerFramePayload): void {
    for (const note of payload.additions) {
      this.activeNotesMap.set(note.id, note);
    }
    for (const update of payload.updates) {
      const existing = this.activeNotesMap.get(update.id);
      if (!existing) continue;
      this.activeNotesMap.set(update.id, {
        ...existing,
        ...update
      });
    }
    for (const noteId of payload.removals) {
      this.activeNotesMap.delete(noteId);
    }

    const activeNotes = Array.from(this.activeNotesMap.values());
    const update: GameEngineUpdate = {
      currentTime: payload.currentTime,
      activeNotes,
      timing: {
        currentTime: payload.currentTime,
        audioTime: payload.currentTime,
        latencyOffset: this.latencyOffset
      },
      score: payload.score,
      abRepeatState: {
        start: null,
        end: null,
        enabled: false
      },
      events: {
        judgments: payload.judgments,
        highlights: payload.highlights
      }
    };

    if (this.updateCallback) {
      this.updateCallback(update);
    }
    this.updateListeners.forEach((listener) => listener(update));

    const diff: GameEngineDiff = {
      currentTime: payload.currentTime,
      additions: payload.additions,
      updates: payload.updates.map((u) => ({ ...u })),
      removals: payload.removals,
      judgments: payload.judgments,
      highlights: payload.highlights,
      score: payload.score
    };
    this.diffListeners.forEach((listener) => listener(diff));

    payload.judgments.forEach((judgment) => {
      this.judgmentCallback?.(judgment);
    });

    payload.highlights.forEach((highlight) => {
      this.keyHighlightCallback?.(highlight.pitch, highlight.timestamp);
    });
  }

  private beginTickLoop(): void {
    if (this.rafId !== null) return;
    const tick = () => {
      if (!this.isPlaying) {
        this.rafId = null;
        return;
      }
      const currentTime = this.getTimelineTime();
      this.post({
        type: 'FRAME_TICK',
        payload: { currentTime }
      });
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopTickLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private getTimelineTime(): number {
    if (this.audioContext) {
      return (
        (this.audioContext.currentTime - this.startTime - this.latencyOffset) * this.playbackSpeed
      );
    }
    const now = performance.now() / 1000;
    return (now - this.manualStartTime) * this.playbackSpeed;
  }

  private computeLatencyOffset(audioContext: AudioContext): number {
    const baseLatency = audioContext.baseLatency || 0;
    const outputLatency = audioContext.outputLatency || 0;
    const manualCompensation =
      (this.currentSettings as { latencyAdjustment?: number }).latencyAdjustment ?? 0;
    return baseLatency + outputLatency + manualCompensation;
  }

  getActiveNotesSnapshot(): ActiveNote[] {
    return Array.from(this.activeNotesMap.values()).map((note) => ({ ...note }));
  }
}

export type { GameEngineDiff, GameEngineUpdate } from '@/utils/gameEngineCore';
