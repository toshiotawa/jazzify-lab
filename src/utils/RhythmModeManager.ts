import { ChordProgressionData } from '@/types';

export interface RhythmNote {
  id: string;
  chord: string;
  measure: number;
  beat: number;
  hitTime: number; // Absolute time in ms when the note should be hit
  judged: boolean;
  judgment?: 'perfect' | 'good' | 'miss';
}

export interface JudgmentResult {
  timing: 'perfect' | 'good' | 'miss';
  timeDiff: number;
  noteId: string;
}

export class RhythmModeManager {
  private notes: RhythmNote[] = [];
  private bpm: number;
  private timeSignature: number;
  private measureCount: number;
  private countInMeasures: number;
  private allowedChords: string[];
  private chordProgressionData: ChordProgressionData | null;
  private startTime: number = 0;
  private currentNoteIndex: number = 0;
  
  // Judgment window constants (in ms)
  private static readonly PERFECT_WINDOW = 50;
  private static readonly GOOD_WINDOW = 200;
  
  constructor(
    bpm: number,
    timeSignature: number,
    measureCount: number,
    countInMeasures: number,
    allowedChords: string[],
    chordProgressionData: ChordProgressionData | null
  ) {
    this.bpm = bpm;
    this.timeSignature = timeSignature;
    this.measureCount = measureCount;
    this.countInMeasures = countInMeasures;
    this.allowedChords = allowedChords;
    this.chordProgressionData = chordProgressionData;
  }
  
  /**
   * Initialize the note sequence for the rhythm game
   */
  public initialize(startTime: number): void {
    this.startTime = startTime;
    this.notes = [];
    this.currentNoteIndex = 0;
    
    if (this.chordProgressionData) {
      // Progression mode: Use predefined chord progression
      this.generateProgressionNotes();
    } else {
      // Random mode: Generate random notes
      this.generateRandomNotes();
    }
  }
  
  /**
   * Generate notes from chord progression data
   */
  private generateProgressionNotes(): void {
    if (!this.chordProgressionData) return;
    
    // Generate notes for multiple loops to ensure continuous play
    for (let loop = 0; loop < 10; loop++) {
      this.chordProgressionData.chords.forEach((chordData, index) => {
        const adjustedMeasure = chordData.measure + (loop * this.measureCount);
        // Skip count-in measures for loops after the first
        const measureOffset = loop > 0 ? -this.countInMeasures : 0;
        
        const note: RhythmNote = {
          id: `${loop}-${index}`,
          chord: chordData.chord,
          measure: adjustedMeasure + measureOffset,
          beat: chordData.beat,
          hitTime: this.calculateHitTime(adjustedMeasure + measureOffset, chordData.beat),
          judged: false
        };
        
        this.notes.push(note);
      });
    }
  }
  
  /**
   * Generate random notes for each measure
   */
  private generateRandomNotes(): void {
    
    // Generate notes for multiple loops
    for (let loop = 0; loop < 10; loop++) {
      for (let measure = 1; measure <= this.measureCount; measure++) {
        const adjustedMeasure = measure + (loop * this.measureCount);
        const measureOffset = loop > 0 ? -this.countInMeasures : 0;
        
        // Generate one note per measure on beat 1
        const randomChord = this.allowedChords[Math.floor(Math.random() * this.allowedChords.length)];
        
        const note: RhythmNote = {
          id: `${loop}-${measure}`,
          chord: randomChord,
          measure: adjustedMeasure + measureOffset,
          beat: 1,
          hitTime: this.calculateHitTime(adjustedMeasure + measureOffset, 1),
          judged: false
        };
        
        this.notes.push(note);
      }
    }
  }
  
  /**
   * Calculate the hit time for a note
   */
  private calculateHitTime(measure: number, beat: number): number {
    const msPerBeat = 60000 / this.bpm;
    const beatsPerMeasure = this.timeSignature;
    
    // Calculate time from start (considering ready duration)
    const measureTime = (measure - 1) * beatsPerMeasure * msPerBeat;
    const beatTime = (beat - 1) * msPerBeat;
    
    return measureTime + beatTime + 2000; // Add 2s ready duration
  }
  
  /**
   * Get notes that should be visible in the current time window
   */
  public getVisibleNotes(currentTime: number, lookAheadMs: number = 3000): RhythmNote[] {
    const elapsed = currentTime - this.startTime;
    
    return this.notes.filter(note => {
      const timeDiff = note.hitTime - elapsed;
      return timeDiff > -RhythmModeManager.GOOD_WINDOW && timeDiff < lookAheadMs;
    });
  }
  
  /**
   * Check if a chord input matches any notes in the judgment window
   */
  public judgeInput(chord: string, currentTime: number): JudgmentResult | null {
    const elapsed = currentTime - this.startTime;
    
    // Find the closest unjudged note matching the chord
    let closestNote: RhythmNote | null = null;
    let closestDiff = Infinity;
    
    for (const note of this.notes) {
      if (note.judged || note.chord !== chord) continue;
      
      const timeDiff = Math.abs(note.hitTime - elapsed);
      if (timeDiff <= RhythmModeManager.GOOD_WINDOW && timeDiff < closestDiff) {
        closestNote = note;
        closestDiff = timeDiff;
      }
    }
    
    if (!closestNote) return null;
    
    // Mark as judged
    closestNote.judged = true;
    
    // Determine judgment
    let timing: 'perfect' | 'good' | 'miss';
    if (closestDiff <= RhythmModeManager.PERFECT_WINDOW) {
      timing = 'perfect';
    } else if (closestDiff <= RhythmModeManager.GOOD_WINDOW) {
      timing = 'good';
    } else {
      timing = 'miss';
    }
    
    closestNote.judgment = timing;
    
    return {
      timing,
      timeDiff: closestDiff,
      noteId: closestNote.id
    };
  }
  
  /**
   * Check for missed notes and auto-judge them
   */
  public checkMissedNotes(currentTime: number): RhythmNote[] {
    const elapsed = currentTime - this.startTime;
    const missedNotes: RhythmNote[] = [];
    
    for (const note of this.notes) {
      if (!note.judged && elapsed - note.hitTime > RhythmModeManager.GOOD_WINDOW) {
        note.judged = true;
        note.judgment = 'miss';
        missedNotes.push(note);
      }
    }
    
    return missedNotes;
  }
  
  /**
   * Get the next unjudged note
   */
  public getNextNote(): RhythmNote | null {
    return this.notes.find(note => !note.judged) || null;
  }
  
  /**
   * Reset judgment state for all notes
   */
  public reset(): void {
    this.notes.forEach(note => {
      note.judged = false;
      note.judgment = undefined;
    });
    this.currentNoteIndex = 0;
  }
}