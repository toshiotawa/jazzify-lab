import { useRhythmStore } from './store';

/** 
 * question.absSec を 0→80% にマッピングしたゲージ値(0-100)を返す 
 */
export const useGaugePercent = (absSec: number): number => {
  const { now, measureLen } = useRhythmStore();
  const delta = absSec - now; // 秒差
  
  // 1小節前〜判定点の範囲だけをゲージ対象にする
  const span = measureLen; // 1小節 = 100%
  const p = 1 - (delta / span); // 0〜1
  const clamp = Math.max(0, Math.min(0.8, p)); // 80%上限
  
  return clamp * 100;
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