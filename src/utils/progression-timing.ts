/**
 * プログレッションパターンのタイミング管理ユーティリティ
 */

import { useTimeStore } from '@/stores/timeStore';

export interface ChordTiming {
  bar: number;
  beats: number;
  chord: string | null; // nullの場合は無音区間
}

export interface ProgressionTimingState {
  currentChord: string | null;
  isAcceptingInput: boolean;
  nextQuestionTime: number; // 次の問題出現時刻（ビート単位）
  judgmentDeadline: number; // 判定受付終了時刻（ビート単位）
}

/**
 * 現在のビート位置を計算（小数点以下も含む）
 * @param startAt ゲーム開始時刻
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param readyDuration Ready表示時間
 * @param countInMeasures カウントイン小節数
 * @returns 現在のビート位置（1.0から開始）
 */
export function getCurrentBeatPosition(
  startAt: number,
  bpm: number,
  timeSignature: number,
  readyDuration: number,
  countInMeasures: number
): number {
  const now = performance.now();
  const elapsed = now - startAt;
  
  // Ready中は1.0を返す
  if (elapsed < readyDuration) {
    return 1.0;
  }
  
  const msPerBeat = 60000 / bpm;
  const beatsFromStart = (elapsed - readyDuration) / msPerBeat;
  
  // カウントイン小節を考慮
  const totalCountInBeats = countInMeasures * timeSignature;
  const actualBeats = Math.max(0, beatsFromStart - totalCountInBeats);
  
  // 1から始まるビート位置（小数点含む）
  return (actualBeats % timeSignature) + 1;
}

/**
 * 絶対ビート位置を計算（ループを考慮しない）
 */
export function getAbsoluteBeatPosition(
  startAt: number,
  bpm: number,
  readyDuration: number,
  countInMeasures: number,
  timeSignature: number
): number {
  const now = performance.now();
  const elapsed = now - startAt;
  
  if (elapsed < readyDuration) {
    return 0;
  }
  
  const msPerBeat = 60000 / bpm;
  const beatsFromStart = (elapsed - readyDuration) / msPerBeat;
  
  // カウントイン小節を考慮
  const totalCountInBeats = countInMeasures * timeSignature;
  return Math.max(0, beatsFromStart - totalCountInBeats);
}

/**
 * デフォルトのプログレッションタイミングを計算
 * 4拍子の場合: 4.5拍目から出題、4.49拍目まで判定受付
 */
export function getDefaultProgressionTiming(
  currentBeat: number,
  timeSignature: number
): ProgressionTimingState {
  // 出題タイミング: 最終拍の裏拍（0.5）
  const questionBeat = timeSignature + 0.5;
  
  // 判定受付終了: 次の小節の最終拍の裏拍の直前（-0.01）
  const judgmentDeadlineBeat = timeSignature + 0.49;
  
  // 現在のビート位置が出題タイミングを過ぎているか
  const isAfterQuestionTime = currentBeat >= questionBeat || currentBeat < 1.5;
  
  // 判定受付中かどうか
  const isAcceptingInput = currentBeat < judgmentDeadlineBeat;
  
  return {
    currentChord: isAfterQuestionTime ? null : null, // この関数では実際のコードは返さない
    isAcceptingInput,
    nextQuestionTime: questionBeat,
    judgmentDeadline: judgmentDeadlineBeat
  };
}

/**
 * chord_progression_dataからタイミング情報を解析
 * @param progressionData JSONデータ
 * @param currentMeasure 現在の小節
 * @param currentBeat 現在のビート
 * @returns 現在のコードと判定状態
 */
export function parseProgressionData(
  progressionData: ChordTiming[],
  currentMeasure: number,
  currentBeat: number,
  timeSignature: number
): { currentChord: string | null; isAcceptingInput: boolean } {
  // 現在の位置を絶対ビートで計算
  const currentAbsoluteBeat = (currentMeasure - 1) * timeSignature + currentBeat;
  
  let currentChord: string | null = null;
  let isAcceptingInput = false;
  
  // progressionDataを時系列順にソート
  const sortedData = [...progressionData].sort((a, b) => {
    const aBeats = (a.bar - 1) * timeSignature + a.beats;
    const bBeats = (b.bar - 1) * timeSignature + b.beats;
    return aBeats - bBeats;
  });
  
  // 現在有効なコードを探す
  for (let i = 0; i < sortedData.length; i++) {
    const timing = sortedData[i];
    const timingAbsoluteBeat = (timing.bar - 1) * timeSignature + timing.beats;
    const nextTiming = sortedData[i + 1];
    const nextTimingBeat = nextTiming 
      ? (nextTiming.bar - 1) * timeSignature + nextTiming.beats 
      : Infinity;
    
    // 現在のビートがこのタイミングの範囲内
    if (currentAbsoluteBeat >= timingAbsoluteBeat && currentAbsoluteBeat < nextTimingBeat) {
      currentChord = timing.chord;
      
      // 判定受付は次のタイミングの0.5拍前まで
      const judgmentDeadline = nextTimingBeat - 0.5;
      isAcceptingInput = currentAbsoluteBeat < judgmentDeadline;
      break;
    }
  }
  
  return { currentChord, isAcceptingInput };
}

/**
 * テキスト形式のコード進行データをパース
 * 例: "bar 1 beats 3 chord C\nbar 2 beats 1 chord F"
 */
export function parseProgressionText(text: string): ChordTiming[] {
  const lines = text.trim().split('\n');
  const timings: ChordTiming[] = [];
  
  for (const line of lines) {
    const match = line.match(/bar\s+(\d+)\s+beats\s+([\d.]+)\s+chord\s+(\S+)/);
    if (match) {
      timings.push({
        bar: parseInt(match[1]),
        beats: parseFloat(match[2]),
        chord: match[3] === 'NULL' ? null : match[3]
      });
    }
  }
  
  return timings;
}

/**
 * 次の問題出現タイミングを計算
 */
export function getNextQuestionTiming(
  currentAbsoluteBeat: number,
  progressionData: ChordTiming[],
  timeSignature: number
): number | null {
  const sortedData = [...progressionData].sort((a, b) => {
    const aBeats = (a.bar - 1) * timeSignature + a.beats;
    const bBeats = (b.bar - 1) * timeSignature + b.beats;
    return aBeats - bBeats;
  });
  
  for (const timing of sortedData) {
    const timingBeat = (timing.bar - 1) * timeSignature + timing.beats;
    if (timingBeat > currentAbsoluteBeat && timing.chord !== null) {
      return timingBeat;
    }
  }
  
  return null;
}