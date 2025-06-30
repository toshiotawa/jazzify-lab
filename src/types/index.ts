/**
 * アプリケーション全体の型定義
 */

// ===== 基本的なゲーム状態 =====

export type GameMode = 'practice' | 'performance';
export type InstrumentMode = 'piano' | 'guitar';
export type InputMode = 'midi' | 'audio' | 'both';

// ===== ノーツデータ =====

export interface NoteData {
  id: string;
  time: number;      // 秒単位での時間
  pitch: number;     // MIDIノート番号 (21-108)
  appearTime?: number; // ノーツが表示される時間（計算で設定）
}

// ===== Phase 2: ゲームエンジン型定義 =====

export type NoteState = 'waiting' | 'visible' | 'hit' | 'good' | 'perfect' | 'missed' | 'completed';

export interface ActiveNote extends NoteData {
  state: NoteState;
  hitTime?: number;
  timingError?: number;
  y?: number; // 描画用Y座標（PIXI.js用）
  previousY?: number; // 前フレームのY座標（判定ライン通過検出用）
  judged?: boolean; // Miss判定の重複を防ぐフラグ
  crossingLogged?: boolean; // 判定ライン通過ログの重複を防ぐフラグ
}

export interface JudgmentTiming {
  perfectMs: number;  // ±50ms
  goodMs: number;     // ±300ms
  missMs: number;     // それ以外
}

export interface NoteHit {
  noteId: string;
  inputNote: number;
  timingError: number;
  judgment: 'perfect' | 'good' | 'miss';
  timestamp: number;
}

export interface MusicalTiming {
  currentTime: number;
  audioTime: number;
  latencyOffset: number;
  beatTime?: number;
  measureTime?: number;
}

export interface NotesCollection {
  notes: NoteData[];
  metadata: {
    totalNotes: number;
    duration: number;
    minPitch: number;
    maxPitch: number;
  };
}

// ===== 楽曲データ =====

export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  difficulty: number; // 1-5
  duration: number;   // 秒
  audioFile: string;
  notesFile: string;
  genreCategory: string;
  previewStart?: number; // プレビュー開始時間
  tags?: string[];
}

// ===== ゲーム設定 =====

export interface GameSettings {
  // 音量設定
  masterVolume: number;        // 0-1
  musicVolume: number;         // 0-1
  midiVolume: number;          // 0-1
  
  // ゲーム設定
  notesSpeed: number;          // 0.5-3.0
  playbackSpeed: number;       // 0.25-2.0
  instrumentMode: InstrumentMode;
  inputMode: InputMode;
  
  // 判定設定
  allowOctaveError: boolean;   // オクターブ違いを正解にする
  noteOctaveShift: number;     // -2 to +2
  
  // タイミング調整設定
  /** 楽譜データの時間調整 (ms) - 楽譜のノーツタイミングを±100ms調整 */
  timingAdjustment: number;    // -100 to +100 (ms)
  
  // 表示設定
  showNoteNames: boolean; // (deprecated) True if legacy for note names
  /** 統一された音名表示モード（鍵盤・ノーツ共通）: off | abc | solfege */
  noteNameStyle: 'off' | 'abc' | 'solfege';
  /** ノーツ音名の臨時記号(#/♭)スタイル */
  noteAccidentalStyle?: 'sharp' | 'flat';
  showFPS: boolean;
  
  // ビューポート設定（動的レイアウト対応）
  /** ゲームエリア（ノーツ降下領域を含むキャンバス）の高さ(px) */
  viewportHeight: number;
  /** ピアノ鍵盤エリアの高さ(px) */
  pianoHeight: number;
  
  // 入力デバイス
  selectedMidiDevice: string | null;
  selectedAudioDevice: string | null;
  
  // キー設定
  transpose: number;           // -6 to +6 (半音)
  
  /** 追加レイテンシ補正（秒）。正の値で描画/判定を遅らせる、負で早める */
  latencyAdjustment?: number;
  
  /** 練習モードのガイド設定: off | key | key_auto */
  practiceGuide?: 'off' | 'key' | 'key_auto';
  
  // ===== エフェクト設定 =====
  /** エフェクト全般の有効/無効 */
  enableEffects: boolean;
  
  /** キー押下時の即時エフェクト設定 */
  keyPressEffect: {
    /** エフェクト有効/無効 */
    enabled: boolean;
    /** 判定ライン近接の閾値係数（ノート高さに対する倍率） */
    proximityThreshold: number; // デフォルト: 1.5
    /** エフェクトサイズ倍率 */
    sizeMultiplier: number; // デフォルト: 1.0
    /** エフェクト持続時間（秒） */
    duration: number; // デフォルト: 0.3
  };
  
  /** ヒット判定エフェクト設定 */
  hitEffect: {
    /** エフェクト有効/無効 */
    enabled: boolean;
    /** エフェクトサイズ倍率 */
    sizeMultiplier: number; // デフォルト: 1.0
    /** エフェクト持続時間（秒） */
    duration: number; // デフォルト: 0.3
    /** エフェクトの透明度 */
    opacity: number; // デフォルト: 1.0
  };
  
  /** パフォーマンスモード（軽量化） */
  performanceMode: 'standard' | 'lightweight' | 'ultra_light';
}

// ===== 採点システム =====

export interface JudgmentResult {
  type: 'good' | 'miss';
  timingError: number;         // ms
  noteId: string;
  timestamp: number;
}

export interface GameScore {
  totalNotes: number;
  goodCount: number;
  missCount: number;
  combo: number;
  maxCombo: number;
  accuracy: number;            // 0-1
  score: number;               // 0-1000
  rank: ScoreRank;
}

export type ScoreRank = 'S' | 'A' | 'B' | 'C' | 'D';

// ===== ゲーム状態 =====

export interface GameState {
  // ゲーム基本状態
  mode: GameMode;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;         // 秒
  
  // 楽曲情報
  currentSong: SongMetadata | null;
  notes: NoteData[];
  activeNotes: Set<string>;    // 現在表示中のノートID
  
  // ABリピート（練習モード）
  abRepeat: {
    enabled: boolean;
    startTime: number | null;
    endTime: number | null;
  };
  
  // スコア情報
  score: GameScore;
  judgmentHistory: JudgmentResult[];
  
  // 設定
  settings: GameSettings;
  
  // UI状態
  isSettingsOpen: boolean;
  currentTab: 'practice' | 'performance' | 'songs';
  /** リザルトモーダル表示 */
  resultModalOpen: boolean;
  
  // デバッグ情報
  debug: {
    fps: number;
    renderTime: number;
    audioLatency: number;
  };
}

// ===== 入力システム =====

export interface InputEvent {
  type: 'noteOn' | 'noteOff';
  note: number;
  velocity?: number;
  timestamp: number;
  source: InputMode;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
  connected: boolean;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

// ===== 描画システム =====

export interface RenderData {
  notes: NoteData[];
  currentTime: number;
  viewportWidth: number;
  viewportHeight: number;
  notesSpeed: number;
  instrumentMode: InstrumentMode;
}

export interface PIXIRendererConfig {
  width: number;
  height: number;
  backgroundColor: number;
  transparent: boolean;
  antialias: boolean;
  powerPreference: 'default' | 'high-performance' | 'low-power';
}

// ===== エフェクトシステム =====

export interface Effect {
  id: string;
  type: 'hit' | 'miss' | 'combo' | 'perfect';
  x: number;
  y: number;
  startTime: number;
  duration: number;
  data?: any;
}

// ===== 設定パネル =====

export interface SettingsSection {
  id: string;
  title: string;
  icon?: string;
  items: SettingsItem[];
}

export interface SettingsItem {
  id: string;
  type: 'slider' | 'select' | 'toggle' | 'button';
  label: string;
  value: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: any) => void;
}

// ===== エラーハンドリング =====

export interface GameError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
}

export type ErrorType = 
  | 'AUDIO_INIT_FAILED'
  | 'MIDI_CONNECTION_FAILED'
  | 'SONG_LOAD_FAILED'
  | 'RENDER_ERROR'
  | 'AUDIO_CONTEXT_ERROR';

// ===== API/データローディング =====

export interface LoadingState {
  isLoading: boolean;
  progress: number;        // 0-1
  currentStep: string;
  error: GameError | null;
}

export interface SongLibrary {
  categories: Array<{
    id: string;
    name: string;
    songs: SongMetadata[];
  }>;
  featured: SongMetadata[];
  recent: SongMetadata[];
}

// ===== ユーティリティ型 =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type EventCallback<T = any> = (data: T) => void;

export interface EventBus {
  on<T>(event: string, callback: EventCallback<T>): void;
  off<T>(event: string, callback: EventCallback<T>): void;
  emit<T>(event: string, data: T): void;
  clear(): void;
}

// ===== レスポンシブ設計 =====

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export interface ViewportInfo {
  width: number;
  height: number;
  screenSize: ScreenSize;
  isPortrait: boolean;
  devicePixelRatio: number;
}

// ===== パフォーマンス監視 =====

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  updateTime: number;
  memoryUsage?: number;
  activeNotes: number;
  totalNotes: number;
}

// ===== 既存システム統合用 =====

export interface LegacyGameInstance {
  lastSeekTime: number;
  seekCooldownTime: number;
  isJustAfterSeek: boolean;
  isInLoop: boolean;
  isSkipping: boolean;
  setAutoPlayMode?: (enabled: boolean) => void;
  getNoteNameFromPitch?: (pitch: number) => string;
  state?: {
    noteNames?: {
      display: boolean;
    };
  };
}

// 既存のインターフェースとの互換性
export interface CompatibilityLayer {
  audioController: any;
  midiController: any;
  piano: any;
  guitar: any;
}

export type JudgmentEvent = JudgmentResult;

// ===== MIDI関連の型定義 =====

export interface MidiMessage {
  data: Uint8Array;
  timeStamp: number;
}

export interface MidiInput {
  id: string;
  name: string;
  manufacturer?: string;
  state: string;
  connection: string;
  addEventListener: (type: string, listener: (event: any) => void) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
  onmidimessage: ((event: { data: Uint8Array }) => void) | null;
}

export interface MidiAccess {
  inputs: Map<string, MidiInput>;
  outputs: Map<string, any>;
  onstatechange: ((event: any) => void) | null;
  sysexEnabled: boolean;
}

export interface ToneSampler {
  toDestination(): ToneSampler;
  triggerAttack(note: string | number, time?: number, velocity?: number): void;
  triggerRelease(note: string | number, time?: number): void;
  connect(destination: any): void;
  dispose(): void;
}

export interface ToneFrequency {
  toFrequency(): number;
}

export interface ToneStatic {
  Sampler: new (options: any) => ToneSampler;
  Frequency: new (note: string | number) => ToneFrequency;
  context: any;
}

export interface MidiControllerOptions {
  onNoteOn: (note: number, velocity?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
} 