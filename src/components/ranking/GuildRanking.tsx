import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { fetchGuildRanking, fetchGuildContributorsWithProfiles } from '@/platform/supabaseGuilds';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

const GuildRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#guilds-ranking');
  const [rowsCurrent, setRowsCurrent] = useState<Array<{ guild_id: string; name: string; guild_type: 'casual'|'challenge'; members_count: number; level: number; monthly_xp: number; quest_success_count: number | null; rank_no: number }>>([]);
  const [rowsPrev, setRowsPrev] = useState<Array<{ guild_id: string; name: string; guild_type: 'casual'|'challenge'; members_count: number; level: number; monthly_xp: number; quest_success_count: number | null; rank_no: number }>>([]);
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
          const now = new Date();
          const currentHour = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())).toISOString();
          const prevHour = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() - 1)).toISOString();
          const [cur, prev] = await Promise.all([
            fetchGuildRanking(100, 0, currentHour),
            fetchGuildRanking(100, 0, prevHour),
          ]);
          setRowsCurrent(cur);
          setRowsPrev(prev);
          // MVPの取得（各ギルドのトップ貢献者）
          const [curMvpList, prevMvpList] = await Promise.all([
            Promise.all(cur.map(async (r) => {
              const contribs = await fetchGuildContributorsWithProfiles(r.guild_id, currentHour);
              const top = contribs[0];
              return { guild_id: r.guild_id, mvp: top ? { user_id: top.user_id, nickname: top.nickname, avatar_url: top.avatar_url, level: top.level, contributed_xp: top.contributed_xp } : null };
            })),
            Promise.all(prev.map(async (r) => {
              const contribs = await fetchGuildContributorsWithProfiles(r.guild_id, prevHour);
              const top = contribs[0];
              return { guild_id: r.guild_id, mvp: top ? { user_id: top.user_id, nickname: top.nickname, avatar_url: top.avatar_url, level: top.level, contributed_xp: top.contributed_xp } : null };
            })),
          ]);
          const curMap: Record<string, { user_id: string; nickname: string; avatar_url?: string; level: number; contributed_xp: number } | null> = {};
          curMvpList.forEach(x => { curMap[x.guild_id] = x.mvp; });
          const prevMap: Record<string, { user_id: string; nickname: string; avatar_url?: string; level: number; contributed_xp: number } | null> = {};
          prevMvpList.forEach(x => { prevMap[x.guild_id] = x.mvp; });
          setMvpCurrent(curMap);
          setMvpPrev(prevMap);
        } catch (e) {
          console.warn('Guild ranking load failed:', e);
          setRowsCurrent([]);
          setRowsPrev([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open]);

  if (!open) return null;

  const [mvpCurrent, setMvpCurrent] = useState<Record<string, { user_id: string; nickname: string; avatar_url?: string; level: number; contributed_xp: number } | null>>({});
  const [mvpPrev, setMvpPrev] = useState<Record<string, { user_id: string; nickname: string; avatar_url?: string; level: number; contributed_xp: number } | null>>({});

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-bold mb-3">ギルドランキング（今月・先月）</h3>
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">今月</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[880px]">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-2 px-2 text-left">#</th>
                      <th className="py-2 px-2 text-left">ギルド名</th>
                      <th className="py-2 px-2 text-left">タイプ</th>
                      <th className="py-2 px-2 text-left">ギルドレベル</th>
                      <th className="py-2 px-2 text-left">MVPメンバー</th>
                      <th className="py-2 px-2 text-left">今月XP</th>
                      <th className="py-2 px-2 text-left">成功回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsCurrent.map((r) => (
                      <tr key={r.guild_id} className="border-b border-slate-800">
                        <td className="py-2 px-2">{r.rank_no}</td>
                        <td className="py-2 px-2">
                          <button className="hover:text-blue-400 underline" onClick={() => { const p = new URLSearchParams(); p.set('id', r.guild_id); window.location.hash = `#guild?${p.toString()}`; }}>{r.name}</button>
                        </td>
                        <td className="py-2 px-2">{r.guild_type === 'challenge' ? 'チャレンジ' : 'カジュアル'}</td>
                        <td className="py-2 px-2">{r.level}</td>
                        <td className="py-2 px-2">
                          {mvpCurrent[r.guild_id] ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { window.location.hash = `#diary-user?id=${mvpCurrent[r.guild_id]!.user_id}`; }} aria-label="ユーザーページへ">
                                <img src={mvpCurrent[r.guild_id]?.avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full" />
                              </button>
                              <button className="truncate max-w-[160px] text-left hover:text-blue-400" onClick={() => { window.location.hash = `#diary-user?id=${mvpCurrent[r.guild_id]!.user_id}`; }}>
                                {mvpCurrent[r.guild_id]?.nickname}
                              </button>
                              <span className="text-xs text-yellow-400">Lv.{mvpCurrent[r.guild_id]?.level}</span>
                              <span className="text-xs text-green-400">+{mvpCurrent[r.guild_id]?.contributed_xp.toLocaleString()} XP</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2">{r.monthly_xp}</td>
                        <td className="py-2 px-2">{r.guild_type === 'challenge' ? (r.quest_success_count ?? 0) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">先月</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[880px]">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-2 px-2 text-left">#</th>
                      <th className="py-2 px-2 text-left">ギルド名</th>
                      <th className="py-2 px-2 text-left">タイプ</th>
                      <th className="py-2 px-2 text-left">ギルドレベル</th>
                      <th className="py-2 px-2 text-left">MVPメンバー</th>
                      <th className="py-2 px-2 text-left">先月XP</th>
                      <th className="py-2 px-2 text-left">成功回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsPrev.map((r) => (
                      <tr key={r.guild_id} className="border-b border-slate-800">
                        <td className="py-2 px-2">{r.rank_no}</td>
                        <td className="py-2 px-2">
                          <button className="hover:text-blue-400 underline" onClick={() => { const p = new URLSearchParams(); p.set('id', r.guild_id); window.location.hash = `#guild?${p.toString()}`; }}>{r.name}</button>
                        </td>
                        <td className="py-2 px-2">{r.guild_type === 'challenge' ? 'チャレンジ' : 'カジュアル'}</td>
                        <td className="py-2 px-2">{r.level}</td>
                        <td className="py-2 px-2">
                          {mvpPrev[r.guild_id] ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { window.location.hash = `#diary-user?id=${mvpPrev[r.guild_id]!.user_id}`; }} aria-label="ユーザーページへ">
                                <img src={mvpPrev[r.guild_id]?.avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full" />
                              </button>
                              <button className="truncate max-w-[160px] text-left hover:text-blue-400" onClick={() => { window.location.hash = `#diary-user?id=${mvpPrev[r.guild_id]!.user_id}`; }}>
                                {mvpPrev[r.guild_id]?.nickname}
                              </button>
                              <span className="text-xs text-yellow-400">Lv.{mvpPrev[r.guild_id]?.level}</span>
                              <span className="text-xs text-green-400">+{mvpPrev[r.guild_id]?.contributed_xp.toLocaleString()} XP</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2">{r.monthly_xp}</td>
                        <td className="py-2 px-2">{r.guild_type === 'challenge' ? (r.quest_success_count ?? 0) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuildRanking;

