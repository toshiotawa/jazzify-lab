import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import DefenseDescentMap from '@/components/play/defenseDescent/DefenseDescentMap';
import { DefenseGameScreen } from '@/components/defense/DefenseGameScreen';
import { DefenseNextStepModal } from '@/components/defense/DefenseNextStepModal';
import { DefenseBlockCompleteModal } from '@/components/defense/DefenseBlockCompleteModal';
import { DefenseTutorial } from '@/components/defense/tutorial/DefenseTutorial';
import SoftLandingOfferModal from '@/components/lesson/SoftLandingOfferModal';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import LoadingScreen from '@/components/ui/LoadingScreen';
import type { PlayMapNode, PlayMapTier } from '@/platform/supabasePlayMap';
import {
  fetchPlayMapBlocks,
  fetchPlayMapNodeClears,
  fetchPlayMapNodes,
  recordPlayMapNodeClear,
} from '@/platform/supabasePlayMap';
import {
  fetchDefenseDifficultyLevel,
  fetchDefenseStageDetail,
} from '@/platform/supabaseDefense';
import type { DefenseDifficulty, DefenseStage } from '@/game/defense/defenseTypes';
import { resolvePlayMapDefenseDifficultyLevel } from '@/game/defense/playMapDefenseDifficulty';
import { awardPlayerXp } from '@/platform/supabasePlayerXp';
import { grantAndToastUserBadges } from '@/utils/badgeToasts';
import { showPlayerXpToasts } from '@/utils/playerXpToast';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import {
  defenseResultNextStepLabel,
  resolveDefenseTrainingGuidance,
  resolveDefenseTrainingGuidanceAfterTutorial,
  TRAINING_ROUTE_HASH,
  type DefenseTrainingGuidance,
} from '@/utils/defenseTrainingGuidance';
import { loadTodayTrainingStreakUpdated } from '@/utils/todayTrainingStreak';
import { unlockDefenseBackingAudioContext } from '@/game/defense/defenseBackingDeck';
import { markAudioUserInteraction } from '@/utils/MidiController';
import { useToast } from '@/stores/toastStore';
import { useSoftLandingOffer } from '@/hooks/useSoftLandingOffer';
import { isSoftLandingPaywallSource } from '@/utils/analytics/softLandingOffer';
import {
  getFirstBlock1LessonId,
  getNextIncompleteBlock1LessonId,
} from '@/utils/softLanding';
import { markSoftLandingSessionDismissed } from '@/utils/softLandingResume';

type Screen = 'map' | 'game' | 'tutorial';

interface LoadedStage {
  stage: DefenseStage;
  difficulty: DefenseDifficulty;
}

interface ActiveSession {
  readonly practiceMode: boolean;
  readonly nonce: number;
}

type ActionableDefenseGuidance = Exclude<DefenseTrainingGuidance, { kind: 'none' }>;

const DefenseMapMain: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');

  const [screen, setScreen] = useState<Screen>('map');
  const [mapTier, setMapTier] = useState<PlayMapTier>('basic');
  const [activeNode, setActiveNode] = useState<PlayMapNode | null>(null);
  const [loaded, setLoaded] = useState<LoadedStage | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [nextStepGuidance, setNextStepGuidance] = useState<ActionableDefenseGuidance | null>(null);
  const [todayStreakUpdated, setTodayStreakUpdated] = useState(false);
  const [resultNextStepLabel, setResultNextStepLabel] = useState<string | null>(null);
  const [showBlockCompleteModal, setShowBlockCompleteModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSoftLandingOffer, setShowSoftLandingOffer] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingSelectNodeId, setPendingSelectNodeId] = useState<string | null>(null);
  const skipSoftLandingOnPaywallCloseRef = useRef(false);
  const launchingRef = useRef(false);

  const {
    nextCourse: nextSoftLandingCourse,
    reload: reloadSoftLandingOffer,
    trackOfferViewed,
    trackOfferAccepted,
    trackOfferDismissed,
  } = useSoftLandingOffer({
    userId: profile?.id,
    enabled: !isPremiumMember,
    entry: 'chapter_complete',
  });

  const loadGuidance = useCallback(async (): Promise<{
    guidance: DefenseTrainingGuidance;
    streakUpdated: boolean;
    blocks: Awaited<ReturnType<typeof fetchPlayMapBlocks>>;
    nodes: Awaited<ReturnType<typeof fetchPlayMapNodes>>;
    clears: Awaited<ReturnType<typeof fetchPlayMapNodeClears>>;
  }> => {
    const [blocks, nodes, clears, streakUpdated] = await Promise.all([
      fetchPlayMapBlocks('defense'),
      fetchPlayMapNodes('defense'),
      fetchPlayMapNodeClears('defense'),
      loadTodayTrainingStreakUpdated(profile),
    ]);
    setTodayStreakUpdated(streakUpdated);
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
      blocks,
      nodes,
      clears,
    };
  }, [isEnglishCopy, isPremiumMember, profile]);

  const maybeShowBlockCompleteModal = useCallback(async () => {
    if (isPremiumMember) {
      return;
    }
    try {
      const { guidance } = await loadGuidance();
      if (guidance.kind === 'defenseBlockComplete') {
        setShowBlockCompleteModal(true);
      }
    } catch {
      /* ignore */
    }
  }, [isPremiumMember, loadGuidance]);

  const startSession = useCallback((practiceMode: boolean) => {
    markAudioUserInteraction();
    unlockDefenseBackingAudioContext();
    setSession((prev) => ({ practiceMode, nonce: (prev?.nonce ?? 0) + 1 }));
    setScreen('game');
  }, []);

  const startFromNode = useCallback(async (node: PlayMapNode, practiceMode: boolean) => {
    if (node.nodeKind === 'tutorial') {
      setActiveNode(node);
      setLoaded(null);
      setSession(null);
      setScreen('tutorial');
      return;
    }
    if (node.nodeKind === 'quest' && node.lessonId) {
      window.location.hash = buildLessonDetailHash(node.lessonId, {
        playMapNodeId: node.id,
        playMapMode: 'defense',
      });
      return;
    }
    if (!node.defenseStageId) return;
    if (launchingRef.current) return;

    launchingRef.current = true;
    setIsStarting(true);
    try {
      const [blocks, detail] = await Promise.all([
        fetchPlayMapBlocks('defense'),
        fetchDefenseStageDetail(node.defenseStageId),
      ]);
      if (!detail || detail.phrases.length === 0) return;
      const block = blocks.find((entry) => entry.id === node.blockId);
      if (block) {
        setMapTier(block.tier);
      }
      const difficultyLevel = resolvePlayMapDefenseDifficultyLevel(
        node.difficultyLevel,
        detail.difficultyLevel,
      );
      const difficulty = await fetchDefenseDifficultyLevel(
        difficultyLevel,
        detail.attackTrigger,
      );
      if (!difficulty) return;
      setActiveNode(node);
      setLoaded({ stage: { ...detail, difficultyLevel }, difficulty });
      startSession(practiceMode);
    } finally {
      launchingRef.current = false;
      setIsStarting(false);
    }
  }, [startSession]);

  const handlePendingSelectConsumed = useCallback(() => {
    setPendingSelectNodeId(null);
  }, []);

  const selectNodeOnMap = useCallback(async (nodeId: string) => {
    const blocks = await fetchPlayMapBlocks('defense');
    const nodes = await fetchPlayMapNodes('defense');
    const node = nodes.find((entry) => entry.id === nodeId);
    if (!node) return;
    const block = blocks.find((entry) => entry.id === node.blockId);
    if (block) {
      setMapTier(block.tier);
    }
    setPendingSelectNodeId(nodeId);
  }, []);

  const navigateToGuidance = useCallback(async (guidance: ActionableDefenseGuidance) => {
    setNextStepGuidance(null);
    if (guidance.kind === 'defenseBlockComplete') {
      setShowBlockCompleteModal(true);
      return;
    }
    if (guidance.kind === 'openTraining') {
      window.location.hash = TRAINING_ROUTE_HASH;
      return;
    }
    if (guidance.kind === 'openDefense') {
      await selectNodeOnMap(guidance.nodeId);
    }
  }, [selectNodeOnMap]);

  const openSoftLandingLesson = useCallback((autoTrackAccept: boolean) => {
    const target = nextSoftLandingCourse;
    if (!target) {
      return;
    }
    if (autoTrackAccept) {
      trackOfferAccepted(target.course);
    } else {
      trackOfferViewed(target.course);
    }
    setShowSoftLandingOffer(false);
    const nextLessonId = getNextIncompleteBlock1LessonId(
      target.course.lessons ?? [],
      target.block1ProgressMap ?? {},
    ) ?? getFirstBlock1LessonId(target.course.lessons ?? []);
    if (nextLessonId) {
      window.location.hash = buildLessonDetailHash(nextLessonId, { autoStart: true });
    }
  }, [nextSoftLandingCourse, trackOfferAccepted, trackOfferViewed]);

  const openSoftLandingOfferAfterPaywall = useCallback(async () => {
    const next = await reloadSoftLandingOffer({ forceRefresh: true });
    if (next) {
      trackOfferViewed(next.course);
      setShowSoftLandingOffer(true);
    }
  }, [reloadSoftLandingOffer, trackOfferViewed]);

  const handlePaywallClose = useCallback(() => {
    setShowPaywall(false);
    if (skipSoftLandingOnPaywallCloseRef.current) {
      skipSoftLandingOnPaywallCloseRef.current = false;
      return;
    }
    if (!isPremiumMember && isSoftLandingPaywallSource('phrase_defense')) {
      void openSoftLandingOfferAfterPaywall();
    }
  }, [isPremiumMember, openSoftLandingOfferAfterPaywall]);

  const handlePaywallContinueFree = useCallback(() => {
    skipSoftLandingOnPaywallCloseRef.current = true;
    setShowPaywall(false);
    void reloadSoftLandingOffer({ forceRefresh: true }).then((next) => {
      if (!next) {
        return;
      }
      trackOfferViewed(next.course);
      trackOfferAccepted(next.course);
      const nextLessonId = getNextIncompleteBlock1LessonId(
        next.course.lessons ?? [],
        next.block1ProgressMap ?? {},
      ) ?? getFirstBlock1LessonId(next.course.lessons ?? []);
      if (nextLessonId) {
        window.location.hash = buildLessonDetailHash(nextLessonId, { autoStart: true });
      }
    });
  }, [reloadSoftLandingOffer, trackOfferAccepted, trackOfferViewed]);

  const openTrainingFromBlockComplete = useCallback(() => {
    setShowBlockCompleteModal(false);
    window.location.hash = TRAINING_ROUTE_HASH;
  }, []);

  useEffect(() => {
    const nodeId = searchParams.get('nodeId');
    if (!nodeId) return;
    let cancelled = false;
    void selectNodeOnMap(nodeId).then(() => {
      if (cancelled) return;
      setSearchParams({});
    });
    return () => { cancelled = true; };
  }, [searchParams, selectNodeOnMap, setSearchParams]);

  const handleClear = useCallback(async () => {
    if (!activeNode || !loaded || session?.practiceMode) return;
    const result = await recordPlayMapNodeClear(activeNode.id, {
      surviveSec: loaded.stage.surviveSeconds,
    });
    if (result.isFirstClear) {
      const xp = await awardPlayerXp('defense_node_first_clear', activeNode.id, 80);
      showPlayerXpToasts(toast, xp, isEnglishCopy);
      await grantAndToastUserBadges(
        { event: 'play_map_node_clear', mode: 'defense' },
        toast,
        isEnglishCopy,
      );
    }
    try {
      const { guidance } = await loadGuidance();
      setResultNextStepLabel(defenseResultNextStepLabel(guidance, isEnglishCopy));
    } catch {
      setResultNextStepLabel(null);
    }
  }, [activeNode, isEnglishCopy, loadGuidance, loaded, session?.practiceMode, toast]);

  const backToMap = useCallback((options?: { checkBlockComplete?: boolean }) => {
    setScreen('map');
    setActiveNode(null);
    setLoaded(null);
    setSession(null);
    setResultNextStepLabel(null);
    setSearchParams({});
    if (options?.checkBlockComplete) {
      void maybeShowBlockCompleteModal();
    }
  }, [maybeShowBlockCompleteModal, setSearchParams]);

  const handleTutorialExit = useCallback(() => {
    void (async () => {
      backToMap();
      try {
        const { blocks, nodes, clears } = await loadGuidance();
        const clearedNodeIds = new Set(clears.map((clear) => clear.nodeId));
        const guidance = resolveDefenseTrainingGuidanceAfterTutorial({
          isPremiumMember,
          blocks,
          nodes,
          clearedNodeIds,
          isEnglishCopy,
        });
        if (guidance.kind === 'defenseBlockComplete') {
          setShowBlockCompleteModal(true);
          return;
        }
        if (guidance.kind !== 'none') {
          setNextStepGuidance(guidance);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [backToMap, isEnglishCopy, isPremiumMember, loadGuidance]);

  const handleResultNextStep = useCallback(() => {
    void (async () => {
      try {
        const { guidance } = await loadGuidance();
        if (guidance.kind === 'openDefense' && guidance.reason === 'nextStage') {
          backToMap();
          await navigateToGuidance(guidance);
          return;
        }
        backToMap({ checkBlockComplete: true });
      } catch {
        backToMap();
      }
    })();
  }, [backToMap, loadGuidance, navigateToGuidance]);

  const handleRetry = useCallback(() => {
    setResultNextStepLabel(null);
    setSession((prev) => (prev ? { ...prev, nonce: prev.nonce + 1 } : prev));
  }, []);

  const handleSoftLandingOfferAccept = useCallback(() => {
    openSoftLandingLesson(true);
  }, [openSoftLandingLesson]);

  const handleSoftLandingOfferDismiss = useCallback(() => {
    if (nextSoftLandingCourse) {
      trackOfferDismissed(nextSoftLandingCourse.course);
    }
    markSoftLandingSessionDismissed();
    setShowSoftLandingOffer(false);
  }, [nextSoftLandingCourse, trackOfferDismissed]);

  if (screen === 'tutorial' && activeNode) {
    return (
      <DefenseTutorial
        playMapNodeId={activeNode.id}
        onExit={handleTutorialExit}
      />
    );
  }

  if (screen === 'game' && loaded && session) {
    return (
      <>
        <DefenseGameScreen
          key={session.nonce}
          stage={loaded.stage}
          difficulty={loaded.difficulty}
          practiceMode={session.practiceMode}
          onExit={() => backToMap()}
          onResultBack={() => backToMap({ checkBlockComplete: true })}
          onRetry={handleRetry}
          onApplyPracticeModeAndRestart={startSession}
          onClear={() => { void handleClear(); }}
          resultNextStepLabel={resultNextStepLabel ?? undefined}
          onResultNextStep={resultNextStepLabel ? handleResultNextStep : undefined}
        />
        {showBlockCompleteModal ? (
          <DefenseBlockCompleteModal
            isEnglishCopy={isEnglishCopy}
            onPremium={() => {
              setShowBlockCompleteModal(false);
              setShowPaywall(true);
            }}
            onTraining={openTrainingFromBlockComplete}
            onDismiss={() => setShowBlockCompleteModal(false)}
          />
        ) : null}
        <WebPaywallModal
          open={showPaywall}
          onClose={handlePaywallClose}
          isEnglishCopy={isEnglishCopy}
          source="phrase_defense"
          onContinueFree={!isPremiumMember ? handlePaywallContinueFree : undefined}
        />
        <SoftLandingOfferModal
          open={showSoftLandingOffer}
          course={nextSoftLandingCourse?.course ?? null}
          isEnglishCopy={isEnglishCopy}
          entry="chapter_complete"
          onAccept={handleSoftLandingOfferAccept}
          onDismiss={handleSoftLandingOfferDismiss}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#09070f]">
      <GameHeader />
      <DefenseDescentMap
        isEnglishCopy={isEnglishCopy}
        isPremiumMember={isPremiumMember}
        tier={mapTier}
        onTierChange={setMapTier}
        onSelectNode={(node, practiceMode) => { void startFromNode(node, practiceMode); }}
        onSelectQuestNode={(node) => { void startFromNode(node, false); }}
        pendingSelectNodeId={pendingSelectNodeId}
        onPendingSelectNodeConsumed={handlePendingSelectConsumed}
      />
      {isStarting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09070f]/85">
          <LoadingScreen compact />
        </div>
      ) : null}
      {nextStepGuidance ? (
        <DefenseNextStepModal
          guidance={nextStepGuidance}
          isEnglishCopy={isEnglishCopy}
          todayStreakUpdated={todayStreakUpdated}
          onContinue={() => { void navigateToGuidance(nextStepGuidance); }}
          onDismiss={() => setNextStepGuidance(null)}
        />
      ) : null}
      {showBlockCompleteModal ? (
        <DefenseBlockCompleteModal
          isEnglishCopy={isEnglishCopy}
          onPremium={() => {
            setShowBlockCompleteModal(false);
            setShowPaywall(true);
          }}
          onTraining={openTrainingFromBlockComplete}
          onDismiss={() => setShowBlockCompleteModal(false)}
        />
      ) : null}
      <WebPaywallModal
        open={showPaywall}
        onClose={handlePaywallClose}
        isEnglishCopy={isEnglishCopy}
        source="phrase_defense"
        onContinueFree={!isPremiumMember ? handlePaywallContinueFree : undefined}
      />
      <SoftLandingOfferModal
        open={showSoftLandingOffer}
        course={nextSoftLandingCourse?.course ?? null}
        isEnglishCopy={isEnglishCopy}
        entry="chapter_complete"
        onAccept={handleSoftLandingOfferAccept}
        onDismiss={handleSoftLandingOfferDismiss}
      />
    </div>
  );
};

export default DefenseMapMain;
