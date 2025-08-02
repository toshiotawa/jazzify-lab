/**
 * ファンタジーリズムエンジン
 * リズムモード専用のゲームロジックとタイミング判定を担当
 */

import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';

// 判定ウィンドウの長さ (±ms)
// 200ms だとテンポ120では体感的に狭すぎるため 300ms に拡大
const JUDGMENT_WINDOW_MS = 300;

export interface RhythmJudgment {
  targetTime: number;  // 判定タイミング（ms）
  chordId: string;     // 判定対象のコード
  judged: boolean;     // 判定済みフラグ
  result: 'perfect' | 'good' | 'miss' | null;  // 判定結果
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';  // 列位置（最大8体対応）
}

export interface RhythmChordSchedule {
  chordId: string;
  measure: number;
  beat: number;
  targetTime: number;  // 演奏タイミング（ms）
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';  // 列位置（最大8体対応）
}

interface RhythmEngineProps {
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
  onJudgment: (judgment: RhythmJudgment) => void;
  onChordSchedule: (schedule: RhythmChordSchedule[]) => void;
}

export const FantasyRhythmEngine = forwardRef<
  { judge: (chordId: string, inputTime: number) => RhythmJudgment | null },
  RhythmEngineProps
>(({
  isActive,
  bpm,
  timeSignature,
  measureCount,
  countInMeasures,
  chordProgressionData,
  allowedChords,
  simultaneousMonsterCount,
  onJudgment,
  onChordSchedule
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

  // 現在時刻を取得
  const getCurrentGameTime = useCallback(() => {
    if (!startAt) return 0;
    return performance.now() - startAt - readyDuration;
  }, [startAt, readyDuration]);

  // コード進行パターンの場合のスケジュール生成
  const generateProgressionSchedule = useCallback(() => {
    if (!chordProgressionData?.chords || chordProgressionData.chords.length === 0) {
      return [];
    }

    const schedule: RhythmChordSchedule[] = [];
    const chords = chordProgressionData.chords;
    
    // 無限ループのため、先読みで十分な量のスケジュールを生成
    const currentTime = getCurrentGameTime();
    const lookAheadTime = currentTime + 10000; // 10秒先まで生成
    
    let loopCount = 0;
    while (true) {
      for (let i = 0; i < chords.length; i++) {
        const chord = chords[i];
        const actualMeasure = loopCount * measureCount + chord.measure;
        
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
    const lookAheadTime = currentTime + 10000; // 10 秒先まで生成

    // カウントイン後から開始
    const startMeasure = isCountIn ? currentMeasure : Math.max(1, currentMeasure);

    // 各小節内のすべての拍にコードを配置することで問題が「変わらない」状態を改善する
    for (let m = startMeasure; m <= measureCount + 10; m++) {
      const actualMeasure = ((m - 1) % measureCount) + 1;

      for (let b = 1; b <= timeSignature; b++) {
        const measureTime = (m - 1 + countInMeasures) * msPerMeasure;
        const beatTime = (b - 1) * msPerBeat;
        const targetTime = measureTime + beatTime;

        if (targetTime > lookAheadTime) {
          break;
        }

        if (targetTime < currentTime - 1000) {
          continue;
        }

        const chordId = allowedChords[Math.floor(Math.random() * allowedChords.length)];

        schedule.push({
          chordId,
          measure: actualMeasure,
          beat: b,
          targetTime,
          position: 'A' // ランダムパターンでは 1 体のみ
        });
      }
    }

    return schedule;
  }, [getCurrentGameTime, isCountIn, currentMeasure, measureCount, countInMeasures, msPerMeasure, msPerBeat, timeSignature, allowedChords]);

  // スケジュールの更新
  useEffect(() => {
    if (!isActive || !startAt) return;
    
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
  }, [isActive, startAt, currentMeasure, chordProgressionData, generateProgressionSchedule, generateRandomSchedule, onChordSchedule]);

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
            // 新しい判定を作成
            const judgment: RhythmJudgment = {
              targetTime: schedule.targetTime,
              chordId: schedule.chordId,
              judged: false,
              result: null,
              position: schedule.position
            };
            newActiveJudgments.push(judgment);
            onJudgment(judgment);
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
    // inputTimeは既にゲーム時間として渡されている
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
  const { startAt, readyDuration } = useTimeStore();
  
  return useCallback((chordId: string) => {
    if (!rhythmEngine.current) return null;
    const inputTime = performance.now() - (startAt || 0) - readyDuration;
    return rhythmEngine.current.judge(chordId, inputTime);
  }, [rhythmEngine, startAt, readyDuration]);
};