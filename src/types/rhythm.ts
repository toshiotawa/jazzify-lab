/**
 * リズムモード用の型定義
 */

// ノーツの型定義
export interface RhythmNote {
  id: string;
  chord: string;
  measure: number;
  beat: number;
  position: number; // 画面上のX座標
  judged: boolean;
  targetTime: number; // 判定ラインに到達する時刻(ms)
}

// 判定ウィンドウの型定義
export interface JudgmentWindow {
  startTime: number;
  endTime: number;
  chord: string;
  noteId: string;
  judged: boolean;
}

// リズムモードの状態
export interface RhythmModeState {
  notes: RhythmNote[];
  judgmentWindows: JudgmentWindow[];
  currentNoteIndex: number;
  score: number;
  combo: number;
  isPlaying: boolean;
}

// コード進行データの型定義
export interface ChordProgressionData {
  chords: Array<{
    measure: number;
    beat: number;
    chord: string;
  }>;
}

// 判定タイミングの設定
export const JUDGMENT_WINDOW_MS = 200; // 前後200ms
export const NOTE_SPEED = 2; // ノーツの速度（秒/画面幅）
export const JUDGMENT_LINE_POSITION = 0.1; // 画面左端から10%の位置