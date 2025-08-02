/**
 * リズムゲーム画面
 * ファンタジーゲームのリズムモード専用UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { bgmManager } from '@/utils/BGMManager';
import { useTimeStore } from '@/stores/timeStore';
import { useEnemyStore } from '@/stores/enemyStore';
import { RhythmEngine } from './RhythmEngine';
import { PIXIRhythmRenderer } from './PIXIRhythmRenderer';
import { FantasyPIXIRenderer } from './FantasyPIXIRenderer';
import type { FantasyStage } from './FantasyGameEngine';

interface RhythmGameScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
}

/**
 * リズムゲーム画面コンポーネント
 */
const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({
  stage,
  autoStart = false,
  onGameComplete,
  onBackToStageSelect,
}) => {
  // ゲーム状態
  const [playerHp, setPlayerHp] = useState(stage.maxHp);
  const [playerSp, setPlayerSp] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameResult, setGameResult] = useState<'clear' | 'gameover' | null>(null);
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  
  const { setStart, startAt } = useTimeStore();
  const { setEnrage } = useEnemyStore();
  
  // ゲーム開始処理
  const startGame = useCallback(() => {
    devLog.debug('🎮 Starting rhythm game', { stage });
    
    // 状態リセット
    setPlayerHp(stage.maxHp);
    setPlayerSp(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setIsGameActive(true);
    setGameResult(null);
    
    // BGM開始
    if (stage.bgmUrl) {
      bgmManager.play(
        stage.bgmUrl,
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 2
      );
    }
    
    // タイマー開始
    setStart(
      stage.bpm || 120,
      stage.timeSignature || 4,
      stage.measureCount || 8,
      stage.countInMeasures || 2
    );
  }, [stage, setStart]);
  
  // 自動開始
  useEffect(() => {
    if (autoStart && !isGameActive) {
      startGame();
    }
  }, [autoStart, isGameActive, startGame]);
  
  // プレイヤーダメージ処理
  const handlePlayerDamage = useCallback((damage: number) => {
    setPlayerHp(prev => {
      const newHp = Math.max(0, prev - damage);
      if (newHp < prev) {
        // ダメージエフェクト
        setDamageShake(true);
        setTimeout(() => setDamageShake(false), 500);
      }
      return newHp;
    });
    setTotalQuestions(prev => prev + 1);
  }, []);
  
  // SP変更処理
  const handleSpChange = useCallback((sp: number) => {
    setPlayerSp(sp);
  }, []);
  
  // ゲーム完了処理
  const handleGameComplete = useCallback((result: 'clear' | 'gameover') => {
    if (gameResult) return; // 二重実行防止
    
    setGameResult(result);
    setIsGameActive(false);
    bgmManager.stop();
    
    // オーバーレイ表示
    setOverlay({ text: result === 'clear' ? 'STAGE CLEAR!' : 'GAME OVER' });
    
    // 結果通知
    setTimeout(() => {
      onGameComplete(result, score, correctAnswers, totalQuestions);
    }, 2000);
  }, [gameResult, score, correctAnswers, totalQuestions, onGameComplete]);
  
  // 成功時の処理（エンジンからのコールバック用）
  // Note: In rhythm mode, we track score differently since enemyStore doesn't have attack tracking
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      bgmManager.stop();
    };
  }, []);
  
  return (
    <div className={cn(
      'fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
      damageShake && 'animate-shake'
    )}>
      {/* ゲームエンジン（非表示） */}
      {isGameActive && (
        <RhythmEngine
          stage={stage}
          playerHp={playerHp}
          playerSp={playerSp}
          onPlayerDamage={handlePlayerDamage}
          onPlayerSpChange={handleSpChange}
          onGameComplete={handleGameComplete}
          minDamage={stage.minDamage}
          maxDamage={stage.maxDamage}
        />
      )}
      
      {/* メインゲーム画面 */}
      <div className="relative h-full flex flex-col">
        {/* ヘッダー情報 */}
        <div className="flex justify-between items-start p-4">
          {/* プレイヤー情報 */}
          <div className="bg-black/30 backdrop-blur rounded-lg p-4">
            <div className="text-white mb-2">
              <span className="text-sm opacity-70">HP</span>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-8 h-2 rounded',
                      i < Math.ceil(playerHp / (stage.maxHp / 10))
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    )}
                  />
                ))}
              </div>
              <span className="text-xl font-bold ml-2">{playerHp}/{stage.maxHp}</span>
            </div>
            
            <div className="text-white">
              <span className="text-sm opacity-70">SP</span>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-4 h-4 rounded-full',
                      i < playerSp
                        ? 'bg-yellow-400'
                        : 'bg-gray-600'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* スコア情報 */}
          <div className="bg-black/30 backdrop-blur rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">Score: {score}</div>
            <div className="text-sm opacity-70">
              Success: {correctAnswers} / {totalQuestions}
            </div>
          </div>
          
          {/* 戻るボタン */}
          <button
            onClick={onBackToStageSelect}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ステージ選択へ
          </button>
        </div>
        
        {/* ゲームフィールド */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* 敵キャラクター表示 */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <FantasyPIXIRenderer
              width={800}
              height={400}
              monsterIcon={stage.monsterIcon}
              enemyGauge={0}
            />
          </div>
          
          {/* リズム譜面表示 */}
          <div className="absolute bottom-32">
            <PIXIRhythmRenderer
              width={1200}
              height={200}
            />
          </div>
          
          {/* 操作説明 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur rounded-lg p-4">
            <p className="text-white text-center">
              数字キー [1-8] でコードを入力！タイミングを合わせて押そう！
            </p>
          </div>
        </div>
      </div>
      
      {/* オーバーレイ */}
      {overlay && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-6xl font-bold text-white animate-pulse">
            {overlay.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default RhythmGameScreen;