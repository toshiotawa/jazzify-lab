import { create } from 'zustand'

interface TimeStateExtended {
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
  /* 現在の拍(1-timeSignature) - 小数点対応 */
  currentBeat: number
  /* 現在の小節(1-measureCount) */
  currentMeasure: number
  /* 小節内のビート位置（小数点含む） */
  beatInMeasure: number
  /* カウントイン中かどうか */
  isCountIn: boolean
  /* 累計ビート数（小数点含む） */
  totalBeats: number
  /* 次の出題タイミング（累計ビート） */
  nextChordBeat: number | null
  /* 判定受付終了タイミング（累計ビート） */
  judgmentDeadlineBeat: number | null
  /* 現在のコード（NULL期間は null） */
  currentChord: string | null
  /* setter 群 */
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
  updateFromBGM: (
    totalBeats: number,
    beatInMeasure: number,
    currentMeasure: number,
    isCountIn: boolean,
    nextChordBeat: number | null,
    judgmentDeadlineBeat: number | null,
    currentChord: string | null
  ) => void
}

export const useTimeStoreExtended = create<TimeStateExtended>((set, get) => ({
  startAt: null,
  readyDuration: 2000,
  timeSignature: 4,
  bpm: 120,
  measureCount: 8,
  countInMeasures: 0,
  currentBeat: 1,
  currentMeasure: 1,
  beatInMeasure: 1,
  isCountIn: false,
  totalBeats: 0,
  nextChordBeat: null,
  judgmentDeadlineBeat: null,
  currentChord: null,
  
  setStart: (bpm, ts, mc, ci, now = performance.now()) =>
    set({
      startAt: now,
      bpm,
      timeSignature: ts,
      measureCount: mc,
      countInMeasures: ci,
      currentBeat: 1,
      currentMeasure: 1,
      beatInMeasure: 1,
      isCountIn: false,
      totalBeats: 0,
      nextChordBeat: null,
      judgmentDeadlineBeat: null,
      currentChord: null
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
        beatInMeasure: 1,
        totalBeats: 0,
        isCountIn: false
      })
      return
    }

    const msecPerBeat = 60000 / s.bpm
    const totalBeats = (elapsed - s.readyDuration) / msecPerBeat
    
    const countInBeats = s.countInMeasures * s.timeSignature
    const isCountIn = totalBeats < countInBeats
    
    const playBeats = Math.max(0, totalBeats - countInBeats)
    const loopBeats = playBeats % (s.measureCount * s.timeSignature)
    
    const currentMeasure = Math.floor(loopBeats / s.timeSignature) + 1
    const beatInMeasure = (loopBeats % s.timeSignature) + 1
    
    // 整数部分のビート（表示用）
    const currentBeat = Math.floor(beatInMeasure)
    
    set({
      currentBeat,
      currentMeasure: isCountIn ? -currentMeasure : currentMeasure,
      beatInMeasure,
      isCountIn,
      totalBeats
    })
  },
  
  updateFromBGM: (
    totalBeats,
    beatInMeasure,
    currentMeasure,
    isCountIn,
    nextChordBeat,
    judgmentDeadlineBeat,
    currentChord
  ) => {
    set({
      totalBeats,
      beatInMeasure,
      currentBeat: Math.floor(beatInMeasure),
      currentMeasure,
      isCountIn,
      nextChordBeat,
      judgmentDeadlineBeat,
      currentChord
    })
  }
}))