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
  /* 現在の精密な拍位置 (例: 4.50 = 4拍目のウラ) */
  currentBeatDecimal: number
  /* setter 群 */
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
  /* 現在の拍位置を小数点付きで取得 (例: 3.75 = 3拍目の16分音符3つ目) */
  getCurrentBeatDecimal: () => number
  /* 指定された拍位置までの時間を計算 (ms) */
  getTimeUntilBeat: (targetBeat: number, targetMeasure?: number) => number | null
  /* 次の小節の指定拍位置までの時間を計算 (ms) */
  getTimeUntilNextMeasureBeat: (targetBeat: number) => number | null
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
  currentBeatDecimal: 1.0,
  
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
      currentBeatDecimal: 1.0
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
        currentBeatDecimal: 1.0
      })
      return
    }

    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    const totalBeatsInt = Math.floor(beatsFromStart)
    const beatFraction = beatsFromStart - totalBeatsInt

    const totalMeasures = Math.floor(totalBeatsInt / s.timeSignature)
    const currentBeatInMeasure = (totalBeatsInt % s.timeSignature) + 1
    const currentBeatDecimal = currentBeatInMeasure + beatFraction
    
    /* カウントイン中かどうかを判定 */
    if (totalMeasures < s.countInMeasures) {
      // カウントイン中
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: totalMeasures + 1, // カウントイン中の実際の小節番号
        isCountIn: true,
        currentBeatDecimal
      })
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false,
        currentBeatDecimal
      })
    }
  },
  
  getCurrentBeatDecimal: () => {
    const s = get()
    if (s.startAt === null) return 1.0
    
    const elapsed = performance.now() - s.startAt
    if (elapsed < s.readyDuration) return 1.0
    
    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    const totalBeatsInt = Math.floor(beatsFromStart)
    const beatFraction = beatsFromStart - totalBeatsInt
    const currentBeatInMeasure = (totalBeatsInt % s.timeSignature) + 1
    
    return currentBeatInMeasure + beatFraction
  },
  
  getTimeUntilBeat: (targetBeat: number, targetMeasure?: number) => {
    const s = get()
    if (s.startAt === null) return null
    
    const elapsed = performance.now() - s.startAt
    if (elapsed < s.readyDuration) return null
    
    const msecPerBeat = 60000 / s.bpm
    const msecPerMeasure = msecPerBeat * s.timeSignature
    
    // 現在の絶対的な拍位置を計算
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    
    // ターゲット小節が指定されていない場合は現在の小節を使用
    const currentAbsoluteMeasure = Math.floor(beatsFromStart / s.timeSignature)
    const targetAbsoluteMeasure = targetMeasure !== undefined 
      ? (s.isCountIn ? targetMeasure - 1 : currentAbsoluteMeasure + (targetMeasure - s.currentMeasure))
      : currentAbsoluteMeasure
    
    // ターゲットの絶対的な拍位置を計算
    const targetAbsoluteBeats = targetAbsoluteMeasure * s.timeSignature + (targetBeat - 1)
    
    // 差分を計算
    const beatDifference = targetAbsoluteBeats - beatsFromStart
    
    // 時間に変換
    return beatDifference > 0 ? beatDifference * msecPerBeat : null
  },
  
  getTimeUntilNextMeasureBeat: (targetBeat: number) => {
    const s = get()
    if (s.startAt === null) return null
    
    const elapsed = performance.now() - s.startAt
    if (elapsed < s.readyDuration) return null
    
    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    const currentAbsoluteMeasure = Math.floor(beatsFromStart / s.timeSignature)
    
    // 次の小節の絶対的な拍位置を計算
    const nextMeasureAbsoluteBeats = (currentAbsoluteMeasure + 1) * s.timeSignature + (targetBeat - 1)
    
    // 差分を計算
    const beatDifference = nextMeasureAbsoluteBeats - beatsFromStart
    
    // 時間に変換
    return beatDifference > 0 ? beatDifference * msecPerBeat : null
  }
}))