import { create } from 'zustand';

interface RhythmChord {
  measure: number;
  beat: number;
  chord: string;
}

interface RhythmState {
  // Rhythm mode specific states
  judgmentWindowMs: number;
  currentChordIndex: number;
  rhythmChords: RhythmChord[];
  nextJudgmentTime: number | null;
  lastJudgmentResult: 'perfect' | 'good' | 'miss' | null;
  
  // Actions
  initializeRhythm: (chords: RhythmChord[]) => void;
  checkJudgment: (currentTime: number) => 'perfect' | 'good' | 'miss' | 'early' | null;
  moveToNextChord: () => void;
  reset: () => void;
  getNextChord: () => RhythmChord | null;
  getCurrentChord: () => RhythmChord | null;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  // Default judgment window is 200ms before and after
  judgmentWindowMs: 200,
  currentChordIndex: 0,
  rhythmChords: [],
  nextJudgmentTime: null,
  lastJudgmentResult: null,
  
  initializeRhythm: (chords: RhythmChord[]) => {
    set({
      rhythmChords: chords,
      currentChordIndex: 0,
      nextJudgmentTime: null,
      lastJudgmentResult: null,
    });
  },
  
  checkJudgment: (currentTime: number) => {
    const { nextJudgmentTime, judgmentWindowMs } = get();
    
    if (!nextJudgmentTime) return null;
    
    const timeDiff = Math.abs(currentTime - nextJudgmentTime);
    
    // Early hit (not in window yet)
    if (currentTime < nextJudgmentTime - judgmentWindowMs) {
      return 'early';
    }
    
    // Within judgment window
    if (timeDiff <= judgmentWindowMs) {
      // Perfect timing (within 50ms)
      if (timeDiff <= 50) {
        set({ lastJudgmentResult: 'perfect' });
        return 'perfect';
      }
      // Good timing (within judgment window)
      set({ lastJudgmentResult: 'good' });
      return 'good';
    }
    
    // Missed the window
    if (currentTime > nextJudgmentTime + judgmentWindowMs) {
      set({ lastJudgmentResult: 'miss' });
      return 'miss';
    }
    
    return null;
  },
  
  moveToNextChord: () => {
    const { rhythmChords, currentChordIndex } = get();
    const nextIndex = (currentChordIndex + 1) % rhythmChords.length;
    set({
      currentChordIndex: nextIndex,
      lastJudgmentResult: null,
    });
  },
  
  reset: () => {
    set({
      currentChordIndex: 0,
      rhythmChords: [],
      nextJudgmentTime: null,
      lastJudgmentResult: null,
    });
  },
  
  getNextChord: () => {
    const { rhythmChords, currentChordIndex } = get();
    const nextIndex = (currentChordIndex + 1) % rhythmChords.length;
    return rhythmChords[nextIndex] || null;
  },
  
  getCurrentChord: () => {
    const { rhythmChords, currentChordIndex } = get();
    return rhythmChords[currentChordIndex] || null;
  },
}));