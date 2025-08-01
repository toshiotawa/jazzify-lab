/**
 * RhythmGameEngine – リズムモード用ゲームエンジン
 * 拍同期・判定ウィンドウ処理を担当
 */

import { measureBeatToMs } from './beatTime';
import { resolveChord } from '@/utils/chord-utils';
import type { RhythmStage, RhythmQuestion, FantasyStage } from '@/types';
import { devLog } from '@/utils/logger';

const WINDOW_MS = 200; // ±200 ms 判定ウィンドウ

interface Callbacks {
  onAttackSuccess: (question: RhythmQuestion, damage: number) => void;
  onAttackFail: (question: RhythmQuestion) => void;
  onQuestionScheduled: (question: RhythmQuestion) => void;
  onGameComplete?: () => void;
}

interface InternalQuestion extends RhythmQuestion {
  notesNeeded: number[];      // 0-11 の pitch 集合
  resolved: boolean;
  scheduled: boolean;         // UI に表示済みか
}

export class RhythmGameEngine {
  private readonly stage: RhythmStage | FantasyStage;
  private readonly cb: Callbacks;
  private questions: InternalQuestion[] = [];
  private startedAt = 0;
  private questionIndex = 0;  // 現在の質問インデックス
  private loopCount = 0;      // ループ回数
  
  /* 現在のウィンドウ内で押された音 (0-11) */
  private playedNotes: Set<number> = new Set();
  
  /* 判定ウィンドウを監視するインターバルID */
  private checkInterval: number | null = null;
  
  /* ゲーム完了フラグ */
  private isCompleted = false;
  
  /* 敵のHP管理（リズムモードで使用） */
  private totalEnemyHp: number;
  private remainingEnemyHp: number;

  constructor(stage: RhythmStage | FantasyStage, cb: Callbacks) {
    this.stage = stage;
    this.cb = cb;
    
    // 敵のHP計算
    this.totalEnemyHp = stage.enemy_count * stage.enemy_hp;
    this.remainingEnemyHp = this.totalEnemyHp;
    
    this.generateQuestions();
  }

  /* クイズモードと互換性のためのメソッド */
  public loadSong(): void {/* no-op */}

  public start(now = performance.now()): void {
    this.startedAt = now;
    this.startCheckInterval();
    devLog.debug('🎵 リズムエンジン開始', { now, questionCount: this.questions.length });
  }
  
  public stop(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    devLog.debug('🎵 リズムエンジン停止');
  }

  /** MIDI / クリック入力 */
  public handleInput(note: number, now: number = performance.now()): void {
    if (!this.startedAt || this.isCompleted) return;
    const elapsed = now - this.startedAt;

    /* 現在アクティブな質問を特定 */
    const q = this.questions.find(
      (qu) => !qu.resolved && elapsed >= qu.windowStart && elapsed <= qu.windowEnd,
    );
    if (!q) return;

    this.playedNotes.add(note % 12);
    devLog.debug('🎹 ノート入力', { 
      note, 
      pitch: note % 12, 
      playedNotes: Array.from(this.playedNotes),
      notesNeeded: q.notesNeeded 
    });

    const isComplete = [...q.notesNeeded].every((n) => this.playedNotes.has(n));
    if (isComplete) {
      q.resolved = true;
      
      // ダメージ計算
      const damage = this.calculateDamage();
      this.remainingEnemyHp -= damage;
      
      this.cb.onAttackSuccess(q, damage);
      this.playedNotes.clear(); // 成功でバッファリセット
      
      // HP確認
      if (this.remainingEnemyHp <= 0 && !this.isCompleted) {
        this.isCompleted = true;
        this.cb.onGameComplete?.();
      }
    }
  }
  
  /** 現在の敵のHP状況を取得 */
  public getEnemyStatus(): { total: number; remaining: number; defeated: number } {
    const defeated = Math.floor((this.totalEnemyHp - this.remainingEnemyHp) / this.stage.enemy_hp);
    return {
      total: this.stage.enemy_count,
      remaining: this.remainingEnemyHp,
      defeated
    };
  }

  /* ───────────── private ───────────── */
  
  private generateQuestions(): void {
    const { bpm, time_signature = 4, measure_count = 8, count_in_measures = 0 } = this.stage;
    const push = (c: string, m: number, b: number): void => {
      const center = measureBeatToMs(m, b, bpm || 120, time_signature, count_in_measures);
      const res = resolveChord(c, 4);
      
      // コードの構成音を0-11のピッチクラスに変換
      const notesNeeded: number[] = [];
      if (res?.notes) {
        res.notes.forEach(noteName => {
          const noteRes = resolveChord(noteName, 4);
          if (noteRes?.notes[0] !== undefined) {
            const note = noteRes.notes[0];
            if (typeof note === 'number') {
              notesNeeded.push(note % 12);
            }
          }
        });
      }
      
      // 重複を除去
      const uniqueNotes = Array.from(new Set(notesNeeded));
      
      this.questions.push({
        id: crypto.randomUUID(),
        chord: c,
        measure: m,
        beat: b,
        windowStart: center - WINDOW_MS,
        windowEnd: center + WINDOW_MS,
        notesNeeded: uniqueNotes,
        resolved: false,
        scheduled: false,
      });
    };

    if (this.isRhythmMode() && this.stage.mode === 'rhythm') {
      const rhythmStage = this.stage as RhythmStage;
      
      if (rhythmStage.rhythmType === 'random') {
        // ランダムパターン：1小節に1つ
        for (let m = 1; m <= measure_count; m++) {
          const chord = rhythmStage.allowed_chords[
            Math.floor(Math.random() * rhythmStage.allowed_chords.length)
          ];
          push(chord, m, 1);
        }
      } else if (rhythmStage.rhythmType === 'progression' && rhythmStage.chord_progression_data) {
        // プログレッションパターン
        rhythmStage.chord_progression_data.chords.forEach((c) =>
          push(c.chord, c.measure, c.beat),
        );
      }
    }
    
    devLog.debug('🎵 質問生成完了', { count: this.questions.length });
  }

  /** 判定ウィンドウを過ぎた未解決問は失敗扱い */
  private handleExpired(elapsed: number): void {
    this.questions.forEach((q) => {
      if (!q.resolved && elapsed > q.windowEnd) {
        q.resolved = true;
        this.cb.onAttackFail(q);
        this.playedNotes.clear(); // 失敗でもバッファリセット
        devLog.debug('⏰ 判定ウィンドウ期限切れ', { chord: q.chord });
      }
    });
  }
  
  /** 今後の質問をスケジュール */
  private scheduleQuestions(elapsed: number): void {
    const lookAhead = 4000; // 4秒先まで見る
    
    this.questions.forEach((q) => {
      if (!q.scheduled && q.windowStart - elapsed <= lookAhead) {
        q.scheduled = true;
        this.cb.onQuestionScheduled(q);
      }
    });
    
    // ループ処理
    const lastQuestion = this.questions[this.questions.length - 1];
    if (lastQuestion && elapsed > lastQuestion.windowEnd) {
      this.handleLoop();
    }
  }
  
  /** ループ処理 */
  private handleLoop(): void {
    if (this.isCompleted) return;
    
    this.loopCount++;
    // 1ループの時間を計算
    const oneCycleMs = (60000 / (this.stage.bpm || 120)) * (this.stage.time_signature || 4) * (this.stage.measure_count || 8);
    const loopOffset = oneCycleMs * this.loopCount;
    
    // 新しい質問を生成（IDは新規、タイミングはオフセット付き）
    const originalQuestions = [...this.questions];
    originalQuestions.forEach((orig) => {
      if (!this.isCompleted) {
        const newQ: InternalQuestion = {
          ...orig,
          id: crypto.randomUUID(),
          windowStart: orig.windowStart + loopOffset,
          windowEnd: orig.windowEnd + loopOffset,
          resolved: false,
          scheduled: false,
        };
        this.questions.push(newQ);
      }
    });
    
    devLog.debug('🔄 ループ処理', { loopCount: this.loopCount, newQuestions: this.questions.length });
  }
  
  /** 判定チェックのインターバル開始 */
  private startCheckInterval(): void {
    this.checkInterval = window.setInterval(() => {
      if (!this.startedAt || this.isCompleted) return;
      
      const elapsed = performance.now() - this.startedAt;
      this.handleExpired(elapsed);
      this.scheduleQuestions(elapsed);
    }, 50); // 50ms毎にチェック
  }
  
  /** ダメージ計算 */
  private calculateDamage(): number {
    const { min_damage, max_damage } = this.stage;
    return Math.floor(Math.random() * (max_damage - min_damage + 1)) + min_damage;
  }
  
  /** リズムモードかどうかの判定 */
  private isRhythmMode(): boolean {
    return this.stage.mode === 'rhythm';
  }
}

export default RhythmGameEngine;