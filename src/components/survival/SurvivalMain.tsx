/**
 * サバイバルモード メインコンポーネント
 * モード選択 → フリープレイ or ステージモード → ゲーム画面
 * lessonMode: レッスン課題からの起動（URLパラメータからコード/コンテキスト読み取り）
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import { DebugSettings, DIFFICULTY_CONFIGS } from './SurvivalStageSelect';
import SurvivalDescentMap from './descent/SurvivalDescentMap';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';
import SurvivalGameScreen from './SurvivalGameScreen';
import {
  StageDefinition,
  ALL_STAGES,
  fetchAllStages,
  findStageForLesson,
  getStagesByCategory,
  getTotalStagesByCategory,
  resolveLessonSurvivalMapCategory,
  getSurvivalStageBattleKind,
  isBlockLastStage,
} from './SurvivalStageDefinitions';
import { fetchLessonSongById } from '@/platform/supabaseLessons';
import {
  buildLessonCompositeStageDefinition,
  buildSurvivalPhrasesFromLessonCompositeConfig,
  lessonSongHasInlineComposite,
  resolveSurvivalLessonRuntime,
  type ResolvedSurvivalLessonRuntime,
} from '@/utils/survivalLessonConfig';
import {
  applyLessonRandomChords,
  parseSurvivalLessonRandomChords,
} from '@/utils/survivalLessonRandomChords';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { ProductionHintMode } from '@/types';
import type { SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';
import { isFirstBlockBossStageDef } from './survivalFirstBlockStage';
import SurvivalRunPrepModal from './SurvivalRunPrepModal';
import { getFreeTierStageNumbers } from './descent/descentBlocks';
import { rebuildDescentBlocks } from './descent/descentBlocks';
import { rebuildDescentLayouts } from './descent/descentLayout';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  DEFAULT_SURVIVAL_RANDOM_BGM_URL,
  fetchSurvivalBgmSettings,
  fetchSurvivalCharacters,
  fetchSurvivalDifficultySettings,
  resolveSurvivalBgmUrl,
  resolveStageBgmUrl,
  SurvivalBgmSettingsMap,
  SurvivalCharacterRow,
  toSurvivalBgmSettingsMap,
} from '@/platform/supabaseSurvival';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem, markAudioUserInteraction } from '@/utils/MidiController';
import { isIOSWebView, getIOSParam, sendGameCallback } from '@/utils/iosbridge';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import GameHeader from '@/components/ui/GameHeader';

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

type Screen = 'select' | 'game' | 'lessonPrep';

interface SurvivalMainProps {
  lessonMode?: boolean;
  demoMode?: boolean;
}

interface LessonContext {
  lessonId: string;
  lessonSongId: string;
  stageNumber: number;
  clearConditions: Record<string, unknown>;
}

const isFaiCharacter = (character: SurvivalCharacter): boolean => {
  const normalizedName = character.name.trim();
  const normalizedNameEn = (character.nameEn ?? '').trim().toLowerCase();
  const normalizedId = character.id.trim().toLowerCase();
  return normalizedName === 'ファイ' || normalizedNameEn === 'fai' || normalizedId === 'fai';
};

async function fetchDbDifficultyConfigs(): Promise<DifficultyConfig[]> {
  try {
    const settingsData = await fetchSurvivalDifficultySettings();
    if (settingsData.length > 0) {
      return settingsData.map((s): DifficultyConfig => ({
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
    }
  } catch { /* fallback */ }
  return [];
}

async function fetchDbBgmSettings(): Promise<SurvivalBgmSettingsMap> {
  try {
    return toSurvivalBgmSettingsMap(await fetchSurvivalBgmSettings());
  } catch {
    return DEFAULT_SURVIVAL_BGM_SETTINGS;
  }
}

const DEMO_CDE_NOTES = ['C_note', 'D_note', 'E_note'];
const DEMO_BGM_URL = DEFAULT_SURVIVAL_RANDOM_BGM_URL;

const hasIOSParams = (): boolean => {
  if (!isIOSWebView()) return false;
  return !!(getIOSParam('stageNumber') || getIOSParam('difficulty') || getIOSParam('characterId'));
};

const SurvivalMain: React.FC<SurvivalMainProps> = ({ lessonMode, demoMode }) => {
  const { profile, loading: authLoading } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');

  const [isIOSSurvival] = useState(() => !lessonMode && !demoMode && hasIOSParams());
  const [screen, setScreen] = useState<Screen>(() => {
    if (demoMode || isIOSSurvival) return 'game';
    if (lessonMode) return 'lessonPrep';
    return 'select';
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DifficultyConfig | null>(null);
  const [debugSettings, setDebugSettings] = useState<DebugSettings | undefined>(undefined);
  const [selectedCharacter, setSelectedCharacter] = useState<SurvivalCharacter | undefined>(undefined);
  const [activeStageDefinition, setActiveStageDefinition] = useState<StageDefinition | null>(null);
  const [activeHintMode, setActiveHintMode] = useState(false);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [lessonInitialized, setLessonInitialized] = useState(false);
  const [survivalSessionNonce, setSurvivalSessionNonce] = useState(0);
  const [lessonInlineCompositePhrases, setLessonInlineCompositePhrases] = useState<
    readonly SurvivalPhraseDefinition[] | null
  >(null);
  const [lessonRuntime, setLessonRuntime] = useState<ResolvedSurvivalLessonRuntime | null>(null);
  const [lessonRandomChordOverrides, setLessonRandomChordOverrides] = useState<
    ReadonlyMap<string, ChordDefinition> | undefined
  >(undefined);
  const [lessonProductionHintOverrides, setLessonProductionHintOverrides] = useState<{
    staff?: ProductionHintMode | null;
    keyboard?: ProductionHintMode | null;
  } | undefined>(undefined);
  const [survivalBgmSettings, setSurvivalBgmSettings] = useState<SurvivalBgmSettingsMap>(DEFAULT_SURVIVAL_BGM_SETTINGS);

  const [iosInitialized, setIosInitialized] = useState(false);
  const [iosInitError, setIosInitError] = useState(false);
  const [demoInitialized, setDemoInitialized] = useState(false);

  const survivalFreeTierOnly = !isPremiumMember && !lessonMode && !demoMode && !isIOSSurvival;

  useEffect(() => {
    let cancelled = false;
    const loadBgmSettings = async (): Promise<void> => {
      const bgmSettings = await fetchDbBgmSettings();
      if (!cancelled) {
        setSurvivalBgmSettings(bgmSettings);
      }
    };
    void loadBgmSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!demoMode || demoInitialized) return;
    let cancelled = false;
    const init = async (): Promise<void> => {
      try {
        await fetchAllStages();
        rebuildDescentBlocks();
        rebuildDescentLayouts();
      } catch { /* ignore */ }
      if (cancelled) return;
      const stage1 = ALL_STAGES[0];
      if (!stage1) return;
      const demoConfig: DifficultyConfig = {
        difficulty: stage1.difficulty,
        displayName: stage1.name,
        description: stage1.name,
        descriptionEn: stage1.nameEn,
        allowedChords: DEMO_CDE_NOTES,
        enemySpawnRate: 1,
        enemySpawnCount: 1,
        enemyStatMultiplier: 1,
        expMultiplier: 1,
        itemDropRate: 1,
        bgmUrl: DEMO_BGM_URL,
      };
      setSelectedDifficulty(stage1.difficulty);
      setSelectedConfig(demoConfig);
      setActiveStageDefinition(stage1);
      setActiveHintMode(true);
      setScreen('game');
      setDemoInitialized(true);
    };
    void init();
    return () => { cancelled = true; };
  }, [demoMode, demoInitialized]);

  useEffect(() => {
    if (demoMode || lessonMode || iosInitialized) return;
    if (!isIOSWebView()) return;
    if (authLoading) return;

    const iosCharId = getIOSParam('characterId');
    const iosStageNumber = getIOSParam('stageNumber');
    const iosDifficulty = getIOSParam('difficulty');

    if (!iosStageNumber && !iosDifficulty && !iosCharId) return;

    const initIOS = async () => {
      try {
        try {
          await fetchAllStages();
          rebuildDescentBlocks();
          rebuildDescentLayouts();
        } catch { /* ignore */ }
        if (ALL_STAGES.length === 0) {
          setIosInitError(true);
          return;
        }
        let targetStage: StageDefinition;
        if (iosStageNumber) {
          const stageNum = parseInt(iosStageNumber, 10);
          targetStage = ALL_STAGES.find(s => s.stageNumber === stageNum) ?? ALL_STAGES[0];
        } else {
          targetStage = ALL_STAGES.find(s => s.difficulty === iosDifficulty) ?? ALL_STAGES[0];
        }

        let targetChar: SurvivalCharacter | undefined;
        try {
          const rows = await fetchSurvivalCharacters();
          const chars = rows.map(convertToSurvivalCharacter);
          if (iosCharId) {
            const normalizedCharId = iosCharId.toLowerCase();
            targetChar = chars.find(c => c.id === normalizedCharId || c.id.toLowerCase() === normalizedCharId) ?? chars[0];
          } else {
            targetChar = chars.find(c => c.name === 'ファイ' || c.id.toLowerCase() === 'fai') ?? chars[0];
          }
        } catch { /* ignore */ }

        let dbConfigs: DifficultyConfig[] = [];
        let bgmSettings = DEFAULT_SURVIVAL_BGM_SETTINGS;
        try {
          [dbConfigs, bgmSettings] = await Promise.all([
            fetchDbDifficultyConfigs(),
            fetchDbBgmSettings(),
          ]);
        } catch { /* ignore */ }
        setSurvivalBgmSettings(bgmSettings);

        const baseConfig = dbConfigs.find(c => c.difficulty === targetStage.difficulty)
          ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === targetStage.difficulty)
          ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === 'easy')!;

        const config: DifficultyConfig = {
          ...baseConfig,
          allowedChords: targetStage.allowedChords,
          bgmUrl: resolveStageBgmUrl(targetStage, bgmSettings),
        };

        const iosHintMode = getIOSParam('hintMode') === 'true';

        setSelectedDifficulty(targetStage.difficulty);
        setSelectedConfig(config);
        if (targetChar) setSelectedCharacter(targetChar);
        setActiveStageDefinition(targetStage);
        setActiveHintMode(iosHintMode);
        setIosInitError(false);
        setScreen('game');
        setIosInitialized(true);
      } catch {
        setIosInitError(true);
      }
    };

    initIOS();
  }, [demoMode, lessonMode, iosInitialized, authLoading]);

  const lessonParams = useMemo(() => {
    if (!lessonMode) return null;
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex < 0) return null;
    return new URLSearchParams(hash.slice(qIndex + 1));
  }, [lessonMode]);


  useEffect(() => {
    if (!lessonMode || !lessonParams || lessonInitialized) return;

    if (!isPremiumMember && !demoMode && !isIOSSurvival) {
      window.location.hash = '#survival';
      return;
    }

    const lessonId = lessonParams.get('lessonId') || '';
    const lessonSongId = lessonParams.get('lessonSongId') || '';
    const stageNumber = parseInt(lessonParams.get('stageNumber') || '0', 10);
    let clearConditions: Record<string, unknown> = {};

    try {
      clearConditions = JSON.parse(lessonParams.get('clearConditions') || '{}') as Record<string, unknown>;
    } catch { /* ignore */ }

    if (!lessonId || !lessonSongId) {
      window.location.hash = '#lessons';
      return;
    }

    const survivalMapCategory = resolveLessonSurvivalMapCategory(lessonParams.get('mapCategory'));

    setLessonContext({ lessonId, lessonSongId, stageNumber, clearConditions });

    const initLesson = async () => {
      try {
        await fetchAllStages();
        rebuildDescentBlocks();
        rebuildDescentLayouts();
      } catch { /* ignore */ }

      let lessonSong;
      try {
        lessonSong = await fetchLessonSongById(lessonSongId);
      } catch {
        window.location.hash = '#lessons';
        return;
      }

      let stageDef: StageDefinition | undefined;
      let inlinePhrases: readonly SurvivalPhraseDefinition[] | null = null;

      if (lessonSongHasInlineComposite(lessonSong.survival_composite_config)) {
        const compositeConfig = lessonSong.survival_composite_config;
        if (!compositeConfig) {
          window.location.hash = '#lessons';
          return;
        }
        try {
          inlinePhrases = buildSurvivalPhrasesFromLessonCompositeConfig(compositeConfig, lessonSongId);
        } catch {
          window.location.hash = '#lessons';
          return;
        }
        stageDef = buildLessonCompositeStageDefinition(
          lessonSong.title ?? '複合フレーズ課題',
          lessonSong.title_en ?? 'Composite phrase lesson',
          compositeConfig,
        );
      } else {
        if (!stageNumber) {
          window.location.hash = '#lessons';
          return;
        }
        stageDef = findStageForLesson(stageNumber, survivalMapCategory);
        if (!stageDef) {
          window.location.hash = '#lessons';
          return;
        }
      }

      try {
        markAudioUserInteraction();
        void FantasySoundManager.unlock();
        void initializeAudioSystem().catch(() => {});
      } catch { /* ignore */ }

      let faiChar: SurvivalCharacter | undefined;
      try {
        const charRows = await fetchSurvivalCharacters();
        const chars = charRows.map(convertToSurvivalCharacter);
        faiChar = chars.find(isFaiCharacter);
      } catch { /* ignore */ }

      const [dbConfigs, bgmSettings] = await Promise.all([
        fetchDbDifficultyConfigs(),
        fetchDbBgmSettings(),
      ]);
      setSurvivalBgmSettings(bgmSettings);
      const baseConfig = dbConfigs.find(c => c.difficulty === stageDef.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === stageDef.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === 'easy')!;
      const isInlineComposite = inlinePhrases !== null && inlinePhrases.length >= 2;
      const isBossStage = isInlineComposite
        || getSurvivalStageBattleKind(
          stageDef.stageType,
          isBlockLastStage(stageDef.stageNumber, stageDef.mapCategory),
        ) === 'boss';
      const isPhraseMode = stageDef.mapCategory === 'phrases';
      const runtime = resolveSurvivalLessonRuntime(lessonSong.survival_lesson_overrides, {
        stageDefinition: stageDef,
        baseConfig,
        isBossStage,
        isPhraseMode,
        isCompositeBoss: isInlineComposite
          || Boolean(stageDef.compositePhraseSources?.length),
        isFirstBlockBoss: isFirstBlockBossStageDef(stageDef),
      });
      const defaultBgm = resolveStageBgmUrl(stageDef, bgmSettings);
      const randomChordEntries = parseSurvivalLessonRandomChords(lessonSong.survival_random_chords);
      const appliedRandom = applyLessonRandomChords(
        stageDef.allowedChords,
        randomChordEntries,
        stageDef.stageType,
      );
      const lessonConfig: DifficultyConfig = {
        ...baseConfig,
        difficulty: stageDef.difficulty,
        allowedChords: appliedRandom.allowedChordIds,
        enemyStatMultiplier: runtime.enemyStatMultiplier,
        bgmUrl: runtime.bgmUrl ?? defaultBgm,
      };

      setSelectedDifficulty(stageDef.difficulty);
      setSelectedConfig(lessonConfig);
      setSelectedCharacter(faiChar);
      setActiveStageDefinition(stageDef);
      setLessonInlineCompositePhrases(inlinePhrases);
      setLessonRuntime(runtime);
      setLessonRandomChordOverrides(
        appliedRandom.overrides.size > 0 ? appliedRandom.overrides : undefined,
      );
      setLessonProductionHintOverrides({
        staff: lessonSong.override_production_staff_hint_mode ?? null,
        keyboard: lessonSong.override_production_keyboard_hint_mode ?? null,
      });
      setActiveHintMode(false);
      setScreen('lessonPrep');
      setLessonInitialized(true);
    };

    initLesson();
  }, [lessonMode, lessonParams, lessonInitialized, isPremiumMember, demoMode, isIOSSurvival]);

  const handleLessonStageClear = useCallback(async () => {
    if (!lessonContext || !profile) return;
    try {
      await updateLessonRequirementProgress(
        lessonContext.lessonId,
        lessonContext.lessonSongId,
        'S',
        lessonContext.clearConditions,
        { sourceType: 'survival', lessonSongId: lessonContext.lessonSongId }
      );
    } catch { /* ignore */ }
  }, [lessonContext, profile]);

  const handleSurvivalRunModeRestart = useCallback((nextHintMode: boolean) => {
    setActiveHintMode(nextHintMode);
    setSurvivalSessionNonce(n => n + 1);
  }, []);

  const handleStageSelect = useCallback((
    difficulty: SurvivalDifficulty,
    config: DifficultyConfig,
    stageDefinition: StageDefinition,
    character?: SurvivalCharacter,
    hintMode?: boolean,
  ) => {
    setSelectedDifficulty(difficulty);
    setSelectedConfig(config);
    if (config.bgmUrl) {
      setSurvivalBgmSettings(prev => ({
        ...prev,
        [stageDefinition.stageType]: config.bgmUrl,
      }));
    }
    setDebugSettings(undefined);
    setSelectedCharacter(character);
    setActiveStageDefinition(stageDefinition);
    setActiveHintMode(hintMode ?? false);
    setScreen('game');
  }, []);

  const handleRetryWithHint = useCallback(() => {
    setActiveHintMode(true);
    setScreen('select');
    setTimeout(() => setScreen('game'), 0);
  }, []);

  const handleRetryWithoutHint = useCallback(() => {
    setActiveHintMode(false);
    setScreen('select');
    setTimeout(() => setScreen('game'), 0);
  }, []);

  const handleNextStage = useCallback(() => {
    if (!activeStageDefinition || !selectedConfig) return;
    const nextStageNumber = activeStageDefinition.stageNumber + 1;
    if (survivalFreeTierOnly) {
      const allowed = getFreeTierStageNumbers(activeStageDefinition.mapCategory);
      if (!allowed.includes(nextStageNumber)) return;
    }
    const stagesInCategory = getStagesByCategory(activeStageDefinition.mapCategory);
    const nextStage = stagesInCategory.find((s: StageDefinition) => s.stageNumber === nextStageNumber);
    if (!nextStage) return;

    const nextConfig: DifficultyConfig = {
      ...selectedConfig,
      difficulty: nextStage.difficulty,
      displayName: nextStage.name,
      description: nextStage.name,
      descriptionEn: nextStage.nameEn,
      allowedChords: nextStage.allowedChords,
      bgmUrl: resolveStageBgmUrl(nextStage, survivalBgmSettings),
    };
    setActiveStageDefinition(nextStage);
    setSelectedConfig(nextConfig);
    setSelectedDifficulty(nextStage.difficulty);
    setActiveHintMode(false);
    setScreen('select');
    setTimeout(() => setScreen('game'), 0);
  }, [activeStageDefinition, selectedConfig, survivalBgmSettings, survivalFreeTierOnly]);

  const survivalOnNextStage = useMemo((): (() => void) | undefined => {
    if (lessonMode || !activeStageDefinition) return undefined;
    const max = getTotalStagesByCategory(activeStageDefinition.mapCategory);
    if (activeStageDefinition.stageNumber >= max) return undefined;
    const nextNum = activeStageDefinition.stageNumber + 1;
    if (survivalFreeTierOnly) {
      const allowed = getFreeTierStageNumbers(activeStageDefinition.mapCategory);
      if (!allowed.includes(nextNum)) return undefined;
    }
    return handleNextStage;
  }, [lessonMode, activeStageDefinition, survivalFreeTierOnly, handleNextStage]);

  const handleBackToSelect = useCallback(() => {
    // iOS から直接ステージ起動 (レッスン連動 or タブ経由の stageNumber 指定) の場合のみ WebView を閉じる。
    // iOS タブのマップ画面 (#survival) 経由でゲームに入った場合は、WebView を閉じずにマップへ戻す。
    if (isIOSWebView() && isIOSSurvival) {
      sendGameCallback('gameEnd');
      return;
    }
    if (lessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    setScreen('select');
    setSelectedDifficulty(null);
    setSelectedConfig(null);
    setDebugSettings(undefined);
    setSelectedCharacter(undefined);
    setActiveStageDefinition(null);
    setActiveHintMode(false);
  }, [isIOSSurvival, lessonMode, lessonContext]);

  const handleBackToMenu = useCallback(() => {
    if (isIOSWebView()) {
      sendGameCallback('gameEnd');
      return;
    }
    if (lessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    window.location.hash = '#dashboard';
  }, [lessonMode, lessonContext]);

  if (isIOSSurvival && !iosInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          {iosInitError ? (
            <>
              <p className="text-lg mb-4">{isEnglishCopy ? 'Loading failed' : '読み込みに失敗しました'}</p>
              <button
                onClick={() => { setIosInitError(false); setIosInitialized(false); }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors font-sans"
              >
                {isEnglishCopy ? 'Retry' : '再試行'}
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">{isEnglishCopy ? 'Loading...' : '読み込み中...'}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (lessonMode && !lessonInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg">{isEnglishCopy ? 'Loading…' : '読み込み中...'}</p>
        </div>
      </div>
    );
  }

  if (
    lessonMode &&
    lessonInitialized &&
    screen === 'lessonPrep' &&
    lessonContext &&
    activeStageDefinition &&
    selectedDifficulty &&
    selectedConfig
  ) {
    return (
      <>
        <GameHeader />
        <div
          className="relative flex min-h-screen items-center justify-center overflow-hidden fantasy-game-screen"
          style={{
            background:
              'radial-gradient(ellipse at top, #1b1228 0%, #0d0818 45%, #050309 100%)',
          }}
        >
          <SurvivalRunPrepModal
            isOpen
            variant="lesson"
            stage={activeStageDefinition}
            lessonRuntime={lessonRuntime ?? undefined}
            isEnglishCopy={isEnglishCopy}
            initialHintMode={activeHintMode}
            onCancel={() => {
              window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
            }}
            onConfirm={(hint) => {
              setActiveHintMode(hint);
              setSurvivalSessionNonce(n => n + 1);
              setScreen('game');
            }}
          />
        </div>
        <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
      </>
    );
  }

  if (screen === 'select') {
    return (
      <>
        <GameHeader />
        <div
          className="min-h-screen overflow-y-auto fantasy-game-screen"
          style={{
            background:
              'radial-gradient(ellipse at top, #1b1228 0%, #0d0818 45%, #050309 100%)',
          }}
        >
          <SurvivalDescentMap
            embedded
            freeTierAccessOnly={survivalFreeTierOnly}
            onStageSelect={handleStageSelect}
            onBackToMenu={handleBackToMenu}
          />
        </div>
        <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
      </>
    );
  }

  if (screen === 'game' && selectedDifficulty && selectedConfig) {
    return (
      <SurvivalGameScreen
        key={`sv-${activeStageDefinition?.mapCategory ?? 'x'}-${activeStageDefinition?.stageNumber ?? 0}-${activeHintMode}-${survivalSessionNonce}`}
        difficulty={selectedDifficulty}
        config={selectedConfig}
        onBackToSelect={handleBackToSelect}
        onBackToMenu={handleBackToMenu}
        debugSettings={debugSettings}
        character={selectedCharacter}
        stageDefinition={activeStageDefinition ?? undefined}
        lessonInlineCompositePhrases={lessonInlineCompositePhrases ?? undefined}
        lessonRuntime={lessonRuntime ?? undefined}
        lessonRandomChordOverrides={lessonRandomChordOverrides}
        lessonProductionHintOverrides={lessonProductionHintOverrides}
        onLessonStageClear={lessonMode ? handleLessonStageClear : undefined}
        isLessonMode={!!lessonMode}
        hintMode={activeHintMode}
        onRetryWithHint={activeStageDefinition ? handleRetryWithHint : undefined}
        onRetryWithoutHint={activeStageDefinition ? handleRetryWithoutHint : undefined}
        onNextStage={survivalOnNextStage}
        onSurvivalRunModeRestart={
          activeStageDefinition ? handleSurvivalRunModeRestart : undefined
        }
      />
    );
  }

  return (
    <>
      <GameHeader />
      <div
        className="min-h-screen overflow-y-auto fantasy-game-screen"
        style={{
          background:
            'radial-gradient(ellipse at top, #1b1228 0%, #0d0818 45%, #050309 100%)',
        }}
      >
        <SurvivalDescentMap
          embedded
          freeTierAccessOnly={survivalFreeTierOnly}
          onStageSelect={handleStageSelect}
          onBackToMenu={handleBackToMenu}
        />
      </div>
      <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
    </>
  );
};

export default SurvivalMain;
