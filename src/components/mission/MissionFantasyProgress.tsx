import React, { useEffect } from 'react';
import type { MissionFantasyStageProgressItem } from '@/platform/supabaseChallengeFantasy';
import { fetchMissionFantasyProgress } from '@/platform/supabaseChallengeFantasy';
import { cn } from '@/utils/cn';
import { FaPlay, FaCheck, FaHatWizard } from 'react-icons/fa';

interface Props {
  missionId: string;
  progressItems: MissionFantasyStageProgressItem[] | null;
  onLoad: (items: MissionFantasyStageProgressItem[]) => void;
}

const MissionFantasyProgress: React.FC<Props> = ({ missionId, progressItems, onLoad }) => {
  useEffect(() => {
    if (!progressItems) {
      void fetchMissionFantasyProgress(missionId).then(onLoad);
    }
  }, [missionId, progressItems, onLoad]);

  const handlePlay = (stageId: string) => {
    const params = new URLSearchParams();
    params.set('missionId', missionId);
    params.set('stageId', stageId);
    window.location.hash = `#fantasy?${params.toString()}`;
  };

  if (!progressItems) {
    return (
      <div className="text-center text-gray-400 py-4">読み込み中...</div>
    );
  }

  return (
    <div className="space-y-3">
      {progressItems.map(item => (
        <div
          key={item.fantasy_stage_id}
          className={cn(
            'p-3 rounded-lg border-2 transition-all duration-300',
            item.is_completed ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800 border-slate-700'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaHatWizard className="w-4 h-4 text-purple-300" />
              <div>
                <div className="font-medium text-white">
                  {item.stage.stage_number} - {item.stage.name}
                </div>
                <div className="text-xs text-gray-400">
                  {item.clear_count}/{item.required_count} 回クリア
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlay(item.stage.id)}
              className={cn('btn btn-sm', item.is_completed ? 'btn-success' : 'btn-primary')}
            >
              {item.is_completed ? (
                <span className="flex items-center space-x-2"><FaCheck className="w-3 h-3" /><span>再挑戦</span></span>
              ) : (
                <span className="flex items-center space-x-2"><FaPlay className="w-3 h-3" /><span>プレイ</span></span>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MissionFantasyProgress;