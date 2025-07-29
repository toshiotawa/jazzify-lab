/**
 * リズムゲームエンジン
 * リズムモードのゲームロジックとステート管理を担当
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  RhythmGameState, 
  RhythmStageData, 
  RhythmEvent,
  LaneState,
  JudgmentResult,
  GaugeState,
  TimeSignature,
  PatternType
} from '@/types/rhythmMode';
import { RhythmAudioManager } from '@/utils/rhythmAudioManager';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import {
  calculateMeasureProgress,
  calculateGaugePercent,
  judgeInputTiming,
  calculateDamageMultiplier,
  calculateScoreBonus,
  initializeLanes,
  updateLaneChord,
  selectRandomChord,
  isWithinJudgmentWindow,
  hasMissedTiming,
  updateGaugeState,
  GAUGE_MARKER_PERCENT,
  JUDGMENT_WINDOW_MS,
  type TimingJudgment,
} from '@/utils/rhythmGameLogic';

// ===== 定数 =====
const SP_MAX = 5;
const SP_DAMAGE_MULTIPLIER = 2;

// ===== インターフェース =====
interface RhythmGameEngineProps {
  stage: RhythmStageData | null;
  rhythmEvents: RhythmEvent[];
  onGameStateChange: (state: RhythmGameState) => void;
  onChordCorrect: (chord: string, timing: JudgmentResult, damageDealt: number, defeated: boolean, enemyId: string) => void;
  onChordIncorrect: (expectedChord: string, lane: number) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: RhythmGameState) => void;
  onEnemyAttack: (attackingEnemyId: string) => void;
  inputNotes: Set<number>;
  onStartBattle: () => void;
  isGamePaused: boolean;
}

export const RhythmGameEngine: React.FC<RhythmGameEngineProps> = ({
  stage,
  rhythmEvents,
  onGameStateChange,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
  inputNotes,
  onStartBattle,
  isGamePaused,
}) => {
  const audioManagerRef = useRef<RhythmAudioManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const gameStateRef = useRef<RhythmGameState | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set()); // 処理済みイベントを追跡

  // 敵の管理
  const enemyStore = useEnemyStore();
  const { enemies, setEnemies, updateEnemy, removeEnemy } = enemyStore;

  // ゲーム状態の初期化
  const initializeGameState = useCallback((): RhythmGameState | null => {
    if (!stage || !stage.pattern_type) return null;

    const patternType = stage.pattern_type;
    const laneCount = stage.time_signature;
    
    // レーンの初期化（プログレッションパターン用）
    let lanes: LaneState[] | undefined;
    if (patternType === 'progression' && stage.chord_progression) {
      lanes = initializeLanes(laneCount, stage.chord_progression);
    }

    // ランダムパターンの初期コード
    let initialChord: string | undefined;
    if (patternType === 'random' && rhythmEvents.length > 0) {
      initialChord = rhythmEvents[0].code;
    }

    return {
      playMode: stage.play_mode,
      patternType: patternType as PatternType,
      songMetadata: {
        bpm: stage.bpm,
        timeSignature: stage.time_signature,
        loopMeasures: stage.loop_measures,
        audioUrl: stage.bgm_url || '',
      },
      currentMeasure: 0,
      currentBeat: 0,
      songTime: 0,
      isPlaying: false,
      isPaused: false,
      
      // パターン別の初期値
      currentChord: initialChord,
      nextChordTime: patternType === 'random' ? 0 : undefined,
      lanes,
      progressionIndex: patternType === 'progression' ? 0 : undefined,
      
      // 共通
      combo: 0,
      score: 0,
      playerHP: 100,
      sp: 0,
      judgmentHistory: [],
    };
  }, [stage, rhythmEvents]);

  // ゲーム状態
  const [gameState, setGameState] = useState<RhythmGameState | null>(initializeGameState);

  // オーディオマネージャーの初期化
  useEffect(() => {
    if (!stage || !gameState) return;

    const initAudio = async () => {
      try {
        const manager = new RhythmAudioManager();
        
        if (stage.bgm_url) {
          await manager.loadSong(stage.bgm_url);
          manager.setLoopPoints(1, stage.loop_measures, stage.bpm, stage.time_signature);
        }
        
        audioManagerRef.current = manager;
      } catch (error) {
        devLog('Audio initialization error:', error);
      }
    };

    initAudio();

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose();
        audioManagerRef.current = null;
      }
    };
  }, [stage, gameState]);

  // ゲーム開始処理
  const handleGameStart = useCallback(() => {
    if (!audioManagerRef.current || !gameState || !stage) return;

    // 音楽再生
    audioManagerRef.current.play().catch(error => {
      devLog('Failed to play audio:', error);
    });

    // 敵の初期化
    const monsterIds = getStageMonsterIds(stage.stage_number);
    const initialEnemies = createInitialEnemies(stage, monsterIds);
    setEnemies(initialEnemies);

    // ゲーム状態の更新
    setGameState(prev => prev ? { ...prev, isPlaying: true } : null);
    gameStateRef.current = { ...gameState, isPlaying: true };

    // スタートバトルコールバック
    onStartBattle();

    // アニメーションループ開始
    startAnimationLoop();
  }, [gameState, stage, setEnemies, onStartBattle]);

  // 敵の初期作成
  const createInitialEnemies = (stage: RhythmStageData, monsterIds: string[]) => {
    const enemyCount = stage.pattern_type === 'progression' 
      ? stage.time_signature 
      : 1;

    return Array.from({ length: enemyCount }, (_, index) => {
      const monsterId = monsterIds[index % monsterIds.length];
      const monsterData = MONSTERS[monsterId];
      return {
        id: `enemy-${index}`,
        name: monsterData?.name || `Monster ${index + 1}`,
        icon: stage.monster_icon,
        hp: stage.enemy_hp,
        maxHp: stage.enemy_hp,
        gauge: 0,
        lane: index,
      };
    });
  };

  // アニメーションループ
  const startAnimationLoop = useCallback(() => {
    const animate = (timestamp: number) => {
      if (!audioManagerRef.current || !gameStateRef.current || isGamePaused) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = timestamp - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = timestamp;

      // 現在の楽曲時間を取得
      const songTime = audioManagerRef.current.getCurrentTime();
      
      // ゲーム状態の更新
      updateGameState(songTime, deltaTime / 1000);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isGamePaused]);

  // ゲーム状態の更新
  const updateGameState = useCallback((songTime: number, deltaTime: number) => {
    if (!gameStateRef.current || !stage) return;

    const state = gameStateRef.current;
    const { bpm, timeSignature } = state.songMetadata;
    
    // 現在の小節と拍を計算
    const secondsPerBeat = 60 / bpm;
    const beatsPerMeasure = timeSignature;
    const secondsPerMeasure = secondsPerBeat * beatsPerMeasure;
    
    const currentMeasure = Math.floor(songTime / secondsPerMeasure) + 1;
    const measureProgress = (songTime % secondsPerMeasure) / secondsPerMeasure;
    const currentBeat = (measureProgress * beatsPerMeasure) + 1;

    // ゲージの更新
    updateGauges(songTime, deltaTime);

    // イベントの処理
    processRhythmEvents(songTime);

    // 状態の更新
    const updatedState: RhythmGameState = {
      ...state,
      songTime,
      currentMeasure,
      currentBeat,
    };

    gameStateRef.current = updatedState;
    setGameState(updatedState);
    onGameStateChange(updatedState);
  }, [stage, onGameStateChange]);

  // 次のイベントを見つける
  const findNextEvent = useCallback((currentTime: number): RhythmEvent | null => {
    if (!rhythmEvents.length) return null;
    
    const { bpm, timeSignature } = gameStateRef.current!.songMetadata;
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = secondsPerBeat * timeSignature;
    
    // 各イベントの時刻を計算して、次のイベントを見つける
    for (const event of rhythmEvents) {
      const eventTime = (event.measure - 1) * secondsPerMeasure + (event.beat - 1) * secondsPerBeat;
      if (eventTime > currentTime) {
        return event;
      }
    }
    
    // ループ時は最初のイベントに戻る
    return rhythmEvents[0];
  }, [rhythmEvents]);

  // ゲージの更新
  const updateGauges = useCallback((songTime: number, deltaTime: number) => {
    if (!stage || !gameStateRef.current) return;

    const state = gameStateRef.current;
    const { bpm, timeSignature } = state.songMetadata;
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = secondsPerBeat * timeSignature;

    // 次のイベントを取得
    const nextEvent = findNextEvent(songTime);
    if (!nextEvent) return;

    // 次のイベントまでの時間を計算
    const nextEventTime = (nextEvent.measure - 1) * secondsPerMeasure + (nextEvent.beat - 1) * secondsPerBeat;
    let timeUntilEvent = nextEventTime - songTime;
    
    // すでに過ぎている場合は次のループでのタイミングを計算
    if (timeUntilEvent < 0) {
      const loopDuration = state.songMetadata.loopMeasures * secondsPerMeasure;
      timeUntilEvent += loopDuration;
    }

    // パターンによって異なる処理
    if (state.patternType === 'random') {
      // ランダムパターン：単一の敵のゲージ更新
      const enemy = enemies.find(e => e.hp > 0);
      if (enemy) {
        // イベントまでの残り時間からゲージを計算
        const secondsForGauge = stage.enemy_gauge_seconds || secondsPerMeasure;
        const gaugePercent = Math.max(0, Math.min(100, (1 - timeUntilEvent / secondsForGauge) * 100));
        
        updateEnemy(enemy.id, { gauge: gaugePercent });

        // 現在のコードを設定
        if (state.currentChord !== nextEvent.code && timeUntilEvent < secondsForGauge) {
          gameStateRef.current.currentChord = nextEvent.code;
        }

        // タイミングを逃した場合
        if (gaugePercent >= 100 && timeUntilEvent <= 0) {
          const eventId = `${nextEvent.measure}-${nextEvent.beat}-${nextEvent.code}`;
          if (!processedEventsRef.current.has(eventId)) {
            handleMissedTiming(enemy.id, 0);
            processedEventsRef.current.add(eventId);
          }
        }
      }
    } else if (state.patternType === 'progression' && state.lanes) {
      // プログレッションパターン：複数レーンのゲージ更新
      state.lanes.forEach((lane, index) => {
        const enemy = enemies[index];
        if (!enemy || enemy.hp <= 0) return;

        // このレーンに対応するイベントを探す
        const laneEvent = rhythmEvents.find(e => 
          e.code === lane.currentChord && 
          Math.abs(((e.measure - 1) * secondsPerMeasure + (e.beat - 1) * secondsPerBeat) - songTime) < secondsPerMeasure
        );

        if (laneEvent) {
          const eventTime = (laneEvent.measure - 1) * secondsPerMeasure + (laneEvent.beat - 1) * secondsPerBeat;
          let timeUntil = eventTime - songTime;
          
          if (timeUntil < 0 && timeUntil > -0.2) {
            // Just passed
            timeUntil = 0;
          } else if (timeUntil < -0.2) {
            // Way past, wait for next loop
            timeUntil += state.songMetadata.loopMeasures * secondsPerMeasure;
          }

          const secondsForGauge = stage.enemy_gauge_seconds || secondsPerMeasure;
          const gaugePercent = Math.max(0, Math.min(100, (1 - timeUntil / secondsForGauge) * 100));
          
          updateEnemy(enemy.id, { gauge: gaugePercent });
        }
      });
    }
  }, [stage, enemies, updateEnemy, findNextEvent, rhythmEvents]);

  // リズムイベントの処理
  const processRhythmEvents = useCallback((songTime: number) => {
    if (!stage || !gameStateRef.current) return;

    const state = gameStateRef.current;
    const { bpm, timeSignature } = state.songMetadata;
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = secondsPerBeat * timeSignature;

    rhythmEvents.forEach(event => {
      // イベント時刻を計算
      const eventTime = (event.measure - 1) * secondsPerMeasure + 
                       (event.beat - 1) * secondsPerBeat;
      
      // イベントIDを作成（重複処理を防ぐため）
      const eventId = `${event.measure}-${event.beat}-${event.code}`;
      
      // 判定ウィンドウ内かチェック（JUDGMENT_WINDOW_MS をミリ秒から秒に変換）
      const judgmentWindowSeconds = JUDGMENT_WINDOW_MS / 1000;
      
      if (Math.abs(songTime - eventTime) <= judgmentWindowSeconds && 
          !processedEventsRef.current.has(eventId)) {
        
        // 入力をチェック
        checkInputTiming(event, songTime - eventTime);
        
        // 処理済みとしてマーク
        processedEventsRef.current.add(eventId);
      }
    });
  }, [stage, rhythmEvents]);

  // 入力タイミングのチェック
  const checkInputTiming = useCallback((event: RhythmEvent, timingDiff: number) => {
    if (!stage || !gameStateRef.current) return;

    const state = gameStateRef.current;
    const chord = resolveChord(event.code);
    if (!chord) return;

    const requiredNotes = new Set(chord.notes);
    const isCorrect = Array.from(requiredNotes).every(note => inputNotes.has(note));

    if (isCorrect) {
      // パターンに応じた正解判定
      if (state.patternType === 'random') {
        // ランダムパターン：現在のコードと一致するか確認
        if (event.code === state.currentChord) {
          handleCorrectTiming(event, timingDiff);
        }
      } else if (state.patternType === 'progression') {
        // プログレッションパターン：該当レーンのコードと一致するか確認
        handleCorrectTiming(event, timingDiff);
      }
    }
  }, [stage, inputNotes]);

  // 正解時の処理
  const handleCorrectTiming = useCallback((event: RhythmEvent, timingDiff: number) => {
    if (!stage || !gameStateRef.current) return;

    const state = gameStateRef.current;
    const timing = judgeInputTiming(timingDiff);

    // ダメージ計算
    const baseDamage = stage.min_damage + Math.random() * (stage.max_damage - stage.min_damage);
    const timingMultiplier = calculateDamageMultiplier(timing);
    const damage = Math.round(baseDamage * timingMultiplier);

    // SP処理
    const spDamage = state.sp >= SP_MAX ? damage * SP_DAMAGE_MULTIPLIER : damage;
    const newSp = state.sp >= SP_MAX ? 0 : Math.min(state.sp + 1, SP_MAX);

    // 対象の敵を特定
    let targetEnemy;
    let targetLane = 0;
    
    if (state.patternType === 'random') {
      targetEnemy = enemies.find(e => e.hp > 0);
    } else if (state.patternType === 'progression' && state.lanes) {
      // プログレッションパターン：コードに対応するレーンを探す
      const laneIndex = state.lanes.findIndex(lane => lane.currentChord === event.code);
      if (laneIndex >= 0) {
        targetEnemy = enemies[laneIndex];
        targetLane = laneIndex;
      }
    }

    if (!targetEnemy) return;

    // ダメージ適用
    const newHp = Math.max(0, targetEnemy.hp - spDamage);
    const defeated = newHp === 0;
    
    updateEnemy(targetEnemy.id, { hp: newHp });

    // ランダムパターンで敵を倒した場合、次のコードを設定
    if (state.patternType === 'random' && defeated) {
      const nextChord = selectRandomChord(stage.allowed_chords, state.currentChord);
      gameStateRef.current.currentChord = nextChord;
    }

    // プログレッションパターンで敵を倒した場合、レーンを更新
    if (state.patternType === 'progression' && defeated && state.lanes && state.progressionIndex !== undefined && stage.chord_progression) {
      const { updatedLanes, newProgressionIndex } = updateLaneChord(
        state.lanes,
        targetLane,
        stage.chord_progression,
        state.progressionIndex
      );
      gameStateRef.current.lanes = updatedLanes;
      gameStateRef.current.progressionIndex = newProgressionIndex;
    }

    // コールバック
    const judgmentResult: JudgmentResult = {
      timing: timing as JudgmentResult['timing'],
      accuracy: timingDiff,
      chord: event.code,
      lane: targetLane,
    };

    onChordCorrect(event.code, judgmentResult, spDamage, defeated, targetEnemy.id);

    // スコア更新
    const scoreBonus = calculateScoreBonus(timing);
    const newScore = state.score + scoreBonus + Math.round(spDamage);

    // 状態更新
    gameStateRef.current = {
      ...state,
      score: newScore,
      sp: newSp,
      combo: state.combo + 1,
      judgmentHistory: [...state.judgmentHistory, judgmentResult],
    };

    // ゲームクリアチェック
    if (enemies.every(e => e.hp === 0)) {
      handleGameComplete('clear');
    }
  }, [stage, enemies, updateEnemy, onChordCorrect]);

  // タイミングを逃した時の処理
  const handleMissedTiming = useCallback((enemyId: string, lane: number) => {
    if (!gameStateRef.current) return;

    const state = gameStateRef.current;
    
    // 敵の攻撃
    onEnemyAttack(enemyId);
    
    // プレイヤーダメージ
    const damage = 10; // 固定ダメージ
    const newPlayerHp = Math.max(0, state.playerHP - damage);
    
    // コンボリセット
    const newCombo = 0;

    // 状態更新
    gameStateRef.current = {
      ...state,
      playerHP: newPlayerHp,
      combo: newCombo,
    };

    // ゲームオーバーチェック
    if (newPlayerHp === 0) {
      handleGameComplete('gameover');
    }
  }, [onEnemyAttack]);

  // ゲーム完了処理
  const handleGameComplete = useCallback((result: 'clear' | 'gameover') => {
    if (!gameStateRef.current) return;

    // 音楽停止
    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
    }

    // アニメーションループ停止
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 最終状態を通知
    onGameComplete(result, gameStateRef.current);
  }, [onGameComplete]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose();
      }
    };
  }, []);

  // ゲーム開始ボタンのハンドラ
  useEffect(() => {
    if (gameState && !gameState.isPlaying && stage) {
      // ゲーム開始を待機
      const handleStart = () => {
        handleGameStart();
      };

      // 外部からの開始トリガーを待つ
      window.addEventListener('rhythm-game-start', handleStart);
      
      return () => {
        window.removeEventListener('rhythm-game-start', handleStart);
      };
    }
  }, [gameState, stage, handleGameStart]);

  return null; // このコンポーネントはロジックのみ
};