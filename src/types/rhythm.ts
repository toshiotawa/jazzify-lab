// リズムモード関連の型定義

export interface ChordProgressionData {
  chord: string;      // コード名 (例: "C", "G", "Am", "F")
  measure: number;    // 小節番号 (1から開始)
  beat: number;       // 拍位置 (1.0, 1.5, 3.75など)
}

export interface RhythmState {
  isPlaying: boolean;
  currentTime: number;        // 現在の再生時間(ms)
  currentMeasure: number;     // 現在の小節
  currentBeat: number;        // 現在の拍
  nextChordTiming: number;    // 次のコード判定タイミング(ms)
  nextChord: string | null;
  judgmentWindow: number;     // 判定ウィンドウ(200ms)
  progressionIndex: number;
  totalProgressionLength: number;
}

export interface AudioState {
  audio: HTMLAudioElement | null;
  isLoaded: boolean;
  duration: number;
  loopStartTime: number;      // 2小節目開始時間(ms)
  loopEndTime: number;        // ループ終了時間(ms)
}

export interface RhythmTiming {
  targetTime: number;     // 目標タイミング (ms)
  actualTime: number;     // 実際の入力タイミング (ms)
  difference: number;     // 差分 (ms)
  isSuccess: boolean;     // 成功判定
  windowSize: number;     // 判定ウィンドウサイズ (ms)
}

export interface RhythmGameState {
  isPlaying: boolean;
  currentTime: number;
  currentMeasure: number;
  currentBeat: number;
  nextChordTiming: number;
  nextChord: string | null;
  progressionIndex: number;
}

export interface AudioSettings {
  volume: number;         // 0.0 - 1.0
  isLoaded: boolean;
  duration: number;       // ms
  loopStartTime: number;  // ms
  loopEndTime: number;    // ms
}

export type JudgmentResult = 'perfect' | 'great' | 'good' | 'miss';

export interface JudgmentFeedback {
  result: JudgmentResult;
  timingError: number;    // ms
  score: number;
  timestamp: number;
}

export interface TimingDisplayProps {
  isActive: boolean;
  currentTime: number;
  nextTiming: number;
  isInWindow: boolean;
  judgmentResult?: JudgmentFeedback;
}

export interface MusicControlProps {
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  showControls: boolean;
}

export interface RhythmError {
  type: 'AUDIO_LOAD_ERROR' | 'TIMING_SYNC_ERROR' | 'INVALID_PROGRESSION' | 'UNKNOWN_ERROR';
  message: string;
  timestamp: number;
  additionalInfo?: unknown;
}

export interface RhythmStats {
  totalNotes: number;
  hitNotes: number;
  accuracy: number;
  maxCombo: number;
  currentCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
}

export interface RhythmSettings {
  judgmentWindowMs: number;    // デフォルト: 200
  visualOffset: number;        // 視覚的オフセット (ms)
  audioOffset: number;         // オーディオオフセット (ms)
  showTimingMarker: boolean;
  showDebugInfo: boolean;
}