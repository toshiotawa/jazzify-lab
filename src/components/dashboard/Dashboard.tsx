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
import GameHeader from '@/components/ui/GameHeader';
import { xpToNextLevel } from '@/utils/xpCalculator';

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

  return (
    <div 
      className="w-full h-full flex flex-col bg-gradient-game text-white"
    >
      <GameHeader />
      {/* ダッシュボードコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* ユーザー情報カード */}
          {profile && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center space-x-4">
                <img
                  src={profile.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Lv.{profile.level}</span>
                    <span className="capitalize">{profile.rank}</span>
                    <span>{profile.xp.toLocaleString()} XP</span>
                  </div>
                  
                  {/* 経験値進捗 */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>{profile.xp.toLocaleString()} / {xpToNextLevel(profile.level).toLocaleString()} XP</span>
                      <span>次レベルまで: {(xpToNextLevel(profile.level) - profile.xp).toLocaleString()} XP</span>
                    </div>
                    <div className="bg-slate-700 h-2 rounded overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full transition-all"
                        style={{ width: `${(profile.xp / xpToNextLevel(profile.level)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ゲストプレイ時はお知らせとクイックアクションを表示しない */}
          {!isGuest && (
            <>
              {/* お知らせセクション */}
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

              {/* クイックアクション */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 今日のチャレンジ */}
                <button
                  onClick={() => { window.location.hash = '#missions'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaBullseye className="w-6 h-6 text-orange-400" />
                    <h3 className="text-lg font-semibold">今日のチャレンジ</h3>
                  </div>
                  
                  {challenges.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">{challenges[0].title}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{challenges[0].reward_multiplier}x ボーナス</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">チャレンジを確認</p>
                  )}
                </button>

                {/* 曲練習 */}
                <button
                  onClick={() => { window.location.hash = '#songs'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaMusic className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold">曲練習</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    楽曲を選んで練習を開始
                  </p>
                </button>

                {/* レッスン */}
                <button
                  onClick={() => { window.location.hash = '#lessons'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaTrophy className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold">レッスン</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    ジャズ理論を学習
                  </p>
                </button>
              </div>
            </>
          )}

          {/* ゲストプレイ時の専用メッセージ */}
          {isGuest && (
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold mb-4">ゲストプレイ中</h3>
              <p className="text-gray-300 mb-6">
                現在ゲストとしてプレイしています。<br />
                ログインすると、より多くの機能をご利用いただけます。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => { window.location.hash = '#songs'; }}
                  className="btn btn-primary"
                >
                  曲を練習する
                </button>
                <button
                  onClick={() => { window.location.hash = '#login'; }}
                  className="btn btn-outline"
                >
                  ログイン / 会員登録
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 