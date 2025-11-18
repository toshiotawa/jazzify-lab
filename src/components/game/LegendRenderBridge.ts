import type { ActiveNote } from '@/types';
import type { GameEngine, GameEngineUpdate } from '@/utils/gameEngine';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';

export interface NoteView {
  id: string;
  time: number;
  pitch: number;
  appearTime?: number;
  noteName?: string;
  state: ActiveNote['state'];
  hitTime?: number;
  timingError?: number;
  judged?: boolean;
  crossingLogged?: boolean;
}

export interface NotesDiff {
  added: NoteView[];
  updated: NoteView[];
  removed: string[];
  reset: boolean;
  currentTime: number;
}

interface BridgeFrame {
  activeNotes: ActiveNote[];
  currentTime: number;
  reset: boolean;
}

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastFrame: BridgeFrame | null = null;

  private readonly previousNotes = new Map<string, NoteView>();
  private readonly seenNoteIds = new Set<string>();
  private readonly snapshotPool: NoteView[] = [];
  private readonly addedBuffer: NoteView[] = [];
  private readonly updatedBuffer: NoteView[] = [];
  private readonly removedBuffer: string[] = [];
  private pendingReset = false;

  attachEngine(engine: GameEngine | null): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.engine = engine;

    if (!engine) {
      this.resetSnapshots();
      this.lastFrame = null;
      this.pendingReset = true;
      return;
    }

    this.pendingReset = true;
    this.unsubscribe = engine.addUpdateListener((update: GameEngineUpdate) => {
      this.handleEngineUpdate(update);
    });

    this.primeFromEngine(engine);
  }

  attachRenderer(renderer: PIXINotesRendererInstance | null): void {
    this.renderer = renderer;

    if (!renderer) {
      return;
    }

    this.pendingReset = true;

    if (!this.lastFrame && this.engine) {
      this.primeFromEngine(this.engine);
      return;
    }

    this.flush();
  }

  syncFromEngine(): void {
    if (this.engine) {
      this.primeFromEngine(this.engine);
    }
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.resetSnapshots();
    this.renderer = null;
    this.engine = null;
    this.lastFrame = null;
    this.pendingReset = true;
  }

  private handleEngineUpdate(update: GameEngineUpdate): void {
    this.lastFrame = {
      activeNotes: update.activeNotes,
      currentTime: update.currentTime,
      reset: false
    };
    this.flush();
  }

  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getState();
    this.lastFrame = {
      activeNotes: snapshot.activeNotes,
      currentTime: snapshot.currentTime,
      reset: true
    };
    this.flush();
  }

  private flush(): void {
    if (!this.lastFrame) {
      return;
    }

    const diff = this.buildNotesDiff(
      this.lastFrame.activeNotes,
      this.lastFrame.currentTime,
      this.pendingReset || this.lastFrame.reset
    );

    if (this.renderer) {
      this.renderer.applyNotesDiff(diff);
    }

    this.pendingReset = false;
    this.lastFrame.reset = false;

    this.addedBuffer.length = 0;
    this.updatedBuffer.length = 0;
    this.removedBuffer.length = 0;
  }

  private buildNotesDiff(activeNotes: ActiveNote[], currentTime: number, forceReset: boolean): NotesDiff {
    const added = this.addedBuffer;
    const updated = this.updatedBuffer;
    const removed = this.removedBuffer;

    added.length = 0;
    updated.length = 0;
    removed.length = 0;

    if (forceReset) {
      this.resetSnapshots();
    }

    this.seenNoteIds.clear();

    for (const note of activeNotes) {
      this.seenNoteIds.add(note.id);
      const snapshot = this.previousNotes.get(note.id);
      if (!snapshot) {
        const created = this.acquireSnapshot(note);
        this.previousNotes.set(note.id, created);
        added.push(created);
        continue;
      }

      if (this.hasNoteChanged(snapshot, note)) {
        this.copyIntoSnapshot(snapshot, note);
        updated.push(snapshot);
      }
    }

    if (!forceReset) {
      for (const [id, snapshot] of this.previousNotes) {
        if (!this.seenNoteIds.has(id)) {
          this.previousNotes.delete(id);
          this.releaseSnapshot(snapshot);
          removed.push(id);
        }
      }
    }

    this.seenNoteIds.clear();

    return {
      added,
      updated,
      removed,
      reset: forceReset,
      currentTime
    };
  }

  private hasNoteChanged(snapshot: NoteView, note: ActiveNote): boolean {
    return (
      snapshot.state !== note.state ||
      snapshot.pitch !== note.pitch ||
      snapshot.noteName !== note.noteName ||
      snapshot.appearTime !== note.appearTime ||
      snapshot.hitTime !== note.hitTime ||
      snapshot.timingError !== note.timingError ||
      snapshot.judged !== note.judged ||
      snapshot.crossingLogged !== note.crossingLogged
    );
  }

  private acquireSnapshot(note: ActiveNote): NoteView {
    const snapshot = this.snapshotPool.pop() ?? this.createEmptySnapshot();
    this.copyIntoSnapshot(snapshot, note);
    return snapshot;
  }

  private releaseSnapshot(snapshot: NoteView): void {
    this.snapshotPool.push(snapshot);
  }

  private copyIntoSnapshot(target: NoteView, source: ActiveNote): void {
    target.id = source.id;
    target.time = source.time;
    target.pitch = source.pitch;
    target.appearTime = source.appearTime;
    target.noteName = source.noteName;
    target.state = source.state;
    target.hitTime = source.hitTime;
    target.timingError = source.timingError;
    target.judged = source.judged;
    target.crossingLogged = source.crossingLogged;
  }

  private resetSnapshots(): void {
    for (const snapshot of this.previousNotes.values()) {
      this.releaseSnapshot(snapshot);
    }
    this.previousNotes.clear();
  }

  private createEmptySnapshot(): NoteView {
    return {
      id: '',
      time: 0,
      pitch: 0,
      state: 'waiting'
    };
  }
}
