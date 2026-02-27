import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, MissionSongProgress, fetchActiveMonthlyMissions, fetchUserMissionProgress, fetchMissionSongProgress, fetchMissionSongProgressAll, claimReward, filterMissionsByPlan } from '@/platform/supabaseMissions';
import { useToastStore } from '@/stores/toastStore';
import { useUserStatsStore } from './userStatsStore';
import { useAuthStore } from './authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface State {
  monthly: Mission[];
  progress: Record<string, UserMissionProgress>;
  songProgress: Record<string, MissionSongProgress[]>;
  loading: boolean;
}
interface Actions {
  fetchAll: () => Promise<void>;
  fetchSongProgress: (missionId: string, forceRefresh?: boolean) => Promise<void>;
  fetchSongProgressAll: (missionIds: string[], forceRefresh?: boolean) => Promise<void>;
  claim: (id: string) => Promise<void>;
}

export const useMissionStore = create<State & Actions>()(
  immer((set, get) => ({
    monthly: [],
    progress: {},
    songProgress: {},
    loading: false,

    fetchAll: async () => {
      set(s=>{s.loading=true;});
      const [allMissions, progress] = await Promise.all([
        fetchActiveMonthlyMissions(),
        fetchUserMissionProgress(),
      ]);
      const rank = useAuthStore.getState().profile?.rank;
      const missions = filterMissionsByPlan(allMissions, rank);
      const progMap:Record<string,UserMissionProgress> = {};
      progress.forEach(pr=>{progMap[pr.challenge_id]=pr;});
      set(s=>{s.monthly=missions; s.progress=progMap; s.loading=false;});
      
      // ミッションの曲進捗を一括取得（tracksを再利用）
      if (missions.length > 0) {
        try {
          const { computeMissionSongProgressAllFromMissions } = await import('@/platform/supabaseMissions');
          const map = await computeMissionSongProgressAllFromMissions(missions);
          set(s => { Object.assign(s.songProgress, map); });
        } catch (e) {
          // フォールバック（従来のIDベース）
          const missionIds = missions.map(m => m.id);
          if (missionIds.length > 0) {
            await get().fetchSongProgressAll(missionIds);
          }
        }
      }
    },

    fetchSongProgress: async (missionId: string, forceRefresh = false) => {
      // forceRefreshがfalseの場合、既に進捗がある場合は再取得しない
      if (!forceRefresh) {
        const existingProgress = get().songProgress[missionId];
        if (existingProgress && existingProgress.length > 0) {
          return;
        }
      }
      
      try {
        const songProgress = await fetchMissionSongProgress(missionId);
        set(s => {
          s.songProgress[missionId] = songProgress;
        });
      } catch (error) {
        console.error('曲進捗の取得に失敗:', error);
      }
    },

    fetchSongProgressAll: async (missionIds: string[], forceRefresh = false) => {
      try {
        let missionIdsToFetch = missionIds;
        
        // forceRefreshがfalseの場合、既に進捗があるミッションを除外
        if (!forceRefresh) {
          const existingProgress = get().songProgress;
          missionIdsToFetch = missionIds.filter(id => {
            const progress = existingProgress[id];
            return !progress || progress.length === 0;
          });
        }
        
        if (missionIdsToFetch.length === 0) {
          return;
        }
        
        const songProgressMap = await fetchMissionSongProgressAll(missionIdsToFetch);
        set(s => {
          Object.assign(s.songProgress, songProgressMap);
        });
      } catch (error) {
        console.error('一括曲進捗の取得に失敗:', error);
      }
    },

    claim: async(id:string)=>{
      const profile = useAuthStore.getState().profile;
      const isEn = shouldUseEnglishCopy({ rank: profile?.rank });
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
              duration: 5000
            }
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
            duration: 5000
          }
        );
        
        throw error;
      }
    }
  }))
);
