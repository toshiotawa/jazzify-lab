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
  /* 現在のビート位置（小数点含む） */
  currentBeats: number
  /* setter 群 */
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
  /* 現在のビート位置を取得（小節番号.拍位置） */
  getCurrentBeats: () => number
  /* 次の出題タイミングまでの時間（ms）を取得 */
  getTimeToNextQuestion: (timeSignature: number) => number
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
  currentBeats: 0,
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
      currentBeats: 0
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
        currentBeats: 0
      })
      return
    }

    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat

    const totalMeasures = Math.floor(beatsFromStart / s.timeSignature)
    const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1
    const currentBeatFloored = Math.floor(currentBeatInMeasure)
    
    /* カウントイン中かどうかを判定 */
    if (totalMeasures < s.countInMeasures) {
      // カウントイン中
      set({
        currentBeat: currentBeatFloored,
        currentMeasure: totalMeasures + 1, // カウントイン中の実際の小節番号
        isCountIn: true,
        currentBeats: beatsFromStart
      })
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      const beatsAfterCountIn = beatsFromStart - (s.countInMeasures * s.timeSignature)
      
      set({
        currentBeat: currentBeatFloored,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false,
        currentBeats: beatsAfterCountIn
      })
    }
  },
  getCurrentBeats: () => {
    const s = get()
    if (s.startAt === null || s.isCountIn) return 0
    
    // カウントイン後の経過ビート数を返す
    return s.currentBeats
  },
  getTimeToNextQuestion: (timeSignature: number) => {
    const s = get()
    if (s.startAt === null) return 0
    
    const msecPerBeat = 60000 / s.bpm
    const currentBeatInMeasure = (s.currentBeats % timeSignature) + 1
    const nextQuestionBeat = timeSignature + 0.5 // 4拍子なら4.5拍目
    
    if (currentBeatInMeasure >= nextQuestionBeat) {
      // 次の小節の出題タイミングまで
      const beatsToNext = (timeSignature - currentBeatInMeasure) + nextQuestionBeat
      return beatsToNext * msecPerBeat
    } else {
      // 今の小節の出題タイミングまで
      const beatsToNext = nextQuestionBeat - currentBeatInMeasure
      return beatsToNext * msecPerBeat
    }
  }
}))