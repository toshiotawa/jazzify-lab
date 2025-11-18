import type { GameScore, GameSettings, JudgmentResult, NoteData } from '@/types';
import { SharedNoteState } from './sharedMemory';
import type { LegendGuideHighlightPayload } from './protocol';

const DEFAULT_LOOKAHEAD = 5.0;
const DEFAULT_CLEANUP = 3.0;
const DEFAULT_MISSED_CLEANUP = 2.0;
const JUDGMENT_WINDOW_MS = 150;

interface InternalNote extends NoteData {
  numericId: number;
  appearTime: number;
  processed?: boolean;
}

interface ActiveNoteState {
  note: InternalNote;
  state: SharedNoteState;
  y?: number;
  previousY?: number;
  hitTime?: number;
  timingError?: number;
  judged?: boolean;
  crossingLogged?: boolean;
  displayTime: number;
}

export interface LegendFrameSnapshot {
  frameId: number;
  currentTime: number;
  activeNotes: ActiveNoteState[];
  score: GameScore;
  highlights: LegendGuideHighlightPayload[];
  judgments: JudgmentResult[];
}

const createDefaultScore = (): GameScore => ({
  totalNotes: 0,
  goodCount: 0,
  missCount: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  score: 0,
  rank: 'D',
});

export class LegendEngineCore {
  private settings: GameSettings;
  private notes: InternalNote[] = [];
  private activeNotes = new Map<number, ActiveNoteState>();
  private frameId = 0;
  private playbackSpeed = 1;
  private timingAdjustmentSec = 0;
  private nextNoteIndex = 0;
  private score: GameScore = createDefaultScore();
  private logicalTime = 0;
  private audioAnchorTime = 0;
  private pausedLogicalTime = 0;
  private isPlaying = false;
  private judgmentQueue: JudgmentResult[] = [];
  private highlightQueue: LegendGuideHighlightPayload[] = [];

  constructor(settings: GameSettings) {
    this.settings = { ...settings };
    this.recomputeDerivedSettings();
  }

  loadSong(notes: NoteData[]): void {
    this.notes = notes.map((note, index) => ({
      ...note,
      numericId: index,
      appearTime: 0,
      processed: false,
    }));
    this.score = {
      ...createDefaultScore(),
      totalNotes: this.notes.length,
    };
    this.activeNotes.clear();
    this.nextNoteIndex = 0;
    this.frameId = 0;
    this.logicalTime = 0;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    this.recomputeDerivedSettings();
  }

  start(audioTime: number, startAt: number): void {
    this.playbackSpeed = this.settings.playbackSpeed ?? 1;
    this.audioAnchorTime = audioTime - startAt / this.playbackSpeed;
    this.logicalTime = startAt;
    this.pausedLogicalTime = startAt;
    this.isPlaying = true;
  }

  pause(audioTime: number): void {
    this.logicalTime = this.computeLogicalTime(audioTime);
    this.pausedLogicalTime = this.logicalTime;
    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.logicalTime = 0;
    this.pausedLogicalTime = 0;
    this.activeNotes.clear();
    this.nextNoteIndex = 0;
    this.notes.forEach((note) => {
      note.processed = false;
      note.appearTime = 0;
    });
  }

  seek(time: number, audioTime: number): void {
    this.logicalTime = time;
    this.pausedLogicalTime = time;
    this.rewindTo(time);
    if (this.isPlaying) {
      this.audioAnchorTime = audioTime - time / this.playbackSpeed;
    }
  }

  sync(audioTime: number): LegendFrameSnapshot {
    if (this.isPlaying) {
      this.logicalTime = this.computeLogicalTime(audioTime);
    } else {
      this.logicalTime = this.pausedLogicalTime;
    }

    this.spawnVisibleNotes(this.logicalTime);
    this.updateActiveNotes(this.logicalTime);

    const snapshot: LegendFrameSnapshot = {
      frameId: ++this.frameId,
      currentTime: this.logicalTime,
      activeNotes: Array.from(this.activeNotes.values()),
      score: { ...this.score },
      highlights: this.flushHighlights(),
      judgments: this.flushJudgments(),
    };
    return snapshot;
  }

  noteOn(noteNumber: number, audioTime: number, velocity?: number): void {
    const logicalTime = this.computeLogicalTime(audioTime);
    const hit = this.findHitCandidate(noteNumber, logicalTime);
    if (!hit) {
      return;
    }

    const timingError = Math.abs(logicalTime - hit.note.time - this.timingAdjustmentSec) * 1000;
    const judgment: JudgmentResult = {
      type: 'good',
      timingError,
      noteId: hit.note.id,
      timestamp: logicalTime,
    };
    this.applyJudgment(hit, judgment);
  }

  private recomputeDerivedSettings(): void {
    this.playbackSpeed = this.settings.playbackSpeed ?? 1;
    this.timingAdjustmentSec = (this.settings.timingAdjustment ?? 0) / 1000;
    for (const active of this.activeNotes.values()) {
      active.displayTime = active.note.time + this.timingAdjustmentSec;
    }
  }

  private computeLogicalTime(audioTime: number): number {
    return Math.max(0, (audioTime - this.audioAnchorTime) * this.playbackSpeed);
  }

  private spawnVisibleNotes(currentTime: number): void {
    const lookahead = this.getLookaheadTime();
    while (this.nextNoteIndex < this.notes.length) {
      const note = this.notes[this.nextNoteIndex];
      note.appearTime = note.time + this.timingAdjustmentSec - lookahead;
      if (note.appearTime > currentTime) {
        break;
      }
      if (!note.processed && !this.activeNotes.has(note.numericId)) {
        this.activeNotes.set(note.numericId, {
          note,
          state: SharedNoteState.Visible,
          displayTime: note.time + this.timingAdjustmentSec,
        });
      }
      this.nextNoteIndex++;
    }
  }

  private updateActiveNotes(currentTime: number): void {
    const cleanupTime = this.getCleanupTime();
    const missedCleanup = this.getMissedCleanupTime();

    for (const [id, active] of this.activeNotes) {
      active.previousY = active.y;
      active.y = this.calculateNoteY(active, currentTime);

      this.checkHitLineCrossing(active, currentTime);

      const timePassed = currentTime - active.note.time;
      if (active.state === SharedNoteState.Visible && timePassed > 0.5) {
        const noteAge = currentTime - (active.note.appearTime ?? 0);
        if (noteAge > 2.0) {
          this.markMiss(active.note);
          active.state = SharedNoteState.Missed;
        }
      }

      if (active.state === SharedNoteState.Missed && timePassed > missedCleanup) {
        this.completeNote(id);
        continue;
      }

      if (timePassed > cleanupTime) {
        this.completeNote(id);
      }
    }
  }

  private calculateNoteY(active: ActiveNoteState, currentTime: number): number {
    const { note, displayTime } = active;
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight;
    const startYCenter = -5;
    const totalDistance = hitLineY - startYCenter;
    const visualSpeed = this.settings.notesSpeed || 1;
    const pixelsPerSecond = (totalDistance / DEFAULT_LOOKAHEAD) * visualSpeed;
    const timeToHit = displayTime - currentTime;
    const perfectY = hitLineY - timeToHit * pixelsPerSecond;
    const minY = startYCenter - 100;
    const maxY = screenHeight + 100;
    return Math.max(minY, Math.min(maxY, perfectY));
  }

  private getLookaheadTime(): number {
    const speed = Math.max(0.1, Math.min(4, this.settings.notesSpeed || 1));
    return DEFAULT_LOOKAHEAD / speed;
  }

  private getCleanupTime(): number {
    const speed = Math.max(0.1, Math.min(4, this.settings.notesSpeed || 1));
    return DEFAULT_CLEANUP / speed;
  }

  private getMissedCleanupTime(): number {
    const speed = Math.max(0.1, Math.min(4, this.settings.notesSpeed || 1));
    return DEFAULT_MISSED_CLEANUP / speed;
  }

  private flushJudgments(): JudgmentResult[] {
    const payload = [...this.judgmentQueue];
    this.judgmentQueue.length = 0;
    return payload;
  }

  private flushHighlights(): LegendGuideHighlightPayload[] {
    const payload = [...this.highlightQueue];
    this.highlightQueue.length = 0;
    return payload;
  }

  private applyJudgment(active: ActiveNoteState, judgment: JudgmentResult): void {
    active.state = SharedNoteState.Hit;
    active.hitTime = judgment.timestamp;
    active.timingError = judgment.timingError;

    this.score.goodCount += 1;
    this.score.combo += 1;
    this.score.maxCombo = Math.max(this.score.maxCombo, this.score.combo);
    const judged = this.score.goodCount + this.score.missCount;
    this.score.accuracy = judged > 0 ? this.score.goodCount / judged : 0;
    this.score.score = this.score.goodCount * 1000;
    this.score.rank = this.calculateRank(this.score.accuracy);

    this.judgmentQueue.push(judgment);
    this.completeNote(active.note.numericId);
  }

  private calculateRank(accuracy: number): GameScore['rank'] {
    if (accuracy >= 0.95) return 'S';
    if (accuracy >= 0.85) return 'A';
    if (accuracy >= 0.7) return 'B';
    if (accuracy >= 0.5) return 'C';
    return 'D';
  }

  private markMiss(note: InternalNote): void {
    this.score.missCount += 1;
    this.score.combo = 0;
    const judged = this.score.goodCount + this.score.missCount;
    this.score.accuracy = judged > 0 ? this.score.goodCount / judged : 0;
    this.score.rank = this.calculateRank(this.score.accuracy);
    this.judgmentQueue.push({
      type: 'miss',
      timingError: 0,
      noteId: note.id,
      timestamp: this.logicalTime,
    });
  }

  private completeNote(id: number): void {
    const active = this.activeNotes.get(id);
    if (!active) return;
    active.note.processed = true;
    this.activeNotes.delete(id);
  }

  private findHitCandidate(noteNumber: number, logicalTime: number): ActiveNoteState | undefined {
    const adjustedInput = noteNumber + this.settings.noteOctaveShift * 12;
    const transpose = this.settings.transpose ?? 0;

    let best: ActiveNoteState | undefined;
    let bestError = Number.POSITIVE_INFINITY;

    for (const active of this.activeNotes.values()) {
      if (active.state !== SharedNoteState.Visible) continue;
      const targetPitch = active.note.pitch + transpose;
      if (!this.isPitchMatch(targetPitch, adjustedInput)) continue;
      const timingError = Math.abs(logicalTime - (active.note.time + this.timingAdjustmentSec)) * 1000;
      if (timingError > JUDGMENT_WINDOW_MS) continue;
      if (timingError < bestError) {
        best = active;
        bestError = timingError;
      }
    }

    return best;
  }

  private isPitchMatch(target: number, input: number): boolean {
    if (target === input) return true;
    if (this.settings.allowOctaveError) {
      return target % 12 === input % 12;
    }
    return false;
  }

  private rewindTo(time: number): void {
    const lookBehind = 2.0;
    this.activeNotes.clear();
    this.notes.forEach((note) => {
      if (note.time >= time - lookBehind) {
        note.processed = false;
        note.appearTime = 0;
      } else {
        note.processed = true;
      }
    });
    this.nextNoteIndex = this.notes.findIndex((note) => note.time >= time - lookBehind);
    if (this.nextNoteIndex < 0) {
      this.nextNoteIndex = this.notes.length;
    }
    this.spawnVisibleNotes(time);
  }

  private checkHitLineCrossing(active: ActiveNoteState, currentTime: number): void {
    if (active.crossingLogged || active.previousY === undefined || active.y === undefined) {
      return;
    }

    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight;
    const prev = active.previousY;
    const next = active.y;

    if (prev <= hitLineY && next >= hitLineY) {
      active.crossingLogged = true;
      const effectivePitch = active.note.pitch + (this.settings.transpose ?? 0);
      if ((this.settings.practiceGuide ?? 'key') !== 'off') {
        this.highlightQueue.push({ pitch: effectivePitch, timestamp: currentTime });
        if (this.settings.practiceGuide === 'key_auto') {
          const judgment: JudgmentResult = {
            type: 'good',
            timingError: 0,
            noteId: active.note.id,
            timestamp: currentTime,
          };
          this.applyJudgment(active, judgment);
        }
      }
    }
  }
}
