import type { RhythmNote, RhythmMode, JudgmentWindow, RhythmGameState } from '@/types/rhythm';

export interface RhythmEngineOpts {
  mode: RhythmMode;
  bpm: number;
  timeSig: number;
  measureCount: number;
  countIn: number;
  allowedChords: string[];
  progression?: string[];
}

export class RhythmGameEngine {
  private readonly opts: RhythmEngineOpts;

  constructor(opts: RhythmEngineOpts) {
    this.opts = opts;
  }

  /* 判定ウィンドウ中心秒を受け取り ±200 ms の Window を返す */
  public static buildWindow(center: number): JudgmentWindow {
    const ms = 0.2;
    return { start: center - ms, end: center + ms };
  }

  /* 次ループ分のノートを生成（1 小節 1 コード）*/
  public generateNotes(loopIndex = 0): RhythmNote[] {
    const notes: RhythmNote[] = [];
    const {
      mode, bpm, timeSig, measureCount, countIn, allowedChords, progression,
    } = this.opts;
    const secPerBeat = 60 / bpm;
    const secPerMeas = secPerBeat * timeSig;

    for (let m = 0; m < measureCount; m += 1) {
      const absoluteMeasure = loopIndex * measureCount + m;
      const spawnAt = (countIn + absoluteMeasure) * secPerMeas;
      const chord = mode === 'random'
        ? allowedChords[Math.floor(Math.random() * allowedChords.length)]
        : progression?.[m % (progression.length)] ?? allowedChords[0];

      notes.push({
        id: `loop${loopIndex}-m${m}`,
        measure: m + 1,
        beat: 1,
        chord,
        spawnAt,
      });
    }
    return notes;
  }

  /* ───────── 実時間 tick ───────── */
  public update(
    timeSec: number,
    state: RhythmGameState,
    commit: (next: Partial<RhythmGameState>) => void,
  ): void {
    // 1. ループ切替検出
    const {
      measureCount, countIn, timeSig, bpm,
    } = this.opts;
    const secPerBeat = 60 / bpm;
    const secPerMeas = secPerBeat * timeSig;
    const playedMeasures = Math.floor(timeSec / secPerMeas) - countIn;
    const loopIndex = Math.floor(Math.max(0, playedMeasures) / measureCount);

    if (loopIndex > state.loop) {
      // 新ループ突入 → notes 生成
      const notes = this.generateNotes(loopIndex);
      commit({ loop: loopIndex, notes });
    }

    // 2. activeNote 決定
    const nextNote = state.notes[0];
    if (nextNote && timeSec >= nextNote.spawnAt - 0.2) {
      commit({
        activeNote: nextNote,
        notes: state.notes.slice(1),
        window: RhythmGameEngine.buildWindow(nextNote.spawnAt),
      });
    }

    // 3. 判定ウィンドウ終了チェック（MISS 判定）
    if (state.window && timeSec > state.window.end) {
      // miss → HP-1 & window close
      commit({
        playerHp: Math.max(0, state.playerHp - 1),
        window: null,
        activeNote: null,
      });
    }
  }

  /* ───────── 入力処理 ───────── */
  public judgeInput(
    note: number,
    timeSec: number,
    state: RhythmGameState,
    commit: (next: Partial<RhythmGameState>) => void,
  ): boolean {
    if (!state.window || !state.activeNote) return false;
    const ok = Math.abs(timeSec - state.activeNote.spawnAt) <= 0.2;
    if (!ok) return false;

    // SUCCESS！
    commit({
      enemyHp: Math.max(0, state.enemyHp - 1),
      enemyGauge: 0,
      window: null,
      activeNote: null,
    });
    return true;
  }
}

/* ===== helper for tests ===== */
export const _testHelpers = {
  makeEngine: (opts: RhythmEngineOpts) => new RhythmGameEngine(opts),
};