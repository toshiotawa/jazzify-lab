import type { ActiveNote } from '@/types';
import type { GameEngine, GameEngineUpdate } from '@/utils/gameEngine';
import { legendPerf } from '@/utils/legendPerf';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';

interface BridgeFrame {
  activeNotes: ActiveNote[];
  currentTime: number;
  frameId: number;
}

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastFrame: BridgeFrame | null = null;
  private lastRenderedFrameId: number | null = null;

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
      this.lastRenderedFrameId = null;
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
    this.lastRenderedFrameId = null;
  }

  private handleEngineUpdate(update: GameEngineUpdate): void {
    this.lastFrame = {
      activeNotes: update.activeNotes,
      currentTime: update.currentTime,
      frameId: update.frameId
    };
    this.flush();
  }

  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getState();
    this.lastFrame = {
      activeNotes: snapshot.activeNotes,
      currentTime: snapshot.currentTime,
      frameId: snapshot.frameId
    };
    this.flush();
  }

  private flush(): void {
    if (!this.renderer || !this.lastFrame) {
      return;
    }
    const { activeNotes, currentTime, frameId } = this.lastFrame;
    if (this.lastRenderedFrameId === frameId) {
      return;
    }
    const renderer = this.renderer;
    legendPerf.measure('legend:rendererUpdate', () => {
      renderer.updateNotes(activeNotes, currentTime);
    });
    this.lastRenderedFrameId = frameId;
  }

}
