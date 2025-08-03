import { create } from 'zustand'

interface TimeState {
  /* ゲーム開始＝モンスター描画完了時刻 (ms) */
  startAt: number | null
  /* Ready フェーズ長(ms) – デフォルト 2 秒 */
  readyDuration: number
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
  /* 現在の連続的なbeats値を取得 */
  getCurrentBeats: () => number
  /* 任意の時刻でのbeats値を計算 */
  calculateBeats: (now: number) => number
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
  },
  getCurrentBeats: () => {
    const s = get()
    return s.calculateBeats(performance.now())
  },
  calculateBeats: (now: number) => {
    const s = get()
    if (s.startAt === null) return 0
    
    const elapsed = now - s.startAt
    
    /* Ready 中は 0 を返す */
    if (elapsed < s.readyDuration) {
      return 0
    }
    
    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    
    /* カウントイン分を差し引いて返す（メインループのbeats） */
    const countInBeats = s.countInMeasures * s.timeSignature
    const mainBeats = beatsFromStart - countInBeats
    
    // ループを考慮
    const totalLoopBeats = s.measureCount * s.timeSignature
    if (mainBeats >= 0) {
      return (mainBeats % totalLoopBeats) + 1 // 1ベースで返す
    } else {
      // カウントイン中はマイナス値
      return mainBeats
    }
  }
}))