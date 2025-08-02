import { create } from 'zustand'

interface TimeState {
  /* ゲーム開始＝モンスター描画完了時刻 (ms) */
  startAt: number | null
  /* Ready フェーズ長(ms) – デフォルト 2 秒 */
  readyDuration: number
  /* Helper: get current beat timing info */
  getBeatWindow: (nowMs?: number) => { 
    barIndex: number; 
    beatIndex: number; 
    msIntoBeat: number; 
    msIntoBar: number; 
    barStartMs: number; 
    msecPerBeat: number;
    msecPerBar: number;
  } | null
  /* 拍子(4=4/4, 3/4 なら 3) */
  timeSignature: number
  /* BPM */
  bpm: number
  /* 全小節数(ループ終端) */
  measureCount: number
  /* イントロ/カウントイン小節数(Ready → Start 迄) */
  countInMeasures: number
  /* 現在の拍(1-timeSignature) と小節(1-measureCount) */
  currentBeat: number
  currentMeasure: number
  /* カウントイン中かどうか */
  isCountIn: boolean
  /* setter 群 */
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
}

export const useTimeStore = create<TimeState>((set, get) => ({
  startAt: null,
  readyDuration: 2000,
  timeSignature: 4,
  bpm: 120,
  measureCount: 8,
  countInMeasures: 0,
  currentBeat: 1,
  currentMeasure: 1,
  isCountIn: false,
  getBeatWindow: (nowMs = performance.now()) => {
    const s = get()
    if (s.startAt === null) return null
    
    const elapsed = nowMs - s.startAt
    if (elapsed < s.readyDuration) return null
    
    const gameElapsed = elapsed - s.readyDuration
    const msecPerBeat = 60000 / s.bpm
    const msecPerBar = msecPerBeat * s.timeSignature
    
    const totalBars = Math.floor(gameElapsed / msecPerBar)
    const barIndex = totalBars - s.countInMeasures
    const msIntoBar = gameElapsed % msecPerBar
    const beatIndex = Math.floor(msIntoBar / msecPerBeat)
    const msIntoBeat = msIntoBar % msecPerBeat
    const barStartMs = s.startAt + s.readyDuration + (totalBars * msecPerBar)
    
    return {
      barIndex,
      beatIndex,
      msIntoBeat,
      msIntoBar,
      barStartMs,
      msecPerBeat,
      msecPerBar
    }
  },
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
    const s = get()
    if (s.startAt === null) return
    const elapsed = performance.now() - s.startAt

    /* Ready 中は beat/measure を初期値に固定 */
    if (elapsed < s.readyDuration) {
      set({
        currentBeat: 1,
        currentMeasure: 1
      })
      return
    }

    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = Math.floor(
      (elapsed - s.readyDuration) / msecPerBeat
    )

    const totalMeasures = Math.floor(beatsFromStart / s.timeSignature)
    const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1
    
    /* カウントイン中かどうかを判定 */
    if (totalMeasures < s.countInMeasures) {
      // カウントイン中
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: totalMeasures + 1, // カウントイン中の実際の小節番号
        isCountIn: true
      })
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false
      })
    }
  }
}))