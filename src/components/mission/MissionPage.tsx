import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import ChallengeBoard from './ChallengeBoard';
import { useMissionStore } from '@/stores/missionStore';
import { FaCalendarAlt, FaBullseye } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

const MissionPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#missions');
  const [error, setError] = useState<string | null>(null);
  const { fetchAll, loading, monthly } = useMissionStore();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

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
          await fetchAll();
        } catch (err) {
          setError(isEnglishCopy ? 'Failed to load missions' : 'ミッション情報の取得に失敗しました');
        }
      })();
    }
  }, [open, fetchAll]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto mb-4"></div>
              <p className="text-gray-400">{isEnglishCopy ? 'Loading missions...' : 'ミッションを読み込み中...'}</p>
            </div>
          ) : monthly.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 flex justify-center">
                <FaBullseye className="text-gray-500" />
              </div>
              <p className="text-gray-400">{isEnglishCopy ? 'No active missions right now' : '現在アクティブなミッションはありません'}</p>
              <p className="text-sm text-gray-500 mt-2">{isEnglishCopy ? 'Please wait for new missions' : '新しいミッションをお待ちください'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FaCalendarAlt className="text-blue-400" />
                  <h2 className="text-lg font-semibold">{isEnglishCopy ? 'Monthly Missions' : '月間ミッション'}</h2>
                </div>
                <p className="text-gray-300 text-sm">
                  {isEnglishCopy 
                    ? 'New missions appear every month. Complete them to earn rewards!' 
                    : '毎月新しいミッションが登場します。ミッションをクリアして報酬を獲得しましょう！'}
                </p>
              </div>

              <ChallengeBoard />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MissionPage;
