// constants/rhythm.ts
export const JUDGE_WINDOW_MS = 200;

export type RhythmMode = 'random' | 'progression';

export interface StageMeta {
  mode: 'quiz' | 'rhythm';
  rhythmMode?: RhythmMode; // rhythm のみ
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countInMeasures: number;
  allowedChords: string[];
  chordProgression?: ChordProgressionEntry[];
}

export interface ChordProgressionEntry {
  measure: number; // 1-based
  beat: number;    // 小数 (1.0, 1.5, …)
  chord: string;
}

export interface Note {
  id: string;
  chord: string;
  atMeasure: number;
  atBeat: number;
  spawnTimeMs: number;   // スクロール開始時刻
  hitTimeMs: number;     // 判定中心時刻
}

// スクロール設定
export const SCROLL_DURATION_MS = 3000; // ノーツが画面を横断する時間
export const LANE_HEIGHT = 80; // レーンの高さ（ピクセル）