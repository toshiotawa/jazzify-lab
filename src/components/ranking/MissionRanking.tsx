import React, { useEffect, useState } from 'react';
import { fetchMissionRanking, MissionRankingEntry } from '@/platform/supabaseRanking';
import { useMissionStore } from '@/stores/missionStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

const MissionRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#mission-ranking');
  const [entries, setEntries] = useState<MissionRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { monthly } = useMissionStore();
  const [missionId, setMissionId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#mission-ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open && monthly.length > 0 && !missionId) {
      setMissionId(monthly[0].id);
    }
  }, [open, monthly, missionId]);

  useEffect(() => {
    if (open && missionId) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchMissionRanking(missionId);
          setEntries(data);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, missionId]);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {monthly.length > 1 && (
          <select
            className="select select-bordered text-white"
            value={missionId ?? ''}
            onChange={(e)=>setMissionId(e.target.value)}
          >
            {monthly.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        )}
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400">ランキングデータがありません</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">ユーザー</th>
                <th className="py-2 px-2">回数</th>
                <th className="py-2 px-2">レベル</th>
                <th className="py-2 px-2">ランク</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={e.user_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-1 px-2">{idx + 1}</td>
                  <td className="py-1 px-2 flex items-center gap-2">
                    <img src={e.avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full" />
                    <span>{e.nickname}</span>
                  </td>
                  <td className="py-1 px-2">{e.clear_count}</td>
                  <td className="py-1 px-2">{e.level}</td>
                  <td className="py-1 px-2">{e.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn btn-sm btn-outline mt-4" onClick={handleClose}>ダッシュボードに戻る</button>
      </div>
    </div>
  );
};

export default MissionRanking;
