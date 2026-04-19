/**
 * 魔王城降下マップ：サバイバルのステージ選択画面
 * - 固定ビューポート + transform: translate3d() の仮想カメラ
 * - 21ブロック(コードタイプ単位)を縦に連結
 * - 最前線ステージにキャラクター、ノードクリックで詳細モーダル
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { platform } from '@/platform';
import {
  fetchSurvivalDifficultySettings,
  fetchSurvivalCharacters,
  fetchSurvivalStageProgress,
  fetchSurvivalStageClears,
  SurvivalCharacterRow,
  SurvivalStageClear,
} from '@/platform/supabaseSurvival';
import { DIFFICULTY_CONFIGS } from '../SurvivalStageSelect';
import {
  ALL_STAGES,
  TOTAL_STAGES,
  StageDefinition,
} from '../SurvivalStageDefinitions';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from '../SurvivalTypes';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';
import { isIOSWebView } from '@/utils/iosbridge';
import {
  ALL_BLOCK_LAYOUTS,
  MAP_LOGICAL_HEIGHT,
  MAP_LOGICAL_WIDTH,
  getStagePosition,
  getBlockLayoutForStage,
} from './descentLayout';
import { ALL_BLOCKS, getAccessibleBlockIndex } from './descentBlocks';
import DescentBlock, { BlockDimVeil } from './DescentBlock';
import BackgroundWall from './parts/BackgroundWall';
import DescentCharacter from './parts/DescentCharacter';
import StageDetailModal from './StageDetailModal';
import { useDescentCamera } from './useDescentCamera';

const convertToSurvivalCharacter = (row: SurvivalCharacterRow): SurvivalCharacter => ({
  id: row.id,
  name: row.name,
  nameEn: row.nameEn,
  avatarUrl: row.avatarUrl,
  sortOrder: row.sortOrder,
  initialStats: row.initialStats as SurvivalCharacter['initialStats'],
  initialSkills: row.initialSkills as SurvivalCharacter['initialSkills'],
  initialMagics: row.initialMagics as SurvivalCharacter['initialMagics'],
  level10Bonuses: row.level10Bonuses,
  excludedBonuses: row.excludedBonuses,
  permanentEffects: row.permanentEffects,
  noMagic: row.noMagic,
  abColumnMagic: row.abColumnMagic,
  bonusChoiceCount: row.bonusChoiceCount,
  hpRegenPerSecond: row.hpRegenPerSecond,
  autoCollectExp: row.autoCollectExp,
  description: row.description,
  descriptionEn: row.descriptionEn,
});

const isFaiCharacter = (character: SurvivalCharacter): boolean => {
  const normalizedName = character.name.trim();
  const normalizedNameEn = (character.nameEn ?? '').trim().toLowerCase();
  const normalizedId = character.id.trim().toLowerCase();
  return normalizedName === 'ファイ' || normalizedNameEn === 'fai' || normalizedId === 'fai';
};

interface SurvivalDescentMapProps {
  onStageSelect: (
    difficulty: SurvivalDifficulty,
    config: DifficultyConfig,
    stageDefinition: StageDefinition,
    character?: SurvivalCharacter,
    hintMode?: boolean,
  ) => void;
  onBackToMenu: () => void;
  embedded?: boolean;
  playLocked?: boolean;
}

const VIEWPORT_FALLBACK_HEIGHT = 720;

const readDebugProgress = (): number | null => {
  try {
    const hash = window.location.hash;
    const idx = hash.indexOf('?');
    if (idx < 0) return null;
    const params = new URLSearchParams(hash.slice(idx + 1));
    const raw = params.get('debugProgress');
    if (!raw) return null;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.min(n, TOTAL_STAGES);
  } catch {
    return null;
  }
};

const SurvivalDescentMap: React.FC<SurvivalDescentMapProps> = ({
  onStageSelect,
  playLocked = false,
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<SurvivalCharacter[]>([]);
  const [difficultyConfigs, setDifficultyConfigs] = useState<DifficultyConfig[]>(DIFFICULTY_CONFIGS);
  const [currentStageNumber, setCurrentStageNumber] = useState(1);
  const [clearedStages, setClearedStages] = useState<Set<number>>(new Set());
  const [selectedStageNumber, setSelectedStageNumber] = useState<number | null>(null);
  const [hintMode, setHintMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: MAP_LOGICAL_WIDTH, height: VIEWPORT_FALLBACK_HEIGHT });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = Math.min(viewport.width / MAP_LOGICAL_WIDTH, 1.8);
  const mapWidthPx = MAP_LOGICAL_WIDTH * scale;
  const mapHeightPx = MAP_LOGICAL_HEIGHT * scale;
  const worldWidthPx = Math.max(mapWidthPx, viewport.width);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const settingsData = await fetchSurvivalDifficultySettings();
        if (settingsData.length > 0) {
          const configs = settingsData.map((s): DifficultyConfig => ({
            difficulty: s.difficulty,
            displayName: s.displayName,
            description: s.description || '',
            descriptionEn: s.descriptionEn || '',
            allowedChords: s.allowedChords,
            enemySpawnRate: s.enemySpawnRate,
            enemySpawnCount: s.enemySpawnCount,
            enemyStatMultiplier: s.enemyStatMultiplier,
            expMultiplier: s.expMultiplier,
            itemDropRate: s.itemDropRate,
            bgmOddWaveUrl: s.bgmOddWaveUrl,
            bgmEvenWaveUrl: s.bgmEvenWaveUrl,
          }));
          setDifficultyConfigs(configs);
        }
      } catch { /* fallback */ }

      try {
        const charRows = await fetchSurvivalCharacters();
        const chars = charRows.map(convertToSurvivalCharacter);
        setCharacters(chars);
      } catch { /* ignore */ }

      if (profile) {
        try {
          const progress = await fetchSurvivalStageProgress(profile.id);
          setCurrentStageNumber(progress.currentStageNumber);
        } catch { /* ignore */ }

        try {
          const clears = await fetchSurvivalStageClears(profile.id);
          setClearedStages(new Set(clears.map((c: SurvivalStageClear) => c.stageNumber)));
        } catch { /* ignore */ }
      }

      const debugProgress = readDebugProgress();
      if (debugProgress != null) {
        const cleared = new Set<number>();
        for (let i = 1; i <= debugProgress; i += 1) cleared.add(i);
        setClearedStages(cleared);
        setCurrentStageNumber(Math.min(TOTAL_STAGES, debugProgress + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedStage = useMemo<StageDefinition | null>(() => {
    if (selectedStageNumber == null) return null;
    return ALL_STAGES.find(s => s.stageNumber === selectedStageNumber) ?? null;
  }, [selectedStageNumber]);

  const isStageUnlocked = useCallback((stageNumber: number): boolean => {
    if (stageNumber === 1) return true;
    return clearedStages.has(stageNumber - 1);
  }, [clearedStages]);

  const getConfig = useCallback((difficulty: SurvivalDifficulty): DifficultyConfig => {
    const live = difficultyConfigs.find(c => c.difficulty === difficulty);
    if (live) return live;
    const fallback = DIFFICULTY_CONFIGS.find(c => c.difficulty === difficulty);
    if (fallback) return fallback;
    return DIFFICULTY_CONFIGS[0];
  }, [difficultyConfigs]);

  const frontierStageNumber = useMemo(() => {
    return Math.max(1, Math.min(TOTAL_STAGES, currentStageNumber));
  }, [currentStageNumber]);

  const accessibleBlockIndex = useMemo(
    () => getAccessibleBlockIndex(frontierStageNumber, clearedStages),
    [frontierStageNumber, clearedStages],
  );

  const { cameraY, focusCamera } = useDescentCamera({
    viewportHeight: viewport.height,
    scale,
    frontierStageNumber,
    clearedStages,
  });

  useEffect(() => {
    if (loading) return;
    const pos = getStagePosition(frontierStageNumber);
    if (pos) focusCamera(pos.y);
  }, [loading, frontierStageNumber, focusCamera]);

  const handleSelectStage = useCallback((stageNumber: number) => {
    setSelectedStageNumber(stageNumber);
    const pos = getStagePosition(stageNumber);
    if (pos) focusCamera(pos.y);
  }, [focusCamera]);

  const handleCloseModal = useCallback(() => {
    setSelectedStageNumber(null);
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedStage) return;
    if (!isStageUnlocked(selectedStage.stageNumber)) return;
    if (playLocked) return;

    if (!isIOSWebView()) {
      try {
        await Promise.race([
          (async () => {
            await FantasySoundManager.unlock();
            await initializeAudioSystem();
          })(),
          new Promise(resolve => platform.setTimeout(resolve, 3000)),
        ]);
      } catch { /* ignore */ }
    }

    const baseConfig = getConfig(selectedStage.difficulty);
    const stageConfig: DifficultyConfig = {
      ...baseConfig,
      allowedChords: selectedStage.allowedChords,
    };

    const faiChar = characters.find(c => isFaiCharacter(c));
    onStageSelect(selectedStage.difficulty, stageConfig, selectedStage, faiChar, hintMode);
  }, [selectedStage, isStageUnlocked, playLocked, getConfig, characters, onStageSelect, hintMode]);

  const progressPercent = Math.round((clearedStages.size / TOTAL_STAGES) * 100);

  const frontierPosition = getStagePosition(frontierStageNumber);
  const frontierBlockLayout = getBlockLayoutForStage(frontierStageNumber);
  const frontierFacing: 'left' | 'right' | 'center' = (() => {
    if (!frontierPosition || !frontierBlockLayout) return 'center';
    const indexInBlock = frontierBlockLayout.stages.findIndex(s => s.stageNumber === frontierStageNumber);
    if (indexInBlock < 0) return 'center';
    const next = frontierBlockLayout.stages[indexInBlock + 1];
    if (!next) return 'center';
    if (next.x > frontierPosition.x) return 'right';
    if (next.x < frontierPosition.x) return 'left';
    return 'center';
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg font-sans">{isEnglishCopy ? 'Loading...' : '読み込み中...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes descent-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes descent-frontier-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      {playLocked && (
        <button
          type="button"
          className="mx-4 mb-3 block w-[calc(100%-2rem)] rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-left text-sm text-amber-100 font-sans hover:bg-amber-950/60 hover:border-amber-500/60 transition-colors"
          onClick={() => setShowPaywall(true)}
        >
          {isEnglishCopy
            ? 'Survival Stage Mode is view-only on the Free plan. Tap to view Premium plans →'
            : 'サバイバル・ステージモードはフリープランでは閲覧のみです。タップしてプレミアムプランを見る →'}
        </button>
      )}

      <div
        ref={viewportRef}
        className="relative mx-auto overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 1160,
          height: 'min(88vh, 960px)',
          borderRadius: 10,
          boxShadow: 'inset 0 0 120px 20px rgba(0,0,0,0.55)',
        }}
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-3 z-[50] -translate-x-1/2 rounded-full border border-amber-400/30 bg-black/50 px-3 py-1 text-[11px] font-sans tracking-wider text-amber-200 backdrop-blur-sm"
        >
          {progressPercent}%
        </div>

        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: worldWidthPx,
            height: mapHeightPx,
            transform: `translate3d(0, ${-cameraY}px, 0)`,
          }}
        >
          <BackgroundWall widthPx={worldWidthPx} heightPx={mapHeightPx} scale={scale} />

          <div
            className="absolute left-1/2 top-0"
            style={{
              width: mapWidthPx,
              height: mapHeightPx,
              transform: 'translateX(-50%)',
            }}
          >
            {ALL_BLOCK_LAYOUTS.map((layout, idx) => {
              const blockMeta = ALL_BLOCKS[idx];
              const dim = idx > accessibleBlockIndex;
              return (
                <DescentBlock
                  key={layout.blockKey}
                  layout={layout}
                  scale={scale}
                  selectedStageNumber={selectedStageNumber ?? -1}
                  clearedStages={clearedStages}
                  isStageUnlocked={isStageUnlocked}
                  onSelectStage={handleSelectStage}
                  dim={dim}
                  blockLabel={blockMeta.label}
                  blockLabelEn={blockMeta.labelEn}
                  isEnglishCopy={isEnglishCopy}
                  isFrontier={layout.stages.some(s => s.stageNumber === frontierStageNumber)}
                  frontierStageNumber={frontierStageNumber}
                />
              );
            })}

            {ALL_BLOCK_LAYOUTS.map((layout, idx) =>
              idx > accessibleBlockIndex ? (
                <BlockDimVeil key={`veil-${layout.blockKey}`} layout={layout} scale={scale} widthPx={mapWidthPx} />
              ) : null,
            )}

            {frontierPosition && (
              <DescentCharacter
                xPx={frontierPosition.x * scale}
                yPx={frontierPosition.y * scale}
                scale={scale}
                facing={frontierFacing}
              />
            )}
          </div>
        </div>
      </div>

      <StageDetailModal
        open={selectedStageNumber !== null}
        stage={selectedStage}
        isUnlocked={selectedStage ? isStageUnlocked(selectedStage.stageNumber) : false}
        isCleared={selectedStage ? clearedStages.has(selectedStage.stageNumber) : false}
        hintMode={hintMode}
        onHintModeChange={setHintMode}
        playLocked={playLocked}
        onStart={handleStart}
        onClose={handleCloseModal}
        onRequestUpgrade={() => {
          setSelectedStageNumber(null);
          setShowPaywall(true);
        }}
        isEnglishCopy={isEnglishCopy}
      />

      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglishCopy} />
    </div>
  );
};

export default SurvivalDescentMap;
