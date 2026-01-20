import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserStatsStore } from '@/stores/userStatsStore';
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
  FaGraduationCap,
  FaGem,
  FaStar,
  FaMedal,
  FaMagic,
  FaHatWizard,
  FaList,
  FaEdit
} from 'react-icons/fa';
import { FaUsers } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import OpenBetaPlanSwitcher from '@/components/subscription/OpenBetaPlanSwitcher';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
// xpToNextLevel, currentLevelXP は未使用
import { calcLevel } from '@/platform/supabaseXp';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { DailyChallengeRecordsSection } from '@/components/dashboard/DailyChallengeRecordsSection';
import { translateTitle, translateTitleRequirement } from '@/utils/titleTranslations';

/**
 * ダッシュボード画面
 * Hash: #dashboard で表示
 */
const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
    const { profile, isGuest, logout } = useAuthStore();
    const geoCountry = useGeoStore(state => state.country);
    const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const announcementsTitle = isEnglishCopy ? 'Announcements' : 'お知らせ';
  const noAnnouncementsText = isEnglishCopy ? 'No announcements at the moment' : '現在お知らせはありません';
  const viewAllAnnouncementsText = isEnglishCopy ? 'View all announcements →' : 'すべてのお知らせを見る →';
  const totalXpLabel = isEnglishCopy ? 'Total XP' : '累計経験値';
  const statsLoadingText = isEnglishCopy ? 'Loading stats...' : '統計を読み込み中...';
  const xpProgressLabel = isEnglishCopy ? 'XP to next level' : '次レベルまで';
  const fantasyQuickTitle = isEnglishCopy ? 'Fantasy Mode' : 'ファンタジーモード';
  const fantasyQuickDescription = isEnglishCopy ? 'RPG-style chord practice game' : 'RPG風のコード練習ゲーム';
  const guestHeading = isEnglishCopy ? 'Guest mode' : 'ゲストプレイ中';
  const guestBodyLine1 = isEnglishCopy ? 'You are currently playing as a guest.' : '現在ゲストとしてプレイしています。';
  const guestBodyLine2 = isEnglishCopy ? 'Sign in to unlock more features.' : 'ログインすると、より多くの機能をご利用いただけます。';
  const guestFantasyButton = isEnglishCopy ? 'Fantasy Mode' : 'ファンタジーモード';
  const guestLoginButton = isEnglishCopy ? 'Log in / Sign up' : 'ログイン / 会員登録';
  const guestLogoutButton = isEnglishCopy ? 'Log out' : 'ログアウト';
  const isStandardGlobal = profile?.rank === 'standard_global';
  const { stats: userStats, fetchStats, loading: statsLoading } = useUserStatsStore();
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

  // ゲストからログインへ切り替わったらデータをリロード
  useEffect(() => {
    if (!isGuest && open) {
      loadDashboardData();
    }
  }, [isGuest, open]);

    const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // すべてのデータを並行読み込み
      const promises: Promise<any>[] = [];
      
      // ミッション情報のフェッチは行わない（カードは説明のみ表示）

      // お知らせのロード（ゲスト以外）
      if (!isGuest) {
        promises.push(
          fetchActiveAnnouncements(isStandardGlobal ? 'global' : 'default').then(announcementsData => {
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
            }).catch((announcementError: any) => {
              console.error('Announcement loading error:', announcementError);
              toast.error(
                isEnglishCopy
                  ? `Failed to load announcements: ${announcementError.message}`
                  : `お知らせの読み込みに失敗しました: ${announcementError.message}`,
                {
                  title: isEnglishCopy ? 'Announcement error' : 'お知らせエラー',
                  duration: 5000,
                }
              );
          })
        );
      }

      // ユーザー統計のロード（ゲスト以外）- 他のデータと完全に並行実行
      if (!isGuest && profile) {
        promises.push(
          fetchStats(profile.id).catch((statsError: any) => {
            console.error('User stats loading error:', statsError);
            // 統計の読み込み失敗は致命的ではないので、エラーログのみ
          })
        );
      }

      // すべてのプロミスを並行実行
      await Promise.all(promises);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.location.hash = '';
  };

  // 称号の種類を判定する関数
    const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
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
    // 魔法使い称号の判定
    if (WIZARD_TITLES.includes(title as any)) {
      return 'wizard';
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
      case 'wizard':
        return <FaHatWizard className="text-green-400 text-sm" />;
      default:
        return <FaCrown className="text-yellow-400 text-sm" />;
    }
  };

  // ランクに応じたアイコンを取得する関数
    const getRankIcon = (rank: string) => {

      switch (rank.toLowerCase()) {
        case 'black':
          return <FaCrown className="text-slate-200 text-lg" />;
        case 'platinum':
          return <FaCrown className="text-purple-400 text-lg" />;
        case 'premium':
          return <FaGem className="text-yellow-400 text-lg" />;
        case 'standard':
        case 'standard_global':
          return <FaStar className="text-blue-400 text-sm" />;
        case 'free':
        default:
          return <FaMedal className="text-gray-400 text-sm" />;
      }
    };


  const [hoveredTitle, setHoveredTitle] = useState<boolean>(false);
  const [clickedTitle, setClickedTitle] = useState<boolean>(false);

  if (!open) return null;

  // フリープランの場合はプラン変更UIのみ表示
  if (profile?.rank === 'free' && !isGuest) {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-game text-white">
        <GameHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <OpenBetaPlanSwitcher />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex flex-col bg-gradient-game text-white"
    >
      <GameHeader />
      {/* ダッシュボードコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* オープンベータ: プラン変更 UI */}
          {!isGuest && <OpenBetaPlanSwitcher />}
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
                  
                  {/* 称号表示（ホバー/タップで条件表示） */}
                  <div className="relative mb-2">
                    <div 
                      className="flex items-center space-x-2 cursor-help max-w-full"
                      onMouseEnter={()=>setHoveredTitle(true)}
                      onMouseLeave={()=>setHoveredTitle(false)}
                      onClick={(e)=>{ e.stopPropagation(); setClickedTitle(v=>!v); }}
                    >
                      {getTitleIcon((profile.selected_title as Title) || DEFAULT_TITLE)}
                      <span className="text-yellow-400 font-medium text-sm truncate max-w-[240px]">
                        {translateTitle((profile.selected_title as Title) || DEFAULT_TITLE, isEnglishCopy)}
                      </span>
                    </div>
                    {(hoveredTitle || clickedTitle) && (
                      <div 
                        className="absolute z-50 bg-gray-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap"
                        style={{ bottom: '100%', left: '0', marginBottom: '4px' }}
                      >
                        {translateTitleRequirement(getTitleRequirement((profile.selected_title as Title) || DEFAULT_TITLE), isEnglishCopy)}
                        <div className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" style={{ bottom: '-4px', left: '12px' }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Lv.{profile.level}</span>
                    <div className="flex items-center space-x-1">
                      {getRankIcon(profile.rank)}
                      <span className="capitalize">{profile.rank}</span>
                    </div>
                      <span>{totalXpLabel} {profile.xp.toLocaleString()}</span>
                  </div>
                  
                  {/* ミッション・レッスン統計 */}
                  {statsLoading ? (
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                        <span className="animate-pulse">{statsLoadingText}</span>
                      </div>
                  ) : userStats ? (
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
                      {!isStandardGlobal && (<span>{isEnglishCopy ? 'Missions completed' : 'ミッション完了数'} {userStats.missionCompletedCount}</span>)}
                      {!isStandardGlobal && (<span>{isEnglishCopy ? 'Lessons cleared' : 'レッスンクリア数'} {userStats.lessonCompletedCount}</span>)}
                      <span>{isEnglishCopy ? 'Daily Challenge Days' : 'デイリーチャレンジ実施日数'} {userStats.dailyChallengeParticipationDays}</span>
                    </div>
                  ) : null}
                  
                  {/* 経験値進捗 */}
                  <div className="mt-4">
                    {(() => {
                      const levelInfo = calcLevel(profile.xp);
                      return (
                        <>
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>{levelInfo.remainder.toLocaleString()} / {levelInfo.nextLevelXp.toLocaleString()}</span>
                              <span>{xpProgressLabel}: {(levelInfo.nextLevelXp - levelInfo.remainder).toLocaleString()}</span>
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
                    <h3 className="text-lg font-semibold">{announcementsTitle}</h3>
                  </div>
                
                <div className="p-4">
                    {!latestAnnouncement ? (
                      <p className="text-gray-400 text-center py-6">
                        {noAnnouncementsText}
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
                            <span>{latestAnnouncement.link_text || (isEnglishCopy ? 'Open link' : 'リンクを開く')}</span>
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
                            {viewAllAnnouncementsText}
                          </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* クイックアクション */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 今日のミッション */}
                {!isStandardGlobal && (
                <button
                  onClick={() => { window.location.hash = '#missions'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaBullseye className="w-6 h-6 text-orange-400" />
                    <h3 className="text-lg font-semibold">今日のミッション</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    日替わりの課題に挑戦して経験値を獲得しよう
                  </p>
                </button>
                )}

                {/* 曲練習 */}
                {!isStandardGlobal && (
                <button
                  onClick={() => { window.location.hash = '#songs'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaMusic className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold">レジェンドモード</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    楽曲を選んで練習を開始
                  </p>
                </button>
                )}

                {/* レッスン */}
                {!isStandardGlobal && (
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
                )}

                {/* ランキング */}
                {!isStandardGlobal && (
                <button
                  onClick={() => { window.location.hash = '#ranking'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaList className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold">ランキング</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    みんなの成績をチェック
                  </p>
                </button>
                )}

                {/* 日記 */}
                {!isStandardGlobal && (
                <button
                  onClick={() => { window.location.hash = '#diary'; }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-primary-500 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaEdit className="w-6 h-6 text-pink-400" />
                    <h3 className="text-lg font-semibold">日記</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    今日の練習を記録
                  </p>
                </button>
                )}

                  {/* ファンタジーモード */}
                  <button
                    onClick={() => { window.location.hash = '#fantasy'; }}
                    className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg p-6 border border-purple-600 hover:border-purple-400 transition-colors text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 opacity-20">
                      <img src="/default_avater/default-avater.png" alt={fantasyQuickTitle} className="w-24 h-24" />
                    </div>
                    <div className="flex items-center space-x-3 mb-3 relative z-10">
                      <FaMagic className="w-6 h-6 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">{fantasyQuickTitle}</h3>
                      <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-bold">NEW</span>
                    </div>
                    <p className="text-sm text-purple-100 relative z-10">
                      {fantasyQuickDescription}
                    </p>
                  </button>
              </div>

              {/* 記録（デイリーチャレンジ） */}
              <DailyChallengeRecordsSection />
            </>
          )}

          {/* ゲストプレイ時の専用メッセージ */}
            {isGuest && (
              <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
                <div className="mb-4">
                  <img src="/stage_icons/6.png" alt="Stage Icon" className="w-24 h-24 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{guestHeading}</h3>
                <p className="text-gray-300 mb-6">
                  {guestBodyLine1}<br />
                  {guestBodyLine2}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => { window.location.hash = '#fantasy'; }}
                    className="btn btn-primary"
                  >
                    {guestFantasyButton}
                  </button>
                  <button
                    onClick={() => { window.location.hash = '#login'; }}
                    className="btn btn-secondary"
                  >
                    {guestLoginButton}
                  </button>
                  <button
                    onClick={async () => {
                      await logout();
                      try { localStorage.removeItem('guest_id'); } catch {}
                      window.location.href = 'https://jazzify.jp/';
                      toast.info(isEnglishCopy ? 'Logged out' : 'ログアウトしました');
                    }}
                    className="btn btn-ghost"
                  >
                    {guestLogoutButton}
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