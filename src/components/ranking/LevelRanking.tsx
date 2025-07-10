import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>{window.location.hash='';}}>
      <div className="bg-slate-900 w-full max-w-2xl p-6 rounded-lg text-white" onClick={e=>e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center mb-4">レベルランキング</h2>
        {loading ? (
          <p className="text-center">Loading...</p>
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
                  <td className="py-1 px-2">{e.nickname}</td>
                  <td className="py-1 px-2">{e.level}</td>
                  <td className="py-1 px-2">{e.xp.toLocaleString()}</td>
                  <td className="py-1 px-2 capitalize">{e.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn btn-sm btn-primary w-full mt-4" onClick={()=>{window.location.hash='';}}>閉じる</button>
      </div>
    </div>,
    document.body,
  );
};

export default LevelRanking; 