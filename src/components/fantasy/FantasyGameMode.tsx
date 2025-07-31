/**
 * FantasyGameMode - リズムモードとクイズモードを統合するラッパーコンポーネント
 */

import React, { useMemo } from 'react';
import { FantasyGameScreen } from './FantasyGameScreen';
import { RhythmFantasyGame } from '../rhythm/RhythmFantasyGame';
import { useRhythmStore } from '@/stores/rhythmStore';
import type { FantasyStage } from './FantasyGameEngine';
import type { ExtendedFantasyStage } from '@/types';

interface FantasyGameModeProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: 'en' | 'solfege';
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

export const FantasyGameMode: React.FC<FantasyGameModeProps> = (props) => {
  const { stage } = props;
  const rhythmStore = useRhythmStore();
  
  // ステージの拡張データを作成
  const extendedStage: ExtendedFantasyStage = useMemo(() => ({
    id: stage.id,
    stageNumber: stage.stageNumber,
    name: stage.name,
    description: stage.description,
    maxHp: stage.maxHp,
    enemyGaugeSeconds: stage.enemyGaugeSeconds,
    enemyCount: stage.enemyCount,
    enemyHp: stage.enemyHp,
    minDamage: stage.minDamage,
    maxDamage: stage.maxDamage,
    mode: stage.mode,
    allowedChords: stage.allowedChords,
    chordProgression: stage.chordProgression,
    showSheetMusic: stage.showSheetMusic,
    showGuide: stage.showGuide,
    monsterIcon: stage.monsterIcon,
    bgmUrl: stage.bgmUrl,
    simultaneousMonsterCount: stage.simultaneousMonsterCount,
    
    // リズムゲーム拡張
    gameType: stage.gameType || 'quiz',
    rhythmPattern: stage.rhythmPattern || 'random',
    bpm: stage.bpm || 120,
    timeSignature: stage.timeSignature || 4,
    loopMeasures: stage.loopMeasures || 8,
    measureCount: stage.measureCount || 8,
    chordProgressionData: stage.chordProgressionData || null,
    rhythmData: stage.rhythmData || null,
    mp3Url: stage.mp3Url || '/demo-1.mp3',
  }), [stage]);

  // ゲームタイプに基づいて分岐
  if (extendedStage.gameType === 'rhythm') {
    return (
      <RhythmFantasyGame
        stage={extendedStage}
        onChordCorrect={(_chord, _isSpecial, _damageDealt, _defeated, _monsterId) => {
          // リズムモードでの成功処理（現在は何も処理しない）
        }}
        onChordIncorrect={(_expectedChord, _inputNotes) => {
          // リズムモードでの失敗処理（現在は何も処理しない）
        }}
        onGameComplete={(result) => {
          // ゲーム完了時の処理
          const score = rhythmStore.score;
          const correctAnswers = rhythmStore.defeatedEnemies;
          const totalQuestions = extendedStage.enemyCount;
          props.onGameComplete(result, score, correctAnswers, totalQuestions);
        }}
        onBackToStageSelect={props.onBackToStageSelect}
        onEnemyAttack={(_attackingMonsterId) => {
          // 敵攻撃時の処理（現在は何も処理しない）
        }}
      />
    );
  }

  // クイズモード（既存）
  return <FantasyGameScreen {...props} />;
};

export default FantasyGameMode;