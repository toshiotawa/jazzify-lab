import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, fetchActiveMonthlyMissions, fetchUserMissionProgress, claimReward, filterMissionsByPlan } from '@/platform/supabaseMissions';
import { useToastStore } from '@/stores/toastStore';
import { useUserStatsStore } from './userStatsStore';
import { useAuthStore } from './authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface State {
  monthly: Mission[];
  progress: Record<string, UserMissionProgress>;
  loading: boolean;
}
interface Actions {
  fetchAll: () => Promise<void>;
  claim: (id: string) => Promise<void>;
}

export const useMissionStore = create<State & Actions>()(
  immer((set, get) => ({
    monthly: [],
    progress: {},
    loading: false,

    fetchAll: async () => {
      set(s => { s.loading = true; });
      const [allMissions, progress] = await Promise.all([
        fetchActiveMonthlyMissions(),
        fetchUserMissionProgress(),
      ]);
      const rank = useAuthStore.getState().profile?.rank;
      const missions = filterMissionsByPlan(allMissions, rank);
      const progMap: Record<string, UserMissionProgress> = {};
      progress.forEach(pr => { progMap[pr.challenge_id] = pr; });
      set(s => { s.monthly = missions; s.progress = progMap; s.loading = false; });
    },

    claim: async (id: string) => {
      const profile = useAuthStore.getState().profile;
      const isEn = shouldUseEnglishCopy({ rank: profile?.rank, preferredLocale: profile?.preferred_locale });
      try {
        const xpResult = await claimReward(id);

        await get().fetchAll();

        const { fetchStats } = useUserStatsStore.getState();
        fetchStats().catch(() => {});

        const { push } = useToastStore.getState();
        if (xpResult) {
          push(
            `+${xpResult.gainedXp} XP${xpResult.levelUp ? (isEn ? ' (Level Up!)' : ' (レベルアップ！)') : ''}`,
            'success',
            {
              title: isEn ? 'Mission Reward Earned!' : 'ミッション報酬獲得！',
              duration: 5000,
            },
          );
        }
      } catch (error) {
        const { push } = useToastStore.getState();
        const errorMessage = error instanceof Error ? error.message : (isEn ? 'Failed to claim reward' : '報酬の受け取りに失敗しました');
        push(
          errorMessage,
          'error',
          {
            title: isEn ? 'Error' : 'エラー',
            duration: 5000,
          },
        );

        throw error;
      }
    },
  })),
);
