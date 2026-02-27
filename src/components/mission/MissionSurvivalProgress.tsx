import React, { useEffect } from 'react';
import type { MissionSurvivalStageProgressItem } from '@/platform/supabaseChallengeSurvival';
import { fetchMissionSurvivalProgress } from '@/platform/supabaseChallengeSurvival';
import { cn } from '@/utils/cn';
import { FaPlay, FaCheck, FaSkull } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-400',
  normal: 'text-blue-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400',
};

interface Props {
  missionId: string;
  progressItems: MissionSurvivalStageProgressItem[] | null;
  onLoad: (items: MissionSurvivalStageProgressItem[]) => void;
}

const MissionSurvivalProgress: React.FC<Props> = ({ missionId, progressItems, onLoad }) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  useEffect(() => {
    if (!progressItems) {
      void fetchMissionSurvivalProgress(missionId).then(onLoad);
    }
  }, [missionId, progressItems, onLoad]);

  const handlePlay = (stageNumber: number) => {
    const params = new URLSearchParams();
    params.set('missionId', missionId);
    params.set('stageNumber', String(stageNumber));
    window.location.hash = `#survival-mission?${params.toString()}`;
  };

  if (!progressItems) {
    return (
      <div className="text-center text-gray-400 py-4">{isEnglishCopy ? 'Loading...' : '読み込み中...'}</div>
    );
  }

  return (
    <div className="space-y-3">
      {progressItems.map(item => (
        <div
          key={item.stage_number}
          className={cn(
            'p-3 rounded-lg border-2 transition-all duration-300',
            item.is_completed ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800 border-slate-700'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaSkull className={cn('w-4 h-4', DIFFICULTY_COLORS[item.difficulty] || 'text-gray-400')} />
              <div>
                <div className="font-medium text-white">
                  {item.stage_name}
                </div>
                <div className="text-xs text-gray-400">
                  {item.clear_count}/{item.required_count} {isEnglishCopy ? 'clears' : '回クリア'}
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlay(item.stage_number)}
              className={cn('btn btn-sm', item.is_completed ? 'btn-success' : 'btn-primary')}
            >
              {item.is_completed ? (
                <span className="flex items-center space-x-2"><FaCheck className="w-3 h-3" /><span>{isEnglishCopy ? 'Retry' : '再挑戦'}</span></span>
              ) : (
                <span className="flex items-center space-x-2"><FaPlay className="w-3 h-3" /><span>{isEnglishCopy ? 'Play' : 'プレイ'}</span></span>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MissionSurvivalProgress;
