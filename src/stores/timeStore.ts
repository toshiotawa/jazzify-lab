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
  /* 正確な拍位置（小数点含む） */
  exactBeat: number
  /* 現在の経過時間（ms） */
  elapsedTime: number
  /* setter 群 */
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
  /* 現在の小節とビートの正確な位置を取得 */
  getExactPosition: () => { measure: number; beat: number }
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
  exactBeat: 1,
  elapsedTime: 0,
  setStart: (bpm, ts, mc, ci, now = performance.now()) =>
    set({
      startAt: now,
      bpm,
      timeSignature: ts,
      measureCount: mc,
      countInMeasures: ci,
      currentBeat: 1,
      currentMeasure: 1,
      isCountIn: false,
      exactBeat: 1,
      elapsedTime: 0
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
        exactBeat: 1,
        elapsedTime: elapsed
      })
      return
    }

    const msecPerBeat = 60000 / s.bpm
    const exactBeatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    const beatsFromStart = Math.floor(exactBeatsFromStart)

    const totalMeasures = Math.floor(beatsFromStart / s.timeSignature)
    const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1
    const exactBeatInMeasure = (exactBeatsFromStart % s.timeSignature) + 1
    
    /* カウントイン中かどうかを判定 */
    if (totalMeasures < s.countInMeasures) {
      // カウントイン中
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: totalMeasures + 1, // カウントイン中の実際の小節番号
        isCountIn: true,
        exactBeat: exactBeatInMeasure,
        elapsedTime: elapsed
      })
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false,
        exactBeat: exactBeatInMeasure,
        elapsedTime: elapsed
      })
    }
  },
  getExactPosition: () => {
    const s = get()
    if (s.startAt === null || s.elapsedTime < s.readyDuration) {
      return { measure: 1, beat: 1 }
    }
    
    const msecPerBeat = 60000 / s.bpm
    const exactBeatsFromStart = (s.elapsedTime - s.readyDuration) / msecPerBeat
    const totalBeats = exactBeatsFromStart
    
    const totalMeasures = Math.floor(totalBeats / s.timeSignature)
    const exactBeatInMeasure = (totalBeats % s.timeSignature) + 1
    
    if (totalMeasures < s.countInMeasures) {
      // Count-in phase
      return { measure: totalMeasures + 1, beat: exactBeatInMeasure }
    } else {
      // Main phase (after count-in)
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      return { measure: displayMeasure, beat: exactBeatInMeasure }
    }
  }
}))