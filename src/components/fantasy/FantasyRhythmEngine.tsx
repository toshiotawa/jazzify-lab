/**
 * ファンタジーリズムモードエンジン
 * リズムゲームロジックとステート管理を担当
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { type DisplayOpts } from '@/utils/display-note';
import { note as parseNote } from 'tonal';
import type { FantasyStage } from './FantasyGameEngine';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

interface RhythmChordData {
  chord: string;
  measure: number;
  beat: number;
}

interface RhythmMonster {
  id: string;
  position: 'A' | 'B' | 'C' | 'D';
  currentHp: number;
  maxHp: number;
  chordData: RhythmChordData;
  chordDefinition: ChordDefinition;
  lastAttackTime: number;
  gaugeProgress: number; // 0-100%
  displayStartTime: number; // 表示開始時刻
}

interface RhythmGameState {
  isActive: boolean;
  playerHp: number;
  score: number;
  correctCount: number;
  totalCount: number;
  activeMonsters: RhythmMonster[];
  inputBuffer: number[];
  lastInputTime: number;
  chordProgressionData: RhythmChordData[] | null;
  currentChordIndex: number;
  monsterIdCounter: number;
}

const JUDGMENT_WINDOW_MS = 200; // 判定ウィンドウ (前後200ms)
const GAUGE_DURATION_MS = 1000; // ゲージが0%から80%まで進む時間

// ===== ユーティリティ関数 =====

const getChordDefinition = (chordId: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  const resolved = resolveChord(chordId, 4, displayOpts);
  if (!resolved) {
    devLog.debug(`⚠️ 未定義のリズムコード: ${chordId}`);
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

// ===== リズムモードエンジン =====

export const useFantasyRhythmEngine = (
  stage: FantasyStage,
  displayOpts?: DisplayOpts,
  onChordCorrect?: (chord: ChordDefinition, damage: number, monsterId: string) => void,
  onChordIncorrect?: (expectedChord: ChordDefinition) => void,
  onEnemyAttack?: (monsterId: string) => void,
  onGameComplete?: (result: 'clear' | 'gameover') => void
) => {
  const [gameState, setGameState] = useState<RhythmGameState>({
    isActive: false,
    playerHp: stage?.maxHp || 5,
    score: 0,
    correctCount: 0,
    totalCount: 0,
    activeMonsters: [],
    inputBuffer: [],
    lastInputTime: 0,
    chordProgressionData: null,
    currentChordIndex: 0,
    monsterIdCounter: 0
  });

  const timeStore = useTimeStore();
  const processedChordsRef = useRef<Set<string>>(new Set());

  // コード進行データの読み込み
  useEffect(() => {
    if (stage?.chord_progression_data) {
      setGameState(prev => ({
        ...prev,
        chordProgressionData: stage.chord_progression_data.chords || []
      }));
    }
  }, [stage]);

  // ランダムコード生成
  const generateRandomChord = useCallback(() => {
    if (!stage?.allowedChords || stage.allowedChords.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * stage.allowedChords.length);
    return stage.allowedChords[randomIndex];
  }, [stage]);

  // モンスター生成
  const spawnMonster = useCallback((chordData: RhythmChordData, position: 'A' | 'B' | 'C' | 'D') => {
    const chordDef = getChordDefinition(chordData.chord, displayOpts);
    if (!chordDef) return null;

    const monster: RhythmMonster = {
      id: `rhythm-monster-${gameState.monsterIdCounter}`,
      position,
      currentHp: stage?.enemyHp || 1,
      maxHp: stage?.enemyHp || 1,
      chordData,
      chordDefinition: chordDef,
      lastAttackTime: 0,
      gaugeProgress: 0,
      displayStartTime: performance.now()
    };

    setGameState(prev => ({
      ...prev,
      monsterIdCounter: prev.monsterIdCounter + 1
    }));

    return monster;
  }, [stage, displayOpts, gameState.monsterIdCounter]);

  // タイミング判定
  const checkTiming = useCallback((inputTime: number, targetMeasure: number, targetBeat: number): boolean => {
    const timingInfo = timeStore.getCurrentTimingInfo();
    
    // カウントイン中は判定しない
    if (timingInfo.isInCountIn) return false;
    
    // 目標タイミングの計算
    const msPerBeat = 60000 / timeStore.bpm;
    const targetBeatsFromStart = (targetMeasure - 1) * timeStore.timeSignature + (targetBeat - 1);
    const targetTimeMs = timeStore.readyDuration + targetBeatsFromStart * msPerBeat;
    
    // 現在時刻との差分
    const currentTimeMs = timingInfo.currentTime;
    const timeDiff = Math.abs(currentTimeMs - targetTimeMs);
    
    return timeDiff <= JUDGMENT_WINDOW_MS;
  }, [timeStore]);

  // 入力処理
  const handleInput = useCallback((noteNumber: number) => {
    const now = performance.now();
    
    setGameState(prev => {
      const newBuffer = [...prev.inputBuffer, noteNumber];
      
      // アクティブなモンスターをチェック
      const updatedMonsters = [...prev.activeMonsters];
      let hitFound = false;
      
      for (let i = 0; i < updatedMonsters.length; i++) {
        const monster = updatedMonsters[i];
        
        // タイミング判定
        if (checkTiming(now, monster.chordData.measure, monster.chordData.beat)) {
          // コード判定
          const sortedBuffer = [...newBuffer].sort((a, b) => a - b);
          const sortedTarget = [...monster.chordDefinition.notes].sort((a, b) => a - b);
          
          if (sortedBuffer.length === sortedTarget.length &&
              sortedBuffer.every((note, idx) => note === sortedTarget[idx])) {
            // 正解
            hitFound = true;
            
            // ダメージ処理
                          const damage = stage?.minDamage || 1;
            monster.currentHp -= damage;
            
            if (monster.currentHp <= 0) {
              // モンスター撃破
              updatedMonsters.splice(i, 1);
              i--;
            }
            
            // コールバック
            if (onChordCorrect) {
              onChordCorrect(monster.chordDefinition, damage, monster.id);
            }
            
            break;
          }
        }
      }
      
      if (hitFound) {
        // 正解時の処理
        return {
          ...prev,
          activeMonsters: updatedMonsters,
          inputBuffer: [],
          lastInputTime: now,
          correctCount: prev.correctCount + 1,
          score: prev.score + 100
        };
      } else if (now - prev.lastInputTime > JUDGMENT_WINDOW_MS) {
        // 判定ウィンドウを超えた場合はバッファリセット
        return {
          ...prev,
          inputBuffer: [],
          lastInputTime: now
        };
      } else {
        // バッファ更新
        return {
          ...prev,
          inputBuffer: newBuffer,
          lastInputTime: now
        };
      }
    });
  }, [checkTiming, stage, onChordCorrect]);

  // ゲームループ
  useEffect(() => {
    if (!gameState.isActive || !timeStore.startAt) return;
    
    const updateLoop = () => {
      const timingInfo = timeStore.getCurrentTimingInfo();
      
      // カウントイン中はスキップ
      if (timingInfo.isInCountIn) return;
      
      setGameState(prev => {
        const updatedState = { ...prev };
        const now = performance.now();
        
        // モンスターのゲージ更新と攻撃判定
        updatedState.activeMonsters = prev.activeMonsters.map(monster => {
          const elapsedTime = now - monster.displayStartTime;
          const progress = Math.min(100, (elapsedTime / GAUGE_DURATION_MS) * 80);
          
          // 80%到達で攻撃判定
          if (progress >= 80 && monster.lastAttackTime === 0) {
            // 判定ウィンドウ内に正解がなければ攻撃
            const targetTime = monster.displayStartTime + GAUGE_DURATION_MS;
            if (now > targetTime + JUDGMENT_WINDOW_MS) {
              monster.lastAttackTime = now;
              updatedState.playerHp -= 1;
              
              if (onEnemyAttack) {
                onEnemyAttack(monster.id);
              }
            }
          }
          
          return {
            ...monster,
            gaugeProgress: progress
          };
        });
        
        // プレイヤーHP確認
        if (updatedState.playerHp <= 0 && onGameComplete) {
          onGameComplete('gameover');
          updatedState.isActive = false;
        }
        
        // 新しいモンスターの生成（コードプログレッションモード）
        if (prev.chordProgressionData && prev.activeMonsters.length < 4) {
          const positions: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
          const occupiedPositions = prev.activeMonsters.map(m => m.position);
          const availablePositions = positions.filter(p => !occupiedPositions.includes(p));
          
          if (availablePositions.length > 0) {
            const nextChord = prev.chordProgressionData[prev.currentChordIndex];
            if (nextChord && checkTiming(now, nextChord.measure, nextChord.beat)) {
              const chordKey = `${nextChord.measure}-${nextChord.beat}`;
              if (!processedChordsRef.current.has(chordKey)) {
                processedChordsRef.current.add(chordKey);
                const newMonster = spawnMonster(nextChord, availablePositions[0]);
                if (newMonster) {
                  updatedState.activeMonsters.push(newMonster);
                  updatedState.currentChordIndex = (prev.currentChordIndex + 1) % prev.chordProgressionData.length;
                }
              }
            }
          }
        }
        
        // ランダムモードでのモンスター生成
        if (!prev.chordProgressionData && prev.activeMonsters.length === 0) {
          const currentMeasure = timingInfo.measureFromStart;
          const chordKey = `random-${currentMeasure}`;
          
          if (!processedChordsRef.current.has(chordKey) && currentMeasure > 0) {
            processedChordsRef.current.add(chordKey);
            const randomChord = generateRandomChord();
            if (randomChord) {
              const chordData: RhythmChordData = {
                chord: randomChord,
                measure: currentMeasure,
                beat: 1
              };
              const newMonster = spawnMonster(chordData, 'A');
              if (newMonster) {
                updatedState.activeMonsters.push(newMonster);
              }
            }
          }
        }
        
        return updatedState;
      });
    };
    
    const intervalId = setInterval(updateLoop, 16); // 60fps
    
    return () => clearInterval(intervalId);
  }, [gameState.isActive, timeStore, checkTiming, spawnMonster, generateRandomChord, onEnemyAttack, onGameComplete]);

  // ゲーム開始
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isActive: true,
      playerHp: stage?.maxHp || 5,
      score: 0,
      correctCount: 0,
      totalCount: 0,
      activeMonsters: [],
      inputBuffer: [],
      lastInputTime: 0,
      currentChordIndex: 0
    }));
    processedChordsRef.current.clear();
  }, [stage]);

  // ゲーム停止
  const stopGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  return {
    gameState,
    handleInput,
    startGame,
    stopGame
  };
};