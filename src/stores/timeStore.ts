import { create } from 'zustand';

interface TimeState {
  startTime: number | null; // ゲームのロジック上の開始時刻 (performance.now())
  currentTime: number; // ゲーム開始からの経過時間 (秒)
  isPlaying: boolean;
  
  // BGM情報
  bpm: number;
  timeSignature: number; // 拍子 (例: 4 for 4/4)
  measureCount: number; // 1ループの小節数
  countInMeasures: number;

  // 計算された時間情報
  currentMeasure: number; // UI表示用の小節番号
  currentBeat: number; // UI表示用の拍番号
  isCountIn: boolean; // カウントイン中かどうかのフラグ

  // 既存のクイズモード用（互換性のため残す）
  readyDuration: number;
  startAt: number | null;

  // アクション
  start: (
    bpm: number,
    timeSignature: number,
    measureCount: number,
    countInMeasures: number
  ) => void;
  stop: () => void;
  updateTime: (elapsedSeconds: number) => void;
  
  // 既存のクイズモード用（互換性のため残す）
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void;
  tick: () => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  startTime: null,
  currentTime: 0,
  isPlaying: false,
  bpm: 120,
  timeSignature: 4,
  measureCount: 8,
  countInMeasures: 1,
  currentMeasure: 1,
  currentBeat: 1,
  isCountIn: false,
  
  // 既存のクイズモード用
  startAt: null,
  readyDuration: 2000,

  start: (bpm, timeSignature, measureCount, countInMeasures) => {
    set({
      startTime: performance.now(),
      currentTime: 0,
      isPlaying: true,
      bpm,
      timeSignature,
      measureCount,
      countInMeasures,
      isCountIn: true,
      currentBeat: 1,
      currentMeasure: 1, // カウントイン中は実際の小節番号
    });
  },

  stop: () => {
    set({ isPlaying: false, startTime: null, currentTime: 0 });
  },

  updateTime: (elapsedSeconds) => {
    const { bpm, timeSignature, measureCount, countInMeasures } = get();
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = secondsPerBeat * timeSignature;
    const countInDuration = secondsPerMeasure * countInMeasures;

    const isCountIn = elapsedSeconds < countInDuration;

    if (isCountIn) {
      const totalBeatsInCountIn = Math.floor(elapsedSeconds / secondsPerBeat);
      const measureInCountIn = Math.floor(totalBeatsInCountIn / timeSignature) + 1;
      const beatInMeasure = (totalBeatsInCountIn % timeSignature) + 1;
      set({
        currentTime: elapsedSeconds,
        isCountIn,
        currentMeasure: measureInCountIn, // 実際のカウントイン小節番号 (1, 2, ...)
        currentBeat: beatInMeasure,
      });
    } else {
      const mainPartSeconds = elapsedSeconds - countInDuration;
      const totalBeatsInMain = Math.floor(mainPartSeconds / secondsPerBeat);
      const measuresInMain = Math.floor(totalBeatsInMain / timeSignature);
      const displayMeasure = (measuresInMain % measureCount) + 1;
      const beatInMeasure = (totalBeatsInMain % timeSignature) + 1;
      set({
        currentTime: elapsedSeconds,
        isCountIn,
        currentMeasure: displayMeasure, // 1から始まる表示用の小節番号
        currentBeat: beatInMeasure,
      });
    }
  },
  
  // 既存のクイズモード用（互換性のため残す）
  setStart: (bpm, ts, mc, ci, now = performance.now()) =>
    set({
      startAt: now,
      bpm,
      timeSignature: ts,
      measureCount: mc,
      countInMeasures: ci,
      currentBeat: 1,
      currentMeasure: 1,
      isCountIn: false
    }),
    
  tick: () => {
    const s = get();
    if (s.startAt === null) return;
    const elapsed = performance.now() - s.startAt;

    /* Ready 中は beat/measure を初期値に固定 */
    if (elapsed < s.readyDuration) {
      set({
        currentBeat: 1,
        currentMeasure: 1
      });
      return;
    }

    const msecPerBeat = 60000 / s.bpm;
    const beatsFromStart = Math.floor(
      (elapsed - s.readyDuration) / msecPerBeat
    );

    const totalMeasures = Math.floor(beatsFromStart / s.timeSignature);
    const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1;
    
    /* カウントイン中かどうかを判定 */
    if (totalMeasures < s.countInMeasures) {
      // カウントイン中
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: totalMeasures + 1, // カウントイン中の実際の小節番号
        isCountIn: true
      });
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures;
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1;
      
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false
      });
    }
  }
}));