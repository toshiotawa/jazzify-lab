import React, { useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { fetchGuildContributorsWithProfiles, fetchGuildMonthlyXpSingle, fetchGuildRankForMonth, getMyGuild } from '@/platform/supabaseGuilds';

type MonthData = {
  month: string;
  rank: number | null;
  totalXp: number;
  contributors: Array<{ user_id: string; nickname: string; avatar_url?: string; level: number; rank: string; contributed_xp: number }>;
  mvp: { nickname: string; avatar_url?: string; contributed_xp: number } | null;
};

const GuildHistory: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash.startsWith('#guild-history'));
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guildName, setGuildName] = useState<string>('');
  const [monthsToShow, setMonthsToShow] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataByMonth, setDataByMonth] = useState<Record<string, MonthData>>({});

  useEffect(() => {
    const handler = () => setOpen(window.location.hash.startsWith('#guild-history'));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ハッシュからギルドIDを特定（なければ自分のギルドを使用）
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const id = params.get('id');
        let gid = id;
        if (!gid) {
          const g = await getMyGuild();
          gid = g?.id || null;
          if (g?.name) setGuildName(g.name);
        }
        setGuildId(gid);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const monthList = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    const oldest = new Date(Date.UTC(2024, 6, 1)); // 2024-07-01 (month is 0-based)
    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      if (d < oldest) break;
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, [monthsToShow]);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      // 月ごとデータを並行取得
      const promises = monthList.map(async (month) => {
        if (dataByMonth[month]) return; // 既存
        const [rank, contribs, totalXp] = await Promise.all([
          fetchGuildRankForMonth(guildId, month),
          fetchGuildContributorsWithProfiles(guildId, month),
          fetchGuildMonthlyXpSingle(guildId, month),
        ]);
        const mvp = contribs[0] ? { nickname: contribs[0].nickname, avatar_url: contribs[0].avatar_url, contributed_xp: contribs[0].contributed_xp } : null;
        const entry: MonthData = { month, rank, totalXp, contributors: contribs, mvp };
        setDataByMonth((prev) => ({ ...prev, [month]: entry }));
      });
      await Promise.all(promises);
    })();
  }, [guildId, monthList]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-xl font-bold">ギルドヒストリー</h2>
          {!guildId ? (
            <p className="text-gray-300 text-sm">ギルドが特定できません。ギルドダッシュボードからアクセスしてください。</p>
          ) : (
            <>
              <p className="text-gray-300 text-sm">ギルドID: <span className="font-mono">{guildId}</span></p>
              <div className="space-y-6">
                {monthList.map((m) => {
                  const d = dataByMonth[m];
                  return (
                    <div key={m} className="bg-slate-800 border border-slate-700 rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{m.slice(0, 7)}</h3>
                        {d?.mvp ? (
                          <div className="text-xs text-gray-300">MVP: <span className="font-bold text-white">{d.mvp.nickname}</span> <span className="ml-2 text-yellow-400">+{d.mvp.contributed_xp.toLocaleString()} XP</span></div>
                        ) : (
                          <div className="text-xs text-gray-400">MVP: -</div>
                        )}
                      </div>
                      {!d ? (
                        <p className="text-gray-500 text-sm">読み込み中...</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div className="bg-slate-900 rounded p-3 border border-slate-700">
                              <div className="text-gray-400">ギルド順位</div>
                              <div className="text-lg font-semibold">{d.rank ? `${d.rank}位` : '-'}</div>
                            </div>
                            <div className="bg-slate-900 rounded p-3 border border-slate-700">
                              <div className="text-gray-400">獲得XP</div>
                              <div className="text-lg font-semibold">{d.totalXp.toLocaleString()}</div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-semibold mb-2">貢献メンバー（1以上）</div>
                            {d.contributors.length === 0 ? (
                              <p className="text-gray-400 text-sm">該当メンバーなし</p>
                            ) : (
                              <ul className="space-y-2">
                                {d.contributors.map((u) => (
                                  <li key={`${m}-${u.user_id}`} className="flex items-center gap-2 text-sm">
                                    <img src={u.avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full" />
                                    <span className="truncate max-w-[200px]">{u.nickname}</span>
                                    {/* XPは表示しない指定 */}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="text-center">
                  <button className="btn btn-outline" onClick={() => setMonthsToShow((n) => n + 12)}>さらに過去の月を表示</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuildHistory;

