import React, { useEffect, useState } from 'react';
import { FaChevronRight, FaMedal } from 'react-icons/fa';
import { BADGE_TOTAL_COUNT } from '@/utils/badgeDefinitions';
import { BADGES_UPDATED_EVENT, fetchUserBadges } from '@/platform/supabaseBadges';

interface AchievementSummarySectionProps {
  userId: string;
  isEnglishCopy: boolean;
}

const AchievementSummarySection: React.FC<AchievementSummarySectionProps> = ({
  userId,
  isEnglishCopy,
}) => {
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const badges = await fetchUserBadges(userId);
        if (!cancelled) {
          setEarnedCount(badges.length);
        }
      } catch {
        if (!cancelled) {
          setEarnedCount(0);
        }
      }
    };

    const onBadgesUpdated = () => {
      void load();
    };

    void load();
    window.addEventListener(BADGES_UPDATED_EVENT, onBadgesUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(BADGES_UPDATED_EVENT, onBadgesUpdated);
    };
  }, [userId]);

  return (
    <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <FaMedal className="text-2xl text-amber-300" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white">
              {isEnglishCopy ? 'Earned Titles' : '取得称号'}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {isEnglishCopy
                ? `${earnedCount}/${BADGE_TOTAL_COUNT} titles earned`
                : `${BADGE_TOTAL_COUNT}個中 ${earnedCount}個 獲得`}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500/15 border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25 transition-colors"
          onClick={() => {
            window.location.hash = '#achievements';
          }}
        >
          <span>{isEnglishCopy ? 'View list' : '称号一覧へ'}</span>
          <FaChevronRight className="w-3 h-3" aria-hidden />
        </button>
      </div>
    </section>
  );
};

export default AchievementSummarySection;
