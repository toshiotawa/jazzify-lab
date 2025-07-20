import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { fetchUserStats, UserStats, clearUserStatsCache } from '@/platform/supabaseUserStats';
import { useAuthStore } from './authStore';

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
      const { profile } = useAuthStore.getState();
      
      if (!profile && !userId) {
        set(state => {
          state.stats = null;
          state.error = 'プロフィールが見つかりません';
        });
        return;
      }

      set(state => {
        state.loading = true;
        state.error = null;
      });

      try {
        const targetUserId = userId || profile?.id;
        if (!targetUserId) {
          throw new Error('ユーザーIDが見つかりません');
        }

        const stats = await fetchUserStats(targetUserId);
        
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