import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as Tone from 'tone';

interface RhythmState {
  // 基本情報
  isPlaying: boolean;
  currentTime: number;
  startTime: number | null;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  loopMeasures: number;
  
  // 現在の位置情報
  currentMeasure: number;
  currentBeat: number;
  
  // 音楽再生関連
  player: Tone.Player | null;
  
  // アクション
  initializeRhythm: (config: {
    bpm: number;
    timeSignature: number;
    measureCount: number;
    loopMeasures: number;
    mp3Url: string;
  }) => Promise<void>;
  
  startRhythm: () => void;
  stopRhythm: () => void;
  updateTime: () => void;
  getCurrentPosition: () => { measure: number; beat: number; beatFraction: number };
  cleanup: () => void;
}

export const useRhythmStore = create<RhythmState>()(
  subscribeWithSelector((set, get) => ({
    // 初期状態
    isPlaying: false,
    currentTime: 0,
    startTime: null,
    bpm: 120,
    timeSignature: 4,
    measureCount: 8,
    loopMeasures: 8,
    currentMeasure: 1,
    currentBeat: 1,
    player: null,
    
    // リズムの初期化
    initializeRhythm: async (config) => {
      const { mp3Url, bpm, timeSignature, measureCount, loopMeasures } = config;
      
      // 既存のプレイヤーをクリーンアップ
      const currentPlayer = get().player;
      if (currentPlayer) {
        currentPlayer.stop();
        currentPlayer.dispose();
      }
      
      // 新しいプレイヤーを作成
      const player = new Tone.Player({
        url: mp3Url,
        loop: true,
        onload: () => {
          // ループポイントを設定（2小節目から開始）
          const secondsPerBeat = 60 / bpm;
          const secondsPerMeasure = secondsPerBeat * timeSignature;
          const loopStart = secondsPerMeasure; // 2小節目の開始地点
          const loopEnd = secondsPerMeasure * loopMeasures;
          
          player.loopStart = loopStart;
          player.loopEnd = loopEnd;
        }
      }).toDestination();
      
      set({
        player,
        bpm,
        timeSignature,
        measureCount,
        loopMeasures,
        currentMeasure: 1,
        currentBeat: 1,
        currentTime: 0,
        startTime: null
      });
    },
    
    // リズムを開始
    startRhythm: async () => {
      const { player } = get();
      if (!player) return;
      
      await Tone.start();
      player.start();
      
      set({
        isPlaying: true,
        startTime: Tone.now()
      });
    },
    
    // リズムを停止
    stopRhythm: () => {
      const { player } = get();
      if (!player) return;
      
      player.stop();
      
      set({
        isPlaying: false,
        startTime: null,
        currentTime: 0,
        currentMeasure: 1,
        currentBeat: 1
      });
    },
    
    // 時間を更新
    updateTime: () => {
      const { isPlaying, startTime, bpm, timeSignature, loopMeasures } = get();
      if (!isPlaying || !startTime) return;
      
      const currentTime = Tone.now() - startTime;
      const secondsPerBeat = 60 / bpm;
      const secondsPerMeasure = secondsPerBeat * timeSignature;
      
      // カウント小節（1小節目）を考慮した計算
      let effectiveTime = currentTime;
      if (currentTime >= secondsPerMeasure) {
        // 1小節目を過ぎたらループ計算を開始
        const loopDuration = secondsPerMeasure * (loopMeasures - 1);
        effectiveTime = secondsPerMeasure + ((currentTime - secondsPerMeasure) % loopDuration);
      }
      
      const totalBeats = effectiveTime / secondsPerBeat;
      const currentMeasure = Math.floor(totalBeats / timeSignature) + 1;
      const currentBeat = Math.floor(totalBeats % timeSignature) + 1;
      
      set({
        currentTime,
        currentMeasure,
        currentBeat
      });
    },
    
    // 現在の正確な位置を取得
    getCurrentPosition: () => {
      const { currentTime, startTime, bpm, timeSignature, loopMeasures } = get();
      
      if (!startTime) {
        return { measure: 1, beat: 1, beatFraction: 0 };
      }
      
      const elapsedTime = currentTime;
      const secondsPerBeat = 60 / bpm;
      const secondsPerMeasure = secondsPerBeat * timeSignature;
      
      // カウント小節（1小節目）を考慮した計算
      let effectiveTime = elapsedTime;
      let actualMeasure = 1;
      
      if (elapsedTime >= secondsPerMeasure) {
        // 1小節目を過ぎたらループ計算を開始
        const loopDuration = secondsPerMeasure * (loopMeasures - 1);
        const timeInLoop = (elapsedTime - secondsPerMeasure) % loopDuration;
        effectiveTime = timeInLoop;
        actualMeasure = 2; // 2小節目から開始
      }
      
      const totalBeats = effectiveTime / secondsPerBeat;
      const measureInLoop = Math.floor(totalBeats / timeSignature);
      const beat = (totalBeats % timeSignature);
      const beatInt = Math.floor(beat) + 1;
      const beatFraction = beat - Math.floor(beat);
      
      return {
        measure: actualMeasure + measureInLoop,
        beat: beatInt,
        beatFraction
      };
    },
    
    // クリーンアップ
    cleanup: () => {
      const { player } = get();
      if (player) {
        player.stop();
        player.dispose();
      }
      
      set({
        player: null,
        isPlaying: false,
        startTime: null,
        currentTime: 0,
        currentMeasure: 1,
        currentBeat: 1
      });
    }
  }))
);