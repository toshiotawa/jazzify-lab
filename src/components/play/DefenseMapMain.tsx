import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import DefenseDescentMap from '@/components/play/defenseDescent/DefenseDescentMap';
import { DefenseGameScreen } from '@/components/defense/DefenseGameScreen';
import { DefenseRunPrepPanel } from '@/components/defense/DefenseRunPrepPanel';
import type { PlayMapNode } from '@/platform/supabasePlayMap';
import {
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
import { unlockDefenseBackingAudioContext } from '@/game/defense/defenseBackingDeck';
import { markAudioUserInteraction } from '@/utils/MidiController';
import { useToast } from '@/stores/toastStore';

type Screen = 'map' | 'prep' | 'game';

interface LoadedStage {
  stage: DefenseStage;
  difficulty: DefenseDifficulty;
}

interface ActiveSession {
  readonly practiceMode: boolean;
  readonly nonce: number;
}

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
  const [activeNode, setActiveNode] = useState<PlayMapNode | null>(null);
  const [loaded, setLoaded] = useState<LoadedStage | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);

  const startFromNode = useCallback(async (node: PlayMapNode) => {
    if (node.nodeKind === 'quest' && node.lessonId) {
      window.location.hash = buildLessonDetailHash(node.lessonId, {
        playMapNodeId: node.id,
        playMapMode: 'defense',
      });
      return;
    }
    if (!node.defenseStageId) return;
    const detail = await fetchDefenseStageDetail(node.defenseStageId);
    if (!detail || detail.phrases.length === 0) return;
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
    setSession(null);
    setScreen('prep');
  }, []);

  useEffect(() => {
    const nodeId = searchParams.get('nodeId');
    if (!nodeId) return;
    let cancelled = false;
    void fetchPlayMapNodes('defense').then((nodes) => {
      if (cancelled) return;
      const node = nodes.find((n) => n.id === nodeId);
      if (node) void startFromNode(node);
    });
    return () => { cancelled = true; };
  }, [searchParams, startFromNode]);

  const startSession = useCallback((practiceMode: boolean) => {
    markAudioUserInteraction();
    unlockDefenseBackingAudioContext();
    setSession((prev) => ({ practiceMode, nonce: (prev?.nonce ?? 0) + 1 }));
    setScreen('game');
  }, []);

  const handleClear = useCallback(async () => {
    if (!activeNode || !loaded) return;
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
  }, [activeNode, isEnglishCopy, loaded, toast]);

  const backToMap = useCallback(() => {
    setScreen('map');
    setActiveNode(null);
    setLoaded(null);
    setSession(null);
    setSearchParams({});
  }, [setSearchParams]);

  const backToPrep = useCallback(() => {
    setSession(null);
    setScreen('prep');
  }, []);

  const handleRetry = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, nonce: prev.nonce + 1 } : prev));
  }, []);

  if (screen === 'game' && loaded && session) {
    return (
      <DefenseGameScreen
        key={session.nonce}
        stage={loaded.stage}
        difficulty={loaded.difficulty}
        practiceMode={session.practiceMode}
        onExit={backToPrep}
        onRetry={handleRetry}
        onClear={() => { void handleClear(); }}
      />
    );
  }

  if (screen === 'prep' && loaded) {
    return (
      <div className="min-h-[100dvh] bg-[#09070f] text-white">
        <GameHeader />
        <main className="mx-auto max-w-lg px-4 py-6">
          <h1 className="text-2xl font-bold">
            {isEnglishCopy ? 'Phrase Defense' : 'フレーズディフェンス'}
          </h1>
          <div className="mt-6">
            <DefenseRunPrepPanel
              variant="map"
              stage={loaded.stage}
              isEnglishCopy={isEnglishCopy}
              onStartPractice={() => startSession(true)}
              onStartPerformance={() => startSession(false)}
            />
          </div>
          <button
            type="button"
            className="mt-6 text-sm text-slate-400 underline hover:text-slate-200"
            onClick={backToMap}
          >
            {isEnglishCopy ? 'Back to map' : 'マップに戻る'}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#09070f]">
      <GameHeader />
      <DefenseDescentMap
        isEnglishCopy={isEnglishCopy}
        isPremiumMember={isPremiumMember}
        onSelectNode={(node) => { void startFromNode(node); }}
        onSelectQuestNode={(node) => { void startFromNode(node); }}
      />
    </div>
  );
};

export default DefenseMapMain;
