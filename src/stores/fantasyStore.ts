import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FantasyStore {
  // SP gauge state
  playerSp: number;
  maxSp: number;
  
  // Actions
  setSp: (value: number) => void;
  addSp: (amount: number) => void;
  resetSp: () => void;
  consumeSp: () => void;
  canUseSpecialAttack: () => boolean;
}

export const useFantasyStore = create<FantasyStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      playerSp: 0,
      maxSp: 5,
      
      // Actions
      setSp: (value) => set({ playerSp: Math.max(0, Math.min(value, get().maxSp)) }),
      
      addSp: (amount) => {
        const current = get().playerSp;
        const max = get().maxSp;
        set({ playerSp: Math.min(current + amount, max) });
      },
      
      resetSp: () => set({ playerSp: 0 }),
      
      consumeSp: () => set({ playerSp: 0 }),
      
      canUseSpecialAttack: () => get().playerSp >= get().maxSp,
    }),
    {
      name: 'fantasy-store',
    }
  )
);