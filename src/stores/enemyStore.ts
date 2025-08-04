import { create } from 'zustand';

type EnemyStore = {
  /** 現在 "怒り中" のモンスター ID → true */
  enraged: Record<string, boolean>;
  /** 怒りフラグを立てる / 消す */
  setEnrage: (id: string, value: boolean) => void;
  /** 全ての怒り状態をクリア */
  reset: () => void;
};

export const useEnemyStore = create<EnemyStore>(set => ({
  enraged: {},
  setEnrage: (id, value) =>
    set(state => ({
      enraged: { ...state.enraged, [id]: value }
    })),
  reset: () => set({ enraged: {} })
}));