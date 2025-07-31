/**
 * RhythmEngine - リズムゲームのコア制御エンジン
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import type { RhythmData, RhythmJudgment, RhythmPattern } from '@/types';

interface RhythmEngineProps {
  bpm: number;
  timeSignature: number;
  currentTime: number;
  isPlaying: boolean;
  rhythmPattern: RhythmPattern;
  progressionData: RhythmData[];
  allowedChords: string[];
  onBeatTick: (measure: number, beat: number) => void;
  onJudgmentStart: (expectedChord: string, judgmentTime: number) => void;
  onJudgmentEnd: (judgment: RhythmJudgment) => void;
}

export const RhythmEngine: React.FC<RhythmEngineProps> = ({
  bpm,
  timeSignature,
  currentTime,
  isPlaying,
  rhythmPattern,
  progressionData,
  allowedChords,
  onBeatTick,
  onJudgmentStart,
  onJudgmentEnd,
}) => {
  const lastBeatRef = useRef<number>(-1);
  const lastMeasureRef = useRef<number>(-1);
  const currentJudgmentRef = useRef<{
    expectedChord: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const progressionIndexRef = useRef<number>(0);
  const lastQuestionTimeRef = useRef<number>(0);

  // リズム計算のユーティリティ
  const rhythmCalculations = useMemo(() => {
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = secondsPerBeat * timeSignature;
    
    const getCurrentMeasure = (time: number): number => {
      return Math.floor(time / secondsPerMeasure);
    };
    
    const getCurrentBeat = (time: number): number => {
      const measureTime = time % secondsPerMeasure;
      return measureTime / secondsPerBeat;
    };
    
    const getTimeAtBeat = (measure: number, beat: number): number => {
      return measure * secondsPerMeasure + beat * secondsPerBeat;
    };
    
    return {
      secondsPerBeat,
      secondsPerMeasure,
      getCurrentMeasure,
      getCurrentBeat,
      getTimeAtBeat,
    };
  }, [bpm, timeSignature]);

  // ランダムコード選択
  const selectRandomChord = useCallback((): string => {
    if (allowedChords.length === 0) return 'C';
    const randomIndex = Math.floor(Math.random() * allowedChords.length);
    return allowedChords[randomIndex];
  }, [allowedChords]);

  // プログレッション用コード取得
  const getProgressionChord = useCallback((time: number): string | null => {
    if (progressionData.length === 0) return null;
    
    // 現在時刻に一致するリズムデータを検索
    for (const data of progressionData) {
      const targetTime = rhythmCalculations.getTimeAtBeat(data.measure, data.beat);
      const timeDiff = Math.abs(time - targetTime);
      
      // 50ms以内の誤差を許容
      if (timeDiff <= 0.05) {
        return data.chord;
      }
    }
    
    return null;
  }, [progressionData, rhythmCalculations]);

  // 拍とメジャーの更新処理
  useEffect(() => {
    if (!isPlaying) return;

    const currentMeasure = rhythmCalculations.getCurrentMeasure(currentTime);
    const currentBeat = Math.floor(rhythmCalculations.getCurrentBeat(currentTime));
    
    // 新しい拍になった時の処理
    if (currentBeat !== lastBeatRef.current || currentMeasure !== lastMeasureRef.current) {
      lastBeatRef.current = currentBeat;
      lastMeasureRef.current = currentMeasure;
      onBeatTick(currentMeasure, currentBeat);
    }
  }, [currentTime, isPlaying, rhythmCalculations, onBeatTick]);

  // 判定タイミングの管理
  useEffect(() => {
    if (!isPlaying) return;

    const currentMeasure = rhythmCalculations.getCurrentMeasure(currentTime);
    const currentBeat = rhythmCalculations.getCurrentBeat(currentTime);

    // ランダムパターンの場合：1小節に1回、1拍目で出題
    if (rhythmPattern === 'random') {
      const beatThreshold = 0.1; // 拍の始まりから100ms以内
      
      if (Math.abs(currentBeat) < beatThreshold && currentTime - lastQuestionTimeRef.current > 1.0) {
        const expectedChord = selectRandomChord();
        const judgmentTime = rhythmCalculations.getTimeAtBeat(currentMeasure, 0) + rhythmCalculations.secondsPerBeat * 0.8;
        
        lastQuestionTimeRef.current = currentTime;
        onJudgmentStart(expectedChord, judgmentTime);
        
        currentJudgmentRef.current = {
          expectedChord,
          startTime: judgmentTime - 0.2, // 200ms前から
          endTime: judgmentTime + 0.2,   // 200ms後まで
        };
      }
    }
    
    // プログレッションパターンの場合：JSONで指定されたタイミング
    else if (rhythmPattern === 'progression') {
      const expectedChord = getProgressionChord(currentTime);
      
      if (expectedChord && !currentJudgmentRef.current) {
        const judgmentTime = currentTime + 0.5; // 500ms後に判定
        
        onJudgmentStart(expectedChord, judgmentTime);
        
        currentJudgmentRef.current = {
          expectedChord,
          startTime: judgmentTime - 0.2,
          endTime: judgmentTime + 0.2,
        };
      }
    }

    // 判定ウィンドウの終了チェック
    if (currentJudgmentRef.current && currentTime > currentJudgmentRef.current.endTime) {
      // 時間切れによる失敗判定
      onJudgmentEnd({
        success: false,
        timingError: currentTime - currentJudgmentRef.current.endTime,
        expectedTime: (currentJudgmentRef.current.startTime + currentJudgmentRef.current.endTime) / 2,
        actualTime: currentTime,
        chord: currentJudgmentRef.current.expectedChord,
      });
      
      currentJudgmentRef.current = null;
    }
    
  }, [
    currentTime, 
    isPlaying, 
    rhythmPattern, 
    rhythmCalculations, 
    selectRandomChord, 
    getProgressionChord, 
    onJudgmentStart, 
    onJudgmentEnd
  ]);

  // 外部からの判定トリガー（現在は未使用だが将来の拡張用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _triggerJudgment = useCallback((inputChord: string, inputTime: number) => {
    if (!currentJudgmentRef.current) {
      return false; // 判定ウィンドウ外
    }

    const judgment = currentJudgmentRef.current;
    const expectedTime = (judgment.startTime + judgment.endTime) / 2;
    const timingError = inputTime - expectedTime;
    const isSuccess = inputChord === judgment.expectedChord && 
                     inputTime >= judgment.startTime && 
                     inputTime <= judgment.endTime;

    onJudgmentEnd({
      success: isSuccess,
      timingError,
      expectedTime,
      actualTime: inputTime,
      chord: inputChord,
    });

    currentJudgmentRef.current = null;
    return isSuccess;
  }, [onJudgmentEnd]);

  // 判定状態のリセット
  const resetJudgment = useCallback(() => {
    currentJudgmentRef.current = null;
    progressionIndexRef.current = 0;
    lastQuestionTimeRef.current = 0;
  }, []);

  // 停止時のリセット
  useEffect(() => {
    if (!isPlaying) {
      resetJudgment();
    }
  }, [isPlaying, resetJudgment]);

  return null; // このコンポーネントは描画しない
};

export default RhythmEngine;