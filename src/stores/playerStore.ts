import { create } from 'zustand';

type PlayerStore = {
  hp: number;
  sp: number;
  damage: (amount: number) => void;
  addSp: (amount: number) => void;
  resetSp: () => void;
  reset: () => void;
  setHp: (hp: number) => void;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  hp: 5,
  sp: 0,
  
  damage: (amount) => set((state) => ({ hp: Math.max(0, state.hp - amount) })),
  
  addSp: (amount) => set((state) => ({ sp: Math.min(5, state.sp + amount) })),
  
  resetSp: () => set({ sp: 0 }),
  
  reset: () => set({ hp: 5, sp: 0 }),
  
  setHp: (hp) => set({ hp }),
}));