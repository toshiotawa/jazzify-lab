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
  /* リズムモード用: 指定された小節・拍の時刻を取得 (ms) */
  getTimingForMeasureBeat: (measure: number, beat: number) => number | null
  /* リズムモード用: 現在時刻から最も近い判定タイミングを取得 */
  getNearestJudgmentTiming: (currentTime: number, timings: Array<{measure: number, beat: number}>) => {timing: {measure: number, beat: number}, timeMs: number} | null
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
  getTimingForMeasureBeat: (measure, beat) => {
    const s = get()
    if (s.startAt === null) return null
    
    const msecPerBeat = 60000 / s.bpm
    
    // カウントイン考慮した実際の小節番号を計算
    // measure は表示小節番号（カウントイン後を1とする）
    const actualMeasure = s.countInMeasures + measure - 1
    
    // その小節・拍までの総拍数
    const totalBeats = actualMeasure * s.timeSignature + (beat - 1)
    
    // 時刻を計算
    return s.startAt + s.readyDuration + totalBeats * msecPerBeat
  },
  getNearestJudgmentTiming: (currentTime, timings) => {
    const s = get()
    if (s.startAt === null || timings.length === 0) return null
    
    let nearestTiming = null
    let nearestTimeMs = 0
    let minDiff = Infinity
    
    // 現在のループ回数を計算
    const elapsed = currentTime - s.startAt - s.readyDuration
    const msecPerBeat = 60000 / s.bpm
    const msecPerMeasure = msecPerBeat * s.timeSignature
    const totalMsec = s.measureCount * msecPerMeasure
    const currentLoop = Math.floor(elapsed / totalMsec)
    
    // 現在のループと次のループで最も近いタイミングを探す
    for (let loop = currentLoop; loop <= currentLoop + 1; loop++) {
      for (const timing of timings) {
        const timeMs = s.getTimingForMeasureBeat(timing.measure, timing.beat)
        if (timeMs === null) continue
        
        // ループを考慮した実際の時刻
        const actualTimeMs = timeMs + loop * totalMsec
        const diff = Math.abs(actualTimeMs - currentTime)
        
        if (diff < minDiff) {
          minDiff = diff
          nearestTiming = timing
          nearestTimeMs = actualTimeMs
        }
      }
    }
    
    return nearestTiming ? { timing: nearestTiming, timeMs: nearestTimeMs } : null
  }
}))