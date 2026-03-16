import React, { useEffect, useState } from 'react';
import { fetchMissionRanking, MissionRankingEntry, fetchMissionRankingByRpc, fetchUserMissionRank } from '@/platform/supabaseRanking';
import { useMissionStore } from '@/stores/missionStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { FaArrowLeft, FaTrophy, FaMedal, FaCrown, FaGem, FaStar, FaSearch, FaPlus } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

const MissionRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#mission-ranking');
  const [entries, setEntries] = useState<MissionRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { monthly } = useMissionStore();
  const [missionId, setMissionId] = useState<string | null>(null);
  const { profile, user } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const PAGE_SIZE = 50;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#mission-ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open && monthly.length > 0 && !missionId) {
      setMissionId(monthly[0].id);
    }
  }, [open, monthly, missionId]);

  const resetAndLoad = async (mId: string) => {
    setLoading(true);
    setError(null);
    setEntries([]);
    setHasMore(true);
    setOffset(0);
    try {
      const data = await fetchMissionRanking(mId, PAGE_SIZE, 0);
      setEntries(data);
      setOffset(PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      console.error('ミッションランキング取得エラー:', err);
      setError('ランキングデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!missionId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchMissionRanking(missionId, PAGE_SIZE, offset);
      setEntries(prev => {
        const exist = new Set(prev.map(e => e.user_id));
        return [...prev, ...data.filter(e => !exist.has(e.user_id))];
      });
      setOffset(prev => prev + PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      console.error('ミッションランキング取得エラー:', err);
      setError('ランキングデータの取得に失敗しました');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (open && missionId) {
      resetAndLoad(missionId);
    }
  }, [open, missionId]);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <FaTrophy className="text-yellow-400" />;
    if (index === 1) return <FaMedal className="text-gray-300" />;
    if (index === 2) return <FaMedal className="text-amber-600" />;
    return null;
  };

  // ユーザーランクに応じたアイコンを取得する関数
  const getUserRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'black':
        return <FaCrown className="text-slate-200 text-sm" />;
      case 'platinum':
        return <FaCrown className="text-purple-400 text-sm" />;
      case 'premium':
        return <FaGem className="text-yellow-400 text-sm" />;
      case 'standard':
        return <FaStar className="text-blue-400 text-xs" />;
      case 'free':
      default:
        return <FaMedal className="text-gray-400 text-xs" />;
    }
  };

  const scrollToMyRow = async () => {
    if (!user || !missionId) return;
    try {
      const globalRank = await fetchUserMissionRank(missionId, user.id);
      if (!globalRank || globalRank <= 0) {
        const el = document.querySelector(`[data-user-id="${user.id}"]`);
        if (el && 'scrollIntoView' in el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        alert('あなたの順位を特定できませんでした。ミッションのプレイ履歴が無い可能性があります。');
        return;
      }
      const PAGE_SIZE_NUM = 50;
      const pageOffset = Math.floor((globalRank - 1) / PAGE_SIZE_NUM) * PAGE_SIZE_NUM;
      const page = await fetchMissionRankingByRpc(missionId, PAGE_SIZE_NUM, pageOffset);
      setEntries(prev => {
        const map = new Map(prev.map(e => [e.user_id, e] as const));
        page.forEach(e => map.set(e.user_id, e));
        return Array.from(map.values());
      });
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

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="戻る"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-2xl font-bold text-center flex-1">{isEnglishCopy ? 'Mission Ranking' : 'ミッションランキング'}</h1>
            <div className="w-8" />
          </div>

          {/* ミッション選択 */}
          {monthly.length > 1 && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <label htmlFor="mission-select" className="block text-sm font-medium text-gray-300 mb-2">
                {isEnglishCopy ? 'Select Mission' : 'ミッションを選択'}
              </label>
              <select
                id="mission-select"
                className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
                value={missionId ?? ''}
                onChange={(e) => setMissionId(e.target.value)}
              >
                {monthly.map(m => (
                  <option key={m.id} value={m.id}>{isEnglishCopy && m.title_en ? m.title_en : m.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* アクションバー */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <button
              onClick={scrollToMyRow}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-700 text-gray-200 hover:bg-slate-600 inline-flex items-center gap-2"
            >
              <FaSearch /> {isEnglishCopy ? 'Find Me' : '自分を探す'}
            </button>
            <button
              onClick={loadMore}
              disabled={!hasMore || loadingMore}
              className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${!hasMore ? 'bg-slate-800 text-gray-500' : 'bg-primary-600 text-white hover:bg-primary-500'} ${loadingMore ? 'opacity-70' : ''}`}
            >
              <FaPlus /> {isEnglishCopy ? 'Load More (50)' : 'さらに読み込む（50件）'}
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* ローディング表示 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto mb-4"></div>
              <p className="text-gray-400">{isEnglishCopy ? 'Loading ranking...' : 'ランキングを読み込み中...'}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-400">{isEnglishCopy ? 'No ranking data yet' : 'まだランキングデータがありません'}</p>
              <p className="text-sm text-gray-500 mt-2">{isEnglishCopy ? 'Complete missions to join the ranking!' : 'ミッションに挑戦してランキングに参加しましょう！'}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-700 border-b border-slate-600">
                      <th className="py-4 px-4 text-left font-medium min-w-[4rem]">#</th>
                      <th className="py-4 px-4 text-left font-medium min-w-[12rem] sm:min-w-[10rem]">{isEnglishCopy ? 'User' : 'ユーザー(タップで詳細)'}</th>
                      <th className="py-4 px-4 text-left font-medium min-w-[6rem] sm:min-w-[5rem]">{isEnglishCopy ? 'Clears' : 'クリア回数'}</th>
                      <th className="py-4 px-4 text-left font-medium min-w-[4rem]">Lv</th>
                      <th className="py-4 px-4 text-left font-medium min-w-[6rem] sm:min-w-[5rem]">{isEnglishCopy ? 'Rank' : 'ランク'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => (
                      <tr key={entry.user_id} data-user-id={entry.user_id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(idx)}
                            <span className="font-medium">{idx + 1}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => {}}
                            className="flex items-center space-x-3 min-w-0 w-full text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                          >
                            <img 
                              src={entry.avatar_url || DEFAULT_AVATAR_URL} 
                              className="w-12 h-12 rounded-full border-2 border-slate-600 flex-shrink-0"
                              alt="アバター"
                            />
                            <span className="font-medium truncate min-w-0 flex-1 underline">{entry.nickname}</span>
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-primary-400">{entry.clear_count}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-blue-400">Lv.{entry.level}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            {getUserRankIcon(entry.rank)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entry.rank === 'black' ? 'bg-slate-700 text-white' :
                                entry.rank === 'platinum' ? 'bg-purple-600 text-white' :
                              entry.rank === 'premium' ? 'bg-yellow-600 text-white' :
                              entry.rank === 'standard' ? 'bg-blue-600 text-white' :
                              'bg-gray-600 text-white'
                            }` }>
                              {entry.rank.toUpperCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 戻るボタン */}
          <div className="mt-6 text-center">
            <button 
              className="btn btn-outline btn-primary" 
              onClick={handleClose}
            >
              {isEnglishCopy ? 'Back to Dashboard' : 'ダッシュボードに戻る'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRanking;
