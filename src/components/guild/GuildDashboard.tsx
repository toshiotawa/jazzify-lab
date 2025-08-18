import React, { useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { useAuthStore } from '@/stores/authStore';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import {
  getMyGuild,
  getGuildMembers,
  createGuild,
  fetchGuildRanking,
  fetchMyGuildRank,
  fetchGuildMonthlyRanks,
  searchGuilds,
  requestJoin,
  fetchPendingInvitationsForMe,
  acceptInvitation,
  rejectInvitation,
  fetchJoinRequestsForMyGuild,
  approveJoinRequest,
  rejectJoinRequest,
  kickMember,
  Guild,
  GuildMember,
} from '@/platform/supabaseGuilds';
import GuildBoard from '@/components/guild/GuildBoard';
import { getGuildTitleByLevel } from '@/utils/guildTitles';
import { calcGuildLevelDetail } from '@/utils/guildLevel';

const MAX_MEMBERS = 5;

const GuildDashboard: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#guilds');
  const { user, isGuest, profile } = useAuthStore();
  const isFree = profile?.rank === 'free';
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [ranking, setRanking] = useState<Array<{ guild_id: string; name: string; members_count: number; level: number; monthly_xp: number; rank_no: number }>>([]);
  const [myGuildRank, setMyGuildRank] = useState<number | null>(null);
  const [monthlyRanks, setMonthlyRanks] = useState<Array<{ month: string; monthly_xp: number; rank_no: number }>>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Guild[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#guilds');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open && user && !isGuest && !isFree) {
      void initialize();
    }
  }, [open, user, isGuest, isFree]);

  const initialize = async () => {
    setLoading(true);
    try {
      try {
        const g = await getMyGuild();
        setMyGuild(g);
        if (g) {
          const mem = await getGuildMembers(g.id);
          setMembers(mem);
          const [rankList, myRank, months] = await Promise.all([
            fetchGuildRanking(20, 0),
            fetchMyGuildRank(),
            fetchGuildMonthlyRanks(g.id, 12),
          ]);
          setRanking(rankList);
          setMyGuildRank(myRank);
          setMonthlyRanks(months);
          setJoinRequests(await fetchJoinRequestsForMyGuild());
        } else {
          // not in a guild: preload invites and ranking
          setRanking(await fetchGuildRanking(20, 0));
          setPendingInvites(await fetchPendingInvitationsForMe());
        }
      } catch (e) {
        console.warn('Guild initialize failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!guildName.trim()) {
      alert('ギルド名を入力してください');
      return;
    }
    try {
      setCreating(true);
      const id = await createGuild(guildName.trim());
      console.log('created guild', id);
      await initialize();
      setGuildName('');
    } catch (e: any) {
      alert(e.message || 'ギルド作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  const myRole = useMemo(() => {
    if (!myGuild) return null;
    const me = members.find(m => m.user_id === user?.id);
    return me?.role ?? null;
  }, [members, myGuild, user?.id]);

  if (!open) return null;

  if (!user || isGuest || isFree) {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-game text-white">
        <GameHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 max-w-md text-center space-y-3">
            <p>ギルド機能はスタンダード以上の会員限定です。</p>
            <a href="#pricing" className="btn btn-sm btn-primary">プランを見る</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-xl font-bold">ギルド</h2>

          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : myGuild ? (
            <div className="space-y-6">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{myGuild.name}</h3>
                    <div className="text-xs text-yellow-400">称号: {getGuildTitleByLevel(myGuild.level)}</div>
                    <p className="text-sm text-gray-300">メンバー {members.length}/{MAX_MEMBERS}</p>
                  </div>
                  <div className="text-sm text-gray-300">Lv {myGuild.level}</div>
                </div>
                {/* 進捗バー */}
                <div className="mt-3">
                  {(() => { const d = calcGuildLevelDetail(myGuild.total_xp || 0); return (
                    <div className="w-full h-2 bg-slate-700 rounded">
                      <div className="h-2 bg-primary-500 rounded" style={{ width: `${Math.min(100, Math.max(2, (d.remainder / d.nextLevelXp) * 100))}%` }} />
                    </div>
                  ); })()}
                </div>
                <div className="mt-3 text-sm text-gray-300">
                  今シーズン合計XP: {ranking.find(r => r.guild_id === myGuild.id)?.monthly_xp ?? 0} / 順位: {myGuildRank ?? '-'}位
                </div>
                {/* 過去12ヶ月チャート（簡易） */}
                <div className="mt-4 grid grid-cols-12 gap-1">
                  {monthlyRanks.map((m) => {
                    const best = Math.min(...monthlyRanks.map(x => x.rank_no || 9999));
                    return (
                      <div key={m.month} className="flex flex-col items-center" title={`${m.month} Rank ${m.rank_no}`}>
                        <div className={`w-4 h-4 ${m.rank_no === 1 ? 'bg-yellow-400' : 'bg-blue-500'} rounded-sm`} />
                        <span className="text-[10px] text-gray-400">{m.month.slice(5,7)}{m.rank_no === best ? '👑' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* メンバー一覧 */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold mb-2">メンバー</h4>
                <ul className="divide-y divide-slate-800">
                  {members.map((m) => (
                    <li key={m.user_id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-medium">{m.nickname}</div>
                          <div className="text-xs text-gray-400">Lv {m.level} / {m.rank}</div>
                        </div>
                      </div>
                      {myRole === 'leader' && m.user_id !== user?.id && (
                        <button className="btn btn-xs btn-outline" onClick={async ()=>{ if(confirm('このメンバーを除名しますか？')){ await kickMember(m.user_id); await initialize(); } }}>除名</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 掲示板 */}
              <GuildBoard guildId={myGuild.id} />

              {/* 参加リクエスト承認（リーダーのみ） */}
              {myRole === 'leader' && (
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <h4 className="font-semibold mb-2">参加リクエスト</h4>
                  {joinRequests.length === 0 ? (
                    <p className="text-sm text-gray-400">保留中のリクエストはありません。</p>
                  ) : (
                    <ul className="space-y-2">
                      {joinRequests.map((req) => (
                        <li key={req.id} className="flex items-center justify-between">
                          <div>{req.requester_nickname || req.requester_id}</div>
                          <div className="flex gap-2">
                            <button className="btn btn-xs btn-primary" onClick={async ()=>{ await approveJoinRequest(req.id); await initialize(); }}>承認</button>
                            <button className="btn btn-xs btn-outline" onClick={async ()=>{ await rejectJoinRequest(req.id); await initialize(); }}>非承認</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 招待の確認 */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold mb-2">受信した招待</h4>
                {pendingInvites.length === 0 ? (
                  <p className="text-sm text-gray-400">保留中の招待はありません。</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingInvites.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between">
                        <div>{inv.guild_name}（{inv.inviter_nickname}から）</div>
                        <div className="flex gap-2">
                          <button className="btn btn-xs btn-primary" onClick={async ()=>{ await acceptInvitation(inv.id); await initialize(); }}>承認</button>
                          <button className="btn btn-xs btn-outline" onClick={async ()=>{ await rejectInvitation(inv.id); await initialize(); }}>非承認</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ギルド作成 */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold mb-2">自分のギルドを作成</h4>
                <div className="flex gap-2">
                  <input className="input input-sm flex-1" placeholder="ギルド名" value={guildName} onChange={(e)=>setGuildName(e.target.value)} />
                  <button className="btn btn-sm btn-primary" disabled={creating} onClick={handleCreate}>作成</button>
                </div>
              </div>

              {/* ギルド検索と参加リクエスト */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold mb-2">ギルドを探す</h4>
                <div className="flex gap-2 mb-3">
                  <input className="input input-sm flex-1" placeholder="キーワード" value={searchKeyword} onChange={(e)=>setSearchKeyword(e.target.value)} />
                  <button className="btn btn-sm btn-outline" onClick={async ()=>{ setSearchResults(await searchGuilds(searchKeyword)); }}>検索</button>
                </div>
                <ul className="divide-y divide-slate-800">
                  {searchResults.map((g) => (
                    <li key={g.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-gray-400">Lv {g.level} / メンバー {g.members_count}/{MAX_MEMBERS}</div>
                      </div>
                      <button className="btn btn-xs btn-primary" onClick={async ()=>{ await requestJoin(g.id); alert('参加リクエストを送信しました'); }}>参加リクエスト</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ランキングプレビュー */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold mb-2">今月のギルドランキング</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
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
                      {ranking.map((r) => (
                        <tr key={r.guild_id} className="border-b border-slate-800">
                          <td className="py-2 px-2">{r.rank_no}</td>
                          <td className="py-2 px-2">{r.name}</td>
                          <td className="py-2 px-2">{r.level}</td>
                          <td className="py-2 px-2">{r.members_count}/{MAX_MEMBERS}</td>
                          <td className="py-2 px-2">{r.monthly_xp}</td>
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
    </div>
  );
};

export default GuildDashboard;

