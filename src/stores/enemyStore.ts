import { create } from 'zustand';

type EnemyStore = {
  /** 現在 "怒り中" のモンスター ID → true */
  enraged: Record<string, boolean>;
  /** 個別の怒り終了タイマーを管理（重複防止） */
  timers: Record<string, number | undefined>;
  /** 怒りフラグを立てる / 消す（自動解除付） */
  setEnrage: (id: string, value: boolean, durationMs?: number) => void;
};

export const useEnemyStore = create<EnemyStore>((set, get) => ({
  enraged: {},
  timers: {},
  setEnrage: (id, value, durationMs = 800) => {
    // 既存タイマーがあればクリア
    const timers = { ...get().timers };
    if (timers[id] !== undefined) {
      clearTimeout(timers[id]);
      delete timers[id];
    }

    set(state => ({
      enraged: { ...state.enraged, [id]: value }
    }));

    if (value) {
      const timeoutId = window.setTimeout(() => {
        // タイマー満了で怒り解除（重複防止）
        const current = get().enraged[id];
        if (current) {
          set(state => ({ enraged: { ...state.enraged, [id]: false } }));
        }
        // 後始末
        const t = { ...get().timers };
        if (t[id] !== undefined) delete t[id];
        set({ timers: t });
      }, durationMs);
      set({ timers: { ...get().timers, [id]: timeoutId } });
    }
  }
}));