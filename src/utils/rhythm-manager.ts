/**
 * リズムモード用のBGMとタイミング管理
 */

import { devLog } from './logger';

export interface RhythmConfig {
  bpm: number;
  timeSignature: number; // 3 or 4
  measureCount: number; // ループする小節数
  bgmUrl?: string;
}

export interface TimingInfo {
  currentMeasure: number; // 現在の小節（1から開始）
  currentBeat: number; // 現在の拍（1から開始、1.5は1拍目の裏）
  measureProgress: number; // 小節内の進行度（0-1）
  totalProgress: number; // 全体の進行度（0-1）
}

export class RhythmManager {
  private config: RhythmConfig;
  private audio: HTMLAudioElement | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private onTimingUpdate?: (timing: TimingInfo) => void;
  private volume: number = 1.0;

  constructor(config: RhythmConfig) {
    this.config = config;
  }

  /**
   * BGMをロードして準備する
   */
  async loadBGM(): Promise<void> {
    if (!this.config.bgmUrl) {
      devLog.debug('BGM URL not provided, skipping load');
      return;
    }

    try {
      this.audio = new Audio(this.config.bgmUrl);
      this.audio.loop = false; // 手動でループ管理
      this.audio.volume = this.volume;
      
      // プリロード
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not created'));
          return;
        }
        
        this.audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        this.audio.addEventListener('error', (e) => reject(e), { once: true });
        this.audio.load();
      });

      devLog.debug('✅ BGM loaded successfully:', this.config.bgmUrl);
    } catch (error) {
      devLog.error('❌ Failed to load BGM:', error);
      throw error;
    }
  }

  /**
   * 音量を設定
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * BGMを開始（Readyフェーズ後）
   */
  start(): void {
    if (!this.audio || this.isPlaying) return;

    this.startTime = performance.now();
    this.isPlaying = true;
    
    // BGMを再生
    this.audio.currentTime = 0;
    this.audio.play().catch(error => {
      devLog.error('❌ Failed to play BGM:', error);
    });

    // タイミング更新ループ開始
    this.updateLoop();
    
    devLog.debug('🎵 Rhythm started at:', this.startTime);
  }

  /**
   * BGMを停止
   */
  stop(): void {
    this.isPlaying = false;
    
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    devLog.debug('🛑 Rhythm stopped');
  }

  /**
   * タイミングコールバックを設定
   */
  onUpdate(callback: (timing: TimingInfo) => void): void {
    this.onTimingUpdate = callback;
  }

  /**
   * 現在のタイミング情報を取得
   */
  getCurrentTiming(): TimingInfo {
    const elapsedMs = this.isPlaying ? performance.now() - this.startTime : 0;
    const elapsedSeconds = elapsedMs / 1000;
    
    const beatDuration = 60 / this.config.bpm; // 1拍の長さ（秒）
    const measureDuration = beatDuration * this.config.timeSignature; // 1小節の長さ（秒）
    const totalDuration = measureDuration * this.config.measureCount; // 全体の長さ（秒）
    
    // ループを考慮した経過時間
    const loopedTime = elapsedSeconds % totalDuration;
    
    // 現在の小節と拍を計算
    const currentMeasureFloat = loopedTime / measureDuration;
    const currentMeasure = Math.floor(currentMeasureFloat) + 1; // 1から開始
    const measureProgress = currentMeasureFloat % 1;
    
    const currentBeatFloat = measureProgress * this.config.timeSignature;
    const currentBeat = currentBeatFloat + 1; // 1から開始（小数点で裏拍を表現）
    
    return {
      currentMeasure,
      currentBeat,
      measureProgress,
      totalProgress: loopedTime / totalDuration
    };
  }

  /**
   * 特定のタイミングまでの時間を計算（ミリ秒）
   */
  getTimeToTiming(targetMeasure: number, targetBeat: number): number {
    if (!this.isPlaying) return -1;
    
    const currentTiming = this.getCurrentTiming();
    const beatDuration = 60 / this.config.bpm;
    const measureDuration = beatDuration * this.config.timeSignature;
    
    // 現在の絶対位置（秒）
    const currentAbsoluteTime = (currentTiming.currentMeasure - 1) * measureDuration + 
                                (currentTiming.currentBeat - 1) * beatDuration;
    
    // ターゲットの絶対位置（秒）
    let targetAbsoluteTime = (targetMeasure - 1) * measureDuration + 
                            (targetBeat - 1) * beatDuration;
    
    // 現在より前の場合は次のループで計算
    if (targetAbsoluteTime <= currentAbsoluteTime) {
      targetAbsoluteTime += measureDuration * this.config.measureCount;
    }
    
    return (targetAbsoluteTime - currentAbsoluteTime) * 1000; // ミリ秒に変換
  }

  /**
   * 判定タイミングかどうかをチェック（前後の許容範囲付き）
   */
  isJudgmentTiming(targetMeasure: number, targetBeat: number, toleranceMs: number = 200): boolean {
    const timeToTarget = this.getTimeToTiming(targetMeasure, targetBeat);
    return Math.abs(timeToTarget) <= toleranceMs;
  }

  private updateLoop(): void {
    if (!this.isPlaying) return;
    
    const timing = this.getCurrentTiming();
    
    // BGMのループ処理
    if (this.audio && this.audio.currentTime >= this.audio.duration * 0.99) {
      this.audio.currentTime = 0;
      this.audio.play().catch(error => {
        devLog.error('❌ Failed to loop BGM:', error);
      });
    }
    
    // コールバック呼び出し
    if (this.onTimingUpdate) {
      this.onTimingUpdate(timing);
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.updateLoop());
  }

  /**
   * リソースのクリーンアップ
   */
  dispose(): void {
    this.stop();
    this.audio = null;
    this.onTimingUpdate = undefined;
  }
}