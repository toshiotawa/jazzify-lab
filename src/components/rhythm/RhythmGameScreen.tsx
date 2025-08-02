/**
 * リズムゲームメイン画面
 * リズムモードのゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore, RhythmNote } from '@/stores/rhythmStore';
import { bgmManager } from '@/utils/BGMManager';
import { useRhythmGameEngine } from './RhythmGameEngine';
import RhythmNotesRenderer from './RhythmNotesRenderer';
import { FantasyStage } from '../fantasy/FantasyGameEngine';
import { ChordDefinition } from '@/stores/rhythmStore';
import type { DisplayOpts } from '@/utils/display-note';
import FantasySoundManager from '@/utils/FantasySoundManager';

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
  simpleNoteName = false
}) => {
  // ゲーム状態
  const [playerHp, setPlayerHp] = useState(stage.maxHp);
  const [playerSp, setPlayerSp] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'clear' | 'gameover' | null>(null);
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [attackEffect, setAttackEffect] = useState<{ type: 'success' | 'failure'; monsterId: string } | null>(null);
  
  // MIDI関連
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [inputNotes, setInputNotes] = useState<number[]>([]);
  const activeNotesRef = useRef<Set<number>>(new Set());
  
  // ストアとtimeStore
  const { settings } = useGameStore();
  const timeStore = useTimeStore();
  const rhythmStore = useRhythmStore();
  const { currentBeat, currentMeasure, tick, startAt, readyDuration, isCountIn } = timeStore;
  
  // ノーツレンダラー用の状態
  const [pendingNotes, setPendingNotes] = useState<RhythmNote[]>([]);
  
  // エンジンのコールバック
  const handleChordCorrect = useCallback((chord: ChordDefinition, damageDealt: number) => {
    devLog.debug('🎯 コード正解:', { chord: chord.displayName, damage: damageDealt });
    
    // スコアとSP更新
    setScore(prev => prev + 100);
    setCorrectAnswers(prev => prev + 1);
    setPlayerSp(prev => Math.min(5, prev + 1));
    
    // 効果音（ランダムに魔法を選択）
    const magicTypes = ['fire', 'ice', 'thunder'] as const;
    const randomMagic = magicTypes[Math.floor(Math.random() * magicTypes.length)];
    FantasySoundManager.playMagic(randomMagic);
    
    // エフェクト
    setAttackEffect({ type: 'success', monsterId: 'rhythm' });
    setTimeout(() => setAttackEffect(null), 1000);
  }, []);
  
  const handleChordIncorrect = useCallback(() => {
    devLog.debug('❌ コード不正解');
    // 失敗時は無音またはエネミーアタック音を使用
    FantasySoundManager.playEnemyAttack();
  }, []);
  
  const handleEnemyAttack = useCallback((damage: number) => {
    devLog.debug('👹 敵の攻撃:', { damage });
    
    const newHp = Math.max(0, playerHp - damage);
    setPlayerHp(newHp);
    
    // ダメージエフェクト
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    
    // 効果音
    FantasySoundManager.playEnemyAttack();
    
    if (newHp === 0) {
      setIsGameOver(true);
      setGameResult('gameover');
    }
  }, [playerHp]);
  
  // ノーツ更新のコールバック
  const handleNotesUpdate = useCallback((notes: RhythmNote[]) => {
    setPendingNotes(notes);
  }, []);
  
  // 表示オプション
  const displayOpts: DisplayOpts = {
    lang: noteNameLang,
    simple: simpleNoteName
  };
  
  // リズムゲームエンジンの使用
  const {
    enemyHp,
    enemyMaxHp,
    enemiesDefeated,
    totalEnemies
  } = useRhythmGameEngine({
    stage,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onEnemyAttack: handleEnemyAttack,
    inputNotes,
    displayOpts,
    onNotesUpdate: handleNotesUpdate
  });
  
  // 時間管理のtick
  useEffect(() => {
    const id = setInterval(() => tick(), 100);
    return () => clearInterval(id);
  }, [tick]);
  
  // Ready状態の判定
  const isReady = startAt !== null && performance.now() - startAt < readyDuration;
  
  // ゲーム開始時の初期化
  useEffect(() => {
    if (autoStart && !startAt) {
      timeStore.setStart(
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 1
      );
    }
  }, [autoStart, startAt, stage, timeStore]);
  
  // BGM管理
  useEffect(() => {
    if (!isReady && startAt) {
      bgmManager.play(
        stage.bgmUrl || '/demo-1.mp3',
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 1,
        settings.bgmVolume ?? 0.7
      );
    } else {
      bgmManager.stop();
    }
    return () => bgmManager.stop();
  }, [isReady, stage, settings.bgmVolume, startAt]);
  
  // MIDIController初期化
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number) => {
          devLog.debug('🎹 MIDI Note On:', { note });
          activeNotesRef.current.add(note);
          setInputNotes(Array.from(activeNotesRef.current));
        },
        onNoteOff: (note: number) => {
          devLog.debug('🎹 MIDI Note Off:', { note });
          activeNotesRef.current.delete(note);
          setInputNotes(Array.from(activeNotesRef.current));
        },
        playMidiSound: true
      });
      
      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsMidiConnected(connected);
      });
      
      midiControllerRef.current = controller;
      controller.initialize();
    }
    
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []);
  
  // 全敵撃破でクリア
  useEffect(() => {
    if (enemiesDefeated >= totalEnemies && !isGameOver) {
      setIsGameOver(true);
      setGameResult('clear');
    }
  }, [enemiesDefeated, totalEnemies, isGameOver]);
  
  // ゲーム終了処理
  useEffect(() => {
    if (isGameOver && gameResult) {
      onGameComplete(gameResult, score, correctAnswers, 0);
    }
  }, [isGameOver, gameResult, score, correctAnswers, onGameComplete]);
  
  // SPアタック
  const handleSpAttack = useCallback(() => {
    if (playerSp < 5) return;
    
    setPlayerSp(0);
    // SPアタックは特別な魔法音を再生
    FantasySoundManager.playMagic('thunder');
    
    // 現在のノーツをすべて成功扱いにする
    const currentNotes = rhythmStore.pendingNotes;
    currentNotes.forEach(note => {
      if (!rhythmStore.isJudged(note.id)) {
        rhythmStore.markAsJudged(note.id);
                 handleChordCorrect(note.chord, stage.maxDamage);
      }
    });
      }, [playerSp, rhythmStore, handleChordCorrect, stage.maxDamage]);
  
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900",
      "flex flex-col relative overflow-hidden fantasy-game-screen",
      damageShake && "animate-shake"
    )}>
      {/* ヘッダー部分 */}
      <div className="relative z-10 p-4 flex justify-between items-center">
        <button
          onClick={onBackToStageSelect}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          戻る
        </button>
        
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold">{stage.name}</h2>
          <div className="text-sm">
            {isCountIn ? (
              <span>M / - B {currentBeat}</span>
            ) : (
              <span>M {currentMeasure} - B {currentBeat}</span>
            )}
          </div>
        </div>
        
        <div className="text-white text-right">
          <div>Score: {score}</div>
          <div>撃破: {enemiesDefeated} / {totalEnemies}</div>
        </div>
      </div>
      
      {/* ノーツ表示エリア */}
      <div className="flex-1 relative">
        <RhythmNotesRenderer
          width={window.innerWidth}
          height={200}
          notes={pendingNotes}
          className="absolute top-0 left-0 w-full"
        />
        
        {/* Ready表示 */}
        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-white animate-pulse">
              READY...
            </div>
          </div>
        )}
      </div>
      
      {/* 下部UI */}
      <div className="relative z-10 p-4">
        {/* プレイヤーHP */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white">HP:</span>
            <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                style={{ width: `${(playerHp / stage.maxHp) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                {playerHp} / {stage.maxHp}
              </div>
            </div>
          </div>
        </div>
        
        {/* SPゲージ */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white">SP:</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-full border-2",
                    i < playerSp
                      ? "bg-yellow-400 border-yellow-600"
                      : "bg-gray-700 border-gray-600"
                  )}
                />
              ))}
            </div>
            {playerSp >= 5 && (
              <button
                onClick={handleSpAttack}
                className="ml-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg animate-pulse"
              >
                SPアタック！
              </button>
            )}
          </div>
        </div>
        
        {/* 敵HP */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white">敵HP:</span>
            <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
                style={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                {enemyHp} / {enemyMaxHp}
              </div>
            </div>
          </div>
        </div>
        
        {/* MIDI接続状態 */}
        <div className="text-center text-white text-sm">
          {isMidiConnected ? '🎹 MIDI接続中' : '🎹 MIDI未接続'}
        </div>
      </div>
      
      {/* 攻撃エフェクト */}
      {attackEffect && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={cn(
            "text-6xl font-bold animate-bounce",
            attackEffect.type === 'success' ? "text-yellow-400" : "text-red-500"
          )}>
            {attackEffect.type === 'success' ? 'HIT!' : 'MISS!'}
          </div>
        </div>
      )}
    </div>
  );
};

export default RhythmGameScreen;