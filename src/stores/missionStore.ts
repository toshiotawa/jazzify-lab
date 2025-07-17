import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, MissionSongProgress, fetchActiveMonthlyMissions, fetchUserMissionProgress, fetchMissionSongProgress, fetchMissionSongProgressAll, claimReward } from '@/platform/supabaseMissions';

interface State {
  monthly: Mission[];
  progress: Record<string, UserMissionProgress>;
  songProgress: Record<string, MissionSongProgress[]>;
  loading: boolean;
}
interface Actions {
  fetchAll: () => Promise<void>;
  fetchSongProgress: (missionId: string) => Promise<void>;
  fetchSongProgressAll: (missionIds: string[]) => Promise<void>;
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
      
      // ミッションの曲進捗を一括取得
      const missionIds = missions.map(m => m.id);
      if (missionIds.length > 0) {
        await get().fetchSongProgressAll(missionIds);
      }
    },

    fetchSongProgress: async (missionId: string) => {
      // 既に進捗がある場合は再取得しない
      const existingProgress = get().songProgress[missionId];
      if (existingProgress && existingProgress.length > 0) {
        return;
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

    fetchSongProgressAll: async (missionIds: string[]) => {
      try {
        // 既に進捗があるミッションを除外
        const existingProgress = get().songProgress;
        const missionIdsToFetch = missionIds.filter(id => {
          const progress = existingProgress[id];
          return !progress || progress.length === 0;
        });
        
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
      await claimReward(id);
      await get().fetchAll();
    }
  }))
);
