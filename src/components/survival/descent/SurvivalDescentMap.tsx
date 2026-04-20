/**
 * 魔王城降下マップ：サバイバルのステージ選択画面
 * - PC / iPad (>=768px): 左マップ + 右情報パネル (grid 2カラム)
 * - iPhone / モバイル (<768px): マップ全面表示、ステージタップで詳細モーダル
 * - 仮想カメラ: ホイール/タッチ/ドラッグで縦スクロール
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { platform, getWindow } from '@/platform';
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
import { SurvivalMapAudio, SURVIVAL_MAP_BGM_URL } from '@/utils/SurvivalMapAudio';
import { useGameStore } from '@/stores/gameStore';
import {
  ALL_BLOCK_LAYOUTS,
  MAP_LOGICAL_HEIGHT,
  MAP_LOGICAL_WIDTH,
  getStagePosition,
  getBlockLayoutForStage,
} from './descentLayout';
import { ALL_BLOCKS, getAccessibleBlockIndex, getBlockForStage, BlockMeta } from './descentBlocks';
import DescentBlock, { BlockDimVeil } from './DescentBlock';
import BackgroundWall from './parts/BackgroundWall';
import DescentCharacter from './parts/DescentCharacter';
import DescentSidePanel from './DescentSidePanel';
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

const DESCENT_MAP_IMAGES = [
  '/background.webp?v=20260420b',
  '/big_odoriba.webp?v=20260420b',
  '/odoriba.webp?v=20260420b',
  '/door.webp?v=20260420b',
];

const preloadDescentImages = (): Promise<void> => {
  return new Promise(resolve => {
    let remaining = DESCENT_MAP_IMAGES.length;
    if (remaining === 0) {
      resolve();
      return;
    }
    const done = (): void => {
      remaining -= 1;
      if (remaining === 0) resolve();
    };
    DESCENT_MAP_IMAGES.forEach(src => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
  });
};

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
  const soundEffectVolume = useGameStore(state => state.settings.soundEffectVolume);
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
  const [stageClearsByStage, setStageClearsByStage] = useState<Map<number, SurvivalStageClear>>(new Map());
  const [selectedStageNumber, setSelectedStageNumber] = useState<number | null>(null);
  const [hintMode, setHintMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(min-width: 768px)').matches;
  });
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => SurvivalMapAudio.isMuted());

  const handleToggleSound = useCallback(() => {
    const next = SurvivalMapAudio.toggleMuted();
    setSoundMuted(next);
    if (!next) {
      void SurvivalMapAudio.unlock().catch(() => { /* ignore */ });
      void SurvivalMapAudio.playBgm(SURVIVAL_MAP_BGM_URL).catch(() => { /* ignore */ });
    }
  }, []);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: MAP_LOGICAL_WIDTH, height: VIEWPORT_FALLBACK_HEIGHT });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsMobileLayout(!mq.matches);
    update();
    try {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    } catch {
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, []);

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

  const scale = Math.min(viewport.width / MAP_LOGICAL_WIDTH, 2.2);
  const mapWidthPx = MAP_LOGICAL_WIDTH * scale;
  const mapHeightPx = MAP_LOGICAL_HEIGHT * scale;
  const worldWidthPx = Math.max(mapWidthPx, viewport.width);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const imagesPreload = preloadDescentImages();
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
          setClearedStages(new Set(clears.map(c => c.stageNumber)));
          const map = new Map<number, SurvivalStageClear>();
          clears.forEach(c => map.set(c.stageNumber, c));
          setStageClearsByStage(map);
        } catch { /* ignore */ }
      }

      const debugProgress = readDebugProgress();
      if (debugProgress != null) {
        const cleared = new Set<number>();
        for (let i = 1; i <= debugProgress; i += 1) cleared.add(i);
        setClearedStages(cleared);
        setCurrentStageNumber(Math.min(TOTAL_STAGES, debugProgress + 1));
      }

      await Promise.race([
        imagesPreload,
        new Promise<void>(resolve => platform.setTimeout(resolve, 2500)),
      ]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (typeof soundEffectVolume === 'number') {
      SurvivalMapAudio.setSeVolume(soundEffectVolume);
    }
  }, [soundEffectVolume]);

  useEffect(() => {
    if (!SurvivalMapAudio.isMuted()) {
      void SurvivalMapAudio.playBgm(SURVIVAL_MAP_BGM_URL).catch(() => { /* autoplay 失敗は握りつぶし、次のユーザー操作で解放される */ });
    }
    return () => {
      void SurvivalMapAudio.stopBgm();
    };
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const unlock = (): void => {
      void SurvivalMapAudio.unlock().catch(() => { /* ignore */ });
    };
    const onceOpts: AddEventListenerOptions = { once: true };
    el.addEventListener('pointerdown', unlock, onceOpts);
    el.addEventListener('touchstart', unlock, onceOpts);
    getWindow().addEventListener?.('keydown', unlock, onceOpts);
    return () => {
      try { el.removeEventListener('pointerdown', unlock); } catch { /* ignore */ }
      try { el.removeEventListener('touchstart', unlock); } catch { /* ignore */ }
      try { getWindow().removeEventListener?.('keydown', unlock); } catch { /* ignore */ }
    };
  }, []);

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

  const frontierBlockIndex = useMemo(() => {
    const block = getBlockForStage(frontierStageNumber);
    return block ? block.blockIndex : 0;
  }, [frontierStageNumber]);

  const { cameraY, focusCamera, adjustCamera } = useDescentCamera({
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

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let dragging = false;
    let lastClientY = 0;
    let downClientY = 0;
    let movedDuringDrag = false;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      adjustCamera(e.deltaY);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button,[role="button"]')) return;
      dragging = true;
      movedDuringDrag = false;
      lastClientY = e.clientY;
      downClientY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - lastClientY;
      lastClientY = e.clientY;
      if (Math.abs(e.clientY - downClientY) > 4) {
        movedDuringDrag = true;
      }
      adjustCamera(-dy);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      if (movedDuringDrag) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [adjustCamera, loading]);

  const handleSelectStage = useCallback((stageNumber: number) => {
    SurvivalMapAudio.playSe('stage_click');
    setSelectedStageNumber(stageNumber);
    const pos = getStagePosition(stageNumber);
    if (pos) focusCamera(pos.y);
    if (isMobileLayout) {
      setIsMobileDetailOpen(true);
    }
  }, [focusCamera, isMobileLayout]);

  const handleCloseMobileDetail = useCallback(() => {
    setIsMobileDetailOpen(false);
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

    void SurvivalMapAudio.stopBgm();

    const baseConfig = getConfig(selectedStage.difficulty);
    const stageConfig: DifficultyConfig = {
      ...baseConfig,
      allowedChords: selectedStage.allowedChords,
    };

    const faiChar = characters.find(c => isFaiCharacter(c));
    setIsMobileDetailOpen(false);
    onStageSelect(selectedStage.difficulty, stageConfig, selectedStage, faiChar, hintMode);
  }, [selectedStage, isStageUnlocked, playLocked, getConfig, characters, onStageSelect, hintMode]);

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

  const panelBlock: BlockMeta | null = useMemo(() => {
    const refStage = selectedStage?.stageNumber ?? frontierStageNumber;
    return getBlockForStage(refStage) ?? ALL_BLOCKS[0];
  }, [selectedStage, frontierStageNumber]);

  const panelBlockClearedCount = useMemo(() => {
    if (!panelBlock) return 0;
    return panelBlock.stageNumbers.filter(n => clearedStages.has(n)).length;
  }, [panelBlock, clearedStages]);

  const selectedStageClear = useMemo<SurvivalStageClear | null>(() => {
    if (!selectedStage) return null;
    return stageClearsByStage.get(selectedStage.stageNumber) ?? null;
  }, [selectedStage, stageClearsByStage]);

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
    <div className="relative w-full px-0 sm:px-2">
      <style>{`
        @keyframes descent-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes descent-frontier-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes descent-seal-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes descent-lantern-flicker {
          0%, 100% { transform: translateX(-50%) scaleY(1) scaleX(1); opacity: 0.95; }
          25% { transform: translateX(-50%) scaleY(1.08) scaleX(0.96); opacity: 0.85; }
          50% { transform: translateX(-50%) scaleY(0.94) scaleX(1.04); opacity: 1; }
          75% { transform: translateX(-50%) scaleY(1.05) scaleX(0.98); opacity: 0.9; }
        }
        @keyframes descent-lantern-glow {
          0%, 100% { opacity: 0.65; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.18); }
        }
        @keyframes descent-ember-float {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          50% { transform: translate(6px, -40px); opacity: 0.7; }
          85% { opacity: 0.4; }
          100% { transform: translate(-4px, -80px); opacity: 0; }
        }
      `}</style>

      {playLocked && (
        <button
          type="button"
          className="mx-auto mb-3 block w-full max-w-[1280px] rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-left text-sm text-amber-100 font-sans hover:bg-amber-950/60 hover:border-amber-500/60 transition-colors"
          onClick={() => setShowPaywall(true)}
        >
          {isEnglishCopy
            ? 'Survival Stage Mode is view-only on the Free plan. Tap to view Premium plans →'
            : 'サバイバル・ステージモードはフリープランでは閲覧のみです。タップしてプレミアムプランを見る →'}
        </button>
      )}

      <div className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
        <div
          ref={viewportRef}
          className="relative overflow-hidden touch-none select-none"
          style={{
            width: '100%',
            height: isMobileLayout ? 'min(88vh, 100%)' : 'min(88vh, 960px)',
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            borderTopRightRadius: isMobileLayout ? 10 : 0,
            borderBottomRightRadius: isMobileLayout ? 10 : 0,
            boxShadow: 'inset 0 0 120px 20px rgba(0,0,0,0.6)',
            cursor: 'grab',
          }}
        >
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
                const isFrontierBlock = idx === frontierBlockIndex;
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
                    frontierStageNumber={frontierStageNumber}
                    mapWidthPx={mapWidthPx}
                    isFrontierBlock={isFrontierBlock}
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

          <button
            type="button"
            onClick={handleToggleSound}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label={soundMuted
              ? (isEnglishCopy ? 'Unmute map sound' : 'マップのサウンドをオンにする')
              : (isEnglishCopy ? 'Mute map sound' : 'マップのサウンドをオフにする')}
            aria-pressed={!soundMuted}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-100 backdrop-blur-sm transition-colors hover:bg-black/75 hover:border-amber-400/70 active:scale-95 sm:bottom-4 sm:right-4 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.55)' }}
          >
            {soundMuted ? (
              <FaVolumeMute aria-hidden className="text-base sm:text-lg" />
            ) : (
              <FaVolumeUp aria-hidden className="text-base sm:text-lg" />
            )}
            <span className="tracking-wide">
              {soundMuted
                ? (isEnglishCopy ? 'Sound OFF' : 'サウンド OFF')
                : (isEnglishCopy ? 'Sound ON' : 'サウンド ON')}
            </span>
          </button>
        </div>

        <div className="hidden md:block md:h-[min(88vh,960px)]">
          <DescentSidePanel
            isEnglishCopy={isEnglishCopy}
            totalClearedCount={clearedStages.size}
            totalStages={TOTAL_STAGES}
            activeBlock={panelBlock}
            blockClearedCount={panelBlockClearedCount}
            selectedStage={selectedStage}
            selectedStageIsUnlocked={selectedStage ? isStageUnlocked(selectedStage.stageNumber) : false}
            selectedStageIsCleared={selectedStage ? clearedStages.has(selectedStage.stageNumber) : false}
            selectedStageClear={selectedStageClear}
            hintMode={hintMode}
            onHintModeChange={setHintMode}
            playLocked={playLocked}
            onStart={handleStart}
            onRequestUpgrade={() => setShowPaywall(true)}
          />
        </div>
      </div>

      {isMobileLayout && isMobileDetailOpen && selectedStage && (
        <div className="fixed inset-0 z-40 flex items-end md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Close stage detail' : 'ステージ詳細を閉じる'}
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseMobileDetail}
          />
          <div
            className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-amber-500/30 bg-gradient-to-b from-[#140c1f]/95 to-[#060410]/95 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            <button
              type="button"
              onClick={handleCloseMobileDetail}
              aria-label={isEnglishCopy ? 'Close' : '閉じる'}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/40 px-2 py-1 text-xs text-gray-200 hover:bg-black/60"
            >
              ✕
            </button>
            <div className="flex-1 overflow-y-auto px-3 pb-5 pt-1">
              <DescentSidePanel
                isEnglishCopy={isEnglishCopy}
                totalClearedCount={clearedStages.size}
                totalStages={TOTAL_STAGES}
                activeBlock={panelBlock}
                blockClearedCount={panelBlockClearedCount}
                selectedStage={selectedStage}
                selectedStageIsUnlocked={selectedStage ? isStageUnlocked(selectedStage.stageNumber) : false}
                selectedStageIsCleared={selectedStage ? clearedStages.has(selectedStage.stageNumber) : false}
                selectedStageClear={selectedStageClear}
                hintMode={hintMode}
                onHintModeChange={setHintMode}
                playLocked={playLocked}
                onStart={handleStart}
                onRequestUpgrade={() => setShowPaywall(true)}
              />
            </div>
          </div>
        </div>
      )}

      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglishCopy} />
    </div>
  );
};

export default SurvivalDescentMap;
