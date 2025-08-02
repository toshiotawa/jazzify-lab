/**
 * リズムゲームエンジン
 * リズムに合わせてコードを演奏するゲームモードのロジック
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName } from '@/utils/display-note';
import { useTimeStore } from '@/stores/timeStore';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

interface RhythmStage {
  id: string;
  stageNumber: string;
  name: string;
  description: string;
  maxHp: number;
  enemyCount: number;
  enemyHp: number;
  minDamage: number;
  maxDamage: number;
  mode: 'rhythm';
  allowedChords: string[];
  chordProgressionData?: string[] | null;
  showSheetMusic: boolean;
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  bpm: number;
  measureCount?: number;
  countInMeasures?: number;
  timeSignature?: number;
}

interface ChordNote {
  id: string;
  chord: ChordDefinition;
  targetTime: number; // ヒットすべき時刻（ms）
  position: number; // 現在のX座標（0-1000）
  hit: boolean;
  missed: boolean;
}

interface RhythmGameState {
  currentStage: RhythmStage | null;
  playerHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  totalNotes: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  chordNotes: ChordNote[];
  currentBeat: number;
  measureNumber: number;
  isCountIn: boolean;
}

type TimingJudgment = 'perfect' | 'great' | 'good' | 'miss';

interface RhythmGameEngineProps {
  stage: RhythmStage | null;
  onGameStateChange: (state: RhythmGameState) => void;
  playingChordIds: string[];
  onGameEnd: (result: 'clear' | 'gameover', score: number) => void;
}

// ===== 定数 =====
const JUDGMENT_WINDOW = {
  perfect: 50,  // ±50ms
  great: 100,   // ±100ms
  good: 200,    // ±200ms
};

const LANE_LENGTH = 1000; // レーンの長さ（論理座標）
const NOTE_SPEED_FACTOR = 0.5; // ノートの速度調整係数

// ===== リズムゲームエンジン本体 =====
export const RhythmGameEngine: React.FC<RhythmGameEngineProps> = ({
  stage,
  onGameStateChange,
  playingChordIds,
  onGameEnd,
}) => {
  const [gameState, setGameState] = useState<RhythmGameState>({
    currentStage: null,
    playerHp: 100,
    score: 0,
    combo: 0,
    maxCombo: 0,
    totalNotes: 0,
    perfectCount: 0,
    greatCount: 0,
    goodCount: 0,
    missCount: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    chordNotes: [],
    currentBeat: 0,
    measureNumber: 0,
    isCountIn: true,
  });

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const lastNoteSpawnTimeRef = useRef<number>(0);
  const beatIntervalRef = useRef<number>(0);

  // タイミング判定
  const judgeTimingWindow = useCallback((deltaTime: number): TimingJudgment => {
    const absDelta = Math.abs(deltaTime);
    if (absDelta <= JUDGMENT_WINDOW.perfect) return 'perfect';
    if (absDelta <= JUDGMENT_WINDOW.great) return 'great';
    if (absDelta <= JUDGMENT_WINDOW.good) return 'good';
    return 'miss';
  }, []);

  // スコア計算
  const calculateScore = useCallback((judgment: TimingJudgment, combo: number): number => {
    const baseScore = {
      perfect: 1000,
      great: 700,
      good: 400,
      miss: 0,
    }[judgment];

    const comboBonus = Math.min(combo * 10, 500);
    return baseScore + comboBonus;
  }, []);

  // ダメージ計算
  const calculateDamage = useCallback((judgment: TimingJudgment, stage: RhythmStage): number => {
    if (!stage) return 0;
    
    const damageMultiplier = {
      perfect: 1.5,
      great: 1.2,
      good: 1.0,
      miss: 0,
    }[judgment];

    const baseDamage = stage.minDamage + Math.random() * (stage.maxDamage - stage.minDamage);
    return Math.floor(baseDamage * damageMultiplier);
  }, []);

  // コードノートの生成
  const generateChordNote = useCallback((stage: RhythmStage, targetTime: number): ChordNote => {
    const chordId = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
    const resolved = resolveChord(chordId);
    
    if (!resolved) {
      throw new Error(`Invalid chord ID: ${chordId}`);
    }

    const chord: ChordDefinition = {
      id: chordId,
      displayName: toDisplayChordName(chordId, { lang: 'ja', isSimple: true }),
      notes: resolved.notes,
      noteNames: resolved.noteNames,
      quality: resolved.quality,
      root: resolved.root,
    };

    return {
      id: `${Date.now()}-${Math.random()}`,
      chord,
      targetTime,
      position: LANE_LENGTH, // 右端から開始
      hit: false,
      missed: false,
    };
  }, []);

  // ゲーム開始
  const startGame = useCallback(() => {
    if (!stage) return;

    const bpm = stage.bpm || 120;
    const beatInterval = 60000 / bpm; // 1拍の長さ（ms）
    beatIntervalRef.current = beatInterval;

    const countInMeasures = stage.countInMeasures || 2;
    const countInTime = countInMeasures * 4 * beatInterval; // 4/4拍子想定

    startTimeRef.current = Date.now() + countInTime;
    
    setGameState({
      currentStage: stage,
      playerHp: stage.maxHp,
      score: 0,
      combo: 0,
      maxCombo: 0,
      totalNotes: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      chordNotes: [],
      currentBeat: 0,
      measureNumber: 0,
      isCountIn: true,
    });

    devLog('Rhythm game started', { stage: stage.name, bpm, countInTime });
  }, [stage]);

  // ゲームループ
  const gameLoop = useCallback(() => {
    if (!gameState.isGameActive || !gameState.currentStage) return;

    const currentTime = Date.now();
    const gameTime = currentTime - startTimeRef.current;

    // カウントイン終了チェック
    if (gameState.isCountIn && gameTime >= 0) {
      setGameState(prev => ({ ...prev, isCountIn: false }));
    }

    // ノートの生成（毎小節の1拍目）
    if (!gameState.isCountIn && gameTime >= 0) {
      const beatInterval = beatIntervalRef.current;
      const measureInterval = beatInterval * 4; // 4/4拍子
      const nextNoteTime = Math.floor(gameTime / measureInterval) * measureInterval + measureInterval;

      if (nextNoteTime - lastNoteSpawnTimeRef.current >= measureInterval - 100) {
        const targetTime = startTimeRef.current + nextNoteTime;
        const newNote = generateChordNote(gameState.currentStage, targetTime);
        
        setGameState(prev => ({
          ...prev,
          chordNotes: [...prev.chordNotes, newNote],
          totalNotes: prev.totalNotes + 1,
        }));

        lastNoteSpawnTimeRef.current = nextNoteTime;
      }
    }

    // ノートの移動と判定
    setGameState(prev => {
      const updatedNotes = prev.chordNotes.map(note => {
        if (note.hit || note.missed) return note;

        // ノートの位置更新
        const timeToTarget = note.targetTime - currentTime;
        const position = (timeToTarget / (beatIntervalRef.current * 4)) * LANE_LENGTH * NOTE_SPEED_FACTOR;

        // ミス判定（判定ラインを超えた）
        if (position < -JUDGMENT_WINDOW.good) {
          return { ...note, position: 0, missed: true };
        }

        return { ...note, position: Math.max(0, position) };
      });

      // ミスした場合の処理
      const newMisses = updatedNotes.filter(n => n.missed && !prev.chordNotes.find(pn => pn.id === n.id)?.missed);
      if (newMisses.length > 0) {
        const damage = prev.currentStage?.enemyHp || 10;
        const newHp = Math.max(0, prev.playerHp - damage * newMisses.length);
        
        return {
          ...prev,
          chordNotes: updatedNotes.filter(n => !n.missed || currentTime - n.targetTime < 1000),
          playerHp: newHp,
          combo: 0,
          missCount: prev.missCount + newMisses.length,
          isGameOver: newHp <= 0,
          gameResult: newHp <= 0 ? 'gameover' : null,
        };
      }

      return { ...prev, chordNotes: updatedNotes };
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, generateChordNote]);

  // コード入力処理
  const handleChordInput = useCallback(() => {
    if (!gameState.isGameActive || gameState.isCountIn) return;
    if (playingChordIds.length === 0) return;

    const currentTime = Date.now();
    const playingChordId = playingChordIds[0]; // 単一コードのみ対応

    // 判定可能なノートを探す
    const targetNote = gameState.chordNotes.find(note => {
      if (note.hit || note.missed) return false;
      const deltaTime = currentTime - note.targetTime;
      return Math.abs(deltaTime) <= JUDGMENT_WINDOW.good;
    });

    if (!targetNote) {
      devLog('No notes in judgment window');
      return;
    }

    // コード判定
    const isCorrect = targetNote.chord.id === playingChordId;
    if (!isCorrect) {
      devLog('Wrong chord', { expected: targetNote.chord.id, played: playingChordId });
      return;
    }

    // タイミング判定
    const deltaTime = currentTime - targetNote.targetTime;
    const judgment = judgeTimingWindow(deltaTime);

    // スコアとダメージの計算
    const score = calculateScore(judgment, gameState.combo);
    const damage = calculateDamage(judgment, gameState.currentStage!);

    // 状態更新
    setGameState(prev => {
      const newCombo = judgment !== 'miss' ? prev.combo + 1 : 0;
      const enemyHp = prev.currentStage!.enemyHp * prev.totalNotes;
      const totalDamageDealt = (prev.perfectCount + prev.greatCount + prev.goodCount + 1) * prev.currentStage!.enemyHp;

      const updatedState = {
        ...prev,
        chordNotes: prev.chordNotes.map(n => 
          n.id === targetNote.id ? { ...n, hit: true } : n
        ),
        score: prev.score + score,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        perfectCount: prev.perfectCount + (judgment === 'perfect' ? 1 : 0),
        greatCount: prev.greatCount + (judgment === 'great' ? 1 : 0),
        goodCount: prev.goodCount + (judgment === 'good' ? 1 : 0),
      };

      // クリア判定
      if (totalDamageDealt >= enemyHp) {
        return {
          ...updatedState,
          isGameActive: false,
          gameResult: 'clear',
        };
      }

      return updatedState;
    });

    devLog('Chord hit', { judgment, score, damage, combo: gameState.combo });
  }, [gameState, playingChordIds, judgeTimingWindow, calculateScore, calculateDamage]);

  // ゲーム終了処理
  useEffect(() => {
    if (gameState.gameResult && !gameState.isGameActive) {
      cancelAnimationFrame(animationFrameRef.current);
      onGameEnd(gameState.gameResult, gameState.score);
    }
  }, [gameState.gameResult, gameState.isGameActive, gameState.score, onGameEnd]);

  // プレイ中のコードが変わったら判定
  useEffect(() => {
    handleChordInput();
  }, [playingChordIds, handleChordInput]);

  // ゲームループの開始/停止
  useEffect(() => {
    if (gameState.isGameActive) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState.isGameActive, gameLoop]);

  // ステージが設定されたらゲーム開始
  useEffect(() => {
    if (stage) {
      startGame();
    }
  }, [stage, startGame]);

  // 状態変更を親コンポーネントに通知
  useEffect(() => {
    onGameStateChange(gameState);
  }, [gameState, onGameStateChange]);

  return null; // このコンポーネントは表示要素を持たない
};

export type { RhythmStage, RhythmGameState, ChordNote, TimingJudgment };