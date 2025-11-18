import type {
  ActiveNote,
  GameScore,
  GameSettings,
  JudgmentResult,
  MusicalTiming,
  NoteData,
  NoteHit
} from '@/types';
import { unifiedFrameController } from '@/utils/performanceOptimizer';
import { log } from '@/utils/logger';

export const JUDGMENT_TIMING = {
  perfectMs: 0,
  goodMs: 150,
  missMs: 150
};

export const LOOKAHEAD_TIME = 5.0;
export const CLEANUP_TIME = 3.0;
export const MISSED_CLEANUP_TIME = 2.0;

const NOTE_SPRITE_HEIGHT = 5;

const defaultScore = (): GameScore => ({
  totalNotes: 0,
  goodCount: 0,
  missCount: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  score: 0,
  rank: 'D'
});

export interface GameEngineUpdate {
  currentTime: number;
  activeNotes: ActiveNote[];
  timing: MusicalTiming;
  score: GameScore;
  abRepeatState: { start: number | null; end: number | null; enabled: boolean };
  events?: {
    judgments: JudgmentResult[];
    highlights: Array<{ pitch: number; timestamp: number }>;
  };
}

export interface GameEngineDiff {
  currentTime: number;
  additions: ActiveNote[];
  updates: Array<{
    id: string;
    y?: number;
    previousY?: number;
    state?: ActiveNote['state'];
    pitch?: number;
    noteName?: string | undefined;
    crossingLogged?: boolean;
  }>;
  removals: string[];
  judgments: JudgmentResult[];
  highlights: Array<{ pitch: number; timestamp: number }>;
  score: GameScore;
}

export class GameEngineCore {
  private notes: NoteData[] = [];
  private activeNotes: Map<string, ActiveNote> = new Map();
  private settings: GameSettings;
  private score: GameScore = defaultScore();
  private currentTime = 0;
  private pendingJudgments: JudgmentResult[] = [];
  private pendingHighlights: Array<{ pitch: number; timestamp: number }> = [];

  constructor(settings: GameSettings) {
    this.settings = { ...settings };
  }

  loadSong(notes: NoteData[]): void {
    this.notes = notes.map((note, index) => ({
      ...note,
      id: note.id || `note-${index}`,
      time: note.time,
      appearTime: note.time + this.getTimingAdjSec() - LOOKAHEAD_TIME
    }));

    this.activeNotes.clear();
    this.resetScore();
    this.score.totalNotes = this.notes.length;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    const dynamicLookahead = this.getLookaheadTime();
    this.notes.forEach((note) => {
      note.appearTime = note.time + this.getTimingAdjSec() - dynamicLookahead;
    });
  }

  seek(time: number): void {
    const safeTime = Math.max(0, time);
    this.currentTime = safeTime;
    this.activeNotes.clear();
    this.resetNoteProcessing(safeTime);
  }

  advance(currentTime: number): GameEngineUpdate {
    this.currentTime = currentTime;
    const activeNotes = this.updateNotes(currentTime);
    const judgments = this.flushPendingJudgments();
    const highlights = this.flushPendingHighlights();

    const timing: MusicalTiming = {
      currentTime,
      audioTime: currentTime,
      latencyOffset: 0
    };

    return {
      currentTime,
      activeNotes,
      timing,
      score: { ...this.score },
      abRepeatState: {
        start: null,
        end: null,
        enabled: false
      },
      events: {
        judgments,
        highlights
      }
    };
  }

  handleInput(inputNote: number): void {
    const hit = this.matchInputToNote(inputNote);
    if (hit) {
      const judgment = this.processHit(hit);
      this.pendingJudgments.push(judgment);
    }
  }

  destroy(): void {
    this.activeNotes.clear();
    this.pendingJudgments = [];
    this.pendingHighlights = [];
  }

  private matchInputToNote(inputNote: number): NoteHit | null {
    const currentTime = this.currentTime;
    const adjustedInput = this.adjustInputNote(inputNote);
    const timingAdjustmentSec = (this.settings.timingAdjustment || 0) / 1000;

    const candidates = Array.from(this.activeNotes.values())
      .filter((note) => note.state === 'visible')
      .filter((note) => this.isNoteMatch(note.pitch, adjustedInput))
      .map((note) => ({
        note,
        timingError: Math.abs(currentTime - (note.time + timingAdjustmentSec)) * 1000
      }))
      .filter(({ timingError }) => timingError <= JUDGMENT_TIMING.goodMs)
      .sort((a, b) => a.timingError - b.timingError);

    if (candidates.length === 0) {
      return null;
    }

    const { note, timingError } = candidates[0];
    return {
      noteId: note.id,
      inputNote: adjustedInput,
      timingError,
      judgment: 'good',
      timestamp: currentTime
    };
  }

  private flushPendingJudgments(): JudgmentResult[] {
    const judgments = [...this.pendingJudgments];
    this.pendingJudgments.length = 0;
    return judgments;
  }

  private flushPendingHighlights(): Array<{ pitch: number; timestamp: number }> {
    const highlights = [...this.pendingHighlights];
    this.pendingHighlights.length = 0;
    return highlights;
  }

  private processHit(hit: NoteHit): JudgmentResult {
    const judgment: JudgmentResult = {
      type: hit.judgment === 'miss' ? 'miss' : 'good',
      timingError: hit.timingError,
      noteId: hit.noteId,
      timestamp: hit.timestamp
    };

    this.updateScore(judgment);

    const note = this.activeNotes.get(hit.noteId);
    if (note) {
      const updatedNote: ActiveNote = {
        ...note,
        state: 'hit',
        hitTime: hit.timestamp,
        timingError: hit.timingError
      };
      this.activeNotes.set(hit.noteId, updatedNote);
    }

    return judgment;
  }

  private resetScore(): void {
    this.score = defaultScore();
  }

  private adjustInputNote(inputNote: number): number {
    let adjusted = inputNote;
    adjusted += this.settings.noteOctaveShift * 12;
    return adjusted;
  }

  private isNoteMatch(targetPitch: number, inputPitch: number): boolean {
    const transposedTarget = targetPitch + this.settings.transpose;
    if (transposedTarget === inputPitch) return true;

    if (this.settings.allowOctaveError) {
      const pitchClass = (pitch: number) => pitch % 12;
      return pitchClass(transposedTarget) === pitchClass(inputPitch);
    }

    return false;
  }

  private updateNotes(currentTime: number): ActiveNote[] {
    const visibleNotes: ActiveNote[] = [];

    for (const note of this.notes) {
      if (!note.appearTime) {
        note.appearTime = note.time + this.getTimingAdjSec() - this.getLookaheadTime();
      }

      const shouldAppear =
        currentTime >= note.appearTime && currentTime < note.time + this.getCleanupTime();
      const alreadyActive = this.activeNotes.has(note.id);
      const wasProcessed = (note as NoteData & { _wasProcessed?: boolean })._wasProcessed;

      if (shouldAppear && !alreadyActive && !wasProcessed) {
        const activeNote: ActiveNote = {
          ...note,
          state: 'visible',
          y: this.calculateNoteY(note, currentTime)
        };
        this.activeNotes.set(note.id, activeNote);
      }
    }

    this.updateNotePositions(currentTime);

    const frameStartTime = performance.now();
    if (unifiedFrameController.shouldUpdateNotes(frameStartTime)) {
      this.updateNoteLogic(currentTime);
      unifiedFrameController.markNoteUpdate(frameStartTime);
    }

    for (const note of this.activeNotes.values()) {
      if (note.state !== 'completed') {
        visibleNotes.push(note);
      }
    }

    return visibleNotes;
  }

  private updateNotePositions(currentTime: number): void {
    for (const [noteId, note] of this.activeNotes) {
      const previousY = note.y;
      const newY = this.calculateNoteY(note, currentTime);
      const updatedNote: ActiveNote = {
        ...note,
        previousY,
        y: newY
      };
      this.activeNotes.set(noteId, updatedNote);
    }
  }

  private updateNoteLogic(currentTime: number): void {
    const notesToDelete: string[] = [];

    for (const [noteId, note] of this.activeNotes) {
      this.checkHitLineCrossing(note, currentTime);
      const latestNote = this.activeNotes.get(noteId) || note;
      const updatedNote = this.updateNoteState(latestNote, currentTime);

      if (updatedNote.state === 'completed') {
        notesToDelete.push(noteId);
        const originalNote = this.notes.find((n) => n.id === noteId);
        if (originalNote) {
          (originalNote as NoteData & { _wasProcessed?: boolean })._wasProcessed = true;
        }
      } else {
        this.activeNotes.set(noteId, updatedNote);
      }
    }

    for (const noteId of notesToDelete) {
      this.activeNotes.delete(noteId);
    }
  }

  private updateNoteState(note: ActiveNote, currentTime: number): ActiveNote {
    const timePassed = currentTime - note.time;

    if (note.state === 'hit') {
      if (note.hitTime) {
        if (currentTime - note.hitTime > 0.05) {
          return { ...note, state: 'completed' };
        }
      } else {
        log.warn(`⚠️ HitノートにhitTimeがありません: ${note.id}`);
        return { ...note, state: 'completed' };
      }
      return note;
    }

    const missDelayAfterHitLine = 0.5;
    if (note.state === 'visible' && timePassed > missDelayAfterHitLine) {
      const noteAge = currentTime - (note.appearTime || note.time - this.getLookaheadTime());
      const gracePeriod = 2.0;
      if (noteAge > gracePeriod) {
        const missJudgment: JudgmentResult = {
          type: 'miss',
          timingError: 0,
          noteId: note.id,
          timestamp: currentTime
        };
        this.pendingJudgments.push(missJudgment);
        this.updateScore(missJudgment);
        return { ...note, state: 'missed' };
      }
    }

    if (note.state === 'missed' && timePassed > this.getMissedCleanupTime()) {
      return { ...note, state: 'completed' };
    }

    if (timePassed > this.getCleanupTime()) {
      return { ...note, state: 'completed' };
    }

    const previousY = note.y;
    const newY = this.calculateNoteY(note, currentTime);

    return {
      ...note,
      previousY,
      y: newY
    };
  }

  private checkHitLineCrossing(note: ActiveNote, currentTime: number): void {
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight;

    const noteCenter = note.y || 0;
    const prevNoteCenter = note.previousY || 0;
    const displayTime = note.time + this.getTimingAdjSec();

    if (
      note.previousY !== undefined &&
      prevNoteCenter <= hitLineY &&
      noteCenter >= hitLineY &&
      note.state === 'visible' &&
      !note.crossingLogged
    ) {
      const timeError = (currentTime - displayTime) * 1000;
      const updatedNote: ActiveNote = {
        ...note,
        crossingLogged: true
      };
      this.activeNotes.set(note.id, updatedNote);

      const practiceGuide = this.settings.practiceGuide ?? 'key';
      if (practiceGuide !== 'off') {
        const effectivePitch = note.pitch + this.settings.transpose;
        this.pendingHighlights.push({ pitch: effectivePitch, timestamp: currentTime });

        if (practiceGuide === 'key_auto') {
          const autoHit: NoteHit = {
            noteId: note.id,
            inputNote: effectivePitch,
            timingError: Math.abs(timeError),
            judgment: 'good',
            timestamp: currentTime
          };
          const judgment = this.processHit(autoHit);
          this.pendingJudgments.push(judgment);
        }
      }
    }
  }

  private calculateNoteY(note: NoteData, currentTime: number): number {
    const displayTime = note.time + this.getTimingAdjSec();
    const timeToHit = displayTime - currentTime;
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight;
    const noteHeight = NOTE_SPRITE_HEIGHT;
    const baseFallDuration = LOOKAHEAD_TIME;
    const visualSpeedMultiplier = this.settings.notesSpeed;
    const startYCenter = -noteHeight;
    const endYCenter = hitLineY;
    const totalDistance = endYCenter - startYCenter;
    const pixelsPerSecond = (totalDistance / baseFallDuration) * visualSpeedMultiplier;
    const perfectY = endYCenter - timeToHit * pixelsPerSecond;
    const minY = startYCenter - 100;
    const maxY = screenHeight + 100;
    const finalY = Math.max(minY, Math.min(perfectY, maxY));
    return Math.round(finalY * 10) / 10;
  }

  private updateScore(judgment: JudgmentResult): void {
    this.score.totalNotes++;

    if (judgment.type === 'good') {
      this.score.goodCount++;
      this.score.combo++;
      this.score.maxCombo = Math.max(this.score.maxCombo, this.score.combo);
    } else {
      this.score.missCount++;
      this.score.combo = 0;
    }

    this.score.accuracy = this.score.goodCount / this.score.totalNotes;
    this.score.score = this.score.goodCount * 1000;
    this.score.rank = this.calculateRank(this.score.accuracy);
  }

  private calculateRank(accuracy: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (accuracy >= 0.95) return 'S';
    if (accuracy >= 0.85) return 'A';
    if (accuracy >= 0.70) return 'B';
    if (accuracy >= 0.50) return 'C';
    return 'D';
  }

  private resetNoteProcessing(startTime = 0): void {
    for (const note of this.notes as Array<NoteData & { _wasProcessed?: boolean }>) {
      if (note.time >= startTime) {
        delete note._wasProcessed;
        delete note.appearTime;
      }
    }
  }

  private getTimingAdjSec(): number {
    return (this.settings.timingAdjustment ?? 0) / 1000;
  }

  private getSpeedScale(): number {
    const speed = this.settings.notesSpeed || 1;
    const clamped = Math.max(0.1, Math.min(4, speed));
    return 1 / clamped;
  }

  private getLookaheadTime(): number {
    return LOOKAHEAD_TIME * this.getSpeedScale();
  }

  private getCleanupTime(): number {
    return CLEANUP_TIME * this.getSpeedScale();
  }

  private getMissedCleanupTime(): number {
    return MISSED_CLEANUP_TIME * this.getSpeedScale();
  }
}
