/**
 * リズムモード用音楽管理システム
 * Web Audio APIを使用した正確な音楽同期と再生制御
 */

import { devLog } from './logger';
import { useGameStore } from '@/stores/gameStore';

export class RhythmMusicManager {
  private static instance: RhythmMusicManager | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  private loopStart: number = 0;
  private loopEnd: number = 0;
  
  private constructor() {}
  
  public static getInstance(): RhythmMusicManager {
    if (!this.instance) {
      this.instance = new RhythmMusicManager();
    }
    return this.instance;
  }
  
  /**
   * 音楽ファイルを読み込み
   */
  public async loadMusic(url: string): Promise<void> {
    try {
      // AudioContextの初期化
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      // 音楽ファイルの取得
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch music: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // ゲインノードの初期化
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      
      // 初期音量設定
      const musicVolume = useGameStore.getState().settings.musicVolume;
      this.setVolume(musicVolume);
      
      devLog.debug(`音楽ファイル読み込み完了: ${url}, 長さ: ${this.audioBuffer.duration}秒`);
    } catch (error) {
      devLog.error('音楽ファイル読み込みエラー:', error);
      throw error;
    }
  }
  
  /**
   * 音楽を再生開始
   * @param bpm テンポ
   * @param timeSignature 拍子
   * @param loopMeasures ループする小節数
   */
  public play(bpm: number, timeSignature: number, loopMeasures: number): void {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      devLog.error('音楽が初期化されていません');
      return;
    }
    
    // 既存の再生を停止
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    
    // 新しいソースノードを作成
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);
    
    // ループポイントの計算
    const beatDuration = 60 / bpm;
    const measureDuration = beatDuration * timeSignature;
    
    // 1小節目はカウント用なので、2小節目からループ
    this.loopStart = measureDuration;
    this.loopEnd = Math.min(measureDuration * loopMeasures, this.audioBuffer.duration);
    
    this.sourceNode.loop = true;
    this.sourceNode.loopStart = this.loopStart;
    this.sourceNode.loopEnd = this.loopEnd;
    
    // 再生開始
    this.sourceNode.start(0);
    this.startTime = this.audioContext.currentTime;
    this.isPlaying = true;
    
    devLog.debug(`音楽再生開始 - BPM: ${bpm}, 拍子: ${timeSignature}, ループ: ${this.loopStart}秒 ~ ${this.loopEnd}秒`);
  }
  
  /**
   * 音楽を停止
   */
  public stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    
    devLog.debug('音楽停止');
  }
  
  /**
   * 音楽を一時停止
   */
  public pause(): void {
    if (!this.isPlaying || !this.audioContext) return;
    
    this.pauseTime = this.audioContext.currentTime;
    this.stop();
    
    devLog.debug('音楽一時停止');
  }
  
  /**
   * 一時停止から再開
   */
  public resume(): void {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) return;
    
    const pausedDuration = this.pauseTime - this.startTime;
    
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.loop = true;
    this.sourceNode.loopStart = this.loopStart;
    this.sourceNode.loopEnd = this.loopEnd;
    
    // 一時停止した位置から再生
    this.sourceNode.start(0, pausedDuration);
    this.startTime = this.audioContext.currentTime - pausedDuration;
    this.isPlaying = true;
    
    devLog.debug('音楽再開');
  }
  
  /**
   * 現在の再生時間を取得（ループを考慮）
   */
  public getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) return 0;
    
    const elapsed = this.audioContext.currentTime - this.startTime;
    
    // ループを考慮した時間計算
    if (elapsed <= this.loopStart) {
      // まだ1小節目
      return elapsed;
    } else {
      // 2小節目以降（ループ中）
      const loopDuration = this.loopEnd - this.loopStart;
      const timeInLoop = (elapsed - this.loopStart) % loopDuration;
      return this.loopStart + timeInLoop;
    }
  }
  
  /**
   * 現在の小節と拍を取得
   */
  public getMeasureAndBeat(bpm: number, timeSignature: number): { measure: number; beat: number; beatProgress: number } {
    const currentTime = this.getCurrentTime();
    const beatDuration = 60 / bpm;
    // const measureDuration = beatDuration * timeSignature;
    
    const totalBeats = currentTime / beatDuration;
    const measure = Math.floor(totalBeats / timeSignature) + 1;
    const beatInMeasure = (totalBeats % timeSignature);
    const beat = Math.floor(beatInMeasure) + 1;
    const beatProgress = beatInMeasure % 1;
    
    return { measure, beat, beatProgress };
  }
  
  /**
   * 音量を設定
   */
  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  /**
   * 再生中かどうか
   */
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * クリーンアップ
   */
  public dispose(): void {
    this.stop();
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffer = null;
    
    devLog.debug('RhythmMusicManager破棄');
  }
  
  /**
   * シングルトンインスタンスをリセット
   */
  public static reset(): void {
    if (this.instance) {
      this.instance.dispose();
      this.instance = null;
    }
  }
}