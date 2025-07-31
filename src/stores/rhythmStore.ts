/**
 * リズムゲーム専用のZustandストア
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  RhythmGameState, 
  RhythmJudgment, 
  RhythmEnemy,
  RhythmStageData
} from '@/types';

interface RhythmStoreState extends RhythmGameState {
  // リズム敵管理
  rhythmEnemies: RhythmEnemy[];
  activeEnemyCount: number;
  defeatedEnemies: number;
  totalEnemies: number;
  
  // ゲーム進行状態
  isGameStarted: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  score: number;
  combo: number;
  maxCombo: number;
  
  // エラー管理
  error: string | null;
  
  // アクション
  initializeRhythmGame: (stageData: RhythmStageData) => void;
  startGame: () => void;
  stopGame: () => void;
  updateTime: (time: number) => void;
  onBeatTick: (measure: number, beat: number) => void;
  onJudgmentStart: (expectedChord: string, judgmentTime: number) => void;
  onJudgmentEnd: (judgment: RhythmJudgment) => void;
  triggerChordInput: (chord: string) => boolean;
  resetGame: () => void;
  setError: (error: string | null) => void;
}

const defaultRhythmState: RhythmGameState = {
  gameType: 'rhythm',
  rhythmPattern: 'random',
  isPlaying: false,
  currentTime: 0,
  bpm: 120,
  timeSignature: 4,
  measureCount: 8,
  loopMeasures: 8,
  currentMeasure: 0,
  currentBeat: 0,
  nextJudgmentTime: 0,
  judgmentWindow: 200, // 200ms
  progressionIndex: 0,
  progressionData: [],
  audioElement: null,
  audioContext: null,
  isAudioLoaded: false,
  isAudioPlaying: false,
  lastJudgmentTime: 0,
  isInJudgmentWindow: false,
  currentExpectedChord: null,
};

export const useRhythmStore = createWithEqualityFn<RhythmStoreState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...defaultRhythmState,
        
        // リズム敵管理
        rhythmEnemies: [],
        activeEnemyCount: 0,
        defeatedEnemies: 0,
        totalEnemies: 0,
        
        // ゲーム進行状態
        isGameStarted: false,
        isGameOver: false,
        gameResult: null,
        score: 0,
        combo: 0,
        maxCombo: 0,
        
        // エラー管理
        error: null,
        
        // ゲーム初期化
        initializeRhythmGame: (stageData: RhythmStageData) => {
          set((state) => {
            // ステージデータを状態に反映
            state.gameType = stageData.game_type;
            state.rhythmPattern = stageData.rhythm_pattern;
            state.bpm = stageData.bpm;
            state.timeSignature = stageData.time_signature;
            state.loopMeasures = stageData.loop_measures;
            state.measureCount = stageData.measure_count || 8;
            state.progressionData = stageData.chord_progression_data || [];
            
            // 敵キャラクター初期化
            state.rhythmEnemies = [];
            state.totalEnemies = stageData.enemy_count;
            state.activeEnemyCount = Math.min(stageData.simultaneous_monster_count, 4);
            
            // 初期敵を生成
            for (let i = 0; i < state.activeEnemyCount; i++) {
              const enemy: RhythmEnemy = {
                id: `enemy-${i}`,
                hp: stageData.enemy_hp,
                maxHp: stageData.enemy_hp,
                position: i,
                attackProgress: 0,
                targetJudgmentTime: 0,
                assignedChord: '',
                isActive: true,
                gaugeSpeed: 1.0 / (60 / stageData.bpm), // BPMに基づく速度
              };
              state.rhythmEnemies.push(enemy);
            }
            
            // 状態リセット
            state.currentTime = 0;
            state.currentMeasure = 0;
            state.currentBeat = 0;
            state.progressionIndex = 0;
            state.isGameStarted = false;
            state.isGameOver = false;
            state.gameResult = null;
            state.score = 0;
            state.combo = 0;
            state.maxCombo = 0;
            state.defeatedEnemies = 0;
            state.error = null;
          });
        },
        
        // ゲーム開始
        startGame: () => {
          set((state) => {
            state.isGameStarted = true;
            state.isPlaying = true;
            state.isGameOver = false;
            state.currentTime = 0;
          });
        },
        
        // ゲーム停止
        stopGame: () => {
          set((state) => {
            state.isPlaying = false;
            state.isGameStarted = false;
          });
        },
        
        // 時間更新
        updateTime: (time: number) => {
          set((state) => {
            state.currentTime = time;
            
            // 小節・拍の計算
            const secondsPerBeat = 60 / state.bpm;
            const secondsPerMeasure = secondsPerBeat * state.timeSignature;
            state.currentMeasure = Math.floor(time / secondsPerMeasure);
            state.currentBeat = (time % secondsPerMeasure) / secondsPerBeat;
            
            // 敵のゲージ更新（リズムモードでは一定速度）
            state.rhythmEnemies.forEach(enemy => {
              if (enemy.isActive && enemy.assignedChord) {
                enemy.attackProgress = Math.min(1.0, 
                  (time - enemy.targetJudgmentTime + state.judgmentWindow / 1000) / 
                  (state.judgmentWindow * 2 / 1000)
                );
              }
            });
          });
        },
        
        // 拍タイミング通知
        onBeatTick: (measure: number, beat: number) => {
          set((state) => {
            state.currentMeasure = measure;
            state.currentBeat = beat;
          });
        },
        
        // 判定開始
        onJudgmentStart: (expectedChord: string, judgmentTime: number) => {
          set((state) => {
            state.currentExpectedChord = expectedChord;
            state.nextJudgmentTime = judgmentTime;
            state.isInJudgmentWindow = true;
            
            // 空いている敵にコードを割り当て
            const availableEnemy = state.rhythmEnemies.find(e => e.isActive && !e.assignedChord);
            if (availableEnemy) {
              availableEnemy.assignedChord = expectedChord;
              availableEnemy.targetJudgmentTime = judgmentTime;
              availableEnemy.attackProgress = 0;
            }
          });
        },
        
        // 判定終了
        onJudgmentEnd: (judgment: RhythmJudgment) => {
          set((state) => {
            state.lastJudgmentTime = judgment.actualTime;
            state.isInJudgmentWindow = false;
            
            if (judgment.success) {
              // 成功時の処理
              state.combo++;
              state.maxCombo = Math.max(state.maxCombo, state.combo);
              state.score += 100 * state.combo;
              
              // 対象の敵にダメージ
              const targetEnemy = state.rhythmEnemies.find(
                e => e.assignedChord === judgment.chord && e.isActive
              );
              if (targetEnemy) {
                targetEnemy.hp--;
                if (targetEnemy.hp <= 0) {
                  targetEnemy.isActive = false;
                  state.defeatedEnemies++;
                  
                  // 新しい敵を生成
                  if (state.defeatedEnemies < state.totalEnemies) {
                    targetEnemy.hp = targetEnemy.maxHp;
                    targetEnemy.isActive = true;
                    targetEnemy.assignedChord = '';
                    targetEnemy.attackProgress = 0;
                  }
                }
                targetEnemy.assignedChord = '';
              }
            } else {
              // 失敗時の処理
              state.combo = 0;
              
              // プレイヤーがダメージを受ける（実装は後で）
            }
            
            // ゲーム終了判定
            if (state.defeatedEnemies >= state.totalEnemies) {
              state.isGameOver = true;
              state.gameResult = 'clear';
              state.isPlaying = false;
            }
            
            state.currentExpectedChord = null;
          });
        },
        
        // コード入力トリガー
        triggerChordInput: (chord: string) => {
          const state = get();
          if (!state.isInJudgmentWindow || !state.currentExpectedChord) {
            return false;
          }
          
          const currentTime = state.currentTime;
          const expectedTime = state.nextJudgmentTime;
          const timingError = (currentTime - expectedTime) * 1000; // ms
          const isInWindow = Math.abs(timingError) <= state.judgmentWindow;
          const isCorrectChord = chord === state.currentExpectedChord;
          
          const judgment: RhythmJudgment = {
            success: isInWindow && isCorrectChord,
            timingError,
            expectedTime,
            actualTime: currentTime,
            chord,
          };
          
          get().onJudgmentEnd(judgment);
          return judgment.success;
        },
        
        // ゲームリセット
        resetGame: () => {
          set((state) => {
            Object.assign(state, defaultRhythmState);
            state.rhythmEnemies = [];
            state.activeEnemyCount = 0;
            state.defeatedEnemies = 0;
            state.totalEnemies = 0;
            state.isGameStarted = false;
            state.isGameOver = false;
            state.gameResult = null;
            state.score = 0;
            state.combo = 0;
            state.maxCombo = 0;
            state.error = null;
          });
        },
        
        // エラー設定
        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },
      }))
    ),
    {
      name: 'rhythm-store',
    }
  )
);

// セレクタフック
export const useRhythmGameState = () => 
  useRhythmStore((state) => ({
    gameType: state.gameType,
    rhythmPattern: state.rhythmPattern,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    bpm: state.bpm,
    timeSignature: state.timeSignature,
    currentMeasure: state.currentMeasure,
    currentBeat: state.currentBeat,
  }));

export const useRhythmEnemies = () =>
  useRhythmStore((state) => state.rhythmEnemies);

export const useRhythmScore = () =>
  useRhythmStore((state) => ({
    score: state.score,
    combo: state.combo,
    maxCombo: state.maxCombo,
  }));

export const useRhythmJudgment = () =>
  useRhythmStore((state) => ({
    isInJudgmentWindow: state.isInJudgmentWindow,
    currentExpectedChord: state.currentExpectedChord,
    nextJudgmentTime: state.nextJudgmentTime,
  }));

export const useRhythmGameStatus = () =>
  useRhythmStore((state) => ({
    isGameStarted: state.isGameStarted,
    isGameOver: state.isGameOver,
    gameResult: state.gameResult,
    defeatedEnemies: state.defeatedEnemies,
    totalEnemies: state.totalEnemies,
  }));