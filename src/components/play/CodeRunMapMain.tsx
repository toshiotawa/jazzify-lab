import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import PlayWorldMap from '@/components/play/PlayWorldMap';
import CodeRunGameScreen from '@/components/survival/codeRun/CodeRunGameScreen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';
import type { PlayMapNode } from '@/platform/supabasePlayMap';
import {
  fetchPlayMapNodes,
  fetchCodeRunRankThresholds,
  recordPlayMapNodeClear,
} from '@/platform/supabasePlayMap';
import { awardPlayerXp } from '@/platform/supabasePlayerXp';
import { grantAndToastUserBadges } from '@/utils/badgeToasts';
import { showPlayerXpToasts } from '@/utils/playerXpToast';
import {
  getStageByNumber,
  fetchAllStages,
  type StageDefinition,
} from '@/components/survival/SurvivalStageDefinitions';
import { rebuildDescentBlocks } from '@/components/survival/descent/descentBlocks';
import { DIFFICULTY_CONFIGS } from '@/components/survival/SurvivalStageSelect';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { useSurvivalMidiSession } from '@/hooks/useSurvivalMidiSession';
import { markAudioUserInteraction } from '@/utils/MidiController';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { ensureSurvivalBattleAudio } from '@/utils/ensureSurvivalBattleAudio';
import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  fetchSurvivalBgmSettings,
  resolveStageBgmUrl,
  toSurvivalBgmSettingsMap,
} from '@/platform/supabaseSurvival';
import {
  scoreToCodeRunRank,
  meetsCodeRunRankRequirement,
  type CodeRunRankThreshold,
} from '@/utils/codeRunRank';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import { useToast } from '@/stores/toastStore';

type Screen = 'map' | 'game';

const CodeRunMapMain: React.FC = () => {
  const navigate = useNavigate();
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
  const survivalMidi = useSurvivalMidiSession();

  const [screen, setScreen] = useState<Screen>('map');
  const [activeNode, setActiveNode] = useState<PlayMapNode | null>(null);
  const [activeStage, setActiveStage] = useState<StageDefinition | null>(null);
  const [activeConfig, setActiveConfig] = useState<DifficultyConfig | null>(null);
  const [sessionNonce, setSessionNonce] = useState(0);
  const [stagesReady, setStagesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchAllStages().then(() => {
      rebuildDescentBlocks();
      if (!cancelled) setStagesReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const startFromNode = useCallback(async (node: PlayMapNode) => {
    if (node.nodeKind === 'quest' && node.lessonId) {
      window.location.hash = buildLessonDetailHash(node.lessonId, {
        playMapNodeId: node.id,
        playMapMode: 'code_run',
      });
      return;
    }
    if (node.survivalStageNumber == null) return;
    const stage = getStageByNumber(
      node.survivalStageNumber,
      (node.survivalMapCategory ?? 'basic') as 'basic',
    );
    if (!stage) return;
    markAudioUserInteraction();
    try {
      await Promise.race([
        (async () => {
          await FantasySoundManager.unlock();
          await ensureSurvivalBattleAudio();
        })(),
        new Promise<void>((resolve) => { setTimeout(resolve, 3000); }),
      ]);
    } catch { /* ignore */ }

    let bgmSettings = DEFAULT_SURVIVAL_BGM_SETTINGS;
    try {
      bgmSettings = toSurvivalBgmSettingsMap(await fetchSurvivalBgmSettings());
    } catch { /* defaults */ }

    const base = DIFFICULTY_CONFIGS.find((c) => c.difficulty === stage.difficulty)
      ?? DIFFICULTY_CONFIGS[0];
    const config: DifficultyConfig = {
      ...base,
      displayName: stage.name,
      description: stage.name,
      descriptionEn: stage.nameEn,
      allowedChords: stage.allowedChords,
      bgmUrl: resolveStageBgmUrl(stage, bgmSettings),
    };
    setActiveNode(node);
    setActiveStage(stage);
    setActiveConfig(config);
    setSessionNonce((n) => n + 1);
    setScreen('game');
  }, []);

  useEffect(() => {
    const nodeId = searchParams.get('nodeId');
    if (!nodeId || !stagesReady) return;
    let cancelled = false;
    void fetchPlayMapNodes('code_run').then((nodes) => {
      if (cancelled) return;
      const node = nodes.find((n) => n.id === nodeId);
      if (node) void startFromNode(node);
    });
    return () => { cancelled = true; };
  }, [searchParams, stagesReady, startFromNode]);

  const handlePlayMapClear = useCallback(async (elapsedSec: number) => {
    if (!activeNode) return;
    const thresholds = await fetchCodeRunRankThresholds();
    const mapped: CodeRunRankThreshold[] = thresholds.map((t) => ({
      rank: t.rank,
      maxSeconds: t.maxSeconds,
      sortOrder: t.sortOrder,
    }));
    const rank = scoreToCodeRunRank(elapsedSec, mapped);
    if (!meetsCodeRunRankRequirement(rank, activeNode.requiredRank, mapped)) {
      return;
    }
    const result = await recordPlayMapNodeClear(activeNode.id, {
      timeSec: elapsedSec,
      rank,
    });
    if (result.isFirstClear) {
      const xp = await awardPlayerXp('code_run_node_first_clear', activeNode.id, 80);
      showPlayerXpToasts(toast, xp, isEnglishCopy);
      await grantAndToastUserBadges(
        { event: 'play_map_node_clear', mode: 'code_run' },
        toast,
        isEnglishCopy,
      );
    }
  }, [activeNode, isEnglishCopy, toast]);

  const backToMap = useCallback(() => {
    setScreen('map');
    setActiveNode(null);
    setActiveStage(null);
    setActiveConfig(null);
    setSearchParams({});
  }, [setSearchParams]);

  const goNextNode = useCallback(async () => {
    if (!activeNode) {
      backToMap();
      return;
    }
    const nodes = await fetchPlayMapNodes('code_run');
    const sameBlock = nodes
      .filter((n) => n.blockId === activeNode.blockId && n.nodeKind === 'stage')
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sameBlock.findIndex((n) => n.id === activeNode.id);
    const next = idx >= 0 ? sameBlock[idx + 1] : undefined;
    if (next) {
      setSearchParams({ nodeId: next.id });
      void startFromNode(next);
      return;
    }
    backToMap();
  }, [activeNode, backToMap, setSearchParams, startFromNode]);

  if (!stagesReady) {
    return <LoadingScreen compact />;
  }

  if (screen === 'game' && activeStage && activeConfig && activeNode) {
    return (
      <CodeRunGameScreen
        key={`crm-${activeNode.id}-${sessionNonce}`}
        difficulty={activeStage.difficulty}
        config={activeConfig}
        stageDefinition={activeStage}
        onBackToSelect={backToMap}
        onBackToMenu={() => navigate('/main/play')}
        hintMode={false}
        autoRun
        survivalMidi={survivalMidi}
        playMapNodeId={activeNode.id}
        onPlayMapClear={handlePlayMapClear}
        onNextStage={() => { void goNextNode(); }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      <GameHeader />
      <PlayWorldMap
        mode="code_run"
        isEnglishCopy={isEnglishCopy}
        isPremiumMember={isPremiumMember}
        onSelectNode={(node) => { void startFromNode(node); }}
        onSelectQuestNode={(node) => { void startFromNode(node); }}
      />
      <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
    </div>
  );
};

export default CodeRunMapMain;
