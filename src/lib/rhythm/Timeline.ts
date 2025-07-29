/**
 * Timeline
 * リズムモード用のタイムライン管理クラス
 * - 拍の検出とコールバック
 * - 判定タイミングの管理
 * - ゲージ進行率の計算
 */

export interface TimelineOptions {
  bpm: number;      // BPM
  timeSig: number;  // 拍子 (3 または 4)
  bars: number;     // 小節数
}

export type BeatCallback = (barIdx: number, beatIdx: number, absoluteTime: number) => void;

export class Timeline {
  private bpm: number;
  private timeSig: number;
  private bars: number;
  private beatDuration: number;  // 1拍の長さ（秒）
  private barDuration: number;   // 1小節の長さ（秒）
  private loopDuration: number;  // ループ全体の長さ（秒）
  
  private isRunning = false;
  private startTime = 0;
  private pauseTime = 0;
  private lastBeat = -1;
  private beatCallbacks: BeatCallback[] = [];
  private animationFrameId: number | null = null;
  
  constructor(options: TimelineOptions) {
    this.bpm = options.bpm;
    this.timeSig = options.timeSig;
    this.bars = options.bars;
    
    // 時間計算
    this.beatDuration = 60 / this.bpm;
    this.barDuration = this.beatDuration * this.timeSig;
    this.loopDuration = this.barDuration * this.bars;
  }
  
  /**
   * タイムライン開始
   * @param audioContextTime AudioContextの時刻（BGMと同期用）
   */
  start(audioContextTime?: number): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = audioContextTime ?? performance.now() / 1000;
    this.lastBeat = -1;
    this.tick();
  }
  
  /**
   * タイムライン停止
   */
  stop(): void {
    this.isRunning = false;
    this.pauseTime = 0;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * 一時停止
   */
  pause(): void {
    if (!this.isRunning) return;
    
    this.pauseTime = this.getCurrentTime() - this.startTime;
    this.stop();
  }
  
  /**
   * 一時停止から再開
   */
  resume(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = this.getCurrentTime() - this.pauseTime;
    this.tick();
  }
  
  /**
   * 拍コールバックを登録
   */
  onBeat(callback: BeatCallback): void {
    this.beatCallbacks.push(callback);
  }
  
  /**
   * 拍コールバックを削除
   */
  offBeat(callback: BeatCallback): void {
    const index = this.beatCallbacks.indexOf(callback);
    if (index > -1) {
      this.beatCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 現在の経過時間を取得（秒）
   */
  getElapsedTime(): number {
    if (!this.isRunning) return this.pauseTime;
    return this.getCurrentTime() - this.startTime;
  }
  
  /**
   * 現在のループ内進行率を取得 (0-1)
   */
  getProgress(): number {
    const elapsed = this.getElapsedTime();
    return (elapsed % this.loopDuration) / this.loopDuration;
  }
  
  /**
   * 現在の小節内進行率を取得 (0-1)
   */
  getBarProgress(): number {
    const elapsed = this.getElapsedTime();
    const barTime = elapsed % this.barDuration;
    return barTime / this.barDuration;
  }
  
  /**
   * 現在の小節番号を取得 (0ベース)
   */
  getCurrentBar(): number {
    const progress = this.getProgress();
    return Math.floor(progress * this.bars);
  }
  
  /**
   * 現在の拍番号を取得 (0ベース、小節内)
   */
  getCurrentBeat(): number {
    const barProgress = this.getBarProgress();
    return Math.floor(barProgress * this.timeSig);
  }
  
  /**
   * 現在のループ回数を取得 (0ベース)
   */
  getLoopCount(): number {
    const elapsed = this.getElapsedTime();
    return Math.floor(elapsed / this.loopDuration);
  }
  
  /**
   * 判定タイミングかどうかチェック
   * @param targetRatio 目標位置 (0.8 = 80%)
   * @param windowMs 判定窓の幅（ミリ秒）
   */
  isJudgmentTiming(targetRatio: number, windowMs: number): boolean {
    const barProgress = this.getBarProgress();
    const targetTime = targetRatio * this.barDuration;
    const currentBarTime = barProgress * this.barDuration;
    const windowSec = windowMs / 1000;
    
    return Math.abs(currentBarTime - targetTime) <= windowSec / 2;
  }
  
  /**
   * 次の判定タイミングまでの時間を取得（秒）
   * @param targetRatio 目標位置 (0.8 = 80%)
   */
  getTimeToNextJudgment(targetRatio: number): number {
    const barProgress = this.getBarProgress();
    const targetProgress = targetRatio;
    
    if (barProgress < targetProgress) {
      // 同じ小節内
      return (targetProgress - barProgress) * this.barDuration;
    } else {
      // 次の小節
      return ((1 - barProgress) + targetProgress) * this.barDuration;
    }
  }
  
  /**
   * 指定時刻の小節・拍を取得
   */
  getBarBeatAtTime(time: number): { bar: number; beat: number; beatProgress: number } {
    const loopTime = time % this.loopDuration;
    const bar = Math.floor(loopTime / this.barDuration);
    const barTime = loopTime % this.barDuration;
    const beat = Math.floor(barTime / this.beatDuration);
    const beatProgress = (barTime % this.beatDuration) / this.beatDuration;
    
    return { bar, beat, beatProgress };
  }
  
  /**
   * メインループ
   */
  private tick = (): void => {
    if (!this.isRunning) return;
    
    const elapsed = this.getElapsedTime();
    const totalBeats = Math.floor(elapsed / this.beatDuration);
    
    // 新しい拍に入った場合
    if (totalBeats > this.lastBeat) {
      this.lastBeat = totalBeats;
      
      const loopBeats = totalBeats % (this.bars * this.timeSig);
      const barIdx = Math.floor(loopBeats / this.timeSig);
      const beatIdx = loopBeats % this.timeSig;
      
      // コールバック実行
      this.beatCallbacks.forEach(callback => {
        callback(barIdx, beatIdx, elapsed);
      });
    }
    
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
  
  /**
   * 現在時刻を取得（AudioContext時刻またはperformance.now）
   */
  private getCurrentTime(): number {
    // AudioContextが渡されている場合はその時刻を使用
    // そうでない場合はperformance.nowを使用
    return performance.now() / 1000;
  }
  
  /**
   * BPMを取得
   */
  getBpm(): number {
    return this.bpm;
  }
  
  /**
   * 拍子を取得
   */
  getTimeSig(): number {
    return this.timeSig;
  }
  
  /**
   * 小節数を取得
   */
  getBars(): number {
    return this.bars;
  }
  
  /**
   * 1拍の長さを取得（秒）
   */
  getBeatDuration(): number {
    return this.beatDuration;
  }
  
  /**
   * 1小節の長さを取得（秒）
   */
  getBarDuration(): number {
    return this.barDuration;
  }
}

export default Timeline;