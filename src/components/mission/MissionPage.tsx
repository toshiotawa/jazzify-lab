import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import ChallengeBoard from './ChallengeBoard';
import { useMissionStore } from '@/stores/missionStore';
import { FaCalendarAlt, FaBullseye } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';

const MissionPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#missions');
  const [error, setError] = useState<string | null>(null);
  const { fetchAll, loading, monthly } = useMissionStore();
  const { profile } = useAuthStore();
  const isStandardGlobal = profile?.rank === 'standard_global';

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

  if (isStandardGlobal) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">この機能はご利用いただけません</h4>
          <p className="text-center text-gray-300">Standard(Global)プランではミッション機能は非対応です。</p>
          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-sm btn-outline w-full" 
              onClick={() => { window.location.href = '/main#dashboard'; }}
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
        <div className="max-w-6xl mx-auto">

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
              <div className="text-6xl mb-4 flex justify-center">
                <FaBullseye className="text-gray-500" />
              </div>
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

        </div>
      </div>
    </div>
  );
};

export default MissionPage;
