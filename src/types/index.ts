/**
 * アプリケーション全体の型定義
 */

// ===== 基本的なゲーム状態 =====

export type GameMode = 'practice' | 'performance';
export type InstrumentMode = 'piano' | 'guitar';
export type InputMode = 'midi' | 'audio' | 'both';

// 移調楽器タイプ
export type TransposingInstrument = 
  | 'concert_pitch'      // コンサートピッチ（移調なし）
  | 'bb_major_2nd'       // in Bb (長2度上) - ソプラノサックス、トランペット、クラリネット
  | 'bb_major_9th'       // in Bb (1オクターブ+長2度上) - テナーサックス
  | 'eb_major_6th'       // in Eb (長6度上) - アルトサックス
  | 'eb_major_13th';     // in Eb (1オクターブ+長6度上) - バリトンサックス

// ===== コードネーム表示システム =====

export interface ChordSymbol {
  id: string;           // ユニークID
  root: string;         // ルート音名（例: "C", "F#", "Bb"）
  kind: string;         // コードタイプ（例: "major-seventh", "minor-seventh", "diminished-seventh"）
  displayText: string;  // 表示用テキスト（例: "CM7", "Fm7", "Bdim7"）
  measureNumber: number; // 小節番号
  timeOffset: number;   // 小節内での時間オフセット（0-1）
}

export interface ChordInfo {
  startTime: number;    // 開始時刻（秒）
  endTime?: number;     // 終了時刻（秒、次のコードまで）
  symbol: ChordSymbol;  // コードシンボル情報
  originalSymbol: ChordSymbol; // 移調前の元のシンボル（移調表示用）
}

// ===== ノーツデータ =====

export interface NoteData {
  id: string;
  time: number;      // 秒単位での時間
  pitch: number;     // MIDIノート番号 (21-108)
  appearTime?: number; // ノーツが表示される時間（計算で設定）
  noteName?: string;  // MusicXMLから取得した音名（例: "C", "D#", "Eb"）
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
  musicXmlFile?: string; // MusicXMLファイルのパス
  genreCategory: string;
  previewStart?: number; // プレビュー開始時間
  tags?: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  difficulty: number; // 1-5
  duration: number;   // 秒
  audioFile: string;
  notesFile: string;
  musicXmlFile?: string; // MusicXMLファイルのパス
  genreCategory: string;
  previewStart?: number; // プレビュー開始時間
  tags?: string[];
  json_url?: string;
  usage_type?: 'general' | 'lesson';
}

// ===== ゲーム設定 =====

export interface GameSettings {
  // 音量設定
  masterVolume: number;        // 0-1
  musicVolume: number;         // 0-1
  midiVolume: number;          // 0-1
  soundEffectVolume: number;   // 0-1 (ファンタジーモード効果音音量)
  bgmVolume: number;           // 0-1 (ファンタジーモードBGM音量)
  
  // ファンタジーモード設定
  playRootSound?: boolean;      // ルート音を鳴らすか
  rootSoundVolume?: number;     // ルート音量(0-1)
  
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
  /** 簡易表示モード: 複雑な音名を基本音名に変換 */
  simpleDisplayMode: boolean;
  /** 楽譜表示のオン/オフ設定 */
  showSheetMusic: boolean;
  /** 楽譜をコードネームのみ表示 */
  sheetMusicChordsOnly: boolean;
  showFPS: boolean;
  /** シークバーの表示/非表示 */
  showSeekbar: boolean;
  /** ヘッダーの表示/非表示 */
  showHeader: boolean;
  
  // ビューポート設定（動的レイアウト対応）
  /** ゲームエリア（ノーツ降下領域を含むキャンバス）の高さ(px) */
  viewportHeight: number;
  /** ピアノ鍵盤エリアの高さ(px) */
  pianoHeight: number;
  
  // 入力デバイス
  selectedMidiDevice: string | null;
  selectedAudioDevice: string | null;
  
  // 音声入力設定
  pyinThreshold: number;       // 0.05-0.5 (PYIN ピッチ検出の閾値)
  
  // キー設定
  transpose: number;           // -6 to +6 (半音)
  
  // 移調楽器設定
  transposingInstrument: TransposingInstrument;
  
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
  rawNotes: NoteData[]; // <--- 追加: 加工前のノートデータ
  musicXml: string | null; // <--- 追加: 移調済みMusicXML
  chords: ChordInfo[]; // <--- 追加: コードネーム情報
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
  
  // レッスン情報（レッスンから起動した場合）
  lessonContext?: {
    lessonId: string;
    clearConditions: ClearConditions;
  };
  
  // ミッション情報（ミッションから起動した場合）
  missionContext?: {
    missionId: string;
    songId: string;
    clearConditions?: ClearConditions;
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
  playMidiSound?: boolean; // 音声再生の有効/無効（デフォルト: true）
}

// ===== 音声入力・ピッチ検出関連 =====

export interface AudioControllerOptions {
  onNoteOn: (note: number, velocity?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface SpectralPeak {
  frequency: number;
  magnitude: number;
  index: number;
}

export interface SpectralAnalysis {
  peaks: SpectralPeak[];
  centroid: number;
  spread: number;
  clarity: number;
}

export interface PitchResult {
  frequency: number;
  confidence: number;
  candidates?: PitchCandidate[];
  observationProbs?: Float32Array;
}

export interface PitchCandidate {
  frequency: number;
  confidence: number;
  midiNote: number;
}

export interface HMMState {
  noteProbs: Float32Array;
  prevStateProbs: Float32Array;
  transitionMatrix: Float32Array;
}

// WASM関数の型定義
export interface WASMModule {
  alloc: (size: number) => number;
  free: (ptr: number, size: number) => void;
  get_memory: () => WebAssembly.Memory;
  init_pitch_detector: (sample_rate: number) => void;
  get_ring_buffer_ptr: () => number;
  get_ring_buffer_size: () => number;
  analyze_pitch: (ptr: number, length: number, sample_rate: number, yin_threshold: number) => number;
  process_audio_block: (new_write_index: number) => number;
}

export interface PitchHistory {
  note: number;
  confidence: number;
  timestamp: number;
}

export interface AudioProcessingSettings {
  bufferSize: number;
  lowFreqBufferSize: number;
  minFrequency: number;
  maxFrequency: number;
  amplitudeThreshold: number;
  consecutiveFramesThreshold: number;
  noteOnThreshold: number;
  noteOffThreshold: number;
  maxAllowedPitchChange: number;
  lowFrequencyThreshold: number;
  lowFrequencyAmplitudeThreshold: number;
  veryLowFreqThreshold: number;
  pyinThreshold: number;
  silenceThreshold: number;
  adaptiveBuffering: boolean;
}

// ===== 既存のAudioDevice型の拡張 =====

export interface ClearConditions {
  key?: number;
  speed?: number;
  rank?: string;
  count?: number;  // requires_days が true の場合は日数、false の場合は総回数
  notation_setting?: 'notes_chords' | 'chords_only' | 'both';
  requires_days?: boolean;  // 日数条件かどうか（true: 日数でカウント、false: 回数でカウント）
  daily_count?: number;  // 1日あたりの必要クリア回数（requires_days が true の場合に使用）
}

// ファンタジーモード関連の型定義
export interface FantasyStage {
  id: string;
  stage_number: string;
  name: string;
  description: string;
  max_hp: number;
  enemy_gauge_seconds: number;
  enemy_count: number;
  enemy_hp: number;
  min_damage: number;
  max_damage: number;
  mode: 'single' | 'progression';
  allowed_chords: string[];
  chord_progression?: string[];
  show_sheet_music: boolean;
  show_guide: boolean;
  simultaneous_monster_count?: number;
  monster_icon?: string;
  bgm_url?: string;
  mp3_url?: string;
  bpm?: number;
  measure_count?: number;
  time_signature?: number;
  count_in_measures?: number;
  chord_progression_data?: Array<{bar: number, beats: number, chord: string}>; // 新規: JSONタイミングデータ
}

export interface LessonContext {
  lessonId: string;
  lessonSongId: string; // lesson_songs.id（進捗記録用）
  clearConditions: ClearConditions;
  sourceType: 'song' | 'fantasy';
}

export interface LessonSong {
  id: string;
  lesson_id: string;
  song_id: string | null;
  fantasy_stage_id: string | null;
  is_fantasy: boolean;
  clear_conditions?: ClearConditions;
  created_at: string;
  songs?: Pick<Song, 'id' | 'title' | 'artist'>;
  fantasy_stage?: FantasyStage;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  assignment_description?: string;
  order_index: number;
  block_number?: number;
  created_at: string;
  updated_at: string;
  videos?: LessonVideo[];
  songs?: LessonSong[];
  lesson_songs?: LessonSong[];
}

export interface LessonVideo {
  id: string;
  lesson_id: string;
  bunny_video_id: string;
  order_index: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  lessons: Lesson[];
  order_index: number;
  premium_only?: boolean;
  min_rank?: 'free' | 'standard' | 'premium' | 'platinum';
  prerequisites?: CoursePrerequisite[];
}

export interface CoursePrerequisite {
  prerequisite_course_id: string;
  prerequisite_course: Course;
}

export interface Profile {
  id: string; // uuid
  updated_at?: string; // timestamp with time zone
  username?: string; // text
  avatar_url?: string; // text
  website?: string; // text
  nickname?: string; // text
  is_admin?: boolean; // boolean
  bio?: string; // text
  email?: string; // text
  twitter_handle?: string;
  next_season_xp_multiplier?: number;
  // Stripe subscription fields
  stripe_customer_id?: string;
  rank?: 'free' | 'standard' | 'premium' | 'platinum';
  will_cancel?: boolean;
  cancel_date?: string;
  downgrade_to?: 'free' | 'standard' | 'premium' | 'platinum';
  downgrade_date?: string;
  level?: number;
  xp?: number;
  selected_title?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  is_unlocked?: boolean;
  completion_date?: string;
  unlock_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RankingEntry {
  id: string;
  user_id: string;
  score: number;
  rank: number;
  song_id: string;
  created_at: string;
  updated_at: string;
  twitter_handle?: string;
}