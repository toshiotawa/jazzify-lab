import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import type { ChordProgressionData, RhythmState, AudioState } from '@/types/rhythm';
import type { FantasyStage } from '@/types';

// Store interface
interface RhythmStore {
  // State
  rhythmState: RhythmState;
  audioState: AudioState;
  
  // Stage info
  bpm: number;
  timeSignature: number;
  loopMeasures: number;
  rhythmPattern: 'random' | 'progression';
  allowedChords: string[];
  progressionData: ChordProgressionData[];
  
  // Actions
  initializeRhythm: (stage: FantasyStage) => void;
  loadAudio: (url: string) => Promise<void>;
  startMusic: () => void;
  pauseMusic: () => void;
  updateTime: (time: number) => void;
  checkTiming: (inputChord: string, inputTime: number) => boolean;
  getNextRandomChord: () => string;
  getNextProgressionChord: () => ChordProgressionData | null;
  resetToLoop: () => void;
  cleanup: () => void;
}

const initialRhythmState: RhythmState = {
  isPlaying: false,
  currentTime: 0,
  currentMeasure: 1,
  currentBeat: 1,
  nextChordTiming: 0,
  nextChord: null,
  judgmentWindow: 200, // 200ms
  progressionIndex: 0,
  totalProgressionLength: 0
};

const initialAudioState: AudioState = {
  audio: null,
  isLoaded: false,
  duration: 0,
  loopStartTime: 0,
  loopEndTime: 0
};

export const useRhythmStore = createWithEqualityFn<RhythmStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      rhythmState: initialRhythmState,
      audioState: initialAudioState,
      bpm: 120,
      timeSignature: 4,
      loopMeasures: 8,
      rhythmPattern: 'random',
      allowedChords: [],
      progressionData: [],

      // Initialize rhythm system
      initializeRhythm: (stage) => {
        set({
          bpm: stage.bpm || 120,
          timeSignature: stage.time_signature || 4,
          loopMeasures: stage.loop_measures || 8,
          rhythmPattern: stage.rhythm_pattern || 'random',
          allowedChords: stage.allowed_chords || [],
          progressionData: stage.chord_progression_data || [],
          rhythmState: {
            ...initialRhythmState,
            totalProgressionLength: (stage.chord_progression_data || []).length
          }
        });
      },

      // Load audio file
      loadAudio: async (url: string) => {
        const { bpm, timeSignature, loopMeasures } = get();
        
        const audio = new Audio(url);
        audio.preload = 'auto';
        
        return new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', () => {
            // Calculate loop times (2nd measure start, loop end)
            const measureDuration = (60 * timeSignature) / bpm;
            const loopStartTime = measureDuration; // 2nd measure start
            const loopEndTime = measureDuration * loopMeasures;
            
            // Setup loop handling
            audio.addEventListener('timeupdate', () => {
              const currentTime = audio.currentTime * 1000; // Convert to ms
              
              // Handle loop
              if (audio.currentTime >= loopEndTime) {
                audio.currentTime = loopStartTime;
                get().resetToLoop();
              }
              
              get().updateTime(currentTime);
            });
            
            set({
              audioState: {
                audio,
                isLoaded: true,
                duration: audio.duration,
                loopStartTime: loopStartTime * 1000, // Convert to ms
                loopEndTime: loopEndTime * 1000
              }
            });
            
            resolve();
          });
          
          audio.addEventListener('error', reject);
        });
      },

      // Start music
      startMusic: () => {
        const { audioState } = get();
        if (audioState.audio && audioState.isLoaded) {
          void audioState.audio.play();
          set((state) => ({
            rhythmState: { ...state.rhythmState, isPlaying: true }
          }));
        }
      },

      // Pause music
      pauseMusic: () => {
        const { audioState } = get();
        if (audioState.audio) {
          audioState.audio.pause();
          set((state) => ({
            rhythmState: { ...state.rhythmState, isPlaying: false }
          }));
        }
      },

      // Update current time and calculate position
      updateTime: (time: number) => {
        const { bpm, timeSignature } = get();
        const measureDuration = (60000 * timeSignature) / bpm; // ms per measure
        const beatDuration = measureDuration / timeSignature;
        
        const currentMeasure = Math.floor(time / measureDuration) + 1;
        const timeInMeasure = time % measureDuration;
        const currentBeat = Math.floor(timeInMeasure / beatDuration) + 1;
        
        set((state) => ({
          rhythmState: {
            ...state.rhythmState,
            currentTime: time,
            currentMeasure,
            currentBeat
          }
        }));
      },

      // Check timing judgment
      checkTiming: (inputChord: string, inputTime: number) => {
        const { rhythmState } = get();
        const timeDiff = Math.abs(inputTime - rhythmState.nextChordTiming);
        return timeDiff <= rhythmState.judgmentWindow && inputChord === rhythmState.nextChord;
      },

      // Get next random chord
      getNextRandomChord: () => {
        const { allowedChords } = get();
        if (allowedChords.length === 0) return 'C';
        
        const randomIndex = Math.floor(Math.random() * allowedChords.length);
        return allowedChords[randomIndex];
      },

      // Get next progression chord
      getNextProgressionChord: () => {
        const { progressionData, rhythmState } = get();
        if (progressionData.length === 0) return null;
        
        const chord = progressionData[rhythmState.progressionIndex];
        
        // Advance to next chord (with wrap-around)
        set((state) => ({
          rhythmState: {
            ...state.rhythmState,
            progressionIndex: (state.rhythmState.progressionIndex + 1) % progressionData.length
          }
        }));
        
        return chord;
      },

      // Reset to loop (maintain progression state)
      resetToLoop: () => {
        // Note: Progression index is NOT reset - this maintains continuous progression
      },

      // Cleanup
      cleanup: () => {
        const { audioState } = get();
        if (audioState.audio) {
          audioState.audio.pause();
          audioState.audio.src = '';
        }
        
        set({
          rhythmState: initialRhythmState,
          audioState: initialAudioState
        });
      }
    }),
    { name: 'rhythm-store' }
  )
);