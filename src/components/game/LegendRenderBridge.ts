import type { ActiveNote } from '@/types';
import type { GameEngine } from '@/utils/gameEngine';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';
import type { SharedNoteBufferReader } from '@/workers/sharedNoteBuffer';

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private reader: SharedNoteBufferReader | null = null;

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

    this.reader = engine.getSharedNoteReader();
    this.unsubscribe = engine.addUpdateListener(() => {
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
    if (!this.renderer || !this.reader) {
      return;
    }
    this.renderer.updateFromSharedBuffer(this.reader);
  }

}
