import { create } from 'zustand'
import { bgmManager } from '@/utils/BGMManager'

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
    
    // BGMManagerの音楽時間を基準とする
    if (bgmManager.getIsPlaying()) {
      const musicTime = bgmManager.getCurrentMusicTime();
      const countInDuration = s.countInMeasures * (60 / s.bpm) * s.timeSignature;
      const totalTime = musicTime + countInDuration; // 実際の経過時間
      
      // Ready期間中
      if (totalTime < 0) {
        set({
          currentBeat: 1,
          currentMeasure: 1,
          isCountIn: true
        })
        return
      }
      
      const secPerBeat = 60 / s.bpm
      const beatsFromStart = Math.floor(totalTime / secPerBeat)
      const totalMeasures = Math.floor(beatsFromStart / s.timeSignature)
      const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1
      
      // 仮想小節計算: カウントイン除外
      const virtualMeasure = totalMeasures - s.countInMeasures
      
      /* カウントイン中かどうかを判定 */
      if (virtualMeasure < 0) {
        // カウントイン中（負の小節番号として表示）
        set({
          currentBeat: currentBeatInMeasure,
          currentMeasure: virtualMeasure, // 例: -1, 0
          isCountIn: true
        })
      } else {
        // メイン部分（カウントイン後）
        const displayMeasure = (virtualMeasure % s.measureCount) + 1
        
        set({
          currentBeat: currentBeatInMeasure,
          currentMeasure: displayMeasure, // 1から表示
          isCountIn: false
        })
      }
    } else {
      // BGMが再生されていない場合は、従来のperformance.now()ベース
      const elapsed = performance.now() - s.startAt

      /* Ready 中は beat/measure を初期値に固定 */
      if (elapsed < s.readyDuration) {
        set({
          currentBeat: 1,
          currentMeasure: 1,
          isCountIn: true
        })
        return
      }

      const msecPerBeat = 60000 / s.bpm
      const beatsFromStart = Math.floor(
        (elapsed - s.readyDuration) / msecPerBeat
      )

      const totalMeasures = Math.floor(beatsFromStart / s.timeSignature)
      const currentBeatInMeasure = (beatsFromStart % s.timeSignature) + 1
      
      // 仮想小節計算: カウントイン除外
      const virtualMeasure = totalMeasures - s.countInMeasures
      
      /* カウントイン中かどうかを判定 */
      if (virtualMeasure < 0) {
        // カウントイン中（負の小節番号として表示）
        set({
          currentBeat: currentBeatInMeasure,
          currentMeasure: virtualMeasure, // 例: -1, 0
          isCountIn: true
        })
      } else {
        // メイン部分（カウントイン後）
        const displayMeasure = (virtualMeasure % s.measureCount) + 1
        
        set({
          currentBeat: currentBeatInMeasure,
          currentMeasure: displayMeasure, // 1から表示
          isCountIn: false
        })
      }
    }
  }
}))