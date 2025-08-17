import React, { useEffect, useState } from 'react';
import { RankingEntry, fetchLevelRankingByView, fetchUserGlobalRank, fetchLessonRankingByRpc, fetchUserLessonRank } from '@/platform/supabaseRanking';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaStar, FaTrophy, FaGraduationCap, FaGem, FaMedal, FaHatWizard, FaSearch, FaPlus } from 'react-icons/fa';

type SortKey = 'level' | 'lessons' | 'missions';

const LevelRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#ranking');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('level');
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [clickedUserId, setClickedUserId] = useState<string | null>(null);
  const { user, isGuest, profile } = useAuthStore();
  const isStandardGlobal = profile?.rank === 'standard_global';
  const PAGE_SIZE = 50;
  const [offset, setOffset] = useState(0);

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

  const resetAndLoad = async () => {
    setLoading(true);
    setEntries([]);
    setHasMore(true);
    setOffset(0);
    try {
      const data = await fetchLevelRankingByView(PAGE_SIZE, 0);
      const filtered = isStandardGlobal
        ? data.map(e => ({ ...e, lessons_cleared: 0, missions_completed: 0 }))
        : data;
      setEntries(sortEntries(filtered, sortKey));
      setOffset(prev => prev + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchLevelRankingByView(PAGE_SIZE, offset);
      const filtered = isStandardGlobal
        ? data.map(e => ({ ...e, lessons_cleared: 0, missions_completed: 0 }))
        : data;
      setEntries(prev => {
        const exist = new Set(prev.map(e => e.id));
        const merged = [...prev, ...filtered.filter(e => !exist.has(e.id))];
        return sortEntries(merged, sortKey);
      });
      setOffset(prev => prev + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (open && user && !isGuest) {
      resetAndLoad();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, isGuest, isStandardGlobal]);

  // ソートキー変更時は再フェッチせず再ソートのみ
  useEffect(() => {
    setEntries(prev => sortEntries(prev, sortKey));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey]);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  const scrollToMyRow = async () => {
    if (!user) return;

    try {
      const PAGE_SIZE_NUM = 50;

      if (sortKey === 'lessons' && !isStandardGlobal) {
        // レッスン数ベースの順位でページジャンプ
        const lessonRank = await fetchUserLessonRank(user.id);
        if (!lessonRank || lessonRank <= 0) throw new Error('rank not found');
        const pageOffset = Math.floor((lessonRank - 1) / PAGE_SIZE_NUM) * PAGE_SIZE_NUM;
        const page = await fetchLessonRankingByRpc(PAGE_SIZE_NUM, pageOffset);
        const adjusted = page; // レッスン列はnon-standardのみ表示なのでそのまま
        setEntries(prev => {
          const map = new Map(prev.map(e => [e.id, e] as const));
          adjusted.forEach(e => map.set(e.id, e));
          return sortEntries(Array.from(map.values()), sortKey);
        });
      } else {
        // レベルベースの順位でページジャンプ
        const globalRank = await fetchUserGlobalRank(user.id);
        if (!globalRank || globalRank <= 0) throw new Error('rank not found');
        const pageOffset = Math.floor((globalRank - 1) / PAGE_SIZE_NUM) * PAGE_SIZE_NUM;
        const page = await fetchLevelRankingByView(PAGE_SIZE_NUM, pageOffset);
        const adjusted = isStandardGlobal
          ? page.map(e => ({ ...e, lessons_cleared: 0, missions_completed: 0 }))
          : page;
        setEntries(prev => {
          const exist = new Map(prev.map(e => [e.id, e] as const));
          adjusted.forEach(e => exist.set(e.id, e));
          return sortEntries(Array.from(exist.values()), sortKey);
        });
      }

      setTimeout(() => {
        const el = document.querySelector(`[data-user-id="${user.id}"]`);
        if (el && 'scrollIntoView' in el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert('スクロール対象が見つかりませんでした。');
        }
      }, 0);
    } catch (e) {
      console.error(e);
      alert('順位の取得に失敗しました。時間をおいて再度お試しください。');
    }
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
  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
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
    // 魔法使い称号の判定
    if (WIZARD_TITLES.includes(title as any)) {
      return 'wizard';
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
      case 'wizard':
        return <FaHatWizard className="text-xs flex-shrink-0 text-green-400" />;
      default:
        return <FaCrown className="text-xs flex-shrink-0 text-yellow-400" />;
    }
  };

  // ランクに応じたアイコンを取得する関数
  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'platinum':
        return <FaCrown className="text-purple-400 text-sm" />;
      case 'premium':
        return <FaGem className="text-yellow-400 text-sm" />;
      case 'standard':
      case 'standard_global':
        return <FaStar className="text-blue-400 text-xs" />;
      case 'free':
      default:
        return <FaMedal className="text-gray-400 text-xs" />;
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
            {/* アクションバー */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={scrollToMyRow}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-700 text-gray-200 hover:bg-slate-600 inline-flex items-center gap-2"
              >
                <FaSearch /> 自分を探す
              </button>
              <button
                onClick={loadMore}
                disabled={!hasMore || loadingMore}
                className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${!hasMore ? 'bg-slate-800 text-gray-500' : 'bg-primary-600 text-white hover:bg-primary-500'} ${loadingMore ? 'opacity-70' : ''}`}
              >
                <FaPlus /> さらに読み込む（50件）
              </button>
            </div>
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
              {!isStandardGlobal && (
                <>
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
                </>
              )}
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px] sm:min-w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-3 px-2 min-w-[3rem]">#</th>
                <th className="py-3 px-2 min-w-[12rem] sm:min-w-[10rem]">ユーザー(タップで詳細)</th>
                <th className="py-3 px-2 whitespace-nowrap min-w-[8rem] sm:min-w-[6rem]">称号</th>
                <th className="py-3 px-2 min-w-[3rem]">Lv</th>
                {!isStandardGlobal && <th className="py-3 px-2 min-w-[4rem]">レッスン</th>}
                {!isStandardGlobal && <th className="py-3 px-2 min-w-[4rem]">ミッション</th>}
                <th className="py-3 px-2 min-w-[4rem]">ファンタジー</th>
                {!isStandardGlobal && <th className="py-3 px-2 min-w-[5rem] sm:min-w-[4rem]">ランク</th>}
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
                    <button
                      onClick={()=>{window.location.hash=`#diary-user?id=${e.id}`;}}
                      className={`flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors w-full ${
                        isCurrentUser ? 'font-bold' : ''
                      }`}
                    >
                      <img 
                        src={e.avatar_url || DEFAULT_AVATAR_URL}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="truncate min-w-0 flex-1 underline">{e.nickname}</span>
                    </button>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="relative">
                      <div 
                        className="flex items-center gap-1 text-yellow-400 cursor-help"
                        onMouseEnter={() => setHoveredUserId(e.id)}
                        onMouseLeave={() => setHoveredUserId(null)}
                        onClick={(event) => {
                          event.stopPropagation();
                          setClickedUserId(clickedUserId === e.id ? null : e.id);
                        }}
                      >
                        {getTitleIcon((e.selected_title as Title) || DEFAULT_TITLE)}
                        <span className="text-xs truncate">
                          {(e.selected_title as Title) || DEFAULT_TITLE}
                        </span>
                      </div>
                      {/* ツールチップ */}
                      {(hoveredUserId === e.id || clickedUserId === e.id) && (
                        <div 
                          className="absolute z-50 bg-gray-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap"
                          style={{ 
                            bottom: '100%', 
                            left: '50%', 
                            transform: 'translateX(-50%)',
                            marginBottom: '4px'
                          }}
                        >
                          <div className="relative">
                            <div>{getTitleRequirement((e.selected_title as Title) || DEFAULT_TITLE)}</div>
                            {/* 下向き矢印 */}
                            <div 
                              className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                              style={{
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">{e.level}</td>
                  {!isStandardGlobal && <td className="py-3 px-2">{e.lessons_cleared}</td>}
                  {!isStandardGlobal && <td className="py-3 px-2">{e.missions_completed || 0}</td>}
                  <td className="py-3 px-2 text-purple-300">{e.fantasy_current_stage || '-'}</td>
                  {!isStandardGlobal && (
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-1">
                        {getRankIcon(e.rank)}
                        <span className="capitalize text-xs">{e.rank}</span>
                      </div>
                    </td>
                  )}
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