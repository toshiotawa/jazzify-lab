import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserStatsStore } from '@/stores/userStatsStore';
import { Announcement, fetchActiveAnnouncements } from '@/platform/supabaseAnnouncements';
import { useToast } from '@/stores/toastStore';
import { mdToHtml } from '@/utils/markdown';
import {
  FaBell,
  FaExternalLinkAlt,
  FaGem,
  FaMedal,
} from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import MainQuestProgressSection from '@/components/dashboard/MainQuestProgressSection';
import WebPaywallModal from '@/components/ui/WebPaywallModal';

/**
 * ダッシュボード画面
 * Hash: #dashboard で表示
 */
const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const { profile, optimisticAvatarUrl } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });
  const { isPremiumMember, planLabel } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');
  const announcementsTitle = isEnglishCopy ? 'Announcements' : 'お知らせ';
  const noAnnouncementsText = isEnglishCopy ? 'No announcements at the moment' : '現在お知らせはありません';
  const viewAllAnnouncementsText = isEnglishCopy ? 'View all announcements →' : 'すべてのお知らせを見る →';
  const statsLoadingText = isEnglishCopy ? 'Loading stats...' : '統計を読み込み中...';
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
      void loadDashboardData();
    }
  }, [open, profile?.id]);

  const loadDashboardData = async () => {
    const promises: Promise<unknown>[] = [];

    promises.push(
      fetchActiveAnnouncements(isEnglishCopy ? 'en' : 'ja')
        .then((announcementsData) => {
          const sortedAnnouncements = announcementsData.sort((a: Announcement, b: Announcement) => {
            if (a.priority !== b.priority) {
              return a.priority - b.priority;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          const latestData = sortedAnnouncements.length > 0 ? sortedAnnouncements[0] : null;
          setLatestAnnouncement(latestData);
        })
        .catch((announcementError: unknown) => {
          const message = announcementError instanceof Error ? announcementError.message : String(announcementError);
          toast.error(
            isEnglishCopy
              ? `Failed to load announcements: ${message}`
              : `お知らせの読み込みに失敗しました: ${message}`,
            {
              title: isEnglishCopy ? 'Announcement error' : 'お知らせエラー',
              duration: 5000,
            },
          );
        }),
    );

    if (profile) {
      promises.push(
        fetchStats(profile.id).catch(() => {
          /* 統計失敗は非致命 */
        }),
      );
    }

    await Promise.all(promises);
  };

  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'premium':
        return <FaGem className="text-yellow-400 text-lg" />;
      case 'free':
      default:
        return <FaMedal className="text-gray-400 text-sm" />;
    }
  };

  const [showPaywall, setShowPaywall] = useState(false);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <MainQuestProgressSection />
          {!isPremiumMember && (
            <button
              type="button"
              className="w-full text-left rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-900/30 to-orange-900/20 p-5 transition-all hover:border-amber-500/50 hover:from-amber-900/40 hover:to-orange-900/30"
              onClick={() => setShowPaywall(true)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 shrink-0">
                  <FaGem className="text-xl text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-amber-100">
                    {isEnglishCopy ? 'Upgrade to Premium' : 'プレミアムにアップグレード'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {isEnglishCopy
                      ? 'Unlock all quests, modes, and features. 7-day free trial available.'
                      : 'すべてのクエスト・モード・機能を解放。7日間無料トライアルあり。'}
                  </p>
                </div>
                <span className="text-amber-400 text-sm font-semibold shrink-0">
                  {isEnglishCopy ? 'Details →' : '詳細 →'}
                </span>
              </div>
            </button>
          )}
          <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglishCopy} />
          {profile && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center space-x-4">
                <img
                  src={optimisticAvatarUrl || profile.avatar_url || DEFAULT_AVATAR_URL}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{profile.nickname}</h2>

                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      {getRankIcon(isPremiumMember ? 'premium' : 'free')}
                      <span>{planLabel}</span>
                    </div>
                  </div>

                  {statsLoading ? (
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                      <span className="animate-pulse">{statsLoadingText}</span>
                    </div>
                  ) : userStats ? (
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
                      <span>
                        {isEnglishCopy ? 'Quests cleared' : 'クエストクリア数'} {userStats.lessonCompletedCount}
                      </span>
                      <span>
                        {isEnglishCopy ? 'Survival cleared' : 'サバイバルクリア'}{' '}
                        {userStats.survivalClearCount}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
              <FaBell className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold">{announcementsTitle}</h3>
            </div>

            <div className="p-4">
              {!latestAnnouncement ? (
                <p className="text-gray-400 text-center py-6">{noAnnouncementsText}</p>
              ) : (
                <div className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                  <h4 className="font-semibold mb-2">
                    {isEnglishCopy && latestAnnouncement.title_en
                      ? latestAnnouncement.title_en
                      : latestAnnouncement.title}
                  </h4>
                  <div
                    className="text-sm text-gray-300 mb-3 [&_a]:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-300 [&_a]:transition-colors"
                    dangerouslySetInnerHTML={{
                      __html: mdToHtml(
                        isEnglishCopy && latestAnnouncement.content_en
                          ? latestAnnouncement.content_en
                          : latestAnnouncement.content,
                      ),
                    }}
                  />

                  {latestAnnouncement.link_url && (
                    <a
                      href={latestAnnouncement.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      <span>
                        {isEnglishCopy && latestAnnouncement.link_text_en
                          ? latestAnnouncement.link_text_en
                          : latestAnnouncement.link_text || (isEnglishCopy ? 'Open link' : 'リンクを開く')}
                      </span>
                    </a>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(latestAnnouncement.created_at).toLocaleDateString(isEnglishCopy ? 'en-US' : 'ja-JP')}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '#information';
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {viewAllAnnouncementsText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
