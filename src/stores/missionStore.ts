import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Mission, UserMissionProgress, fetchWeeklyChallenges, fetchActiveMonthlyMissions, fetchUserMissionProgress, claimReward } from '@/platform/supabaseMissions';

interface State {
  weekly: Mission[];
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
    weekly: [],
    monthly: [],
    progress: {},
    loading: false,

    fetchAll: async () => {
      set(s=>{s.loading=true;});
      const [w,m,p] = await Promise.all([
        fetchWeeklyChallenges(),
        fetchActiveMonthlyMissions(),
        fetchUserMissionProgress(),
      ]);
      const progMap:Record<string,UserMissionProgress> = {};
      p.forEach(pr=>{progMap[pr.challenge_id]=pr;});
      set(s=>{s.weekly=w; s.monthly=m; s.progress=progMap; s.loading=false;});
    },

    claim: async(id:string)=>{
      await claimReward(id);
      await get().fetchAll();
    }
  }))
); 