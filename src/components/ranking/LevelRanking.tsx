import React, { useEffect, useState } from 'react';
import { fetchLevelRanking, RankingEntry } from '@/platform/supabaseRanking';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES } from '@/utils/titleConstants';
import { FaCrown, FaStar, FaTrophy, FaGraduationCap } from 'react-icons/fa';

type SortKey = 'level' | 'lessons' | 'missions';

const LevelRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#ranking');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('level');
  const { user, isGuest } = useAuthStore();

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ソート関数
  const sortEntries = (entries: RankingEntry[], key: SortKey): RankingEntry[] => {
    return [...entries].sort((a, b) => {
      switch (key) {
        case 'level':
          if (a.level !== b.level) return b.level - a.level;
          return b.xp - a.xp; // レベルが同じ場合はXPで比較
        case 'lessons':
          if (a.lessons_cleared !== b.lessons_cleared) return b.lessons_cleared - a.lessons_cleared;
          return b.level - a.level; // レッスン数が同じ場合はレベルで比較
        case 'missions':
          if (a.missions_completed !== b.missions_completed) return b.missions_completed - a.missions_completed;
          return b.level - a.level; // ミッション数が同じ場合はレベルで比較
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    if (open && user && !isGuest) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchLevelRanking();
          setEntries(sortEntries(data, sortKey));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, user, isGuest, sortKey]);

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

  // 称号の種類を判定する関数
  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' => {
    // レベル称号の判定
    if (TITLES.includes(title as any)) {
      return 'level';
    }
    // ミッション称号の判定
    if (MISSION_TITLES.some(mt => mt.name === title)) {
      return 'mission';
    }
    // レッスン称号の判定
    if (LESSON_TITLES.some(lt => lt.name === title)) {
      return 'lesson';
    }
    // デフォルトはレベル称号
    return 'level';
  };

  // 称号タイプに応じたアイコンを取得する関数
  const getTitleIcon = (title: string) => {
    const titleType = getTitleType(title);
    switch (titleType) {
      case 'level':
        return <FaCrown className="text-xs flex-shrink-0 text-yellow-400" />;
      case 'mission':
        return <FaTrophy className="text-xs flex-shrink-0 text-purple-400" />;
      case 'lesson':
        return <FaGraduationCap className="text-xs flex-shrink-0 text-blue-400" />;
      default:
        return <FaCrown className="text-xs flex-shrink-0 text-yellow-400" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-4">
            {/* ソート切り替えボタン */}
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setSortKey('level')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortKey === 'level'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Level
              </button>
              <button
                onClick={() => setSortKey('lessons')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortKey === 'lessons'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Lesson
              </button>
              <button
                onClick={() => setSortKey('missions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortKey === 'missions'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Mission
              </button>
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[800px] sm:min-w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-2 px-2 min-w-[3rem]">#</th>
                <th className="py-2 px-2 min-w-[12rem] sm:min-w-[10rem]">ユーザー</th>
                <th className="py-2 px-2 whitespace-nowrap min-w-[8rem] sm:min-w-[6rem]">称号</th>
                <th className="py-2 px-2 min-w-[3rem]">Lv</th>
                <th className="py-2 px-2 min-w-[4rem]">レッスン</th>
                <th className="py-2 px-2 min-w-[4rem]">ミッション</th>
                <th className="py-2 px-2 min-w-[5rem] sm:min-w-[4rem]">ランク</th>
                <th className="py-2 px-2 min-w-[8rem] sm:min-w-[6rem]">Twitter</th>
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
                      className={`flex items-center gap-2 hover:text-blue-400 transition-colors w-full ${
                        isCurrentUser ? 'text-primary-400 font-bold' : ''
                      }`}
                    >
                      <img 
                        src={e.avatar_url || DEFAULT_AVATAR_URL}
                        alt="avatar"
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="truncate min-w-0 flex-1">{e.nickname}</span>
                    </button>
                  </td>
                  <td className="py-1 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {getTitleIcon((e.selected_title as Title) || DEFAULT_TITLE)}
                      <span className="text-xs truncate">
                        {(e.selected_title as Title) || DEFAULT_TITLE}
                      </span>
                    </div>
                  </td>
                  <td className="py-1 px-2">{e.level}</td>
                  <td className="py-1 px-2">{e.lessons_cleared}</td>
                  <td className="py-1 px-2">{e.missions_completed || 0}</td>
                  <td className="py-1 px-2 capitalize">{e.rank}</td>
                  <td className="py-1 px-2">
                    {e.twitter_handle ? (
                      <a 
                        href={`https://twitter.com/${e.twitter_handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:underline truncate block w-full"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelRanking; 