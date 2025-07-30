import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { fetchUserStats, UserStats, clearUserStatsCache } from '@/platform/supabaseUserStats';

interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface UserStatsActions {
  fetchStats: (userId?: string) => Promise<void>;
  clearStats: () => void;
  clearCache: (userId?: string) => void;
}

export const useUserStatsStore = create<UserStatsState & UserStatsActions>()(
  immer((set, get) => ({
    stats: null,
    loading: false,
    error: null,
    lastFetched: null,

    fetchStats: async (userId?: string) => {
      if (!userId) {
        set(state => {
          state.stats = null;
          state.error = 'ユーザーIDが指定されていません';
        });
        return;
      }

      set(state => {
        state.loading = true;
        state.error = null;
      });

      try {
        const stats = await fetchUserStats(userId);
        
        set(state => {
          state.stats = stats;
          state.loading = false;
          state.lastFetched = Date.now();
        });
      } catch (error) {
        console.error('ユーザー統計の取得に失敗:', error);
        set(state => {
          state.error = error instanceof Error ? error.message : '統計の取得に失敗しました';
          state.loading = false;
        });
      }
    },

    clearStats: () => {
      set(state => {
        state.stats = null;
        state.error = null;
        state.lastFetched = null;
      });
    },

    clearCache: (userId?: string) => {
      clearUserStatsCache(userId);
    },
  }))
); 