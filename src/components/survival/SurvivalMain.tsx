/**
 * サバイバルモード メインコンポーネント
 * モード選択 → フリープレイ or ステージモード → ゲーム画面
 * lessonMode: レッスン課題からの起動（URLパラメータからコード/コンテキスト読み取り）
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import SurvivalStageSelect, { DebugSettings, DIFFICULTY_CONFIGS } from './SurvivalStageSelect';
import SurvivalStageMode from './SurvivalStageMode';
import SurvivalGameScreen from './SurvivalGameScreen';
import { StageDefinition, STAGE_TIME_LIMIT_SECONDS } from './SurvivalStageDefinitions';
import { FaBolt, FaTrophy } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { fetchSurvivalCharacters, SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
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

type Screen = 'mode-select' | 'free-select' | 'stage-select' | 'game';

interface SurvivalMainProps {
  lessonMode?: boolean;
}

interface LessonContext {
  lessonId: string;
  lessonSongId: string;
  allowedChords: string[];
  clearConditions: any;
}

const isFaiCharacter = (character: SurvivalCharacter): boolean => {
  const normalizedName = character.name.trim();
  const normalizedNameEn = (character.nameEn ?? '').trim().toLowerCase();
  const normalizedId = character.id.trim().toLowerCase();
  return normalizedName === 'ファイ' || normalizedNameEn === 'fai' || normalizedId === 'fai';
};

const SurvivalMain: React.FC<SurvivalMainProps> = ({ lessonMode }) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const [screen, setScreen] = useState<Screen>(lessonMode ? 'game' : 'mode-select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DifficultyConfig | null>(null);
  const [debugSettings, setDebugSettings] = useState<DebugSettings | undefined>(undefined);
  const [selectedCharacter, setSelectedCharacter] = useState<SurvivalCharacter | undefined>(undefined);
  const [activeStageDefinition, setActiveStageDefinition] = useState<StageDefinition | null>(null);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [lessonInitialized, setLessonInitialized] = useState(false);

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
    let allowedChords: string[] = [];
    let clearConditions: any = {};

    try { allowedChords = JSON.parse(lessonParams.get('allowedChords') || '[]'); } catch { /* ignore */ }
    try { clearConditions = JSON.parse(lessonParams.get('clearConditions') || '{}'); } catch { /* ignore */ }

    if (!lessonId || !lessonSongId || allowedChords.length === 0) {
      window.location.hash = '#lessons';
      return;
    }

    setLessonContext({ lessonId, lessonSongId, allowedChords, clearConditions });

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

      const baseConfig = DIFFICULTY_CONFIGS.find(c => c.difficulty === 'easy')!;
      const lessonConfig: DifficultyConfig = {
        ...baseConfig,
        allowedChords,
      };

      const lessonStageDefinition: StageDefinition = {
        stageNumber: 0,
        name: 'レッスン課題',
        nameEn: 'Lesson Task',
        difficulty: 'easy',
        chordSuffix: '',
        chordDisplayName: 'レッスン',
        chordDisplayNameEn: 'Lesson',
        rootPattern: 'all',
        rootPatternName: 'レッスン',
        rootPatternNameEn: 'Lesson',
        allowedChords,
      };

      setSelectedDifficulty('easy');
      setSelectedConfig(lessonConfig);
      setSelectedCharacter(faiChar);
      setActiveStageDefinition(lessonStageDefinition);
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
  ) => {
    setSelectedDifficulty(difficulty);
    setSelectedConfig(config);
    setDebugSettings(undefined);
    setSelectedCharacter(character);
    setActiveStageDefinition(stageDefinition);
    setScreen('game');
  }, []);

  const handleBackToSelect = useCallback(() => {
    if (lessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    if (activeStageDefinition) {
      setScreen('stage-select');
    } else {
      setScreen('free-select');
    }
    setSelectedDifficulty(null);
    setSelectedConfig(null);
    setDebugSettings(undefined);
    setSelectedCharacter(undefined);
    setActiveStageDefinition(null);
  }, [activeStageDefinition, lessonMode, lessonContext]);

  const handleBackToMenu = useCallback(() => {
    if (lessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    window.location.hash = '#dashboard';
  }, [lessonMode, lessonContext]);

  const handleBackToModeSelect = useCallback(() => {
    setScreen('mode-select');
  }, []);

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

  if (screen === 'mode-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black overflow-y-auto fantasy-game-screen">
        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex justify-between items-center mb-8">
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

          <div className="max-w-2xl mx-auto space-y-4">
            {/* フリープレイ */}
            <button
              onClick={() => setScreen('free-select')}
              className="w-full text-left rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 p-6 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0">
                  <FaBolt className="text-yellow-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white font-sans mb-1">
                    FREE PLAY
                  </h2>
                  <p className="text-gray-400 text-sm font-sans">
                    {isEnglishCopy
                      ? 'Choose difficulty and character freely. Survive as long as you can!'
                      : '難易度とキャラクターを自由に選んで挑戦！20分間生き残れ！'}
                  </p>
                </div>
                <div className="text-xl text-gray-500 group-hover:text-white transition-colors">▶</div>
              </div>
            </button>

            {/* ステージモード */}
            <button
              onClick={() => setScreen('stage-select')}
              className="w-full text-left rounded-2xl border-2 border-purple-500/40 bg-gradient-to-r from-purple-900/30 to-pink-900/20 p-6 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0">
                  <FaTrophy className="text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white font-sans mb-1">
                    STAGE MODE
                  </h2>
                  <p className="text-sm font-sans mb-1">
                    <span className="text-purple-300 font-bold">
                      {isEnglishCopy ? '5 minutes survival to clear!' : '5分間生存でクリア！'}
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm font-sans">
                    {isEnglishCopy
                      ? 'Master chord types one by one across 105 stages!'
                      : 'コードタイプ別に全105ステージを順番に攻略！'}
                  </p>
                </div>
                <div className="text-xl text-gray-500 group-hover:text-white transition-colors">▶</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'free-select') {
    return (
      <SurvivalStageSelect
        onStageSelect={handleFreePlaySelect}
        onBackToMenu={handleBackToModeSelect}
      />
    );
  }

  if (screen === 'stage-select') {
    return (
      <SurvivalStageMode
        onStageSelect={handleStageSelect}
        onBackToMenu={handleBackToMenu}
        onBackToModeSelect={handleBackToModeSelect}
      />
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
      />
    );
  }

  return (
    <SurvivalStageSelect
      onStageSelect={handleFreePlaySelect}
      onBackToMenu={handleBackToModeSelect}
    />
  );
};

export default SurvivalMain;
