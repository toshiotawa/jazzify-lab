import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, MissionSongProgress, fetchActiveMonthlyMissions, fetchUserMissionProgress, fetchMissionSongProgress, claimReward } from '@/platform/supabaseMissions';

interface State {
  monthly: Mission[];
  progress: Record<string, UserMissionProgress>;
  songProgress: Record<string, MissionSongProgress[]>;
  loading: boolean;
}
interface Actions {
  fetchAll: () => Promise<void>;
  fetchSongProgress: (missionId: string) => Promise<void>;
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
    },

    fetchSongProgress: async (missionId: string) => {
      try {
        const songProgress = await fetchMissionSongProgress(missionId);
        set(s => {
          s.songProgress[missionId] = songProgress;
        });
      } catch (error) {
        console.error('曲進捗の取得に失敗:', error);
      }
    },

    claim: async(id:string)=>{
      await claimReward(id);
      await get().fetchAll();
    }
  }))
);
