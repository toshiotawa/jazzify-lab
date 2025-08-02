import { ChordProgressionData, ChordProgressionItem } from '@/types';

/**
 * リズムモードのタイミング関連ユーティリティ
 */

export interface JudgmentWindow {
  targetMeasure: number;
  targetBeat: number;
  windowStartMs: number;
  windowEndMs: number;
  chord: string;
}

export interface RhythmQuestion {
  chord: string;
  judgmentMeasure: number;
  judgmentBeat: number;
  displayMeasure: number;
  displayBeat: number;
  monsterId: string;
}

/**
 * 判定ウィンドウの時間を計算
 * @param targetMeasure 判定対象の小節番号
 * @param targetBeat 判定対象の拍番号
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param countInMeasures カウントイン小節数
 * @param windowMs 判定ウィンドウの幅（片側、デフォルト200ms）
 * @returns 判定ウィンドウの開始・終了時刻（ゲーム開始からのms）
 */
export function calculateJudgmentWindow(
  targetMeasure: number,
  targetBeat: number,
  bpm: number,
  timeSignature: number,
  countInMeasures: number,
  windowMs: number = 200
): { windowStartMs: number; windowEndMs: number } {
  const msPerBeat = 60000 / bpm;
  
  // カウントイン後の小節として計算
  const totalBeats = (targetMeasure - 1 + countInMeasures) * timeSignature + (targetBeat - 1);
  const targetTimeMs = totalBeats * msPerBeat;
  
  return {
    windowStartMs: targetTimeMs - windowMs,
    windowEndMs: targetTimeMs + windowMs
  };
}

/**
 * 出題タイミングを計算（判定タイミングの3拍前）
 * @param judgmentMeasure 判定小節
 * @param judgmentBeat 判定拍
 * @param timeSignature 拍子
 * @returns 出題タイミングの小節と拍
 */
export function calculateDisplayTiming(
  judgmentMeasure: number,
  judgmentBeat: number,
  timeSignature: number
): { displayMeasure: number; displayBeat: number } {
  // 3拍前を計算
  let displayBeat = judgmentBeat - 3;
  let displayMeasure = judgmentMeasure;
  
  // 前の小節にまたがる場合
  while (displayBeat <= 0) {
    displayBeat += timeSignature;
    displayMeasure -= 1;
  }
  
  return { displayMeasure, displayBeat };
}

/**
 * ランダムモード用：次の問題を生成
 * @param allowedChords 許可されたコード配列
 * @param currentMeasure 現在の小節
 * @param timeSignature 拍子
 * @returns 次の問題
 */
export function generateRandomQuestion(
  allowedChords: string[],
  currentMeasure: number,
  timeSignature: number
): RhythmQuestion {
  const chord = allowedChords[Math.floor(Math.random() * allowedChords.length)];
  const judgmentMeasure = currentMeasure;
  const judgmentBeat = 1; // ランダムモードは1拍目固定
  
  const { displayMeasure, displayBeat } = calculateDisplayTiming(
    judgmentMeasure,
    judgmentBeat,
    timeSignature
  );
  
  return {
    chord,
    judgmentMeasure,
    judgmentBeat,
    displayMeasure,
    displayBeat,
    monsterId: '' // 後で設定
  };
}

/**
 * プログレッションモード用：指定された小節・拍の問題を取得
 * @param progressionData コード進行データ
 * @param targetMeasure 対象小節
 * @param targetBeat 対象拍
 * @param timeSignature 拍子
 * @returns 該当する問題配列
 */
export function getProgressionQuestions(
  progressionData: ChordProgressionData,
  targetMeasure: number,
  targetBeat: number,
  timeSignature: number
): RhythmQuestion[] {
  const questions: RhythmQuestion[] = [];
  
  // 指定された小節・拍に該当する問題を探す
  for (const item of progressionData.chords) {
    const { displayMeasure, displayBeat } = calculateDisplayTiming(
      item.measure,
      item.beat,
      timeSignature
    );
    
    // 表示タイミングが現在の小節・拍と一致する場合
    if (displayMeasure === targetMeasure && displayBeat === targetBeat) {
      questions.push({
        chord: item.chord,
        judgmentMeasure: item.measure,
        judgmentBeat: item.beat,
        displayMeasure,
        displayBeat,
        monsterId: '' // 後で設定
      });
    }
  }
  
  return questions;
}

/**
 * 現在時刻が判定ウィンドウ内かどうかチェック
 * @param currentTimeMs 現在時刻（ゲーム開始からのms）
 * @param windowStartMs ウィンドウ開始時刻
 * @param windowEndMs ウィンドウ終了時刻
 * @returns 判定ウィンドウ内かどうか
 */
export function isInJudgmentWindow(
  currentTimeMs: number,
  windowStartMs: number,
  windowEndMs: number
): boolean {
  return currentTimeMs >= windowStartMs && currentTimeMs <= windowEndMs;
}

/**
 * プログレッションデータを小節数でループさせる
 * @param progressionData 元のデータ
 * @param measureCount 全小節数
 * @returns ループ対応したデータ
 */
export function loopProgressionData(
  progressionData: ChordProgressionData,
  measureCount: number
): ChordProgressionItem[] {
  const loopedItems: ChordProgressionItem[] = [];
  const originalLength = Math.max(...progressionData.chords.map(c => c.measure));
  
  // 元のデータが小節数より短い場合、ループさせる
  if (originalLength < measureCount) {
    const loops = Math.ceil(measureCount / originalLength);
    
    for (let loop = 0; loop < loops; loop++) {
      for (const item of progressionData.chords) {
        const newMeasure = item.measure + (loop * originalLength);
        if (newMeasure <= measureCount) {
          loopedItems.push({
            ...item,
            measure: newMeasure
          });
        }
      }
    }
  } else {
    // 元のデータが十分長い場合はそのまま使用
    loopedItems.push(...progressionData.chords.filter(c => c.measure <= measureCount));
  }
  
  return loopedItems;
}