import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, fetchActiveMonthlyMissions, fetchUserMissionProgress, claimReward } from '@/platform/supabaseMissions';

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
      set(s=>{s.loading=true;});
      const [missions, progress] = await Promise.all([
        fetchActiveMonthlyMissions(),
        fetchUserMissionProgress(),
      ]);
      const progMap:Record<string,UserMissionProgress> = {};
      progress.forEach(pr=>{progMap[pr.challenge_id]=pr;});
      set(s=>{s.monthly=missions; s.progress=progMap; s.loading=false;});
    },

    claim: async(id:string)=>{
      await claimReward(id);
      await get().fetchAll();
    }
  }))
);
