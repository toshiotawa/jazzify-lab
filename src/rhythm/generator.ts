import { getChordDefinition } from '@/components/fantasy/FantasyGameEngine';

// Extended FantasyStage interface with rhythm fields
export interface RhythmFantasyStage {
  id: string;
  stage_number: string;
  name: string;
  description: string;
  max_hp: number;
  enemy_gauge_seconds: number;
  enemy_count: number;
  enemy_hp: number;
  min_damage: number;
  max_damage: number;
  mode: 'single' | 'progression';
  allowed_chords: string[];
  chord_progression?: string[];
  show_sheet_music: boolean;
  show_guide: boolean;
  simultaneous_monster_count?: number;
  monster_icon?: string;
  // Rhythm-specific fields
  game_type?: 'quiz' | 'rhythm';
  rhythm_pattern?: 'random' | 'progression';
  bpm?: number;
  time_signature?: 3 | 4;
  loop_measures?: number;
  mp3_url?: string;
  chord_progression_data?: ChordProgressionEntry[];
}

export interface ChordProgressionEntry {
  chord: string;
  measure: number;
  beat: number;
}

export interface RhythmQuestion {
  id: string;
  chord: string;
  absSec: number;
  measure: number;
  beatPos: number;
}

export class RandomPatternGenerator {
  private lastChord: string = '';
  
  constructor(private stage: RhythmFantasyStage) {}
  
  next(measure: number, beat: number = 1): RhythmQuestion {
    const candidates = this.stage.allowed_chords.filter(c => c !== this.lastChord);
    const chord = candidates[Math.floor(Math.random() * candidates.length)] || this.stage.allowed_chords[0];
    this.lastChord = chord;
    
    const bpm = this.stage.bpm || 120;
    const timeSig = this.stage.time_signature || 4;
    const measureLen = (60 / bpm) * timeSig;
    const beatLen = 60 / bpm;
    
    return {
      id: `${chord}_m${measure}_b${beat}`,
      chord,
      absSec: (measure - 1) * measureLen + (beat - 1) * beatLen,
      measure,
      beatPos: beat
    };
  }
}

export class ProgressionPatternPlayer {
  private progressionData: ChordProgressionEntry[];
  private currentIndex: number = 0;
  
  constructor(private stage: RhythmFantasyStage) {
    this.progressionData = stage.chord_progression_data || [];
    // Sort by measure and beat
    this.progressionData.sort((a, b) => {
      if (a.measure !== b.measure) return a.measure - b.measure;
      return a.beat - b.beat;
    });
  }
  
  next(): RhythmQuestion | null {
    if (this.progressionData.length === 0) return null;
    
    const entry = this.progressionData[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.progressionData.length;
    
    const bpm = this.stage.bpm || 120;
    const timeSig = this.stage.time_signature || 4;
    const measureLen = (60 / bpm) * timeSig;
    const beatLen = 60 / bpm;
    
    return {
      id: `${entry.chord}_m${entry.measure}_b${entry.beat}`,
      chord: entry.chord,
      absSec: (entry.measure - 1) * measureLen + (entry.beat - 1) * beatLen,
      measure: entry.measure,
      beatPos: entry.beat
    };
  }
  
  reset(): void {
    this.currentIndex = 0;
  }
}

export function buildRandomGenerator(stage: RhythmFantasyStage): (nextMeasure: number) => RhythmQuestion {
  const generator = new RandomPatternGenerator(stage);
  return (nextMeasure: number) => generator.next(nextMeasure);
}

export function buildProgressionPlayer(stage: RhythmFantasyStage): ProgressionPatternPlayer {
  return new ProgressionPatternPlayer(stage);
}