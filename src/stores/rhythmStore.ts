import { create } from 'zustand'

// ChordDefinitionの型定義（FantasyGameEngineから移植）
export interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

export interface RhythmNote {
  id: string;
  chord: ChordDefinition;
  hitTime: number; // 理想中心時刻 (ms)
  measureNumber: number; // 小節番号
  beatNumber: number; // 拍番号
}

interface RhythmState {
  // 現在の出題コード
  currentChord: ChordDefinition | null;
  // 判定ウィンドウ（理想時刻の前後200ms）
  windowStart: number;
  windowEnd: number;
  // ノーツキュー（画面に表示されるノーツ）
  pendingNotes: RhythmNote[];
  // 判定済みノーツID（重複判定防止）
  judgedNoteIds: Set<string>;
  // コード進行モードの場合の進行インデックス
  progressionIndex: number;
  
  // Actions
  setChord: (chord: ChordDefinition, centerTime: number) => void;
  addNote: (note: RhythmNote) => void;
  removeNote: (noteId: string) => void;
  clearNotes: () => void;
  judge: (now: number, playedChord: ChordDefinition) => 'hit' | 'miss' | null;
  markAsJudged: (noteId: string) => void;
  isJudged: (noteId: string) => boolean;
  setProgressionIndex: (index: number) => void;
  reset: () => void;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  currentChord: null,
  windowStart: 0,
  windowEnd: 0,
  pendingNotes: [],
  judgedNoteIds: new Set(),
  progressionIndex: 0,
  
  setChord: (chord, centerTime) => {
    set({
      currentChord: chord,
      windowStart: centerTime - 200,
      windowEnd: centerTime + 200
    });
  },
  
  addNote: (note) => {
    set(state => ({
      pendingNotes: [...state.pendingNotes, note]
    }));
  },
  
  removeNote: (noteId) => {
    set(state => ({
      pendingNotes: state.pendingNotes.filter(n => n.id !== noteId)
    }));
  },
  
  clearNotes: () => {
    set({ 
      pendingNotes: [],
      judgedNoteIds: new Set()
    });
  },
  
  judge: (now, playedChord) => {
    const state = get();
    
    // 判定ウィンドウ内のノーツを探す
    const noteInWindow = state.pendingNotes.find(note => 
      now >= note.hitTime - 200 &&
      now <= note.hitTime + 200 &&
      !state.judgedNoteIds.has(note.id)
    );
    
    if (!noteInWindow) return null;
    
    // コードが一致するか確認
    const isMatch = playedChord.id === noteInWindow.chord.id;
    
    // 判定済みとしてマーク
    get().markAsJudged(noteInWindow.id);
    
    return isMatch ? 'hit' : 'miss';
  },
  
  markAsJudged: (noteId) => {
    set(state => ({
      judgedNoteIds: new Set([...state.judgedNoteIds, noteId])
    }));
  },
  
  isJudged: (noteId) => {
    return get().judgedNoteIds.has(noteId);
  },
  
  setProgressionIndex: (index) => {
    set({ progressionIndex: index });
  },
  
  reset: () => {
    set({
      currentChord: null,
      windowStart: 0,
      windowEnd: 0,
      pendingNotes: [],
      judgedNoteIds: new Set(),
      progressionIndex: 0
    });
  }
}));