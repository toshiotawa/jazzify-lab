import { create } from 'zustand';

interface RhythmState {
  isPlaying: boolean;
  startAt: number;          // High-res 時刻 (ms)
  bpm: number;
  beatDuration: number;     // 1beat ms
  currentPos: {
    measure: number;
    beat: number;           // 小数込み (1.0,1.5…)
    absoluteBeat: number;   // loop 0 始まり
  };
  setPlaying: (flag: boolean) => void;
  setStart: (t: number) => void;
  setPos: (pos: RhythmState['currentPos']) => void;
}

export const useRhythmStore = create<RhythmState>()((set) => ({
  isPlaying: false,
  startAt: 0,
  bpm: 120,
  beatDuration: 500,
  currentPos: { measure: 0, beat: 0, absoluteBeat: 0 },
  setPlaying: (f) => set({ isPlaying: f }),
  setStart: (t) => set({ startAt: t }),
  setPos: (p) => set({ currentPos: p }),
}));