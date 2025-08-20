import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { getSupabaseClient } from '@/platform/supabaseClient';

type Row = { guild_id: string; guild_name: string; joined_at: string; left_at: string | null };

const MyGuildHistory: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash.startsWith('#my-guild-history'));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const handler = () => setOpen(window.location.hash.startsWith('#my-guild-history'));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await getSupabaseClient()
          .rpc('rpc_get_my_guild_membership_history');
        if (error) throw error;
        setRows((data || []) as Row[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-xl font-bold">自分のギルド歴</h2>
          <p className="text-sm text-gray-300">参加日と脱退日、そのギルドへのリンクのみ表示します。</p>
          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : rows.length === 0 ? (
            <p className="text-gray-400">履歴がありません。</p>
          ) : (
            <ul className="space-y-2">
              {rows.map(r => (
                <li key={`${r.guild_id}-${r.joined_at}`} className="bg-slate-800 border border-slate-700 rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        <a className="link link-info" onClick={()=>{ window.location.hash = `#guild?id=${r.guild_id}`; }}>
                          {r.guild_name}
                        </a>
                      </div>
                      <div className="text-gray-400">参加: {new Date(r.joined_at).toLocaleString()} / 脱退: {r.left_at ? new Date(r.left_at).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGuildHistory;

