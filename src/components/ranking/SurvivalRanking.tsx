import React, { useEffect, useState, useCallback } from 'react';
import {
  SurvivalRankingEntry,
  fetchSurvivalRanking,
  fetchUserSurvivalRank,
} from '@/platform/supabaseRanking';
import {
  fetchSurvivalCharacters,
  SurvivalCharacterRow,
} from '@/platform/supabaseSurvival';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaStar, FaGem, FaMedal, FaHatWizard, FaSearch, FaPlus, FaTrophy, FaGraduationCap, FaArrowLeft } from 'react-icons/fa';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { translateTitle, translateTitleRequirement } from '@/utils/titleTranslations';

type Difficulty = 'veryeasy' | 'easy' | 'normal' | 'hard' | 'extreme';

const DIFFICULTIES: { key: Difficulty; label: string; labelEn: string; color: string }[] = [
  { key: 'veryeasy', label: 'V.Easy', labelEn: 'V.Easy', color: 'bg-gray-600' },
  { key: 'easy', label: 'Easy', labelEn: 'Easy', color: 'bg-green-700' },
  { key: 'normal', label: 'Normal', labelEn: 'Normal', color: 'bg-blue-700' },
  { key: 'hard', label: 'Hard', labelEn: 'Hard', color: 'bg-orange-700' },
  { key: 'extreme', label: 'Extreme', labelEn: 'Extreme', color: 'bg-red-800' },
];

const PAGE_SIZE = 50;

const SurvivalRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#survival-ranking');
  const [entries, setEntries] = useState<SurvivalRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageOffset, setPageOffset] = useState(0);

  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<SurvivalCharacterRow[]>([]);

  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [clickedUserId, setClickedUserId] = useState<string | null>(null);

  const { user, isGuest, profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const isStandardGlobal = profile?.rank === 'standard_global';

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#survival-ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    fetchSurvivalCharacters()
      .then(setCharacters)
      .catch(() => {});
  }, []);

  const loadData = useCallback(async (diff: Difficulty, charId: string | null, offset: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await fetchSurvivalRanking(diff, charId, PAGE_SIZE, offset);
      setEntries(prev => {
        if (!append) return data;
        const existIds = new Set(prev.map(e => `${e.user_id}_${e.character_id ?? ''}`));
        return [...prev, ...data.filter(e => !existIds.has(`${e.user_id}_${e.character_id ?? ''}`))];
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
      loadData(difficulty, selectedCharacterId, 0, false);
    }
  }, [open, user, isGuest, difficulty, selectedCharacterId, loadData]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    loadData(difficulty, selectedCharacterId, pageOffset, true);
  };

  const handleChangeDifficulty = (d: Difficulty) => {
    setDifficulty(d);
  };

  const handleChangeCharacter = (charId: string | null) => {
    setSelectedCharacterId(charId);
  };

  const formatSurvivalTime = (seconds: number): string => {
    if (seconds <= 0) return '-';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToMyRow = async () => {
    if (!user) return;
    try {
      const rank = await fetchUserSurvivalRank(difficulty, selectedCharacterId, user.id);
      if (!rank || rank <= 0) {
        alert(isEnglishCopy ? 'You have no record for this combination.' : 'この組み合わせの記録がありません。');
        return;
      }
      const targetOffset = Math.floor((rank - 1) / PAGE_SIZE) * PAGE_SIZE;
      const page = await fetchSurvivalRanking(difficulty, selectedCharacterId, PAGE_SIZE, targetOffset);
      setEntries(prev => {
        const map = new Map(prev.map(e => [`${e.user_id}_${e.character_id ?? ''}`, e] as const));
        page.forEach(e => map.set(`${e.user_id}_${e.character_id ?? ''}`, e));
        return Array.from(map.values()).sort((a, b) => {
          if (a.survival_time_seconds !== b.survival_time_seconds) return b.survival_time_seconds - a.survival_time_seconds;
          return b.final_level - a.final_level;
        });
      });
      setTimeout(() => {
        const el = document.querySelector(`[data-survival-user-id="${user.id}"]`);
        if (el && 'scrollIntoView' in el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    } catch {
      alert(isEnglishCopy ? 'Failed to fetch rank.' : '順位の取得に失敗しました。');
    }
  };

  if (!open) return null;

  const handleClose = () => {
    window.location.hash = '#ranking';
  };

  if (!user || isGuest) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">
            {isEnglishCopy ? 'Login required for rankings' : 'ランキングはログインユーザー専用です'}
          </h4>
          <div className="flex flex-col gap-3">
            <button
              className="btn btn-sm btn-primary w-full"
              onClick={() => { window.location.hash = '#login'; }}
            >
              {isEnglishCopy ? 'Login / Sign up' : 'ログイン / 会員登録'}
            </button>
            <button
              className="btn btn-sm btn-outline w-full"
              onClick={handleClose}
            >
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
    if (TITLES.includes(title as Title)) return 'level';
    if (MISSION_TITLES.some(mt => mt.name === title)) return 'mission';
    if (LESSON_TITLES.some(lt => lt.name === title)) return 'lesson';
    if (WIZARD_TITLES.includes(title as Title)) return 'wizard';
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

  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
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
  const allCharText = isEnglishCopy ? 'All' : '全キャラ';

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        {/* 戻るボタン + タイトル */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            aria-label="Back to ranking"
          >
            <FaArrowLeft className="text-sm" />
          </button>
          <h2 className="text-lg font-bold">
            {isEnglishCopy ? 'Survival Ranking' : 'サバイバルランキング'}
          </h2>
        </div>

        {/* 難易度タブ */}
        <div className="flex flex-wrap gap-2 mb-3">
          {DIFFICULTIES.map(d => (
            <button
              key={d.key}
              onClick={() => handleChangeDifficulty(d.key)}
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

        {/* キャラクターフィルター */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleChangeCharacter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCharacterId === null
                ? 'bg-primary-600 text-white ring-2 ring-white/30'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {allCharText}
          </button>
          {characters.map(c => (
            <button
              key={c.id}
              onClick={() => handleChangeCharacter(c.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCharacterId === c.id
                  ? 'bg-primary-600 text-white ring-2 ring-white/30'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
              title={isEnglishCopy ? (c.nameEn ?? c.name) : c.name}
            >
              <img
                src={c.avatarUrl}
                alt={c.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="hidden sm:inline truncate max-w-[4rem]">
                {isEnglishCopy ? (c.nameEn ?? c.name) : c.name}
              </span>
            </button>
          ))}
        </div>

        {/* アクションバー */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <button
            onClick={scrollToMyRow}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-700 text-gray-200 hover:bg-slate-600 inline-flex items-center gap-2"
          >
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
            <table className="w-full text-sm border-collapse min-w-[700px] sm:min-w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="py-3 px-2 min-w-[2.5rem]">#</th>
                  <th className="py-3 px-2 min-w-[10rem]">{isEnglishCopy ? 'User' : 'ユーザー'}</th>
                  {!isStandardGlobal && <th className="py-3 px-2 whitespace-nowrap min-w-[6rem]">{isEnglishCopy ? 'Title' : '称号'}</th>}
                  <th className="py-3 px-2 min-w-[5rem]">{isEnglishCopy ? 'Character' : 'キャラ'}</th>
                  <th className="py-3 px-2 min-w-[4rem]">{isEnglishCopy ? 'Time' : '生存時間'}</th>
                  <th className="py-3 px-2 min-w-[2.5rem]">Lv</th>
                  <th className="py-3 px-2 min-w-[3rem]">{isEnglishCopy ? 'Kills' : '撃破'}</th>
                  <th className="py-3 px-2 min-w-[4rem]">{isEnglishCopy ? 'Rank' : 'ランク'}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => {
                  const isCurrentUser = user?.id === e.user_id;
                  return (
                    <tr
                      key={`${e.user_id}_${e.character_id ?? ''}`}
                      data-survival-user-id={e.user_id}
                      className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                        isCurrentUser ? 'bg-primary-900/20 border-primary-500/30' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        {idx < 3 ? (
                          <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                            {idx + 1}
                          </span>
                        ) : (
                          idx + 1
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => { window.location.hash = `#diary-user?id=${e.user_id}`; }}
                          className={`flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors w-full ${
                            isCurrentUser ? 'font-bold' : ''
                          }`}
                        >
                          <img
                            src={e.avatar_url || DEFAULT_AVATAR_URL}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <span className="truncate min-w-0 flex-1 underline">{e.nickname}</span>
                        </button>
                      </td>
                      {!isStandardGlobal && (
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="relative">
                          <div
                            className="flex items-center gap-1 text-yellow-400 cursor-help"
                            onMouseEnter={() => setHoveredUserId(`${e.user_id}_${e.character_id ?? ''}`)}
                            onMouseLeave={() => setHoveredUserId(null)}
                            onClick={(event) => {
                              event.stopPropagation();
                              const key = `${e.user_id}_${e.character_id ?? ''}`;
                              setClickedUserId(clickedUserId === key ? null : key);
                            }}
                          >
                            {getTitleIcon((e.selected_title as Title) || DEFAULT_TITLE)}
                            <span className="text-xs truncate">
                              {translateTitle((e.selected_title as Title) || DEFAULT_TITLE, isEnglishCopy)}
                            </span>
                          </div>
                          {(hoveredUserId === `${e.user_id}_${e.character_id ?? ''}` || clickedUserId === `${e.user_id}_${e.character_id ?? ''}`) && (
                            <div
                              className="absolute z-50 bg-gray-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap"
                              style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px' }}
                            >
                              <div className="relative">
                                <div>{translateTitleRequirement(getTitleRequirement((e.selected_title as Title) || DEFAULT_TITLE), isEnglishCopy)}</div>
                                <div
                                  className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                                  style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      )}
                      <td className="py-3 px-2">
                        {e.character_avatar_url ? (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={e.character_avatar_url}
                              alt={e.character_name ?? ''}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs text-gray-300 truncate max-w-[4rem]">
                              {isEnglishCopy ? (e.character_name ?? '-') : (e.character_name ?? '-')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-red-300 font-mono font-bold">
                        {formatSurvivalTime(e.survival_time_seconds)}
                      </td>
                      <td className="py-3 px-2">{e.final_level}</td>
                      <td className="py-3 px-2">{e.enemies_defeated}</td>
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

export default SurvivalRanking;
