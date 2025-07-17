import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import ChallengeBoard from './ChallengeBoard';
import { useMissionStore } from '@/stores/missionStore';
import { fetchMissionSongProgress } from '@/platform/supabaseMissions';
import { FaArrowLeft, FaTrophy, FaCalendarAlt } from 'react-icons/fa';

const MissionPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#missions');
  const [error, setError] = useState<string | null>(null);
  const { fetchAll, loading, monthly } = useMissionStore();

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#missions');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open) {
      (async () => {
        try {
          setError(null);
          // ミッションデータと進捗を取得
          await fetchAll();
        } catch (err) {
          console.error('ミッション取得エラー:', err);
          setError('ミッション情報の取得に失敗しました');
        }
      })();
    }
  }, [open, fetchAll]);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="戻る"
            >
              <FaArrowLeft />
            </button>
            <div className="flex items-center space-x-3">
              <FaTrophy className="text-yellow-400 text-2xl" />
              <h1 className="text-2xl font-bold">ミッション</h1>
            </div>
            <div className="w-8" />
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
              <p className="text-gray-400">ミッションを読み込み中...</p>
            </div>
          ) : monthly.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-400">現在アクティブなミッションはありません</p>
              <p className="text-sm text-gray-500 mt-2">新しいミッションをお待ちください</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ミッション概要 */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FaCalendarAlt className="text-blue-400" />
                  <h2 className="text-lg font-semibold">月間ミッション</h2>
                </div>
                <p className="text-gray-300 text-sm">
                  毎月新しいミッションが登場します。ミッションをクリアして報酬を獲得しましょう！
                </p>
              </div>

              {/* ミッションボード */}
              <ChallengeBoard />
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

export default MissionPage;
