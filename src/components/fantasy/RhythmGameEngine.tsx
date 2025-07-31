/**
 * リズムゲームエンジン
 * リズムモード専用のゲームロジックとステート管理
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useRhythmStore, RhythmChordData } from '@/stores/rhythmStore';
import { useEnemyStore } from '@/stores/enemyStore';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import { note as parseNote } from 'tonal';

// FantasyStage型をインポート（FantasyGameEngineから）
type FantasyStage = {
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
  mode: 'single' | 'progression';
  allowedChords: string[];
  chordProgression?: string[];
  showSheetMusic: boolean;
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  simultaneousMonsterCount: number;
  gameType?: 'quiz' | 'rhythm';
  rhythmPattern?: 'random' | 'progression';
  bpm?: number;
  timeSignature?: number;
  measureCount?: number;
  loopMeasures?: number;
  rhythmData?: string;
  chordProgressionData?: any;
  mp3Url?: string;
};

// ===== 型定義 =====

interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

interface RhythmMonsterState {
  id: string;
  index: number;
  position: 'A' | 'B' | 'C' | 'D';
  currentHp: number;
  maxHp: number;
  gauge: number;  // 0-100%
  gaugeSpeed: number;  // ゲージ上昇速度（%/秒）
  chordTarget: ChordDefinition;
  correctNotes: number[];
  icon: string;
  name: string;
  nextAttackTime: number;  // 次の攻撃タイミング（秒）
  attackInterval: number;  // 攻撃間隔（秒）
}

interface RhythmGameState {
  playerHp: number;
  maxPlayerHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  totalQuestions: number;
  correctAnswers: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  activeMonsters: RhythmMonsterState[];
  monsterQueue: number[];
  simultaneousMonsterCount: number;
  isCompleting: boolean;
  currentChord: ChordDefinition | null;
  nextChord: ChordDefinition | null;
}

interface RhythmGameEngineProps {
  stage: FantasyStage | null;  // FantasyStage型を正しくインポート
  onGameStateChange: (state: RhythmGameState) => void;
  onChordCorrect: (chord: ChordDefinition, timing: 'perfect' | 'good', damage: number, defeated: boolean, monsterId: string) => void;
  onChordMiss: (chord: ChordDefinition, monsterId: string) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: RhythmGameState) => void;
  onEnemyAttack: (attackingMonsterId: string) => void;
  displayOpts?: DisplayOpts;
}

// ===== ヘルパー関数 =====

const getChordDefinition = (chordId: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  const resolved = resolveChord(chordId, 4, displayOpts);
  if (!resolved) {
    console.warn(`⚠️ 未定義のファンタジーコード: ${chordId}`);
    return null;
  }

  const midiNotes = resolved.notes.map(noteName => {
    const noteObj = parseNote(noteName + '4');
    return noteObj && typeof noteObj.midi === 'number' ? noteObj.midi : 60;
  });

  return {
    id: chordId,
    displayName: resolved.displayName,
    notes: midiNotes,
    noteNames: resolved.notes,
    quality: resolved.quality,
    root: resolved.root
  };
};

// ===== リズムゲームエンジンフック =====

export const useRhythmGameEngine = (props: RhythmGameEngineProps) => {
  const {
    stage,
    onGameStateChange,
    onChordCorrect,
    onChordMiss,
    onGameComplete,
    onEnemyAttack,
    displayOpts
  } = props;

  const rhythmStore = useRhythmStore();
  const { setEnrage } = useEnemyStore();
  
  // ゲーム状態
  const [gameState, setGameState] = useState<RhythmGameState>({
    playerHp: stage?.maxHp || 5,
    maxPlayerHp: stage?.maxHp || 5,
    score: 0,
    combo: 0,
    maxCombo: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    activeMonsters: [],
    monsterQueue: [],
    simultaneousMonsterCount: stage?.simultaneousMonsterCount || 1,
    isCompleting: false,
    currentChord: null,
    nextChord: null
  });

  // Refs
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const correctNotesMapRef = useRef<Map<string, Set<number>>>(new Map());

  // リズムモード用のコード選択
  const selectNextChord = useCallback((monsters: RhythmMonsterState[]) => {
    if (!stage) return null;

    // プログレッションモードの場合
    if (stage.rhythmPattern === 'progression' && rhythmStore.chordProgressionData.length > 0) {
      const currentChordData = rhythmStore.chordProgressionData[rhythmStore.currentChordIndex];
      return getChordDefinition(currentChordData.chord, displayOpts);
    }

    // ランダムモードの場合
    if (stage.allowedChords && stage.allowedChords.length > 0) {
      const randomIndex = Math.floor(Math.random() * stage.allowedChords.length);
      const chordId = stage.allowedChords[randomIndex];
      return getChordDefinition(chordId, displayOpts);
    }

    return null;
  }, [stage, rhythmStore.chordProgressionData, rhythmStore.currentChordIndex, displayOpts]);

  // モンスター生成
  const createMonster = useCallback((index: number, position: 'A' | 'B' | 'C' | 'D'): RhythmMonsterState | null => {
    if (!stage) return null;

    const monsterIds = getStageMonsterIds(4); // 固定で4種類のモンスターを使用
    const monsterIdIndex = index % monsterIds.length;
    const monsterId = monsterIds[monsterIdIndex]; // monsterIdを復活
    const monsterDef = MONSTERS[monsterIdIndex];
    
    if (!monsterDef) return null;

    const chord = selectNextChord([]);
    if (!chord) return null;

    // リズムモードでのゲージ速度計算
    const beatDuration = rhythmStore.getBeatDuration();
    const gaugeSpeed = 100 / (beatDuration * (stage.timeSignature || 4));  // 1小節で100%になる速度

    return {
      id: `${monsterId}_${index}_${Date.now()}`,
      index,
      position,
      currentHp: stage.enemyHp,
      maxHp: stage.enemyHp,
      gauge: 0,
      gaugeSpeed,
      chordTarget: chord,
      correctNotes: [],
      icon: monsterDef.iconFile,
      name: monsterDef.name,
      nextAttackTime: rhythmStore.currentTime + beatDuration * (stage.timeSignature || 4),
      attackInterval: beatDuration * (stage.timeSignature || 4)
    };
  }, [stage, selectNextChord, rhythmStore]);

  // ゲーム更新ループ
  const updateGame = useCallback((timestamp: number) => {
    if (!gameState.isGameActive || gameState.isGameOver) return;

    const deltaTime = lastUpdateTimeRef.current ? (timestamp - lastUpdateTimeRef.current) / 1000 : 0;
    lastUpdateTimeRef.current = timestamp;

    setGameState(prevState => {
      const newState = { ...prevState };
      const currentTime = rhythmStore.currentTime;

      // モンスターのゲージ更新と攻撃判定
      newState.activeMonsters = prevState.activeMonsters.map(monster => {
        const updatedMonster = { ...monster };

        // リズムモードでのゲージ計算
        if (stage && stage.gameType === 'rhythm') {
          // 現在の小節内での進行度を計算
          const measureDuration = rhythmStore.getMeasureDuration();
          const currentMeasureTime = currentTime % measureDuration;
          const measureProgress = (currentMeasureTime / measureDuration) * 100;
          
          // ゲージを小節の進行度に同期
          updatedMonster.gauge = measureProgress;

          // 攻撃タイミングチェック（小節の終わり = 80%地点）
          if (measureProgress >= 80 && monster.gauge < 80) {
            // 攻撃タイミングに到達
            if (monster.correctNotes.length < monster.chordTarget.notes.length) {
              // コード未完成 = ミス
              onChordMiss(monster.chordTarget, monster.id);
              onEnemyAttack(monster.id);
              
              // プレイヤーにダメージ
              newState.playerHp = Math.max(0, newState.playerHp - 1);
              newState.combo = 0;

              // 新しいコードを設定
              const newChord = selectNextChord(newState.activeMonsters);
              if (newChord) {
                updatedMonster.chordTarget = newChord;
                updatedMonster.correctNotes = [];
                correctNotesMapRef.current.set(monster.id, new Set());
              }
            }
          }

          // 小節が切り替わったらゲージリセット
          if (measureProgress < monster.gauge) {
            updatedMonster.gauge = 0;
          }
        }

        return updatedMonster;
      });

      // ゲームオーバー判定
      if (newState.playerHp <= 0 && !newState.isGameOver) {
        newState.isGameOver = true;
        newState.gameResult = 'gameover';
        newState.isGameActive = false;
        onGameComplete('gameover', newState);
      }

      // クリア判定（全モンスター撃破）
      const allDefeated = newState.activeMonsters.length === 0 && newState.monsterQueue.length === 0;
      if (allDefeated && !newState.isGameOver && !newState.isCompleting) {
        newState.isCompleting = true;
        newState.isGameOver = true;
        newState.gameResult = 'clear';
        newState.isGameActive = false;
        onGameComplete('clear', newState);
      }

      return newState;
    });

    animationFrameRef.current = requestAnimationFrame(updateGame);
  }, [gameState.isGameActive, gameState.isGameOver, rhythmStore, stage, onChordMiss, onEnemyAttack, selectNextChord, onGameComplete]);

  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || gameState.isGameOver) return;

    setGameState(prevState => {
      const newState = { ...prevState };
      let hitAny = false;

      // リズムモードの判定
      if (stage && stage.gameType === 'rhythm') {
        // 現在のタイミングでのコード判定
        const currentChordTiming = rhythmStore.getCurrentChordTiming();
        
        newState.activeMonsters = prevState.activeMonsters.map(monster => {
          // すでに撃破されたモンスターはスキップ
          if (monster.currentHp <= 0) return monster;

          const updatedMonster = { ...monster };
          const correctNotesSet = correctNotesMapRef.current.get(monster.id) || new Set<number>();

          // コードが一致し、まだ入力されていないノートか確認
          if (currentChordTiming && 
              currentChordTiming.chord === monster.chordTarget.id &&
              monster.chordTarget.notes.includes(note) && 
              !correctNotesSet.has(note)) {
            
            // 正解ノートを記録
            correctNotesSet.add(note);
            correctNotesMapRef.current.set(monster.id, correctNotesSet);
            updatedMonster.correctNotes = Array.from(correctNotesSet);
            
            hitAny = true;

            // コード完成チェック
            if (updatedMonster.correctNotes.length === monster.chordTarget.notes.length) {
              // タイミング判定
              const judgment = rhythmStore.checkTiming(monster.chordTarget.id);
              
              // ダメージ計算
              const baseDamage = stage?.minDamage || 1;
              const bonusDamage = judgment.timing === 'perfect' ? 2 : 
                                 judgment.timing === 'good' ? 1 : 0;
              const totalDamage = baseDamage + bonusDamage;
              
              // HP減少
              updatedMonster.currentHp = Math.max(0, updatedMonster.currentHp - totalDamage);
              
              // スコア・コンボ更新
              newState.score += judgment.timing === 'perfect' ? 1000 : 
                               judgment.timing === 'good' ? 500 : 0;
              newState.combo += 1;
              newState.maxCombo = Math.max(newState.maxCombo, newState.combo);
              newState.correctAnswers += 1;
              newState.totalQuestions += 1;
              
              // 撃破判定
              const defeated = updatedMonster.currentHp <= 0;
              // judgmentの型を確認してperfect/goodのみ渡す
              if (judgment.timing === 'perfect' || judgment.timing === 'good') {
                onChordCorrect(monster.chordTarget, judgment.timing, totalDamage, defeated, monster.id);
              }
              
              // 次のコードを設定
              if (!defeated) {
                const newChord = selectNextChord(newState.activeMonsters);
                if (newChord) {
                  updatedMonster.chordTarget = newChord;
                  updatedMonster.correctNotes = [];
                  correctNotesMapRef.current.set(monster.id, new Set());
                }
              }
            }
          }

          return updatedMonster;
        });

        // 撃破されたモンスターを除去
        newState.activeMonsters = newState.activeMonsters.filter(m => m.currentHp > 0);
      }

      return newState;
    });
  }, [gameState.isGameActive, gameState.isGameOver, stage, rhythmStore, onChordCorrect, selectNextChord]);

  // ゲーム開始
  const startGame = useCallback(() => {
    if (!stage) {
      console.error('Cannot start rhythm game: stage is null');
      return;
    }

    // リズムストアの初期化
    rhythmStore.initialize(
      stage.bpm || 120,
      stage.timeSignature || 4,
      stage.measureCount || 8,
      stage.loopMeasures || 8
    );

    // プログレッションデータの設定
    if (stage.rhythmPattern === 'progression' && stage.chordProgressionData) {
      rhythmStore.setChordProgressionData(stage.chordProgressionData);
    }

    // モンスター初期化
    const positions: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const initialMonsters: RhythmMonsterState[] = [];
    const monsterCount = Math.min(stage.simultaneousMonsterCount || 1, 4);

    // console.log('🎵 Creating initial monsters:', monsterCount);

    for (let i = 0; i < monsterCount; i++) {
      const monster = createMonster(i, positions[i]);
      if (monster) {
        initialMonsters.push(monster);
        // console.log('🎵 Created monster:', monster.name, 'with chord:', monster.chordTarget.id);
      } else {
        console.error('Failed to create monster at index:', i);
      }
    }

    // ゲーム状態初期化
    const newGameState = {
      playerHp: stage.maxHp,
      maxPlayerHp: stage.maxHp,
      score: 0,
      combo: 0,
      maxCombo: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      activeMonsters: initialMonsters,
      monsterQueue: Array.from({ length: stage.enemyCount - monsterCount }, (_, i) => i + monsterCount),
      simultaneousMonsterCount: stage.simultaneousMonsterCount || 1,
      isCompleting: false,
      currentChord: initialMonsters[0]?.chordTarget || null,
      nextChord: null
    };
    
    // console.log('🎵 Initializing game state:', {
    //   activeMonsters: newGameState.activeMonsters.length,
    //   currentChord: newGameState.currentChord?.id,
    //   isGameActive: newGameState.isGameActive
    // });
    
    setGameState(newGameState);

    // リズム再生開始
    rhythmStore.start();

    // 更新ループ開始
    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateGame);
  }, [stage, rhythmStore, createMonster, updateGame]);

  // ゲーム停止
  const stopGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isGameActive: false
    }));

    rhythmStore.stop();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [rhythmStore]);

  // エフェクト: 状態変更通知
  useEffect(() => {
    // console.log('🎵 Rhythm game state changed:', {
    //   isGameActive: gameState.isGameActive,
    //   activeMonsters: gameState.activeMonsters.length,
    //   currentChord: gameState.currentChord?.id
    // });
    onGameStateChange(gameState);
  }, [gameState, onGameStateChange]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      rhythmStore.stop();
    };
  }, [rhythmStore]);

  return {
    gameState,
    startGame,
    stopGame,
    handleNoteInput
  };
};

export default useRhythmGameEngine;