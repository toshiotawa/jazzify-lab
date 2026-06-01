import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaLock, FaMedal, FaTimes } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { useToast } from '@/stores/toastStore';
import { fetchUserBadges, type EarnedBadge } from '@/platform/supabaseBadges';
import { BADGE_CATEGORIES, BADGE_DEFINITIONS, BADGE_TOTAL_COUNT, type BadgeDefinition } from '@/utils/badgeDefinitions';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { syncAndToastUserBadges } from '@/utils/badgeToasts';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { LessonMapAudio } from '@/utils/LessonMapAudio';
import { SurvivalMapAudio } from '@/utils/SurvivalMapAudio';

const formatEarnedDate = (earnedAt: string, isEnglishCopy: boolean): string => {
  const date = new Date(earnedAt);
  if (Number.isNaN(date.getTime())) {
    return isEnglishCopy ? 'Unknown' : '不明';
  }
  return date.toLocaleDateString(isEnglishCopy ? 'en-US' : 'ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const AchievementsPage: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const toast = useToast();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  useEffect(() => {
    void LessonMapAudio.stopBgmImmediately();
    void SurvivalMapAudio.stopBgm();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await syncAndToastUserBadges(toast, isEnglishCopy);
      } catch {
        /* 遅延付与に失敗しても一覧表示は続行 */
      }

      try {
        const badges = await fetchUserBadges(profile.id);
        if (!cancelled) {
          setEarnedBadges(badges);
        }
      } catch {
        if (!cancelled) {
          setEarnedBadges([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, toast, isEnglishCopy]);

  const earnedById = useMemo(() => {
    const map = new Map<string, EarnedBadge>();
    for (const badge of earnedBadges) {
      map.set(badge.badgeId, badge);
    }
    return map;
  }, [earnedBadges]);

  const groupedBadges = useMemo(
    () => BADGE_CATEGORIES.map(category => ({
      category,
      badges: BADGE_DEFINITIONS.filter(badge => badge.categoryId === category.id),
    })),
    [],
  );

  const selectedEarned = selectedBadge ? earnedById.get(selectedBadge.id) : undefined;

  const handleBadgeTap = (badge: BadgeDefinition) => {
    if (earnedById.has(badge.id)) {
      try {
        FantasySoundManager.playQuestPreCompleteJingle();
      } catch {
        /* 音声再生失敗は非致命 */
      }
    }
    setSelectedBadge(badge);
  };

  if (loading) {
    return <LoadingScreen message={isEnglishCopy ? 'Loading titles...' : '称号を読み込み中...'} />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white overflow-hidden">
      <GameHeader />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 transition-colors"
              onClick={() => {
                window.location.hash = '#dashboard';
              }}
            >
              <FaChevronLeft className="w-3 h-3" aria-hidden />
              <span>{isEnglishCopy ? 'Top' : 'トップへ'}</span>
            </button>
            <div className="text-right">
              <h1 className="text-2xl font-bold">{isEnglishCopy ? 'Titles' : '称号一覧'}</h1>
              <p className="text-sm text-slate-400">
                {isEnglishCopy
                  ? `${earnedBadges.length}/${BADGE_TOTAL_COUNT} earned`
                  : `${BADGE_TOTAL_COUNT}個中 ${earnedBadges.length}個 獲得`}
              </p>
            </div>
          </div>

          {groupedBadges.map(({ category, badges }) => (
            <section key={category.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <FaMedal className="text-amber-300" aria-hidden />
                <h2 className="text-lg font-semibold">
                  {isEnglishCopy ? category.labelEn : category.labelJa}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {badges.map(badge => {
                  const earned = earnedById.get(badge.id);
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-left hover:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/50 transition-colors"
                      onClick={() => handleBadgeTap(badge)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-16 h-16 shrink-0">
                          <img
                            src={badge.imagePath}
                            alt={isEnglishCopy ? badge.nameEn : badge.nameJa}
                            className={`w-16 h-16 object-contain ${earned ? '' : 'grayscale opacity-35'}`}
                            draggable={false}
                          />
                          {!earned && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45">
                              <FaLock className="text-slate-300" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-amber-200">Rank {badge.rank}</div>
                          <div className="font-semibold text-sm text-white break-words">
                            {isEnglishCopy ? badge.nameEn : badge.nameJa}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 break-words">
                            {earned
                              ? (isEnglishCopy ? 'Earned' : '獲得済み')
                              : (isEnglishCopy ? 'Locked' : '未獲得')}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {selectedBadge && (
        <div
          className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-detail-title"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-300">
                  {isEnglishCopy ? 'Title detail' : '称号詳細'}
                </p>
                <h2 id="achievement-detail-title" className="text-xl font-bold mt-1">
                  {isEnglishCopy ? selectedBadge.nameEn : selectedBadge.nameJa}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label={isEnglishCopy ? 'Close' : '閉じる'}
                onClick={() => setSelectedBadge(null)}
              >
                <FaTimes aria-hidden />
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <img
                src={selectedBadge.imagePath}
                alt={isEnglishCopy ? selectedBadge.nameEn : selectedBadge.nameJa}
                className={`w-36 h-36 object-contain ${selectedEarned ? '' : 'grayscale opacity-35'}`}
                draggable={false}
              />
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">{isEnglishCopy ? 'Condition' : '獲得条件'}</dt>
                <dd className="mt-1 text-white">
                  {isEnglishCopy ? selectedBadge.conditionEn : selectedBadge.conditionJa}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">{isEnglishCopy ? 'Earned date' : '獲得日'}</dt>
                <dd className="mt-1 text-white">
                  {selectedEarned
                    ? formatEarnedDate(selectedEarned.earnedAt, isEnglishCopy)
                    : (isEnglishCopy ? 'Not earned yet' : '未獲得')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
