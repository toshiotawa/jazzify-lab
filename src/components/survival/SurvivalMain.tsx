/**
 * サバイバルモード メインコンポーネント
 * モード選択 → フリープレイ or ステージモード → ゲーム画面
 */

import React, { useState, useCallback } from 'react';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import SurvivalStageSelect, { DebugSettings } from './SurvivalStageSelect';
import SurvivalStageMode from './SurvivalStageMode';
import SurvivalGameScreen from './SurvivalGameScreen';
import { StageDefinition } from './SurvivalStageDefinitions';
import { FaBolt, FaTrophy } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

type Screen = 'mode-select' | 'free-select' | 'stage-select' | 'game';

const SurvivalMain: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const [screen, setScreen] = useState<Screen>('mode-select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DifficultyConfig | null>(null);
  const [debugSettings, setDebugSettings] = useState<DebugSettings | undefined>(undefined);
  const [selectedCharacter, setSelectedCharacter] = useState<SurvivalCharacter | undefined>(undefined);
  const [activeStageDefinition, setActiveStageDefinition] = useState<StageDefinition | null>(null);

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
  }, [activeStageDefinition]);

  const handleBackToMenu = useCallback(() => {
    window.location.hash = '#dashboard';
  }, []);

  const handleBackToModeSelect = useCallback(() => {
    setScreen('mode-select');
  }, []);

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
