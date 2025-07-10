import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import { Announcement, fetchActiveAnnouncements } from '@/platform/supabaseAnnouncements';
import { useToast } from '@/stores/toastStore';
import { 
  FaBell, 
  FaExternalLinkAlt, 
  FaTrophy, 
  FaCalendarAlt,
  FaMusic,
  FaArrowLeft,
  FaBullseye,
  FaUser 
} from 'react-icons/fa';
import { Mission } from '@/platform/supabaseMissions';

/**
 * ダッシュボード画面
 * Hash: #dashboard で表示
 */
const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isGuest } = useAuthStore();
  const { weekly: challenges, monthly: missions, fetchAll: loadMissions } = useMissionStore();
  const toast = useToast();

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      setOpen(hash === '#dashboard');
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (open) {
      loadDashboardData();
    }
  }, [open]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // お知らせとミッションを並行読み込み
      const [announcementsData] = await Promise.all([
        fetchActiveAnnouncements(),
        loadMissions()
      ]);
      
      setAnnouncements(announcementsData);
    } catch (e: any) {
      console.error('Dashboard data loading error:', e);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.location.hash = '';
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="戻る"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold">ダッシュボード</h1>
        <div className="w-10" /> {/* バランス調整用 */}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">読み込み中...</p>
          </div>
        ) : (
          <>
            {/* ユーザー情報 */}
            {profile && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <FaUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.nickname}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>レベル {profile.level}</span>
                      <span>XP: {profile.xp.toLocaleString()}</span>
                      <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {profile.rank}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* お知らせ */}
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
                <FaBell className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold">お知らせ</h3>
              </div>
              
              <div className="p-4">
                {announcements.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">
                    現在お知らせはありません
                  </p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div 
                        key={announcement.id}
                        className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                      >
                        <h4 className="font-semibold mb-2">{announcement.title}</h4>
                        <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                        
                        {announcement.link_url && (
                          <a
                            href={announcement.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <FaExternalLinkAlt className="w-3 h-3" />
                            <span>{announcement.link_text || 'リンクを開く'}</span>
                          </a>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* チャレンジ・ミッション */}
            {!isGuest && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ウィークリーチャレンジ */}
                <div className="bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
                    <FaBullseye className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold">ウィークリーチャレンジ</h3>
                  </div>
                  
                  <div className="p-4">
                    {challenges.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">
                        現在チャレンジはありません
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {challenges.slice(0, 3).map((challenge: Mission) => (
                          <div key={challenge.id} className="bg-slate-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{challenge.title}</h4>
                              <FaTrophy className="w-4 h-4 text-yellow-400" />
                            </div>
                            <p className="text-xs text-gray-300 mb-2">
                              {challenge.description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                {new Date(challenge.end_date).toLocaleDateString()} まで
                              </span>
                              <span className="text-yellow-400">
                                {challenge.reward_multiplier}x ボーナス
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* マンスリーミッション */}
                <div className="bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
                    <FaCalendarAlt className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">マンスリーミッション</h3>
                  </div>
                  
                  <div className="p-4">
                    {missions.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">
                        現在ミッションはありません
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {missions.slice(0, 3).map((mission: Mission) => (
                          <div key={mission.id} className="bg-slate-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{mission.title}</h4>
                              <FaTrophy className="w-4 h-4 text-purple-400" />
                            </div>
                            <p className="text-xs text-gray-300 mb-2">
                              {mission.description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                {new Date(mission.end_date).toLocaleDateString()} まで
                              </span>
                              <span className="text-purple-400">
                                {mission.reward_multiplier}x ボーナス
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* クイックアクション */}
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
                <FaMusic className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">クイックアクション</h3>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => window.location.hash = '#songs'}
                    className="btn btn-sm btn-outline flex flex-col items-center space-y-2 p-4 h-auto"
                  >
                    <FaMusic className="w-6 h-6" />
                    <span className="text-xs">楽曲選択</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.hash = '#lessons'}
                    className="btn btn-sm btn-outline flex flex-col items-center space-y-2 p-4 h-auto"
                  >
                    <FaUser className="w-6 h-6" />
                    <span className="text-xs">レッスン</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.hash = '#challenges'}
                    className="btn btn-sm btn-outline flex flex-col items-center space-y-2 p-4 h-auto"
                  >
                    <FaBullseye className="w-6 h-6" />
                    <span className="text-xs">チャレンジ</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.hash = '#diary'}
                    className="btn btn-sm btn-outline flex flex-col items-center space-y-2 p-4 h-auto"
                  >
                    <FaBell className="w-6 h-6" />
                    <span className="text-xs">コミュニティ</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Dashboard; 