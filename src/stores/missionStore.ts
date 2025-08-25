import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, MissionSongProgress, fetchActiveMonthlyMissions, fetchUserMissionProgress, fetchMissionSongProgress, fetchMissionSongProgressAll, claimReward } from '@/platform/supabaseMissions';
import { useToastStore } from '@/stores/toastStore';
import { useUserStatsStore } from './userStatsStore';

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
      const [missions, progress] = await Promise.all([
        fetchActiveMonthlyMissions(),
        fetchUserMissionProgress(),
      ]);
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
      try {
        console.log('claimReward開始:', id);
        const xpResult = await claimReward(id);
        console.log('claimReward完了:', xpResult);
        
        console.log('fetchAll開始');
        await get().fetchAll();
        console.log('fetchAll完了');
        
        // ユーザー統計を更新
        const { fetchStats } = useUserStatsStore.getState();
        fetchStats().catch(console.error); // エラーは無視
        
        // トースト通知を表示
        const { push } = useToastStore.getState();
        if (xpResult) {
          console.log('トースト通知表示:', xpResult);
          push(
            `+${xpResult.gainedXp} XP${xpResult.levelUp ? ' (レベルアップ！)' : ''}`,
            'success',
            {
              title: 'ミッション報酬獲得！',
              duration: 5000
            }
          );
        }
      } catch (error) {
        console.error('報酬の受け取りに失敗しました:', error);
        
        // エラーメッセージをトースト通知で表示
        const { push } = useToastStore.getState();
        const errorMessage = error instanceof Error ? error.message : '報酬の受け取りに失敗しました';
        push(
          errorMessage,
          'error',
          {
            title: 'エラー',
            duration: 5000
          }
        );
        
        throw error;
      }
    }
  }))
);
