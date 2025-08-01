import { useEffect, useMemo } from 'react';
import { useRhythmEngine } from '@/hooks/useRhythmEngine';
import { FantasyStage, FantasyGameState, FantasyGameEngineProps } from './FantasyGameEngine';
import type { DisplayOpts } from '@/utils/display-note';

export const useRhythmGameEngine = ({ 
  stage,
  onGameStateChange,
  onChordCorrect: _onChordCorrect,
  onChordIncorrect: _onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
  displayOpts: _displayOpts = { lang: 'en', simple: false }
}: FantasyGameEngineProps & { displayOpts?: DisplayOpts }) => {
  // Convert stage format to RhythmStageInfo format
  const isProgressionMode = !!(stage as FantasyStage)?.chord_progression_data?.chords;
  const rhythmStageInfo = stage ? {
    id: stage.id,
    allowedChords: stage.allowedChords,
    bpm: stage.bpm,
    measureCount: stage.measureCount || 8,
    timeSignature: stage.timeSignature || 4,
    countInMeasures: stage.countInMeasures || 0,
    chordProgressionData: (stage as FantasyStage).chord_progression_data?.chords || null,
    mode: isProgressionMode ? 'progression' : 'random' as 'random' | 'progression',
    // リズムモードでは同時出現数を固定: ランダム=1体、プログレッション=拍子数
    simultaneousMonsterCount: isProgressionMode ? (stage.timeSignature || 4) : 1
  } : null;
  
  const { gameState, handleInput, gaugeProgress, startGame, isStarted } = useRhythmEngine(
    rhythmStageInfo,
    () => {
      // onComplete callback
      if (stage) {
        onGameComplete('clear', {
          currentStage: stage,
          currentQuestionIndex: 0,
          currentChordTarget: null,
          playerHp: stage.maxHp,
          enemyGauge: 0,
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          isGameActive: false,
          isGameOver: false,
          gameResult: 'clear',
          currentEnemyIndex: 0,
          currentEnemyHits: 0,
          enemiesDefeated: 0,
          totalEnemies: 0,
          currentEnemyHp: 1,
          maxEnemyHp: 1,
          correctNotes: [],
          isWaitingForNextMonster: false,
          playerSp: 0,
          activeMonsters: [],
          monsterQueue: [],
          simultaneousMonsterCount: 1,
          isCompleting: false
        } as FantasyGameState);
      }
    },
    (monsterId: string) => {
      // onFail callback - call onEnemyAttack instead of resetting the game
      onEnemyAttack(monsterId);
    }
  );

  // Convert rhythm game state to FantasyGameState format
  const fantasyGameState: FantasyGameState = useMemo(() => {
    return {
      currentStage: stage,
      currentQuestionIndex: 0,
      currentChordTarget: gameState.activeQuestions.length > 0 ? {
        id: gameState.activeQuestions[0].chord,
        displayName: gameState.activeQuestions[0].chord,
        notes: [],
        noteNames: [],
        quality: '',
        root: ''
      } : null,  // ★ activeQuestionsから最初のコードを取得
      playerHp: stage?.maxHp || 5,
      enemyGauge: 0,
      score: 0,
      totalQuestions: gameState.total,
      correctAnswers: gameState.defeated,
      isGameActive: isStarted,  // ★ isStartedを使用
      isGameOver: false,
      gameResult: null,
      currentEnemyIndex: 0,
      currentEnemyHits: 0,
      enemiesDefeated: gameState.defeated,
      totalEnemies: gameState.total,
      currentEnemyHp: 1,
      maxEnemyHp: 1,
      correctNotes: [],
      isWaitingForNextMonster: false,
      playerSp: 0,
      activeMonsters: gameState.activeQuestions.map((q, idx) => ({
        id: q.id,
        index: idx,
        position: q.position as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
        currentHp: 1,
        maxHp: 1,
        gauge: gaugeProgress * 100,
        chordTarget: {
          id: q.chord,
          displayName: q.chord,
          notes: [],
          noteNames: [],
          quality: '',
          root: ''
        },
        correctNotes: [],
        icon: stage?.monsterIcon || 'fa-drum',
        name: `Monster ${idx}`
      })),
      monsterQueue: [],
      simultaneousMonsterCount: stage?.simultaneousMonsterCount || 1,
      isCompleting: false
    };
  }, [gameState, gaugeProgress, isStarted, stage]);

  useEffect(() => {
    onGameStateChange(fantasyGameState);
  }, [gameState, gaugeProgress, isStarted, onGameStateChange]); // fantasyGameStateを削除し、isStartedを追加

  // 入力ハンドラを親に渡すため返す（従来 API 維持）
  return {
    gameState: fantasyGameState,
    handleNoteInput: handleInput,
    handleMidiInput: handleInput,
    initializeGame: startGame,  // ★ startGame関数を使用
    stopGame: () => {},
    getCurrentEnemy: (index: number) => {
      // リズムモードでは activeMonsters から取得
      const monsters = fantasyGameState.activeMonsters;
      if (monsters && monsters.length > index) {
        return {
          icon: monsters[index].icon,
          name: monsters[index].name,
          hp: monsters[index].currentHp,
          maxHp: monsters[index].maxHp
        };
      }
      return null;
    },
    proceedToNextEnemy: () => {},
    imageTexturesRef: { current: new Map() },
    ENEMY_LIST: []
  };
};