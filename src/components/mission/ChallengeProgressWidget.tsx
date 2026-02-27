import React, { useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

const ChallengeProgressWidget: React.FC = () => {
  const { monthly, progress, loading, fetchAll, claim } = useMissionStore();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  useEffect(() => {
    if (monthly.length === 0 && !loading) {
      fetchAll();
    }
  }, [monthly.length, loading, fetchAll]);

  if (loading) return <p>Loading missions...</p>;

  return (
    <div className="space-y-6">
      {monthly.length > 0 && (
        <section>
          <h3 className="font-bold mb-2 text-lg">{isEnglishCopy ? 'Monthly Missions' : 'マンスリーミッション'}</h3>
          <ul className="space-y-3">
            {monthly.map(ch => {
              const displayTitle = isEnglishCopy && ch.title_en ? ch.title_en : ch.title;
              const prog = progress[ch.id];
              const max = ch.clears_required ?? ch.diary_count ?? 1;
              const current = prog?.clear_count ?? 0;
              const ratio = Math.min(1, current / max);
              return (
                <li key={ch.id} className="p-3 rounded bg-slate-800/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{displayTitle}</span>
                    <span className="text-xs">{current}/{max}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-2 overflow-hidden mb-2">
                    <div style={{ width: `${ratio*100}%` }} className="h-full bg-indigo-400" />
                  </div>
                  {prog?.completed ? (
                    <span className="badge badge-success badge-sm">{isEnglishCopy ? 'Achieved' : '達成済み'}</span>
                  ) : (
                    current >= max ? (
                      <button className="btn btn-xs btn-primary" onClick={()=>claim(ch.id)}>{isEnglishCopy ? 'Claim Reward' : '報酬を受け取る'}</button>
                    ) : null
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ChallengeProgressWidget;
