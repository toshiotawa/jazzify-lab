/**
 * ファンタジーリズムエンジン (修正版)
 * リズムモード専用のゲームロジックとタイミング判定を担当
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { useTimeStore } from '@/stores/timeStore';

// 判定ウィンドウ：ターゲットタイムの前後200ms
const JUDGMENT_WINDOW_MS = 200; // 前後200ms

export interface RhythmJudgment {
  targetTime: number;  // 判定タイミング（ms）
  chordId: string;     // 判定対象のコード
  judged: boolean;     // 判定済みフラグ 
  result: 'perfect' | 'good' | 'miss' | null;  // 判定結果
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';  // 列位置（最大8体対応）
}

export interface RhythmChordSchedule {
  chordId: string;
  measure: number;  // 実際の小節番号（ループを考慮）
  beat: number;     // 拍（1から）
  targetTime: number;  // 判定タイミング（ms）
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';  // 列位置
}

interface FantasyRhythmEngineProps {
  isActive: boolean;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countInMeasures: number;
  chordProgressionData?: {
    chords: Array<{
      measure: number;
      beat: number;
      chord: string;
    }>;
  } | null;
  allowedChords: string[];
  simultaneousMonsterCount: number;
  onChordSchedule: (schedule: RhythmChordSchedule[]) => void;
  onJudgment: (judgment: RhythmJudgment) => void;
}

export const FantasyRhythmEngine = forwardRef<
  { judge: (chordId: string, inputTime: number) => RhythmJudgment | null },
  FantasyRhythmEngineProps
>(({
  isActive,
  bpm,
  timeSignature,
  measureCount,
  countInMeasures,
  chordProgressionData,
  allowedChords,
  simultaneousMonsterCount,
  onChordSchedule,
  onJudgment
}, ref) => {
  const { currentMeasure, currentBeat, isCountIn, startAt, readyDuration } = useTimeStore();
  const [activeJudgments, setActiveJudgments] = useState<RhythmJudgment[]>([]);
  const [chordSchedule, setChordSchedule] = useState<RhythmChordSchedule[]>([]);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  // 拍子に基づいて使用する列位置を決定 
  const positions = useMemo(() => {
    const allPositions: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    // 拍子数か同時出現数の小さい方を使用（最大8）
    const columnCount = Math.min(timeSignature, simultaneousMonsterCount, 8);
    return allPositions.slice(0, columnCount);
  }, [timeSignature, simultaneousMonsterCount]);

  // BPMから各種時間を計算 
  const msPerBeat = useMemo(() => 60000 / bpm, [bpm]);
  const msPerMeasure = useMemo(() => msPerBeat * timeSignature, [msPerBeat, timeSignature]);

  // 現在のゲーム内時間を取得
  const getCurrentGameTime = useCallback(() => {
    if (!startAt) return 0;
    return performance.now() - startAt - readyDuration;
  }, [startAt, readyDuration]); 

  // コード進行パターンの場合のスケジュール生成
  const generateProgressionSchedule = useCallback(() => {
    if (!chordProgressionData || chordProgressionData.chords.length === 0) return [];
    
    const schedule: RhythmChordSchedule[] = [];
    const chords = chordProgressionData.chords;
    
    devLog.debug('🎵 Generating progression schedule', { chords, measureCount, countInMeasures });
    
    const currentTime = getCurrentGameTime();
    const lookAheadTime = currentTime + 10000; // 10秒先まで生成

    let loopCount = 0;
    while (true) {
      for (let i = 0; i < chords.length; i++) {
        const chord = chords[i];
        // ループを考慮した実際の小節番号を計算
        const actualMeasure = loopCount * chords.length + chord.measure;
        
        // カウントイン後の時間を計算
        const measureTime = (actualMeasure - 1 + countInMeasures) * msPerMeasure;
        const beatTime = (chord.beat - 1) * msPerBeat;
        const targetTime = measureTime + beatTime;
        
        if (targetTime > lookAheadTime) { 
          return schedule;
        }
        
        // 既に過ぎた時間はスキップ
        if (targetTime < currentTime - 1000) {
          continue;
        }
        
        schedule.push({
          chordId: chord.chord,
          measure: actualMeasure,
          beat: chord.beat,
          targetTime,
          position: positions[i % positions.length]
        });
      }
      loopCount++;
    }
  }, [chordProgressionData, getCurrentGameTime, measureCount, countInMeasures, msPerMeasure, msPerBeat, positions]); 

  // ランダムパターンの場合のスケジュール生成
  const generateRandomSchedule = useCallback(() => {
    const schedule: RhythmChordSchedule[] = [];
    const currentTime = getCurrentGameTime();
    const lookAheadTime = currentTime + 10000; // 10秒先まで生成
    
    // カウントイン後から開始 
    const startMeasure = isCountIn ? currentMeasure : Math.max(1, currentMeasure);
    
    // 無限ループ対応：現在時刻から10秒先までの小節を生成
    let m = startMeasure;
    let loopCount = 0;
    
    while (true) {
      // ループを考慮した実際の小節番号
      const actualMeasure = m;
      const measureTime = (actualMeasure - 1 + countInMeasures) * msPerMeasure;
      
      if (measureTime > lookAheadTime) { 
        break;
      }
      
      if (measureTime < currentTime - 1000) {
        m++;
        if (m > measureCount) {
          m = 1;
          loopCount++;
        }
        continue;
      }
      
      // ランダムにコードを選択
      const chordId = allowedChords[Math.floor(Math.random() * allowedChords.length)];
      
      schedule.push({
        chordId,
        measure: actualMeasure,
        beat: 1,
        targetTime: measureTime,
        position: 'A' // ランダムパターンでは1体のみなので常にA列
      });
      
      m++;
      if (m > measureCount) {
        m = 1;
        loopCount++;
      }
    }

    return schedule;
  }, [getCurrentGameTime, isCountIn, currentMeasure, measureCount, countInMeasures, msPerMeasure, allowedChords]);

  // スケジュールの更新
  useEffect(() => {
    if (!isActive || !startAt) return;
    
    const updateSchedule = () => {
      const newSchedule = chordProgressionData 
        ? generateProgressionSchedule()
        : generateRandomSchedule();
      
      devLog.debug('🎵 Rhythm schedule generated:', {
        scheduleLength: newSchedule.length,
        isProgression: !!chordProgressionData,
        firstItems: newSchedule.slice(0, 3),
        currentTime: getCurrentGameTime()
      });
      
      setChordSchedule(newSchedule);
      onChordSchedule(newSchedule);
    };

    // 初回実行
    updateSchedule();

    // 定期的に更新（新しいスケジュールを生成）
    const interval = setInterval(updateSchedule, 1000); // 1秒ごとに更新

    return () => clearInterval(interval);
  }, [isActive, startAt, chordProgressionData, generateProgressionSchedule, generateRandomSchedule, onChordSchedule, getCurrentGameTime]);

  // 判定ウィンドウのチェック
  useEffect(() => {
    if (!isActive || !startAt) return;

    const checkJudgmentWindow = () => {
      const currentTime = getCurrentGameTime();
      
      // アクティブな判定を更新
      const newActiveJudgments: RhythmJudgment[] = [];
      
      chordSchedule.forEach(schedule => {
        const timeDiff = Math.abs(currentTime - schedule.targetTime);
        
        // 判定ウィンドウ内かチェック
        if (timeDiff <= JUDGMENT_WINDOW_MS) {
          // 既存の判定を探す
          const existingJudgment = activeJudgments.find( 
            j => j.chordId === schedule.chordId && j.targetTime === schedule.targetTime
          );
          
          if (!existingJudgment) {
            // 新しい判定を追加
            const newJudgment: RhythmJudgment = {
              targetTime: schedule.targetTime,
              chordId: schedule.chordId,
              judged: false,
              result: null,
              position: schedule.position
            };
            newActiveJudgments.push(newJudgment);
          } else {
            newActiveJudgments.push(existingJudgment);
          }
        }
        
        // 判定ウィンドウを過ぎた未判定のものはミス判定
        if (currentTime > schedule.targetTime + JUDGMENT_WINDOW_MS) {
          const existingJudgment = activeJudgments.find(
            j => j.chordId === schedule.chordId && j.targetTime === schedule.targetTime && !j.judged 
          );
          
          if (existingJudgment) {
            existingJudgment.judged = true;
            existingJudgment.result = 'miss';
            devLog.debug('🎵 Auto miss judgment:', { 
              chordId: existingJudgment.chordId, 
              targetTime: existingJudgment.targetTime,
              currentTime  
            });
            onJudgment(existingJudgment);
          }
        }
      });
      
      setActiveJudgments(newActiveJudgments);
    };
    
    const interval = setInterval(checkJudgmentWindow, 16); // 60FPS
    
    return () => clearInterval(interval); 
  }, [isActive, startAt, chordSchedule, activeJudgments, getCurrentGameTime, onJudgment]);

  // 判定処理（外部から呼び出される）
  const judge = useCallback((chordId: string, inputTime: number) => {
    devLog.debug('🎵 Judge called:', {
      chordId,
      inputTime,
      activeJudgments: activeJudgments.length,
      judgmentDetails: activeJudgments.map(j => ({
        chordId: j.chordId,
        targetTime: j.targetTime,
        judged: j.judged
      }))
    });
    
    const judgment = activeJudgments.find(j => j.chordId === chordId && !j.judged);
    
    if (!judgment) {
      devLog.debug('No active judgment found for chord:', chordId);
      return null; 
    }
    
    const timeDiff = Math.abs(inputTime - judgment.targetTime);
    
    if (timeDiff <= JUDGMENT_WINDOW_MS) {
      judgment.judged = true;
      judgment.result = timeDiff <= 50 ? 'perfect' : 'good';
      devLog.debug('🎵 Judgment success:', { chordId, timeDiff, result: judgment.result });
      onJudgment(judgment); 
      return judgment;
    }
    
    devLog.debug('🎵 Judgment failed - outside window:', { chordId, timeDiff, window: JUDGMENT_WINDOW_MS });
    return null;
  }, [activeJudgments, onJudgment]);

  // refを通じてjudgeメソッドを公開
  useImperativeHandle(ref, () => ({
    judge
  }), [judge]);

  // デバッグ情報
  useEffect(() => {
    if (!isActive) return;
    
    const debugInterval = setInterval(() => {
      devLog.debug('Rhythm Engine State:', {
        currentMeasure,
        currentBeat,
        isCountIn,
        activeJudgments: activeJudgments.length,
        upcomingChords: chordSchedule.filter(s => s.targetTime > getCurrentGameTime()).length
      });
    }, 1000);
    
    return () => clearInterval(debugInterval);
  }, [isActive, currentMeasure, currentBeat, isCountIn, activeJudgments, chordSchedule, getCurrentGameTime]);

  return null;
});

// コンポーネントに表示名を設定 
FantasyRhythmEngine.displayName = 'FantasyRhythmEngine';

// 判定関数をエクスポート
export const useRhythmJudge = (rhythmEngine: React.RefObject<{ judge: (chordId: string, inputTime: number) => RhythmJudgment | null }>) => {
  return useCallback((chordId: string) => {
    if (!rhythmEngine.current) return null;
    const inputTime = performance.now();
    return rhythmEngine.current.judge(chordId, inputTime);
  }, [rhythmEngine]); 
};