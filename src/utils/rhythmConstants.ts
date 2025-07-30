// リズムモード関連の定数定義

export const RHYTHM_CONSTANTS = {
  // タイミング関連
  DEFAULT_JUDGMENT_WINDOW: 200,    // ms
  PERFECT_WINDOW: 50,              // ms
  GREAT_WINDOW: 100,               // ms
  GOOD_WINDOW: 200,                // ms
  
  // スコア関連
  PERFECT_SCORE: 200,
  GREAT_SCORE: 150,
  GOOD_SCORE: 100,
  MISS_PENALTY: -10,
  COMBO_BONUS_MULTIPLIER: 1.1,
  
  // UI関連
  TIMING_MARKER_POSITION: 0.8,     // 80% position
  ANIMATION_DURATION: 300,         // ms
  FEEDBACK_DISPLAY_TIME: 1000,     // ms
  
  // 音楽関連
  DEFAULT_BPM: 120,
  DEFAULT_TIME_SIGNATURE: 4,
  DEFAULT_LOOP_MEASURES: 8,
  LOOP_START_MEASURE: 2,           // 2nd measure
  
  // エラー許容範囲
  MAX_TIMING_DRIFT: 50,            // ms
  SYNC_CHECK_INTERVAL: 1000,       // ms
} as const;

export type RhythmConstant = typeof RHYTHM_CONSTANTS;