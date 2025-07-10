import React from 'react';
import { Mission, UserMissionProgress } from '@/platform/supabaseMissions';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/utils/cn';

interface Props {
  mission: Mission;
  progress?: UserMissionProgress;
}

const ChallengeCard: React.FC<Props> = ({ mission, progress }) => {
  const { claim } = useMissionStore();
  const total = mission.diary_count ??  mission.min_clear_count ?? 1;
  const cleared = progress?.clear_count ?? 0;
  const completed = progress?.completed ?? false;

  return (
    <div className="p-3 bg-slate-800 rounded-lg space-y-2 text-sm">
      <div className="font-bold text-gray-100">{mission.title}</div>
      {mission.description && <div className="text-gray-400 text-xs">{mission.description}</div>}

      {/* progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(cleared/total,1)*100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{cleared}/{total}</span>
        {completed && <span className="text-emerald-400">COMPLETED</span>}
      </div>

      <button
        disabled={!completed}
        className={cn('btn btn-xs w-full', completed ? 'btn-primary' : 'btn-disabled')}
        onClick={()=>claim(mission.id)}
      >
        報酬受取
      </button>
    </div>
  );
};
export default ChallengeCard; 