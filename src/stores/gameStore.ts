/**
 * メインゲーム状態管理ストア (Zustand)
 */

import { create } from 'zustand';
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
  
  // 表示設定
  showNoteNames: true,
  keyboardNoteNameStyle: 'abc',
  noteNoteNameStyle: 'abc',
  noteAccidentalStyle: 'sharp',
  showFPS: false,
  
  // ビューポート設定
  viewportHeight: 600,
  pianoHeight: 80,
  
  // 入力デバイス
  selectedMidiDevice: null,
  selectedAudioDevice: null,
  
  // キー設定
  transpose: 0,
  
  // レイテンシ手動調整
  latencyAdjustment: 0,
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
  
  // デバッグ情報
  debug: {
    fps: 60,
    renderTime: 0,
    audioLatency: 0
  }
};

// ===== ストア定義 =====

interface GameStoreState extends GameState {
  // Phase 2: ゲームエンジン統合
  gameEngine: any | null; // GameEngine型は動的インポートで使用
  engineActiveNotes: ActiveNote[];
  
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
  
  // 設定
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetSettings: () => void;
  
  // UI制御
  setCurrentTab: (tab: 'practice' | 'performance' | 'songs') => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  // デバッグ
  updateDebugInfo: (info: Partial<GameState['debug']>) => void;
  
  // エラーハンドリング
  handleError: (error: GameError) => void;
  
  // リセット
  resetGame: () => void;
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

const calculateScore = (goodCount: number, maxCombo: number, _accuracy: number): number => {
  const baseScore = (goodCount / Math.max(1, goodCount + 0)) * 800; // Miss考慮なし（Good/Miss判定のみ）
  const comboBonus = Math.min(maxCombo * 2, 200); // コンボボーナス最大200点
  return Math.min(Math.round(baseScore + comboBonus), 1000);
};

// ===== ストア作成 =====

export const useGameStore = create<GameStoreState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...defaultState,
        
        // Phase 2: ゲームエンジン
        gameEngine: null,
        engineActiveNotes: [],
        
        // Phase 2: ゲームエンジン制御
        initializeGameEngine: async () => {
          const state = get();
          const { GameEngine } = await import('@/utils/gameEngine');
          const engine = new GameEngine({ ...state.settings });
          
          // エンジンの更新コールバック設定
          engine.setUpdateCallback((data: any) => {
            set((state) => {
              state.currentTime = data.currentTime;
              state.engineActiveNotes = data.activeNotes;
              state.score = data.score;
              
              // ABリピート状態の同期
              state.abRepeat.enabled = data.abRepeatState.enabled;
              state.abRepeat.startTime = data.abRepeatState.start;
              state.abRepeat.endTime = data.abRepeatState.end;
              
              // デバッグ情報更新（オプション）
              if (state.settings.showFPS) {
                state.debug.renderTime = performance.now() % 1000;
              }
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
            const judgment = state.gameEngine.processHit(hit);
            
            set((state) => {
              state.judgmentHistory.push(judgment);
              
              // アクティブノーツの状態更新
              if (hit.judgment !== 'miss') {
                state.activeNotes.add(hit.noteId);
              }
            });
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
        
        seek: (time) => set((state) => {
          const newTime = Math.max(0, Math.min(time, state.currentSong?.duration || time));
          state.currentTime = newTime;
          state.activeNotes.clear();
          
          // GameEngineにもシーク処理を伝達
          if (state.gameEngine) {
            state.gameEngine.seek(newTime);
            console.log(`🎮 GameEngine seek to ${newTime.toFixed(2)}s`);
          }
        }),
        
        updateTime: (time) => set((state) => {
          state.currentTime = time;
        }),
        
        // ABリピート制御
        setABRepeatStart: (time) => set((state) => {
          const currentTime = time ?? state.currentTime;
          state.abRepeat.startTime = currentTime;
          
          // GameEngine にも同期
          if (state.gameEngine) {
            state.gameEngine.setABRepeatStart(currentTime);
          }
          
          // 終了時間が開始時間より前の場合はクリア
          if (state.abRepeat.endTime !== null && state.abRepeat.endTime <= currentTime) {
            state.abRepeat.endTime = null;
            // GameEngine 側もクリア
            if (state.gameEngine) {
              state.gameEngine.clearABRepeat();
              state.gameEngine.setABRepeatStart(currentTime);
            }
          }
        }),
        
        setABRepeatEnd: (time) => set((state) => {
          const currentTime = time ?? state.currentTime;
          
          // 開始時間が設定されていない、または開始時間より後の場合のみ設定
          if (state.abRepeat.startTime !== null && currentTime > state.abRepeat.startTime) {
            state.abRepeat.endTime = currentTime;
            
            // GameEngine にも同期
            if (state.gameEngine) {
              state.gameEngine.setABRepeatEnd(currentTime);
            }
          }
        }),
        
        clearABRepeat: () => set((state) => {
          state.abRepeat = {
            enabled: false,
            startTime: null,
            endTime: null
          };
          
          if (state.gameEngine) {
            state.gameEngine.clearABRepeat();
          }
        }),

        // A地点のみクリア
        clearABRepeatStart: () => set((state) => {
          state.abRepeat.startTime = null;
          // A地点がクリアされたらループも無効化
          state.abRepeat.enabled = false;
          
          if (state.gameEngine) {
            state.gameEngine.clearABRepeat();
          }
        }),

        // B地点のみクリア
        clearABRepeatEnd: () => set((state) => {
          state.abRepeat.endTime = null;
          // B地点がクリアされたらループも無効化
          state.abRepeat.enabled = false;
          
          if (state.gameEngine) {
            state.gameEngine.clearABRepeat();
          }
        }),
        
        toggleABRepeat: () => set((state) => {
          if (state.abRepeat.startTime !== null && state.abRepeat.endTime !== null) {
            state.abRepeat.enabled = !state.abRepeat.enabled;
            
            if (state.gameEngine) {
              if (state.abRepeat.enabled) {
                state.gameEngine.enableABRepeat();
              } else {
                state.gameEngine.disableABRepeat();
              }
            }
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
        skipForward: (seconds: number) => set((state) => {
          const maxTime = state.currentSong?.duration || 0;
          const newTime = Math.min(state.currentTime + seconds, maxTime);
          state.currentTime = newTime;
          state.activeNotes.clear();
          
          // GameEngineにもシーク処理を伝達
          if (state.gameEngine) {
            state.gameEngine.seek(newTime);
            console.log(`⏩ Skip forward to ${newTime.toFixed(2)}s`);
          }
        }),
        
        skipBackward: (seconds: number) => set((state) => {
          const newTime = Math.max(0, state.currentTime - seconds);
          state.currentTime = newTime;
          state.activeNotes.clear();
          
          // GameEngineにもシーク処理を伝達
          if (state.gameEngine) {
            state.gameEngine.seek(newTime);
            console.log(`⏪ Skip backward to ${newTime.toFixed(2)}s`);
          }
        }),
        
        // 新規追加: 移調制御
        transpose: (semitones: number) => set((state) => {
          state.settings.transpose += semitones;
        }),
        
        setTranspose: (semitones: number) => set((state) => {
          state.settings.transpose = semitones;
        })
      }))
    ),
    {
      name: 'jazz-game-store'
    }
  )
);

// ===== セレクター（パフォーマンス最適化用） =====

// よく使用される値のセレクター
export const useCurrentTime = () => useGameStore((state) => state.currentTime);
export const useIsPlaying = () => useGameStore((state) => state.isPlaying);
export const useCurrentSong = () => useGameStore((state) => state.currentSong);
export const useGameMode = () => useGameStore((state) => state.mode);
export const useInstrumentMode = () => useGameStore((state) => state.settings.instrumentMode);
export const useGameScore = () => useGameStore((state) => state.score);
export const useActiveNotes = () => useGameStore((state) => state.activeNotes);
export const useABRepeat = () => useGameStore((state) => state.abRepeat);
export const useSettings = () => useGameStore((state) => state.settings);

// 計算されたセレクター
export const useCanPlay = () => useGameStore((state) => 
  state.currentSong !== null && state.notes.length > 0
);

export const useABRepeatActive = () => useGameStore((state) => 
  state.abRepeat.enabled && 
  state.abRepeat.startTime !== null && 
  state.abRepeat.endTime !== null
);

export const useIsInABRange = () => useGameStore((state) => {
  const { currentTime, abRepeat } = state;
  if (!abRepeat.enabled || abRepeat.startTime === null || abRepeat.endTime === null) {
    return false;
  }
  return currentTime >= abRepeat.startTime && currentTime <= abRepeat.endTime;
});

