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
  GameError,
  ChordInfo,
  ClearConditions
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
  soundEffectVolume: 0.8, // ファンタジーモード効果音音量
  bgmVolume: 0.7, // ファンタジーモードBGM音量
  
  // ファンタジーモード設定
  playRootSound: true,
  rootSoundVolume: 0.5, // ← 50 %
  
  // ゲーム設定
  notesSpeed: 1.0,
  playbackSpeed: 1.0,
  instrumentMode: 'piano',
  
  // 判定設定
  allowOctaveError: false,
  noteOctaveShift: 0,
  
  // タイミング調整設定
  timingAdjustment: 0,
  
  // 表示設定
  showNoteNames: true,
  noteNameStyle: 'abc',
  simpleDisplayMode: false,  // 新しい簡易表示モード設定を追加
  showSheetMusic: true,  // 楽譜表示のオン/オフ設定を追加
  sheetMusicChordsOnly: false,
  
  showFPS: false,
  showSeekbar: true,  // デフォルトでシークバーを表示
  showHeader: true,  // ヘッダー表示のオン/オフ設定を追加
  
  // ビューポート設定
  viewportHeight: 600,
  pianoHeight: 80,  // ピアノの高さをさらに調整（100から80に減少）
  
  // 入力デバイス
  selectedMidiDevice: null,
  
  // キー設定
  transpose: 0,
  
  // 移調楽器設定
  transposingInstrument: 'concert_pitch',
  
  // レイテンシ手動調整
  latencyAdjustment: 0,
  
  // 練習モードガイド
  practiceGuide: 'key',
  
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
  rawNotes: [],
  musicXml: null,
  chords: [],
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
  
  // レッスン情報
  lessonContext: undefined,
  
  // ミッション情報
  missionContext: undefined,
};

// 練習モード専用設定のデフォルト値
const defaultPracticeModeSettings = {
  practiceGuide: 'key' as const
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
  
  if (normalized.bgmVolume < 0 || normalized.bgmVolume > 1) {
    errors.push('BGM音量は0-1の範囲で設定してください');
    normalized.bgmVolume = Math.max(0, Math.min(1, normalized.bgmVolume));
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
      
    case 'updateSettings': {
      const validation = validateSettings(params.settings);
      if (!validation.valid) {
        return { valid: false, error: validation.errors.join(', ') };
      }
      break;
    }
  }
  
  return { valid: true };
};

// ===== ストア定義 =====

interface GameStoreState extends GameState {
  // Phase 2: ゲームエンジン統合
  gameEngine: any | null; // GameEngine型は動的インポートで使用
  
  // 練習モードガイド: キーハイライト情報
  lastKeyHighlight?: {
    pitch: number;
    timestamp: number;
  };
  
  // 練習モード専用設定の保存
  practiceModeSettings: {
    practiceGuide: 'off' | 'key' | 'key_auto';
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
  stop: (options?: { resetPosition?: boolean }) => void;
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
  
  // 音名情報更新
  updateNoteNames: (noteNamesMap: { [noteId: string]: string }) => void;
  
  // レッスンコンテキスト
  setLessonContext: (lessonId: string, clearConditions: ClearConditions) => void;
  clearLessonContext: () => void;
  
  // ミッションコンテキスト
  setMissionContext: (missionId: string, songId: string, clearConditions?: ClearConditions) => void;
  clearMissionContext: () => void;
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

const CURRENT_TIME_DISPATCH_INTERVAL = 1 / 30;
let lastCurrentTimeDispatch = 0;

// ===== ストア作成 =====

export const useGameStore = createWithEqualityFn<GameStoreState>()(
  devtools(
    subscribeWithSelector(
        immer((set, get) => ({
          ...defaultState,
          
          // Phase 2: ゲームエンジン
          gameEngine: null,
        lastKeyHighlight: undefined,
        
        // 練習モード専用設定
        practiceModeSettings: defaultPracticeModeSettings,
        
        // Phase 2: ゲームエンジン制御
        initializeGameEngine: async () => {
          const state = get();
          const { GameEngine } = await import('@/utils/gameEngine');
          const engine = new GameEngine({ ...state.settings });
          lastCurrentTimeDispatch = 0;
          
            // エンジンの更新コールバック設定
            engine.setUpdateCallback((data: any) => {
              const storeSnapshot = useGameStore.getState();
              const { abRepeat } = storeSnapshot;
              
              // ステージモードではABループを無効化
              if (storeSnapshot.mode === 'performance') {
                // ステージモードではABループを実行しない
              } else if (abRepeat.enabled && abRepeat.startTime !== null && abRepeat.endTime !== null) {
                if (data.currentTime >= abRepeat.endTime) {
                  const seekTime = abRepeat.startTime;
                  console.log(`🔄 ABリピート(Store): ${data.currentTime.toFixed(2)}s → ${seekTime.toFixed(2)}s`);
                  setTimeout(() => {
                    const store = useGameStore.getState();
                    store.seek(seekTime);
                  }, 0);
                }
              }
              
              if (storeSnapshot.settings.showFPS) {
                set((state) => {
                  state.debug.renderTime = performance.now() % 1000;
                });
              }

              const shouldDispatchTime =
                data.currentTime < lastCurrentTimeDispatch ||
                data.currentTime - lastCurrentTimeDispatch >= CURRENT_TIME_DISPATCH_INTERVAL;
              if (shouldDispatchTime) {
                lastCurrentTimeDispatch = data.currentTime;
                set((state) => {
                  state.currentTime = data.currentTime;
                });
              }
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
          }
        }),
        
        handleNoteInput: (inputNote: number) => {
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
        loadSong: async (song: SongMetadata, notes: NoteData[]) => {
          // 移調と音名マージのロジックを一元化
          const _processSongData = async (targetSong: SongMetadata, rawNotes: NoteData[], transpose: number) => {
            let finalNotes = rawNotes;
            let finalXml: string | null = null;
            let finalChords: ChordInfo[] = [];
            
            if (targetSong.musicXmlFile) {
              try {
                const { transposeMusicXml } = await import('@/utils/musicXmlTransposer');
                const { extractPlayableNoteNames, mergeJsonWithNames, extractChordProgressions, recalculateNotesWithMeasureTime } = await import('@/utils/musicXmlMapper');
                
                const xmlResponse = await fetch(targetSong.musicXmlFile);
                if (!xmlResponse.ok) {
                  throw new Error(`MusicXMLファイルの読み込みに失敗: ${xmlResponse.status} ${xmlResponse.statusText}`);
                }
                
                const xmlString = await xmlResponse.text();
                
                // HTMLが返されている場合の検出（XML読み込み時）
                if (xmlString.trim().startsWith('<html') || xmlString.trim().startsWith('<!DOCTYPE html')) {
                  console.warn('⚠️ MusicXMLファイルの代わりにHTMLが返されました:', targetSong.musicXmlFile);
                  throw new Error('MusicXMLファイルの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
                }
                
                finalXml = transposeMusicXml(xmlString, transpose);
                const xmlDoc = new DOMParser().parseFromString(finalXml, 'application/xml');
                
                // XML解析エラーのチェック
                const parseError = xmlDoc.querySelector('parsererror');
                if (parseError) {
                  console.warn('⚠️ MusicXML解析エラー:', parseError.textContent);
                  throw new Error('MusicXMLファイルの解析に失敗しました');
                }
                
                const noteNames = extractPlayableNoteNames(xmlDoc);
                finalNotes = mergeJsonWithNames(rawNotes, noteNames);
                
                // ノーツ時間を小節ベースで再計算（プレイヘッド精度向上）
                finalNotes = recalculateNotesWithMeasureTime(xmlDoc, finalNotes);
                
                // コードネーム情報を抽出（XMLが既に移調済みなので追加移調は不要）
                finalChords = extractChordProgressions(xmlDoc, notes);
                
                console.log(`🎵 MusicXML音名マージ完了: ${noteNames.length}音名 → ${finalNotes.length}ノーツ`);
                console.log(`🎵 コードネーム抽出完了: ${finalChords.length}コード`);
              } catch (error) {
                console.warn('⚠️ MusicXML音名抽出に失敗:', error);
                finalXml = null; // エラー時はnullに
              }
            }
            return { finalNotes, finalXml, finalChords };
          };

          const currentSettings = get().settings;
          const currentLessonContext = get().lessonContext;
          const currentMissionContext = get().missionContext;
          
          // レッスンモードまたはミッションモードでない場合は設定をリセット
          if (!currentLessonContext && !currentMissionContext) {
            set((state) => {
              state.settings.transpose = 0;
              state.settings.playbackSpeed = 1.0;
              // 楽譜表示設定を常にデフォルト（ノーツ+コード）にリセット
              state.settings.showSheetMusic = true;
              state.settings.sheetMusicChordsOnly = false;
            });
          } else {
            // レッスンモードまたはミッションモードでも楽譜表示設定はデフォルトにリセット（課題条件で後から上書きされる場合を除く）
            set((state) => {
              state.settings.showSheetMusic = true;
              state.settings.sheetMusicChordsOnly = false;
            });
          }
          
          // 移調楽器の設定を考慮した移調量を計算
          const { getTransposingInstrumentSemitones } = await import('@/utils/musicXmlTransposer');
          const finalSettings = get().settings; // リセット後の設定を取得
          const transposingInstrumentSemitones = getTransposingInstrumentSemitones(finalSettings.transposingInstrument);
          const totalTranspose = finalSettings.transpose + transposingInstrumentSemitones;
          
          const { finalNotes, finalXml, finalChords } = await _processSongData(song, notes, totalTranspose);

          set((state) => {
            state.currentSong = song;
            state.rawNotes = notes; // 元のノートを保存
            state.notes = finalNotes; // 処理後のノートを保存
            state.musicXml = finalXml; // 移調済みXMLを保存
            state.chords = finalChords; // コードネーム情報を保存
            state.currentTime = 0;
            state.isPlaying = false;
            state.isPaused = false;
            
            // スコアリセット
            state.score = { 
              ...defaultScore, 
              totalNotes: finalNotes.length 
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
              state.gameEngine.loadSong(finalNotes);
              console.log(`🎵 GameEngine に楽曲ロード: ${finalNotes.length}ノーツ`);
            }
          });
        },
        
        clearSong: () => set((state) => {
          state.currentSong = null;
          state.notes = [];
          state.rawNotes = [];
          state.musicXml = null;
          state.chords = [];
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
          
          stop: (options) => set((state) => {
            const shouldResetPosition = options?.resetPosition ?? true;
            state.isPlaying = false;
            state.isPaused = false;
            if (shouldResetPosition) {
              state.currentTime = 0;
              state.activeNotes.clear();
              if (state.gameEngine) {
                state.gameEngine.stop();
              }
              return;
            }
            if (state.gameEngine) {
              state.gameEngine.pause();
            }
          }),
        
        seek: (time) => {
          const state = get();
          const newTime = Math.max(0, Math.min(time, state.currentSong?.duration || time));
          
          set((draft) => {
            draft.currentTime = newTime;
            draft.activeNotes.clear();
          });
          
          // GameEngineにもシーク処理を伝達
          if (state.gameEngine) {
            state.gameEngine.seek(newTime);
            console.log(`🎮 GameEngine seek to ${newTime.toFixed(2)}s`);
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
          // ステージモードではABループを無効化
          if (state.mode === 'performance') {
            state.abRepeat.enabled = false;
            return;
          }
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
        updateSettings: async (newSettings) => {
            // 移調楽器の設定が変更されたかどうかを確認
            const currentSettings = get().settings;
            const previousTimingAdjustment = currentSettings.timingAdjustment;
          const isTransposingInstrumentChanged = 
            'transposingInstrument' in newSettings && 
            newSettings.transposingInstrument !== currentSettings.transposingInstrument;
          
          // 🆕 本番モード + レッスンコンテキスト時の課題条件設定変更制限
          const currentState = get();
          const filteredSettings = { ...newSettings };
          
          // レッスンコンテキストでの制限
          if (currentState.mode === 'performance' && currentState.lessonContext) {
            const { clearConditions } = currentState.lessonContext;
            
            // 課題条件に関連する設定変更を無効化
            if ('transpose' in filteredSettings && clearConditions.key !== undefined) {
              console.warn('⚠️ 本番モード時はキー設定（transpose）を変更できません');
              delete filteredSettings.transpose;
            }
            
            if ('playbackSpeed' in filteredSettings && clearConditions.speed !== undefined) {
              const newSpeed = filteredSettings.playbackSpeed!;
              const minSpeed = clearConditions.speed;
              if (newSpeed < minSpeed) {
                console.warn(`⚠️ 本番モード時は速度設定を${minSpeed}倍速未満に変更できません`);
                delete filteredSettings.playbackSpeed;
              } else {
                console.log(`✅ 本番モード速度変更: ${newSpeed}倍速（最低${minSpeed}倍速以上のため許可）`);
              }
            }
          }
          
          // ミッションコンテキストでの制限
          if (currentState.mode === 'performance' && currentState.missionContext?.clearConditions) {
            const { clearConditions } = currentState.missionContext;
            
            // 課題条件に関連する設定変更を無効化
            if ('transpose' in filteredSettings && clearConditions.key !== undefined) {
              console.warn('⚠️ 本番モード時はキー設定（transpose）を変更できません');
              delete filteredSettings.transpose;
            }
            
            if ('playbackSpeed' in filteredSettings && clearConditions.speed !== undefined) {
              const newSpeed = filteredSettings.playbackSpeed!;
              const minSpeed = clearConditions.speed;
              if (newSpeed < minSpeed) {
                console.warn(`⚠️ 本番モード時は速度設定を${minSpeed}倍速未満に変更できません`);
                delete filteredSettings.playbackSpeed;
              } else {
                console.log(`✅ 本番モード速度変更: ${newSpeed}倍速（最低${minSpeed}倍速以上のため許可）`);
              }
            }
            
            // レッスンコンテキストでの楽譜表示制限
            if (clearConditions.notation_setting) {
              if ('showSheetMusic' in filteredSettings) {
                console.warn('⚠️ 本番モード時は楽譜表示設定（showSheetMusic）を変更できません');
                delete filteredSettings.showSheetMusic;
              }
              if ('sheetMusicChordsOnly' in filteredSettings) {
                console.warn('⚠️ 本番モード時は楽譜表示設定（sheetMusicChordsOnly）を変更できません');
                delete filteredSettings.sheetMusicChordsOnly;
              }
            }
          }
          
          // ミッションコンテキストでの楽譜表示制限
          if (currentState.mode === 'performance' && currentState.missionContext?.clearConditions) {
            const { clearConditions } = currentState.missionContext;
            
            if (clearConditions.notation_setting) {
              if ('showSheetMusic' in filteredSettings) {
                console.warn('⚠️ 本番モード時は楽譜表示設定（showSheetMusic）を変更できません');
                delete filteredSettings.showSheetMusic;
              }
              if ('sheetMusicChordsOnly' in filteredSettings) {
                console.warn('⚠️ 本番モード時は楽譜表示設定（sheetMusicChordsOnly）を変更できません');
                delete filteredSettings.sheetMusicChordsOnly;
              }
            }
          }
          
          // 制限された設定がある場合はログ出力
          const restrictedKeys = Object.keys(newSettings).filter(key => !(key in filteredSettings));
          if (restrictedKeys.length > 0) {
            console.log(`🎯 本番モード課題条件制限: ${restrictedKeys.join(', ')} の変更がブロックされました`);
          }
          
            // まず Immer の set でストアの設定値を更新（フィルタ後の設定を使用）
            set((state) => {
            Object.assign(state.settings, filteredSettings);
            
            // 練習モードでpracticeGuideが変更された場合は保存
            if (state.mode === 'practice' && 'practiceGuide' in filteredSettings) {
              state.practiceModeSettings.practiceGuide = filteredSettings.practiceGuide ?? 'key';
            }
            
            // 本番モードでは練習モードガイドを無効化
            if (state.mode === 'performance' && state.settings.practiceGuide !== 'off') {
              state.settings.practiceGuide = 'off';
            }
          });
            
            // set の外側で最新の設定値を取得し、GameEngine へ反映
            const { gameEngine, settings, currentSong, rawNotes, currentTime } = get();
            if (gameEngine) {
              // Proxy（Immer Draft）が revoke されるのを防ぐため、プレーンオブジェクトを渡す
              gameEngine.updateSettings({ ...settings });
              if (
                Object.prototype.hasOwnProperty.call(filteredSettings, 'timingAdjustment') &&
                typeof filteredSettings.timingAdjustment === 'number' &&
                filteredSettings.timingAdjustment !== previousTimingAdjustment
              ) {
                gameEngine.seek(currentTime);
              }
            }
          
          // 移調楽器の設定が変更された場合、楽譜を再処理
          if (isTransposingInstrumentChanged && currentSong && rawNotes.length > 0) {
            const { getTransposingInstrumentSemitones } = await import('@/utils/musicXmlTransposer');
            const transposingInstrumentSemitones = getTransposingInstrumentSemitones(settings.transposingInstrument);
            const totalTranspose = settings.transpose + transposingInstrumentSemitones;
            
            // 楽曲データ処理ロジック
            const _processSongData = async (targetSong: SongMetadata, notes: NoteData[], transpose: number) => {
              let finalNotes = notes;
              let finalXml: string | null = null;
              let finalChords: ChordInfo[] = [];
              
              if (targetSong.musicXmlFile) {
                try {
                  const { transposeMusicXml } = await import('@/utils/musicXmlTransposer');
                  const { extractPlayableNoteNames, mergeJsonWithNames, extractChordProgressions, recalculateNotesWithMeasureTime } = await import('@/utils/musicXmlMapper');
                  
                  const xmlResponse = await fetch(targetSong.musicXmlFile);
                  if (!xmlResponse.ok) {
                    throw new Error(`MusicXMLファイルの読み込みに失敗: ${xmlResponse.status} ${xmlResponse.statusText}`);
                  }
                  
                  const xmlString = await xmlResponse.text();
                  
                  // HTMLが返されている場合の検出（XML読み込み時）
                  if (xmlString.trim().startsWith('<html') || xmlString.trim().startsWith('<!DOCTYPE html')) {
                    console.warn('⚠️ MusicXMLファイルの代わりにHTMLが返されました:', targetSong.musicXmlFile);
                    throw new Error('MusicXMLファイルの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
                  }
                  
                  finalXml = transposeMusicXml(xmlString, transpose);
                  const xmlDoc = new DOMParser().parseFromString(finalXml, 'application/xml');
                  
                  // XML解析エラーのチェック
                  const parseError = xmlDoc.querySelector('parsererror');
                  if (parseError) {
                    console.warn('⚠️ MusicXML解析エラー:', parseError.textContent);
                    throw new Error('MusicXMLファイルの解析に失敗しました');
                  }
                  
                  const noteNames = extractPlayableNoteNames(xmlDoc);
                  finalNotes = mergeJsonWithNames(notes, noteNames);
                  
                  // ノーツ時間を小節ベースで再計算（プレイヘッド精度向上）
                  finalNotes = recalculateNotesWithMeasureTime(xmlDoc, finalNotes);
                  
                  // コードネーム情報を抽出（XMLが既に移調済みなので追加移調は不要）
                  finalChords = extractChordProgressions(xmlDoc, notes);
                } catch (error) {
                  console.warn('⚠️ MusicXML音名抽出に失敗:', error);
                  finalXml = null;
                }
              }
              return { finalNotes, finalXml, finalChords };
            };
            
            const { finalNotes, finalXml, finalChords } = await _processSongData(currentSong, rawNotes, totalTranspose);
            
            set((state) => {
              state.notes = finalNotes;
              state.musicXml = finalXml;
              state.chords = finalChords;
              
              // GameEngineにも更新を通知
              if (state.gameEngine) {
                state.gameEngine.loadSong(finalNotes);
                console.log(`🎵 GameEngineに移調楽器用のノートを再ロード: ${finalNotes.length}ノーツ`);
              }
            });
            
            console.log(`🎵 移調楽器設定変更により楽譜を再処理: ${settings.transposingInstrument} (+${transposingInstrumentSemitones}半音)`);
          }
        },
        
        resetSettings: () => set((state) => {
          state.settings = { ...defaultSettings };
        }),
        
        // モード制御
        setMode: (mode) => set((state) => {
          const previousMode = state.mode;
          state.mode = mode;
          
          if (mode === 'practice') {
            state.currentTab = 'practice';
            // 練習モードでは保存された設定を復元
            if (state.practiceModeSettings.practiceGuide) {
              state.settings.practiceGuide = state.practiceModeSettings.practiceGuide;
            }
            // 練習モードに戻った際、楽譜表示を「ノート+コード」に設定
            state.settings.showSheetMusic = true;
            state.settings.sheetMusicChordsOnly = false;
          } else {
            state.currentTab = 'performance';
            // 本番モードに切り替える前に練習モード設定を保存
            if (previousMode === 'practice') {
              state.practiceModeSettings.practiceGuide = state.settings.practiceGuide ?? 'key';
            }
            // 本番モードでは練習モードガイドを無効化
            state.settings.practiceGuide = 'off';
            
            // 🆕 レッスンモード時：本番モードで課題条件を強制適用
            if (state.lessonContext) {
              const { clearConditions } = state.lessonContext;
              console.log('🎯 本番モード切り替え: レッスン課題条件を適用', clearConditions);
              
              // キー（移調）設定
              if (clearConditions.key !== undefined) {
                state.settings.transpose = clearConditions.key;
              }
              
              // 速度設定
              if (clearConditions.speed !== undefined) {
                state.settings.playbackSpeed = clearConditions.speed;
              }
              
              // 楽譜表示設定
              if (clearConditions.notation_setting) {
                switch (clearConditions.notation_setting) {
                  case 'notes_chords':
                    state.settings.showSheetMusic = true;
                    state.settings.sheetMusicChordsOnly = false;
                    break;
                  case 'chords_only':
                    state.settings.showSheetMusic = true;
                    state.settings.sheetMusicChordsOnly = true;
                    break;
                  case 'both':
                    state.settings.showSheetMusic = true;
                    state.settings.sheetMusicChordsOnly = false;
                    break;
                }
              }
              
              console.log('✅ 本番モード課題条件適用完了:', {
                transpose: state.settings.transpose,
                playbackSpeed: state.settings.playbackSpeed,
                showSheetMusic: state.settings.showSheetMusic,
                sheetMusicChordsOnly: state.settings.sheetMusicChordsOnly
              });
            }
            
            // 🆕 ミッションモード時：本番モードで課題条件を強制適用
            if (state.missionContext?.clearConditions) {
              const { clearConditions } = state.missionContext;
              console.log('🎯 本番モード切り替え: ミッション課題条件を適用', clearConditions);
              
              // キー（移調）設定
              if (clearConditions.key !== undefined) {
                state.settings.transpose = clearConditions.key;
              }
              
              // 速度設定
              if (clearConditions.speed !== undefined) {
                state.settings.playbackSpeed = clearConditions.speed;
              }
              
              // 楽譜表示設定
              if (clearConditions.notation_setting) {
                switch (clearConditions.notation_setting) {
                  case 'notes_chords':
                    state.settings.showSheetMusic = true;
                    state.settings.sheetMusicChordsOnly = false;
                    break;
                  case 'chords_only':
                    state.settings.showSheetMusic = true;
                    state.settings.sheetMusicChordsOnly = true;
                    break;
                  case 'both':
                    state.settings.showSheetMusic = true;
                    state.settings.sheetMusicChordsOnly = false;
                    break;
                }
              }
              
              console.log('✅ 本番モード課題条件適用完了:', {
                transpose: state.settings.transpose,
                playbackSpeed: state.settings.playbackSpeed,
                showSheetMusic: state.settings.showSheetMusic,
                sheetMusicChordsOnly: state.settings.sheetMusicChordsOnly
              });
            }
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
          
          console.log(`🔄 モード切り替え: ${previousMode} → ${mode} - 再生停止・リセット完了`);
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
            // 練習モードに戻った時は保存した設定を復元
            state.settings.practiceGuide = state.practiceModeSettings.practiceGuide ?? 'key';
          } else if (tab === 'performance') {
            state.mode = 'performance';
            // 本番モードに切り替える前に練習モード設定を保存
            if (previousTab === 'practice') {
              state.practiceModeSettings.practiceGuide = state.settings.practiceGuide ?? 'key';
            }
            // 本番モードでは練習モードガイドを無効化
            state.settings.practiceGuide = 'off';
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
          const { settings, setTranspose } = get();
          const nextValue = settings.transpose + semitones;
          setTranspose(nextValue);
        },

        setTranspose: async (semitones: number) => {
          const { updateEngineSettings, currentSong, rawNotes, settings } = get();
          const clamped = Math.max(-12, Math.min(12, semitones));

          // 処理がなければ早期リターン
          if (!currentSong || rawNotes.length === 0) {
            set(state => { state.settings.transpose = clamped; });
            updateEngineSettings();
            return;
          }

          // 楽曲データ処理ロジック
          const _processSongData = async (targetSong: SongMetadata, notes: NoteData[], transpose: number) => {
             let finalNotes = notes;
             let finalXml: string | null = null;
             let finalChords: ChordInfo[] = [];
             
             if (targetSong.musicXmlFile) {
               try {
                 const { transposeMusicXml } = await import('@/utils/musicXmlTransposer');
                 const { extractPlayableNoteNames, mergeJsonWithNames, extractChordProgressions, recalculateNotesWithMeasureTime } = await import('@/utils/musicXmlMapper');
                 
                 const xmlResponse = await fetch(targetSong.musicXmlFile);
                 if (!xmlResponse.ok) {
                   throw new Error(`MusicXMLファイルの読み込みに失敗: ${xmlResponse.status} ${xmlResponse.statusText}`);
                 }
                 
                 const xmlString = await xmlResponse.text();
                 
                 // HTMLが返されている場合の検出（XML読み込み時）
                 if (xmlString.trim().startsWith('<html') || xmlString.trim().startsWith('<!DOCTYPE html')) {
                   console.warn('⚠️ MusicXMLファイルの代わりにHTMLが返されました:', targetSong.musicXmlFile);
                   throw new Error('MusicXMLファイルの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
                 }
                 
                 finalXml = transposeMusicXml(xmlString, transpose);
                 const xmlDoc = new DOMParser().parseFromString(finalXml, 'application/xml');
                 
                 // XML解析エラーのチェック
                 const parseError = xmlDoc.querySelector('parsererror');
                 if (parseError) {
                   console.warn('⚠️ MusicXML解析エラー:', parseError.textContent);
                   throw new Error('MusicXMLファイルの解析に失敗しました');
                 }
                 
                 const noteNames = extractPlayableNoteNames(xmlDoc);
                 finalNotes = mergeJsonWithNames(notes, noteNames);
                 
                 // ノーツ時間を小節ベースで再計算（プレイヘッド精度向上）
                 finalNotes = recalculateNotesWithMeasureTime(xmlDoc, finalNotes);
                 
                 // コードネーム情報を抽出（XMLが既に移調済みなので追加移調は不要）
                 finalChords = extractChordProgressions(xmlDoc, notes);
               } catch (error) {
                 console.warn('⚠️ MusicXML音名抽出に失敗:', error);
                 finalXml = null;
               }
             }
             return { finalNotes, finalXml, finalChords };
          };
          
          // 移調楽器の設定を考慮した移調量を計算
          const { getTransposingInstrumentSemitones } = await import('@/utils/musicXmlTransposer');
          const transposingInstrumentSemitones = getTransposingInstrumentSemitones(settings.transposingInstrument);
          const totalTranspose = clamped + transposingInstrumentSemitones;
          
          const { finalNotes, finalXml, finalChords } = await _processSongData(currentSong, rawNotes, totalTranspose);

          set((state) => {
            state.settings.transpose = clamped;
            state.notes = finalNotes;
            state.musicXml = finalXml;
            state.chords = finalChords;
            
            // GameEngineにも更新を通知
            if (state.gameEngine) {
              state.gameEngine.loadSong(finalNotes);
              console.log(`🎵 GameEngineに移調後のノートを再ロード: ${finalNotes.length}ノーツ`);
            }
          });
          
          updateEngineSettings();
          console.log(`🎵 Transpose changed to ${clamped}, song re-processed without playback interruption.`);
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
          
          // 練習モードでpracticeGuideが含まれている場合は保存
          if (state.mode === 'practice' && 'practiceGuide' in preset.settings) {
            state.practiceModeSettings.practiceGuide = preset.settings.practiceGuide ?? 'key';
          }
          
          // 本番モードでは練習モードガイドを無効化
          if (state.mode === 'performance') {
            state.settings.practiceGuide = 'off';
          }
          
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
        addError: (category: keyof GameStoreState['errors'], error: string) =>
          set((state: GameStoreState) => {
            state.errors[category].push(error);
          }),
        
        clearErrors: (category?: keyof GameStoreState['errors']) =>
          set((state: GameStoreState) => {
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
          return Object.values(state.errors).some(
            (errors: string[]) => errors.length > 0
          );
        },
        
        getErrorSummary: () => {
          const state = get();
          const summary: string[] = [];
          Object.entries(state.errors).forEach(([category, errors]) => {
            const list = errors as string[];
            if (list.length > 0) {
              summary.push(`${category}: ${list.length}件のエラー`);
            }
          });
          return summary;
        },
        
        // リザルトモーダル
        openResultModal: () =>
          set((state: GameStoreState) => {
            state.resultModalOpen = true;
          }),
        closeResultModal: () =>
          set((state: GameStoreState) => {
            state.resultModalOpen = false;
          }),
        
        // 音名情報更新
        updateNoteNames: (noteNamesMap: Record<string, string>) =>
          set((state: GameStoreState) => {
            // notesに音名情報を追加
            state.notes = state.notes.map(note => ({
              ...note,
              noteName: noteNamesMap[note.id] || note.noteName
            }));
          }),
        
        // レッスンコンテキスト
        setLessonContext: (lessonId: string, clearConditions: ClearConditions) =>
          set((state: GameStoreState) => {
            state.lessonContext = {
              lessonId,
              clearConditions
            };
          }),
        
        clearLessonContext: () =>
          set((state: GameStoreState) => {
            state.lessonContext = undefined;
          }),
        
        // ミッションコンテキスト
        setMissionContext: (missionId: string, songId: string, clearConditions?: ClearConditions) =>
          set((state: GameStoreState) => {
            state.missionContext = {
              missionId,
              songId,
              clearConditions
            };
          }),
        
        clearMissionContext: () =>
          set((state: GameStoreState) => {
            state.missionContext = undefined;
          }),
      }))
    ),
    {
      name: 'jazz-game-store'
    }
  )
);

// ===== セレクタ =====

export const useCurrentTime = () =>
  useGameStore((state: GameStoreState) => state.currentTime);
export const useIsPlaying = () =>
  useGameStore((state: GameStoreState) => state.isPlaying);
export const useCurrentSong = () =>
  useGameStore((state: GameStoreState) => state.currentSong);
export const useChords = () =>
  useGameStore((state: GameStoreState) => state.chords);
export const useGameMode = () =>
  useGameStore((state: GameStoreState) => state.mode);
export const useInstrumentMode = () =>
  useGameStore((state: GameStoreState) => state.settings.instrumentMode);
export const useGameScore = () =>
  useGameStore((state: GameStoreState) => state.score);
export const useActiveNotes = () =>
  useGameStore((state: GameStoreState) => state.activeNotes);
export const useABRepeat = () =>
  useGameStore((state: GameStoreState) => state.abRepeat);
export const useSettings = () =>
  useGameStore((state: GameStoreState) => state.settings);

// 複合セレクタ - 再生可能状態
export const useCanPlay = () =>
  useGameStore((state: GameStoreState) =>
    state.currentSong !== null && state.notes.length > 0 && !state.isPlaying
  );

export const useABRepeatActive = () =>
  useGameStore((state: GameStoreState) =>
    state.abRepeat.enabled &&
    state.abRepeat.startTime !== null &&
    state.abRepeat.endTime !== null
  );

// 現在の時間がABリピート範囲内かどうか
export const useIsInABRange = () =>
  useGameStore((state: GameStoreState) => {
  const { currentTime, abRepeat } = state;
  if (!abRepeat.enabled || abRepeat.startTime === null || abRepeat.endTime === null) {
    return false;
  }
  return currentTime >= abRepeat.startTime && currentTime <= abRepeat.endTime;
});

// ===== 新機能: 拡張セレクタ =====

// 初期化状態関連
export const useInitializationState = () =>
  useGameStore((state: GameStoreState) => state.initialization);
export const useIsInitialized = () =>
  useGameStore((state: GameStoreState) => state.initialization.isInitialized);
export const useHasAudioPermission = () =>
  useGameStore((state: GameStoreState) => state.initialization.hasAudioPermission);
export const useHasMidiPermission = () =>
  useGameStore((state: GameStoreState) => state.initialization.hasMidiPermission);
export const useIsGameEngineReady = () =>
  useGameStore((state: GameStoreState) => state.initialization.gameEngineReady);
export const useInitializationErrors = () =>
  useGameStore((state: GameStoreState) => state.initialization.errors);

// 設定プリセット関連
export const useSettingsPresets = () =>
  useGameStore((state: GameStoreState) => state.settingsPresets);
export const useSettingsPreset = (presetId: string) =>
  useGameStore((state: GameStoreState) =>
    state.settingsPresets.find((p) => p.id === presetId)
  );

// セッション関連
export const useCurrentSession = () =>
  useGameStore((state: GameStoreState) => state.currentSession);
export const useSessionHistory = () =>
  useGameStore((state: GameStoreState) => state.sessionHistory);
export const useIsSessionActive = () =>
  useGameStore((state: GameStoreState) => state.currentSession !== null);

// パフォーマンス監視関連
export const usePerformanceMetrics = () =>
  useGameStore((state: GameStoreState) => state.performance);
export const useFPS = () =>
  useGameStore((state: GameStoreState) => state.performance.fps);
export const useFrameDrops = () =>
  useGameStore((state: GameStoreState) => state.performance.frameDrops);
export const useAverageFrameTime = () =>
  useGameStore((state: GameStoreState) => state.performance.averageFrameTime);
export const useIsPerformanceGood = () =>
  useGameStore((state: GameStoreState) =>
    state.performance.fps >= 55 && state.performance.frameDrops < 10
  );

// エラー関連
export const useErrors = () =>
  useGameStore((state: GameStoreState) => state.errors);
export const useHasErrors = () =>
  useGameStore((state: GameStoreState) => state.hasErrors());
export const useErrorSummary = () =>
  useGameStore((state: GameStoreState) => state.getErrorSummary());
export const useSettingsErrors = () =>
  useGameStore((state: GameStoreState) => state.errors.settings);
export const useGameEngineErrors = () =>
  useGameStore((state: GameStoreState) => state.errors.gameEngine);
export const useAudioErrors = () =>
  useGameStore((state: GameStoreState) => state.errors.audio);
export const useMidiErrors = () =>
  useGameStore((state: GameStoreState) => state.errors.midi);

// 複合状態セレクタ
export const useGameReadyState = () =>
  useGameStore((state: GameStoreState) => ({
    isInitialized: state.initialization.isInitialized,
    hasAudioPermission: state.initialization.hasAudioPermission,
    hasMidiPermission: state.initialization.hasMidiPermission,
    gameEngineReady: state.initialization.gameEngineReady,
    hasSong: state.currentSong !== null,
    hasNotes: state.notes.length > 0,
    hasErrors: state.hasErrors()
  }));

export const usePlaybackState = () =>
  useGameStore((state: GameStoreState) => ({
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    currentTime: state.currentTime,
    canPlay: state.currentSong !== null && state.notes.length > 0 && !state.isPlaying,
    canPause: state.isPlaying,
    canResume: state.isPaused
  }));

export const useSettingsValidation = () => {
  const updateSettingsSafe = useGameStore(
    (state: GameStoreState) => state.updateSettingsSafe
  );
  const clearErrors = useGameStore(
    (state: GameStoreState) => state.clearErrors
  );
  
  return {
    updateSettingsSafe,
    clearSettingsErrors: () => clearErrors('settings')
  };
};

// ===== エフェクト統計関連フック =====
export const useEffectStats = () =>
  useGameStore((state: GameStoreState) => state.performance.effects);
export const useEffectSuccessRate = () =>
  useGameStore((state: GameStoreState) => {
    const effects = state.performance.effects;
    return effects.totalGenerated > 0
      ? effects.successCount / effects.totalGenerated
      : 0;
  });
export const useEffectPerformance = () =>
  useGameStore((state: GameStoreState) => ({
    averageProcessTime: state.performance.effects.averageProcessTime,
    lastProcessTime: state.performance.effects.lastProcessTime,
    isPerformanceGood: state.performance.effects.averageProcessTime < 2.0 // 2ms以内が良好
  }));

// ===== 設定の永続化 =====
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('gameSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 永続化しない設定を除外
      delete parsed.playbackSpeed;
      delete parsed.showSheetMusic;      // 楽譜表示設定は保存しない
      delete parsed.sheetMusicChordsOnly; // 楽譜表示設定は保存しない
      useGameStore.getState().updateSettings(parsed);
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage', e);
  }

  useGameStore.subscribe(
    (state) => state.settings,
    (settings) => {
      // 永続化しない設定を除外
      const { playbackSpeed, showSheetMusic, sheetMusicChordsOnly, ...persist } = settings;
      try {
        localStorage.setItem('gameSettings', JSON.stringify(persist));
      } catch (e) {
        console.warn('Failed to save settings to localStorage', e);
      }
    }
  );
}

// レッスンコンテキスト
export const useLessonContext = () =>
  useGameStore((state: GameStoreState) => state.lessonContext);

export const useIsLessonMode = () =>
  useGameStore((state: GameStoreState) => !!state.lessonContext);
