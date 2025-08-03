import { create } from 'zustand'
import { bgmManager } from '@/utils/BGMManager'

// ===== タイミング定義の型 =====
interface ProgressionTiming {
  bar: number      // 小節番号
  beat: number     // ビート位置（小数点対応）
  chord: string    // コード名
}

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
  
  // ===== 拡張機能 =====
  /* 現在の小数点ビート（例: 4.5 = 4拍目のウラ） */
  currentBeatFraction: number
  /* プログレッションタイミング定義 */
  progressionTimings: ProgressionTiming[]
  /* NULL時間中かどうか */
  isNullPhase: boolean
  /* 次の出題タイミング（ビート） */
  nextQuestionBeat: number | null
  /* 判定受付開始/終了タイミング */
  acceptStartBeat: number | null
  acceptEndBeat: number | null
  /* 現在のコードインデックス */
  currentChordIndex: number
  
  /* setter 群 */
  setStart: (
    bpm: number,
    ts: number,
    measure: number,
    countIn: number,
    now?: number
  ) => void
  tick: () => void
  setProgressionTimings: (timings: ProgressionTiming[]) => void
  setNullPhase: (isNull: boolean) => void
  updateTimingState: () => void
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
  
  // 拡張状態
  currentBeatFraction: 1.0,
  progressionTimings: [],
  isNullPhase: false,
  nextQuestionBeat: null,
  acceptStartBeat: null,
  acceptEndBeat: null,
  currentChordIndex: 0,
  
  setStart: (bpm, ts, mc, ci, now = performance.now()) => {
    set({
      startAt: now,
      bpm,
      timeSignature: ts,
      measureCount: mc,
      countInMeasures: ci,
      currentBeat: 1,
      currentMeasure: 1,
      isCountIn: false,
      currentBeatFraction: 1.0,
      isNullPhase: false,
      currentChordIndex: 0
    })
    
    // BGMManagerのビートコールバックを登録
    bgmManager.removeBeatCallback(get().updateTimingState)
    bgmManager.addBeatCallback(get().updateTimingState)
  },
  
  tick: () => {
    const s = get()
    if (s.startAt === null) return
    const elapsed = performance.now() - s.startAt

    /* Ready 中は beat/measure を初期値に固定 */
    if (elapsed < s.readyDuration) {
      set({
        currentBeat: 1,
        currentMeasure: 1,
        currentBeatFraction: 1.0
      })
      return
    }

    // BGMManagerから正確なビート情報を取得
    const beatFraction = bgmManager.getCurrentBeatFraction()
    const measure = bgmManager.getCurrentMeasure()
    
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
        currentBeatFraction: beatFraction || currentBeatInMeasure,
        isCountIn: true
      })
    } else {
      // メイン部分（カウントイン後）
      const measuresAfterCountIn = totalMeasures - s.countInMeasures
      const displayMeasure = (measuresAfterCountIn % s.measureCount) + 1
      
      set({
        currentBeat: currentBeatInMeasure,
        currentMeasure: displayMeasure, // カウントイン後を1から表示
        currentBeatFraction: beatFraction || currentBeatInMeasure,
        isCountIn: false
      })
    }
    
    // タイミング状態を更新
    s.updateTimingState()
  },
  
  setProgressionTimings: (timings) => {
    set({ progressionTimings: timings })
    get().updateTimingState()
  },
  
  setNullPhase: (isNull) => {
    set({ isNullPhase: isNull })
  },
  
  updateTimingState: () => {
    const s = get()
    if (s.progressionTimings.length === 0 || s.isCountIn) return
    
    const currentBeat = s.currentBeatFraction
    const currentMeasure = s.currentMeasure
    
    // 現在のタイミングに基づいて次の出題タイミングを計算
    let nextTiming: ProgressionTiming | null = null
    let currentIndex = -1
    
    // 現在の位置から次のタイミングを探す
    for (let i = 0; i < s.progressionTimings.length; i++) {
      const timing = s.progressionTimings[i]
      const timingBeat = timing.beat
      const timingMeasure = timing.bar
      
      // 同じ小節内で、現在のビートより後のタイミング
      if (timingMeasure === currentMeasure && timingBeat > currentBeat) {
        nextTiming = timing
        currentIndex = i
        break
      }
      // 次の小節以降のタイミング
      else if (timingMeasure > currentMeasure) {
        nextTiming = timing
        currentIndex = i
        break
      }
    }
    
    // 見つからない場合は最初に戻る（ループ）
    if (!nextTiming && s.progressionTimings.length > 0) {
      nextTiming = s.progressionTimings[0]
      currentIndex = 0
    }
    
    if (nextTiming) {
      // 出題タイミング（デフォルト: 各タイミングの0.5拍前）
      const questionBeat = nextTiming.beat - 0.5
      
      // 判定受付タイミング（出題の0.5拍前から次の出題の0.5拍前まで）
      const acceptStart = Math.max(1, questionBeat - 0.5)
      
      // 次のタイミングを取得
      const nextIndex = (currentIndex + 1) % s.progressionTimings.length
      const nextNextTiming = s.progressionTimings[nextIndex]
      const acceptEnd = nextNextTiming ? nextNextTiming.beat - 0.51 : s.timeSignature + 0.49
      
      set({
        nextQuestionBeat: questionBeat,
        acceptStartBeat: acceptStart,
        acceptEndBeat: acceptEnd,
        currentChordIndex: currentIndex
      })
    }
  }
}))