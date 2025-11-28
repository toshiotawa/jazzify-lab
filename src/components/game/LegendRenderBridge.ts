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
  // 🚀 GC最適化: フレームオブジェクトを再利用
  private lastFrame: BridgeFrame = { activeNotes: [], currentTime: 0 };
  private hasFrame = false;

  attachEngine(engine: GameEngine | null): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.engine = engine;

    if (!engine) {
      this.hasFrame = false;
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

    if (!this.hasFrame && this.engine) {
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
    this.hasFrame = false;
  }

  // 🚀 GC最適化: オブジェクト再利用
  private handleEngineUpdate(update: GameEngineUpdate): void {
    this.lastFrame.activeNotes = update.activeNotes;
    this.lastFrame.currentTime = update.currentTime;
    this.hasFrame = true;
    this.flush();
  }

  // 🚀 GC最適化: オブジェクト再利用
  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getState();
    this.lastFrame.activeNotes = snapshot.activeNotes;
    this.lastFrame.currentTime = snapshot.currentTime;
    this.hasFrame = true;
    this.flush();
  }

  private flush(): void {
    if (!this.renderer || !this.hasFrame) {
      return;
    }
    this.renderer.updateNotes(this.lastFrame.activeNotes, this.lastFrame.currentTime);
  }

}
