import { RhythmQuestion } from './generator';
import { useRhythmStore } from './store';
import { getChordDefinition, ChordDefinition } from '@/components/fantasy/FantasyGameEngine';

export interface JudgeResult {
  success: boolean;
  timing: 'early' | 'perfect' | 'late' | 'miss';
  timingDiff: number; // in seconds
  chord: string;
}

export class RhythmJudgeEngine {
  private static readonly JUDGE_WINDOW = 0.2; // ±200ms
  private static readonly PERFECT_WINDOW = 0.05; // ±50ms for perfect timing
  
  private currentQuestion: RhythmQuestion | null = null;
  private activeNotes: Set<number> = new Set();
  private judgedQuestions: Set<string> = new Set();
  
  constructor(
    private onSuccess: (question: RhythmQuestion, result: JudgeResult) => void,
    private onFail: (question: RhythmQuestion, result: JudgeResult) => void
  ) {}
  
  setCurrentQuestion(question: RhythmQuestion | null): void {
    this.currentQuestion = question;
    if (question && !this.judgedQuestions.has(question.id)) {
      this.activeNotes.clear();
    }
  }
  
  handleNoteOn(midiNote: number): void {
    this.activeNotes.add(midiNote);
    this.checkChord();
  }
  
  handleNoteOff(midiNote: number): void {
    this.activeNotes.delete(midiNote);
  }
  
  checkTiming(): void {
    if (!this.currentQuestion) return;
    if (this.judgedQuestions.has(this.currentQuestion.id)) return;
    
    const now = useRhythmStore.getState().now;
    const diff = now - this.currentQuestion.absSec;
    
    // Check if we've passed the judge window
    if (diff > RhythmJudgeEngine.JUDGE_WINDOW) {
      this.judgedQuestions.add(this.currentQuestion.id);
      const result: JudgeResult = {
        success: false,
        timing: 'miss',
        timingDiff: diff,
        chord: this.currentQuestion.chord
      };
      this.onFail(this.currentQuestion, result);
      this.currentQuestion = null;
    }
  }
  
  private checkChord(): void {
    if (!this.currentQuestion) return;
    if (this.judgedQuestions.has(this.currentQuestion.id)) return;
    
    const now = useRhythmStore.getState().now;
    const diff = now - this.currentQuestion.absSec;
    
    // Check if we're within the judge window
    if (Math.abs(diff) > RhythmJudgeEngine.JUDGE_WINDOW) {
      return; // Too early or too late
    }
    
    // Get chord definition
    const chordDef = getChordDefinition(this.currentQuestion.chord);
    if (!chordDef) return;
    
    // Convert active MIDI notes to pitch classes
    const activePitchClasses = Array.from(this.activeNotes).map(note => note % 12);
    const uniquePitchClasses = new Set(activePitchClasses);
    
    // Get chord pitch classes
    const chordPitchClasses = new Set(chordDef.notes.map(note => note % 12));
    
    // Check if sets match
    const isMatch = 
      uniquePitchClasses.size === chordPitchClasses.size &&
      Array.from(uniquePitchClasses).every(pc => chordPitchClasses.has(pc));
    
    if (isMatch) {
      this.judgedQuestions.add(this.currentQuestion.id);
      
      let timing: 'early' | 'perfect' | 'late';
      if (Math.abs(diff) <= RhythmJudgeEngine.PERFECT_WINDOW) {
        timing = 'perfect';
      } else if (diff < 0) {
        timing = 'early';
      } else {
        timing = 'late';
      }
      
      const result: JudgeResult = {
        success: true,
        timing,
        timingDiff: diff,
        chord: this.currentQuestion.chord
      };
      
      this.onSuccess(this.currentQuestion, result);
      this.currentQuestion = null;
    }
  }
  
  reset(): void {
    this.currentQuestion = null;
    this.activeNotes.clear();
    this.judgedQuestions.clear();
  }
}