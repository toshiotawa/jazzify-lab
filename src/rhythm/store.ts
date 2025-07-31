import { create } from 'zustand';

interface RhythmState {
  playing: boolean;
  now: number;           // AudioContext基準経過秒
  bpm: number;
  timeSig: 3 | 4;
  measureLen: number;    // 秒
  loopMeasures: number;
  startAt: number;       // AudioContext.currentTimeでの開始秒
  setConfig(cfg: Partial<RhythmState>): void;
  tick(audioTime: number): void;
  reset(): void;
}

export const useRhythmStore = create<RhythmState>()((set, get) => ({
  playing: false,
  now: 0,
  bpm: 120,
  timeSig: 4,
  measureLen: 2,
  loopMeasures: 8,
  startAt: 0,
  setConfig: (cfg) => set(cfg),
  tick: (t) => {
    const { startAt, measureLen, loopMeasures, playing } = get();
    if (!playing) return;
    const rel = t - startAt;
    const loopLen = measureLen * loopMeasures;
    set({ now: (rel % loopLen + loopLen) % loopLen }); // wrap 0-loopLen
  },
  reset: () => set({
    playing: false,
    now: 0,
    startAt: 0
  })
}));