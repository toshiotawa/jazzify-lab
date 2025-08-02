import { create } from 'zustand';
import type { RhythmNote, JudgmentWindow, RhythmGameState } from '@/types/rhythm';

interface RhythmStoreActions {
  setNotes: (notes: RhythmNote[]) => void;
  setWindow: (window: JudgmentWindow | null) => void;
  setActiveNote: (note: RhythmNote | null) => void;
  setPlayerHp: (hp: number) => void;
  setEnemyHp: (hp: number) => void;
  setEnemyGauge: (gauge: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setLoop: (loop: number) => void;
  setState: (state: Partial<RhythmGameState>) => void;
  reset: () => void;
}

type RhythmStore = RhythmGameState & RhythmStoreActions;

const initialState: RhythmGameState = {
  loop: 0,
  notes: [],
  activeNote: null,
  playerHp: 5,
  enemyHp: 1,
  enemyGauge: 0,
  window: null,
  playing: false,
  currentTime: 0,
};

export const useRhythmStore = create<RhythmStore>((set) => ({
  ...initialState,
  
  setNotes: (notes) => set({ notes }),
  setWindow: (window) => set({ window }),
  setActiveNote: (activeNote) => set({ activeNote }),
  setPlayerHp: (playerHp) => set({ playerHp }),
  setEnemyHp: (enemyHp) => set({ enemyHp }),
  setEnemyGauge: (enemyGauge) => set({ enemyGauge }),
  setPlaying: (playing) => set({ playing }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setLoop: (loop) => set({ loop }),
  setState: (state) => set((prev) => ({ ...prev, ...state })),
  reset: () => set(initialState),
}));