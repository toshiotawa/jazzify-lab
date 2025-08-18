import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { fetchGuildRanking } from '@/platform/supabaseGuilds';

const GuildRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#guilds-ranking');
  const [rows, setRows] = useState<Array<{ guild_id: string; name: string; members_count: number; level: number; monthly_xp: number; rank_no: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#guilds-ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open) {
      void (async () => {
        setLoading(true);
        try {
          setRows(await fetchGuildRanking(100, 0));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-bold mb-3">ギルドランキング（今月）</h3>
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">ギルド名</th>
                  <th className="py-2 px-2 text-left">レベル</th>
                  <th className="py-2 px-2 text-left">メンバー</th>
                  <th className="py-2 px-2 text-left">今月XP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.guild_id} className="border-b border-slate-800">
                    <td className="py-2 px-2">{r.rank_no}</td>
                    <td className="py-2 px-2">{r.name}</td>
                    <td className="py-2 px-2">{r.level}</td>
                    <td className="py-2 px-2">{r.members_count}/5</td>
                    <td className="py-2 px-2">{r.monthly_xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuildRanking;

