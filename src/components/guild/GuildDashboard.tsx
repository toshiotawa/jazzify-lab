import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  getMyGuild,
  getGuildMembers,
  searchGuilds,
  requestJoin,
  createGuild,
  fetchMyGuildRank,
  fetchGuildMonthlyRanks,
  fetchGuildMemberMonthlyXp,
  fetchJoinRequestsForMyGuild,
  approveJoinRequest,
  rejectJoinRequest,
  Guild,
  GuildMember,
  GuildJoinRequest,
} from '@/platform/supabaseGuilds';
import GuildBoard from '@/components/guild/GuildBoard';
import GameHeader from '@/components/ui/GameHeader';
import { currentLevelXP, xpToNextLevel } from '@/utils/xpCalculator';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

const GuildDashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Guild[]>([]);
  const [creating, setCreating] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [busy, setBusy] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [thisMonthXp, setThisMonthXp] = useState<number>(0);
  const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
  const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const g = await getMyGuild();
        if (!mounted) return;
        setMyGuild(g);
        if (g) {
          const [m, rank, months, perMember] = await Promise.all([
            getGuildMembers(g.id),
            fetchMyGuildRank(),
            fetchGuildMonthlyRanks(g.id, 1),
            fetchGuildMemberMonthlyXp(g.id),
          ]);
          if (!mounted) return;
          setMembers(m);
          setMyRank(rank ?? null);
          setThisMonthXp(months?.[0]?.monthly_xp ? Number(months[0].monthly_xp) : 0);
          setMemberMonthly(perMember);
          // リーダーなら参加リクエスト取得
          if (user && g.leader_id === user.id) {
            const reqs = await fetchJoinRequestsForMyGuild();
            if (mounted) setJoinRequests(reqs);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const doSearch = async () => {
    setBusy(true);
    try {
      const list = await searchGuilds(keyword);
      setResults(list);
    } finally {
      setBusy(false);
    }
  };

  const isLeader = !!(user && myGuild && myGuild.leader_id === user.id);

  if (!user) return null;
  if (loading) return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">読み込み中...</div>
    </div>
  );

  if (!myGuild) {
    const isFree = profile?.rank === 'free';
    return (
      <div className="w-full h-full flex flex-col bg-gradient-game text-white">
        <GameHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-xl font-bold">ギルド</h2>
            <p className="text-gray-300 text-sm">ギルドに参加して、メンバーと一緒に成長しましょう。</p>

            {!isFree && (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded">
                <h3 className="font-semibold mb-2">ギルドを作成</h3>
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 bg-slate-800 p-2 rounded"
                    placeholder="ギルド名"
                    value={newGuildName}
                    onChange={(e) => setNewGuildName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={busy || !newGuildName.trim()}
                    onClick={async () => {
                      try {
                        setBusy(true);
                        await createGuild(newGuildName.trim());
                        setNewGuildName('');
                        const g = await getMyGuild();
                        setMyGuild(g);
                        if (g) setMembers(await getGuildMembers(g.id));
                      } catch (e: any) {
                        alert(e?.message || 'ギルド作成に失敗しました');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >作成</button>
                </div>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-700 p-4 rounded">
              <h3 className="font-semibold mb-2">ギルドを探す</h3>
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 bg-slate-800 p-2 rounded"
                  placeholder="キーワードで検索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void doSearch(); }}
                />
                <button className="btn" disabled={busy} onClick={() => void doSearch()}>検索</button>
              </div>
              {results.length === 0 ? (
                <p className="text-gray-400 text-sm">検索結果はありません</p>
              ) : (
                <ul className="space-y-2">
                  {results.map(g => (
                    <li key={g.id} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                      <div>
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-gray-400">Lv.{g.level} / メンバー {g.members_count}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => { const p = new URLSearchParams(); p.set('id', g.id); window.location.hash = `#guild-history?${p.toString()}`; }}
                        >ヒストリー</button>
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              setBusy(true);
                              await requestJoin(g.id);
                              alert('加入申請を送信しました');
                            } catch (e: any) {
                              alert(e?.message || '申請に失敗しました');
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >加入申請</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ギルド称号（簡易）
  const guildTitle = (() => {
    const lvl = myGuild?.level || 1;
    if (lvl < 5) return 'Novice Guild';
    if (lvl < 10) return 'Brave Guild';
    if (lvl < 20) return 'Elite Guild';
    return 'Legend Guild';
  })();

  const levelRemainder = currentLevelXP(myGuild?.level || 1, myGuild?.total_xp || 0);
  const nextLevelXp = xpToNextLevel(myGuild?.level || 1);
  const progress = Math.max(0, Math.min(100, (levelRemainder / Math.max(1, nextLevelXp)) * 100));

  const mvp = (() => {
    if (memberMonthly.length === 0) return null as null | { user_id: string; monthly_xp: number; nickname: string; avatar_url?: string };
    const top = [...memberMonthly].sort((a, b) => b.monthly_xp - a.monthly_xp)[0];
    const mem = members.find(x => x.user_id === top.user_id);
    return { user_id: top.user_id, monthly_xp: top.monthly_xp, nickname: mem?.nickname || 'Member', avatar_url: mem?.avatar_url };
  })();

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* ヘッダー情報 */}
          <div>
            <h2 className="text-xl font-bold">ギルド</h2>
            <div className="mt-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-2xl font-bold break-all">{myGuild.name}</div>
                  <div className="text-sm text-gray-300 mt-1">称号: {guildTitle}</div>
                  <div className="text-xs text-gray-400">メンバー {members.length}/5</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-900 rounded p-3 border border-slate-700">
                    <div className="text-gray-400">ギルドレベル</div>
                    <div className="text-lg font-semibold">{myGuild.level}</div>
                  </div>
                  <div className="bg-slate-900 rounded p-3 border border-slate-700">
                    <div className="text-gray-400">今シーズン合計XP</div>
                    <div className="text-lg font-semibold">{thisMonthXp.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-900 rounded p-3 border border-slate-700">
                    <div className="text-gray-400">順位</div>
                    <button
                      className="text-lg font-semibold hover:text-blue-400"
                      onClick={() => { window.location.hash = '#guilds-ranking'; }}
                      title="ギルドランキングを開く"
                    >{myRank ? `${myRank}位` : '-'}</button>
                  </div>
                  <div className="bg-slate-900 rounded p-3 border border-slate-700">
                    <div className="text-gray-400">累計XP</div>
                    <div className="text-lg font-semibold">{(myGuild.total_xp || 0).toLocaleString()}</div>
                  </div>
                  <div className="col-span-2 sm:col-span-3 bg-slate-900 rounded p-3 border border-slate-700">
                    <div className="text-gray-400 mb-1">現在レベルの進捗: {levelRemainder.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</div>
                    <div className="bg-slate-700 h-2 rounded overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-right">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('id', myGuild.id);
                    window.location.hash = `#guild-history?${params.toString()}`;
                  }}
                >ギルドヒストリーを見る</button>
              </div>
            </div>
          </div>

          {/* MVP セクション */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="font-semibold mb-3">MVPメンバー（今月）</h3>
            {!mvp ? (
              <p className="text-gray-400 text-sm">データがありません</p>
            ) : (
              <div className="flex items-center gap-3">
                <img src={mvp.avatar_url || DEFAULT_AVATAR_URL} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="font-medium">{mvp.nickname}</div>
                  <div className="text-xs text-gray-400">今月XP {Number(mvp.monthly_xp || 0).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* メンバー一覧 */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="font-semibold mb-3">メンバー一覧</h3>
            {members.length === 0 ? (
              <p className="text-gray-400 text-sm">メンバーがいません</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {members.map(m => (
                  <li key={m.user_id} className="flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-700">
                    <button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} aria-label="ユーザーページへ">
                      <img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} className="font-medium text-sm truncate text-left hover:text-blue-400">
                        {m.nickname}
                      </button>
                      <div className="text-xs text-gray-400">Lv {m.level} / {m.rank}</div>
                    </div>
                    {m.role === 'leader' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-black font-bold">Leader</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 掲示板 */}
          <GuildBoard guildId={myGuild.id} />

          {/* 参加リクエスト（リーダーのみ） */}
          {isLeader && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="font-semibold mb-3">参加リクエスト</h3>
              {joinRequests.length === 0 ? (
                <p className="text-gray-400 text-sm">保留中のリクエストはありません。</p>
              ) : (
                <ul className="space-y-2">
                  {joinRequests.map(r => (
                    <li key={r.id} className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-700">
                      <div className="text-sm">{r.requester_nickname || r.requester_id}</div>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-xs btn-outline"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              setBusy(true);
                              await rejectJoinRequest(r.id);
                              setJoinRequests(prev => prev.filter(x => x.id !== r.id));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >拒否</button>
                        <button
                          className="btn btn-xs btn-primary"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              setBusy(true);
                              await approveJoinRequest(r.id);
                              setJoinRequests(prev => prev.filter(x => x.id !== r.id));
                              // 参加承認後、メンバーを再取得
                              const m = await getGuildMembers(myGuild.id);
                              setMembers(m);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >承認</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuildDashboard;

