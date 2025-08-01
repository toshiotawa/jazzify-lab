import { measureBeatToMs } from './beatTime';
import { resolveChord } from '@/utils/chord-utils';
import { note as parseNote } from 'tonal';
import type { RhythmStage, RhythmQuestion } from '@/types';

const WINDOW_MS = 200; // ±200 ms

interface Callbacks {
  onAttackSuccess: (q: RhythmQuestion) => void;
  onAttackFail: (q: RhythmQuestion) => void;
}

interface InternalQuestion extends RhythmQuestion {
  notesNeeded: number[];      // 0-11 の pitch 集合
  resolved: boolean;
}

export class RhythmGameEngine {
  private readonly stage: RhythmStage;
  private readonly cb: Callbacks;
  private questions: InternalQuestion[] = [];
  private startedAt = 0;

  /* 現在のウィンドウ内で押された音 (0-11) */
  private playedNotes: Set<number> = new Set();

  constructor(stage: RhythmStage, cb: Callbacks) {
    this.stage = stage;
    this.cb = cb;
    this.generateQuestions();
  }

  /* quiz 互換 */
  public loadSong(): void {/* no-op */}

  public start(now = performance.now()): void {
    this.startedAt = now;
  }
  public stop(): void {/* no-op */}

  /** MIDI / クリック入力 */
  public handleInput(note: number, now: number = performance.now()): void {
    if (!this.startedAt) return;
    const elapsed = now - this.startedAt;

    /* ウィンドウ外失敗を先に処理 */
    this.handleExpired(elapsed);

    /* 現在アクティブな質問を特定 */
    const q = this.questions.find(
      (qu) => !qu.resolved && elapsed >= qu.windowStart && elapsed <= qu.windowEnd,
    );
    if (!q) return;

    this.playedNotes.add(note % 12);

    const isComplete = [...q.notesNeeded].every((n) => this.playedNotes.has(n));
    if (isComplete) {
      q.resolved = true;
      this.cb.onAttackSuccess(q);
      this.playedNotes.clear(); // 成功でバッファリセット
    }
  }

  /* ───────────── private ───────────── */
  private generateQuestions(): void {
    const { bpm = 120, time_signature = 4, measure_count = 8, count_in_measures = 0 } = this.stage;
    const push = (c: string, m: number, b: number): void => {
      const center = measureBeatToMs(m, b, bpm, time_signature, count_in_measures);
      const res = resolveChord(c, 4);
      const notesNeeded =
        res?.notes.map((noteName) => {
          // Convert note name to MIDI note number
          const noteInfo = parseNote(noteName);
          const midiNote = noteInfo.midi ?? 60;
          return midiNote % 12;
        }) ?? [];
      this.questions.push({
        id: crypto.randomUUID(),
        chord: c,
        measure: m,
        beat: b,
        windowStart: center - WINDOW_MS,
        windowEnd: center + WINDOW_MS,
        notesNeeded,
        resolved: false,
      });
    };

    if (this.stage.rhythmType === 'random') {
      for (let m = 1; m <= measure_count; m++) {
        const chord =
          this.stage.allowed_chords[
            Math.floor(Math.random() * this.stage.allowed_chords.length)
          ];
        push(chord, m, 1);
      }
    } else {
      (this.stage.chord_progression_data?.chords || []).forEach((c) =>
        push(c.chord, c.measure, c.beat),
      );
    }
  }

  /** 判定ウィンドウを過ぎた未解決問は失敗扱い */
  private handleExpired(elapsed: number): void {
    this.questions.forEach((q) => {
      if (!q.resolved && elapsed > q.windowEnd) {
        q.resolved = true;
        this.cb.onAttackFail(q);
        this.playedNotes.clear(); // 失敗でもバッファリセット
      }
    });
  }
}

export default RhythmGameEngine;