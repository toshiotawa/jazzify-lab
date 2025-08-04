import { create } from 'zustand'

export type TimeState = {
  /* 開始時刻(ms)、Ready → Start タイマーのトリガ */
  startAt: number | null
  /* Ready 時間の長さ(ms) */
  readyDuration: number
  /* BPM、拍子、小節数 */
  bpm: number
  timeSignature: number /* 4/4 なら4 */
  measureCount: number /* ループ小節数 */
  /* イントロ/カウントイン小節数(Ready → Start 迄) */
  countInMeasures: number
  /* 現在の拍(1-timeSignature) と小節(1-measureCount) */
  currentBeat: number
  currentMeasure: number
  /* カウントイン中かどうか */
  isCountIn: boolean
  /* API */
  setStart: (
    bpm: number,
    timeSignature: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
  reset: () => void
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
        currentMeasure: 1,
        isCountIn: false // Ready中はカウントインでもない
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
        currentMeasure: -(s.countInMeasures - totalMeasures), // 負の値でカウントイン表示
        isCountIn: true
      })
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      
      // ループを考慮した表示用小節番号
      // 最初の1周目はそのまま表示、2周目以降でループ計算を適用
      let displayMeasure: number;
      if (measuresAfterCountIn < s.measureCount) {
        // 1周目：そのまま1から順番に表示
        displayMeasure = measuresAfterCountIn + 1;
      } else {
        // 2周目以降：ループ計算を適用
        displayMeasure = (measuresAfterCountIn % s.measureCount) + 1;
      }
      
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false
      })
    }
  },
  reset: () => {
    set({
      startAt: null,
      readyDuration: 2000,
      timeSignature: 4,
      bpm: 120,
      measureCount: 8,
      countInMeasures: 0,
      currentBeat: 1,
      currentMeasure: 1,
      isCountIn: false
    })
  }
}))