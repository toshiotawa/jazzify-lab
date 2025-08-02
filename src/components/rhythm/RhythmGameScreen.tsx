/**
 * リズムゲーム画面
 * リズムモードのメイン画面
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';

import { useGameStore } from '@/stores/gameStore';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore } from '@/stores/rhythmStore';
import { bgmManager } from '@/utils/BGMManager';
import { FantasySoundManager } from '@/utils/FantasySoundManager';


import RhythmGameEngine from './RhythmGameEngine';
import RhythmNotesRenderer from './RhythmNotesRenderer';
import FantasyEffects from '../fantasy/FantasyEffects';
import { MONSTERS } from '@/data/monsters';
import type { FantasyStage } from '@/types';
import type { DisplayOpts } from '@/utils/display-note';

interface RhythmGameScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({
  stage,
  autoStart = false,
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false,
  lessonMode: _lessonMode = false
}) => {
  // ストア
  const { settings } = useGameStore();
  const { setStart, startAt, currentBeat, currentMeasure, isCountIn, tick } = useTimeStore();
  const { currentChord, windowStart, windowEnd, pending, reset: resetRhythm } = useRhythmStore();
  
  // ローカル状態
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [playerHp, setPlayerHp] = useState(stage.max_hp || 5);
  const [spGauge, setSpGauge] = useState(0);
  const [isSpReady, setIsSpReady] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  const [heartFlash, setHeartFlash] = useState(false);
  const [_attackEffects, _setAttackEffects] = useState<Array<{
    id: string;
    type: 'player' | 'enemy';
    x: number;
    y: number;
    damage?: number;
  }>>([]);
  
  // Ref
  const notesAreaRef = useRef<HTMLDivElement>(null);
  const [notesAreaWidth, setNotesAreaWidth] = useState(800);

  
  // タイムストア初期化とtick
  useEffect(() => {
    const id = setInterval(() => tick(), 100);
    return () => clearInterval(id);
  }, [tick]);
  
  // ノーツエリアのサイズ監視
  useEffect(() => {
    const update = () => {
      if (notesAreaRef.current) {
        setNotesAreaWidth(notesAreaRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (notesAreaRef.current) {
      ro.observe(notesAreaRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  
  // ゲーム開始処理
  const startGame = useCallback(() => {
    devLog.debug('Starting rhythm game', { stage });
    
    // 時間ストア初期化
    setStart(
      stage.bpm || 120,
      stage.time_signature || 4,
      stage.measure_count || 8,
      stage.count_in_measures || 1
    );
    
    // BGM再生
    if (stage.mp3_url) {
      bgmManager.play(
        stage.mp3_url,
        stage.bpm || 120,
        stage.time_signature || 4,
        stage.measure_count || 8,
        stage.count_in_measures || 1,
        settings.bgmVolume ?? 0.7
      );
    }
    
    // SE準備
    FantasySoundManager.setVolume(settings.soundEffectVolume ?? 0.7);
    FantasySoundManager.setRootVolume(settings.rootSoundVolume ?? 0.5);
    FantasySoundManager.enableRootSound(settings.playRootSound ?? true);
    
    setGameState('playing');
  }, [stage, setStart, settings]);
  
  // 自動開始
  useEffect(() => {
    if (autoStart && gameState === 'ready') {
      const timer = setTimeout(() => startGame(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, gameState, startGame]);
  
  // イベントハンドラ
  const handleCorrectInput = useCallback(() => {
    devLog.debug('Correct input');
    FantasySoundManager.playMyAttack();
    setTotalCorrect(prev => prev + 1);
    setTotalQuestions(prev => prev + 1);
    
    // SPゲージ増加
    setSpGauge(prev => {
      const next = Math.min(100, prev + 10);
      if (next >= 100 && !isSpReady) {
        setIsSpReady(true);
        FantasySoundManager.playMagic('thunder');
      }
      return next;
    });
  }, [isSpReady]);
  
  const handleWrongInput = useCallback(() => {
    devLog.debug('Wrong input');
    FantasySoundManager.playEnemyAttack();
    setTotalQuestions(prev => prev + 1);
  }, []);
  
  const handlePlayerAttack = useCallback((damage: number) => {
    devLog.debug('Player attack', { damage });
    
    // 攻撃エフェクト
    const effect = {
      id: Date.now().toString(),
      type: 'player' as const,
      x: window.innerWidth / 2,
      y: 200,
      damage
    };
    _setAttackEffects(prev => [...prev, effect]);
    
    // エフェクト削除
    setTimeout(() => {
      _setAttackEffects(prev => prev.filter(e => e.id !== effect.id));
    }, 1000);
  }, []);
  
  const handleEnemyAttack = useCallback((damage: number) => {
    devLog.debug('Enemy attack', { damage });
    FantasySoundManager.playEnemyAttack();
    
    // ダメージエフェクト
    setDamageShake(true);
    setHeartFlash(true);
    setTimeout(() => {
      setDamageShake(false);
      setHeartFlash(false);
    }, 500);
    
    // 攻撃エフェクト
    const effect = {
      id: Date.now().toString(),
      type: 'enemy' as const,
      x: window.innerWidth / 2,
      y: window.innerHeight - 150,
      damage
    };
    _setAttackEffects(prev => [...prev, effect]);
    
    setTimeout(() => {
      _setAttackEffects(prev => prev.filter(e => e.id !== effect.id));
    }, 1000);
  }, []);
  
  const handleGameComplete = useCallback(() => {
    devLog.debug('Game complete');
    bgmManager.stop();
    setGameState('complete');
    
    const result = playerHp > 0 ? 'clear' : 'gameover';
    const score = Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100);
    
    if (result === 'clear') {
      FantasySoundManager.playMagic('ice'); // クリア音として使用
      setOverlay({ text: 'STAGE CLEAR!' });
    } else {
      FantasySoundManager.playEnemyAttack(); // ゲームオーバー音として使用
      setOverlay({ text: 'GAME OVER' });
    }
    
    setTimeout(() => {
      onGameComplete(result, score, totalCorrect, totalQuestions);
    }, 2000);
  }, [playerHp, totalCorrect, totalQuestions, onGameComplete]);
  
  // SP攻撃
  const handleSpAttack = useCallback(() => {
    if (!isSpReady) return;
    
    devLog.debug('SP Attack!');
    FantasySoundManager.playMagic('fire');
    setSpGauge(0);
    setIsSpReady(false);
    
    // 全ノーツをクリア（演出として）
    resetRhythm();
    
    // 大ダメージ
    const damage = 10;
    handlePlayerAttack(damage);
  }, [isSpReady, resetRhythm, handlePlayerAttack]);
  
  // プレイヤーHP監視
  useEffect(() => {
    if (playerHp <= 0 && gameState === 'playing') {
      handleGameComplete();
    }
  }, [playerHp, gameState, handleGameComplete]);
  
  // エンジンの実行
  const engineResult = RhythmGameEngine({
    stage: {
      ...stage,
      stageNumber: stage.stage_number,
      name: stage.name,
      maxHp: stage.max_hp,
      enemyGaugeSeconds: stage.enemy_gauge_seconds,
      enemyCount: stage.enemy_count,
      enemyHp: stage.enemy_hp,
      minDamage: stage.min_damage,
      maxDamage: stage.max_damage,
      allowedChords: stage.allowed_chords,
      bpm: stage.bpm || 120,
      measureCount: stage.measure_count || 8,
      timeSignature: stage.time_signature || 4,
      countInMeasures: stage.count_in_measures || 1
    },
    noteNameLang,
    simpleNoteName,
    bgmManager,
    onCorrectInput: handleCorrectInput,
    onWrongInput: handleWrongInput,
    onPlayerAttack: handlePlayerAttack,
    onEnemyAttack: handleEnemyAttack,
    onGameComplete: handleGameComplete,
    playerHp,
    setPlayerHp
  });
  
  // 現在のモンスター情報
  const currentMonster = MONSTERS.find(m => m.id === engineResult?.currentMonsterId) || MONSTERS[0];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* 背景エフェクト */}
      <div className="absolute inset-0 bg-[url('/fantasy-bg-pattern.png')] opacity-10" />
      
      {/* オーバーレイ */}
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-6xl font-bold text-white animate-pulse">
            {overlay.text}
          </div>
        </div>
      )}
      
      {/* ヘッダー */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <button
          onClick={() => {
            bgmManager.stop();
            onBackToStageSelect();
          }}
          className="px-4 py-2 bg-white bg-opacity-20 rounded-lg text-white hover:bg-opacity-30 transition-colors"
        >
          ← 戻る
        </button>
        
        <div className="text-white text-center">
          <div className="text-xl font-bold">{stage.name}</div>
          <div className="text-sm opacity-80">
            {isCountIn ? `M / - B ${currentBeat}` : `M ${currentMeasure} - B ${currentBeat}`}
          </div>
        </div>
        
        <div className="text-white text-right">
          <div className="text-sm">Score</div>
          <div className="text-xl font-bold">{totalCorrect}/{totalQuestions}</div>
        </div>
      </div>
      
      {/* メインゲームエリア */}
      <div className={cn(
        "relative mx-auto max-w-6xl px-4",
        damageShake && "animate-shake"
      )}>
        {/* モンスターエリア */}
        <div className="relative h-64 mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* モンスター画像 */}
              <img
                src={`/monster_images/${currentMonster.iconFile}`}
                alt={currentMonster.name}
                className="h-48 w-48 object-contain"
              />
              
              {/* HP バー */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32">
                <div className="bg-black bg-opacity-50 rounded-full p-1">
                  <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-red-500 h-full transition-all duration-300"
                      style={{
                        width: `${((engineResult?.currentEnemyHp || 0) / stage.enemy_hp) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* 怒りゲージ */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32">
                <div className="bg-black bg-opacity-50 rounded-full p-1">
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all duration-100"
                      style={{
                        width: `${engineResult?.enrageLevel || 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ノーツレンダラー */}
        <div
          ref={notesAreaRef}
          className="relative bg-black bg-opacity-30 rounded-xl overflow-hidden mb-8"
          style={{ height: 200 }}
        >
          {startAt && (
            <RhythmNotesRenderer
              pendingNotes={pending}
              containerWidth={notesAreaWidth}
              containerHeight={200}
              bpm={stage.bpm || 120}
              timeSignature={stage.time_signature || 4}
              startAt={startAt}
              isCountIn={isCountIn}
              currentChord={currentChord}
              windowStart={windowStart}
              windowEnd={windowEnd}
            />
          )}
        </div>
        
        {/* プレイヤーステータス */}
        <div className="flex items-center justify-between mb-4">
          {/* HP */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">HP</span>
            <div className="flex gap-1">
              {Array.from({ length: stage.max_hp }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 transition-all duration-300",
                    i < playerHp ? "text-red-500" : "text-gray-600",
                    heartFlash && i === playerHp && "animate-ping"
                  )}
                >
                  ❤️
                </div>
              ))}
            </div>
          </div>
          
          {/* SPゲージ */}
          <div className="flex-1 mx-8">
            <div className="relative">
              <div className="bg-gray-700 rounded-full h-8 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isSpReady
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"
                      : "bg-blue-500"
                  )}
                  style={{ width: `${spGauge}%` }}
                />
              </div>
              <button
                onClick={handleSpAttack}
                disabled={!isSpReady}
                className={cn(
                  "absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 ml-4",
                  "px-4 py-2 rounded-lg font-bold transition-all",
                  isSpReady
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-110"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                )}
              >
                SP ATTACK!
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* エフェクト */}
      <FantasyEffects
        width={window.innerWidth}
        height={window.innerHeight}
      />
      
      {/* ゲーム開始ボタン（Ready状態） */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold rounded-lg hover:scale-110 transition-transform"
          >
            START RHYTHM!
          </button>
        </div>
      )}
    </div>
  );
};

export default RhythmGameScreen;