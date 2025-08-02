import { create } from 'zustand'
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine'

export interface RhythmNote {
  id: string
  chord: ChordDefinition
  hitTime: number   // 理想中心時刻 (ms)
  measure: number   // 小節番号
  beat: number      // 拍番号 (1.0, 1.5, 2.0, etc.)
}

interface RhythmState {
  currentChord: ChordDefinition | null
  windowStart: number
  windowEnd: number
  pending: RhythmNote[]
  lastChordId: string | null  // 判定重複防止用
  
  /* setters */
  setChord: (c: ChordDefinition, centerTime: number) => void
  addNote: (n: RhythmNote) => void
  removeNote: (id: string) => void
  clearNotes: () => void
  judge: (now: number, playedChord: ChordDefinition) => 'hit' | 'miss' | null
  reset: () => void
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  currentChord: null,
  windowStart: 0,
  windowEnd: 0,
  pending: [],
  lastChordId: null,
  
  setChord: (c, center) =>
    set({
      currentChord: c,
      windowStart: center - 200,
      windowEnd: center + 200
    }),
    
  addNote: n => set(state => ({ 
    pending: [...state.pending, n] 
  })),
  
  removeNote: id => set(state => ({
    pending: state.pending.filter(n => n.id !== id)
  })),
  
  clearNotes: () => set({ 
    pending: [],
    currentChord: null,
    windowStart: 0,
    windowEnd: 0
  }),
  
  judge: (now, played) => {
    const s = get()
    
    // 判定ウィンドウ外
    if (now < s.windowStart || now > s.windowEnd) return null
    
    // 現在のコードがない
    if (!s.currentChord) return null
    
    // すでに判定済み
    if (s.lastChordId === s.currentChord.id) return null
    
    // コードIDが一致するか確認
    const isCorrect = played.id === s.currentChord.id
    
    if (isCorrect) {
      set({ lastChordId: s.currentChord.id })
      return 'hit'
    }
    
    return 'miss'
  },
  
  reset: () => set({
    currentChord: null,
    windowStart: 0,
    windowEnd: 0,
    pending: [],
    lastChordId: null
  })
}))

