/**
 * メインゲーム状態管理ストア (Zustand)
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  GameState,
  GameMode,
  InstrumentMode,
  SongMetadata,
  NoteData,
  GameScore,
  JudgmentResult,
  GameSettings,
  ScoreRank,
  ActiveNote,
  GameError
} from '@/types';
// GameEngine は実行時にのみ必要なため、型のみインポート
// import { GameEngine } from '@/utils/gameEngine';
// import type { GameEngineUpdate } from '@/utils/gameEngine';

// ===== 新機能: 設定プリセット =====
interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<GameSettings>;
  createdAt: number;
}

// ===== 新機能: 初期化状態管理 =====
interface InitializationState {
  isInitialized: boolean;
  hasAudioPermission: boolean;
  hasMidiPermission: boolean;
  gameEngineReady: boolean;
  errors: string[];
}

// ===== 新機能: セッション管理 =====
interface PlaySession {
  id: string;
  songId: string | null;
  startTime: number;
  endTime: number | null;
  score: GameScore;
  judgments: JudgmentResult[];
  settings: GameSettings;
}

// ===== 新機能: パフォーマンス監視 =====
interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  audioLatency: number;
  frameDrops: number;
  lastFrameTime: number;
  averageFrameTime: number;
  
  // ===== エフェクト関連の統計情報 =====
  effects: {
    /** 生成されたエフェクト総数 */
    totalGenerated: number;
    /** 成功したエフェクト数 */
    successCount: number;
    /** スキップされたエフェクト数（パフォーマンス制限等） */
    skippedCount: number;
    /** 近接チェックで拒否されたエフェクト数 */
    proximityRejectCount: number;
    /** ノーツ未発見で拒否されたエフェクト数 */
    noteNotFoundRejectCount: number;
    /** エフェクト処理の平均時間（ms） */
    averageProcessTime: number;
    /** 最後のエフェクト処理時間（ms） */
    lastProcessTime: number;
  };
}

// ===== デフォルト値 =====

const defaultScore: GameScore = {
  totalNotes: 0,
  goodCount: 0,
  missCount: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  score: 0,
  rank: 'D'
};

const defaultSettings: GameSettings = {
  // 音量設定
  masterVolume: 0.8,
  musicVolume: 0.7,
  midiVolume: 0.8,
  
  // ゲーム設定
  notesSpeed: 1.0,
  playbackSpeed: 1.0,
  instrumentMode: 'piano',
  inputMode: 'midi',
  
  // 判定設定
  allowOctaveError: false,
  noteOctaveShift: 0,
  
  // タイミング調整設定
  timingAdjustment: 0,
  
  // 表示設定
  showNoteNames: true,
  noteNameStyle: 'abc',
  noteAccidentalStyle: 'sharp',
  showFPS: false,
  
  // ビューポート設定
  viewportHeight: 600,
  pianoHeight: 160,
  
  // 入力デバイス
  selectedMidiDevice: null,
  selectedAudioDevice: null,
  
  // キー設定
  transpose: 0,
  
  // レイテンシ手動調整
  latencyAdjustment: 0,
  
  // 練習モードガイド
  practiceGuide: 'key',
  
  // ===== エフェクト設定 =====
  enableEffects: true,
  
  keyPressEffect: {
    enabled: true,
    proximityThreshold: 1.5, // ノート高さの1.5倍以内
    sizeMultiplier: 1.0,
    duration: 0.3
  },
  
  hitEffect: {
    enabled: true,
    sizeMultiplier: 1.0,
    duration: 0.3,
    opacity: 1.0
  },
  
  performanceMode: 'standard'
};

// ===== 新機能: デフォルトプリセット =====
const defaultPresets: SettingsPreset[] = [
  {
    id: 'beginner',
    name: '初心者設定',
    description: 'ゆっくりとした速度で練習に最適',
    settings: {
      notesSpeed: 0.7,
      playbackSpeed: 0.8,
      practiceGuide: 'key_auto',
      allowOctaveError: true,
      showNoteNames: true
    },
    createdAt: Date.now()
  },
  {
    id: 'intermediate',
    name: '中級者設定',
    description: '通常速度でのバランス取れた設定',
    settings: {
      notesSpeed: 1.0,
      playbackSpeed: 1.0,
      practiceGuide: 'key',
      allowOctaveError: false,
      showNoteNames: true
    },
    createdAt: Date.now()
  },
  {
    id: 'expert',
    name: '上級者設定',
    description: '高速・高精度でのチャレンジ向け',
    settings: {
      notesSpeed: 1.3,
      playbackSpeed: 1.1,
      practiceGuide: 'off',
      allowOctaveError: false,
      showNoteNames: false
    },
    createdAt: Date.now()
  }
];

const defaultInitialization: InitializationState = {
  isInitialized: false,
  hasAudioPermission: false,
  hasMidiPermission: false,
  gameEngineReady: false,
  errors: []
};

const defaultPerformanceMetrics: PerformanceMetrics = {
  fps: 60,
  renderTime: 0,
  audioLatency: 0,
  frameDrops: 0,
  lastFrameTime: 0,
  averageFrameTime: 16.67, // 60fps = 16.67ms per frame
  
  effects: {
    totalGenerated: 0,
    successCount: 0,
    skippedCount: 0,
    proximityRejectCount: 0,
    noteNotFoundRejectCount: 0,
    averageProcessTime: 0,
    lastProcessTime: 0
  }
};

const defaultState: GameState = {
  // ゲーム基本状態
  mode: 'practice',
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  
  // 楽曲情報
  currentSong: null,
  notes: [],
  activeNotes: new Set(),
  
  // ABリピート
  abRepeat: {
    enabled: false,
    startTime: null,
    endTime: null
  },
  
  // スコア情報
  score: defaultScore,
  judgmentHistory: [],
  
  // 設定
  settings: defaultSettings,
  
  // UI状態
  isSettingsOpen: false,
  currentTab: 'practice',
  /** リザルトモーダル表示 */
  resultModalOpen: false,
  
  // デバッグ情報
  debug: {
    fps: 60,
    renderTime: 0,
    audioLatency: 0
  },
};

// ===== 新機能: 設定検証・正規化関数 =====

const validateSettings = (settings: Partial<GameSettings>): { valid: boolean; errors: string[]; normalized: GameSettings } => {
  const errors: string[] = [];
  const normalized: GameSettings = { ...defaultSettings, ...settings };
  
  // 音量設定の検証
  if (normalized.masterVolume < 0 || normalized.masterVolume > 1) {
    errors.push('マスター音量は0-1の範囲で設定してください');
    normalized.masterVolume = Math.max(0, Math.min(1, normalized.masterVolume));
  }
  
  if (normalized.musicVolume < 0 || normalized.musicVolume > 1) {
    errors.push('音楽音量は0-1の範囲で設定してください');
    normalized.musicVolume = Math.max(0, Math.min(1, normalized.musicVolume));
  }
  
  if (normalized.midiVolume < 0 || normalized.midiVolume > 1) {
    errors.push('MIDI音量は0-1の範囲で設定してください');
    normalized.midiVolume = Math.max(0, Math.min(1, normalized.midiVolume));
  }
  
  // 速度設定の検証
  if (normalized.notesSpeed < 0.1 || normalized.notesSpeed > 4.0) {
    errors.push('ノート速度は0.1-4.0の範囲で設定してください');
    normalized.notesSpeed = Math.max(0.1, Math.min(4.0, normalized.notesSpeed));
  }
  
  if (normalized.playbackSpeed < 0.1 || normalized.playbackSpeed > 3.0) {
    errors.push('再生速度は0.1-3.0の範囲で設定してください');
    normalized.playbackSpeed = Math.max(0.1, Math.min(3.0, normalized.playbackSpeed));
  }
  
  // タイミング調整の検証
  if (normalized.timingAdjustment < -1000 || normalized.timingAdjustment > 1000) {
    errors.push('タイミング調整は-1000ms〜+1000msの範囲で設定してください');
    normalized.timingAdjustment = Math.max(-1000, Math.min(1000, normalized.timingAdjustment));
  }
  
  // 移調の検証
  if (normalized.transpose < -12 || normalized.transpose > 12) {
    errors.push('移調は-12〜+12半音の範囲で設定してください');
    normalized.transpose = Math.max(-12, Math.min(12, normalized.transpose));
  }
  
  // オクターブシフトの検証
  if (normalized.noteOctaveShift < -2 || normalized.noteOctaveShift > 2) {
    errors.push('オクターブシフトは-2〜+2オクターブの範囲で設定してください');
    normalized.noteOctaveShift = Math.max(-2, Math.min(2, normalized.noteOctaveShift));
  }
  
  // ビューポート設定の検証
  if (normalized.viewportHeight < 400 || normalized.viewportHeight > 1200) {
    errors.push('ビューポートの高さは400-1200pxの範囲で設定してください');
    normalized.viewportHeight = Math.max(400, Math.min(1200, normalized.viewportHeight));
  }
  
  if (normalized.pianoHeight < 80 || normalized.pianoHeight > 300) {
    errors.push('ピアノの高さは80-300pxの範囲で設定してください');
    normalized.pianoHeight = Math.max(80, Math.min(300, normalized.pianoHeight));
  }
  
  // ===== エフェクト設定の検証 =====
  if (normalized.keyPressEffect) {
    if (normalized.keyPressEffect.proximityThreshold < 0.5 || normalized.keyPressEffect.proximityThreshold > 5.0) {
      errors.push('キー押下エフェクトの近接閾値は0.5-5.0の範囲で設定してください');
      normalized.keyPressEffect.proximityThreshold = Math.max(0.5, Math.min(5.0, normalized.keyPressEffect.proximityThreshold));
    }
    
    if (normalized.keyPressEffect.sizeMultiplier < 0.1 || normalized.keyPressEffect.sizeMultiplier > 3.0) {
      errors.push('キー押下エフェクトのサイズ倍率は0.1-3.0の範囲で設定してください');
      normalized.keyPressEffect.sizeMultiplier = Math.max(0.1, Math.min(3.0, normalized.keyPressEffect.sizeMultiplier));
    }
    
    if (normalized.keyPressEffect.duration < 0.1 || normalized.keyPressEffect.duration > 2.0) {
      errors.push('キー押下エフェクトの持続時間は0.1-2.0秒の範囲で設定してください');
      normalized.keyPressEffect.duration = Math.max(0.1, Math.min(2.0, normalized.keyPressEffect.duration));
    }
  }
  
  if (normalized.hitEffect) {
    if (normalized.hitEffect.sizeMultiplier < 0.1 || normalized.hitEffect.sizeMultiplier > 3.0) {
      errors.push('ヒットエフェクトのサイズ倍率は0.1-3.0の範囲で設定してください');
      normalized.hitEffect.sizeMultiplier = Math.max(0.1, Math.min(3.0, normalized.hitEffect.sizeMultiplier));
    }
    
    if (normalized.hitEffect.duration < 0.1 || normalized.hitEffect.duration > 2.0) {
      errors.push('ヒットエフェクトの持続時間は0.1-2.0秒の範囲で設定してください');
      normalized.hitEffect.duration = Math.max(0.1, Math.min(2.0, normalized.hitEffect.duration));
    }
    
    if (normalized.hitEffect.opacity < 0.0 || normalized.hitEffect.opacity > 1.0) {
      errors.push('ヒットエフェクトの透明度は0.0-1.0の範囲で設定してください');
      normalized.hitEffect.opacity = Math.max(0.0, Math.min(1.0, normalized.hitEffect.opacity));
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    normalized
  };
};

// ===== 新機能: 状態遷移バリデーション =====

const validateStateTransition = (currentState: GameState, action: string, params?: any): { valid: boolean; error?: string } => {
  switch (action) {
    case 'play':
      if (!currentState.currentSong || currentState.notes.length === 0) {
        return { valid: false, error: '楽曲が読み込まれていません' };
      }
      break;
      
    case 'seek':
      if (!currentState.currentSong) {
        return { valid: false, error: '楽曲が読み込まれていません' };
      }
      if (params.time < 0 || params.time > (currentState.currentSong.duration || 0)) {
        return { valid: false, error: '無効なシーク位置です' };
      }
      break;
      
    case 'setABRepeatStart':
      if (currentState.abRepeat.endTime !== null && params.time >= currentState.abRepeat.endTime) {
        return { valid: false, error: 'ABリピート開始位置は終了位置より前に設定してください' };
      }
      break;
      
    case 'setABRepeatEnd':
      if (currentState.abRepeat.startTime !== null && params.time <= currentState.abRepeat.startTime) {
        return { valid: false, error: 'ABリピート終了位置は開始位置より後に設定してください' };
      }
      break;
      
    case 'updateSettings':
      const validation = validateSettings(params.settings);
      if (!validation.valid) {
        return { valid: false, error: validation.errors.join(', ') };
      }
      break;
  }
  
  return { valid: true };
};

// ===== ストア定義 =====

interface GameStoreState extends GameState {
  // Phase 2: ゲームエンジン統合
  gameEngine: any | null; // GameEngine型は動的インポートで使用
  engineActiveNotes: ActiveNote[];
  
  // 練習モードガイド: キーハイライト情報
  lastKeyHighlight?: {
    pitch: number;
    timestamp: number;
  };
  
  // ===== 新機能: 拡張状態管理 =====
  
  // 初期化状態
  initialization: InitializationState;
  
  // 設定プリセット
  settingsPresets: SettingsPreset[];
  
  // セッション管理
  currentSession: PlaySession | null;
  sessionHistory: PlaySession[];
  
  // パフォーマンス監視
  performance: PerformanceMetrics;
  
  // エラー状態管理強化
  errors: {
    settings: string[];
    gameEngine: string[];
    audio: string[];
    midi: string[];
    general: string[];
  };
  
  // アクション
  setMode: (mode: GameMode) => void;
  setInstrumentMode: (mode: InstrumentMode) => void;
  
  // 楽曲制御
  loadSong: (song: SongMetadata, notes: NoteData[]) => void;
  clearSong: () => void;
  
  // 再生制御
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  updateTime: (time: number) => void;
  
  // 新規追加: 時間制御とループ機能
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
  
  // ABリピート制御
  setABRepeatStart: (time?: number) => void;
  setABRepeatEnd: (time?: number) => void;
  clearABRepeat: () => void;
  clearABRepeatStart: () => void;
  clearABRepeatEnd: () => void;
  toggleABRepeat: () => void;
  
  // 新規追加: 移調制御
  transpose: (semitones: number) => void;
  setTranspose: (semitones: number) => void;
  
  // Phase 2: ゲームエンジン制御
  initializeGameEngine: () => void;
  destroyGameEngine: () => void;
  handleNoteInput: (inputNote: number) => void;
  updateEngineSettings: () => void;
  
  // ノーツ管理
  addActiveNote: (noteId: string) => void;
  removeActiveNote: (noteId: string) => void;
  clearActiveNotes: () => void;
  
  // 採点
  addJudgment: (judgment: JudgmentResult) => void;
  resetScore: () => void;
  calculateFinalScore: () => void;
  
  // 設定（強化版）
  updateSettings: (settings: Partial<GameSettings>) => void;
  updateSettingsSafe: (settings: Partial<GameSettings>) => { success: boolean; errors: string[] };
  resetSettings: () => void;
  
  // ===== 新機能: 設定プリセット管理 =====
  applySettingsPreset: (presetId: string) => void;
  saveSettingsPreset: (name: string, description: string, settings?: Partial<GameSettings>) => void;
  deleteSettingsPreset: (presetId: string) => void;
  updateSettingsPreset: (presetId: string, updates: Partial<SettingsPreset>) => void;
  
  // ===== 新機能: 初期化状態管理 =====
  setInitializationState: (updates: Partial<InitializationState>) => void;
  addInitializationError: (error: string) => void;
  clearInitializationErrors: () => void;
  
  // ===== 新機能: セッション管理 =====
  startPlaySession: () => void;
  endPlaySession: () => void;
  saveCurrentSession: () => void;
  loadSessionFromHistory: (sessionId: string) => void;
  clearSessionHistory: () => void;
  
  // ===== 新機能: パフォーマンス監視 =====
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  recordFrameTime: (frameTime: number) => void;
  incrementFrameDrops: () => void;
  resetPerformanceMetrics: () => void;
  
  // ===== 新機能: エフェクト統計管理 =====
  recordEffectGenerated: () => void;
  recordEffectSuccess: (processTime: number) => void;
  recordEffectSkipped: (reason: 'performance' | 'proximity' | 'note_not_found') => void;
  resetEffectStats: () => void;
  getEffectStats: () => PerformanceMetrics['effects'];
  
  // ===== 新機能: エラー管理強化 =====
  addError: (category: keyof GameStoreState['errors'], error: string) => void;
  clearErrors: (category?: keyof GameStoreState['errors']) => void;
  hasErrors: () => boolean;
  getErrorSummary: () => string[];
  
  // UI制御
  setCurrentTab: (tab: 'practice' | 'performance' | 'songs') => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  // デバッグ
  updateDebugInfo: (info: Partial<GameState['debug']>) => void;
  
  // エラーハンドリング（既存）
  handleError: (error: GameError) => void;
  
  // リセット
  resetGame: () => void;
  
  // 練習モードガイド制御
  setLastKeyHighlight: (pitch: number, timestamp: number) => void;
  clearLastKeyHighlight: () => void;
  
  // リザルトモーダル
  openResultModal: () => void;
  closeResultModal: () => void;
}

// ===== ヘルパー関数 =====

const calculateAccuracy = (goodCount: number, totalNotes: number): number => {
  if (totalNotes === 0) return 0;
  return goodCount / totalNotes;
};

const calculateRank = (accuracy: number): ScoreRank => {
  if (accuracy >= 0.95) return 'S';
  if (accuracy >= 0.85) return 'A';
  if (accuracy >= 0.70) return 'B';
  if (accuracy >= 0.50) return 'C';
  return 'D';
};

const calculateScore = (goodCount: number, _maxCombo: number, _accuracy: number): number => {
  // GOOD 1 回あたり 1000 点、MISS は 0 点
  return goodCount * 1000;
};

// ===== ストア作成 =====

export const useGameStore = createWithEqualityFn<GameStoreState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...defaultState,
        
        // Phase 2: ゲームエンジン
        gameEngine: null,
        engineActiveNotes: [],
        lastKeyHighlight: undefined,
        
        // Phase 2: ゲームエンジン制御
        initializeGameEngine: async () => {
          const state = get();
          const { GameEngine } = await import('@/utils/gameEngine');
          const engine = new GameEngine({ ...state.settings });
          
          // エンジンの更新コールバック設定
          engine.setUpdateCallback((data: any) => {
            set((state) => {
              // currentTime は AudioContext 同期ループで更新する
              state.engineActiveNotes = data.activeNotes;
              
              // キーハイライト処理はPIXIRenderer側で直接実行されるため、ストア経由の処理は不要
              
              // ===== ABリピート自動ループ =====
              const { abRepeat } = state;
              if (abRepeat.enabled && abRepeat.startTime !== null && abRepeat.endTime !== null) {
                if (state.currentTime >= abRepeat.endTime) {
                  console.log(`🔄 ABリピート(Store): ${state.currentTime.toFixed(2)}s → ${abRepeat.startTime.toFixed(2)}s`);
                  // 🔧 修正: get()の代わりにuseGameStore.getState()を使用
                  const seekTime = abRepeat.startTime;
                  setTimeout(() => {
                    const store = useGameStore.getState();
                    store.seek(seekTime);
                  }, 0);
                }
              }
              
              // デバッグ情報更新（オプション）
              if (state.settings.showFPS) {
                state.debug.renderTime = performance.now() % 1000;
              }
            });
          });
          
          // 判定イベントコールバック登録
          engine.setJudgmentCallback((judgment) => {
            set((state) => {
              // スコア・コンボ管理
              if (judgment.type === 'good') {
                state.score.goodCount += 1;
                state.score.combo += 1;
                state.score.maxCombo = Math.max(state.score.maxCombo, state.score.combo);

                // 成功ノートをアクティブセットに追加
                state.activeNotes.add(judgment.noteId);
              } else {
                state.score.missCount += 1;
                state.score.combo = 0;
              }

              const totalJudged = state.score.goodCount + state.score.missCount;
              state.score.accuracy = totalJudged > 0 ? state.score.goodCount / totalJudged : 0;
              state.score.score = state.score.goodCount * 1000;
              state.score.rank = calculateRank(state.score.accuracy);

              // 履歴保存
              state.judgmentHistory.push(judgment);
            });
          });
          
          set((state) => {
            state.gameEngine = engine;
            
            // 既存の楽曲がある場合はロード
            if (state.notes.length > 0) {
              engine.loadSong(state.notes);
            }
          });
        },
        
        destroyGameEngine: () => set((state) => {
          if (state.gameEngine) {
            state.gameEngine.destroy();
            state.gameEngine = null;
            state.engineActiveNotes = [];
          }
        }),
        
        handleNoteInput: (inputNote) => {
          const state = get();
          if (!state.gameEngine || !state.isPlaying) return;
          
          const hit = state.gameEngine.handleInput(inputNote);
          if (hit) {
            // エンジンに判定を任せ、コールバックで結果を受け取る
            state.gameEngine.processHit(hit);
          }
        },
        
        updateEngineSettings: () => {
          const { gameEngine, settings } = get();
          if (gameEngine) {
            gameEngine.updateSettings({ ...settings });
          }
        },
        
        // 楽曲制御
        loadSong: (song, notes) => set((state) => {
          state.currentSong = song;
          state.notes = notes;
          state.currentTime = 0;
          state.isPlaying = false;
          state.isPaused = false;
          
          // スコアリセット
          state.score = { 
            ...defaultScore, 
            totalNotes: notes.length 
          };
          state.judgmentHistory = [];
          state.activeNotes.clear();
          
          // ABリピートクリア
          state.abRepeat = {
            enabled: false,
            startTime: null,
            endTime: null
          };
          
          // GameEngineに楽曲ロード
          if (state.gameEngine) {
            state.gameEngine.loadSong(notes);
            console.log(`🎵 GameEngine に楽曲ロード: ${notes.length}ノーツ`);
          }
        }),
        
        clearSong: () => set((state) => {
          state.currentSong = null;
          state.notes = [];
          state.currentTime = 0;
          state.isPlaying = false;
          state.isPaused = false;
          state.score = defaultScore;
          state.judgmentHistory = [];
          state.activeNotes.clear();
          state.abRepeat = {
            enabled: false,
            startTime: null,
            endTime: null
          };
        }),
        
        // 再生制御
        play: () => set((state) => {
          state.isPlaying = true;
          state.isPaused = false;
        }),
        
        pause: () => set((state) => {
          state.isPlaying = false;
          state.isPaused = true;
        }),
        
        stop: () => set((state) => {
          state.isPlaying = false;
          state.isPaused = false;
          state.currentTime = 0;
          state.activeNotes.clear();
          
          // GameEngineも停止
          if (state.gameEngine) {
            state.gameEngine.stop();
          }
        }),
        
        seek: (time) => {
          const state = get();
          const newTime = Math.max(0, Math.min(time, state.currentSong?.duration || time));
          
          set((state) => {
            state.currentTime = newTime;
            state.activeNotes.clear();
          });
          
          // GameEngineにもシーク処理を伝達
          if (state.gameEngine) {
            state.gameEngine.seek(newTime);
            console.log(`🎮 GameEngine seek to ${newTime.toFixed(2)}s`);
          }
          
          // 🔧 追加: 再生中の音声を即座にシーク
          // グローバルにアクセス可能な音声要素とbaseOffsetRefを更新
          if (state.isPlaying && (window as any).__gameAudioRef) {
            const audioRef = (window as any).__gameAudioRef;
            const audioContextRef = (window as any).__gameAudioContextRef;
            const baseOffsetRef = (window as any).__gameBaseOffsetRef;
            const settings = state.settings;
            
            if (audioRef.current && audioContextRef.current && baseOffsetRef) {
              // 音声を即座にシーク
              audioRef.current.currentTime = newTime;
              
              // baseOffsetRefを再計算（再生速度を考慮）
              const realTimeElapsed = newTime / settings.playbackSpeed;
              baseOffsetRef.current = audioContextRef.current.currentTime - realTimeElapsed;
              
              console.log(`🎵 Audio seek to ${newTime.toFixed(2)}s (再生中)`);
            }
          }
        },
        
        updateTime: (time) => set((state) => {
          state.currentTime = time;
        }),
        
        // ABリピート制御
        setABRepeatStart: (time) => set((state) => {
          const currentTime = time ?? state.currentTime;
          state.abRepeat.startTime = currentTime;
          
          // 終了時間が開始時間より前の場合はクリア
          if (state.abRepeat.endTime !== null && state.abRepeat.endTime <= currentTime) {
            state.abRepeat.endTime = null;
          }
        }),
        
        setABRepeatEnd: (time) => set((state) => {
          const currentTime = time ?? state.currentTime;
          
          // 開始時間が設定されていない、または開始時間より後の場合のみ設定
          if (state.abRepeat.startTime !== null && currentTime > state.abRepeat.startTime) {
            state.abRepeat.endTime = currentTime;
          }
        }),
        
        clearABRepeat: () => set((state) => {
          state.abRepeat = {
            enabled: false,
            startTime: null,
            endTime: null
          };
        }),

        // A地点のみクリア
        clearABRepeatStart: () => set((state) => {
          state.abRepeat.startTime = null;
          // A地点がクリアされたらループも無効化
          state.abRepeat.enabled = false;
        }),

        // B地点のみクリア
        clearABRepeatEnd: () => set((state) => {
          state.abRepeat.endTime = null;
          // B地点がクリアされたらループも無効化
          state.abRepeat.enabled = false;
        }),
        
        toggleABRepeat: () => set((state) => {
          if (state.abRepeat.startTime !== null && state.abRepeat.endTime !== null) {
            state.abRepeat.enabled = !state.abRepeat.enabled;
          }
        }),
        
        // ノーツ管理
        addActiveNote: (noteId) => set((state) => {
          state.activeNotes.add(noteId);
        }),
        
        removeActiveNote: (noteId) => set((state) => {
          state.activeNotes.delete(noteId);
        }),
        
        clearActiveNotes: () => set((state) => {
          state.activeNotes.clear();
        }),
        
        // 採点
        addJudgment: (judgment) => set((state) => {
          state.judgmentHistory.push(judgment);
          
          // スコア更新
          if (judgment.type === 'good') {
            state.score.goodCount++;
            state.score.combo++;
            state.score.maxCombo = Math.max(state.score.maxCombo, state.score.combo);
          } else {
            state.score.missCount++;
            state.score.combo = 0;
          }
          
          // 精度とスコア計算
          const totalJudged = state.score.goodCount + state.score.missCount;
          state.score.accuracy = calculateAccuracy(state.score.goodCount, totalJudged);
          state.score.score = calculateScore(state.score.goodCount, state.score.maxCombo, state.score.accuracy);
          state.score.rank = calculateRank(state.score.accuracy);
        }),
        
        resetScore: () => set((state) => {
          const totalNotes = state.score.totalNotes;
          state.score = { ...defaultScore, totalNotes };
          state.judgmentHistory = [];
        }),
        
        calculateFinalScore: () => set((state) => {
          const { goodCount, maxCombo } = state.score;
          const totalNotes = state.notes.length;
          
          // 未判定のノーツをMissとして計算
          const missCount = totalNotes - goodCount;
          const accuracy = calculateAccuracy(goodCount, totalNotes);
          const score = calculateScore(goodCount, maxCombo, accuracy);
          const rank = calculateRank(accuracy);
          
          state.score = {
            totalNotes,
            goodCount,
            missCount,
            combo: 0, // 最終スコア時はコンボリセット
            maxCombo,
            accuracy,
            score,
            rank
          };
        }),
        
        // 設定
        updateSettings: (newSettings) => {
          // まず Immer の set でストアの設定値を更新
          set((state) => {
            Object.assign(state.settings, newSettings);
          });

          // set の外側で最新の設定値を取得し、GameEngine へ反映
          const { gameEngine, settings } = get();
          if (gameEngine) {
            // Proxy（Immer Draft）が revoke されるのを防ぐため、プレーンオブジェクトを渡す
            gameEngine.updateSettings({ ...settings });
          }
        },
        
        resetSettings: () => set((state) => {
          state.settings = { ...defaultSettings };
        }),
        
        // モード制御
        setMode: (mode) => set((state) => {
          state.mode = mode;
          // モード変更時にタブも同期
          if (mode === 'practice') {
            state.currentTab = 'practice';
          } else if (mode === 'performance') {
            state.currentTab = 'performance';
          }
          
          // モード切り替え時に再生停止するが、時刻はリセットしない
          state.isPlaying = false;
          state.isPaused = false;
          // 時刻とアクティブノーツを完全リセット
          state.currentTime = 0;
          state.activeNotes.clear();
          
          // GameEngine 側にもシークを伝達
          if (state.gameEngine) {
            state.gameEngine.seek(0);
          }
          
          // スコアリセット
          const totalNotes = state.score.totalNotes;
          state.score = { ...defaultScore, totalNotes };
          state.judgmentHistory = [];
          
          console.log(`🔄 モード切り替え: ${mode} - 再生停止・リセット完了`);
        }),
        
        setInstrumentMode: (mode) => set((state) => {
          state.settings.instrumentMode = mode;
        }),
        
        // UI制御
        setCurrentTab: (tab) => set((state) => {
          const previousTab = state.currentTab;
          state.currentTab = tab;
          
          // タブ変更時にゲームモードも同期
          if (tab === 'practice') {
            state.mode = 'practice';
          } else if (tab === 'performance') {
            state.mode = 'performance';
          }
          
          // 練習・本番モード間の切り替え時は再生停止するが、時刻はリセットしない
          if ((previousTab === 'practice' && tab === 'performance') || 
              (previousTab === 'performance' && tab === 'practice')) {
            state.isPlaying = false;
            state.isPaused = false;
            // 時刻とアクティブノーツを完全リセット
            state.currentTime = 0;
            state.activeNotes.clear();
            
            // GameEngine 側にもシークを伝達
            if (state.gameEngine) {
              state.gameEngine.seek(0);
            }
            
            // スコアリセット
            const totalNotes = state.score.totalNotes;
            state.score = { ...defaultScore, totalNotes };
            state.judgmentHistory = [];
            
            console.log(`🔄 タブ切り替え: ${previousTab} → ${tab} - 再生停止・リセット完了`);
          }
        }),
        
        toggleSettings: () => set((state) => {
          state.isSettingsOpen = !state.isSettingsOpen;
        }),
        
        setSettingsOpen: (open) => set((state) => {
          state.isSettingsOpen = open;
        }),
        
        // デバッグ
        updateDebugInfo: (info) => set((state) => {
          Object.assign(state.debug, info);
        }),
        
        // エラーハンドリング
        handleError: (error) => {
          console.error('Game Error:', error);
          // エラーログ記録やユーザー通知の実装
          // 必要に応じてゲーム状態のリセットなど
        },
        
        // リセット
        resetGame: () => set(() => ({ ...defaultState })),
        
        // 新規追加: 時間制御とループ機能
        skipForward: (seconds: number) => {
          const state = get();
          const maxTime = state.currentSong?.duration || 0;
          const newTime = Math.min(state.currentTime + seconds, maxTime);
          
          // seekメソッドを再利用（音声シーク処理も含まれる）
          state.seek(newTime);
          console.log(`⏩ Skip forward to ${newTime.toFixed(2)}s`);
        },
        
        skipBackward: (seconds: number) => {
          const state = get();
          const newTime = Math.max(0, state.currentTime - seconds);
          
          // seekメソッドを再利用（音声シーク処理も含まれる）
          state.seek(newTime);
          console.log(`⏪ Skip backward to ${newTime.toFixed(2)}s`);
        },
        
        // 新規追加: 移調制御
        transpose: (semitones: number) => {
          // まず現在の値を取得して範囲内にクランプ
          const { settings, updateEngineSettings } = get();
          const next = Math.max(-6, Math.min(6, settings.transpose + semitones));

          set((state) => {
            state.settings.transpose = next;
          });

          // GameEngine へ即時反映
          updateEngineSettings();
        },

        setTranspose: (semitones: number) => {
          const { updateEngineSettings } = get();
          const clamped = Math.max(-6, Math.min(6, semitones));
          set((state) => {
            state.settings.transpose = clamped;
          });
          updateEngineSettings();
        },
        
        // 練習モードガイド制御
        setLastKeyHighlight: (pitch: number, timestamp: number) => set((state) => {
          state.lastKeyHighlight = { pitch, timestamp };
        }),
        clearLastKeyHighlight: () => set((state) => {
          state.lastKeyHighlight = undefined;
        }),
        
        // ===== 新機能: 拡張状態管理 =====
        
        // 初期化状態
        initialization: defaultInitialization,
        
        // 設定プリセット
        settingsPresets: defaultPresets,
        
        // セッション管理
        currentSession: null,
        sessionHistory: [],
        
        // パフォーマンス監視
        performance: defaultPerformanceMetrics,
        
        // エラー状態管理強化
        errors: {
          settings: [],
          gameEngine: [],
          audio: [],
          midi: [],
          general: [],
        },
        
        // 設定（強化版）
        updateSettingsSafe: (settings) => {
          const state = get();
          const validation = validateStateTransition(state, 'updateSettings', { settings });
          
          if (!validation.valid) {
            set((draft) => {
              draft.errors.settings.push(validation.error || '設定の更新に失敗しました');
            });
            return { success: false, errors: [validation.error || '設定の更新に失敗しました'] };
          }
          
          const settingsValidation = validateSettings(settings);
          
          if (!settingsValidation.valid) {
            set((draft) => {
              draft.errors.settings.push(...settingsValidation.errors);
            });
            return { success: false, errors: settingsValidation.errors };
          }
          
          // 設定を正規化して適用
          set((state) => {
            state.settings = { ...state.settings, ...settingsValidation.normalized };
            // ゲームエンジンにも反映
            if (state.gameEngine) {
              state.gameEngine.updateSettings(state.settings);
            }
          });
          
          return { success: true, errors: [] };
        },
        
        // ===== 新機能: 設定プリセット管理 =====
        applySettingsPreset: (presetId) => set((state) => {
          const preset = state.settingsPresets.find(p => p.id === presetId);
          if (!preset) {
            state.errors.settings.push(`プリセット '${presetId}' が見つかりません`);
            return;
          }
          
          const validation = validateSettings(preset.settings);
          state.settings = { ...state.settings, ...validation.normalized };
          
          if (state.gameEngine) {
            state.gameEngine.updateSettings(state.settings);
          }
        }),
        
        saveSettingsPreset: (name, description, settings) => set((state) => {
          const presetSettings = settings || state.settings;
          const newPreset: SettingsPreset = {
            id: `preset-${Date.now()}`,
            name,
            description,
            settings: presetSettings,
            createdAt: Date.now()
          };
          state.settingsPresets.push(newPreset);
        }),
        
        deleteSettingsPreset: (presetId) => set((state) => {
          const index = state.settingsPresets.findIndex(p => p.id === presetId);
          if (index !== -1) {
            state.settingsPresets.splice(index, 1);
          }
        }),
        
        updateSettingsPreset: (presetId, updates) => set((state) => {
          const preset = state.settingsPresets.find(p => p.id === presetId);
          if (preset) {
            Object.assign(preset, updates);
          }
        }),
        
        // ===== 新機能: 初期化状態管理 =====
        setInitializationState: (updates) => set((state) => {
          Object.assign(state.initialization, updates);
        }),
        
        addInitializationError: (error) => set((state) => {
          state.initialization.errors.push(error);
        }),
        
        clearInitializationErrors: () => set((state) => {
          state.initialization.errors = [];
        }),
        
        // ===== 新機能: セッション管理 =====
        startPlaySession: () => set((state) => {
          const session: PlaySession = {
            id: `session-${Date.now()}`,
            songId: state.currentSong?.id || null,
            startTime: Date.now(),
            endTime: null,
            score: { ...state.score },
            judgments: [],
            settings: { ...state.settings }
          };
          state.currentSession = session;
        }),
        
        endPlaySession: () => set((state) => {
          if (state.currentSession) {
            state.currentSession.endTime = Date.now();
            state.currentSession.score = { ...state.score };
            state.currentSession.judgments = [...state.judgmentHistory];
          }
        }),
        
        saveCurrentSession: () => set((state) => {
          if (state.currentSession) {
            state.sessionHistory.push({ ...state.currentSession });
            state.currentSession = null;
          }
        }),
        
        loadSessionFromHistory: (sessionId) => set((state) => {
          const session = state.sessionHistory.find(s => s.id === sessionId);
          if (session) {
            state.score = { ...session.score };
            state.judgmentHistory = [...session.judgments];
            state.settings = { ...session.settings };
          }
        }),
        
        clearSessionHistory: () => set((state) => {
          state.sessionHistory = [];
        }),
        
        // ===== 新機能: パフォーマンス監視 =====
        updatePerformanceMetrics: (metrics) => set((state) => {
          Object.assign(state.performance, metrics);
        }),
        
        recordFrameTime: (frameTime) => set((state) => {
          state.performance.lastFrameTime = frameTime;
          // 移動平均を計算
          state.performance.averageFrameTime = 
            (state.performance.averageFrameTime * 0.9) + (frameTime * 0.1);
          // FPS計算
          state.performance.fps = Math.round(1000 / state.performance.averageFrameTime);
          
          // フレームドロップ検出（33ms = 30fps以下）
          if (frameTime > 33) {
            state.performance.frameDrops++;
          }
        }),
        
        incrementFrameDrops: () => set((state) => {
          state.performance.frameDrops++;
        }),
        
        resetPerformanceMetrics: () => set((state) => {
          state.performance = { ...defaultPerformanceMetrics };
        }),
        
        // ===== 新機能: エフェクト統計管理 =====
        recordEffectGenerated: () => set((state) => {
          state.performance.effects.totalGenerated++;
        }),
        
        recordEffectSuccess: (processTime: number) => set((state) => {
          state.performance.effects.successCount++;
          state.performance.effects.lastProcessTime = processTime;
          // 移動平均で平均処理時間を更新
          const currentAvg = state.performance.effects.averageProcessTime;
          state.performance.effects.averageProcessTime = 
            currentAvg === 0 ? processTime : (currentAvg * 0.9) + (processTime * 0.1);
        }),
        
        recordEffectSkipped: (reason: 'performance' | 'proximity' | 'note_not_found') => set((state) => {
          state.performance.effects.skippedCount++;
          switch (reason) {
            case 'proximity':
              state.performance.effects.proximityRejectCount++;
              break;
            case 'note_not_found':
              state.performance.effects.noteNotFoundRejectCount++;
              break;
            // 'performance' はカウンターなし（skippedCountに含まれる）
          }
        }),
        
        resetEffectStats: () => set((state) => {
          state.performance.effects = {
            totalGenerated: 0,
            successCount: 0,
            skippedCount: 0,
            proximityRejectCount: 0,
            noteNotFoundRejectCount: 0,
            averageProcessTime: 0,
            lastProcessTime: 0
          };
        }),
        
        getEffectStats: () => {
          const state = get();
          return state.performance.effects;
        },
        
        // ===== 新機能: エラー管理強化 =====
        addError: (category, error) => set((state) => {
          state.errors[category].push(error);
        }),
        
        clearErrors: (category) => set((state) => {
          if (category) {
            state.errors[category] = [];
          } else {
            Object.keys(state.errors).forEach(key => {
              state.errors[key as keyof typeof state.errors] = [];
            });
          }
        }),
        
        hasErrors: () => {
          const state = get();
          return Object.values(state.errors).some(errors => errors.length > 0);
        },
        
        getErrorSummary: () => {
          const state = get();
          const summary: string[] = [];
          Object.entries(state.errors).forEach(([category, errors]) => {
            if (errors.length > 0) {
              summary.push(`${category}: ${errors.length}件のエラー`);
            }
          });
          return summary;
        },
        
        // リザルトモーダル
        openResultModal: () => set((state) => { state.resultModalOpen = true; }),
        closeResultModal: () => set((state) => { state.resultModalOpen = false; }),
      }))
    ),
    {
      name: 'jazz-game-store'
    }
  )
);

// ===== セレクタ =====

export const useCurrentTime = () => useGameStore((state) => state.currentTime);
export const useIsPlaying = () => useGameStore((state) => state.isPlaying);
export const useCurrentSong = () => useGameStore((state) => state.currentSong);
export const useGameMode = () => useGameStore((state) => state.mode);
export const useInstrumentMode = () => useGameStore((state) => state.settings.instrumentMode);
export const useGameScore = () => useGameStore((state) => state.score);
export const useActiveNotes = () => useGameStore((state) => state.activeNotes);
export const useABRepeat = () => useGameStore((state) => state.abRepeat);
export const useSettings = () => useGameStore((state) => state.settings);

// 複合セレクタ - 再生可能状態
export const useCanPlay = () => useGameStore((state) => 
  state.currentSong !== null && state.notes.length > 0 && !state.isPlaying
);

export const useABRepeatActive = () => useGameStore((state) => 
  state.abRepeat.enabled && 
  state.abRepeat.startTime !== null && 
  state.abRepeat.endTime !== null
);

// 現在の時間がABリピート範囲内かどうか
export const useIsInABRange = () => useGameStore((state) => {
  const { currentTime, abRepeat } = state;
  if (!abRepeat.enabled || abRepeat.startTime === null || abRepeat.endTime === null) {
    return false;
  }
  return currentTime >= abRepeat.startTime && currentTime <= abRepeat.endTime;
});

// ===== 新機能: 拡張セレクタ =====

// 初期化状態関連
export const useInitializationState = () => useGameStore((state) => state.initialization);
export const useIsInitialized = () => useGameStore((state) => state.initialization.isInitialized);
export const useHasAudioPermission = () => useGameStore((state) => state.initialization.hasAudioPermission);
export const useHasMidiPermission = () => useGameStore((state) => state.initialization.hasMidiPermission);
export const useIsGameEngineReady = () => useGameStore((state) => state.initialization.gameEngineReady);
export const useInitializationErrors = () => useGameStore((state) => state.initialization.errors);

// 設定プリセット関連
export const useSettingsPresets = () => useGameStore((state) => state.settingsPresets);
export const useSettingsPreset = (presetId: string) => useGameStore((state) => 
  state.settingsPresets.find(p => p.id === presetId)
);

// セッション関連
export const useCurrentSession = () => useGameStore((state) => state.currentSession);
export const useSessionHistory = () => useGameStore((state) => state.sessionHistory);
export const useIsSessionActive = () => useGameStore((state) => state.currentSession !== null);

// パフォーマンス監視関連
export const usePerformanceMetrics = () => useGameStore((state) => state.performance);
export const useFPS = () => useGameStore((state) => state.performance.fps);
export const useFrameDrops = () => useGameStore((state) => state.performance.frameDrops);
export const useAverageFrameTime = () => useGameStore((state) => state.performance.averageFrameTime);
export const useIsPerformanceGood = () => useGameStore((state) => 
  state.performance.fps >= 55 && state.performance.frameDrops < 10
);

// エラー関連
export const useErrors = () => useGameStore((state) => state.errors);
export const useHasErrors = () => useGameStore((state) => state.hasErrors());
export const useErrorSummary = () => useGameStore((state) => state.getErrorSummary());
export const useSettingsErrors = () => useGameStore((state) => state.errors.settings);
export const useGameEngineErrors = () => useGameStore((state) => state.errors.gameEngine);
export const useAudioErrors = () => useGameStore((state) => state.errors.audio);
export const useMidiErrors = () => useGameStore((state) => state.errors.midi);

// 複合状態セレクタ
export const useGameReadyState = () => useGameStore((state) => ({
  isInitialized: state.initialization.isInitialized,
  hasAudioPermission: state.initialization.hasAudioPermission,
  hasMidiPermission: state.initialization.hasMidiPermission,
  gameEngineReady: state.initialization.gameEngineReady,
  hasSong: state.currentSong !== null,
  hasNotes: state.notes.length > 0,
  hasErrors: state.hasErrors()
}));

export const usePlaybackState = () => useGameStore((state) => ({
  isPlaying: state.isPlaying,
  isPaused: state.isPaused,
  currentTime: state.currentTime,
  canPlay: state.currentSong !== null && state.notes.length > 0 && !state.isPlaying,
  canPause: state.isPlaying,
  canResume: state.isPaused
}));

export const useSettingsValidation = () => {
  const updateSettingsSafe = useGameStore((state) => state.updateSettingsSafe);
  const clearErrors = useGameStore((state) => state.clearErrors);
  
  return {
    updateSettingsSafe,
    clearSettingsErrors: () => clearErrors('settings')
  };
};

// ===== エフェクト統計関連フック =====
export const useEffectStats = () => useGameStore((state) => state.performance.effects);
export const useEffectSuccessRate = () => useGameStore((state) => {
  const effects = state.performance.effects;
  return effects.totalGenerated > 0 ? effects.successCount / effects.totalGenerated : 0;
});
export const useEffectPerformance = () => useGameStore((state) => ({
  averageProcessTime: state.performance.effects.averageProcessTime,
  lastProcessTime: state.performance.effects.lastProcessTime,
  isPerformanceGood: state.performance.effects.averageProcessTime < 2.0 // 2ms以内が良好
}));

