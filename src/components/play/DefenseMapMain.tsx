import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import PlayWorldMap from '@/components/play/PlayWorldMap';
import { DefenseGameScreen } from '@/components/defense/DefenseGameScreen';
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

type Screen = 'map' | 'game';

interface LoadedStage {
  stage: DefenseStage;
  difficulty: DefenseDifficulty;
}

const DefenseMapMain: React.FC = () => {
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

  const [screen, setScreen] = useState<Screen>('map');
  const [activeNode, setActiveNode] = useState<PlayMapNode | null>(null);
  const [loaded, setLoaded] = useState<LoadedStage | null>(null);
  const [sessionNonce, setSessionNonce] = useState(0);

  const startFromNode = useCallback(async (node: PlayMapNode) => {
    if (node.nodeKind === 'quest' && node.lessonId) {
      window.location.hash = buildLessonDetailHash(node.lessonId, {
        playMapNodeId: node.id,
        playMapMode: 'defense',
      });
      return;
    }
    if (!node.defenseStageId) return;
    markAudioUserInteraction();
    unlockDefenseBackingAudioContext();
    const detail = await fetchDefenseStageDetail(node.defenseStageId);
    if (!detail || detail.phrases.length === 0) return;
    const difficulty = await fetchDefenseDifficultyLevel(detail.difficultyLevel);
    if (!difficulty) return;
    setActiveNode(node);
    setLoaded({ stage: detail, difficulty });
    setSessionNonce((n) => n + 1);
    setScreen('game');
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
    setSearchParams({});
  }, [setSearchParams]);

  if (screen === 'game' && loaded) {
    return (
      <DefenseGameScreen
        key={sessionNonce}
        stage={loaded.stage}
        difficulty={loaded.difficulty}
        practiceMode={false}
        onExit={backToMap}
        onRetry={() => setSessionNonce((n) => n + 1)}
        onClear={() => { void handleClear(); }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950">
      <GameHeader />
      <PlayWorldMap
        mode="defense"
        isEnglishCopy={isEnglishCopy}
        isPremiumMember={isPremiumMember}
        onSelectNode={(node) => { void startFromNode(node); }}
        onSelectQuestNode={(node) => { void startFromNode(node); }}
      />
    </div>
  );
};

export default DefenseMapMain;
