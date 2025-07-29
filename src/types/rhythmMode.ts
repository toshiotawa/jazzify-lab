// リズムモードに関する型定義

export type PlayMode = 'quiz' | 'rhythm';
export type PatternType = 'random' | 'progression';
export type TimeSignature = 3 | 4;

// 楽曲メタデータ
export interface SongMetadata {
  bpm: number;
  timeSignature: TimeSignature;
  loopMeasures: number;
  audioUrl: string;
}

// リズムイベント（JSONから読み込まれるコード情報）
export interface RhythmEvent {
  code: string;         // コード名（例: "C", "Am7"）
  measure: number;      // 小節番号（1始まり）
  beat: number;         // 拍番号（1.0, 1.5, 2.75 など）
}

// リズムモード用ステージデータ
export interface RhythmStageData {
  id: string;
  stage_number: string;
  play_mode: PlayMode;
  pattern_type?: PatternType;  // リズムモードの場合のみ必要
  time_signature: TimeSignature;
  bpm: number;
  loop_measures: number;
  allowed_chords: string[];
  chord_progression?: string[];  // プログレッションパターンの場合のみ
  enemy_gauge_seconds: number;
  enemy_count: number;
  enemy_hp: number;
  min_damage: number;
  max_damage: number;
  simultaneous_monster_count: number;
  monster_icon: string;
  bgm_url?: string;
  show_guide: boolean;
}

// ゲージ状態
export interface GaugeState {
  enemyId: string;
  currentPercent: number;
  isActive: boolean;
  targetTime: number;  // 次の演奏タイミングの時刻（秒）
}

// 判定結果
export interface JudgmentResult {
  timing: 'perfect' | 'good' | 'miss';
  accuracy: number;  // -200ms ~ +200ms の範囲での精度
  chord: string;
  lane: number;
}

// レーン状態（プログレッションパターン用）
export interface LaneState {
  lane: number;  // 0-based index (0=A, 1=B, etc.)
  currentChord: string;
  enemyId: string;
  gaugeState: GaugeState;
}

// リズムゲーム全体の状態
export interface RhythmGameState {
  playMode: PlayMode;
  patternType: PatternType;
  songMetadata: SongMetadata;
  currentMeasure: number;
  currentBeat: number;
  songTime: number;  // 楽曲開始からの経過時間（秒）
  isPlaying: boolean;
  isPaused: boolean;
  
  // ランダムパターン用
  currentChord?: string;
  nextChordTime?: number;
  
  // プログレッションパターン用
  lanes?: LaneState[];
  progressionIndex?: number;  // 現在のコード進行インデックス
  
  // 共通
  combo: number;
  score: number;
  playerHP: number;
  sp: number;  // SPゲージ (0-5)
  
  // 判定履歴
  judgmentHistory: JudgmentResult[];
}

// オーディオマネージャーのインターフェース
export interface IAudioManager {
  loadSong(url: string): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  getCurrentTime(): number;
  setLoopPoints(startMeasure: number, endMeasure: number, bpm: number, timeSignature: TimeSignature): void;
  isPlaying(): boolean;
  setVolume(volume: number): void;
}