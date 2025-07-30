import { TimeSignature, PatternType, LaneState, GaugeState } from '@/types/rhythmMode';

// ===== 定数 =====
export const JUDGMENT_WINDOW_MS = 200; // ±200ms
export const GAUGE_MARKER_PERCENT = 80; // 80%地点で判定
export const PERFECT_WINDOW_MS = 50; // ±50ms
export const GOOD_WINDOW_MS = 100; // ±100ms

// タイミング判定の種類
export type TimingJudgment = 'perfect' | 'good' | 'miss' | 'early' | 'late';

// ===== ゲージ計算 =====

/**
 * 現在の楽曲時間から小節の進行度を計算
 * @param songTime 楽曲開始からの経過時間（秒）
 * @param bpm テンポ
 * @param timeSignature 拍子
 * @returns 小節の進行度（0-1）
 */
export function calculateMeasureProgress(
  songTime: number,
  bpm: number,
  timeSignature: TimeSignature
): number {
  const secondsPerBeat = 60 / bpm;
  const secondsPerMeasure = secondsPerBeat * timeSignature;
  const measureProgress = (songTime % secondsPerMeasure) / secondsPerMeasure;
  return measureProgress;
}

/**
 * 小節の進行度からゲージパーセンテージを計算
 * @param measureProgress 小節の進行度（0-1）
 * @returns ゲージパーセンテージ（0-100）
 */
export function calculateGaugePercent(measureProgress: number): number {
  return measureProgress * 100;
}

/**
 * 次の演奏タイミングまでの時間を計算
 * @param currentTime 現在の楽曲時間（秒）
 * @param targetBeat 目標の拍（1.0, 2.0, etc）
 * @param currentMeasure 現在の小節
 * @param bpm テンポ
 * @param timeSignature 拍子
 * @returns 次の演奏タイミングまでの秒数
 */
export function calculateTimeToNextBeat(
  currentTime: number,
  targetBeat: number,
  currentMeasure: number,
  bpm: number,
  timeSignature: TimeSignature
): number {
  const secondsPerBeat = 60 / bpm;
  const secondsPerMeasure = secondsPerBeat * timeSignature;
  
  // 目標時刻を計算
  const targetTime = (currentMeasure - 1) * secondsPerMeasure + (targetBeat - 1) * secondsPerBeat;
  
  // 現在時刻との差分
  let timeDiff = targetTime - currentTime;
  
  // すでに過ぎている場合は次の小節の同じ拍を目標にする
  if (timeDiff < -JUDGMENT_WINDOW_MS / 1000) {
    timeDiff += secondsPerMeasure;
  }
  
  return timeDiff;
}

// ===== タイミング判定 =====

/**
 * 入力タイミングの判定を行う
 * @param timingDiff タイミングの差分（秒）
 * @returns 判定結果
 */
export function judgeInputTiming(timingDiff: number): TimingJudgment {
  const diffMs = Math.abs(timingDiff * 1000);
  
  if (diffMs <= PERFECT_WINDOW_MS) {
    return 'perfect';
  } else if (diffMs <= GOOD_WINDOW_MS) {
    return 'good';
  } else if (diffMs <= JUDGMENT_WINDOW_MS) {
    return timingDiff < 0 ? 'early' : 'late';
  } else {
    return 'miss';
  }
}

/**
 * タイミング判定に基づくダメージ倍率を計算
 * @param judgment 判定結果
 * @returns ダメージ倍率
 */
export function calculateDamageMultiplier(judgment: TimingJudgment): number {
  switch (judgment) {
    case 'perfect':
      return 1.5;
    case 'good':
      return 1.0;
    case 'early':
    case 'late':
      return 0.7;
    case 'miss':
    default:
      return 0;
  }
}

/**
 * タイミング判定に基づくスコアボーナスを計算
 * @param judgment 判定結果
 * @returns スコアボーナス
 */
export function calculateScoreBonus(judgment: TimingJudgment): number {
  switch (judgment) {
    case 'perfect':
      return 100;
    case 'good':
      return 50;
    case 'early':
    case 'late':
      return 20;
    case 'miss':
    default:
      return 0;
  }
}

// ===== レーン管理（プログレッションパターン用） =====

/**
 * レーンの初期状態を生成
 * @param laneCount レーン数（3 or 4）
 * @param chordProgression コード進行配列
 * @returns レーン状態の配列
 */
export function initializeLanes(
  laneCount: number,
  chordProgression: string[]
): LaneState[] {
  return Array.from({ length: laneCount }, (_, i) => {
    const chordIndex = i % chordProgression.length;
    const enemyId = `enemy-${i}`;
    return {
      lane: i,
      currentChord: chordProgression[chordIndex],
      enemyId,
      gaugeState: {
        enemyId,
        currentPercent: 0,
        isActive: false,
        targetTime: 0,
      }
    };
  });
}

/**
 * レーンのコードを更新（エンドレスシフトリピート対応）
 * @param lanes 現在のレーン状態
 * @param defeatedLane 撃破されたレーン番号
 * @param chordProgression コード進行配列
 * @param progressionIndex 現在の進行インデックス
 * @returns 更新後のレーン状態と新しい進行インデックス
 */
export function updateLaneChord(
  lanes: LaneState[],
  defeatedLane: number,
  chordProgression: string[],
  progressionIndex: number
): { updatedLanes: LaneState[]; newProgressionIndex: number } {
  const updatedLanes = [...lanes];
  const newProgressionIndex = (progressionIndex + 1) % chordProgression.length;
  
  // 撃破されたレーンに新しいコードを配置
  updatedLanes[defeatedLane] = {
    ...updatedLanes[defeatedLane],
    currentChord: chordProgression[newProgressionIndex],
    gaugeState: {
      ...updatedLanes[defeatedLane].gaugeState,
      currentPercent: 0,
      isActive: false,
    }
  };
  
  return {
    updatedLanes,
    newProgressionIndex
  };
}

/**
 * プログレッションパターンでの次のコード配置を計算
 * @param currentMeasure 現在の小節
 * @param laneCount レーン数
 * @param chordProgression コード進行配列
 * @returns 各レーンに配置するコードのインデックス配列
 */
export function calculateProgressionLayout(
  currentMeasure: number,
  laneCount: number,
  chordProgression: string[]
): number[] {
  const totalChords = chordProgression.length;
  const startIndex = ((currentMeasure - 1) * laneCount) % totalChords;
  
  return Array.from({ length: laneCount }, (_, i) => {
    return (startIndex + i) % totalChords;
  });
}

// ===== ランダムパターン用 =====

/**
 * 次のランダムコードを選択（前回と同じコードを避ける）
 * @param allowedChords 使用可能なコード配列
 * @param previousChord 前回のコード
 * @returns 選択されたコード
 */
export function selectRandomChord(
  allowedChords: string[],
  previousChord?: string
): string {
  if (allowedChords.length === 1) {
    return allowedChords[0];
  }
  
  let availableChords = allowedChords;
  if (previousChord) {
    availableChords = allowedChords.filter(chord => chord !== previousChord);
  }
  
  const randomIndex = Math.floor(Math.random() * availableChords.length);
  return availableChords[randomIndex];
}

// ===== ゲージ状態の更新 =====

/**
 * ゲージ状態を更新
 * @param gauge 現在のゲージ状態
 * @param songTime 現在の楽曲時間
 * @param bpm テンポ
 * @param timeSignature 拍子
 * @returns 更新されたゲージ状態
 */
export function updateGaugeState(
  gauge: GaugeState,
  songTime: number,
  bpm: number,
  timeSignature: TimeSignature
): GaugeState {
  const measureProgress = calculateMeasureProgress(songTime, bpm, timeSignature);
  const gaugePercent = calculateGaugePercent(measureProgress);
  
  // 判定タイミングに近づいたらアクティブ化
  const isNearJudgment = Math.abs(gaugePercent - GAUGE_MARKER_PERCENT) < 10;
  
  return {
    ...gauge,
    currentPercent: gaugePercent,
    isActive: isNearJudgment,
  };
}

// ===== 判定タイミングのチェック =====

/**
 * 現在が判定可能なタイミングかチェック
 * @param gaugePercent 現在のゲージパーセント
 * @param bpm テンポ
 * @param timeSignature 拍子
 * @returns 判定可能かどうか
 */
export function isWithinJudgmentWindow(
  gaugePercent: number,
  bpm: number,
  timeSignature: TimeSignature
): boolean {
  const secondsPerMeasure = (60 / bpm) * timeSignature;
  const windowPercent = (JUDGMENT_WINDOW_MS / 1000) / secondsPerMeasure * 100;
  
  const diff = Math.abs(gaugePercent - GAUGE_MARKER_PERCENT);
  return diff <= windowPercent;
}

/**
 * タイミングを逃したかチェック
 * @param gaugePercent 現在のゲージパーセント
 * @param bpm テンポ
 * @param timeSignature 拍子
 * @returns タイミングを逃したかどうか
 */
export function hasMissedTiming(
  gaugePercent: number,
  bpm: number,
  timeSignature: TimeSignature
): boolean {
  const secondsPerMeasure = (60 / bpm) * timeSignature;
  const windowPercent = (JUDGMENT_WINDOW_MS / 1000) / secondsPerMeasure * 100;
  
  return gaugePercent > GAUGE_MARKER_PERCENT + windowPercent;
}