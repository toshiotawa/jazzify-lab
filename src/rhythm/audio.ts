import { useRhythmStore } from './store';
import * as Tone from 'tone';

export class RhythmAudioController {
  private player: Tone.Player | null = null;
  private countInPlayer: Tone.Player | null = null;
  
  constructor() {
    // カウントイン用のクリック音を生成
    this.countInPlayer = new Tone.Player({
      url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAABAAAAAAAAAJwI',
      volume: -10
    }).toDestination();
  }
  
  async loadAndPlay(url: string): Promise<void> {
    await Tone.start(); // unlock AudioContext
    
    const state = useRhythmStore.getState();
    const measureLen = (60 / state.bpm) * state.timeSig;
    
    // 楽曲プレイヤーを初期化
    this.player = new Tone.Player({
      url,
      onload: () => {
        console.log('Audio loaded:', url);
      }
    }).toDestination();
    
    // プレイヤーのロードを待つ
    await Tone.loaded();
    
    // ループ設定
    if (this.player) {
      this.player.loopStart = measureLen; // 2小節目から
      this.player.loopEnd = measureLen * state.loopMeasures;
      this.player.loop = true;
      
      // 1小節分のカウントインの後に楽曲開始
      this.startWithCountIn(measureLen);
    }
  }
  
  private async startWithCountIn(measureLen: number): Promise<void> {
    const state = useRhythmStore.getState();
    const beatInterval = measureLen / state.timeSig;
    
    // カウントイン（1小節分）
    const now = Tone.now();
    for (let i = 0; i < state.timeSig; i++) {
      this.countInPlayer?.start(now + i * beatInterval);
    }
    
    // 楽曲開始時刻を設定
    const musicStartTime = now + measureLen;
    this.player?.start(musicStartTime);
    
    // ストアの開始時刻を更新
    useRhythmStore.setState({ 
      playing: true, 
      startAt: musicStartTime,
      measureLen
    });
  }
  
  stop(): void {
    this.player?.stop();
    this.player?.dispose();
    this.player = null;
    useRhythmStore.getState().reset();
  }
  
  dispose(): void {
    this.stop();
    this.countInPlayer?.dispose();
    this.countInPlayer = null;
  }
}