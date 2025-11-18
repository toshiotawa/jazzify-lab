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
  private minFlushIntervalMs = 0;
  private lastFlushTimestamp = 0;
  private flushTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

  setFrameRateLimit(fps: number | null): void {
    this.minFlushIntervalMs = fps && fps > 0 ? 1000 / fps : 0;
    this.lastFlushTimestamp = 0;
    if (this.minFlushIntervalMs === 0 && this.flushTimeoutId) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }
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
    if (this.flushTimeoutId) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }
    this.renderer = null;
    this.engine = null;
    this.lastFrame = null;
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
    this.flush(true);
  }

  private flush(force: boolean = false): void {
    if (!this.renderer || !this.lastFrame) {
      return;
    }
    if (this.minFlushIntervalMs > 0 && !force) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = now - this.lastFlushTimestamp;
      if (elapsed < this.minFlushIntervalMs) {
        if (!this.flushTimeoutId) {
          const delay = Math.max(0, this.minFlushIntervalMs - elapsed);
          this.flushTimeoutId = setTimeout(() => {
            this.flushTimeoutId = null;
            this.flush(true);
          }, delay);
        }
        return;
      }
      this.lastFlushTimestamp = now;
    } else {
      this.lastFlushTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
    this.renderer.updateNotes(this.lastFrame.activeNotes, this.lastFrame.currentTime);
  }

}
