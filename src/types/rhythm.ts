/**
 * リズムモード用の型定義
 */

// ===== 基本型 =====

/**
 * リズムノート
 */
export interface RhythmNote {
  id: string;
  time: number;         // 出現時刻（秒）
  padIndex: number;     // パッドインデックス (0-3)
  duration?: number;    // 持続時間（ロングノート用）
  velocity: number;     // 強さ (0-127)
  accent: boolean;      // アクセント
  ghost: boolean;       // ゴーストノート
}

/**
 * ドラム楽器タイプ
 */
export type DrumInstrument = 
  | 'kick'
  | 'snare'
  | 'hihat-closed'
  | 'hihat-open'
  | 'crash'
  | 'ride'
  | 'tom-high'
  | 'tom-low';

/**
 * ドラムパッド設定
 */
export interface DrumPad {
  index: number;        // 0-3
  key: string;          // キーボードキー (D, F, J, K)
  midiNote: number;     // MIDI ノート番号
  instrument: DrumInstrument;
  color: string;        // 表示色 (16進数)
  position: { x: number; y: number };
  label: string;        // 表示ラベル
}

/**
 * リズムカテゴリ
 */
export type RhythmCategory = 
  | 'basic'      // 基本
  | 'jazz'       // ジャズ
  | 'latin'      // ラテン
  | 'funk'       // ファンク
  | 'rock'       // ロック
  | 'blues'      // ブルース
  | 'custom';    // カスタム

/**
 * 拍子記号
 */
export interface TimeSignature {
  numerator: number;    // 分子 (e.g., 4 in 4/4)
  denominator: number;  // 分母 (e.g., 4 in 4/4)
}

/**
 * リズムパターン
 */
export interface RhythmPattern {
  id: string;
  name: string;
  category: RhythmCategory;
  bpm: number;
  timeSignature: TimeSignature;
  difficulty: 1 | 2 | 3 | 4 | 5;
  notes: RhythmNote[];
  duration: number;     // パターンの長さ（秒）
  description?: string;
  audioFile?: string;   // お手本音源
  preCount?: number;    // カウントイン拍数
}

// ===== ゲーム状態 =====

/**
 * アクティブなリズムノート（ゲーム中）
 */
export interface ActiveRhythmNote extends RhythmNote {
  state: 'approaching' | 'active' | 'hit' | 'missed';
  y: number;            // 現在のY座標
  hitTime?: number;     // ヒット時刻
  judgment?: RhythmJudgment;
  sprite?: any;         // PIXI.jsスプライト参照
}

/**
 * リズム判定結果
 */
export type RhythmJudgment = 'perfect' | 'good' | 'ok' | 'miss';

/**
 * リズムスコア
 */
export interface RhythmScore {
  perfect: number;
  good: number;
  ok: number;
  miss: number;
  combo: number;
  maxCombo: number;
  accuracy: number;      // 0-1
  score: number;
  totalNotes: number;
}

/**
 * リズム設定
 */
export interface RhythmSettings {
  notesSpeed: number;           // ノーツ速度 (0.5-3.0)
  soundVolume: number;          // ドラム音量 (0-1)
  metronomeVolume: number;      // メトロノーム音量 (0-1)
  visualMetronome: boolean;     // 視覚的メトロノーム
  autoPlay: boolean;            // オートプレイ
  padLayout: 'linear' | 'square'; // パッドレイアウト
  judgmentStrictness: 'easy' | 'normal' | 'strict';
  showJudgmentLine: boolean;    // 判定ライン表示
  enableEffects: boolean;       // エフェクト有効化
}

/**
 * リズムゲーム状態
 */
export interface RhythmGameState {
  pattern: RhythmPattern | null;
  activeNotes: Map<string, ActiveRhythmNote>;
  score: RhythmScore;
  settings: RhythmSettings;
  isMetronomeOn: boolean;
  currentBeat: number;          // 現在の拍
  currentMeasure: number;       // 現在の小節
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;          // 現在時刻（秒）
}

// ===== 判定関連 =====

/**
 * 判定タイミングウィンドウ
 */
export interface JudgmentTimingWindows {
  perfect: number;   // ±ms
  good: number;      // ±ms
  ok: number;        // ±ms
}

/**
 * 判定結果詳細
 */
export interface RhythmJudgmentResult {
  noteId: string;
  padIndex: number;
  judgment: RhythmJudgment;
  timingError: number;  // ms (正: 遅い, 負: 早い)
  timestamp: number;
  combo: number;
}

// ===== イベント =====

/**
 * リズム入力イベント
 */
export interface RhythmInputEvent {
  padIndex: number;
  inputType: 'keyboard' | 'midi' | 'touch' | 'mouse';
  timestamp: number;
  velocity?: number;    // MIDI入力時のベロシティ
}

/**
 * パッドヒットエフェクト設定
 */
export interface PadHitEffect {
  color: string;
  duration: number;     // ms
  scale: number;
  opacity: number;
}

// ===== UI関連 =====

/**
 * パッドレイアウト設定
 */
export interface PadLayoutConfig {
  type: 'linear' | 'square';
  spacing: number;      // パッド間の間隔
  padSize: number;      // パッドのサイズ
  containerWidth: number;
  containerHeight: number;
}

/**
 * ビジュアルメトロノーム設定
 */
export interface VisualMetronome {
  enabled: boolean;
  position: 'top' | 'bottom';
  size: number;
  strongBeatColor: string;
  weakBeatColor: string;
}

// ===== デフォルト値 =====

export const DEFAULT_RHYTHM_SETTINGS: RhythmSettings = {
  notesSpeed: 1.0,
  soundVolume: 0.8,
  metronomeVolume: 0.5,
  visualMetronome: true,
  autoPlay: false,
  padLayout: 'linear',
  judgmentStrictness: 'normal',
  showJudgmentLine: true,
  enableEffects: true,
};

export const DEFAULT_RHYTHM_SCORE: RhythmScore = {
  perfect: 0,
  good: 0,
  ok: 0,
  miss: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  score: 0,
  totalNotes: 0,
};

export const DEFAULT_DRUM_PADS: DrumPad[] = [
  {
    index: 0,
    key: 'D',
    midiNote: 36, // C1
    instrument: 'kick',
    color: '#FF6B6B',
    position: { x: 0, y: 0 },
    label: 'Kick',
  },
  {
    index: 1,
    key: 'F',
    midiNote: 38, // D1
    instrument: 'snare',
    color: '#4ECDC4',
    position: { x: 1, y: 0 },
    label: 'Snare',
  },
  {
    index: 2,
    key: 'J',
    midiNote: 42, // F#1
    instrument: 'hihat-closed',
    color: '#45B7D1',
    position: { x: 2, y: 0 },
    label: 'Hi-Hat',
  },
  {
    index: 3,
    key: 'K',
    midiNote: 49, // C#2
    instrument: 'crash',
    color: '#F7DC6F',
    position: { x: 3, y: 0 },
    label: 'Crash',
  },
];

export const JUDGMENT_TIMING_WINDOWS: Record<RhythmSettings['judgmentStrictness'], JudgmentTimingWindows> = {
  easy: {
    perfect: 50,
    good: 150,
    ok: 300,
  },
  normal: {
    perfect: 30,
    good: 100,
    ok: 200,
  },
  strict: {
    perfect: 20,
    good: 60,
    ok: 120,
  },
};