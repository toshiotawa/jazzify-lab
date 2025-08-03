/**
 * 太鼓の達人モード用の型定義
 */

export interface TaikoNote {
  id: string;          // UUID
  bar: number;         // 小節番号（1開始）
  beat: number;        // 拍番号（1開始、1-timeSignature）
  absTimeMs: number;   // 楽曲開始からの絶対時間（ミリ秒）
  chordId: string;     // コードID（例: 'C', 'Am', 'G7'）
  displayName: string; // 表示用コード名
}

export interface TaikoSchedule {
  notes: TaikoNote[];
  measureCount: number;
  bpm: number;
  timeSig: number;
  loopStartMs: number;  // ループ開始時間（カウントイン後）
  loopEndMs: number;    // ループ終了時間
}

export interface TaikoJudgeResult {
  type: 'good' | 'bad' | 'none';
  timestamp: number;
  noteId?: string;
}

// 拡張版用のコード進行データ形式
export interface ChordProgressionData {
  bar: number;
  beat: number;
  chord: string;
}

// BGMManagerのビートコールバック型
export type BeatCallback = (bar: number, beat: number, absMs: number) => void;