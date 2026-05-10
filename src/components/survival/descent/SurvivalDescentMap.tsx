/**
 * 魔王城降下マップ：サバイバルのステージ選択画面
 * - PC / iPad (>=768px): 左マップ + 右情報パネル (grid 2カラム)
 * - iPhone / モバイル (<768px): マップ全面表示、ステージタップで詳細モーダル
 * - 仮想カメラ: ホイール/タッチ/ドラッグで縦スクロール
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaMap, FaMusic, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { platform, getWindow } from '@/platform';
import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  fetchSurvivalBgmSettings,
  fetchSurvivalDifficultySettings,
  fetchSurvivalCharacters,
  fetchSurvivalStageProgress,
  fetchSurvivalStageClears,
  resolveSurvivalBgmUrl,
  SurvivalBgmSettingsMap,
  SurvivalCharacterRow,
  toSurvivalBgmSettingsMap,
} from '@/platform/supabaseSurvival';
import { DIFFICULTY_CONFIGS } from '../SurvivalStageSelect';
import {
  StageDefinition,
  fetchAllStages,
  getStagesByCategory,
  getTotalStagesByCategory,
} from '../SurvivalStageDefinitions';
import {
  SurvivalDifficulty,
  DifficultyConfig,
  SurvivalCharacter,
  SurvivalMapCategory,
  DEFAULT_SURVIVAL_MAP_CATEGORY,
} from '../SurvivalTypes';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';
import { isIOSWebView } from '@/utils/iosbridge';
import { SurvivalMapAudio, SURVIVAL_MAP_BGM_URL } from '@/utils/SurvivalMapAudio';
import { useGameStore } from '@/stores/gameStore';
import {
  MAP_LOGICAL_WIDTH,
  getStagePosition,
  getBlockLayoutForStage,
  getBlockLayoutsByCategory,
  getMapLogicalHeightByCategory,
  rebuildDescentLayouts,
} from './descentLayout';
import {
  getAccessibleBlockIndex,
  getBlockForStage,
  getBlocksByCategory,
  getFreeTierStageNumbers,
  BlockMeta,
  rebuildDescentBlocks,
} from './descentBlocks';
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
  /**
   * true のときフリープラン扱い: 閲覧は全ステージ可能だが、プレイは当該マップの第一ブロックのみ
   *（Basic / Songs それぞれで `getFreeTierStageNumbers` と同じ集合）。
   */
  freeTierAccessOnly?: boolean;
  /** 初期表示マップ。省略時は 'basic' */
  initialMapCategory?: SurvivalMapCategory;
}

const VIEWPORT_FALLBACK_HEIGHT = 720;

const DESCENT_MAP_IMAGES = [
  '/background.webp?v=20260420b',
  '/big_odoriba.webp?v=20260420b',
  '/odoriba.webp?v=20260420b',
  '/door.webp?v=20260420b',
];

interface SurvivalMapProgressSnapshot {
  currentStageNumber: number;
  clearedStages: Set<number>;
  /** stageNumber -> DB clear_count（行が無いステージは未設定） */
  stageClearCounts: Map<number, number>;
}

interface SurvivalMapStaticData {
  configs: DifficultyConfig[];
  characters: SurvivalCharacter[];
  bgmSettings: SurvivalBgmSettingsMap;
}

let descentImagesPreloadPromise: Promise<void> | null = null;
let survivalMapStaticDataPromise: Promise<SurvivalMapStaticData> | null = null;

const preloadDescentImages = (): Promise<void> => {
  if (descentImagesPreloadPromise) return descentImagesPreloadPromise;

  descentImagesPreloadPromise = new Promise(resolve => {
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

  return descentImagesPreloadPromise;
};

const loadSurvivalMapStaticData = async (): Promise<SurvivalMapStaticData> => {
  if (survivalMapStaticDataPromise) return survivalMapStaticDataPromise;

  survivalMapStaticDataPromise = (async () => {
    const imagesPreload = preloadDescentImages();

    try {
      await fetchAllStages();
      rebuildDescentBlocks();
      rebuildDescentLayouts();
    } catch {
      /* fallback handled inside fetchAllStages */
    }

    const [settingsData, charRows, bgmRows] = await Promise.all([
      fetchSurvivalDifficultySettings().catch(() => []),
      fetchSurvivalCharacters().catch(() => []),
      fetchSurvivalBgmSettings().catch(() => []),
    ]);
    const bgmSettings = toSurvivalBgmSettingsMap(bgmRows);

    await Promise.race([
      imagesPreload,
      new Promise<void>(resolve => platform.setTimeout(resolve, 2500)),
    ]);

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
      bgmUrl: null,
    }));

    return {
      configs,
      characters: charRows.map(convertToSurvivalCharacter),
      bgmSettings,
    };
  })();

  return survivalMapStaticDataPromise;
};

const createDefaultProgressSnapshot = (): SurvivalMapProgressSnapshot => ({
  currentStageNumber: 1,
  clearedStages: new Set<number>(),
  stageClearCounts: new Map<number, number>(),
});

const readDebugProgress = (): number | null => {
  try {
    const hash = getWindow().location.hash;
    const idx = hash.indexOf('?');
    if (idx < 0) return null;
    const params = new URLSearchParams(hash.slice(idx + 1));
    const raw = params.get('debugProgress');
    if (!raw) return null;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
};

interface MapCategoryToggleProps {
  value: SurvivalMapCategory;
  onChange: (next: SurvivalMapCategory) => void;
  isEnglishCopy: boolean;
  /** モバイル用の大型表示 */
  compact?: boolean;
}

const MapCategoryToggle: React.FC<MapCategoryToggleProps> = ({ value, onChange, isEnglishCopy, compact = false }) => {
  const options: Array<{
    key: SurvivalMapCategory;
    label: string;
    subLabel: string;
    Icon: IconType;
  }> = [
    {
      key: 'basic',
      label: 'Basic',
      subLabel: isEnglishCopy ? 'Core' : '基礎',
      Icon: FaMap,
    },
    {
      key: 'songs',
      label: 'Songs',
      subLabel: isEnglishCopy ? 'Tunes' : '楽曲',
      Icon: FaMusic,
    },
  ];
  const groupClass = compact
    ? 'flex w-full max-w-[360px] items-center gap-1.5 rounded-[24px] border border-amber-400/55 bg-black/70 p-1.5 backdrop-blur-md'
    : 'inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-black/60 p-1 backdrop-blur-sm';
  const sizeClass = compact
    ? 'min-h-[50px] flex-1 px-3 py-2 text-sm'
    : 'min-h-[44px] px-4 py-2 text-sm sm:px-5 sm:py-2.5';
  return (
    <div
      role="group"
      aria-label={isEnglishCopy ? 'Map category' : 'マップ種別'}
      className={groupClass}
      style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.55)' }}
    >
      {options.map(opt => {
        const active = opt.key === value;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-pressed={active}
            className={`flex items-center justify-center gap-2 rounded-[20px] font-semibold transition-colors active:scale-[0.98] ${sizeClass} ${
              active
                ? 'bg-amber-400 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_18px_rgba(245,158,11,0.28)]'
                : 'text-amber-100 hover:bg-amber-500/15'
            }`}
          >
            <Icon aria-hidden className={compact ? 'text-base' : 'text-sm'} />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[1em] tracking-wide">{opt.label}</span>
              <span className={`text-[10px] font-bold tracking-normal ${active ? 'text-black/65' : 'text-amber-200/70'}`}>
                {opt.subLabel}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

const SurvivalDescentMap: React.FC<SurvivalDescentMapProps> = ({
  onStageSelect,
  freeTierAccessOnly = false,
  initialMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
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
  const [staticDataReady, setStaticDataReady] = useState(false);
  const [characters, setCharacters] = useState<SurvivalCharacter[]>([]);
  const [difficultyConfigs, setDifficultyConfigs] = useState<DifficultyConfig[]>(DIFFICULTY_CONFIGS);
  const [bgmSettings, setBgmSettings] = useState<SurvivalBgmSettingsMap>(DEFAULT_SURVIVAL_BGM_SETTINGS);
  const [mapCategory, setMapCategory] = useState<SurvivalMapCategory>(initialMapCategory);
  // `fetchAllStages()` + `rebuildDescentBlocks()` + `rebuildDescentLayouts()` 完了で
  // カテゴリ別キャッシュ (STAGES_BY_CATEGORY 等) が後追いで更新されるため、
  // 完了後にこの値を increment して下記 useMemo を強制再評価する。
  // これが無いと初回ロード時に 'basic' のステージ/ブロック/レイアウトが空のままメモ化され、
  // マップが描画されず TOTAL PROGRESS の分母が 0 (=Math.max(1,0)) で 1700% 等になる。
  const [stagesVersion, setStagesVersion] = useState(0);
  const [clearedStages, setClearedStages] = useState<Set<number>>(new Set());
  const [stageClearCounts, setStageClearCounts] = useState<Map<number, number>>(() => new Map());
  const [selectedStageNumber, setSelectedStageNumber] = useState<number | null>(null);
  const [hintMode, setHintMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() => {
    return !getWindow().matchMedia('(min-width: 768px)').matches;
  });
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => SurvivalMapAudio.isMuted());
  const progressCacheRef = useRef<Partial<Record<SurvivalMapCategory, SurvivalMapProgressSnapshot>>>({});
  const progressRequestIdRef = useRef(0);
  const didLoadInitialProgressRef = useRef(false);
  const lastProfileIdRef = useRef<string | null>(profile?.id ?? null);

  const handleToggleSound = useCallback(() => {
    const next = SurvivalMapAudio.toggleMuted();
    setSoundMuted(next);
    if (!next) {
      void SurvivalMapAudio.unlock().catch(() => { /* ignore */ });
      void SurvivalMapAudio.playBgm(SURVIVAL_MAP_BGM_URL).catch(() => { /* ignore */ });
    }
  }, []);

  const handleSelectMapCategory = useCallback((next: SurvivalMapCategory) => {
    setMapCategory(prev => {
      if (prev === next) return prev;
      setSelectedStageNumber(null);
      setIsMobileDetailOpen(false);
      return next;
    });
  }, []);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: MAP_LOGICAL_WIDTH, height: VIEWPORT_FALLBACK_HEIGHT });

  useEffect(() => {
    const mq = getWindow().matchMedia('(min-width: 768px)');
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
  const stagesForCategory = useMemo(() => getStagesByCategory(mapCategory), [mapCategory, stagesVersion]);
  const totalStagesForCategory = useMemo(() => getTotalStagesByCategory(mapCategory), [mapCategory, stagesVersion]);
  const blockLayoutsForCategory = useMemo(() => getBlockLayoutsByCategory(mapCategory), [mapCategory, stagesVersion]);
  const blocksForCategory = useMemo(() => getBlocksByCategory(mapCategory), [mapCategory, stagesVersion]);
  const freeTierStageNumberSet = useMemo(
    () => new Set(getFreeTierStageNumbers(mapCategory)),
    [mapCategory, stagesVersion],
  );
  const mapHeightLogical = useMemo(() => getMapLogicalHeightByCategory(mapCategory), [mapCategory, stagesVersion]);
  const mapHeightPx = mapHeightLogical * scale;
  const worldWidthPx = Math.max(mapWidthPx, viewport.width);

  const applyProgressSnapshot = useCallback((snapshot: SurvivalMapProgressSnapshot) => {
    setClearedStages(new Set(snapshot.clearedStages));
    setStageClearCounts(new Map(snapshot.stageClearCounts));
  }, []);

  useEffect(() => {
    const profileId = profile?.id ?? null;
    if (lastProfileIdRef.current === profileId) return;
    lastProfileIdRef.current = profileId;
    progressCacheRef.current = {};
    didLoadInitialProgressRef.current = false;
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadStaticData = async (): Promise<void> => {
      const data = await loadSurvivalMapStaticData();
      if (cancelled) return;
      if (data.configs.length > 0) {
        setDifficultyConfigs(data.configs);
      }
      if (data.characters.length > 0) {
        setCharacters(data.characters);
      }
      setBgmSettings(data.bgmSettings);
      // fetchAllStages + rebuild 完了後にカテゴリ別キャッシュを再参照させる。
      setStagesVersion(v => v + 1);
      setStaticDataReady(true);
    };

    void loadStaticData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!staticDataReady) return;

    let cancelled = false;
    const profileId = profile?.id ?? null;
    const requestId = progressRequestIdRef.current + 1;
    progressRequestIdRef.current = requestId;
    const shouldBlockInitialLoad = !didLoadInitialProgressRef.current;
    if (shouldBlockInitialLoad) {
      setLoading(true);
    }

    const cached = progressCacheRef.current[mapCategory];
    if (cached) {
      applyProgressSnapshot(cached);
    } else if (!profileId) {
      applyProgressSnapshot(createDefaultProgressSnapshot());
    }

    const loadProgress = async (): Promise<void> => {
      let snapshot = createDefaultProgressSnapshot();

      if (profileId) {
        const [progress, clears] = await Promise.all([
          fetchSurvivalStageProgress(profileId, mapCategory).catch(() => null),
          fetchSurvivalStageClears(profileId, mapCategory).catch(() => []),
        ]);
        const stageClearCountsNext = new Map<number, number>();
        clears.forEach(c => {
          stageClearCountsNext.set(c.stageNumber, c.clearCount);
        });
        snapshot = {
          currentStageNumber: progress?.currentStageNumber ?? 1,
          clearedStages: new Set(clears.map(c => c.stageNumber)),
          stageClearCounts: stageClearCountsNext,
        };
      }

      const debugProgress = readDebugProgress();
      if (debugProgress != null) {
        const cleared = new Set<number>();
        const counts = new Map<number, number>();
        for (let i = 1; i <= debugProgress; i += 1) {
          cleared.add(i);
          counts.set(i, 1);
        }
        const totalForDebug = getTotalStagesByCategory(mapCategory);
        snapshot = {
          currentStageNumber: Math.min(totalForDebug, debugProgress + 1),
          clearedStages: cleared,
          stageClearCounts: counts,
        };
      }

      progressCacheRef.current[mapCategory] = {
        currentStageNumber: snapshot.currentStageNumber,
        clearedStages: new Set(snapshot.clearedStages),
        stageClearCounts: new Map(snapshot.stageClearCounts),
      };
      if (cancelled || progressRequestIdRef.current !== requestId) return;
      applyProgressSnapshot(snapshot);
      didLoadInitialProgressRef.current = true;
      setLoading(false);
    };

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, [applyProgressSnapshot, mapCategory, profile?.id, staticDataReady]);

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
    return stagesForCategory.find(s => s.stageNumber === selectedStageNumber) ?? null;
  }, [selectedStageNumber, stagesForCategory]);

  const selectedStageClearCount = useMemo(() => {
    if (selectedStageNumber == null) return 0;
    return stageClearCounts.get(selectedStageNumber) ?? 0;
  }, [selectedStageNumber, stageClearCounts]);

  const selectedStagePlayPaywalled = Boolean(
    freeTierAccessOnly
    && selectedStage
    && !freeTierStageNumberSet.has(selectedStage.stageNumber),
  );

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
    const max = Math.max(1, totalStagesForCategory);
    for (let n = 1; n <= max; n += 1) {
      const unlocked = n === 1 || clearedStages.has(n - 1);
      if (unlocked && !clearedStages.has(n)) return n;
    }
    return max;
  }, [clearedStages, totalStagesForCategory]);

  const accessibleBlockIndex = useMemo(
    () => getAccessibleBlockIndex(frontierStageNumber, clearedStages, mapCategory),
    [frontierStageNumber, clearedStages, mapCategory, stagesVersion],
  );

  const frontierBlockIndex = useMemo(() => {
    const block = getBlockForStage(frontierStageNumber, mapCategory);
    return block ? block.blockIndex : 0;
  }, [frontierStageNumber, mapCategory, stagesVersion]);

  const { cameraY, focusCamera, adjustCamera } = useDescentCamera({
    viewportHeight: viewport.height,
    scale,
    frontierStageNumber,
    clearedStages,
    mapCategory,
  });

  const visibleBlockLayoutsForCategory = useMemo(() => {
    if (blockLayoutsForCategory.length === 0) return blockLayoutsForCategory;
    const bufferLogical = Math.max(420, viewport.height / Math.max(scale, 0.1));
    const minY = Math.max(0, cameraY / scale - bufferLogical);
    const maxY = (cameraY + viewport.height) / scale + bufferLogical;
    return blockLayoutsForCategory.filter(layout => layout.endY >= minY && layout.startY <= maxY);
  }, [blockLayoutsForCategory, cameraY, scale, viewport.height]);

  useEffect(() => {
    if (loading) return;
    const pos = getStagePosition(frontierStageNumber, mapCategory);
    if (pos) focusCamera(pos.y, true);
  }, [loading, frontierStageNumber, focusCamera, mapCategory]);

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
    setSelectedStageNumber(stageNumber);
    const pos = getStagePosition(stageNumber, mapCategory);
    if (pos) focusCamera(pos.y, true);
    if (isMobileLayout) {
      setIsMobileDetailOpen(true);
    }
  }, [focusCamera, isMobileLayout, mapCategory]);

  const handleCloseMobileDetail = useCallback(() => {
    setIsMobileDetailOpen(false);
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedStage) return;
    if (!isStageUnlocked(selectedStage.stageNumber)) return;
    if (freeTierAccessOnly && !freeTierStageNumberSet.has(selectedStage.stageNumber)) {
      setShowPaywall(true);
      return;
    }

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
      bgmUrl: resolveSurvivalBgmUrl(selectedStage.stageType, bgmSettings),
    };

    const faiChar = characters.find(c => isFaiCharacter(c));
    setIsMobileDetailOpen(false);
    onStageSelect(selectedStage.difficulty, stageConfig, selectedStage, faiChar, hintMode);
  }, [
    selectedStage,
    isStageUnlocked,
    freeTierAccessOnly,
    freeTierStageNumberSet,
    getConfig,
    bgmSettings,
    characters,
    onStageSelect,
    hintMode,
  ]);

  const frontierPosition = getStagePosition(frontierStageNumber, mapCategory);
  const frontierBlockLayout = getBlockLayoutForStage(frontierStageNumber, mapCategory);
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
    return getBlockForStage(refStage, mapCategory) ?? blocksForCategory[0] ?? null;
  }, [selectedStage, frontierStageNumber, mapCategory, blocksForCategory, stagesVersion]);

  const panelBlockClearedCount = useMemo(() => {
    if (!panelBlock) return 0;
    return panelBlock.stageNumbers.filter(n => clearedStages.has(n)).length;
  }, [panelBlock, clearedStages]);

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

      {freeTierAccessOnly && (
        <button
          type="button"
          className="mx-auto mb-3 block w-full max-w-[1280px] rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-left text-sm text-amber-100 font-sans hover:bg-amber-950/60 hover:border-amber-500/60 transition-colors"
          onClick={() => setShowPaywall(true)}
        >
          {isEnglishCopy
            ? 'Free plan: play the first tier (first block) on Basic & Songs maps. Tap for Premium →'
            : 'フリープランは Basic / Songs それぞれで第一階層（最初のブロック）までプレイ可能です。タップしてプレミアムプランを見る →'}
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
            <BackgroundWall
              widthPx={worldWidthPx}
              heightPx={mapHeightPx}
              scale={scale}
              layouts={visibleBlockLayoutsForCategory}
            />

            <div
              className="absolute left-1/2 top-0"
              style={{
                width: mapWidthPx,
                height: mapHeightPx,
                transform: 'translateX(-50%)',
              }}
            >
              {visibleBlockLayoutsForCategory.map(layout => {
                const blockMeta = blocksForCategory[layout.blockIndex];
                if (!blockMeta) return null;
                const dim = layout.blockIndex > accessibleBlockIndex;
                const isFrontierBlock = layout.blockIndex === frontierBlockIndex;
                return (
                  <DescentBlock
                    key={`${mapCategory}-${layout.blockKey}`}
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
                    mapCategory={mapCategory}
                  />
                );
              })}

              {visibleBlockLayoutsForCategory.map(layout =>
                layout.blockIndex > accessibleBlockIndex ? (
                  <BlockDimVeil key={`veil-${mapCategory}-${layout.blockKey}`} layout={layout} scale={scale} widthPx={mapWidthPx} />
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

          <div className="absolute bottom-4 right-4 z-30 hidden items-center gap-2 sm:flex">
            <MapCategoryToggle
              value={mapCategory}
              onChange={handleSelectMapCategory}
              isEnglishCopy={isEnglishCopy}
            />
            <button
              type="button"
              onClick={handleToggleSound}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label={soundMuted
                ? (isEnglishCopy ? 'Unmute map sound' : 'マップのサウンドをオンにする')
                : (isEnglishCopy ? 'Mute map sound' : 'マップのサウンドをオフにする')}
              aria-pressed={!soundMuted}
              className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/55 px-4 py-2.5 text-sm font-semibold text-amber-100 backdrop-blur-sm transition-colors hover:bg-black/75 hover:border-amber-400/70 active:scale-95"
              style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.55)' }}
            >
              {soundMuted ? (
                <FaVolumeMute aria-hidden className="text-lg" />
              ) : (
                <FaVolumeUp aria-hidden className="text-lg" />
              )}
              <span className="tracking-wide">
                {soundMuted
                  ? (isEnglishCopy ? 'Sound OFF' : 'サウンド OFF')
                  : (isEnglishCopy ? 'Sound ON' : 'サウンド ON')}
              </span>
            </button>
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
            className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-100 backdrop-blur-sm transition-colors hover:bg-black/75 hover:border-amber-400/70 active:scale-95 sm:hidden"
            style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.55)' }}
          >
            {soundMuted ? (
              <FaVolumeMute aria-hidden className="text-base" />
            ) : (
              <FaVolumeUp aria-hidden className="text-base" />
            )}
            <span className="tracking-wide">
              {soundMuted
                ? (isEnglishCopy ? 'Sound OFF' : 'サウンド OFF')
                : (isEnglishCopy ? 'Sound ON' : 'サウンド ON')}
            </span>
          </button>

          <div
            className="pointer-events-none absolute left-3 right-3 z-30 flex justify-center sm:hidden"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-auto">
              <MapCategoryToggle
                value={mapCategory}
                onChange={handleSelectMapCategory}
                isEnglishCopy={isEnglishCopy}
                compact
              />
            </div>
          </div>
        </div>

        <div className="hidden md:block md:h-[min(88vh,960px)]">
          <DescentSidePanel
            isEnglishCopy={isEnglishCopy}
            totalClearedCount={clearedStages.size}
            totalStages={totalStagesForCategory}
            activeBlock={panelBlock}
            blockClearedCount={panelBlockClearedCount}
            selectedStage={selectedStage}
            selectedStageClearCount={selectedStageClearCount}
            selectedStageIsUnlocked={selectedStage ? isStageUnlocked(selectedStage.stageNumber) : false}
            selectedStageIsCleared={selectedStage ? clearedStages.has(selectedStage.stageNumber) : false}
            hintMode={hintMode}
            onHintModeChange={setHintMode}
            playLocked={selectedStagePlayPaywalled}
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
                totalStages={totalStagesForCategory}
                activeBlock={panelBlock}
                blockClearedCount={panelBlockClearedCount}
                selectedStage={selectedStage}
                selectedStageClearCount={selectedStageClearCount}
                selectedStageIsUnlocked={selectedStage ? isStageUnlocked(selectedStage.stageNumber) : false}
                selectedStageIsCleared={selectedStage ? clearedStages.has(selectedStage.stageNumber) : false}
                hintMode={hintMode}
                onHintModeChange={setHintMode}
                playLocked={selectedStagePlayPaywalled}
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
