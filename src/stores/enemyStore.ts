import { create } from 'zustand';

type EnemyStore = {
  /** 現在 "怒り中" のモンスター ID → true */
  enraged: Record<string, boolean>;
  /** 怒りフラグを立てる / 消す */
  setEnrage: (id: string, value: boolean) => void;
  /** リズムモード用：敵のHP */
  hp: number;
  /** リズムモード用：HPを設定 */
  setHp: (hp: number) => void;
  /** リズムモード用：攻撃（ダメージを与える） */
  attack: (damage: number) => void;
};

export const useEnemyStore = create<EnemyStore>(set => ({
  enraged: {},
  setEnrage: (id, value) =>
    set(state => ({
      enraged: { ...state.enraged, [id]: value }
    })),
  hp: 0,
  setHp: (hp) => set({ hp }),
  attack: (damage) => set(state => ({ hp: Math.max(0, state.hp - damage) }))
}));