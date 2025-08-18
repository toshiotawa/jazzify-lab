import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  getMyGuild,
  getGuildMembers,
  searchGuilds,
  requestJoin,
  createGuild,
  Guild,
  GuildMember,
} from '@/platform/supabaseGuilds';
import GuildBoard from '@/components/guild/GuildBoard';

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const g = await getMyGuild();
        if (!mounted) return;
        setMyGuild(g);
        if (g) {
          const m = await getGuildMembers(g.id);
          if (!mounted) return;
          setMembers(m);
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

  if (!user) return null;
  if (loading) return <div className="p-4">読み込み中...</div>;

  if (!myGuild) {
    const isFree = profile?.rank === 'free';
    return (
      <div className="p-4 space-y-6">
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{myGuild.name}</h2>
          <div className="text-sm text-gray-400">Lv.{myGuild.level} / メンバー {members.length}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 p-4 rounded">
        <h3 className="font-semibold mb-3">メンバー</h3>
        {members.length === 0 ? (
          <p className="text-gray-400 text-sm">メンバーがいません</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {members.map(m => (
              <li key={m.user_id} className="flex items-center gap-3 bg-slate-800 p-2 rounded">
                <img src={m.avatar_url || ''} className="w-8 h-8 rounded-full bg-slate-700" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{m.nickname}</div>
                  <div className="text-xs text-gray-400">Lv.{m.level} / {m.role}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <GuildBoard guildId={myGuild.id} />
    </div>
  );
};

export default GuildDashboard;

