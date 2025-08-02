import { create } from 'zustand';
import { RhythmNote } from '@/types';

interface RhythmGameState {
  // ゲーム状態
  notes: RhythmNote[];
  playerHp: number;
  enemyHp: number;
  maxEnemyHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  gameState: 'idle' | 'playing' | 'cleared' | 'gameover';
  
  // 敵情報
  currentEnemyId: string | null;
  defeatedEnemies: number;
  totalEnemies: number;
  
  // ステージ情報
  stageId: string | null;
  allowedChords: string[];
  chordProgressionData: { measure: number; beat: number; chord: string }[] | null;
  
  // アクション
  initializeGame: (params: {
    stageId: string;
    playerMaxHp: number;
    enemyHp: number;
    totalEnemies: number;
    allowedChords: string[];
    chordProgressionData?: { measure: number; beat: number; chord: string }[] | null;
  }) => void;
  
  addNote: (note: RhythmNote) => void;
  removeNote: (noteId: string) => void;
  updateNoteStatus: (noteId: string, status: RhythmNote['status']) => void;
  
  applyPlayerDamage: (damage: number) => void;
  applyEnemyDamage: (damage: number) => void;
  
  incrementCombo: () => void;
  resetCombo: () => void;
  addScore: (points: number) => void;
  
  setGameState: (state: 'idle' | 'playing' | 'cleared' | 'gameover') => void;
  spawnNewEnemy: (enemyId: string) => void;
  
  reset: () => void;
}

const initialState = {
  notes: [],
  playerHp: 100,
  enemyHp: 1,
  maxEnemyHp: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  gameState: 'idle' as const,
  currentEnemyId: null,
  defeatedEnemies: 0,
  totalEnemies: 10,
  stageId: null,
  allowedChords: [],
  chordProgressionData: null,
};

export const useRhythmGameStore = create<RhythmGameState>((set, get) => ({
  ...initialState,
  
  initializeGame: (params) => {
    set({
      ...initialState,
      stageId: params.stageId,
      playerHp: params.playerMaxHp,
      enemyHp: params.enemyHp,
      maxEnemyHp: params.enemyHp,
      totalEnemies: params.totalEnemies,
      allowedChords: params.allowedChords,
      chordProgressionData: params.chordProgressionData || null,
      gameState: 'playing',
    });
  },
  
  addNote: (note) => {
    set((state) => ({
      notes: [...state.notes, note],
    }));
  },
  
  removeNote: (noteId) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== noteId),
    }));
  },
  
  updateNoteStatus: (noteId, status) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? { ...n, status } : n)),
    }));
  },
  
  applyPlayerDamage: (damage) => {
    set((state) => {
      const newHp = Math.max(0, state.playerHp - damage);
      return {
        playerHp: newHp,
        gameState: newHp <= 0 ? 'gameover' : state.gameState,
      };
    });
  },
  
  applyEnemyDamage: (damage) => {
    set((state) => {
      const newHp = Math.max(0, state.enemyHp - damage);
      const enemyDefeated = newHp <= 0;
      const newDefeatedCount = enemyDefeated ? state.defeatedEnemies + 1 : state.defeatedEnemies;
      const allEnemiesDefeated = newDefeatedCount >= state.totalEnemies;
      
      return {
        enemyHp: newHp,
        defeatedEnemies: newDefeatedCount,
        gameState: allEnemiesDefeated ? 'cleared' : state.gameState,
      };
    });
  },
  
  incrementCombo: () => {
    set((state) => {
      const newCombo = state.combo + 1;
      return {
        combo: newCombo,
        maxCombo: Math.max(newCombo, state.maxCombo),
      };
    });
  },
  
  resetCombo: () => {
    set({ combo: 0 });
  },
  
  addScore: (points) => {
    set((state) => ({
      score: state.score + points,
    }));
  },
  
  setGameState: (gameState) => {
    set({ gameState });
  },
  
  spawnNewEnemy: (enemyId) => {
    set((state) => ({
      currentEnemyId: enemyId,
      enemyHp: state.maxEnemyHp,
    }));
  },
  
  reset: () => {
    set(initialState);
  },
}));