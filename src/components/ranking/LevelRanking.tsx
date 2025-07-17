import React, { useEffect, useState } from 'react';
import { fetchLevelRanking, RankingEntry } from '@/platform/supabaseRanking';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title } from '@/utils/titleConstants';
import { FaCrown } from 'react-icons/fa';

const LevelRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#ranking');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isGuest } = useAuthStore();

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open && user && !isGuest) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchLevelRanking();
          setEntries(data);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, user, isGuest]);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  // ゲストユーザーの場合
  if (!user || isGuest) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">ランキングはログインユーザー専用です</h4>
          <p className="text-center text-gray-300">ランキング機能を利用するにはログインが必要です。</p>
          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-sm btn-primary w-full" 
              onClick={() => { window.location.hash = '#login'; }}
            >
              ログイン / 会員登録
            </button>
            <button 
              className="btn btn-sm btn-outline w-full" 
              onClick={handleClose}
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">ユーザー</th>
                <th className="py-2 px-2 whitespace-nowrap">称号</th>
                <th className="py-2 px-2">Lv</th>
                <th className="py-2 px-2">XP</th>
                <th className="py-2 px-2">ランク</th>
                <th className="py-2 px-2">Twitter</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => {
                const isCurrentUser = user?.id === e.id;
                return (
                <tr key={e.id} className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                  isCurrentUser ? 'bg-primary-900/20 border-primary-500/30' : ''
                }`}>
                  <td className="py-1 px-2">{idx + 1}</td>
                  <td className="py-1 px-2">
                    <button
                      onClick={()=>{window.location.hash=`#diary-user?id=${e.id}`;}}
                      className={`flex items-center gap-2 hover:text-blue-400 transition-colors max-w-[12rem] ${
                        isCurrentUser ? 'text-primary-400 font-bold' : ''
                      }`}
                    >
                      <img 
                        src={e.avatar_url || DEFAULT_AVATAR_URL}
                        alt="avatar"
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="truncate">{e.nickname}</span>
                    </button>
                  </td>
                  <td className="py-1 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <FaCrown className="text-xs" />
                      <span className="text-xs">
                        {(e.selected_title as Title) || DEFAULT_TITLE}
                      </span>
                    </div>
                  </td>
                  <td className="py-1 px-2">{e.level}</td>
                  <td className="py-1 px-2">{e.xp.toLocaleString()}</td>
                  <td className="py-1 px-2 capitalize">{e.rank}</td>
                  <td className="py-1 px-2">
                    {e.twitter_handle ? (
                      <a 
                        href={`https://twitter.com/${e.twitter_handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:underline truncate block max-w-[8rem]"
                      >
                        {e.twitter_handle}
                      </a>
                    ) : '-'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelRanking; 