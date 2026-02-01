/**
 * サバイバルモード メインコンポーネント
 * ステージ選択とゲーム画面の切り替え管理
 */

import React, { useState, useCallback } from 'react';
import { SurvivalDifficulty, DifficultyConfig } from './SurvivalTypes';
import SurvivalStageSelect, { DIFFICULTY_CONFIGS } from './SurvivalStageSelect';
import SurvivalGameScreen from './SurvivalGameScreen';

type Screen = 'select' | 'game';

const SurvivalMain: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DifficultyConfig | null>(null);
  
  // 難易度選択
  const handleStageSelect = useCallback((difficulty: SurvivalDifficulty, config: DifficultyConfig) => {
    setSelectedDifficulty(difficulty);
    setSelectedConfig(config);
    setScreen('game');
  }, []);
  
  // ステージ選択に戻る
  const handleBackToSelect = useCallback(() => {
    setScreen('select');
    setSelectedDifficulty(null);
    setSelectedConfig(null);
  }, []);
  
  // メニューに戻る
  const handleBackToMenu = useCallback(() => {
    window.location.hash = '#dashboard';
  }, []);
  
  // ステージ選択画面
  if (screen === 'select') {
    return (
      <SurvivalStageSelect
        onStageSelect={handleStageSelect}
        onBackToMenu={handleBackToMenu}
      />
    );
  }
  
  // ゲーム画面
  if (screen === 'game' && selectedDifficulty && selectedConfig) {
    return (
      <SurvivalGameScreen
        difficulty={selectedDifficulty}
        config={selectedConfig}
        onBackToSelect={handleBackToSelect}
        onBackToMenu={handleBackToMenu}
      />
    );
  }
  
  // フォールバック
  return (
    <SurvivalStageSelect
      onStageSelect={handleStageSelect}
      onBackToMenu={handleBackToMenu}
    />
  );
};

export default SurvivalMain;
