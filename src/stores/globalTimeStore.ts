import { create } from 'zustand';

/**
 * グローバルタイムストア
 * Rhythm モードおよび Quiz モード共通で音楽再生のタイムラインを管理する。
 * 単位はミリ秒で扱い、必要に応じて呼び出し側で秒変換してください。
 */
export type GlobalTimeState = {
  /** 現在までの累積再生時間 (ms) */
  currentTime: number;
  /** トランスポートが再生中か */
  isPlaying: boolean;
  /** ループ開始時間 (ms)。ループしない場合は 0 */
  loopStartTime: number;
  /** タイムラインを更新 */
  setCurrentTime: (timeMs: number) => void;
  /** 再生/停止を更新 */
  setIsPlaying: (playing: boolean) => void;
  /** ループ開始位置を更新 */
  setLoopStart: (timeMs: number) => void;
  /** 全ての値をリセット */
  reset: () => void;
};

export const useGlobalTimeStore = create<GlobalTimeState>(set => ({
  currentTime: 0,
  isPlaying: false,
  loopStartTime: 0,
  setCurrentTime: (timeMs: number) => set({ currentTime: timeMs }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setLoopStart: (timeMs: number) => set({ loopStartTime: timeMs }),
  reset: () => set({ currentTime: 0, isPlaying: false, loopStartTime: 0 })
}));