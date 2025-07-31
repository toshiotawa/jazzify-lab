/**
 * ファンタジーリズムモードエンジン
 * リズムモードのゲームロジックとステート管理を担当
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { type DisplayOpts } from '@/utils/display-note';
import { useTimeStore } from '@/stores/timeStore';
import { useGameStore } from '@/stores/gameStore';
import { 
  loadRhythmJson,
  type RhythmChordData,
  type RhythmJsonData 
} from '@/utils/rhythmJsonLoader';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import { note as parseNote } from 'tonal';

// MONSTERSをIDでアクセスできるマップに変換
const MONSTERS_MAP = MONSTERS.reduce((acc, monster) => {
  acc[monster.id] = monster;
  return acc;
}, {} as Record<string, typeof MONSTERS[0]>);

// ===== 型定義 =====

interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

export interface FantasyStage {
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
  mode: 'single' | 'progression' | 'rhythm';
  allowedChords: string[];
  chordProgression?: string[];
  showSheetMusic: boolean;
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  simultaneousMonsterCount: number;
  bpm: number;
  measureCount?: number;
  countInMeasures?: number;
  timeSignature?: number;
  chordProgressionData?: any;
}

interface RhythmMonsterState {
  id: string;
  index: number;
  position: 'A' | 'B' | 'C' | 'D';
  currentHp: number;
  maxHp: number;
  chordTarget: ChordDefinition;
  correctNotes: number[];
  icon: string;
  name: string;
  // リズムモード特有のプロパティ
  appearTiming: number; // 出現タイミング（ミリ秒）
  targetMeasure: number;
  targetBeat: number;
  gaugeProgress: number; // 0-100%
  isActive: boolean;
  questionIndex: number; // 何問目か
}

interface RhythmGameState {
  currentStage: FantasyStage | null;
  playerHp: number;
  score: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  activeMonsters: RhythmMonsterState[];
  // リズムモード特有の状態
  rhythmData: RhythmJsonData | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  correctAnswers: number;
  inputBuffer: number[];
  lastInputTime: number;
  isCompleting: boolean;
  // プログレッションパターン用
  questionQueue: number[]; // 問題のインデックスキュー
  nextQuestionMap: Map<string, number>; // 列ごとの次の問題インデックス
}

interface RhythmEngineProps {
  stage: FantasyStage | null;
  onGameStateChange: (state: RhythmGameState) => void;
  onChordCorrect: (chord: ChordDefinition, damageDealt: number, defeated: boolean, monsterId: string) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: RhythmGameState) => void;
  onEnemyAttack: (attackingMonsterId?: string) => void;
}

// ===== 定数 =====

const JUDGMENT_WINDOW_MS = 200; // 判定ウィンドウ（前後200ms）
const GAUGE_TARGET_PERCENT = 80; // ゲージの目標位置（80%）
const GAUGE_DURATION_MS = 1000; // ゲージが0%から80%になるまでの時間

// ===== ユーティリティ関数 =====

const getChordDefinition = (chordId: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  const resolved = resolveChord(chordId, 4, displayOpts);
  if (!resolved) {
    console.warn(`⚠️ 未定義のリズムコード: ${chordId}`);
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

// ===== コンポーネント =====

export const useFantasyRhythmEngine = ({ 
  stage, 
  onGameStateChange, 
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack 
}: RhythmEngineProps) => {
  const { settings } = useGameStore();
  const { 
    currentBeat, 
    currentMeasure, 
    bpm, 
    timeSignature, 
    measureCount, 
    countInMeasures, 
    isCountIn,
    setRhythmMode
  } = useTimeStore();
  const animationFrameRef = useRef<number>();
  const gameStartTimeRef = useRef<number>(0);

  // ゲーム状態
  const [gameState, setGameState] = useState<RhythmGameState>({
    currentStage: null,
    playerHp: 100,
    score: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    activeMonsters: [],
    rhythmData: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    inputBuffer: [],
    lastInputTime: 0,
    isCompleting: false,
    questionQueue: [],
    nextQuestionMap: new Map()
  });

  // 表示オプション
  const displayOpts = useMemo<DisplayOpts>(() => ({
    lang: settings.noteNameStyle === 'solfege' ? 'solfege' : 'en',
    simple: settings.simpleDisplayMode
  }), [settings.noteNameStyle, settings.simpleDisplayMode]);

  // ===== 初期化処理 =====

  const initializeGame = useCallback(() => {
    if (!stage) return;

    devLog.debug('🎵 リズムモード初期化', { stage });

    let rhythmData: RhythmJsonData | null = null;
    let totalQuestions = 0;

    // プログレッションパターンの場合、JSONデータを読み込む
    if (stage.mode === 'rhythm' && stage.chordProgressionData) {
      try {
        rhythmData = loadRhythmJson(stage.chordProgressionData);
        totalQuestions = rhythmData.chords.length;
      } catch (error) {
        console.error('リズムJSONデータの読み込みエラー:', error);
      }
    } else {
      // ランダムパターンの場合
      totalQuestions = stage.enemyCount || 1;  // 最低1つの質問を保証
      devLog.debug('🎲 ランダムパターン設定', { enemyCount: stage.enemyCount, totalQuestions });
    }

    // モンスターIDの取得（敵の数に基づいて取得）
    const monsterIds = getStageMonsterIds(stage.enemyCount);
    const monsters = monsterIds
      .map(id => MONSTERS_MAP[id])
      .filter(m => m != null);

    // ゲーム状態の初期化
    const initialState: RhythmGameState = {
      currentStage: stage,
      playerHp: stage.maxHp,
      score: 0,
      isGameActive: false,
      isGameOver: false,
      gameResult: null,
      activeMonsters: [],
      rhythmData,
      currentQuestionIndex: 0,
      totalQuestions,
      correctAnswers: 0,
      inputBuffer: [],
      lastInputTime: 0,
      isCompleting: false,
      questionQueue: [],
      nextQuestionMap: new Map()
    };

    // プログレッションパターンの初期化
    if (stage.mode === 'rhythm' && rhythmData) {
      // 問題キューの初期化（全問題のインデックス）
      initialState.questionQueue = Array.from({ length: totalQuestions }, (_, i) => i);
      
      // 列ごとの次の問題インデックスマップ初期化
      const positions = stage.timeSignature === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
      positions.forEach((pos, i) => {
        initialState.nextQuestionMap.set(pos, i);
      });
    }

    devLog.debug('🎵 ゲーム初期状態設定', { 
      totalQuestions: initialState.totalQuestions,
      rhythmData: !!initialState.rhythmData,
      stage: initialState.currentStage
    });
    
    setGameState(initialState);
    onGameStateChange(initialState);
  }, [stage, displayOpts, onGameStateChange]);

  // ===== ゲーム開始処理 =====

  const startGame = useCallback(() => {
    const currentState = gameState;
    if (!currentState.currentStage || currentState.isGameActive) return;

    devLog.debug('🎵 リズムゲーム開始');
    gameStartTimeRef.current = performance.now();

    const newState = {
      ...currentState,
      isGameActive: true,
      isGameOver: false
    };

    setGameState(newState);
    onGameStateChange(newState);
  }, [gameState, onGameStateChange]);

  // ===== モンスター生成処理 =====

  const spawnRandomMonster = useCallback((state: RhythmGameState) => {
    devLog.debug('🎲 spawnRandomMonster called', { state });
    
    if (!state.currentStage || state.currentQuestionIndex >= state.totalQuestions) {
      devLog.debug('🎲 spawnRandomMonster early return', { 
        hasStage: !!state.currentStage, 
        currentIndex: state.currentQuestionIndex, 
        totalQuestions: state.totalQuestions 
      });
      return;
    }

    const { allowedChords } = state.currentStage;
    const randomChord = allowedChords[Math.floor(Math.random() * allowedChords.length)];
    const chordDef = getChordDefinition(randomChord, displayOpts);
    
    if (!chordDef) {
      devLog.debug('🎲 No chord definition found', { randomChord });
      return;
    }

    const monsterIds = getStageMonsterIds(state.currentStage.enemyCount);
    const monsterId = monsterIds[state.currentQuestionIndex % monsterIds.length];
    const monsterData = MONSTERS_MAP[monsterId];

    if (!monsterData) return;

    const currentTime = performance.now() - gameStartTimeRef.current;

          const newMonster: RhythmMonsterState = {
        id: `${monsterId}_${state.currentQuestionIndex}`,
        index: state.currentQuestionIndex,
        position: 'A', // ランダムパターンは常にA列
        currentHp: state.currentStage.enemyHp,
        maxHp: state.currentStage.enemyHp,
        chordTarget: chordDef,
        correctNotes: [],
        icon: monsterData.iconFile,
        name: monsterData.name,
        appearTiming: currentTime,
        targetMeasure: currentMeasure,
        targetBeat: currentBeat,
        gaugeProgress: 0,
        isActive: true,
        questionIndex: state.currentQuestionIndex
      };

    const newState = {
      ...state,
      activeMonsters: [newMonster],
      currentQuestionIndex: state.currentQuestionIndex + 1
    };

    setGameState(newState);
    onGameStateChange(newState);
  }, [displayOpts, currentMeasure, currentBeat, onGameStateChange]);

  const spawnProgressionMonsters = useCallback((state: RhythmGameState) => {
    devLog.debug('🎼 spawnProgressionMonsters called', { state });
    
    if (!state.currentStage || !state.rhythmData) {
      devLog.debug('🎼 spawnProgressionMonsters early return', { 
        hasStage: !!state.currentStage, 
        hasRhythmData: !!state.rhythmData 
      });
      return;
    }

    const positions = state.currentStage.timeSignature === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
    const newMonsters: RhythmMonsterState[] = [];
    const currentTime = performance.now() - gameStartTimeRef.current;

    positions.forEach((pos) => {
      const questionIndex = state.nextQuestionMap.get(pos);
      if (questionIndex === undefined || questionIndex >= state.totalQuestions) return;

      const chordData = state.rhythmData!.chords[questionIndex];
      const chordDef = getChordDefinition(chordData.chord, displayOpts);
      
      if (!chordDef) return;

      const monsterIds = getStageMonsterIds(state.currentStage!.enemyCount);
      const monsterId = monsterIds[questionIndex % monsterIds.length];
      const monsterData = MONSTERS_MAP[monsterId];

      if (!monsterData) return;

              const newMonster: RhythmMonsterState = {
          id: `${monsterId}_${questionIndex}`,
          index: questionIndex,
          position: pos as any,
          currentHp: state.currentStage!.enemyHp,
          maxHp: state.currentStage!.enemyHp,
          chordTarget: chordDef,
          correctNotes: [],
          icon: monsterData.iconFile,
          name: monsterData.name,
          appearTiming: currentTime,
          targetMeasure: chordData.measure,
          targetBeat: chordData.beat,
          gaugeProgress: 0,
          isActive: true,
          questionIndex
        };

      newMonsters.push(newMonster);
    });

    const newState = {
      ...state,
      activeMonsters: newMonsters
    };

    setGameState(newState);
    onGameStateChange(newState);
  }, [displayOpts, onGameStateChange]);

  // ===== タイミング判定処理 =====

  const checkTiming = useCallback((monster: RhythmMonsterState): boolean => {
    
    // カウントイン中は判定しない
    if (isCountIn) return false;

    // 実際の小節番号を計算（ループを考慮）
    const actualMeasure = ((currentMeasure - 1) % measureCount) + 1;
    
    // 目標タイミングとの差を計算
    let measureDiff = actualMeasure - monster.targetMeasure;
    const beatDiff = currentBeat - monster.targetBeat;

    // ループを考慮した補正
    if (measureDiff < -measureCount / 2) {
      measureDiff += measureCount;
    } else if (measureDiff > measureCount / 2) {
      measureDiff -= measureCount;
    }

    // 拍の差をミリ秒に変換
    const msPerBeat = 60000 / bpm;
    const totalBeatDiff = measureDiff * timeSignature + beatDiff;
    const timeDiffMs = Math.abs(totalBeatDiff * msPerBeat);

    return timeDiffMs <= JUDGMENT_WINDOW_MS;
  }, [currentMeasure, currentBeat, bpm, timeSignature, measureCount, isCountIn]);

  // ===== 入力処理 =====

  const handleNoteInput = useCallback((note: number) => {
    const currentState = gameState;
    if (!currentState.isGameActive || currentState.isGameOver) return;

    const currentTime = performance.now();
    const newInputBuffer = [...currentState.inputBuffer, note];
    
    devLog.debug('🎵 音入力', { note, buffer: newInputBuffer });

    // アクティブなモンスターに対して判定
    let anyCorrect = false;
    const updatedMonsters = currentState.activeMonsters.map(monster => {
      if (!monster.isActive) return monster;

      // タイミング判定
      const inWindow = checkTiming(monster);
      if (!inWindow) {
        devLog.debug('🎵 タイミング判定外', { monster: monster.id });
        return monster;
      }

      // コード判定
      const updatedCorrectNotes = [...monster.correctNotes];
      if (monster.chordTarget.notes.includes(note) && !updatedCorrectNotes.includes(note)) {
        updatedCorrectNotes.push(note);
      }

      // コード完成判定
      const isComplete = monster.chordTarget.notes.every(n => updatedCorrectNotes.includes(n));
      
      if (isComplete) {
        anyCorrect = true;
        const damage = Math.floor(Math.random() * (currentState.currentStage!.maxDamage - currentState.currentStage!.minDamage + 1)) + currentState.currentStage!.minDamage;
        const newHp = Math.max(0, monster.currentHp - damage);
        const defeated = newHp === 0;

        onChordCorrect(monster.chordTarget, damage, defeated, monster.id);

        if (defeated) {
          return { ...monster, currentHp: 0, isActive: false };
        } else {
          return { ...monster, currentHp: newHp, correctNotes: [] };
        }
      }

      return { ...monster, correctNotes: updatedCorrectNotes };
    });

    // 判定ウィンドウ内に正解がない場合、バッファリセット
    const anyInWindow = currentState.activeMonsters.some(m => m.isActive && checkTiming(m));
    const newBuffer = anyInWindow && !anyCorrect ? newInputBuffer : [];

    const newState = {
      ...currentState,
      activeMonsters: updatedMonsters,
      inputBuffer: newBuffer,
      lastInputTime: currentTime,
      correctAnswers: anyCorrect ? currentState.correctAnswers + 1 : currentState.correctAnswers,
      score: anyCorrect ? currentState.score + 100 : currentState.score
    };

    // 倒したモンスターの補充
    if (anyCorrect) {
      replaceDefeatedMonsters(newState);
    }

    setGameState(newState);
    onGameStateChange(newState);

    // ゲーム終了判定
    checkGameEnd(newState);
  }, [gameState, checkTiming, onChordCorrect, onGameStateChange]);

  // ===== モンスター補充処理 =====

  const replaceDefeatedMonsters = useCallback((state: RhythmGameState) => {
    if (!state.currentStage) return;

    const newMonsters = [...state.activeMonsters];

    if (state.rhythmData) {
      // プログレッションパターン
      state.activeMonsters.forEach((monster, index) => {
        if (!monster.isActive && monster.currentHp === 0) {
          const nextIndex = (monster.questionIndex + state.currentStage!.timeSignature!) % state.totalQuestions;
          const chordData = state.rhythmData!.chords[nextIndex];
          const chordDef = getChordDefinition(chordData.chord, displayOpts);
          
          if (chordDef) {
            const monsterIds = getStageMonsterIds(state.currentStage!.enemyCount);
            const monsterId = monsterIds[nextIndex % monsterIds.length];
            const monsterData = MONSTERS_MAP[monsterId];

            if (monsterData) {
              newMonsters[index] = {
                ...monster,
                id: `${monsterId}_${nextIndex}`,
                chordTarget: chordDef,
                currentHp: state.currentStage!.enemyHp,
                correctNotes: [],
                icon: monsterData.iconFile,
                name: monsterData.name,
                targetMeasure: chordData.measure,
                targetBeat: chordData.beat,
                gaugeProgress: 0,
                isActive: true,
                questionIndex: nextIndex
              };

              // 次の問題インデックスを更新
              state.nextQuestionMap.set(monster.position, (nextIndex + state.currentStage!.timeSignature!) % state.totalQuestions);
            }
          }
        }
      });

      state.activeMonsters = newMonsters;
    } else {
      // ランダムパターン（次の問題を生成）
      if (state.currentQuestionIndex < state.totalQuestions) {
        spawnRandomMonster(state);
      }
    }
  }, [displayOpts, spawnRandomMonster]);

  // ===== ゲージ更新処理 =====

  const updateGauges = useCallback(() => {
    const currentState = gameState;
    if (!currentState.isGameActive || !currentState.currentStage) {
      devLog.debug('🕐 updateGauges skipped', { 
        isActive: currentState.isGameActive, 
        hasStage: !!currentState.currentStage 
      });
      return;
    }

    const currentTime = performance.now() - gameStartTimeRef.current;
    devLog.debug('🕐 updateGauges running', { currentTime, activeMonsters: currentState.activeMonsters.length });
    let anyTimeout = false;

    const updatedMonsters = currentState.activeMonsters.map(monster => {
      if (!monster.isActive) return monster;

      // ゲージ進行度を計算
      const elapsedTime = currentTime - monster.appearTiming;
      const progress = Math.min(100, (elapsedTime / GAUGE_DURATION_MS) * GAUGE_TARGET_PERCENT);

      // 判定タイミングを過ぎたかチェック
      if (progress >= GAUGE_TARGET_PERCENT && !checkTiming(monster)) {
        anyTimeout = true;
        onEnemyAttack(monster.id);
        return { ...monster, isActive: false, gaugeProgress: 100 };
      }

      return { ...monster, gaugeProgress: progress };
    });

    const newState = {
      ...currentState,
      activeMonsters: updatedMonsters,
      playerHp: anyTimeout ? Math.max(0, currentState.playerHp - 1) : currentState.playerHp
    };

    if (anyTimeout) {
      // タイムアウトしたモンスターの補充
      replaceDefeatedMonsters(newState);
    }

    setGameState(newState);
    onGameStateChange(newState);

    // ゲーム終了判定
    if (newState.playerHp <= 0) {
      endGame('gameover');
    }
  }, [gameState, checkTiming, onEnemyAttack, onGameStateChange, replaceDefeatedMonsters]);

  // ===== ゲーム終了判定 =====

  const checkGameEnd = useCallback((state: RhythmGameState) => {
    if (state.isCompleting) return;

    // ランダムパターンの場合
    if (!state.rhythmData) {
      if (state.correctAnswers >= state.totalQuestions) {
        endGame('clear');
      }
    } else {
      // プログレッションパターンの場合（全モンスターのHPが0）
      const allDefeated = state.activeMonsters.every(m => m.currentHp === 0);
      if (allDefeated && state.correctAnswers >= state.totalQuestions) {
        endGame('clear');
      }
    }
  }, []);

  const endGame = useCallback((result: 'clear' | 'gameover') => {
    const currentState = gameState;
    if (currentState.isCompleting) return;

    devLog.debug('🎵 リズムゲーム終了', { result });

    const finalState = {
      ...currentState,
      isGameActive: false,
      isGameOver: true,
      gameResult: result,
      isCompleting: true
    };

    setGameState(finalState);
    onGameStateChange(finalState);
    onGameComplete(result, finalState);

    // アニメーションフレームをキャンセル
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [gameState, onGameStateChange, onGameComplete]);

  // ===== アニメーションループ =====

  useEffect(() => {
    if (!gameState.isGameActive) return;

    const animate = () => {
      updateGauges();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isGameActive, updateGauges]);

  // ===== リズムモード設定 =====
  
  useEffect(() => {
    if (stage && stage.mode === 'rhythm') {
      setRhythmMode(true);
      return () => {
        setRhythmMode(false);
      };
    }
  }, [stage, setRhythmMode]);

  // ===== 初期化 =====

  useEffect(() => {
    initializeGame();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stage, initializeGame]);

  // ===== ゲーム開始時のモンスター生成 =====
  
  useEffect(() => {
    if (gameState.isGameActive && gameState.activeMonsters.length === 0 && gameState.currentStage) {
      devLog.debug('🎮 初回モンスター生成開始');
      // 最初のモンスターを配置
      if (gameState.rhythmData) {
        // プログレッションパターン
        spawnProgressionMonsters(gameState);
      } else {
        // ランダムパターン
        spawnRandomMonster(gameState);
      }
    }
  }, [gameState, spawnProgressionMonsters, spawnRandomMonster]);

  return {
    gameState,
    startGame,
    handleNoteInput,
    displayOpts
  };
};

export default useFantasyRhythmEngine;