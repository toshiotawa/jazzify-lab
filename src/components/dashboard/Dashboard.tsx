import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import { Announcement, fetchActiveAnnouncements } from '@/platform/supabaseAnnouncements';
import { useToast } from '@/stores/toastStore';
import { mdToHtml } from '@/utils/markdown';
import { 
  FaBell, 
  FaExternalLinkAlt, 
  FaTrophy, 
  FaCalendarAlt,
  FaMusic,
  FaArrowLeft,
  FaBullseye,
  FaUser,
  FaCrown,
  FaGraduationCap
} from 'react-icons/fa';
import { Mission } from '@/platform/supabaseMissions';
import GameHeader from '@/components/ui/GameHeader';
import { xpToNextLevel, currentLevelXP } from '@/utils/xpCalculator';
import { calcLevel } from '@/platform/supabaseXp';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES } from '@/utils/titleConstants';
import { fetchUserStats, UserStats } from '@/platform/supabaseUserStats';

/**
 * ダッシュボード画面
 * Hash: #dashboard で表示
 */
const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { profile, isGuest } = useAuthStore();
  const { monthly: missions, fetchAll: loadMissions } = useMissionStore();
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
  }, [open, isGuest]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // ミッションのロード（独立）
    try {
      await loadMissions();
    } catch (missionError: any) {
      console.error('Mission loading error:', missionError);
      toast.error('ミッションの読み込みに失敗しました');
    }

    // ユーザー統計のロード（ゲスト以外、独立）
    if (!isGuest && profile) {
      try {
        const stats = await fetchUserStats(profile.id);
        setUserStats(stats);
      } catch (statsError: any) {
        console.error('User stats loading error:', statsError);
        // 統計の読み込み失敗は致命的ではないので、エラーログのみ
      }
    }

    // お知らせのロード（ゲスト以外、独立）
    if (!isGuest) {
      try {
        const announcementsData = await fetchActiveAnnouncements();
        
        // 優先度順（priorityが小さいほど上位）でソートし、最新の1件を取得
        const sortedAnnouncements = announcementsData.sort((a: Announcement, b: Announcement) => {
          // まず優先度で比較
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // 優先度が同じ場合は作成日時で比較（新しい順）
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        const latestData = sortedAnnouncements.length > 0 ? sortedAnnouncements[0] : null;
        
        console.log('Dashboard: Latest announcement data:', latestData);
        console.log('Dashboard: All active announcements:', announcementsData);
        console.log('Dashboard: Sorted announcements:', sortedAnnouncements);
        console.log('Dashboard: Total active announcements count:', announcementsData.length);
        
        setLatestAnnouncement(latestData);
        
        if (!latestData) {
          console.log('Dashboard: No active announcements found');
          if (announcementsData.length === 0) {
            console.log('Dashboard: No announcements exist at all');
          } else {
            console.log('Dashboard: Active announcements exist but latestData is null');
          }
        }
      } catch (announcementError: any) {
        console.error('Announcement loading error:', announcementError);
        toast.error(`お知らせの読み込みに失敗しました: ${announcementError.message}`, {
          title: 'お知らせエラー',
          duration: 5000,
        });
      }
    }

    setLoading(false);
  };

  const handleClose = () => {
    window.location.hash = '';
  };

  // 称号の種類を判定する関数
  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' => {
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
    // デフォルトはレベル称号
    return 'level';
  };

  // 称号タイプに応じたアイコンを取得する関数
  const getTitleIcon = (title: string) => {
    const titleType = getTitleType(title);
    switch (titleType) {
      case 'level':
        return <FaCrown className="text-yellow-400 text-sm" />;
      case 'mission':
        return <FaTrophy className="text-purple-400 text-sm" />;
      case 'lesson':
        return <FaGraduationCap className="text-blue-400 text-sm" />;
      default:
        return <FaCrown className="text-yellow-400 text-sm" />;
    }
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
                  src={profile.avatar_url || DEFAULT_AVATAR_URL}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                  
                  {/* 称号表示 */}
                  <div className="flex items-center space-x-2 mb-2">
                    {getTitleIcon((profile.selected_title as Title) || DEFAULT_TITLE)}
                    <span className="text-yellow-400 font-medium text-sm">
                      {(profile.selected_title as Title) || DEFAULT_TITLE}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Lv.{profile.level}</span>
                    <span className="capitalize">{profile.rank}</span>
                    <span>累計経験値 {profile.xp.toLocaleString()}</span>
                  </div>
                  
                  {/* ミッション・レッスン統計 */}
                  {userStats && (
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                      <span>ミッション完了数 {userStats.missionCompletedCount}</span>
                      <span>レッスンクリア数 {userStats.lessonCompletedCount}</span>
                    </div>
                  )}
                  
                  {/* 経験値進捗 */}
                  <div className="mt-4">
                    {(() => {
                      const levelInfo = calcLevel(profile.xp);
                      return (
                        <>
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>{levelInfo.remainder.toLocaleString()} / {levelInfo.nextLevelXp.toLocaleString()}</span>
                            <span>次レベルまで: {(levelInfo.nextLevelXp - levelInfo.remainder).toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-700 h-2 rounded overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full transition-all"
                              style={{ width: `${(levelInfo.remainder / levelInfo.nextLevelXp) * 100}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
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
                  {!latestAnnouncement ? (
                    <p className="text-gray-400 text-center py-6">
                      現在お知らせはありません
                    </p>
                  ) : (
                    <div className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                      <h4 className="font-semibold mb-2">{latestAnnouncement.title}</h4>
                      <div 
                        className="text-sm text-gray-300 mb-3 [&_a]:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-300 [&_a]:transition-colors"
                        dangerouslySetInnerHTML={{ __html: mdToHtml(latestAnnouncement.content) }}
                      />
                      
                      {latestAnnouncement.link_url && (
                        <a
                          href={latestAnnouncement.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                          <span>{latestAnnouncement.link_text || 'リンクを開く'}</span>
                        </a>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(latestAnnouncement.created_at).toLocaleDateString()}
                      </div>

                      <div className="mt-3">
                        <button
                          onClick={() => { window.location.hash = '#information'; }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          すべてのお知らせを見る →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* クイックアクション */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 今日のミッション */}
                <button
                  onClick={() => { window.location.hash = '#missions'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaBullseye className="w-6 h-6 text-orange-400" />
                    <h3 className="text-lg font-semibold">今日のミッション</h3>
                  </div>
                  
                  {missions.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">{missions[0].title}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{missions[0].reward_multiplier}x ボーナス</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">ミッションを確認</p>
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