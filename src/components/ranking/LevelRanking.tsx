import React, { useEffect, useState } from 'react';
import { fetchLevelRanking, RankingEntry } from '@/platform/supabaseRanking';

const LevelRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#ranking');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchLevelRanking();
          setEntries(data);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    window.location.hash = '';
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-900 text-white overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 className="text-2xl font-bold">レベルランキング</h2>
        <button className="btn btn-sm btn-outline" onClick={handleClose}>閉じる</button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">ニックネーム</th>
                <th className="py-2 px-2">Lv</th>
                <th className="py-2 px-2">XP</th>
                <th className="py-2 px-2">ランク</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-1 px-2">{idx + 1}</td>
                  <td className="py-1 px-2 truncate max-w-[8rem]">
                    <button
                      onClick={()=>{window.location.hash=`#diary-user?id=${e.id}`;}}
                      className="hover:text-blue-400 transition-colors"
                    >{e.nickname}</button>
                  </td>
                  <td className="py-1 px-2">{e.level}</td>
                  <td className="py-1 px-2">{e.xp.toLocaleString()}</td>
                  <td className="py-1 px-2 capitalize">{e.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="btn btn-sm btn-primary m-4" onClick={handleClose}>閉じる</button>
    </div>
  );
};

export default LevelRanking; 