/**
 * ファンタジーリズムエンジン
 * リズムモード専用のゲームロジックとタイミング判定を担当
 */

import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';

// 判定ウィンドウの定数
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

    // いま何小節目か（カウントイン込み）を逆算
    //   例) count-in 1 小節, BPM120(500ms/beat)4/4 → 1小節=2000ms
    const elapsedFromMusicTop = currentTime; // count-in 開始からの経過
    const currentAbsMeasure = Math.floor(elapsedFromMusicTop / msPerMeasure);

    // 先読みは常に「今の小節 + 1」から 10 秒先まで
    const lookAheadStartAbsMeas = currentAbsMeasure + 1;
    const lookAheadEndTime = currentTime + 10000;

    for (let abs = lookAheadStartAbsMeas; ; abs++) {
      const measureTime = abs * msPerMeasure; // count-in も含む絶対時間
      if (measureTime > lookAheadEndTime) break;

      // 曲頭 0ms から数えて何周めか
      const loopedMeasureNo = ((abs - countInMeasures) % measureCount + measureCount) % measureCount;
      const logicalMeasure = loopedMeasureNo + 1; // 1-based

      // ランダムコード選択（連続重複を避ける）
      const lastChordId = schedule[schedule.length - 1]?.chordId;
      let chordId = allowedChords[Math.floor(Math.random() * allowedChords.length)];
      if (allowedChords.length > 1 && chordId === lastChordId) {
        chordId = allowedChords[(allowedChords.indexOf(chordId) + 1) % allowedChords.length];
      }

      schedule.push({
        chordId,
        measure: logicalMeasure,
        beat: 1,
        targetTime: measureTime,
        position: 'A'
      });
    }

    return schedule;
  }, [getCurrentGameTime, msPerMeasure, allowedChords, measureCount, countInMeasures]);

    // スケジュールの更新
  useEffect(() => {
    if (!isActive || !startAt) return;
    
    // 初回スケジュール生成
    const initialSchedule = chordProgressionData 
      ? generateProgressionSchedule()
      : generateRandomSchedule();
    
    setChordSchedule(initialSchedule);
    onChordSchedule(initialSchedule);
    
    // 1フレームごとに全生成し直すのをやめ、
    // 既存 schedule の末尾が lookAhead の手前になったら追加入稿する
    const updateLoop = () => {
      const currentTime = Date.now() - startAt;
      
      setChordSchedule(prev => {
        const tailTime = prev.length ? prev[prev.length - 1].targetTime : 0;
        if (tailTime - currentTime < 8000) {        // 残り 8 秒になったら追加入稿
          const additional = chordProgressionData
            ? generateProgressionSchedule()
            : generateRandomSchedule();
          if (additional.length) {
            const merged = [...prev, ...additional];
            onChordSchedule(merged);
            return merged;
          }
        }
        return prev;
      });
    };

    const id = setInterval(updateLoop, 250); // 4fps で十分
    return () => clearInterval(id);
  }, [isActive, startAt, chordProgressionData, generateProgressionSchedule, generateRandomSchedule, onChordSchedule]);

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