import type { ActiveNote } from '@/types';
import type { GameEngine } from '@/utils/gameEngine';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';
import type { SharedNoteBufferReader } from '@/workers/sharedNoteBuffer';
import type { ActiveNote } from '@/types';

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private reader: SharedNoteBufferReader | null = null;
  private lastActiveNotes: ActiveNote[] = [];
  private lastCurrentTime = 0;

  attachEngine(engine: GameEngine | null): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.engine = engine;

    if (!engine) {
      this.reader = null;
      return;
    }

    try {
      this.reader = engine.getSharedNoteReader();
    } catch {
      this.reader = null;
    }
    this.unsubscribe = engine.addUpdateListener((update) => {
      this.lastActiveNotes = update.activeNotes ?? [];
      this.lastCurrentTime = update.currentTime;
      this.flush();
    });
    this.flush();
  }

  attachRenderer(renderer: PIXINotesRendererInstance | null): void {
    this.renderer = renderer;

    if (!renderer) {
      return;
    }

    this.flush();
  }

  setNoteReader(reader: SharedNoteBufferReader | null): void {
    this.reader = reader;
    this.flush();
  }
  
  syncFromEngine(): void {
    this.flush();
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.renderer = null;
    this.engine = null;
    this.reader = null;
  }

  private flush(): void {
    if (!this.renderer) {
      return;
    }
    if (this.reader) {
      this.renderer.updateFromSharedBuffer(this.reader);
      return;
    }
    this.renderer.updateNotes(this.lastActiveNotes, this.lastCurrentTime);
  }

}
