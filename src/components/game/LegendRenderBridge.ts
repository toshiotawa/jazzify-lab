import type { ActiveNote } from '@/types';
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
  private lastFrame: BridgeFrame | null = null;
  private lastNoteHash: string | null = null;

  attachEngine(engine: GameEngine | null): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.engine = engine;

    if (!engine) {
      this.lastFrame = null;
      return;
    }

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
  }

  private handleEngineUpdate(update: GameEngineUpdate): void {
    const nextHash = this.computeNoteHash(update.activeNotes);
    if (this.lastNoteHash && this.lastNoteHash === nextHash) {
      return;
    }
    this.lastNoteHash = nextHash;
    this.lastFrame = {
      activeNotes: update.activeNotes,
      currentTime: update.currentTime
    };
    this.flush();
  }

  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getState();
    this.lastNoteHash = this.computeNoteHash(snapshot.activeNotes);
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
  }

  private computeNoteHash(notes: ActiveNote[]): string {
    let hash = '';
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      hash += `${note.id}:${note.state};`;
    }
    return hash;
  }
}
