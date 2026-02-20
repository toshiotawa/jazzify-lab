import React, { useEffect, useState, useCallback } from 'react';
import {
  DailyChallengeRankingEntry,
  fetchDailyChallengeRanking,
  fetchUserDailyChallengeRank,
} from '@/platform/supabaseRanking';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaStar, FaGem, FaMedal, FaHatWizard, FaSearch, FaPlus, FaTrophy, FaGraduationCap, FaArrowLeft } from 'react-icons/fa';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { translateTitle, translateTitleRequirement } from '@/utils/titleTranslations';
import type { DailyChallengeDifficulty } from '@/types';

const DIFFICULTIES: { key: DailyChallengeDifficulty; label: string; labelEn: string; color: string }[] = [
  { key: 'super_beginner', label: '超初級', labelEn: 'S.Beginner', color: 'bg-gray-600' },
  { key: 'beginner', label: '初級', labelEn: 'Beginner', color: 'bg-green-700' },
  { key: 'intermediate', label: '中級', labelEn: 'Intermediate', color: 'bg-blue-700' },
  { key: 'advanced', label: '上級', labelEn: 'Advanced', color: 'bg-orange-700' },
  { key: 'super_advanced', label: '超上級', labelEn: 'S.Advanced', color: 'bg-red-800' },
];

const PAGE_SIZE = 50;

const DailyChallengeRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#daily-challenge-ranking');
  const [entries, setEntries] = useState<DailyChallengeRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageOffset, setPageOffset] = useState(0);

  const [difficulty, setDifficulty] = useState<DailyChallengeDifficulty>('super_beginner');

  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [clickedUserId, setClickedUserId] = useState<string | null>(null);

  const { user, isGuest, profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#daily-challenge-ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const loadData = useCallback(async (diff: DailyChallengeDifficulty, offset: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await fetchDailyChallengeRanking(diff, PAGE_SIZE, offset);
      setEntries(prev => {
        if (!append) return data;
        const existIds = new Set(prev.map(e => e.user_id));
        return [...prev, ...data.filter(e => !existIds.has(e.user_id))];
      });
      setPageOffset(offset + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (open && user && !isGuest) {
      setEntries([]);
      setPageOffset(0);
      setHasMore(true);
      loadData(difficulty, 0, false);
    }
  }, [open, user, isGuest, difficulty, loadData]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    loadData(difficulty, pageOffset, true);
  };

  const scrollToMyRow = async () => {
    if (!user) return;
    try {
      const rank = await fetchUserDailyChallengeRank(difficulty, user.id);
      if (!rank || rank <= 0) {
        alert(isEnglishCopy ? 'You have no record for this difficulty.' : 'この難易度の記録がありません。');
        return;
      }
      const targetOffset = Math.floor((rank - 1) / PAGE_SIZE) * PAGE_SIZE;
      const page = await fetchDailyChallengeRanking(difficulty, PAGE_SIZE, targetOffset);
      setEntries(prev => {
        const map = new Map(prev.map(e => [e.user_id, e] as const));
        page.forEach(e => map.set(e.user_id, e));
        return Array.from(map.values()).sort((a, b) => b.best_score - a.best_score);
      });
      setTimeout(() => {
        const el = document.querySelector(`[data-dc-user-id="${user.id}"]`);
        if (el && 'scrollIntoView' in el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    } catch {
      alert(isEnglishCopy ? 'Failed to fetch rank.' : '順位の取得に失敗しました。');
    }
  };

  if (!open) return null;

  const handleClose = () => { window.location.hash = '#ranking'; };

  if (!user || isGuest) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">
            {isEnglishCopy ? 'Login required for rankings' : 'ランキングはログインユーザー専用です'}
          </h4>
          <div className="flex flex-col gap-3">
            <button className="btn btn-sm btn-primary w-full" onClick={() => { window.location.hash = '#login'; }}>
              {isEnglishCopy ? 'Login / Sign up' : 'ログイン / 会員登録'}
            </button>
            <button className="btn btn-sm btn-outline w-full" onClick={handleClose}>
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
    if ((TITLES as readonly string[]).includes(title)) return 'level';
    if (MISSION_TITLES.some(mt => mt.name === title)) return 'mission';
    if (LESSON_TITLES.some(lt => lt.name === title)) return 'lesson';
    if ((WIZARD_TITLES as readonly string[]).includes(title)) return 'wizard';
    return 'level';
  };

  const getTitleIcon = (title: string) => {
    const t = getTitleType(title);
    switch (t) {
      case 'level': return <FaCrown className="text-xs flex-shrink-0 text-yellow-400" />;
      case 'mission': return <FaTrophy className="text-xs flex-shrink-0 text-purple-400" />;
      case 'lesson': return <FaGraduationCap className="text-xs flex-shrink-0 text-blue-400" />;
      case 'wizard': return <FaHatWizard className="text-xs flex-shrink-0 text-green-400" />;
      default: return <FaCrown className="text-xs flex-shrink-0 text-yellow-400" />;
    }
  };

  const getRankIcon = (r: string) => {
    switch (r.toLowerCase()) {
      case 'black': return <FaCrown className="text-slate-200 text-sm" />;
      case 'platinum': return <FaCrown className="text-purple-400 text-sm" />;
      case 'premium': return <FaGem className="text-yellow-400 text-sm" />;
      case 'standard':
      case 'standard_global': return <FaStar className="text-blue-400 text-xs" />;
      default: return <FaMedal className="text-gray-400 text-xs" />;
    }
  };

  const findMeText = isEnglishCopy ? 'Find Me' : '自分を探す';
  const loadMoreText = isEnglishCopy ? 'Load More (50)' : 'さらに読み込む（50件）';

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleClose} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors" aria-label="Back">
            <FaArrowLeft className="text-sm" />
          </button>
          <h2 className="text-lg font-bold">
            {isEnglishCopy ? 'Daily Challenge Ranking' : 'デイリーチャレンジランキング'}
          </h2>
        </div>

        {/* 難易度タブ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {DIFFICULTIES.map(d => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                difficulty === d.key
                  ? `${d.color} text-white ring-2 ring-white/30`
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {isEnglishCopy ? d.labelEn : d.label}
            </button>
          ))}
        </div>

        {/* アクションバー */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <button onClick={scrollToMyRow} className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 text-gray-200 hover:bg-slate-600 inline-flex items-center gap-2">
            <FaSearch /> {findMeText}
          </button>
          <button
            onClick={handleLoadMore}
            disabled={!hasMore || loadingMore}
            className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
              !hasMore ? 'bg-slate-800 text-gray-500' : 'bg-primary-600 text-white hover:bg-primary-500'
            } ${loadingMore ? 'opacity-70' : ''}`}
          >
            <FaPlus /> {loadMoreText}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400">
            {isEnglishCopy ? 'No records yet.' : 'まだ記録がありません。'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px] sm:min-w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="py-3 px-2 min-w-[2.5rem]">#</th>
                  <th className="py-3 px-2 min-w-[10rem]">{isEnglishCopy ? 'User' : 'ユーザー'}</th>
                  <th className="py-3 px-2 whitespace-nowrap min-w-[6rem]">{isEnglishCopy ? 'Title' : '称号'}</th>
                  <th className="py-3 px-2 min-w-[4rem]">{isEnglishCopy ? 'Best Score' : 'ハイスコア'}</th>
                  <th className="py-3 px-2 min-w-[3rem]">{isEnglishCopy ? 'Plays' : '回数'}</th>
                  <th className="py-3 px-2 min-w-[4rem]">{isEnglishCopy ? 'Rank' : 'ランク'}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => {
                  const isCurrentUser = user?.id === e.user_id;
                  return (
                    <tr
                      key={e.user_id}
                      data-dc-user-id={e.user_id}
                      className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                        isCurrentUser ? 'bg-primary-900/20 border-primary-500/30' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        {idx < 3 ? (
                          <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                            {idx + 1}
                          </span>
                        ) : (idx + 1)}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => { window.location.hash = `#diary-user?id=${e.user_id}`; }}
                          className={`flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors w-full ${isCurrentUser ? 'font-bold' : ''}`}
                        >
                          <img src={e.avatar_url || DEFAULT_AVATAR_URL} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <span className="truncate min-w-0 flex-1 underline">{e.nickname}</span>
                        </button>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="relative">
                          <div
                            className="flex items-center gap-1 text-yellow-400 cursor-help"
                            onMouseEnter={() => setHoveredUserId(e.user_id)}
                            onMouseLeave={() => setHoveredUserId(null)}
                            onClick={(event) => { event.stopPropagation(); setClickedUserId(clickedUserId === e.user_id ? null : e.user_id); }}
                          >
                            {getTitleIcon((e.selected_title as Title) || DEFAULT_TITLE)}
                            <span className="text-xs truncate">
                              {translateTitle((e.selected_title as Title) || DEFAULT_TITLE, isEnglishCopy)}
                            </span>
                          </div>
                          {(hoveredUserId === e.user_id || clickedUserId === e.user_id) && (
                            <div className="absolute z-50 bg-gray-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap" style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px' }}>
                              <div className="relative">
                                <div>{translateTitleRequirement(getTitleRequirement((e.selected_title as Title) || DEFAULT_TITLE), isEnglishCopy)}</div>
                                <div className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-yellow-300 font-mono font-bold">{e.best_score}</td>
                      <td className="py-3 px-2 text-gray-300">{e.play_count}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1">
                          {getRankIcon(e.rank)}
                          <span className="capitalize text-xs">{e.rank}</span>
                        </div>
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

export default DailyChallengeRanking;
