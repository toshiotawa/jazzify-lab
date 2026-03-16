import React, { useEffect, useState } from 'react';
import { RankingEntry, fetchLevelRankingByView, fetchUserGlobalRank, fetchLessonRankingByRpc, fetchUserLessonRank } from '@/platform/supabaseRanking';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { FaTrophy, FaSearch, FaPlus } from 'react-icons/fa';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

type SortKey = 'lessons' | 'survival_stages';

const LevelRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#ranking');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('lessons');
  const { user, isGuest, profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const PAGE_SIZE = 50;
  const [pageOffset, setPageOffset] = useState(0);

  // 翻訳テキスト
  const findMeText = isEnglishCopy ? 'Find Me' : '自分を探す';
  const loadMoreText = isEnglishCopy ? 'Load More (50)' : 'さらに読み込む（50件）';
  const userColumnText = isEnglishCopy ? 'User' : 'ユーザー';
  const fantasyColumnText = isEnglishCopy ? 'Fantasy' : 'ファンタジー';
  const survivalColumnText = isEnglishCopy ? 'Survival' : 'サバイバル';

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const sortEntries = (entries: RankingEntry[], key: SortKey): RankingEntry[] => {
    return [...entries].sort((a, b) => {
      switch (key) {
        case 'lessons':
          return b.lessons_cleared - a.lessons_cleared;
        case 'survival_stages': {
          const aStages = a.survival_stages_cleared ?? 0;
          const bStages = b.survival_stages_cleared ?? 0;
          return bStages - aStages;
        }
        default:
          return 0;
      }
    });
  };

  const resetAndLoad = async () => {
    setLoading(true);
    setEntries([]);
    setHasMore(true);
    setPageOffset(0);
    try {
      const data = await fetchLevelRankingByView(PAGE_SIZE, 0);
      setEntries(sortEntries(data, sortKey));
      setPageOffset(prev => prev + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchLevelRankingByView(PAGE_SIZE, pageOffset);
      setEntries(prev => {
        const exist = new Set(prev.map(e => e.id));
        const merged = [...prev, ...data.filter(e => !exist.has(e.id))];
        return sortEntries(merged, sortKey);
      });
      setPageOffset(prev => prev + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (open && user && !isGuest) {
      resetAndLoad();
    }
  }, [open, user, isGuest]);

  // ソートキー変更時は再フェッチせず再ソートのみ
  useEffect(() => {
    setEntries(prev => sortEntries(prev, sortKey));
  }, [sortKey]);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  const scrollToMyRow = async () => {
    if (!user) return;

    try {
      const PAGE_SIZE_NUM = 50;

      if (sortKey === 'lessons') {
        const lessonRank = await fetchUserLessonRank(user.id);
        if (!lessonRank || lessonRank <= 0) throw new Error('rank not found');
        const pageOffset = Math.floor((lessonRank - 1) / PAGE_SIZE_NUM) * PAGE_SIZE_NUM;
        const page = await fetchLessonRankingByRpc(PAGE_SIZE_NUM, pageOffset);
        setEntries(prev => {
          const map = new Map(prev.map(e => [e.id, e] as const));
          page.forEach(e => map.set(e.id, e));
          return sortEntries(Array.from(map.values()), sortKey);
        });
      } else {
        const globalRank = await fetchUserGlobalRank(user.id);
        if (!globalRank || globalRank <= 0) throw new Error('rank not found');
        const pageOffset = Math.floor((globalRank - 1) / PAGE_SIZE_NUM) * PAGE_SIZE_NUM;
        const page = await fetchLevelRankingByView(PAGE_SIZE_NUM, pageOffset);
        setEntries(prev => {
          const map = new Map(prev.map(e => [e.id, e] as const));
          page.forEach(e => map.set(e.id, e));
          return sortEntries(Array.from(map.values()), sortKey);
        });
      }

      setTimeout(() => {
        const el = document.querySelector(`[data-user-id="${user.id}"]`);
        if (el && 'scrollIntoView' in el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert(isEnglishCopy ? 'Could not find your row.' : 'スクロール対象が見つかりませんでした。');
        }
      }, 0);
    } catch {
      alert(isEnglishCopy ? 'Failed to fetch rank. Please try again later.' : '順位の取得に失敗しました。時間をおいて再度お試しください。');
    }
  };

  // ゲストユーザーの場合
  if (!user || isGuest) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">ランキングはログインユーザー専用です</h4>
          <p className="text中心 text-gray-300">ランキング機能を利用するにはログインが必要です。</p>
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
    <div className="w-full h-full flex flex-col bg-gradient-game text白">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-4">
            {/* 説明セクション */}
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-2 mb-1">
                <FaTrophy className="text-yellow-400 text-sm" />
                <h3 className="text-sm font-semibold">
                  {isEnglishCopy ? 'Player Rankings' : 'プレイヤーランキング'}
                </h3>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm">
                {isEnglishCopy
                  ? 'Compare your progress with other players.'
                  : '他のプレイヤーと進捗を比較しましょう。'}
              </p>
            </div>

            {/* アクションバー */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={scrollToMyRow}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-700 text-gray-200 hover:bg-slate-600 inline-flex items-center gap-2"
              >
                <FaSearch /> {findMeText}
              </button>
              <button
                onClick={loadMore}
                disabled={!hasMore || loadingMore}
                className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${!hasMore ? 'bg-slate-800 text-gray-500' : 'bg-primary-600 text-white hover:bg-primary-500'} ${loadingMore ? 'opacity-70' : ''}`}
              >
                <FaPlus /> {loadMoreText}
              </button>
            </div>
            {/* ソート切り替えボタン */}
            <div className="flex justify-center space-x-2 flex-wrap gap-2">
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
                onClick={() => { window.location.hash = '#survival-ranking'; }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-800 text-white hover:bg-red-700"
              >
                Survival →
              </button>
              <button
                onClick={() => { window.location.hash = '#daily-challenge-ranking'; }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-purple-800 text-white hover:bg-purple-700"
              >
                Daily →
              </button>
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px] sm:min-w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-3 px-2 min-w-[3rem]">#</th>
                <th className="py-3 px-2 min-w-[12rem] sm:min-w-[10rem]">{userColumnText}</th>
                <th className="py-3 px-2 min-w-[4rem]">{isEnglishCopy ? 'Lessons' : 'レッスン'}</th>
                <th className="py-3 px-2 min-w-[4rem]">{fantasyColumnText}</th>
                <th className="py-3 px-2 min-w-[5rem]">{survivalColumnText}</th>
                <th className="py-3 px-2 min-w-[8rem] sm:min-w-[6rem]">Twitter</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => {
                const isCurrentUser = user?.id === e.id;
                return (
                <tr key={e.id} data-user-id={e.id} className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                  isCurrentUser ? 'bg-primary-900/20 border-primary-500/30' : ''
                }`}> 
                  <td className="py-3 px-2">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className={`flex items-center gap-2 ${isCurrentUser ? 'font-bold' : ''}`}>
                      <img 
                        src={e.avatar_url || DEFAULT_AVATAR_URL}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="truncate min-w-0 flex-1">{e.nickname}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">{e.lessons_cleared}</td>
                  <td className="py-3 px-2 text-purple-300">{e.fantasy_cleared_stages ?? 0}</td>
                  <td className="py-3 px-2 text-red-300">{e.survival_stages_cleared ?? 0}</td>
                  <td className="py-3 px-2">
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