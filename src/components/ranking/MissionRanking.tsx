import React, { useEffect, useState } from 'react';
import { fetchMissionRanking, MissionRankingEntry } from '@/platform/supabaseRanking';
import { useMissionStore } from '@/stores/missionStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { FaArrowLeft, FaTrophy, FaMedal } from 'react-icons/fa';

const MissionRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#mission-ranking');
  const [entries, setEntries] = useState<MissionRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { monthly } = useMissionStore();
  const [missionId, setMissionId] = useState<string | null>(null);

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

  useEffect(() => {
    if (open && missionId) {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchMissionRanking(missionId);
          setEntries(data);
        } catch (err) {
          console.error('ミッションランキング取得エラー:', err);
          setError('ランキングデータの取得に失敗しました');
        } finally {
          setLoading(false);
        }
      })();
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
            <h1 className="text-2xl font-bold text-center flex-1">ミッションランキング</h1>
            <div className="w-8" />
          </div>

          {/* ミッション選択 */}
          {monthly.length > 1 && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ミッションを選択
              </label>
              <select
                className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
                value={missionId ?? ''}
                onChange={(e) => setMissionId(e.target.value)}
              >
                {monthly.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}

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
              <p className="text-gray-400">ランキングを読み込み中...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-400">まだランキングデータがありません</p>
              <p className="text-sm text-gray-500 mt-2">ミッションに挑戦してランキングに参加しましょう！</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-700 border-b border-slate-600">
                      <th className="py-3 px-4 text-left font-medium min-w-[4rem]">順位</th>
                      <th className="py-3 px-4 text-left font-medium min-w-[12rem] sm:min-w-[10rem]">ユーザー</th>
                      <th className="py-3 px-4 text-left font-medium min-w-[6rem] sm:min-w-[5rem]">クリア回数</th>
                      <th className="py-3 px-4 text-left font-medium min-w-[4rem]">レベル</th>
                      <th className="py-3 px-4 text-left font-medium min-w-[6rem] sm:min-w-[5rem]">ランク</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => (
                      <tr key={entry.user_id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(idx)}
                            <span className="font-medium">{idx + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            <img 
                              src={entry.avatar_url || DEFAULT_AVATAR_URL} 
                              className="w-8 h-8 rounded-full border-2 border-slate-600 flex-shrink-0"
                              alt="アバター"
                            />
                            <span className="font-medium truncate min-w-0 flex-1">{entry.nickname}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-primary-400">{entry.clear_count}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-blue-400">Lv.{entry.level}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.rank === 'platinum' ? 'bg-purple-600 text-white' :
                            entry.rank === 'premium' ? 'bg-yellow-600 text-white' :
                            entry.rank === 'standard' ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {entry.rank.toUpperCase()}
                          </span>
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
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRanking;
