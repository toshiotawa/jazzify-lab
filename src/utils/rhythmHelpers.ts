import type { ChordProgressionData } from '@/types/rhythm';
import type { FantasyStage } from '@/types';

/**
 * Generate sample progression data for development/testing
 */
export function generateSampleProgression(
  chords: string[],
  measures: number,
  timeSignature: number
): ChordProgressionData[] {
  const progression: ChordProgressionData[] = [];
  
  chords.forEach((chord, index) => {
    const measure = Math.floor(index / 2) + 1; // 2 chords per measure
    const beat = (index % 2) * (timeSignature / 2) + 1; // 1st or 3rd beat
    
    if (measure <= measures) {
      progression.push({
        chord,
        measure,
        beat
      });
    }
  });
  
  return progression;
}

/**
 * Calculate average interval between chords for gauge speed
 */
export function calculateAverageChordInterval(stage: FantasyStage): number {
  if (stage.rhythm_pattern === 'random' || !stage.chord_progression_data) {
    // For random pattern, assume one chord per measure
    const measureDuration = (60000 * (stage.time_signature || 4)) / (stage.bpm || 120);
    return measureDuration;
  }
  
  // For progression pattern, calculate actual intervals
  const progressionData = stage.chord_progression_data;
  if (progressionData.length <= 1) {
    const measureDuration = (60000 * (stage.time_signature || 4)) / (stage.bpm || 120);
    return measureDuration;
  }
  
  let totalInterval = 0;
  const measureDuration = (60000 * (stage.time_signature || 4)) / (stage.bpm || 120);
  const beatDuration = measureDuration / (stage.time_signature || 4);
  
  for (let i = 1; i < progressionData.length; i++) {
    const prevTiming = ((progressionData[i-1].measure - 1) * measureDuration) + 
                      ((progressionData[i-1].beat - 1) * beatDuration);
    const currentTiming = ((progressionData[i].measure - 1) * measureDuration) + 
                         ((progressionData[i].beat - 1) * beatDuration);
    totalInterval += (currentTiming - prevTiming);
  }
  
  return totalInterval / (progressionData.length - 1);
}

/**
 * Validate rhythm stage configuration
 */
export function isValidRhythmStage(stage: FantasyStage): boolean {
  if (stage.game_type !== 'rhythm') return true;
  
  // Check required fields
  if (!stage.bpm || stage.bpm < 60 || stage.bpm > 200) return false;
  if (!stage.time_signature || ![3, 4].includes(stage.time_signature)) return false;
  if (!stage.loop_measures || stage.loop_measures < 4 || stage.loop_measures > 32) return false;
  
  // Check pattern-specific requirements
  if (stage.rhythm_pattern === 'progression') {
    if (!stage.chord_progression_data || stage.chord_progression_data.length === 0) {
      return false;
    }
  } else if (stage.rhythm_pattern === 'random') {
    if (!stage.allowed_chords || stage.allowed_chords.length === 0) {
      return false;
    }
  }
  
  return true;
}