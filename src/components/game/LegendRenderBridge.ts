import type { ActiveNote, GameScore } from '@/types';
import type { GameEngine, GameEngineDiff } from '@/utils/gameEngine';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private currentNotes: Map<string, ActiveNote> = new Map();
  private lastTime = 0;
  private lastScore: GameScore | null = null;

  attachEngine(engine: GameEngine | null): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.engine = engine;

    if (!engine) {
      this.currentNotes.clear();
      return;
    }

    this.unsubscribe = engine.addDiffListener((diff: GameEngineDiff) => {
      this.handleEngineDiff(diff);
    });

    this.primeFromEngine(engine);
  }

  attachRenderer(renderer: PIXINotesRendererInstance | null): void {
    this.renderer = renderer;

    if (!renderer) {
      return;
    }

    this.flush();
  }

  syncFromEngine(): void {
    if (!this.engine) return;
    this.primeFromEngine(this.engine);
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.renderer = null;
    this.engine = null;
    this.currentNotes.clear();
    this.lastScore = null;
  }

  private handleEngineDiff(diff: GameEngineDiff): void {
    this.lastTime = diff.currentTime;
    this.lastScore = diff.score;

    for (const note of diff.additions) {
      this.currentNotes.set(note.id, note);
    }

    for (const update of diff.updates) {
      const existing = this.currentNotes.get(update.id);
      if (!existing) continue;
      this.currentNotes.set(update.id, {
        ...existing,
        ...update
      });
    }

    for (const noteId of diff.removals) {
      this.currentNotes.delete(noteId);
    }

    if (this.renderer) {
      this.renderer.applyNoteDiff(diff);
    }
  }

  private primeFromEngine(engine: GameEngine): void {
    const snapshot = engine.getActiveNotesSnapshot();
    this.currentNotes.clear();
    snapshot.forEach((note) => {
      this.currentNotes.set(note.id, note);
    });
    if (snapshot.length > 0) {
      this.lastTime = snapshot[snapshot.length - 1].time;
    }
    this.flush();
  }

  private flush(): void {
    if (!this.renderer) {
      return;
    }
    const additions = Array.from(this.currentNotes.values());
    this.renderer.applyNoteDiff({
      currentTime: this.lastTime,
      additions,
      updates: [],
      removals: [],
      judgments: [],
      highlights: [],
      score: this.lastScore || {
        totalNotes: 0,
        goodCount: 0,
        missCount: 0,
        combo: 0,
        maxCombo: 0,
        accuracy: 0,
        score: 0,
        rank: 'D'
      }
    });
  }
}
