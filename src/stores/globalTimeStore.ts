import { create } from 'zustand';
import { devLog } from '@/utils/logger';

// エラーハンドリングを追加
try {
  devLog.debug('🕐 GlobalTimeStore: Module loading');
} catch (e) {
  console.error('GlobalTimeStore: Module loading error', e);
}

interface GlobalTimeState {
  // Time management
  currentTime: number; // Current time in milliseconds
  startTime: number; // Start time of the music
  isPlaying: boolean; // Music playing state
  
  // Music properties
  bpm: number; // Beats per minute
  timeSignature: number; // 3 or 4
  loopMeasures: number; // Number of measures before looping
  loopStartTime: number; // Time when loop starts (for offset calculation)
  
  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setMusicProperties: (bpm: number, timeSignature: number, loopMeasures: number) => void;
  setLoopStartTime: (time: number) => void;
  resetTimeState: () => void;
  
  // Calculated values
  getMeasureBeat: () => { measure: number; beat: number };
  getTimeForMeasureBeat: (measure: number, beat: number) => number;
  checkTimingWindow: (targetTime: number, tolerance: number) => boolean;
}

export const useGlobalTimeStore = create<GlobalTimeState>((set, get) => {
  devLog.debug('🕐 GlobalTimeStore: Creating store');
  return {
  // Initial state
  currentTime: 0,
  startTime: 0,
  isPlaying: false,
  bpm: 120,
  timeSignature: 4,
  loopMeasures: 8,
  loopStartTime: 0,
  
  // Actions
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setIsPlaying: (playing) => {
    if (playing && get().startTime === 0) {
      set({ startTime: Date.now(), isPlaying: true });
    } else {
      set({ isPlaying: playing });
    }
  },
  
  setMusicProperties: (bpm, timeSignature, loopMeasures) => {
    set({ bpm, timeSignature, loopMeasures });
    devLog.debug('Music properties set:', { bpm, timeSignature, loopMeasures });
  },
  
  setLoopStartTime: (time) => set({ loopStartTime: time }),
  
  resetTimeState: () => set({
    currentTime: 0,
    startTime: 0,
    isPlaying: false,
    loopStartTime: 0
  }),
  
  // Calculated values
        getMeasureBeat: () => {
        const state = get();
        const { currentTime, bpm, timeSignature, loopMeasures } = state;

        // Calculate beat duration in milliseconds
        const beatDuration = 60000 / bpm; // ms per beat
        const measureDuration = beatDuration * timeSignature; // ms per measure
        const totalDuration = measureDuration * loopMeasures; // Total duration before loop

        // Handle looping: after loopMeasures, go back to measure 2
        let effectiveTime = currentTime;
        if (currentTime >= totalDuration) {
          // Calculate time within the loop (measures 2 to loopMeasures)
          const loopDuration = measureDuration * (loopMeasures - 1); // Duration of measures 2 to end
          const timeSinceFirstLoop = currentTime - totalDuration;
          const positionInLoop = timeSinceFirstLoop % loopDuration;
          effectiveTime = measureDuration + positionInLoop; // Start from measure 2
        }

        // Calculate current measure and beat
        const totalBeats = effectiveTime / beatDuration;
        const measure = Math.floor(totalBeats / timeSignature) + 1;
        const beatInMeasure = (totalBeats % timeSignature) + 1;

        return { measure, beat: beatInMeasure };
      },
  
  getTimeForMeasureBeat: (measure, beat) => {
    const state = get();
    const { bpm, timeSignature } = state;
    
    // Calculate beat duration in milliseconds
    const beatDuration = 60000 / bpm;
    
    // Calculate total beats from start
    const totalBeats = (measure - 1) * timeSignature + (beat - 1);
    
    // Return time in milliseconds
    return totalBeats * beatDuration;
  },
  
  checkTimingWindow: (targetTime, tolerance = 200) => {
    const currentTime = get().currentTime;
    const difference = Math.abs(currentTime - targetTime);
    return difference <= tolerance;
  }
  };
});