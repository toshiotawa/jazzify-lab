/**
 * ファンタジープログレッションエンジン
 * 拡張プログレッションモード専用のゲームロジック
 */

import React, { useState, useEffect, useCallback, useReducer, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { useTimeStoreExtended } from '@/stores/timeStoreExtended';
import { bgmManagerExtended } from '@/utils/BGMManagerExtended';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import * as PIXI from 'pixi.js';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;          // コードのID（例: 'CM7', 'G7', 'Am'）
  displayName: string; // 表示名（言語・簡易化設定に応じて変更）
  notes: number[];     // MIDIノート番号の配列
  noteNames: string[]; // 理論的に正しい音名配列
  quality: string;     // コードの性質（'major', 'minor', 'dominant7'など）
  root: string;        // ルート音（例: 'C', 'G', 'A'）
}

interface ChordProgressionData {
  bar: number;
  beat: number;
  chord: string;
}

interface FantasyProgressionStage {
  id: string;
  stageNumber: string;
  name: string;
  description: string;
  maxHp: number;
  enemyGaugeSeconds: number;
  enemyCount: number;
  enemyHp: number;
  minDamage: number;
  maxDamage: number;
  mode: 'progression'; // プログレッションモード固定
  allowedChords: string[];
  chordProgression?: string[];
  chordProgressionData?: ChordProgressionData[]; // 拡張タイミングデータ
  showSheetMusic: boolean;
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  mp3Url?: string;
  simultaneousMonsterCount: number;
  bpm: number;
  measureCount?: number;
  countInMeasures?: number;
  timeSignature?: number;
}

interface MonsterState {
  id: string;
  index: number;
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  currentHp: number;
  maxHp: number;
  gauge: number;
  chordTarget: ChordDefinition;
  correctNotes: number[];
  icon: string;
  name: string;
}

interface ProgressionGameState {
  currentStage: FantasyProgressionStage | null;
  currentQuestionIndex: number;
  currentChordTarget: ChordDefinition | null;
  playerHp: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  enemiesDefeated: number;
  totalEnemies: number;
  isWaitingForNextMonster: boolean;
  playerSp: number;
  activeMonsters: MonsterState[];
  monsterQueue: number[];
  simultaneousMonsterCount: number;
  isCompleting: boolean;
  // 拡張タイミング用
  isInNullPeriod: boolean; // NULL期間中かどうか
  lastJudgmentBeat: number | null; // 最後の判定締切ビート
  autoProgressScheduled: boolean; // 自動進行がスケジュールされているか
}

interface FantasyProgressionEngineProps {
  stage: FantasyProgressionStage | null;
  onGameStateChange: (state: ProgressionGameState) => void;
  onMonsterReady?: (monsterId: string) => void;
  onMonsterBeat?: (monsterId: string) => void;
  onMonsterComplete?: (monsterId: string) => void;
  onMonsterDamage?: (monsterId: string, damage: number) => void;
  onPlayerTakeDamage?: (damage: number) => void;
  onScoreUpdate?: (score: number, correct: number, total: number) => void;
  onGameComplete?: () => void;
  onPlayerAttack?: () => void;
  onEnemyAttack?: (monsterId: string) => void;
  onSPGaugeUpdate?: (sp: number) => void;
  onDebugInfo?: (info: string) => void;
  onCountInStarted?: () => void;
  onCountInEnded?: () => void;
}

export const FantasyProgressionEngine: React.FC<FantasyProgressionEngineProps> = ({
  stage,
  onGameStateChange,
  onMonsterReady,
  onMonsterBeat,
  onMonsterComplete,
  onMonsterDamage,
  onPlayerTakeDamage,
  onScoreUpdate,
  onGameComplete,
  onPlayerAttack,
  onEnemyAttack,
  onSPGaugeUpdate,
  onDebugInfo,
  onCountInStarted,
  onCountInEnded,
}) => {
  // ゲーム状態
  const [gameState, setGameState] = useReducer(
    (state: ProgressionGameState, newState: Partial<ProgressionGameState>) => ({ ...state, ...newState }),
    {
      currentStage: null,
      currentQuestionIndex: 0,
      currentChordTarget: null,
      playerHp: 100,
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      isGameActive: false,
      isGameOver: false,
      gameResult: null,
      enemiesDefeated: 0,
      totalEnemies: 0,
      isWaitingForNextMonster: false,
      playerSp: 0,
      activeMonsters: [],
      monsterQueue: [],
      simultaneousMonsterCount: 1,
      isCompleting: false,
      isInNullPeriod: false,
      lastJudgmentBeat: null,
      autoProgressScheduled: false,
    }
  );

  const animationFrameRef = useRef<number | null>(null);
  const lastBeatRef = useRef<number>(0);
  const handleStageClearRef = useRef<() => void>();
  const handleGameOverRef = useRef<() => void>();

  // タイミング情報の監視
  const timeState = useTimeStoreExtended();
  const { 
    totalBeats, 
    beatInMeasure, 
    currentMeasure, 
    isCountIn,
    nextChordBeat,
    judgmentDeadlineBeat,
    currentChord,
    setStart,
    updateFromBGM
  } = timeState;

  // コード進行データの解析
  const parseChordProgressionData = useCallback((data: any): ChordProgressionData[] | null => {
    if (!data) return null;
    
    try {
      // JSON文字列の場合
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : null;
      }
      // 既に配列の場合
      if (Array.isArray(data)) {
        return data;
      }
      return null;
    } catch (e) {
      console.warn('Failed to parse chord progression data:', e);
      return null;
    }
  }, []);

  // ゲーム初期化
  const initializeGame = useCallback(() => {
    if (!stage) return;
    
    devLog.debug('🎮 プログレッションゲーム初期化開始', { stage: stage.stageNumber });
    
    // タイミングデータの解析
    const progressionData = parseChordProgressionData(stage.chordProgressionData);
    
    // BGMManagerExtendedの初期化
    const bgmUrl = stage.mp3Url || stage.bgmUrl;
    if (bgmUrl) {
      bgmManagerExtended.play(
        bgmUrl,
        stage.bpm,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 0,
        0.7,
        progressionData || undefined,
        (timing) => {
          // BGMからのタイミング更新をストアに反映
          updateFromBGM(
            timing.currentBeat,
            timing.beatInMeasure,
            timing.currentMeasure,
            timing.isCountIn,
            timing.nextChordBeat,
            timing.judgmentDeadlineBeat,
            bgmManagerExtended.getChordAtBeat(timing.currentBeat)
          );
        }
      );
    }
    
    // timeStoreの初期化
    setStart(
      stage.bpm,
      stage.timeSignature || 4,
      stage.measureCount || 8,
      stage.countInMeasures || 0
    );
    
    // モンスターキューの初期化
    const monsterIds = getStageMonsterIds(stage.stageNumber);
    const shuffledQueue = [...Array(stage.enemyCount).keys()]
      .map(i => i % monsterIds.length)
      .sort(() => Math.random() - 0.5);
    
    // 初期モンスターの配置
    const initialMonsters = createInitialMonsters(stage, shuffledQueue);
    
    const initialState: ProgressionGameState = {
      currentStage: stage,
      currentQuestionIndex: 0,
      currentChordTarget: initialMonsters[0]?.chordTarget || null,
      playerHp: stage.maxHp,
      score: 0,
      totalQuestions: stage.chordProgression?.length || 0,
      correctAnswers: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      enemiesDefeated: 0,
      totalEnemies: stage.enemyCount,
      isWaitingForNextMonster: false,
      playerSp: 0,
      activeMonsters: initialMonsters,
      monsterQueue: shuffledQueue.slice(stage.simultaneousMonsterCount),
      simultaneousMonsterCount: stage.simultaneousMonsterCount,
      isCompleting: false,
      isInNullPeriod: false,
      lastJudgmentBeat: null,
      autoProgressScheduled: false,
    };
    
    setGameState(initialState);
    onGameStateChange(initialState);
    
    // 初期モンスターの準備完了通知
    initialMonsters.forEach(monster => {
      if (onMonsterReady) {
        onMonsterReady(monster.id);
      }
    });
    
    devLog.debug('🎮 プログレッションゲーム初期化完了');
  }, [stage, onGameStateChange, onMonsterReady, setStart, updateFromBGM, parseChordProgressionData]);

  // 初期モンスター作成
  const createInitialMonsters = (stage: FantasyProgressionStage, queue: number[]): MonsterState[] => {
    const positions: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const monsterIds = getStageMonsterIds(stage.stageNumber);
    const progression = stage.chordProgression || [];
    
    return queue.slice(0, stage.simultaneousMonsterCount).map((monsterIndex, i) => {
      const monsterId = monsterIds[monsterIndex % monsterIds.length];
      const monsterDef = MONSTERS[monsterId] || MONSTERS.slime;
      const chordIndex = i % progression.length;
      const chordName = progression[chordIndex] || 'C';
      
      const resolved = resolveChord(chordName);
      const chordDef: ChordDefinition = {
        id: chordName,
        displayName: toDisplayChordName(chordName, {}),
        notes: resolved.notes,
        noteNames: resolved.noteNames,
        quality: resolved.quality,
        root: resolved.root
      };
      
      return {
        id: `monster_${i}_${Date.now()}`,
        index: queue[i],
        position: positions[i % positions.length],
        currentHp: stage.enemyHp,
        maxHp: stage.enemyHp,
        gauge: 0,
        chordTarget: chordDef,
        correctNotes: [],
        icon: monsterDef.icon,
        name: monsterDef.name
      };
    });
  };

  // タイミング監視とゲーム進行
  useEffect(() => {
    if (!gameState.isGameActive || isCountIn) return;
    
    const checkTiming = () => {
      // 判定締切のチェック
      if (judgmentDeadlineBeat !== null && 
          totalBeats >= judgmentDeadlineBeat && 
          !gameState.autoProgressScheduled &&
          lastBeatRef.current < judgmentDeadlineBeat) {
        
        devLog.debug('⏰ 判定締切到達', { 
          totalBeats, 
          judgmentDeadlineBeat,
          activeMonsters: gameState.activeMonsters.length 
        });
        
        // 未完成のモンスターをチェック
        const incompleteMonsters = gameState.activeMonsters.filter(monster => {
          const targetNotes = [...new Set(monster.chordTarget.notes.map(n => n % 12))];
          return monster.correctNotes.length < targetNotes.length;
        });
        
        if (incompleteMonsters.length > 0) {
          // 失敗：自動で進行
          handleAutoProgress(incompleteMonsters);
        } else {
          // 成功：NULL期間に入る
          setGameState({ 
            isInNullPeriod: true,
            currentChordTarget: null 
          });
        }
        
        setGameState({ 
          autoProgressScheduled: true,
          lastJudgmentBeat: judgmentDeadlineBeat 
        });
      }
      
      // 次のコード出題タイミングのチェック
      if (nextChordBeat !== null && 
          totalBeats >= nextChordBeat && 
          lastBeatRef.current < nextChordBeat) {
        
        devLog.debug('🎵 次のコード出題', { totalBeats, nextChordBeat });
        
        // NULL期間を終了して次の問題へ
        proceedToNextChord();
        setGameState({ 
          isInNullPeriod: false,
          autoProgressScheduled: false 
        });
      }
      
      lastBeatRef.current = totalBeats;
      animationFrameRef.current = requestAnimationFrame(checkTiming);
    };
    
    checkTiming();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isGameActive, isCountIn, totalBeats, judgmentDeadlineBeat, nextChordBeat, gameState.autoProgressScheduled]);

  // 自動進行処理（失敗時）
  const handleAutoProgress = useCallback((incompleteMonsters: MonsterState[]) => {
    devLog.debug('💥 自動進行：モンスターの攻撃', { count: incompleteMonsters.length });
    
    // 各未完成モンスターが攻撃
    incompleteMonsters.forEach(monster => {
      // ダメージ計算
      const damage = Math.floor(
        Math.random() * (gameState.currentStage!.maxDamage - gameState.currentStage!.minDamage + 1) + 
        gameState.currentStage!.minDamage
      );
      
      // プレイヤーへダメージ
      const newHp = Math.max(0, gameState.playerHp - damage);
      setGameState({ 
        playerHp: newHp,
        playerSp: 0 // SPリセット
      });
      
      if (onEnemyAttack) onEnemyAttack(monster.id);
      if (onPlayerTakeDamage) onPlayerTakeDamage(damage);
      
      // ゲームオーバーチェック
      if (newHp <= 0) {
        handleGameOverRef.current?.();
        return;
      }
    });
    
    // NULL期間を挟んで次へ（拡張性のため）
    setGameState({ isInNullPeriod: true });
  }, [gameState, onEnemyAttack, onPlayerTakeDamage]);

  // 次のコードへ進行
  const proceedToNextChord = useCallback(() => {
    const progression = gameState.currentStage?.chordProgression || [];
    const nextIndex = (gameState.currentQuestionIndex + 1) % progression.length;
    const nextChordName = progression[nextIndex];
    
    if (!nextChordName) return;
    
    const resolved = resolveChord(nextChordName);
    const nextChord: ChordDefinition = {
      id: nextChordName,
      displayName: toDisplayChordName(nextChordName, {}),
      notes: resolved.notes,
      noteNames: resolved.noteNames,
      quality: resolved.quality,
      root: resolved.root
    };
    
    // モンスターのコードターゲットを更新
    const updatedMonsters = gameState.activeMonsters.map(monster => ({
      ...monster,
      chordTarget: nextChord,
      correctNotes: [],
      gauge: 0
    }));
    
    setGameState({
      currentQuestionIndex: nextIndex,
      currentChordTarget: nextChord,
      activeMonsters: updatedMonsters,
      isInNullPeriod: false
    });
    
    devLog.debug('📋 次のコードへ進行', { nextIndex, chord: nextChordName });
  }, [gameState]);

  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || gameState.isWaitingForNextMonster || gameState.isInNullPeriod) {
      return;
    }
    
    const noteMod12 = note % 12;
    const completedMonsters: MonsterState[] = [];
    let hasAnyNoteChanged = false;
    
    // 各モンスターへの入力処理
    const updatedMonsters = gameState.activeMonsters.map(monster => {
      const targetNotes = [...new Set(monster.chordTarget.notes.map(n => n % 12))];
      
      if (!targetNotes.includes(noteMod12) || monster.correctNotes.includes(noteMod12)) {
        return monster;
      }
      
      hasAnyNoteChanged = true;
      const newCorrectNotes = [...monster.correctNotes, noteMod12];
      const updatedMonster = { ...monster, correctNotes: newCorrectNotes };
      
      // コード完成チェック
      if (newCorrectNotes.length === targetNotes.length) {
        completedMonsters.push(updatedMonster);
      }
      
      return updatedMonster;
    });
    
    if (!hasAnyNoteChanged) return;
    
    // 完成したモンスターの処理
    if (completedMonsters.length > 0) {
      handleMonstersCompleted(completedMonsters, updatedMonsters);
    } else {
      setGameState({ activeMonsters: updatedMonsters });
    }
  }, [gameState]);

  // モンスター撃破処理
  const handleMonstersCompleted = useCallback((completedMonsters: MonsterState[], allMonsters: MonsterState[]) => {
    let totalDamage = 0;
    const defeatedMonsterIds: string[] = [];
    
    const updatedMonsters = allMonsters.map(monster => {
      const isCompleted = completedMonsters.find(cm => cm.id === monster.id);
      if (!isCompleted) return monster;
      
      // ダメージ計算（SP考慮）
      const baseDamage = 1;
      const spBonus = gameState.playerSp;
      const damage = baseDamage + spBonus;
      totalDamage += damage;
      
      const newHp = Math.max(0, monster.currentHp - damage);
      
      if (newHp <= 0) {
        defeatedMonsterIds.push(monster.id);
      }
      
      return { ...monster, currentHp: newHp };
    });
    
    // アニメーション通知
    if (onPlayerAttack) onPlayerAttack();
    defeatedMonsterIds.forEach(id => {
      if (onMonsterDamage) onMonsterDamage(id, totalDamage);
      if (onMonsterComplete) onMonsterComplete(id);
    });
    
    // 撃破されたモンスターを除外
    const remainingMonsters = updatedMonsters.filter(m => m.currentHp > 0);
    
    // スコアとSP更新
    const newScore = gameState.score + defeatedMonsterIds.length * 100 * (gameState.playerSp + 1);
    const newSp = Math.min(5, gameState.playerSp + 1);
    
    setGameState({
      activeMonsters: remainingMonsters,
      score: newScore,
      playerSp: newSp,
      enemiesDefeated: gameState.enemiesDefeated + defeatedMonsterIds.length,
      correctAnswers: gameState.correctAnswers + 1
    });
    
    if (onScoreUpdate) {
      onScoreUpdate(newScore, gameState.correctAnswers + 1, gameState.totalQuestions);
    }
    if (onSPGaugeUpdate) {
      onSPGaugeUpdate(newSp);
    }
    
    // 全モンスター撃破チェック
    if (remainingMonsters.length === 0 && gameState.monsterQueue.length === 0) {
      handleStageClearRef.current?.();
    }
  }, [gameState, onPlayerAttack, onMonsterDamage, onMonsterComplete, onScoreUpdate, onSPGaugeUpdate]);

  // ゲームクリア処理
  const handleStageClear = useCallback(() => {
    if (gameState.isCompleting) return;
    
    setGameState({
      isGameActive: false,
      isCompleting: true,
      gameResult: 'clear'
    });
    
    bgmManagerExtended.stop();
    if (onGameComplete) onGameComplete();
  }, [gameState.isCompleting, onGameComplete]);

  // ゲームオーバー処理
  const handleGameOver = useCallback(() => {
    setGameState({
      isGameActive: false,
      isGameOver: true,
      gameResult: 'gameover'
    });
    
    bgmManagerExtended.stop();
    if (onGameComplete) onGameComplete();
  }, [onGameComplete]);
  
  // Refに設定
  useEffect(() => {
    handleStageClearRef.current = handleStageClear;
    handleGameOverRef.current = handleGameOver;
  }, [handleStageClear, handleGameOver]);

  // ステージ変更時の初期化
  useEffect(() => {
    if (stage && stage.mode === 'progression') {
      initializeGame();
    }
    
    return () => {
      bgmManagerExtended.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stage, initializeGame]);

  // カウントイン通知
  useEffect(() => {
    if (isCountIn && onCountInStarted) {
      onCountInStarted();
    } else if (!isCountIn && onCountInEnded) {
      onCountInEnded();
    }
  }, [isCountIn, onCountInStarted, onCountInEnded]);

  // デバッグ情報
  useEffect(() => {
    if (onDebugInfo) {
      const debugInfo = `Beat: ${beatInMeasure.toFixed(2)} | Measure: ${currentMeasure} | ` +
                       `Next: ${nextChordBeat?.toFixed(2) || 'N/A'} | ` +
                       `Deadline: ${judgmentDeadlineBeat?.toFixed(2) || 'N/A'} | ` +
                       `Chord: ${currentChord || 'NULL'}`;
      onDebugInfo(debugInfo);
    }
  }, [beatInMeasure, currentMeasure, nextChordBeat, judgmentDeadlineBeat, currentChord, onDebugInfo]);

  // 外部からのノート入力を受け付ける
  useEffect(() => {
    const handleKeyPress = (note: number) => {
      handleNoteInput(note);
    };
    
    // グローバルイベントリスナーの登録（実装に応じて調整）
    (window as any).fantasyProgressionHandleNote = handleKeyPress;
    
    return () => {
      delete (window as any).fantasyProgressionHandleNote;
    };
  }, [handleNoteInput]);

  return null; // このコンポーネントは描画しない
};