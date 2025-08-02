/**
 * リズムゲームエンジン
 * リズムモードのゲームロジックを管理
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { devLog } from '@/utils/logger';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';
import { useEnemyStore } from '@/stores/enemyStore';
import { inWindow } from '@/utils/judgeWindow';
import { resolveChord } from '@/utils/chord-utils';
import type { FantasyStage } from './FantasyGameEngine';

interface RhythmEngineProps {
  stage: FantasyStage;
  playerHp: number;
  playerSp: number;
  onPlayerDamage: (damage: number) => void;
  onPlayerSpChange: (sp: number) => void;
  onGameComplete: (result: 'clear' | 'gameover') => void;
  minDamage: number;
  maxDamage: number;
}

/**
 * リズムゲームエンジンコンポーネント
 * timeStoreのtickを購読し、判定とゲーム進行を管理
 */
export const RhythmEngine: React.FC<RhythmEngineProps> = ({
  stage,
  playerHp,
  playerSp,
  onPlayerDamage,
  onPlayerSpChange,
  onGameComplete,
  minDamage,
  maxDamage,
}) => {
  const { generate, tick, reset, questions, pointer } = useRhythmStore();
  const { startAt, isCountIn } = useTimeStore();
  const { setEnrage } = useEnemyStore();
  
  // 判定済みフラグ（同じノーツを複数回判定しないため）
  const judgedRef = useRef<Set<string>>(new Set());
  
  // 前回のポインタ位置を記録（ループ検出用）
  const lastPointerRef = useRef(0);
  
  // ゲーム初期化
  useEffect(() => {
    if (stage && startAt) {
      const now = Date.now();
      const readyTime = 3000; // 3秒の準備時間
      generate(stage, now, readyTime);
      judgedRef.current.clear();
      lastPointerRef.current = 0;
      devLog.debug('🎮 Rhythm Engine initialized', { stage, now });
    }
    
    return () => {
      reset();
    };
  }, [stage, startAt, generate, reset]);
  
  // キー入力ハンドラ
  const handleKeyPress = useCallback((chord: string) => {
    const currentQuestion = questions[pointer];
    if (!currentQuestion || judgedRef.current.has(currentQuestion.id)) {
      return;
    }
    
    const now = Date.now();
    const isSuccess = inWindow(now, currentQuestion.targetMs) && chord === currentQuestion.chord;
    
    if (isSuccess) {
      // 成功：プレイヤー攻撃
      judgedRef.current.add(currentQuestion.id);
      const damage = minDamage + Math.floor(Math.random() * (maxDamage - minDamage + 1));
      // Note: enemyStore doesn't have attack method, we'll handle damage in the parent component
      
      // SP増加
      const newSp = Math.min(playerSp + 1, 5);
      onPlayerSpChange(newSp);
      
      devLog.debug('✅ Rhythm hit success', { chord, question: currentQuestion, damage });
    }
  }, [questions, pointer, minDamage, maxDamage, playerSp, onPlayerSpChange]);
  
  // timeStore購読による判定処理
  useEffect(() => {
    const unsubscribe = useTimeStore.subscribe((state) => {
      if (!state.startAt || state.isCountIn) {
        return;
      }
      
      const now = Date.now();
      const currentQuestion = tick(now);
      
      if (currentQuestion && !judgedRef.current.has(currentQuestion.id)) {
        // 判定時刻を過ぎた場合の失敗処理
        if (now > currentQuestion.targetMs + 200) {
          judgedRef.current.add(currentQuestion.id);
          onPlayerDamage(10); // 固定ダメージ
          onPlayerSpChange(0); // SPリセット
          devLog.debug('❌ Rhythm miss', { question: currentQuestion });
        }
      }
      
      // ループ検出と再生成
      if (pointer < lastPointerRef.current) {
        // ポインタが戻った = ループした
        const readyTime = 2000; // 2秒先の譜面を生成
        generate(stage, now, readyTime);
        judgedRef.current.clear();
        devLog.debug('🔄 Rhythm loop detected, regenerating', { pointer });
      }
      lastPointerRef.current = pointer;
    });
    
    return unsubscribe;
  }, [stage, tick, pointer, generate, onPlayerDamage, onPlayerSpChange]);
  
  // ゲーム終了判定
  useEffect(() => {
    if (playerHp <= 0) {
      onGameComplete('gameover');
    }
    // リズムモードではクリア条件なし（無限ループ）
  }, [playerHp, onGameComplete]);
  
  // キーボードイベントの登録
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 数字キーでコード入力（1-8）
      const keyMap: Record<string, string> = {
        '1': 'C',
        '2': 'D',
        '3': 'E',
        '4': 'F',
        '5': 'G',
        '6': 'A',
        '7': 'B',
        '8': 'C7',
      };
      
      const chord = keyMap[e.key];
      if (chord) {
        handleKeyPress(chord);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyPress]);
  
  // このコンポーネントは描画しない（ロジックのみ）
  return null;
};