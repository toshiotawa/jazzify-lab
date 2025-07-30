/**
 * ファンタジーリズムゲームエンジン
 * リズムに合わせてコードを演奏するゲームモード
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';
import { RhythmMusicManager } from '@/utils/RhythmMusicManager';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { devLog } from '@/utils/logger';
import type { 
  RhythmGameState, 
  RhythmGameEngineProps,
  JudgmentType 
} from '@/types/rhythm';
import type { FantasyStage } from '@/types';
import { getChordDefinition } from '@/utils/fantasyChordHelper';

export const useFantasyRhythmEngine = ({
  stage,
  onGameStateChange,
  onChordJudge,
  onGameComplete,
  onMonsterDefeat,
}: RhythmGameEngineProps) => {
  const rhythmStore = useRhythmStore();
  const musicManager = useRef(RhythmMusicManager.getInstance());
  const animationFrameId = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ゲーム状態の変更を通知
  useEffect(() => {
    const unsubscribe = useRhythmStore.subscribe(
      (state) => state.gameState,
      (gameState) => {
        onGameStateChange(gameState);
      }
    );
    
    return () => unsubscribe();
  }, [onGameStateChange]);
  
  // ゲーム初期化
  const initializeGame = useCallback(async () => {
    if (!stage) return;
    
    try {
      devLog.debug('リズムゲーム初期化開始:', stage.name);
      
      // 音楽ファイルの読み込み
      const mp3Url = stage.mp3_url || '/demo-1.mp3';
      await musicManager.current.loadMusic(mp3Url);
      
      // ゲーム状態の初期化
      rhythmStore.initializeGame(stage, getChordDefinition);
      
      // 音楽の再生開始
      const bpm = stage.bpm || 120;
      const timeSignature = stage.time_signature || 4;
      const loopMeasures = stage.loop_measures || 8;
      musicManager.current.play(bpm, timeSignature, loopMeasures);
      
      // リズムストアの再生状態を更新
      rhythmStore.startMusic();
      
      setIsInitialized(true);
      devLog.debug('リズムゲーム初期化完了');
    } catch (error) {
      devLog.error('リズムゲーム初期化エラー:', error);
      // エラー処理
    }
  }, [stage, rhythmStore]);
  
  // ゲームループ
  const gameLoop = useCallback((timestamp: number) => {
    if (!rhythmStore.gameState.isGameActive) return;
    
    // フレームレート制限（60fps）
    const deltaTime = timestamp - lastUpdateTime.current;
    if (deltaTime < 16.67) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    lastUpdateTime.current = timestamp;
    
    // 音楽時間を取得してゲーム時間を更新
    const currentTime = musicManager.current.getCurrentTime();
    const { measure, beat } = musicManager.current.getMeasureAndBeat(
      stage?.bpm || 120,
      stage?.time_signature || 4
    );
    rhythmStore.updateGameTime(currentTime, measure, beat);
    
    // ゲーム終了判定
    const { isGameOver, gameResult } = rhythmStore.gameState;
    if (isGameOver && gameResult && !rhythmStore.gameState.isCompleting) {
      rhythmStore.setGameOver(gameResult);
      onGameComplete(gameResult, rhythmStore.gameState);
      return;
    }
    
    // 次フレームのリクエスト
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [rhythmStore, onGameComplete]);
  
  // ゲーム開始
  const startGame = useCallback(() => {
    if (!isInitialized) {
      devLog.error('ゲームが初期化されていません');
      return;
    }
    
    devLog.debug('リズムゲーム開始');
    lastUpdateTime.current = performance.now();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [isInitialized, gameLoop]);
  
  // ゲーム停止
  const stopGame = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    musicManager.current.stop();
    rhythmStore.resetGame();
    
    devLog.debug('リズムゲーム停止');
  }, [rhythmStore]);
  
  // コード入力処理
  const handleChordInput = useCallback((chordNotes: number[]) => {
    if (!rhythmStore.gameState.isGameActive) return;
    
    const currentTime = musicManager.current.getCurrentTime();
    const { judgment, monsterId } = rhythmStore.judgeInput(chordNotes, currentTime);
    
    // 判定結果の通知
    if (monsterId) {
      const monster = rhythmStore.gameState.activeMonsters.find(m => m.id === monsterId);
      if (monster) {
        onChordJudge(judgment, monster.chordTarget.id, monsterId);
        
        // 効果音再生
        if (judgment === 'perfect' || judgment === 'good') {
          FantasySoundManager.playMagic('fire');
        }
        
        // モンスター撃破判定
        if (monster.currentHp <= 0) {
          onMonsterDefeat(monsterId);
        }
      }
    }
    
    devLog.debug('コード入力判定:', judgment);
  }, [rhythmStore, onChordJudge, onMonsterDefeat]);
  
  // 初期化処理
  useEffect(() => {
    if (stage) {
      initializeGame();
    }
    
    return () => {
      stopGame();
    };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ゲーム開始処理
  useEffect(() => {
    if (isInitialized && rhythmStore.gameState.isGameActive) {
      startGame();
    }
  }, [isInitialized, rhythmStore.gameState.isGameActive, startGame]);
  
  return {
    gameState: rhythmStore.gameState,
    isInitialized,
    handleChordInput,
    startGame,
    stopGame,
  };
};

// 型のエクスポート
export type { 
  RhythmGameState,
  RhythmGameEngineProps,
  JudgmentType
};