import { IAudioManager, TimeSignature } from '@/types/rhythmMode';

export class RhythmAudioManager implements IAudioManager {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;
  
  // ループ設定
  private loopStartTime = 0;
  private loopEndTime = 0;
  private hasLoopPoints = false;
  
  // クロスフェード用
  private fadeOutDuration = 0.05; // 50ms
  private fadeInDuration = 0.05;  // 50ms
  
  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.setupAudioHandlers();
  }
  
  private setupAudioHandlers(): void {
    // ループ処理
    this.audio.addEventListener('timeupdate', () => {
      if (this.hasLoopPoints && this.audio.currentTime >= this.loopEndTime - this.fadeOutDuration) {
        this.handleLoop();
      }
    });
    
    // エラーハンドリング
    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
    });
  }
  
  private async initializeAudioContext(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.gainNode = this.audioContext.createGain();
      
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  
  async loadSong(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audio.src = url;
      this.audio.load();
      
      this.audio.addEventListener('canplaythrough', () => {
        resolve();
      }, { once: true });
      
      this.audio.addEventListener('error', (e) => {
        reject(new Error(`Failed to load audio: ${e}`));
      }, { once: true });
    });
  }
  
  async play(): Promise<void> {
    await this.initializeAudioContext();
    
    // フェードイン
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.fadeInDuration);
    }
    
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }
  
  pause(): void {
    this.audio.pause();
  }
  
  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  
  getCurrentTime(): number {
    return this.audio.currentTime;
  }
  
  setLoopPoints(startMeasure: number, endMeasure: number, bpm: number, timeSignature: TimeSignature): void {
    const secondsPerBeat = 60 / bpm;
    const beatsPerMeasure = timeSignature;
    const secondsPerMeasure = secondsPerBeat * beatsPerMeasure;
    
    this.loopStartTime = (startMeasure - 1) * secondsPerMeasure;
    this.loopEndTime = endMeasure * secondsPerMeasure;
    this.hasLoopPoints = true;
  }
  
  private handleLoop(): void {
    if (!this.gainNode || !this.audioContext) return;
    
    // クロスフェードアウト
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(1, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + this.fadeOutDuration);
    
    // ループポイントへジャンプ
    setTimeout(() => {
      this.audio.currentTime = this.loopStartTime;
      
      // クロスフェードイン
      if (this.gainNode && this.audioContext) {
        const newTime = this.audioContext.currentTime;
        this.gainNode.gain.setValueAtTime(0, newTime);
        this.gainNode.gain.linearRampToValueAtTime(1, newTime + this.fadeInDuration);
      }
    }, this.fadeOutDuration * 1000);
  }
  
  isPlaying(): boolean {
    return !this.audio.paused;
  }
  
  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
  
  // 追加のユーティリティメソッド
  getDuration(): number {
    return this.audio.duration || 0;
  }
  
  // リソースのクリーンアップ
  dispose(): void {
    this.stop();
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
  }
}