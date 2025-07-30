import { useRhythmStore } from './store';

/** 
 * question.absSec を 0→80% にマッピングしたゲージ値(0-100)を計算する
 * 注意: これは通常の関数で、Reactコンポーネント内でのみ使用すること
 */
export const calculateGaugePercent = (absSec: number, now: number, measureLen: number): number => {
  const delta = absSec - now; // 秒差
  
  // 1小節前〜判定点の範囲だけをゲージ対象にする
  const span = measureLen; // 1小節 = 100%
  const p = 1 - (delta / span); // 0〜1
  const clamp = Math.max(0, Math.min(0.8, p)); // 80%上限
  
  return clamp * 100;
};

/**
 * Reactコンポーネント用のフック
 */
export const useGaugePercent = (absSec: number): number => {
  const now = useRhythmStore((s) => s.now);
  const measureLen = useRhythmStore((s) => s.measureLen);
  
  return calculateGaugePercent(absSec, now, measureLen);
};

/**
 * Calculate measure and beat from absolute seconds
 */
export const getMeasureAndBeat = (absSec: number, bpm: number, timeSig: number): { measure: number; beat: number } => {
  const beatLen = 60 / bpm;
  const measureLen = beatLen * timeSig;
  
  const measure = Math.floor(absSec / measureLen) + 1;
  const beatInMeasure = Math.floor((absSec % measureLen) / beatLen) + 1;
  
  return { measure, beat: beatInMeasure };
};