import { measureBeatToMs } from './beatTime';
import { resolveChord } from '@/utils/chord-utils';
import type { RhythmStage, RhythmQuestion } from '@/types';

const WINDOW_MS = 200; // ±200 ms

interface Callbacks {
  onAttackSuccess: (q: RhythmQuestion, damage: number) => void;
  onAttackFail: (q: RhythmQuestion) => void;
  onEnemyDefeat?: (enemyIndex: number) => void;
  onGameComplete?: () => void;
}

interface InternalQuestion extends RhythmQuestion {
  notesNeeded: number[];      // 0-11 の pitch 集合
  resolved: boolean;
}

interface Enemy {
  index: number;
  hp: number;
  maxHp: number;
  defeated: boolean;
}

export class RhythmGameEngine {
  private readonly stage: RhythmStage;
  private readonly cb: Callbacks;
  private questions: InternalQuestion[] = [];
  private questionIndex = 0;
  private startedAt = 0;
  private loopCount = 0;

  /* 敵管理 */
  private enemies: Enemy[] = [];
  private activeEnemyIndex = 0;

  /* 現在のウィンドウ内で押された音 (0-11) */
  private playedNotes: Set<number> = new Set();

  /* 現在判定中の質問 */
  private currentQuestion: InternalQuestion | null = null;

  constructor(stage: RhythmStage, cb: Callbacks) {
    this.stage = stage;
    this.cb = cb;
    this.generateQuestions();
    this.initializeEnemies();
  }

  /* quiz 互換 */
  public loadSong(): void {/* no-op */}

  public start(now = performance.now()): void {
    this.startedAt = now;
  }

  public stop(): void {
    this.startedAt = 0;
  }

  /** 現在のゲーム状態を取得 */
  public getGameState() {
    const totalEnemyHp = this.enemies.reduce((sum, e) => sum + e.maxHp, 0);
    const currentEnemyHp = this.enemies.reduce((sum, e) => sum + e.hp, 0);
    const enemiesDefeated = this.enemies.filter(e => e.defeated).length;

    return {
      activeEnemyIndex: this.activeEnemyIndex,
      enemies: [...this.enemies],
      enemiesDefeated,
      totalEnemies: this.enemies.length,
      progress: totalEnemyHp > 0 ? (totalEnemyHp - currentEnemyHp) / totalEnemyHp : 0,
      isGameOver: this.enemies.every(e => e.defeated),
      currentQuestion: this.currentQuestion
    };
  }

  /** MIDI / クリック入力 */
  public handleInput(note: number, now: number = performance.now()): void {
    if (!this.startedAt) return;
    const elapsed = now - this.startedAt;

    /* ウィンドウ外失敗を先に処理 */
    this.handleExpired(elapsed);

    /* 現在アクティブな質問を特定 */
    const q = this.findActiveQuestion(elapsed);
    if (!q) return;

    this.currentQuestion = q;
    this.playedNotes.add(note % 12);

    const isComplete = [...q.notesNeeded].every((n) => this.playedNotes.has(n));
    if (isComplete) {
      this.handleSuccess(q);
    }
  }

  /* ───────────── private ───────────── */
  private initializeEnemies(): void {
    const enemyCount = this.stage.enemy_count || 1;
    for (let i = 0; i < enemyCount; i++) {
      this.enemies.push({
        index: i,
        hp: this.stage.enemy_hp || 1,
        maxHp: this.stage.enemy_hp || 1,
        defeated: false
      });
    }
  }

  private generateQuestions(): void {
    const { bpm = 120, time_signature = 4, measure_count = 8, count_in_measures = 0 } = this.stage;
    const push = (c: string, m: number, b: number): void => {
      const center = measureBeatToMs(m, b, bpm, time_signature, count_in_measures);
      const res = resolveChord(c, 4);
      const notesNeeded =
        res?.notes.map((n) => {
          const noteRes = resolveChord(n, 4);
          return noteRes ? noteRes.notes[0] % 12 : 60 % 12;
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

    if (this.stage.rhythm_type === 'random') {
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

  private findActiveQuestion(elapsed: number): InternalQuestion | null {
    // 無限ループを考慮
    const loopDuration = this.calculateLoopDuration();
    const effectiveElapsed = elapsed % loopDuration;

    return this.questions.find(
      (q) => !q.resolved && effectiveElapsed >= q.windowStart && effectiveElapsed <= q.windowEnd
    ) || null;
  }

  private calculateLoopDuration(): number {
    const { bpm = 120, time_signature = 4, measure_count = 8, count_in_measures = 0 } = this.stage;
    const msPerBeat = 60000 / bpm;
    const totalBeats = (measure_count + count_in_measures) * time_signature;
    return msPerBeat * totalBeats;
  }

  private handleSuccess(q: InternalQuestion): void {
    q.resolved = true;
    this.playedNotes.clear();

    // ダメージ計算
    const damage = this.calculateDamage();
    
    // 敵にダメージを与える
    const enemy = this.enemies[this.activeEnemyIndex];
    if (enemy && !enemy.defeated) {
      enemy.hp = Math.max(0, enemy.hp - damage);
      
      if (enemy.hp === 0) {
        enemy.defeated = true;
        this.cb.onEnemyDefeat?.(enemy.index);
        
        // 次の敵に移行
        this.activeEnemyIndex = this.enemies.findIndex(e => !e.defeated);
        
        // 全ての敵を倒した
        if (this.activeEnemyIndex === -1) {
          this.cb.onGameComplete?.();
        }
      }
    }

    this.cb.onAttackSuccess(q, damage);
    this.currentQuestion = null;

    // ループで問題をリセット
    this.checkAndResetQuestions();
  }

  private handleFail(q: InternalQuestion): void {
    q.resolved = true;
    this.playedNotes.clear();
    this.cb.onAttackFail(q);
    this.currentQuestion = null;

    // ループで問題をリセット
    this.checkAndResetQuestions();
  }

  private calculateDamage(): number {
    const { min_damage = 1, max_damage = 1 } = this.stage;
    return Math.floor(Math.random() * (max_damage - min_damage + 1)) + min_damage;
  }

  /** 判定ウィンドウを過ぎた未解決問は失敗扱い */
  private handleExpired(elapsed: number): void {
    const loopDuration = this.calculateLoopDuration();
    const effectiveElapsed = elapsed % loopDuration;

    this.questions.forEach((q) => {
      if (!q.resolved && effectiveElapsed > q.windowEnd) {
        this.handleFail(q);
      }
    });
  }

  private checkAndResetQuestions(): void {
    // 全ての問題が解決済みかチェック
    if (this.questions.every(q => q.resolved)) {
      // 敵が残っている場合はループ継続
      if (this.enemies.some(e => !e.defeated)) {
        this.loopCount++;
        this.questions.forEach(q => {
          q.resolved = false;
        });
      }
    }
  }
}

export default RhythmGameEngine;