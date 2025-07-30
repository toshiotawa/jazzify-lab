/**
 * リズムモード専用状態管理ストア
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  RhythmGameState, 
  ChordTiming, 
  JudgmentType,
  JudgmentWindow,
  MusicTimeInfo,
  RhythmMonsterState
} from '@/types/rhythm';
import type { FantasyStage, ChordProgressionData } from '@/types';
import { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { devLog } from '@/utils/logger';

interface RhythmStore {
  // ゲーム状態
  gameState: RhythmGameState;
  
  // 音楽制御
  audioContext: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  startTime: number;
  pauseTime: number;
  
  // 判定設定
  judgmentWindow: JudgmentWindow;
  
  // アクション - 音楽制御
  initializeAudio: (url: string) => Promise<void>;
  startMusic: () => void;
  stopMusic: () => void;
  getCurrentMusicTime: () => MusicTimeInfo;
  
  // アクション - ゲーム制御
  initializeGame: (stage: FantasyStage, getChordDefinition: (chordId: string) => ChordDefinition | null) => void;
  updateGameTime: (currentTime: number, currentMeasure: number, currentBeat: number) => void;
  judgeInput: (chordNotes: number[], inputTime: number) => { judgment: JudgmentType; monsterId?: string };
  processMonsterAttack: (monsterId: string) => void;
  processChordHit: (monsterId: string, judgment: JudgmentType) => void;
  setGameOver: (result: 'clear' | 'gameover') => void;
  resetGame: () => void;
  
  // アクション - リズムパターン生成
  generateRandomPattern: (stage: FantasyStage) => ChordTiming[];
  loadProgressionPattern: (data: ChordProgressionData[], bpm: number) => ChordTiming[];
}

const defaultGameState: RhythmGameState = {
  currentStage: null,
  isGameActive: false,
  isGameOver: false,
  gameResult: null,
  score: 0,
  totalHits: 0,
  perfectHits: 0,
  goodHits: 0,
  missHits: 0,
  combo: 0,
  maxCombo: 0,
  playerHp: 5,
  playerSp: 0,
  activeMonsters: [],
  enemiesDefeated: 0,
  totalEnemies: 0,
  currentMeasure: 1,
  currentBeat: 1,
  nextChordTiming: null,
  chordTimings: [],
  isPlaying: false,
  currentTime: 0,
  loopCount: 0,
  isCompleting: false,
};

export const useRhythmStore = createWithEqualityFn<RhythmStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // 初期状態
        gameState: defaultGameState,
        audioContext: null,
        audioBuffer: null,
        sourceNode: null,
        startTime: 0,
        pauseTime: 0,
        judgmentWindow: {
          perfect: 50,  // ±50ms
          good: 200,    // ±200ms
        },
        
        // 音楽制御
        initializeAudio: async (url: string) => {
          try {
            const audioContext = new AudioContext();
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            set((state) => {
              state.audioContext = audioContext;
              state.audioBuffer = audioBuffer;
            });
            
            devLog.debug('音楽ファイル読み込み完了:', url);
          } catch (error) {
            devLog.error('音楽ファイル読み込みエラー:', error);
            throw error;
          }
        },
        
        startMusic: () => {
          // 音楽の再生はRhythmMusicManagerで管理されているため、
          // ここでは再生状態のフラグのみを管理
          set((state) => {
            state.gameState.isPlaying = true;
          });
          
          devLog.debug('音楽再生状態を有効化');
        },
        
        stopMusic: () => {
          const { sourceNode } = get();
          if (sourceNode) {
            sourceNode.stop();
            set((state) => {
              state.sourceNode = null;
              state.gameState.isPlaying = false;
            });
          }
        },
        
        getCurrentMusicTime: (): MusicTimeInfo => {
          // RhythmMusicManagerから現在の音楽時間を取得
          // 注: この関数は実際にはFantasyRhythmEngineから呼ばれるべき
          const { gameState } = get();
          if (!gameState.isPlaying) {
            return {
              currentTime: 0,
              currentMeasure: 1,
              currentBeat: 1,
              beatProgress: 0,
              measureProgress: 0,
            };
          }
          
          // 簡易実装：実際の時間管理はRhythmMusicManagerで行う
          return {
            currentTime: 0,
            currentMeasure: 1,
            currentBeat: 1,
            beatProgress: 0,
            measureProgress: 0,
          };
        },
        
        // ゲーム制御
        initializeGame: (stage: FantasyStage, getChordDefinition: (chordId: string) => ChordDefinition | null) => {
          devLog.debug('リズムゲーム初期化:', stage);
          
          // コードタイミングの生成
          let chordTimings: ChordTiming[] = [];
          if (stage.rhythm_pattern === 'random') {
            chordTimings = get().generateRandomPattern(stage);
          } else if (stage.rhythm_pattern === 'progression' && stage.chord_progression_data) {
            chordTimings = get().loadProgressionPattern(stage.chord_progression_data, stage.bpm || 120);
          }
          
          // 初期モンスターの生成
          const simultaneousCount = stage.rhythm_pattern === 'progression' ? 4 : 
                                   (stage.simultaneous_monster_count || 1);
          const activeMonsters: RhythmMonsterState[] = [];
          const positions: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
          
          for (let i = 0; i < Math.min(simultaneousCount, stage.enemy_count); i++) {
            const chordId = stage.allowed_chords[i % stage.allowed_chords.length];
            const chordDef = getChordDefinition(chordId);
            
            if (chordDef) {
              activeMonsters.push({
                id: `monster-${i}`,
                index: i,
                position: positions[i % 4],
                currentHp: stage.enemy_hp,
                maxHp: stage.enemy_hp,
                chordTarget: chordDef,
                gaugeProgress: 0,
                nextAttackTiming: chordTimings[i]?.absoluteTime || 0,
                icon: stage.monster_icon || 'fa-dragon',
                name: `モンスター${i + 1}`,
                isDefeated: false,
              });
            }
          }
          
          set((state) => {
            state.gameState = {
              ...defaultGameState,
              currentStage: stage,
              isGameActive: true,
              playerHp: stage.max_hp,
              totalEnemies: stage.enemy_count,
              activeMonsters,
              chordTimings,
              nextChordTiming: chordTimings[0] || null,
            };
          });
        },
        
        updateGameTime: (currentTime: number, currentMeasure: number, currentBeat: number) => {
          const { gameState } = get();
          if (!gameState.isGameActive || !gameState.isPlaying) return;
          const updatedMonsters = gameState.activeMonsters.map(monster => {
            if (monster.isDefeated) return monster;
            
            // 次の攻撃タイミングまでの進行度を計算
            const timeToAttack = monster.nextAttackTiming - currentTime;
            const attackWindow = gameState.currentStage?.enemy_gauge_seconds || 4;
            const progress = Math.max(0, Math.min(100, (1 - timeToAttack / attackWindow) * 100));
            
            // 攻撃タイミングを過ぎた場合
            if (timeToAttack < -0.2) { // 200ms の猶予後
              get().processMonsterAttack(monster.id);
            }
            
            return { ...monster, gaugeProgress: progress };
          });
          
          // 次のコードタイミングの更新
          const nextTiming = gameState.chordTimings.find(
            timing => !timing.isHit && timing.absoluteTime > currentTime
          );
          
          set((state) => {
            state.gameState.currentMeasure = currentMeasure;
            state.gameState.currentBeat = currentBeat;
            state.gameState.currentTime = currentTime;
            state.gameState.activeMonsters = updatedMonsters;
            state.gameState.nextChordTiming = nextTiming || null;
          });
        },
        
        judgeInput: (chordNotes: number[], inputTime: number) => {
          const { gameState, judgmentWindow } = get();
          const currentTime = inputTime;
          
          // 最も近いタイミングのモンスターを探す
          let closestMonster: RhythmMonsterState | null = null;
          let closestDiff = Infinity;
          
          for (const monster of gameState.activeMonsters) {
            if (monster.isDefeated) continue;
            
            const diff = Math.abs(monster.nextAttackTiming - currentTime);
            if (diff < closestDiff && diff <= judgmentWindow.good / 1000) {
              // 入力されたコードが正しいかチェック
              const expectedNotes = monster.chordTarget.notes;
              const isCorrect = chordNotes.length === expectedNotes.length &&
                               chordNotes.every(note => expectedNotes.includes(note));
              
              if (isCorrect) {
                closestMonster = monster;
                closestDiff = diff;
              }
            }
          }
          
          if (!closestMonster) {
            return { judgment: 'miss' as JudgmentType };
          }
          
          // 判定
          const diffMs = closestDiff * 1000;
          let judgment: JudgmentType;
          
          if (diffMs <= judgmentWindow.perfect) {
            judgment = 'perfect';
          } else if (diffMs <= judgmentWindow.good) {
            judgment = 'good';
          } else {
            judgment = 'miss';
          }
          
          // 判定結果を処理
          if (judgment !== 'miss') {
            get().processChordHit(closestMonster.id, judgment);
          }
          
          return { judgment, monsterId: closestMonster.id };
        },
        
        processMonsterAttack: (monsterId: string) => {
          set((state) => {
            const monster = state.gameState.activeMonsters.find(m => m.id === monsterId);
            if (!monster || monster.isDefeated) return;
            
            // プレイヤーへのダメージ
            state.gameState.playerHp = Math.max(0, state.gameState.playerHp - 1);
            state.gameState.missHits++;
            state.gameState.combo = 0;
            
            // ゲームオーバー判定
            if (state.gameState.playerHp <= 0) {
              state.gameState.isGameOver = true;
              state.gameState.gameResult = 'gameover';
              state.gameState.isGameActive = false;
            }
            
            // 次のコードへ移行
            const nextChordIndex = (monster.index + state.gameState.activeMonsters.length) % 
                                 state.gameState.currentStage!.allowed_chords.length;
            // const nextChordId = state.gameState.currentStage!.allowed_chords[nextChordIndex];
            
            // モンスターの攻撃タイミングをリセット
            const attackWindow = state.gameState.currentStage?.enemy_gauge_seconds || 4;
            monster.nextAttackTiming = state.gameState.currentTime + attackWindow;
            monster.gaugeProgress = 0;
          });
        },
        
        processChordHit: (monsterId: string, judgment: JudgmentType) => {
          set((state) => {
            const monsterIndex = state.gameState.activeMonsters.findIndex(m => m.id === monsterId);
            if (monsterIndex === -1) return;
            
            const monster = state.gameState.activeMonsters[monsterIndex];
            
            // スコア更新
            if (judgment === 'perfect') {
              state.gameState.perfectHits++;
              state.gameState.score += 100;
            } else if (judgment === 'good') {
              state.gameState.goodHits++;
              state.gameState.score += 50;
            }
            
            state.gameState.totalHits++;
            state.gameState.combo++;
            state.gameState.maxCombo = Math.max(state.gameState.maxCombo, state.gameState.combo);
            
            // モンスターへのダメージ
            const damage = state.gameState.currentStage?.min_damage || 1;
            monster.currentHp = Math.max(0, monster.currentHp - damage);
            
            if (monster.currentHp <= 0) {
              monster.isDefeated = true;
              state.gameState.enemiesDefeated++;
              
              // クリア判定
              if (state.gameState.enemiesDefeated >= state.gameState.totalEnemies) {
                state.gameState.isGameOver = true;
                state.gameState.gameResult = 'clear';
                state.gameState.isGameActive = false;
              }
            } else {
              // 次の攻撃タイミングを設定
              const attackWindow = state.gameState.currentStage?.enemy_gauge_seconds || 4;
              monster.nextAttackTiming = state.gameState.currentTime + attackWindow;
              monster.gaugeProgress = 0;
            }
          });
        },
        
        setGameOver: (result: 'clear' | 'gameover') => {
          set((state) => {
            state.gameState.isGameOver = true;
            state.gameState.gameResult = result;
            state.gameState.isGameActive = false;
          });
        },
        
        resetGame: () => {
          get().stopMusic();
          set((state) => {
            state.gameState = defaultGameState;
          });
        },
        
        // リズムパターン生成
        generateRandomPattern: (stage: FantasyStage): ChordTiming[] => {
          const timings: ChordTiming[] = [];
          const bpm = stage.bpm || 120;
          const timeSignature = stage.time_signature || 4;
          const measureCount = stage.measure_count || 16;
          const beatDuration = 60 / bpm;
          const measureDuration = beatDuration * timeSignature;
          
          // 各小節に1つのコードをランダムに配置
          for (let measure = 2; measure <= measureCount; measure++) {
            const chordId = stage.allowed_chords[
              Math.floor(Math.random() * stage.allowed_chords.length)
            ];
            
            // 小節の最初の拍に配置
            timings.push({
              id: `timing-${measure}`,
              chord: chordId,
              absoluteTime: (measure - 1) * measureDuration,
              measure,
              beat: 1,
              isHit: false,
            });
          }
          
          return timings;
        },
        
        loadProgressionPattern: (data: ChordProgressionData[], bpm: number): ChordTiming[] => {
          const beatDuration = 60 / bpm;
          
          return data.map((item, index) => ({
            id: `timing-${index}`,
            chord: item.chord,
            absoluteTime: ((item.measure - 1) * 4 + (item.beat - 1)) * beatDuration,
            measure: item.measure,
            beat: item.beat,
            isHit: false,
          }));
        },
      }))
    ),
    { name: 'rhythm-store' }
  )
);