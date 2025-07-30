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
  
  // game_typeによる分岐
  if (stage.game_type === 'rhythm') {
    return <FantasyRhythmGameScreen {...props} />;
  }
  
  // デフォルトはクイズモード
  return <FantasyGameScreen {...props} />;
};

export default FantasyGameScreenWrapper;