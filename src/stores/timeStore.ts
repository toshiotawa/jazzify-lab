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
  /* ★追加: 精密なビート値を取得 */
  getPreciseBeat: () => number
  /* ★追加: ビート変更リスナー */
  onBeatChange: (callback: (beat: number, measure: number, preciseBeat: number) => void) => () => void
}

// ★追加: ビート変更リスナーのリスト
const beatListeners: Array<(beat: number, measure: number, preciseBeat: number) => void> = []

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
      const oldBeat = s.currentBeat
      const oldMeasure = s.currentMeasure
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: totalMeasures + 1, // カウントイン中の実際の小節番号
        isCountIn: true
      })
      
      // ★追加: ビート変更時にリスナーを呼ぶ
      if (oldBeat !== currentBeatInMeasure || oldMeasure !== totalMeasures + 1) {
        const preciseBeat = s.getPreciseBeat()
        beatListeners.forEach(cb => cb(currentBeatInMeasure, totalMeasures + 1, preciseBeat))
      }
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      
      const oldBeat = s.currentBeat
      const oldMeasure = s.currentMeasure
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        isCountIn: false
      })
      
      // ★追加: ビート変更時にリスナーを呼ぶ
      if (oldBeat !== currentBeatInMeasure || oldMeasure !== displayMeasure) {
        const preciseBeat = s.getPreciseBeat()
        beatListeners.forEach(cb => cb(currentBeatInMeasure, displayMeasure, preciseBeat))
      }
    }
  },
  // ★追加: 精密なビート値を取得（小数点含む）
  getPreciseBeat: () => {
    const s = get()
    if (s.startAt === null) return 1.0
    const elapsed = performance.now() - s.startAt
    
    if (elapsed < s.readyDuration) return 1.0
    
    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = (elapsed - s.readyDuration) / msecPerBeat
    const beatInMeasure = (beatsFromStart % s.timeSignature) + 1
    
    return beatInMeasure
  },
  // ★追加: ビート変更リスナーの登録/解除
  onBeatChange: (callback) => {
    beatListeners.push(callback)
    return () => {
      const index = beatListeners.indexOf(callback)
      if (index !== -1) beatListeners.splice(index, 1)
    }
  }
}))