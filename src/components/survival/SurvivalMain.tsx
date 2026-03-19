/**
 * サバイバルモード メインコンポーネント
 * モード選択 → フリープレイ or ステージモード → ゲーム画面
 * lessonMode: レッスン課題からの起動（URLパラメータからコード/コンテキスト読み取り）
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import { DebugSettings, DIFFICULTY_CONFIGS } from './SurvivalStageSelect';
import SurvivalStageMode from './SurvivalStageMode';
import SurvivalGameScreen from './SurvivalGameScreen';
import { StageDefinition, STAGE_TIME_LIMIT_SECONDS, ALL_STAGES, TOTAL_STAGES } from './SurvivalStageDefinitions';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { fetchSurvivalCharacters, fetchSurvivalDifficultySettings, SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';
import { isIOSWebView, getIOSParam } from '@/utils/iosbridge';

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

type Screen = 'select' | 'game';

interface SurvivalMainProps {
  lessonMode?: boolean;
  demoMode?: boolean;
}

interface LessonContext {
  lessonId: string;
  lessonSongId: string;
  stageNumber: number;
  clearConditions: any;
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
        bgmOddWaveUrl: s.bgmOddWaveUrl,
        bgmEvenWaveUrl: s.bgmEvenWaveUrl,
      }));
    }
  } catch { /* fallback */ }
  return [];
}

const DEMO_CDE_NOTES = ['C', 'D', 'E'];
const DEMO_BGM_ODD = 'https://jazzify-cdn.com/fantasy-bgm/5b49b467-c54b-4fa8-ba36-bae3cfce424e.mp3';
const DEMO_BGM_EVEN = 'https://jazzify-cdn.com/fantasy-bgm/b4249680-5471-4e4d-abba-af856ff33310.mp3';

const SurvivalMain: React.FC<SurvivalMainProps> = ({ lessonMode, demoMode }) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });

  const [screen, setScreen] = useState<Screen>((lessonMode || demoMode) ? 'game' : 'select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DifficultyConfig | null>(null);
  const [debugSettings, setDebugSettings] = useState<DebugSettings | undefined>(undefined);
  const [selectedCharacter, setSelectedCharacter] = useState<SurvivalCharacter | undefined>(undefined);
  const [activeStageDefinition, setActiveStageDefinition] = useState<StageDefinition | null>(null);
  const [activeHintMode, setActiveHintMode] = useState(false);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [lessonInitialized, setLessonInitialized] = useState(false);

  const [iosInitialized, setIosInitialized] = useState(false);

  useEffect(() => {
    if (demoMode || lessonMode || iosInitialized) return;
    if (!isIOSWebView()) return;

    const iosCharId = getIOSParam('characterId');
    const iosStageNumber = getIOSParam('stageNumber');
    const iosDifficulty = getIOSParam('difficulty');

    if (!iosCharId) return;
    if (!iosStageNumber && !iosDifficulty) return;

    const initIOS = async () => {
      try {
        await FantasySoundManager.unlock();
        await initializeAudioSystem();
      } catch { /* ignore */ }

      let targetChar: SurvivalCharacter | undefined;
      try {
        const rows = await fetchSurvivalCharacters();
        const chars = rows.map(convertToSurvivalCharacter);
        targetChar = chars.find(c => c.id === iosCharId) ?? chars[0];
      } catch { /* ignore */ }

      let targetStage: StageDefinition;
      if (iosStageNumber) {
        const stageNum = parseInt(iosStageNumber, 10);
        targetStage = ALL_STAGES.find(s => s.stageNumber === stageNum) ?? ALL_STAGES[0];
      } else {
        targetStage = ALL_STAGES.find(s => s.difficulty === iosDifficulty) ?? ALL_STAGES[0];
      }

      const dbConfigs = await fetchDbDifficultyConfigs();
      const baseConfig = dbConfigs.find(c => c.difficulty === targetStage.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === targetStage.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === 'easy')!;

      const config: DifficultyConfig = {
        ...baseConfig,
        allowedChords: targetStage.allowedChords,
      };

      setSelectedDifficulty(targetStage.difficulty);
      setSelectedConfig(config);
      setSelectedCharacter(targetChar);
      setActiveStageDefinition(targetStage);
      setScreen('game');
      setIosInitialized(true);
    };

    initIOS();
  }, [demoMode, lessonMode, iosInitialized]);

  const lessonParams = useMemo(() => {
    if (!lessonMode) return null;
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex < 0) return null;
    return new URLSearchParams(hash.slice(qIndex + 1));
  }, [lessonMode]);


  useEffect(() => {
    if (!lessonMode || !lessonParams || lessonInitialized) return;

    const lessonId = lessonParams.get('lessonId') || '';
    const lessonSongId = lessonParams.get('lessonSongId') || '';
    const stageNumber = parseInt(lessonParams.get('stageNumber') || '0', 10);
    let clearConditions: any = {};

    try { clearConditions = JSON.parse(lessonParams.get('clearConditions') || '{}'); } catch { /* ignore */ }

    const stageDef = ALL_STAGES.find(s => s.stageNumber === stageNumber);
    if (!lessonId || !lessonSongId || !stageDef) {
      window.location.hash = '#lessons';
      return;
    }

    setLessonContext({ lessonId, lessonSongId, stageNumber, clearConditions });

    const initLesson = async () => {
      try {
        await FantasySoundManager.unlock();
        await initializeAudioSystem();
      } catch { /* ignore */ }

      let faiChar: SurvivalCharacter | undefined;
      try {
        const charRows = await fetchSurvivalCharacters();
        const chars = charRows.map(convertToSurvivalCharacter);
        faiChar = chars.find(isFaiCharacter);
      } catch { /* ignore */ }

      const dbConfigs = await fetchDbDifficultyConfigs();
      const baseConfig = dbConfigs.find(c => c.difficulty === stageDef.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === stageDef.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === 'easy')!;
      const lessonConfig: DifficultyConfig = {
        ...baseConfig,
        difficulty: stageDef.difficulty,
        allowedChords: stageDef.allowedChords,
      };

      setSelectedDifficulty(stageDef.difficulty);
      setSelectedConfig(lessonConfig);
      setSelectedCharacter(faiChar);
      setActiveStageDefinition(stageDef);
      setScreen('game');
      setLessonInitialized(true);
    };

    initLesson();
  }, [lessonMode, lessonParams, lessonInitialized]);

  const handleLessonStageClear = useCallback(async () => {
    if (!lessonContext || !profile) return;
    try {
      await updateLessonRequirementProgress(
        lessonContext.lessonId,
        lessonContext.lessonSongId,
        'S',
        lessonContext.clearConditions,
        { sourceType: 'fantasy', lessonSongId: lessonContext.lessonSongId }
      );
    } catch { /* ignore */ }
  }, [lessonContext, profile]);

  const handleStageSelect = useCallback((
    difficulty: SurvivalDifficulty,
    config: DifficultyConfig,
    stageDefinition: StageDefinition,
    character?: SurvivalCharacter,
    hintMode?: boolean,
  ) => {
    setSelectedDifficulty(difficulty);
    setSelectedConfig(config);
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
    const nextStage = ALL_STAGES.find(s => s.stageNumber === nextStageNumber);
    if (!nextStage) return;

    const nextConfig: DifficultyConfig = {
      ...selectedConfig,
      difficulty: nextStage.difficulty,
      displayName: nextStage.name,
      description: nextStage.name,
      descriptionEn: nextStage.nameEn,
      allowedChords: nextStage.allowedChords,
    };
    setActiveStageDefinition(nextStage);
    setSelectedConfig(nextConfig);
    setSelectedDifficulty(nextStage.difficulty);
    setActiveHintMode(false);
    setScreen('select');
    setTimeout(() => setScreen('game'), 0);
  }, [activeStageDefinition, selectedConfig]);

  const handleBackToSelect = useCallback(() => {
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
  }, [activeStageDefinition, lessonMode, lessonContext]);

  const handleBackToMenu = useCallback(() => {
    if (lessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    window.location.hash = '#dashboard';
  }, [lessonMode, lessonContext]);

  if (lessonMode && !lessonInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black overflow-y-auto fantasy-game-screen">
        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider">
              SURVIVAL
            </h1>
            <button
              onClick={handleBackToMenu}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base font-sans"
            >
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>

          <div className="max-w-2xl mx-auto mt-3">
            <p className="text-gray-400 text-sm font-sans text-center">
              {isEnglishCopy ? 'Complete all stages!' : '全ステージを制覇せよ！'}
            </p>
          </div>
        </div>

        <SurvivalStageMode
          embedded
          onStageSelect={handleStageSelect}
          onBackToMenu={handleBackToMenu}
        />
      </div>
    );
  }

  if (screen === 'game' && selectedDifficulty && selectedConfig) {
    return (
      <SurvivalGameScreen
        difficulty={selectedDifficulty}
        config={selectedConfig}
        onBackToSelect={handleBackToSelect}
        onBackToMenu={handleBackToMenu}
        debugSettings={debugSettings}
        character={selectedCharacter}
        stageDefinition={activeStageDefinition ?? undefined}
        onLessonStageClear={lessonMode ? handleLessonStageClear : undefined}
        isLessonMode={!!lessonMode}
        hintMode={activeHintMode}
        onRetryWithHint={activeStageDefinition ? handleRetryWithHint : undefined}
        onRetryWithoutHint={activeStageDefinition ? handleRetryWithoutHint : undefined}
        onNextStage={lessonMode ? undefined : (activeStageDefinition && activeStageDefinition.stageNumber < TOTAL_STAGES ? handleNextStage : undefined)}
      />
    );
  }

  return (
    <SurvivalStageMode
      embedded
      onStageSelect={handleStageSelect}
      onBackToMenu={handleBackToMenu}
    />
  );
};

export default SurvivalMain;
