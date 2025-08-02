import { useEffect, useRef, useCallback } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useEnemyStore } from '@/stores/enemyStore';
import { FantasyStage, MonsterState } from './FantasyGameEngine';
import { devLog } from '@/utils/logger';

type GamePhase = 'ready' | 'playing' | 'clear' | 'gameover';

interface RhythmGameState {
  phase: GamePhase;
  playerHp: number;
  totalDamageDealt: number;
  successCount: number;
  monsters: MonsterState[];
  currentMonsterIndex: number;
}

interface UseRhythmGameEngineProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, successCount: number) => void;
}

export const useRhythmGameEngine = ({ stage, onGameComplete }: UseRhythmGameEngineProps) => {
  const gameStateRef = useRef<RhythmGameState>({
    phase: 'ready',
    playerHp: stage.maxHp,
    totalDamageDealt: 0,
    successCount: 0,
    monsters: [],
    currentMonsterIndex: 0
  });
  
  const { 
    setStage, 
    generateInitialNotes, 
    generateNotesForMeasure,
    judgeInput, 
    cleanupOldNotes,
    reset: resetRhythm,
    notes,
    lastGeneratedMeasure
  } = useRhythmStore();
  
  const { 
    currentMeasure, 
    isCountIn, 
    getCurrentTime,
    startAt,
    readyDuration,
    measureCount
  } = useTimeStore();
  
  const { setEnrage } = useEnemyStore();
  
  // 初期化
  useEffect(() => {
    devLog.debug('🎮 RhythmGameEngine: Initializing');
    
    // ステージ設定
    setStage(stage);
    
    // モンスター初期化（敵は1体固定）
    const monsters: MonsterState[] = [{
      id: 'rhythm-monster-1',
      index: 0,
      position: 'A',
      currentHp: stage.enemyHp,
      maxHp: stage.enemyHp,
      gauge: 0,
      chordTarget: {
        id: '',
        displayName: '',
        notes: [],
        noteNames: [],
        quality: '',
        root: ''
      },
      correctNotes: [],
      icon: stage.monsterIcon || 'fa-dragon',
      name: 'リズムモンスター'
    }];
    
    gameStateRef.current = {
      ...gameStateRef.current,
      monsters,
      phase: 'ready'
    };
    
    // 初期ノーツ生成
    generateInitialNotes();
    
    return () => {
      resetRhythm();
    };
  }, [stage, setStage, generateInitialNotes, resetRhythm]);
  
  // ゲームフェーズ管理
  useEffect(() => {
    if (!startAt) return;
    
    const elapsed = performance.now() - startAt;
    const currentState = gameStateRef.current;
    
    if (elapsed < readyDuration && currentState.phase === 'ready') {
      // Ready フェーズ
    } else if (currentState.phase === 'ready') {
      // Ready → Playing
      gameStateRef.current.phase = 'playing';
      devLog.debug('🎮 RhythmGameEngine: Phase changed to playing');
    }
  }, [startAt, readyDuration, currentMeasure]);
  
  // ランダムパターンの動的ノーツ生成
  useEffect(() => {
    if (!stage.chord_progression_data && currentMeasure > 0) {
      // 現在の小節に対応するノーツがあるかチェック
      const hasNoteForCurrentMeasure = notes.some(note => note.measure === currentMeasure);
      
      if (!hasNoteForCurrentMeasure) {
        generateNotesForMeasure(currentMeasure);
        devLog.debug(`🎵 Generated notes for measure ${currentMeasure}`);
      }
      
      // 先読み生成（次の2小節分）
      for (let i = 1; i <= 2; i++) {
        const nextMeasure = ((currentMeasure + i - 1) % (measureCount || 8)) + 1;
        const hasNoteForNextMeasure = notes.some(note => note.measure === nextMeasure);
        if (!hasNoteForNextMeasure) {
          generateNotesForMeasure(nextMeasure);
        }
      }
    }
  }, [currentMeasure, generateNotesForMeasure, stage.chord_progression_data, measureCount, notes]);
  
  // 古いノーツのクリーンアップ
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = getCurrentTime();
      cleanupOldNotes(currentTime);
    }, 1000); // 1秒ごとにクリーンアップ
    
    return () => clearInterval(interval);
  }, [getCurrentTime, cleanupOldNotes]);
  
  // コード入力処理
  const handleChordInput = useCallback((inputChord: string) => {
    const currentTime = getCurrentTime();
    const result = judgeInput(inputChord, currentTime);
    const currentState = gameStateRef.current;
    
    if (result === 'perfect') {
      // 攻撃成功
      const damage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
      const currentMonster = currentState.monsters[currentState.currentMonsterIndex];
      
      if (currentMonster) {
        currentMonster.currentHp = Math.max(0, currentMonster.currentHp - damage);
        gameStateRef.current.totalDamageDealt += damage;
        gameStateRef.current.successCount += 1;
        
        // エフェクト用に怒りフラグを立てる
        setEnrage(currentMonster.id, true);
        setTimeout(() => setEnrage(currentMonster.id, false), 300);
        
        devLog.debug('🎯 Attack success!', { damage, remainingHp: currentMonster.currentHp });
        
        // モンスター撃破チェック
        if (currentMonster.currentHp <= 0) {
          
          // 次のモンスターへ（リズムモードでは常に新しいモンスターを生成）
          const nextIndex = currentState.currentMonsterIndex + 1;
          if (nextIndex < stage.enemyCount) {
            const newMonster: MonsterState = {
              id: `rhythm-monster-${nextIndex + 1}`,
              index: nextIndex,
              position: 'A',
              currentHp: stage.enemyHp,
              maxHp: stage.enemyHp,
              gauge: 0,
              chordTarget: {
                id: '',
                displayName: '',
                notes: [],
                noteNames: [],
                quality: '',
                root: ''
              },
              correctNotes: [],
              icon: stage.monsterIcon || 'fa-dragon',
              name: 'リズムモンスター'
            };
            currentState.monsters.push(newMonster);
            gameStateRef.current.currentMonsterIndex = nextIndex;
          } else {
            // 全モンスター撃破 → クリア
            gameStateRef.current.phase = 'clear';
            onGameComplete('clear', gameStateRef.current.totalDamageDealt, gameStateRef.current.successCount);
          }
        }
      }
    } else if (result === 'miss') {
      // 攻撃失敗（敵の攻撃として扱う）
      handleEnemyAttack();
    }
  }, [getCurrentTime, judgeInput, stage, setEnrage, onGameComplete]);
  
  // 敵の攻撃処理（判定失敗時）
  const handleEnemyAttack = useCallback(() => {
    gameStateRef.current.playerHp = Math.max(0, gameStateRef.current.playerHp - 1);
    devLog.debug('💔 Player damaged!', { remainingHp: gameStateRef.current.playerHp });
    
    if (gameStateRef.current.playerHp <= 0) {
      gameStateRef.current.phase = 'gameover';
      onGameComplete('gameover', gameStateRef.current.totalDamageDealt, gameStateRef.current.successCount);
    }
  }, [onGameComplete]);
  
  // 判定ウィンドウを過ぎたノーツの自動miss判定
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current.phase !== 'playing') return;
      
      const currentTime = getCurrentTime();
      const oldNotesCount = notes.filter(note => 
        !note.judged && 
        note.time + 0.2 < currentTime // 判定ウィンドウ外
      ).length;
      
      // miss判定されたノーツ分だけ敵の攻撃
      for (let i = 0; i < oldNotesCount; i++) {
        handleEnemyAttack();
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [notes, getCurrentTime, handleEnemyAttack]);
  
  return {
    gameState: gameStateRef.current,
    handleChordInput,
    notes,
    isPlaying: gameStateRef.current.phase === 'playing',
    isCountIn
  };
};