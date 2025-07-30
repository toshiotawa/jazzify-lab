/**
 * ファンタジーゲーム画面ラッパー
 * game_typeによってリズムモードとクイズモードを切り替える
 */

import React from 'react';
import FantasyGameScreen from './FantasyGameScreen';
import FantasyRhythmGameScreen from './FantasyRhythmGameScreen';
import type { FantasyStage } from '@/types';
import type { DisplayOpts } from '@/utils/display-note';

interface FantasyGameScreenWrapperProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const FantasyGameScreenWrapper: React.FC<FantasyGameScreenWrapperProps> = (props) => {
  const { stage } = props;
  
  // デバッグログ
  console.log('🎮 FantasyGameScreenWrapper - stage:', {
    id: stage.id,
    name: stage.name,
    game_type: stage.game_type,
    rhythm_pattern: stage.rhythm_pattern,
    stage_number: stage.stage_number
  });
  
  // game_typeによる分岐
  // 一時的な対処: ステージ4-1以降は強制的にリズムモードとする
  if (stage.game_type === 'rhythm' || stage.stage_number?.startsWith('4-')) {
    console.log('🎵 リズムモードを選択');
    return <FantasyRhythmGameScreen {...props} />;
  }
  
  // デフォルトはクイズモード
  console.log('❓ クイズモードを選択（game_type:', stage.game_type, '）');
  return <FantasyGameScreen {...props} />;
};

export default FantasyGameScreenWrapper;