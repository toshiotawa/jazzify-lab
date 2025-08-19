import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { Guild, getGuildById, getGuildMembers, fetchGuildMemberMonthlyXp, fetchGuildRankForMonth, fetchGuildMonthlyXpSingle, requestJoin, getMyGuild, getMyPendingJoinRequestIdForGuild, cancelMyJoinRequest } from '@/platform/supabaseGuilds';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaTrophy, FaGraduationCap, FaHatWizard, FaCheckCircle } from 'react-icons/fa';

const GuildPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash.startsWith('#guild'));
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; nickname: string; avatar_url?: string; level: number; rank: string; role: 'leader' | 'member'; selected_title?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
  const [seasonXp, setSeasonXp] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [pendingJoinRequestId, setPendingJoinRequestId] = useState<string | null>(null);

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
          // 今シーズン（当月）合計XPと順位
          const now = new Date();
          const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0,10);
          const [xp, r] = await Promise.all([
            fetchGuildMonthlyXpSingle(g.id, currentMonth),
            fetchGuildRankForMonth(g.id, currentMonth),
          ]);
          setSeasonXp(xp);
          setRank(r);
          if (!mine && g.members_count < 5) {
            try {
              const reqId = await getMyPendingJoinRequestIdForGuild(g.id);
              setPendingJoinRequestId(reqId);
            } catch {}
          } else {
            setPendingJoinRequestId(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  if (!open) return null;


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
          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : !guild ? (
            <p className="text-gray-400">ギルドが見つかりません</p>
          ) : (
            <>
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <span>{guild.name}{guild.disbanded ? '（解散したギルド）' : ''}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${guild.guild_type === 'challenge' ? 'bg-pink-500 text-white' : 'bg-slate-600 text-white'}`}>
                        {guild.guild_type === 'challenge' ? 'チャレンジ' : 'カジュアル'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">Lv.{guild.level}</div>
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
                      pendingJoinRequestId ? (
                        <button className="btn btn-sm btn-outline" disabled={busy} onClick={async()=>{ try{ setBusy(true); await cancelMyJoinRequest(guild.id); setPendingJoinRequestId(null); alert('参加リクエストをキャンセルしました'); } catch(e:any){ alert(e?.message||'キャンセルに失敗しました'); } finally{ setBusy(false); } }}>申請をキャンセル</button>
                      ) : (
                        <button className="btn btn-sm btn-primary" disabled={busy} onClick={async()=>{ try{ setBusy(true); const id = await requestJoin(guild.id); setPendingJoinRequestId(id); alert('参加リクエストを送信しました'); } catch(e:any){ alert(e?.message||'リクエスト送信に失敗しました'); } finally{ setBusy(false); } }}>参加リクエスト</button>
                      )
                    )}
                  </div>
                </div>
                {guild.description && (
                  <div className="mt-3 text-sm text-gray-200 whitespace-pre-wrap">{guild.description}</div>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <h3 className="font-semibold mb-3">メンバーリスト ({guild.members_count}/5)</h3>
                {isMember ? (
                  members.length === 0 ? (
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
                          </div>
                          {m.role === 'leader' && (
                            <span className="text-[10px] px-2 py-0.5 rounded_full bg-yellow-500 text-black font-bold">Leader</span>
                          )}
                          {memberMonthly.some(x=>x.user_id===m.user_id && Number(x.monthly_xp||0)>=1) && (
                            <FaCheckCircle className="text-green-400 text-sm" title="今月のギルド貢献にカウント済み" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <p className="text-gray-400 text-sm">メンバー名は非公開です</p>
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