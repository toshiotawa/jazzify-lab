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
  // 🚀 パフォーマンス最適化: フレームスキップ制御
  private lastFlushTime = 0;
  private readonly minFlushInterval = 12; // ~83fps上限（エンジンよりやや高頻度）
  private pendingFlush = false;
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

    this.doFlush();
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
    // 🚀 保留中のフラッシュをキャンセル
    if (this.flushTimeoutId !== null) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }
    this.pendingFlush = false;
    this.renderer = null;
    this.engine = null;
    this.lastFrame = null;
  }

  private handleEngineUpdate(update: GameEngineUpdate): void {
    this.lastFrame = {
      activeNotes: update.activeNotes,
      currentTime: update.currentTime
    };
    this.scheduleFlush();
  }

  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getState();
    this.lastFrame = {
      activeNotes: snapshot.activeNotes,
      currentTime: snapshot.currentTime
    };
    // 初回は即時フラッシュ
    this.doFlush();
  }

  // 🚀 フレームスキップ付きフラッシュスケジューラー
  private scheduleFlush(): void {
    if (this.pendingFlush) {
      return; // 既にスケジュール済み
    }
    
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsed = now - this.lastFlushTime;
    
    if (elapsed >= this.minFlushInterval) {
      // 十分な時間が経過していれば即時フラッシュ
      this.doFlush();
    } else {
      // そうでなければ次のタイミングでフラッシュ
      this.pendingFlush = true;
      const delay = Math.max(1, this.minFlushInterval - elapsed);
      this.flushTimeoutId = setTimeout(() => {
        this.flushTimeoutId = null;
        this.pendingFlush = false;
        this.doFlush();
      }, delay);
    }
  }

  private doFlush(): void {
    if (!this.renderer || !this.lastFrame) {
      return;
    }
    this.lastFlushTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.renderer.updateNotes(this.lastFrame.activeNotes, this.lastFrame.currentTime);
  }

}
