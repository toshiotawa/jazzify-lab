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
}

export const useTimeStore = create<TimeState>((set, get) => ({
  startAt: null,
  readyDuration: 0, // 変更: カウントインを排除
  timeSignature: 4,
  bpm: 120,
  measureCount: 8,
  countInMeasures: 0, // 変更: 常に0
  currentBeat: 1,
  currentMeasure: 1,
  isCountIn: false,
  setStart: (bpm, ts, measure, countIn, now = performance.now()) =>
    set({
      startAt: now,
      bpm,
      timeSignature: ts,
      measureCount: measure,
      countInMeasures: 0, // 変更: countInを無視
      currentBeat: 1,
      currentMeasure: 1,
      isCountIn: false
    }),
  tick: () => {
    const s = get()
    if (s.startAt === null) return
    const elapsed = performance.now() - s.startAt

    // Ready中処理を削除（即座にメイン開始）

    const msecPerBeat = 60000 / s.bpm
    const beatsFromStart = Math.floor(elapsed / msecPerBeat)

    const totalMeasures = Math.floor(beatsFromStart / s.timeSignature)
    const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1

    // カウントインなしで直接メイン小節を計算（M1から開始）
    const displayMeasure = (totalMeasures % s.measureCount) + 1

    set({
      currentBeat: currentBeatInMeasure,
      currentMeasure: displayMeasure,
      isCountIn: false
    })
  }
}))