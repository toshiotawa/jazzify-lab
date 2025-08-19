import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { Guild, getGuildById, getGuildMembers, fetchGuildMemberMonthlyXp, fetchGuildRankForMonth, fetchGuildMonthlyXpSingle, requestJoin, getMyGuild, fetchGuildDailyStreaks } from '@/platform/supabaseGuilds';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaTrophy, FaGraduationCap, FaHatWizard, FaCheckCircle } from 'react-icons/fa';
import { computeGuildBonus, formatMultiplier } from '@/utils/guildBonus';

const GuildPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash.startsWith('#guild'));
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; nickname: string; avatar_url?: string; level: number; rank: string; role: 'leader' | 'member' }>>([]);
  const [loading, setLoading] = useState(true);
  const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
  const [seasonXp, setSeasonXp] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [streaks, setStreaks] = useState<Record<string, { daysCurrentStreak: number; tierPercent: number; tierMaxDays: number; display: string }>>({});

  useEffect(() => {
    const handler = () => setOpen(window.location.hash.startsWith('#guild'));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const id = params.get('id');
    setGuildId(id);
  }, [open]);

  useEffect(() => {
    (async () => {
      if (!guildId) return;
      setLoading(true);
      try {
        const g = await getGuildById(guildId);
        setGuild(g);
        const mine = await getMyGuild();
        setIsMember(!!(mine && mine.id === guildId));
        if (g) {
          const [m, per] = await Promise.all([
            getGuildMembers(g.id),
            fetchGuildMemberMonthlyXp(g.id),
          ]);
          setMembers(m);
          setMemberMonthly(per);
          const st = await fetchGuildDailyStreaks(g.id).catch(()=>({} as Record<string, any>));
          setStreaks(st);
          // 今シーズン（当月）合計XPと順位
          const now = new Date();
          const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0,10);
          const [xp, r] = await Promise.all([
            fetchGuildMonthlyXpSingle(g.id, currentMonth),
            fetchGuildRankForMonth(g.id, currentMonth),
          ]);
          setSeasonXp(xp);
          setRank(r);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  if (!open) return null;

  const contributors = memberMonthly.filter(x => Number(x.monthly_xp || 0) >= 1).length;
  const streakBonus = Object.values(streaks).reduce((sum, s) => sum + (s.tierPercent || 0), 0);
  const bonus = computeGuildBonus(guild?.level || 1, contributors, streakBonus);
  const mvpUserId = memberMonthly.sort((a,b)=>b.monthly_xp-a.monthly_xp)[0]?.user_id;
  const mvp = mvpUserId ? members.find(x => x.user_id === mvpUserId) : undefined;
  const mvpXp = memberMonthly.find(x => x.user_id === mvpUserId)?.monthly_xp || 0;

  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
    if (TITLES.includes(title as any)) return 'level';
    if (MISSION_TITLES.some(mt => mt.name === title)) return 'mission';
    if (LESSON_TITLES.some(lt => lt.name === title)) return 'lesson';
    if (WIZARD_TITLES.includes(title as any)) return 'wizard';
    return 'level';
  };

  const getTitleIcon = (title: string) => {
    const t = getTitleType(title);
    switch (t) {
      case 'level': return <FaCrown className="text-xs text-yellow-400"/>;
      case 'mission': return <FaTrophy className="text-xs text-purple-400"/>;
      case 'lesson': return <FaGraduationCap className="text-xs text-blue-400"/>;
      case 'wizard': return <FaHatWizard className="text-xs text-green-400"/>;
      default: return <FaCrown className="text-xs text-yellow-400"/>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-xl font-bold">ギルドページ</h2>
          {/* 説明カード（ミッションページ風） */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-2">ギルドボーナス</h3>
            <p className="text-gray-300 text-sm">ギルドに所属していると、XP獲得にボーナスが加算されます。レベル倍率（レベル1ごとに+0.1%）と、当月にXPを1以上獲得したメンバー人数×10%（最大+50%）のメンバー倍率の合算を、1に足した倍率が適用されます。</p>
          </div>
          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : !guild ? (
            <p className="text-gray-400">ギルドが見つかりません</p>
          ) : (
            <>
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{guild.name}{guild.disbanded ? '（解散したギルド）' : ''}</div>
                    <div className="text-sm text-gray-300 mt-1">Lv.{guild.level}</div>
                    <div className="text-sm text-green-400 mt-1">ギルドボーナス: {formatMultiplier(bonus.totalMultiplier)} <span className="text-xs text-gray-400 ml-1">（レベル +{(bonus.levelBonus*100).toFixed(1)}% / メンバー +{(bonus.memberBonus*100).toFixed(1)}% / ストリーク +{(bonus.streakBonus*100).toFixed(1)}%）</span></div>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="bg-slate-900 rounded p-3 border border-slate-700">
                        <div className="text-gray-400">今シーズン合計XP</div>
                        <div className="text-lg font-semibold">{seasonXp.toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-900 rounded p-3 border border-slate-700">
                        <div className="text-gray-400">順位</div>
                        <div className="text-lg font-semibold">{rank ? `${rank}位` : '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="btn btn-sm btn-outline" onClick={() => { const p = new URLSearchParams(); p.set('id', guild.id); window.location.hash = `#guild-history?${p.toString()}`; }}>ギルドヒストリーを見る</button>
                    {!isMember && guild.members_count < 5 && (
                      <button className="btn btn-sm btn-primary" disabled={busy} onClick={async()=>{ try{ setBusy(true); await requestJoin(guild.id); alert('参加リクエストを送信しました'); } catch(e:any){ alert(e?.message||'リクエスト送信に失敗しました'); } finally{ setBusy(false); } }}>参加リクエスト</button>
                    )}
                  </div>
                </div>
                {guild.description && (
                  <div className="mt-3 text-sm text-gray-200 whitespace-pre-wrap">{guild.description}</div>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <h3 className="font-semibold mb-3">MVP（今月）</h3>
                {!mvp ? (
                  <p className="text-gray-400 text-sm">該当なし</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <img src={mvp.avatar_url || DEFAULT_AVATAR_URL} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="font-medium">{mvp.nickname}</div>
                      <div className="text-xs text-gray-400">今月XP {Number(mvpXp || 0).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* チャレンジギルド: チャレンジ見出し */}
              {guild.guild_type === 'challenge' && (
                <div className="bg-slate-800 border border-slate-700 rounded p-4">
                  <h3 className="font-semibold mb-3">チャレンジ</h3>
                  <ul className="space-y-2">
                    {members.map(m => (
                      <li key={m.user_id} className="bg-slate-900 p-2 rounded">
                        <div className="flex items-center gap-3">
                          <img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <button className="hover:text-blue-400 truncate" onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }}>{m.nickname}</button>
                              {/* レベル（チャレンジレベル=連続日数ティア） */}
                              <span className="text-xs text-yellow-400">
                                {(() => {
                                  const s = streaks[m.user_id];
                                  if (!s) return 'Lv.0 (+0%)';
                                  return `Lv.${Math.min(s.daysCurrentStreak, s.tierMaxDays)} (+${Math.round(s.tierPercent*100)}%)`;
                                })()}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded overflow-hidden mt-1">
                              <div className="h-full bg-green-500" style={{ width: `${streaks[m.user_id] ? Math.min(100, (Math.min(streaks[m.user_id].daysCurrentStreak, streaks[m.user_id].tierMaxDays) / streaks[m.user_id].tierMaxDays) * 100) : 0}%` }} />
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">{streaks[m.user_id]?.display || '0/5 +0%'}</div>
                          </div>
                          {/* チャレンジボーナス倍率 */}
                          <div className="text-xs text-green-400 whitespace-nowrap">×{(1 + (streaks[m.user_id]?.tierPercent || 0)).toFixed(2)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <h3 className="font-semibold mb-3">メンバーリスト ({members.length}/5)</h3>
                {members.length === 0 ? (
                  <p className="text-gray-400 text-sm">メンバーがいません</p>
                ) : (
                  <ul className="space-y-2 text-base">
                    {members.map(m => (
                      <li key={m.user_id} className="flex items-center gap-2">
                        <button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} aria-label="ユーザーページへ">
                          <img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button className="hover:text-blue-400 truncate" onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }}>{m.nickname}</button>
                            {/* 称号（ホバー/タップで条件表示） */}
                            {m.selected_title && (
                              <div className="relative group">
                                <div className="flex items-center gap-1 text-yellow-400 cursor-help">
                                  {getTitleIcon((m.selected_title as Title) || DEFAULT_TITLE)}
                                  <span className="text-[11px] truncate max-w-[160px]">{(m.selected_title as Title) || DEFAULT_TITLE}</span>
                                </div>
                                <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap" style={{ top: '100%', left: 0, marginTop: '4px' }}>
                                  {getTitleRequirement((m.selected_title as Title) || DEFAULT_TITLE)}
                                  <div className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" style={{ top: '-4px', left: '12px' }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">Lv.{m.level} / {m.rank}</div>
                          {/* チャレンジギルド: 連続達成進捗 */}
                          {streaks[m.user_id] && (
                            <div className="mt-1">
                              <div className="h-1.5 bg-slate-700 rounded overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (Math.min(streaks[m.user_id].daysCurrentStreak, streaks[m.user_id].tierMaxDays) / streaks[m.user_id].tierMaxDays) * 100)}%` }} />
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">{streaks[m.user_id].display}</div>
                            </div>
                          )}
                        </div>
                        {m.role === 'leader' && (
                          <span className="text-[10px] px-2 py-0.5 rounded_full bg-yellow-500 text-black font-bold">Leader</span>
                        )}
                        {/* 当月貢献ありメンバー: Success!! アイコン */}
                        {memberMonthly.some(x=>x.user_id===m.user_id && Number(x.monthly_xp||0)>=1) && (
                          <FaCheckCircle className="text-green-400 text-sm" title="今月のギルド貢献にカウント済み" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuildPage;