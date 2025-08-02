/**
 * ファンタジーリズムゲームエンジン
 * リズムモード専用のゲームロジックとステート管理
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { type DisplayOpts } from '@/utils/display-note';
import { useTimeStore } from '@/stores/timeStore';
import { note as parseNote } from 'tonal';

// ===== 型定義 =====

export interface RhythmChordTarget {
  chord: string;
  measure: number;
  beat: number;
  judgeTime: number; // 判定タイミング（ms）
}

export interface RhythmJudgeWindow {
  startTime: number;
  endTime: number;
  chordTarget: RhythmChordTarget;
  isHit: boolean;
}

export interface RhythmLaneNote {
  id: string;
  chord: string;
  targetTime: number; // ノーツが判定ラインに到達する時刻
  position: number; // 現在のX座標（0-1の範囲）
  isHit: boolean;
  isMissed: boolean;
}

interface RhythmGameState {
  laneNotes: RhythmLaneNote[];
  currentJudgeWindows: RhythmJudgeWindow[];
  nextChordIndex: number;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
}

interface FantasyRhythmGameEngineProps {
  stage: {
    bpm: number;
    timeSignature: number;
    measureCount: number;
    countInMeasures: number;
    allowedChords: string[];
    chordProgressionData?: {
      chords: Array<{
        chord: string;
        measure: number;
        beat: number;
      }>;
    } | null;
  };
  onNoteHit: (chord: string, timing: 'perfect' | 'good') => void;
  onNoteMiss: (chord: string) => void;
  displayOpts?: DisplayOpts;
}

// ===== 定数 =====

const JUDGE_WINDOW_MS = 200; // 前後200ms
const PERFECT_WINDOW_MS = 50; // 前後50msでPERFECT判定
const NOTE_SPEED = 2000; // ノーツが画面を横切る時間（ms）
const SPAWN_AHEAD_TIME = NOTE_SPEED; // ノーツを生成する先読み時間

// ===== ヘルパー関数 =====

/**
 * 拍をミリ秒に変換
 */
const beatToMs = (beat: number, bpm: number): number => {
  const beatDuration = 60000 / bpm;
  return beat * beatDuration;
};

/**
 * 小節と拍から絶対時間を計算
 */
const getMeasureBeatTime = (
  measure: number,
  beat: number,
  bpm: number,
  timeSignature: number,
  countInMeasures: number,
  startAt: number,
  readyDuration: number
): number => {
  // カウントイン後の小節番号に変換
  const totalMeasure = countInMeasures + measure - 1;
  const totalBeats = totalMeasure * timeSignature + (beat - 1);
  const msFromStart = beatToMs(totalBeats, bpm);
  return startAt + readyDuration + msFromStart;
};

/**
 * ランダムにコードを選択
 */
const selectRandomChord = (allowedChords: string[], previousChord?: string): string => {
  const availableChords = allowedChords.filter(c => c !== previousChord);
  const chords = availableChords.length > 0 ? availableChords : allowedChords;
  return chords[Math.floor(Math.random() * chords.length)];
};

// ===== コンポーネント =====

export const useFantasyRhythmGameEngine = ({
  stage,
  onNoteHit,
  onNoteMiss,
  displayOpts
}: FantasyRhythmGameEngineProps) => {
  const { startAt, readyDuration, currentMeasure, currentBeat, isCountIn } = useTimeStore();
  
  const [gameState, setGameState] = useState<RhythmGameState>({
    laneNotes: [],
    currentJudgeWindows: [],
    nextChordIndex: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0
  });
  
  const lastSpawnedMeasure = useRef<number>(0);
  const processedNoteIds = useRef<Set<string>>(new Set());
  
  // 現在時刻を取得
  const getCurrentTime = useCallback(() => {
    if (!startAt) return 0;
    return performance.now();
  }, [startAt]);
  
  // ノーツの生成
  const spawnNotes = useCallback(() => {
    if (!startAt || isCountIn) return;
    
    const currentTime = getCurrentTime();
    const { bpm, timeSignature, countInMeasures, allowedChords, chordProgressionData } = stage;
    
    // プログレッションモードかランダムモードか判定
    const isProgressionMode = chordProgressionData && chordProgressionData.chords.length > 0;
    
    if (isProgressionMode) {
      // プログレッションモード：定義されたコード進行を使用
      const progression = chordProgressionData.chords;
      
      setGameState(prevState => {
        const newNotes: RhythmLaneNote[] = [];
        
        // 次に生成すべきコードを探す
        for (let i = prevState.nextChordIndex; i < progression.length; i++) {
          const chordData = progression[i];
          const noteTime = getMeasureBeatTime(
            chordData.measure,
            chordData.beat,
            bpm,
            timeSignature,
            countInMeasures,
            startAt,
            readyDuration
          );
          
          // 先読み時間内のノーツのみ生成
          if (noteTime - currentTime > SPAWN_AHEAD_TIME) break;
          
          const noteId = `${chordData.chord}_${chordData.measure}_${chordData.beat}`;
          if (!processedNoteIds.current.has(noteId)) {
            processedNoteIds.current.add(noteId);
            
            newNotes.push({
              id: noteId,
              chord: chordData.chord,
              targetTime: noteTime,
              position: 1, // 画面右端から開始
              isHit: false,
              isMissed: false
            });
          }
        }
        
        // 無限ループ：最後まで行ったら最初に戻る
        if (prevState.nextChordIndex >= progression.length - 1) {
          return {
            ...prevState,
            laneNotes: [...prevState.laneNotes, ...newNotes],
            nextChordIndex: 0
          };
        }
        
        return {
          ...prevState,
          laneNotes: [...prevState.laneNotes, ...newNotes],
          nextChordIndex: prevState.nextChordIndex + newNotes.length
        };
      });
    } else {
      // ランダムモード：1小節に1回ランダムなコードを生成
      const currentMeasureAbs = currentMeasure + (isCountIn ? 0 : countInMeasures);
      
      if (currentMeasureAbs > lastSpawnedMeasure.current) {
        const targetMeasure = currentMeasureAbs + 2; // 2小節先を生成
        
        for (let m = lastSpawnedMeasure.current + 1; m <= targetMeasure; m++) {
          const noteTime = getMeasureBeatTime(
            m - countInMeasures,
            1, // 各小節の1拍目
            bpm,
            timeSignature,
            countInMeasures,
            startAt,
            readyDuration
          );
          
          if (noteTime - currentTime <= SPAWN_AHEAD_TIME) {
            const previousChord = gameState.laneNotes[gameState.laneNotes.length - 1]?.chord;
            const chord = selectRandomChord(allowedChords, previousChord);
            const noteId = `${chord}_${m}_1`;
            
            if (!processedNoteIds.current.has(noteId)) {
              processedNoteIds.current.add(noteId);
              
              setGameState(prevState => ({
                ...prevState,
                laneNotes: [...prevState.laneNotes, {
                  id: noteId,
                  chord,
                  targetTime: noteTime,
                  position: 1,
                  isHit: false,
                  isMissed: false
                }]
              }));
            }
          }
        }
        
        lastSpawnedMeasure.current = targetMeasure;
      }
    }
  }, [getCurrentTime, stage, startAt, readyDuration, currentMeasure, isCountIn, gameState.laneNotes]);
  
  // ノーツの位置更新と判定ウィンドウの管理
  const updateNotes = useCallback(() => {
    const currentTime = getCurrentTime();
    
    setGameState(prevState => {
      const updatedNotes = prevState.laneNotes.map(note => {
        if (note.isHit || note.isMissed) return note;
        
        // ノーツの位置を計算（1から0へ移動）
        const timeUntilTarget = note.targetTime - currentTime;
        const position = Math.max(0, Math.min(1, timeUntilTarget / NOTE_SPEED));
        
        // ミス判定
        if (currentTime > note.targetTime + JUDGE_WINDOW_MS) {
          if (!note.isMissed) {
            onNoteMiss(note.chord);
            return { ...note, position, isMissed: true };
          }
        }
        
        return { ...note, position };
      });
      
      // 判定ウィンドウの更新
      const currentWindows = updatedNotes
        .filter(note => !note.isHit && !note.isMissed)
        .filter(note => {
          const timeDiff = Math.abs(currentTime - note.targetTime);
          return timeDiff <= JUDGE_WINDOW_MS;
        })
        .map(note => ({
          startTime: note.targetTime - JUDGE_WINDOW_MS,
          endTime: note.targetTime + JUDGE_WINDOW_MS,
          chordTarget: {
            chord: note.chord,
            measure: 0, // 後で実装
            beat: 0, // 後で実装
            judgeTime: note.targetTime
          },
          isHit: false
        }));
      
      // 画面外に出たノーツを削除
      const activeNotes = updatedNotes.filter(note => 
        note.position > -0.1 || (!note.isHit && !note.isMissed)
      );
      
      // ミスカウントの更新
      const newMissCount = updatedNotes.filter(n => n.isMissed).length;
      if (newMissCount > prevState.missCount) {
        // コンボリセット
        return {
          ...prevState,
          laneNotes: activeNotes,
          currentJudgeWindows: currentWindows,
          missCount: newMissCount,
          combo: 0
        };
      }
      
      return {
        ...prevState,
        laneNotes: activeNotes,
        currentJudgeWindows: currentWindows
      };
    });
  }, [getCurrentTime, onNoteMiss]);
  
  // 入力判定
  const judgeInput = useCallback((inputChord: string) => {
    const currentTime = getCurrentTime();
    
    setGameState(prevState => {
      // 判定可能なノーツを探す
      const hitNote = prevState.laneNotes.find(note => {
        if (note.isHit || note.isMissed) return false;
        if (note.chord !== inputChord) return false;
        
        const timeDiff = Math.abs(currentTime - note.targetTime);
        return timeDiff <= JUDGE_WINDOW_MS;
      });
      
      if (!hitNote) return prevState;
      
      // タイミング判定
      const timeDiff = Math.abs(currentTime - hitNote.targetTime);
      const timing = timeDiff <= PERFECT_WINDOW_MS ? 'perfect' : 'good';
      
      // ヒット処理
      onNoteHit(hitNote.chord, timing);
      
      const updatedNotes = prevState.laneNotes.map(note =>
        note.id === hitNote.id ? { ...note, isHit: true } : note
      );
      
      const newCombo = prevState.combo + 1;
      const newMaxCombo = Math.max(newCombo, prevState.maxCombo);
      
      return {
        ...prevState,
        laneNotes: updatedNotes,
        combo: newCombo,
        maxCombo: newMaxCombo,
        perfectCount: prevState.perfectCount + (timing === 'perfect' ? 1 : 0),
        goodCount: prevState.goodCount + (timing === 'good' ? 1 : 0),
        score: prevState.score + (timing === 'perfect' ? 100 : 50) * Math.max(1, Math.floor(newCombo / 10))
      };
    });
  }, [getCurrentTime, onNoteHit]);
  
  // ゲームループ
  useEffect(() => {
    if (!startAt) return;
    
    const interval = setInterval(() => {
      spawnNotes();
      updateNotes();
    }, 16); // 約60fps
    
    return () => clearInterval(interval);
  }, [startAt, spawnNotes, updateNotes]);
  
  // ループ時のリセット処理
  useEffect(() => {
    if (!isCountIn && currentMeasure === 1 && currentBeat === 1) {
      // ループ開始時の処理（ただし状態はリセットしない）
      devLog.debug('リズムモード: ループ開始');
    }
  }, [currentMeasure, currentBeat, isCountIn]);
  
  return {
    gameState,
    judgeInput,
    getCurrentJudgeWindow: () => gameState.currentJudgeWindows[0] || null
  };
};