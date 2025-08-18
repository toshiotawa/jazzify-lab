import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { Guild, getGuildById, getGuildMembers, fetchGuildMemberMonthlyXp } from '@/platform/supabaseGuilds';
import { computeGuildBonus, formatMultiplier } from '@/utils/guildBonus';

const GuildPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash.startsWith('#guild'));
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; nickname: string; avatar_url?: string; level: number; rank: string; role: 'leader' | 'member' }>>([]);
  const [loading, setLoading] = useState(true);
  const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);

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
        if (g) {
          const [m, per] = await Promise.all([
            getGuildMembers(g.id),
            fetchGuildMemberMonthlyXp(g.id),
          ]);
          setMembers(m);
          setMemberMonthly(per);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  if (!open) return null;

  const contributors = memberMonthly.filter(x => Number(x.monthly_xp || 0) >= 1).length;
  const bonus = computeGuildBonus(guild?.level || 1, contributors);

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
                    <div className="text-sm text-gray-300 mt-1">Lv.{guild.level} / メンバー {guild.members_count}</div>
                    <div className="text-sm text-green-400 mt-1">ギルドボーナス: {formatMultiplier(bonus.totalMultiplier)} <span className="text-xs text-gray-400 ml-1">（レベル +{(bonus.levelBonus*100).toFixed(1)}% / メンバー +{(bonus.memberBonus*100).toFixed(0)}%）</span></div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline" onClick={() => { const p = new URLSearchParams(); p.set('id', guild.id); window.location.hash = `#guild-history?${p.toString()}`; }}>ギルドヒストリーを見る</button>
                  </div>
                </div>
                {guild.description && (
                  <div className="mt-3 text-sm text-gray-200 whitespace-pre-wrap">{guild.description}</div>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <h3 className="font-semibold mb-3">メンバー</h3>
                {members.length === 0 ? (
                  <p className="text-gray-400 text-sm">メンバーがいません</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map(m => (
                      <li key={m.user_id} className="flex items-center gap-2">
                        <button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} aria-label="ユーザーページへ">
                          <img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                        </button>
                        <button className="hover:text-blue-400" onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }}>{m.nickname}</button>
                        <span className="text-xs text-gray-400">Lv.{m.level} / {m.rank}</span>
                        {m.role === 'leader' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-black font-bold">Leader</span>
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