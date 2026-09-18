import React, { useCallback, useEffect, useState } from 'react';
import { FaChevronRight, FaDumbbell, FaGamepad } from 'react-icons/fa';
import {
  fetchPlayMapBlocks,
  fetchPlayMapNodeClears,
  fetchPlayMapNodes,
} from '@/platform/supabasePlayMap';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import {
  buildDefenseNodeHash,
  defenseGuidanceBodyCopy,
  defenseGuidancePrimaryLabel,
  resolveDefenseTrainingGuidance,
  TRAINING_ROUTE_HASH,
  trainingGuidancePrimaryLabel,
  type DefenseTrainingGuidance,
} from '@/utils/defenseTrainingGuidance';
import { loadTodayTrainingStreakUpdated } from '@/utils/todayTrainingStreak';
import { recordUserMilestoneFireAndForget } from '@/utils/analytics/milestones';
import { trackEvent } from '@/utils/analytics/ga';

const DefenseGuidanceSection: React.FC = () => {
  const [guidance, setGuidance] = useState<DefenseTrainingGuidance>({ kind: 'none' });
  const [todayStreakUpdated, setTodayStreakUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile, pendingDefenseGuidanceAutoStart, consumeDefenseGuidanceAutoStart } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');

  const loadGuidance = useCallback(async () => {
    try {
      const [blocks, nodes, clears, streakUpdated] = await Promise.all([
        fetchPlayMapBlocks('defense'),
        fetchPlayMapNodes('defense'),
        fetchPlayMapNodeClears('defense'),
        loadTodayTrainingStreakUpdated(profile),
      ]);
      const clearedNodeIds = new Set(clears.map((entry) => entry.nodeId));
      return {
        guidance: resolveDefenseTrainingGuidance({
          isPremiumMember,
          blocks,
          nodes,
          clearedNodeIds,
          isEnglishCopy,
        }),
        streakUpdated,
      };
    } catch {
      return { guidance: { kind: 'none' } as const, streakUpdated: false };
    }
  }, [isEnglishCopy, isPremiumMember, profile]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const next = await loadGuidance();
      if (!cancelled) {
        setGuidance(next.guidance);
        setTodayStreakUpdated(next.streakUpdated);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadGuidance]);

  const navigateToGuidance = useCallback((target: DefenseTrainingGuidance) => {
    if (target.kind === 'openDefense') {
      window.location.hash = buildDefenseNodeHash(target.nodeId);
      return;
    }
    if (target.kind === 'openTraining') {
      window.location.hash = TRAINING_ROUTE_HASH;
    }
  }, []);

  useEffect(() => {
    if (!pendingDefenseGuidanceAutoStart || guidance.kind === 'none' || !profile) {
      return;
    }
    consumeDefenseGuidanceAutoStart();
    if (guidance.kind === 'openDefense' && guidance.reason === 'tutorial') {
      recordUserMilestoneFireAndForget(profile.id, 'first_play');
      trackEvent('tutorial_begin', { tutorial_name: 'defense_input_setup' });
    }
    navigateToGuidance(guidance);
  }, [
    pendingDefenseGuidanceAutoStart,
    guidance,
    profile,
    consumeDefenseGuidanceAutoStart,
    navigateToGuidance,
  ]);

  if (loading || guidance.kind === 'none') {
    return null;
  }

  const sectionTitle = isEnglishCopy ? 'Recommended next step' : '次におすすめ';
  const bodyCopy = defenseGuidanceBodyCopy(guidance, isEnglishCopy, todayStreakUpdated);
  const primaryLabel = guidance.kind === 'openDefense'
    ? defenseGuidancePrimaryLabel(guidance, isEnglishCopy)
    : trainingGuidancePrimaryLabel(isEnglishCopy, todayStreakUpdated);
  const Icon = guidance.kind === 'openTraining' ? FaDumbbell : FaGamepad;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="text-green-400 text-lg" />
        <h3 className="text-base font-extrabold">{sectionTitle}</h3>
      </div>
      {bodyCopy ? (
        <p className="text-sm text-gray-300 mb-3">{bodyCopy}</p>
      ) : null}
      <button
        type="button"
        onClick={() => navigateToGuidance(guidance)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors"
      >
        <span>{primaryLabel}</span>
        <FaChevronRight className="text-xs" aria-hidden />
      </button>
    </div>
  );
};

export default DefenseGuidanceSection;
