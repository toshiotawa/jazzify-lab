/**
 * Global Time Store for Rhythm Mode
 * Manages unified time tracking for music playback and timing judgment
 */

import { create } from 'zustand';
import { devlog } from 'zustand/middleware';
import * as Tone from 'tone';

interface GlobalTimeState {
  // Time management
  currentTime: number; // Current playback time in seconds
  isPlaying: boolean; // Whether music is currently playing
  startTime: number; // When playback started (Tone.now())
  
  // Music properties
  bpm: number; // Beats per minute
  timeSignature: number; // 3 or 4
  loopMeasures: number; // Total measures before loop
  loopStartMeasure: number; // Which measure to loop back to (usually 2)
  
  // Rhythm data
  rhythmData: Array<{
    chord: string;
    measure: number;
    beat: number; // e.g., 1.5 for beat 1.5
  }>;
  
  // Audio player reference
  player: Tone.Player | null;
  
  // Actions
  initializePlayer: (mp3Url: string) => Promise<void>;
  startPlayback: () => void;
  stopPlayback: () => void;
  updateCurrentTime: () => number; // Returns current measure.beat
  setMusicProperties: (bpm: number, timeSignature: number, loopMeasures: number) => void;
  setRhythmData: (data: Array<{ chord: string; measure: number; beat: number }>) => void;
  reset: () => void;
  
  // Utility functions
  getCurrentMeasureAndBeat: () => { measure: number; beat: number };
  isWithinTimingWindow: (targetMeasure: number, targetBeat: number, windowMs?: number) => boolean;
}

export const useGlobalTimeStore = create<GlobalTimeState>()(
  devlog(
    (set, get) => ({
      // Initial state
      currentTime: 0,
      isPlaying: false,
      startTime: 0,
      bpm: 120,
      timeSignature: 4,
      loopMeasures: 8,
      loopStartMeasure: 2,
      rhythmData: [],
      player: null,

      // Initialize audio player with MP3
      initializePlayer: async (mp3Url: string) => {
        const state = get();
        
        // Dispose of existing player
        if (state.player) {
          state.player.dispose();
        }

        // Create new player
        const player = new Tone.Player({
          url: mp3Url,
          loop: false, // We'll handle looping manually for precise control
          onload: () => {
            console.log('MP3 loaded successfully');
          }
        }).toDestination();

        set({ player });
      },

      // Start music playback
      startPlayback: () => {
        const state = get();
        if (!state.player || state.isPlaying) return;

        // Ensure audio context is started
        if (Tone.context.state !== 'running') {
          Tone.start();
        }

        const startTime = Tone.now();
        state.player.start();
        
        set({ 
          isPlaying: true, 
          startTime,
          currentTime: 0 
        });

        // Set up loop scheduling
        const measureDuration = (60 / state.bpm) * state.timeSignature;
        const loopDuration = measureDuration * state.loopMeasures;
        const loopStartTime = measureDuration * (state.loopStartMeasure - 1);

        // Schedule loop
        const scheduleLoop = () => {
          if (!get().isPlaying) return;
          
          // Stop current playback
          state.player?.stop();
          
          // Start from loop point
          state.player?.start(Tone.now(), loopStartTime);
          
          // Update start time to maintain timing continuity
          const currentState = get();
          set({ 
            startTime: Tone.now() - loopStartTime,
          });
          
          // Schedule next loop
          Tone.Transport.scheduleOnce(() => {
            scheduleLoop();
          }, `+${loopDuration - loopStartTime}`);
        };

        // Schedule first loop
        Tone.Transport.scheduleOnce(() => {
          scheduleLoop();
        }, `+${loopDuration}`);
      },

      // Stop music playback
      stopPlayback: () => {
        const state = get();
        if (!state.player) return;

        state.player.stop();
        Tone.Transport.cancel();
        
        set({ 
          isPlaying: false, 
          currentTime: 0,
          startTime: 0 
        });
      },

      // Update current time and return measure.beat
      updateCurrentTime: () => {
        const state = get();
        if (!state.isPlaying) return 0;

        const elapsed = Tone.now() - state.startTime;
        set({ currentTime: elapsed });

        return elapsed;
      },

      // Set music properties
      setMusicProperties: (bpm: number, timeSignature: number, loopMeasures: number) => {
        set({ bpm, timeSignature, loopMeasures });
      },

      // Set rhythm data
      setRhythmData: (data: Array<{ chord: string; measure: number; beat: number }>) => {
        set({ rhythmData: data });
      },

      // Reset store
      reset: () => {
        const state = get();
        state.stopPlayback();
        
        if (state.player) {
          state.player.dispose();
        }

        set({
          currentTime: 0,
          isPlaying: false,
          startTime: 0,
          bpm: 120,
          timeSignature: 4,
          loopMeasures: 8,
          loopStartMeasure: 2,
          rhythmData: [],
          player: null,
        });
      },

      // Get current measure and beat
      getCurrentMeasureAndBeat: () => {
        const state = get();
        if (!state.isPlaying) return { measure: 0, beat: 0 };

        const elapsed = Tone.now() - state.startTime;
        const beatDuration = 60 / state.bpm;
        const measureDuration = beatDuration * state.timeSignature;
        
        // Calculate total beats elapsed
        const totalBeats = elapsed / beatDuration;
        
        // Calculate measure and beat within measure
        const measure = Math.floor(totalBeats / state.timeSignature) + 1;
        const beatInMeasure = (totalBeats % state.timeSignature) + 1;
        
        return { measure, beat: beatInMeasure };
      },

      // Check if current time is within timing window of target
      isWithinTimingWindow: (targetMeasure: number, targetBeat: number, windowMs: number = 200) => {
        const state = get();
        if (!state.isPlaying) return false;

        const { measure, beat } = state.getCurrentMeasureAndBeat();
        const beatDuration = 60 / state.bpm;
        
        // Convert current and target to absolute beat numbers
        const currentAbsoluteBeat = (measure - 1) * state.timeSignature + beat;
        const targetAbsoluteBeat = (targetMeasure - 1) * state.timeSignature + targetBeat;
        
        // Calculate time difference in ms
        const timeDifference = Math.abs((currentAbsoluteBeat - targetAbsoluteBeat) * beatDuration * 1000);
        
        return timeDifference <= windowMs;
      },
    }),
    'globalTimeStore'
  )
);