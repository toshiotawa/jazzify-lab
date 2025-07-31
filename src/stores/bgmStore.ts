/**
 * BGM and timing management store
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface BgmState {
  // Audio state
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  
  // Timing state
  startTime: number;
  currentTime: number;
  bpm: number;
  beatsPerMeasure: number;
  countInMeasures: number;
  measureCount: number;
  
  // Current position
  currentMeasure: number;
  currentBeat: number;
  
  // Ready phase
  isReadyPhase: boolean;
  readyStartTime: number;
  
  // Actions
  initialize: (url: string, bpm: number, beatsPerMeasure: number, measureCount: number, countInMeasures: number) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  updateTime: () => void;
  startReadyPhase: () => void;
  cleanup: () => void;
}

const READY_PHASE_DURATION = 2000; // 2 seconds in milliseconds

export const useBgmStore = create<BgmState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        audio: null,
        isPlaying: false,
        isLoading: false,
        volume: 0.7,
        
        startTime: 0,
        currentTime: 0,
        bpm: 120,
        beatsPerMeasure: 4,
        countInMeasures: 2,
        measureCount: 8,
        
        currentMeasure: 0,
        currentBeat: 0,
        
        isReadyPhase: false,
        readyStartTime: 0,
        
        // Initialize BGM
        initialize: async (url, bpm, beatsPerMeasure, measureCount, countInMeasures) => {
          set((state) => {
            state.isLoading = true;
            state.bpm = bpm;
            state.beatsPerMeasure = beatsPerMeasure;
            state.measureCount = measureCount;
            state.countInMeasures = countInMeasures;
          });
          
          try {
            // Clean up existing audio
            const { audio: existingAudio } = get();
            if (existingAudio) {
              existingAudio.pause();
              existingAudio.src = '';
            }
            
            // Create new audio element
            const audio = new Audio(url);
            audio.volume = get().volume;
            audio.loop = false; // We'll handle looping manually
            
            // Wait for audio to be ready
            await new Promise<void>((resolve, reject) => {
              audio.addEventListener('canplaythrough', () => resolve(), { once: true });
              audio.addEventListener('error', () => reject(new Error('Failed to load BGM')), { once: true });
              audio.load();
            });
            
            set({
              audio: audio,
              isLoading: false
            });
          } catch (error) {
            console.error('Failed to initialize BGM:', error);
            set((state) => {
              state.isLoading = false;
            });
            throw error;
          }
        },
        
        // Start ready phase
        startReadyPhase: () => {
          set((state) => {
            state.isReadyPhase = true;
            state.readyStartTime = Date.now();
            state.startTime = Date.now() + READY_PHASE_DURATION;
          });
          
          // Auto-start BGM after ready phase
          setTimeout(() => {
            const state = get();
            if (state.isReadyPhase) {
              set((draft) => {
                draft.isReadyPhase = false;
              });
              state.play();
            }
          }, READY_PHASE_DURATION);
        },
        
        // Play BGM
        play: () => {
          const { audio, isReadyPhase } = get();
          if (!audio || isReadyPhase) return;
          
          audio.play().catch(console.error);
          set((state) => {
            state.isPlaying = true;
            if (state.startTime === 0) {
              state.startTime = Date.now();
            }
          });
        },
        
        // Pause BGM
        pause: () => {
          const { audio } = get();
          if (!audio) return;
          
          audio.pause();
          set((state) => {
            state.isPlaying = false;
          });
        },
        
        // Stop BGM
        stop: () => {
          const { audio } = get();
          if (!audio) return;
          
          audio.pause();
          audio.currentTime = 0;
          set((state) => {
            state.isPlaying = false;
            state.currentTime = 0;
            state.currentMeasure = 0;
            state.currentBeat = 0;
            state.startTime = 0;
          });
        },
        
        // Set volume
        setVolume: (volume: number) => {
          const { audio } = get();
          const clampedVolume = Math.max(0, Math.min(1, volume));
          
          if (audio) {
            audio.volume = clampedVolume;
          }
          
          set((state) => {
            state.volume = clampedVolume;
          });
        },
        
        // Update timing information
        updateTime: () => {
          const state = get();
          const { audio, isPlaying, startTime, bpm, beatsPerMeasure, measureCount, countInMeasures } = state;
          
          if (!isPlaying || !audio || startTime === 0) return;
          
          // Calculate current time in seconds
          const elapsedMs = Date.now() - startTime;
          const elapsedSeconds = elapsedMs / 1000;
          
          // Calculate beat duration
          const beatDuration = 60 / bpm; // seconds per beat
          const measureDuration = beatDuration * beatsPerMeasure;
          
          // Calculate current position
          const totalBeats = Math.floor(elapsedSeconds / beatDuration);
          const currentMeasure = Math.floor(totalBeats / beatsPerMeasure) + 1;
          const currentBeat = (totalBeats % beatsPerMeasure) + 1;
          
          // Handle looping
          if (currentMeasure > measureCount && audio.currentTime > 0) {
            // Calculate loop point (after count-in measures)
            const loopStartTime = countInMeasures * measureDuration;
            
            // Jump back to start of loop
            audio.currentTime = loopStartTime;
            
            // Reset timing
            const newStartTime = Date.now() - (loopStartTime * 1000);
            set((draft) => {
              draft.startTime = newStartTime;
              draft.currentMeasure = countInMeasures + 1;
              draft.currentBeat = 1;
            });
          } else {
            set((draft) => {
              draft.currentTime = elapsedSeconds;
              draft.currentMeasure = currentMeasure;
              draft.currentBeat = currentBeat;
            });
          }
        },
        
        // Cleanup
        cleanup: () => {
          const { audio } = get();
          if (audio) {
            audio.pause();
            audio.src = '';
          }
          
          set({
            audio: null,
            isPlaying: false,
            isLoading: false,
            currentTime: 0,
            currentMeasure: 0,
            currentBeat: 0,
            startTime: 0,
            isReadyPhase: false,
            readyStartTime: 0
          });
        }
      }))
    ),
    {
      name: 'bgm-store'
    }
  )
);

// Start update loop
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useBgmStore.getState();
    if (state.isPlaying) {
      state.updateTime();
    }
  }, 50); // Update 20 times per second
}