/**
 * LoopingBgmPlayer
 * リズムモード用のBGMループ再生クラス
 * - 指定された小節数でループ
 * - クロスフェード機能でシームレスな再生
 */

export interface MusicMeta {
  bpm: number;      // BPM (例: 120)
  timeSig: number;  // 拍子 (3 または 4)
  bars: number;     // 小節数 (例: 32)
}

export class LoopingBgmPlayer {
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNodes: AudioBufferSourceNode[] = [];
  private gainNodes: GainNode[] = [];
  private masterGain: GainNode;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private loopDuration = 0;
  private crossfadeMs = 100;
  private currentSourceIndex = 0;
  
  constructor(
    private audioUrl: string,
    private musicMeta: MusicMeta,
    crossfadeMs = 100
  ) {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.crossfadeMs = crossfadeMs;
    
    // ループ時間を計算 (秒)
    const beatDuration = 60 / musicMeta.bpm;
    const barDuration = beatDuration * musicMeta.timeSig;
    this.loopDuration = barDuration * musicMeta.bars;
  }
  
  /**
   * 音声ファイルをロード
   */
  async load(): Promise<void> {
    try {
      const response = await fetch(this.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 2つのソースノードとゲインノードを準備（クロスフェード用）
      for (let i = 0; i < 2; i++) {
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);
        this.gainNodes.push(gainNode);
      }
    } catch (error) {
      console.error('Failed to load BGM:', error);
      throw error;
    }
  }
  
  /**
   * 再生開始
   */
  start(): void {
    if (!this.audioBuffer || this.isPlaying) return;
    
    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime - this.pauseTime;
    this.scheduleNextLoop();
  }
  
  /**
   * 再生停止
   */
  stop(): void {
    this.isPlaying = false;
    this.sourceNodes.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // 既に停止している場合は無視
      }
    });
    this.sourceNodes = [];
    this.pauseTime = 0;
  }
  
  /**
   * 一時停止
   */
  pause(): void {
    if (!this.isPlaying) return;
    
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.stop();
  }
  
  /**
   * 音量設定 (0-1)
   */
  setVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * 現在の再生位置を取得 (0-1)
   */
  getProgress(): number {
    if (!this.isPlaying) return 0;
    
    const elapsed = this.audioContext.currentTime - this.startTime;
    return (elapsed % this.loopDuration) / this.loopDuration;
  }
  
  /**
   * 現在の小節番号を取得 (0ベース)
   */
  getCurrentBar(): number {
    const progress = this.getProgress();
    return Math.floor(progress * this.musicMeta.bars);
  }
  
  /**
   * 現在の拍番号を取得 (0ベース)
   */
  getCurrentBeat(): number {
    const progress = this.getProgress();
    const totalBeats = this.musicMeta.bars * this.musicMeta.timeSig;
    const currentBeat = Math.floor(progress * totalBeats);
    return currentBeat % this.musicMeta.timeSig;
  }
  
  /**
   * 次のループをスケジュール
   */
  private scheduleNextLoop(): void {
    if (!this.audioBuffer || !this.isPlaying) return;
    
    const now = this.audioContext.currentTime;
    const elapsed = now - this.startTime;
    const currentLoopStart = Math.floor(elapsed / this.loopDuration) * this.loopDuration;
    const nextLoopStart = currentLoopStart + this.loopDuration;
    
    // 次のソースノードを作成
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = false;
    
    const gainIndex = this.currentSourceIndex % 2;
    const gain = this.gainNodes[gainIndex];
    source.connect(gain);
    
    // クロスフェードの設定
    const crossfadeDuration = this.crossfadeMs / 1000;
    const fadeInStart = nextLoopStart + this.startTime - crossfadeDuration;
    const fadeOutStart = fadeInStart;
    
    // 現在のソースをフェードアウト
    if (this.sourceNodes.length > 0) {
      const prevGainIndex = (this.currentSourceIndex - 1 + 2) % 2;
      const prevGain = this.gainNodes[prevGainIndex];
      prevGain.gain.setValueAtTime(1, fadeOutStart);
      prevGain.gain.linearRampToValueAtTime(0, fadeOutStart + crossfadeDuration);
    }
    
    // 新しいソースをフェードイン
    gain.gain.setValueAtTime(0, fadeInStart);
    gain.gain.linearRampToValueAtTime(1, fadeInStart + crossfadeDuration);
    
    // 再生開始
    source.start(this.startTime + nextLoopStart, 0, this.loopDuration);
    this.sourceNodes.push(source);
    
    // 終了時に次のループをスケジュール
    source.onended = () => {
      const index = this.sourceNodes.indexOf(source);
      if (index > -1) {
        this.sourceNodes.splice(index, 1);
      }
      if (this.isPlaying) {
        this.scheduleNextLoop();
      }
    };
    
    this.currentSourceIndex++;
    
    // 初回再生の場合はすぐに開始
    if (this.currentSourceIndex === 1) {
      const firstSource = this.audioContext.createBufferSource();
      firstSource.buffer = this.audioBuffer;
      firstSource.loop = false;
      
      const firstGain = this.gainNodes[0];
      firstSource.connect(firstGain);
      firstGain.gain.value = 1;
      
      firstSource.start(this.startTime, 0, this.loopDuration);
      this.sourceNodes.push(firstSource);
      
      firstSource.onended = () => {
        const index = this.sourceNodes.indexOf(firstSource);
        if (index > -1) {
          this.sourceNodes.splice(index, 1);
        }
      };
    }
  }
  
  /**
   * AudioContextを取得
   */
  getAudioContext(): AudioContext {
    return this.audioContext;
  }
  
  /**
   * 開始時刻を取得（Timeline同期用）
   */
  getStartTime(): number {
    return this.startTime;
  }
}

export default LoopingBgmPlayer;