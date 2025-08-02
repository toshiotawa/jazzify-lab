import { create } from 'zustand';

type EnemyStore = {
  /** 現在 "怒り中" のモンスター ID → true */
  enraged: Record<string, boolean>;
  /** 怒りフラグを立てる / 消す */
  setEnrage: (id: string, value: boolean) => void;
  /** リズムモード用: 単一の怒りレベル (0-100) */
  enrageLevel: number;
  /** リズムモード用: 怒りレベルを設定 */
  setEnrageLevel: (level: number | ((prev: number) => number)) => void;
  /** ストアをリセット */
  reset: () => void;
};

export const useEnemyStore = create<EnemyStore>(set => ({
  enraged: {},
  enrageLevel: 0,
  setEnrage: (id, value) =>
    set(state => ({
      enraged: { ...state.enraged, [id]: value }
    })),
  setEnrageLevel: (level) =>
    set(state => typeof level === 'function' ? { enrageLevel: level(state.enrageLevel) } : { enrageLevel: level }),
  reset: () =>
    set({ enraged: {}, enrageLevel: 0 })
}));