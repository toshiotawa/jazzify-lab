import React, { useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import GuildBoard from '@/components/guild/GuildBoard';
import {
  getMyGuild,
  getGuildMembers,
  fetchMyGuildRank,
  fetchGuildMonthlyRanks,
  fetchPendingInvitationsForMe,
  fetchJoinRequestsForMyGuild,
  acceptInvitation,
  rejectInvitation,
  approveJoinRequest,
  rejectJoinRequest,
  createGuild,
  searchGuilds,
  requestJoin,
  kickMember,
  type Guild,
  type GuildMember,
  type GuildInvitation,
  type GuildJoinRequest,
} from '@/platform/supabaseGuilds';
import { useAuthStore } from '@/stores/authStore';

const GuildDashboard: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#guilds');
  const { user, profile } = useAuthStore();

  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [myGuildRank, setMyGuildRank] = useState<number | null>(null);
  const [monthlyRanks, setMonthlyRanks] = useState<Array<{ month: string; monthly_xp: number; rank_no: number | null }>>([]);

  const [pendingInvitations, setPendingInvitations] = useState<GuildInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([]);

  const [creatingName, setCreatingName] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Guild[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  const isFreePlan = profile?.rank === 'free';

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#guilds');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    void reloadAll();
  }, [open]);

  const reloadAll = async () => {
    setLoading(true);
    try {
      const g = await getMyGuild();
      setMyGuild(g);
      if (g) {
        const [m, rank, months] = await Promise.all([
          getGuildMembers(g.id),
          fetchMyGuildRank(),
          fetchGuildMonthlyRanks(g.id, 6),
        ]);
        setMembers(m);
        setMyGuildRank(rank);
        setMonthlyRanks(months);
        // リーダーの場合は参加申請も取得
        const jr = await fetchJoinRequestsForMyGuild();
        setJoinRequests(jr);
        setPendingInvitations([]);
      } else {
        const inv = await fetchPendingInvitationsForMe();
        setPendingInvitations(inv);
        setMembers([]);
        setMyGuildRank(null);
        setMonthlyRanks([]);
        setJoinRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const amILeader = useMemo(() => {
    if (!myGuild || !user) return false;
    return myGuild.leader_id === user.id;
  }, [myGuild, user]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-bold mb-4">ギルド</h3>

        {loading ? (
          <p className="text-gray-300">読み込み中...</p>
        ) : (
          <div className="space-y-6">
            {myGuild ? (
              <div className="space-y-6">
                <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-xl font-bold">{myGuild.name}</h4>
                      <div className="text-sm text-gray-300 mt-1">
                        レベル {myGuild.level} ・ メンバー {myGuild.members_count}/5 ・ 総XP {myGuild.total_xp}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        今月のギルド順位: {myGuildRank ?? '—'} 位
                      </div>
                    </div>
                  </div>
                  {monthlyRanks.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm min-w-[520px]">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="py-2 px-2 text-left">月</th>
                            <th className="py-2 px-2 text-left">XP</th>
                            <th className="py-2 px-2 text-left">順位</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyRanks.map((r) => (
                            <tr key={r.month} className="border-b border-slate-800">
                              <td className="py-2 px-2">{r.month}</td>
                              <td className="py-2 px-2">{r.monthly_xp}</td>
                              <td className="py-2 px-2">{r.rank_no ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">メンバー</h4>
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-400">メンバーがいません</p>
                  ) : (
                    <ul className="divide-y divide-slate-800">
                      {members.map((m) => (
                        <li key={m.user_id} className="py-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <div className="font-medium">{m.nickname}</div>
                              <div className="text-gray-400">Lv {m.level} ・ {m.rank}</div>
                            </div>
                          </div>
                          {amILeader && user && user.id !== m.user_id && (
                            <button
                              className="btn btn-xs btn-outline"
                              disabled={!!busyMap[m.user_id]}
                              onClick={async () => {
                                try {
                                  setBusyMap((s) => ({ ...s, [m.user_id]: true }));
                                  await kickMember(m.user_id);
                                  await reloadAll();
                                } finally {
                                  setBusyMap((s) => ({ ...s, [m.user_id]: false }));
                                }
                              }}
                            >除名</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {amILeader && (
                  <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">加入申請</h4>
                    {joinRequests.length === 0 ? (
                      <p className="text-sm text-gray-400">申請はありません</p>
                    ) : (
                      <ul className="space-y-2">
                        {joinRequests.map((r) => (
                          <li key={r.id} className="bg-slate-800 rounded p-2 flex items-center justify-between">
                            <div className="text-sm">{r.requester_nickname || r.requester_id}</div>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-xs btn-primary"
                                disabled={!!busyMap[r.id]}
                                onClick={async () => {
                                  try {
                                    setBusyMap((s) => ({ ...s, [r.id]: true }));
                                    await approveJoinRequest(r.id);
                                    await reloadAll();
                                  } finally {
                                    setBusyMap((s) => ({ ...s, [r.id]: false }));
                                  }
                                }}
                              >承認</button>
                              <button
                                className="btn btn-xs btn-outline"
                                disabled={!!busyMap[r.id]}
                                onClick={async () => {
                                  try {
                                    setBusyMap((s) => ({ ...s, [r.id]: true }));
                                    await rejectJoinRequest(r.id);
                                    await reloadAll();
                                  } finally {
                                    setBusyMap((s) => ({ ...s, [r.id]: false }));
                                  }
                                }}
                              >却下</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                <section>
                  <GuildBoard guildId={myGuild.id} />
                </section>
              </div>
            ) : (
              <div className="space-y-6">
                {!isFreePlan && (
                  <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">ギルドを作成</h4>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-slate-800 p-2 rounded"
                        placeholder="ギルド名"
                        value={creatingName}
                        onChange={(e) => setCreatingName(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          const name = creatingName.trim();
                          if (!name) return;
                          try {
                            await createGuild(name);
                            setCreatingName('');
                            await reloadAll();
                          } catch (e: any) {
                            alert(e?.message || 'ギルド作成に失敗しました');
                          }
                        }}
                      >作成</button>
                    </div>
                  </section>
                )}

                <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">ギルドを探す</h4>
                  <div className="flex gap-2 items-center">
                    <input
                      className="flex-1 bg-slate-800 p-2 rounded"
                      placeholder="キーワード"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <button
                      className="btn btn-outline"
                      disabled={searching}
                      onClick={async () => {
                        setSearching(true);
                        try {
                          const list = await searchGuilds(searchKeyword);
                          setSearchResults(list);
                        } finally {
                          setSearching(false);
                        }
                      }}
                    >検索</button>
                  </div>
                  <div className="mt-3">
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-gray-400">検索結果はありません</p>
                    ) : (
                      <ul className="space-y-2">
                        {searchResults.map((g) => (
                          <li key={g.id} className="bg-slate-800 rounded p-2 flex items-center justify-between">
                            <div className="text-sm">
                              <div className="font-medium">{g.name}</div>
                              <div className="text-gray-400">Lv {g.level} ・ メンバー {g.members_count}/5</div>
                            </div>
                            {!isFreePlan && (
                              <button
                                className="btn btn-xs btn-primary"
                                disabled={!!busyMap[g.id]}
                                onClick={async () => {
                                  try {
                                    setBusyMap((s) => ({ ...s, [g.id]: true }));
                                    await requestJoin(g.id);
                                    alert('加入申請を送信しました');
                                  } catch (e: any) {
                                    alert(e?.message || '加入申請に失敗しました');
                                  } finally {
                                    setBusyMap((s) => ({ ...s, [g.id]: false }));
                                  }
                                }}
                              >加入申請</button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">招待</h4>
                  {pendingInvitations.length === 0 ? (
                    <p className="text-sm text-gray-400">招待はありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {pendingInvitations.map((inv) => (
                        <li key={inv.id} className="bg-slate-800 rounded p-2 flex items-center justify-between">
                          <div className="text-sm">
                            <div className="font-medium">{inv.guild_name || inv.guild_id}</div>
                            <div className="text-gray-400">招待者: {inv.inviter_nickname || inv.inviter_id}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-xs btn-primary"
                              disabled={!!busyMap[inv.id]}
                              onClick={async () => {
                                try {
                                  setBusyMap((s) => ({ ...s, [inv.id]: true }));
                                  await acceptInvitation(inv.id);
                                  await reloadAll();
                                } finally {
                                  setBusyMap((s) => ({ ...s, [inv.id]: false }));
                                }
                              }}
                            >参加</button>
                            <button
                              className="btn btn-xs btn-outline"
                              disabled={!!busyMap[inv.id]}
                              onClick={async () => {
                                try {
                                  setBusyMap((s) => ({ ...s, [inv.id]: true }));
                                  await rejectInvitation(inv.id);
                                  await reloadAll();
                                } finally {
                                  setBusyMap((s) => ({ ...s, [inv.id]: false }));
                                }
                              }}
                            >辞退</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuildDashboard;

