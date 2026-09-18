import React, { useEffect, useState } from 'react';
import { FaChevronRight, FaDumbbell, FaGamepad } from 'react-icons/fa';
import {
  fetchDefenseLastPlayedAt,
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
import {
  markMainQuestResumeSessionShown,
  readMainQuestResumeSessionShown,
  shouldShowMainQuestResumePrompt,
} from '@/utils/mainQuestResume';

const DefenseTrainingResumeModal: React.FC = () => {
  const [guidance, setGuidance] = useState<DefenseTrainingGuidance>({ kind: 'none' });
  const [todayStreakUpdated, setTodayStreakUpdated] = useState(false);
  const [open, setOpen] = useState(false);
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!profile?.id) {
        return;
      }
      try {
        const lastPlayedAt = await fetchDefenseLastPlayedAt();
        const shouldShow = shouldShowMainQuestResumePrompt({
          lastPlayedAt,
          sessionAlreadyShown: readMainQuestResumeSessionShown(),
        });
        if (!shouldShow) {
          return;
        }

        const [blocks, nodes, clears, streakUpdated] = await Promise.all([
          fetchPlayMapBlocks('defense'),
          fetchPlayMapNodes('defense'),
          fetchPlayMapNodeClears('defense'),
          loadTodayTrainingStreakUpdated(profile),
        ]);
        const clearedNodeIds = new Set(clears.map((entry) => entry.nodeId));
        const nextGuidance = resolveDefenseTrainingGuidance({
          isPremiumMember,
          blocks,
          nodes,
          clearedNodeIds,
          isEnglishCopy,
        });
        if (cancelled || nextGuidance.kind === 'none') {
          return;
        }
        setGuidance(nextGuidance);
        setTodayStreakUpdated(streakUpdated);
        setOpen(true);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [isEnglishCopy, isPremiumMember, profile]);

  const handleContinue = () => {
    markMainQuestResumeSessionShown();
    setOpen(false);
    if (guidance.kind === 'openDefense') {
      window.location.hash = buildDefenseNodeHash(guidance.nodeId);
      return;
    }
    if (guidance.kind === 'openTraining') {
      window.location.hash = TRAINING_ROUTE_HASH;
    }
  };

  const handleClose = () => {
    markMainQuestResumeSessionShown();
    setOpen(false);
  };

  if (!open || guidance.kind === 'none') {
    return null;
  }

  const heading = isEnglishCopy ? 'Continue where you left off?' : '続きから再開しますか？';
  const bodyCopy = defenseGuidanceBodyCopy(guidance, isEnglishCopy, todayStreakUpdated);
  const primaryLabel = guidance.kind === 'openDefense'
    ? defenseGuidancePrimaryLabel(guidance, isEnglishCopy)
    : trainingGuidancePrimaryLabel(isEnglishCopy, todayStreakUpdated);
  const Icon = guidance.kind === 'openTraining' ? FaDumbbell : FaGamepad;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isEnglishCopy ? 'Close dialog' : 'ダイアログを閉じる'}
        onClick={handleClose}
      />
      <div
        className="relative mx-4 max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="defense-training-resume-modal-title"
      >
        <div className="mb-4 text-center">
          <h3 id="defense-training-resume-modal-title" className="text-xl font-bold text-white">
            {heading}
          </h3>
          {bodyCopy ? (
            <p className="mt-2 text-sm text-gray-300">{bodyCopy}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-colors hover:from-green-500 hover:to-emerald-500"
          >
            <Icon className="text-sm" aria-hidden />
            {primaryLabel}
            <FaChevronRight className="text-sm" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-slate-700/60 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-slate-600 hover:text-gray-200"
          >
            {isEnglishCopy ? 'Later' : 'あとで'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefenseTrainingResumeModal;
