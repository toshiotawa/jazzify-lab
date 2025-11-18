import type { ActiveNote, NoteHit } from '@/types';
import type { GameEngine, GameEngineUpdate } from '@/utils/gameEngine';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';

interface BridgeFrame {
  activeNotes: ActiveNote[];
  currentTime: number;
}

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private hitUnsubscribe: (() => void) | null = null;
  private lastFrame: BridgeFrame | null = null;
  private pendingHits: NoteHit[] = [];

  attachEngine(engine: GameEngine | null): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.detachHitListener();

    this.engine = engine;

    if (!engine) {
      this.lastFrame = null;
      return;
    }

    this.unsubscribe = engine.addUpdateListener((update: GameEngineUpdate) => {
      this.handleEngineUpdate(update);
    });
    this.hitUnsubscribe = engine.addHitListener((hit) => {
      this.handleHitEvent(hit);
    });

    this.primeFromEngine(engine);
  }

  attachRenderer(renderer: PIXINotesRendererInstance | null): void {
    this.renderer = renderer;

    if (!renderer) {
      return;
    }

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
    this.renderer = null;
    this.engine = null;
    this.lastFrame = null;
    this.pendingHits = [];
    this.detachHitListener();
  }

  private handleEngineUpdate(update: GameEngineUpdate): void {
    this.lastFrame = {
      activeNotes: update.activeNotes,
      currentTime: update.currentTime
    };
    this.flush();
  }

  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getState();
    this.lastFrame = {
      activeNotes: snapshot.activeNotes,
      currentTime: snapshot.currentTime
    };
    this.flush();
  }

  private flush(): void {
    if (!this.renderer || !this.lastFrame) {
      return;
    }
    this.renderer.updateNotes(this.lastFrame.activeNotes, this.lastFrame.currentTime);
    this.flushPendingHits();
  }

  private handleHitEvent(hit: NoteHit): void {
    if (!this.renderer) {
      this.pendingHits.push(hit);
      return;
    }
    this.renderer.handleImmediateHit(hit.noteId, hit.inputNote);
  }

  private flushPendingHits(): void {
    if (!this.renderer || this.pendingHits.length === 0) {
      return;
    }
    for (const hit of this.pendingHits) {
      this.renderer.handleImmediateHit(hit.noteId, hit.inputNote);
    }
    this.pendingHits = [];
  }

  private detachHitListener(): void {
    if (this.hitUnsubscribe) {
      this.hitUnsubscribe();
      this.hitUnsubscribe = null;
    }
  }

}
