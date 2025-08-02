import { create } from 'zustand';
import type { RhythmGameState } from '@/types/rhythm';

export const useRhythmStore = create<RhythmGameState>(() => ({
  loop: 0,
  notes: [],
  activeNote: null,
  playerHp: 5,
  enemyHp: 1,
  enemyGauge: 0,
  window: null,
  playing: false,
  currentTime: 0,
}));