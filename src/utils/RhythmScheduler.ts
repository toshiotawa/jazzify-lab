/**
 * リズムゲーム用スケジューラー
 * 判定タイミングの3拍前にノーツを生成し、判定ウィンドウを管理
 */

import { useTimeStore } from '@/stores/timeStore';

export interface ScheduledNote {
  id: string;
  spawnAt: number;  // ノーツ生成時刻 (ms)
  judgeAt: number;  // 判定時刻 (ms)
  chordId: string;
  chordTarget: any; // ChordDefinition
  resolved: boolean;
}

export class RhythmScheduler {
  private queue: ScheduledNote[] = [];
  private noteIdCounter = 0;
  private currentNote: ScheduledNote | null = null;

  constructor() {
    this.queue = [];
  }

  /**
   * 1拍あたりのミリ秒を取得
   */
  private getMsPerBeat(): number {
    const { bpm } = useTimeStore.getState();
    return 60000 / bpm;
  }

  /**
   * 指定された小節・拍の絶対時刻を取得
   */
  private getAbsoluteTimeOfBeat(measure: number, beat: number): number {
    const { startAt, readyDuration, timeSignature } = useTimeStore.getState();
    if (!startAt) return 0;
    
    const msPerBeat = this.getMsPerBeat();
    const beatsFromStart = (measure - 1) * timeSignature + (beat - 1);
    return startAt + readyDuration + beatsFromStart * msPerBeat;
  }

  /**
   * 次の1拍目（ダウンビート）を計算
   */
  private calcNextDownbeat(now: number): { measure: number; beat: number } {
    const { startAt, readyDuration, timeSignature, measureCount, countInMeasures } = useTimeStore.getState();
    if (!startAt) return { measure: 1, beat: 1 };

    const elapsed = now - startAt - readyDuration;
    if (elapsed < 0) {
      // まだReady中なので、最初の1拍目を返す
      return { measure: countInMeasures + 1, beat: 1 };
    }

    const msPerBeat = this.getMsPerBeat();
    const totalBeats = Math.floor(elapsed / msPerBeat);
    const currentMeasure = Math.floor(totalBeats / timeSignature) + 1;
    const currentBeat = (totalBeats % timeSignature) + 1;

    // 次の小節の1拍目を計算
    let nextMeasure = currentMeasure;
    if (currentBeat > 1) {
      nextMeasure = currentMeasure + 1;
    }

    // カウントイン後の実際の小節番号に変換
    const measureAfterCountIn = nextMeasure - countInMeasures;
    if (measureAfterCountIn <= 0) {
      return { measure: countInMeasures + 1, beat: 1 };
    }

    // ループを考慮
    const loopedMeasure = ((measureAfterCountIn - 1) % measureCount) + 1 + countInMeasures;
    return { measure: loopedMeasure, beat: 1 };
  }

  /**
   * 次のノーツをスケジュール
   */
  planNext(chordId: string, chordTarget: any): void {
    const now = performance.now();
    const nextBeat = this.calcNextDownbeat(now);
    const judgeAt = this.getAbsoluteTimeOfBeat(nextBeat.measure, 1);
    const spawnAt = judgeAt - 3 * this.getMsPerBeat();

    const note: ScheduledNote = {
      id: `note_${this.noteIdCounter++}`,
      spawnAt,
      judgeAt,
      chordId,
      chordTarget,
      resolved: false
    };

    this.queue.push(note);
    console.log(`[RhythmScheduler] Planned note: ${chordId} spawn at ${spawnAt}, judge at ${judgeAt}`);
  }

  /**
   * 現在時刻に基づいてノーツを更新
   * @returns 生成すべきノーツのリスト
   */
  update(now: number): ScheduledNote[] {
    const toSpawn: ScheduledNote[] = [];

    // 生成時刻に達したノーツを取り出す
    while (this.queue.length > 0 && now >= this.queue[0].spawnAt) {
      const note = this.queue.shift()!;
      toSpawn.push(note);
      this.currentNote = note;
    }

    // 判定時刻を過ぎた未解決ノーツをチェック
    if (this.currentNote && !this.currentNote.resolved && now > this.currentNote.judgeAt + 200) {
      // 判定窓を過ぎたので自動的にミスとする
      this.currentNote.resolved = true;
      // ミス処理はゲームエンジン側で行う
    }

    return toSpawn;
  }

  /**
   * 現在の判定対象ノーツを取得
   */
  getCurrentNote(): ScheduledNote | null {
    return this.currentNote;
  }

  /**
   * 判定窓内かどうかチェック
   */
  isInsideJudgementWindow(now: number): boolean {
    if (!this.currentNote || this.currentNote.resolved) return false;
    return Math.abs(now - this.currentNote.judgeAt) <= 200;
  }

  /**
   * 現在のノーツを解決済みにする
   */
  resolveCurrentNote(): void {
    if (this.currentNote) {
      this.currentNote.resolved = true;
    }
  }

  /**
   * スケジューラをリセット
   */
  reset(): void {
    this.queue = [];
    this.currentNote = null;
    this.noteIdCounter = 0;
  }

  /**
   * キュー内のノーツ数を取得
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}