/**
 * サバイバルモード メインコンポーネント
 * モード選択 → フリープレイ or ステージモード → ゲーム画面
 * lessonMode: レッスン課題からの起動（URLパラメータからコード/コンテキスト読み取り）
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import SurvivalStageSelect, { DebugSettings, DIFFICULTY_CONFIGS } from './SurvivalStageSelect';
import SurvivalStageMode from './SurvivalStageMode';
import SurvivalGameScreen from './SurvivalGameScreen';
import { StageDefinition, STAGE_TIME_LIMIT_SECONDS, ALL_STAGES, TOTAL_STAGES } from './SurvivalStageDefinitions';
import { FaBolt, FaTrophy } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { fetchSurvivalCharacters, SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { incrementSurvivalMissionProgressOnClear } from '@/platform/supabaseChallengeSurvival';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';

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
type SurvivalTab = 'stage' | 'free';

interface SurvivalMainProps {
  lessonMode?: boolean;
  missionMode?: boolean;
}

interface LessonContext {
  lessonId: string;
  lessonSongId: string;
  stageNumber: number;
  clearConditions: any;
}

interface MissionContext {
  missionId: string;
  stageNumber: number;
}

const isFaiCharacter = (character: SurvivalCharacter): boolean => {
  const normalizedName = character.name.trim();
  const normalizedNameEn = (character.nameEn ?? '').trim().toLowerCase();
  const normalizedId = character.id.trim().toLowerCase();
  return normalizedName === 'ファイ' || normalizedNameEn === 'fai' || normalizedId === 'fai';
};

const SurvivalMain: React.FC<SurvivalMainProps> = ({ lessonMode, missionMode }) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const [screen, setScreen] = useState<Screen>((lessonMode || missionMode) ? 'game' : 'select');
  const [activeTab, setActiveTab] = useState<SurvivalTab>('stage');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DifficultyConfig | null>(null);
  const [debugSettings, setDebugSettings] = useState<DebugSettings | undefined>(undefined);
  const [selectedCharacter, setSelectedCharacter] = useState<SurvivalCharacter | undefined>(undefined);
  const [activeStageDefinition, setActiveStageDefinition] = useState<StageDefinition | null>(null);
  const [activeHintMode, setActiveHintMode] = useState(false);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [lessonInitialized, setLessonInitialized] = useState(false);
  const [missionContext, setMissionContext] = useState<MissionContext | null>(null);
  const [missionInitialized, setMissionInitialized] = useState(false);

  const lessonParams = useMemo(() => {
    if (!lessonMode) return null;
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex < 0) return null;
    return new URLSearchParams(hash.slice(qIndex + 1));
  }, [lessonMode]);

  const missionParams = useMemo(() => {
    if (!missionMode) return null;
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex < 0) return null;
    return new URLSearchParams(hash.slice(qIndex + 1));
  }, [missionMode]);

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

      const baseConfig = DIFFICULTY_CONFIGS.find(c => c.difficulty === stageDef.difficulty)
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

  // ミッションモード初期化
  useEffect(() => {
    if (!missionMode || !missionParams || missionInitialized) return;

    const missionId = missionParams.get('missionId') || '';
    const stageNumber = parseInt(missionParams.get('stageNumber') || '0', 10);

    const stageDef = ALL_STAGES.find(s => s.stageNumber === stageNumber);
    if (!missionId || !stageDef) {
      window.location.hash = '#missions';
      return;
    }

    setMissionContext({ missionId, stageNumber });

    const initMission = async () => {
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

      const baseConfig = DIFFICULTY_CONFIGS.find(c => c.difficulty === stageDef.difficulty)
        ?? DIFFICULTY_CONFIGS.find(c => c.difficulty === 'easy')!;
      const missionConfig: DifficultyConfig = {
        ...baseConfig,
        difficulty: stageDef.difficulty,
        allowedChords: stageDef.allowedChords,
      };

      setSelectedDifficulty(stageDef.difficulty);
      setSelectedConfig(missionConfig);
      setSelectedCharacter(faiChar);
      setActiveStageDefinition(stageDef);
      setActiveHintMode(false);
      setScreen('game');
      setMissionInitialized(true);
    };

    initMission();
  }, [missionMode, missionParams, missionInitialized]);

  const handleMissionStageClear = useCallback(async () => {
    if (!missionContext || !profile) return;
    try {
      await incrementSurvivalMissionProgressOnClear(
        missionContext.missionId,
        missionContext.stageNumber
      );
    } catch { /* ignore */ }
  }, [missionContext, profile]);

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

  const handleFreePlaySelect = useCallback((
    difficulty: SurvivalDifficulty,
    config: DifficultyConfig,
    debug?: DebugSettings,
    character?: SurvivalCharacter,
  ) => {
    setSelectedDifficulty(difficulty);
    setSelectedConfig(config);
    setDebugSettings(debug);
    setSelectedCharacter(character);
    setActiveStageDefinition(null);
    setScreen('game');
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
    if (missionMode) {
      window.location.hash = '#missions';
      return;
    }
    if (activeStageDefinition) {
      setActiveTab('stage');
    } else {
      setActiveTab('free');
    }
    setScreen('select');
    setSelectedDifficulty(null);
    setSelectedConfig(null);
    setDebugSettings(undefined);
    setSelectedCharacter(undefined);
    setActiveStageDefinition(null);
    setActiveHintMode(false);
  }, [activeStageDefinition, lessonMode, lessonContext, missionMode]);

  const handleBackToMenu = useCallback(() => {
    if (lessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    if (missionMode) {
      window.location.hash = '#missions';
      return;
    }
    window.location.hash = '#dashboard';
  }, [lessonMode, lessonContext, missionMode]);

  if ((lessonMode && !lessonInitialized) || (missionMode && !missionInitialized)) {
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

          <div className="flex gap-0 max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('stage')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold font-sans text-sm sm:text-base transition-all duration-200 border-b-2',
                activeTab === 'stage'
                  ? 'border-purple-400 text-purple-300 bg-purple-900/20'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              )}
            >
              <FaTrophy className={cn(activeTab === 'stage' ? 'text-purple-400' : 'text-gray-600')} />
              STAGE MODE
            </button>
            <button
              onClick={() => setActiveTab('free')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold font-sans text-sm sm:text-base transition-all duration-200 border-b-2',
                activeTab === 'free'
                  ? 'border-yellow-400 text-yellow-300 bg-yellow-900/20'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              )}
            >
              <FaBolt className={cn(activeTab === 'free' ? 'text-yellow-400' : 'text-gray-600')} />
              FREE PLAY
            </button>
          </div>

          <div className="max-w-2xl mx-auto mt-3">
            <p className="text-gray-400 text-sm font-sans text-center">
              {activeTab === 'stage'
                ? (isEnglishCopy ? 'Survive 90 seconds and defeat 300 enemies to clear! Complete all 105 stages!' : '90秒生存+300体撃破でクリア！全105ステージを制覇せよ！')
                : (isEnglishCopy ? 'Choose your character and difficulty! Survive for 20 minutes!' : 'キャラクターと難易度を自由に選んで挑戦！20分間生き残れ！')}
            </p>
          </div>
        </div>

        {activeTab === 'stage' ? (
          <SurvivalStageMode
            embedded
            onStageSelect={handleStageSelect}
            onBackToMenu={handleBackToMenu}
          />
        ) : (
          <SurvivalStageSelect
            embedded
            onStageSelect={handleFreePlaySelect}
            onBackToMenu={handleBackToMenu}
          />
        )}
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
        onMissionStageClear={missionMode ? handleMissionStageClear : undefined}
        isLessonMode={!!lessonMode}
        isMissionMode={!!missionMode}
        hintMode={activeHintMode}
        onRetryWithHint={activeStageDefinition ? handleRetryWithHint : undefined}
        onRetryWithoutHint={activeStageDefinition ? handleRetryWithoutHint : undefined}
        onNextStage={(lessonMode || missionMode) ? undefined : (activeStageDefinition && activeStageDefinition.stageNumber < TOTAL_STAGES ? handleNextStage : undefined)}
      />
    );
  }

  return (
    <SurvivalStageSelect
      embedded
      onStageSelect={handleFreePlaySelect}
      onBackToMenu={handleBackToMenu}
    />
  );
};

export default SurvivalMain;
