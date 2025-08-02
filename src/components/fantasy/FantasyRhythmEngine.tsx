/**
 * ファンタジーリズムゲームエンジン
 * リズムモード専用のゲームロジック
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { devLog } from '@/utils/logger';
import { useTimeStore } from '@/stores/timeStore';

interface ChordProgressionEntry {
  measure: number;
  beat: number;
  chord: string;
}

interface RhythmJudgment {
  chord: string;
  measure: number;
  beat: number;
  windowStart: number; // ms
  windowEnd: number; // ms
  judged: boolean;
  success: boolean;
}

export interface RhythmGameState {
  currentChord: string | null;
  nextChord: string | null;
  judgments: RhythmJudgment[];
  currentJudgmentIndex: number;
  isProgressionMode: boolean;
  chordQueue: string[]; // For random mode
}

interface UseRhythmEngineProps {
  stage: {
    mode: string;
    allowedChords: string[];
    chordProgressionData?: {
      chords: ChordProgressionEntry[];
    };
    bpm: number;
    timeSignature: number;
    measureCount: number;
    countInMeasures: number;
  };
  onChordSuccess: (chord: string) => void;
  onChordMiss: (chord: string) => void;
  onChordChange: (chord: string) => void;
}

const JUDGMENT_WINDOW_MS = 200; // 前後200ms
const CHORD_APPEAR_ADVANCE_BEATS = 2; // コードを2拍前に表示

export function useRhythmEngine({
  stage,
  onChordSuccess,
  onChordMiss,
  onChordChange
}: UseRhythmEngineProps) {
  const { startAt, readyDuration } = useTimeStore();
  
  // State for UI display
  const [rhythmState, setRhythmState] = useState<RhythmGameState>({
    currentChord: null,
    nextChord: null,
    judgments: [],
    currentJudgmentIndex: 0,
    isProgressionMode: !!stage.chordProgressionData,
    chordQueue: []
  });
  
  // Refs for internal tracking
  const judgmentsRef = useRef<RhythmJudgment[]>([]);
  const currentIndexRef = useRef<number>(0);
  const lastChordRef = useRef<string | null>(null);
  const loopCountRef = useRef<number>(0);

  // Calculate timing in ms from start
  const getMsFromMeasureBeat = useCallback((measure: number, beat: number) => {
    const msPerBeat = 60000 / stage.bpm;
    const beatsFromStart = (measure - 1) * stage.timeSignature + (beat - 1);
    return readyDuration + beatsFromStart * msPerBeat;
  }, [stage.bpm, stage.timeSignature, readyDuration]);

  // Generate initial judgments
  const generateInitialJudgments = useCallback(() => {
    const judgments: RhythmJudgment[] = [];
    
    if (stage.chordProgressionData) {
      // Progression mode
      stage.chordProgressionData.chords.forEach(entry => {
        const timing = getMsFromMeasureBeat(entry.measure, entry.beat);
        judgments.push({
          chord: entry.chord,
          measure: entry.measure,
          beat: entry.beat,
          windowStart: timing - JUDGMENT_WINDOW_MS,
          windowEnd: timing + JUDGMENT_WINDOW_MS,
          judged: false,
          success: false
        });
      });
    } else {
      // Random mode - pre-generate pattern
      for (let i = 0; i < stage.measureCount; i++) {
        const chord = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
        const measure = stage.countInMeasures + 1 + i;
        const timing = getMsFromMeasureBeat(measure, 1);
        judgments.push({
          chord,
          measure,
          beat: 1,
          windowStart: timing - JUDGMENT_WINDOW_MS,
          windowEnd: timing + JUDGMENT_WINDOW_MS,
          judged: false,
          success: false
        });
      }
    }
    
    return judgments;
  }, [stage, getMsFromMeasureBeat]);

  // Initialize
  useEffect(() => {
    if (stage.mode !== 'rhythm' || !startAt) return;
    
    const initialJudgments = generateInitialJudgments();
    judgmentsRef.current = initialJudgments;
    currentIndexRef.current = 0;
    loopCountRef.current = 0;
    lastChordRef.current = null;
    
    // Set initial state
    setRhythmState({
      currentChord: initialJudgments[0]?.chord || null,
      nextChord: initialJudgments[1]?.chord || null,
      judgments: initialJudgments,
      currentJudgmentIndex: 0,
      isProgressionMode: !!stage.chordProgressionData,
      chordQueue: []
    });
    
    // Trigger initial chord change
    if (initialJudgments[0]) {
      onChordChange(initialJudgments[0].chord);
      lastChordRef.current = initialJudgments[0].chord;
    }
    
    devLog.debug('Rhythm engine initialized', { 
      judgmentCount: initialJudgments.length,
      firstChord: initialJudgments[0]?.chord 
    });
  }, [stage, startAt, generateInitialJudgments, onChordChange]);

  // Main update loop
  useEffect(() => {
    if (!startAt || stage.mode !== 'rhythm') return;
    
    const updateRhythmState = () => {
      const currentTime = performance.now() - startAt;
      const currentMs = currentTime - readyDuration;
      
      if (currentMs < 0) return; // Still in ready phase
      
      const currentIndex = currentIndexRef.current;
      const judgments = judgmentsRef.current;
      
      // Check if we need to handle missed judgments
      for (let i = currentIndex; i < judgments.length; i++) {
        const judgment = judgments[i];
        
        if (!judgment.judged && currentMs > judgment.windowEnd) {
          // Missed judgment
          judgment.judged = true;
          judgment.success = false;
          onChordMiss(judgment.chord);
          currentIndexRef.current = i + 1;
          
          devLog.debug('Judgment missed', { chord: judgment.chord, index: i });
        } else {
          // Haven't reached this judgment yet
          break;
        }
      }
      
      // Check if we need to generate more judgments for looping
      const remainingJudgments = judgments.length - currentIndexRef.current;
      if (remainingJudgments < 4) {
        // Generate next loop's judgments
        const newJudgments: RhythmJudgment[] = [];
        loopCountRef.current++;
        
        const loopOffsetMs = loopCountRef.current * stage.measureCount * stage.timeSignature * (60000 / stage.bpm);
        
        if (stage.chordProgressionData) {
          // Progression mode - repeat the pattern
          stage.chordProgressionData.chords.forEach(entry => {
            const timing = getMsFromMeasureBeat(entry.measure, entry.beat) + loopOffsetMs;
            newJudgments.push({
              chord: entry.chord,
              measure: entry.measure + (loopCountRef.current * stage.measureCount),
              beat: entry.beat,
              windowStart: timing - JUDGMENT_WINDOW_MS,
              windowEnd: timing + JUDGMENT_WINDOW_MS,
              judged: false,
              success: false
            });
          });
        } else {
          // Random mode - generate new random pattern
          for (let i = 0; i < stage.measureCount; i++) {
            const chord = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
            const measure = stage.countInMeasures + 1 + i + (loopCountRef.current * stage.measureCount);
            const timing = getMsFromMeasureBeat(measure, 1) + loopOffsetMs;
            newJudgments.push({
              chord,
              measure,
              beat: 1,
              windowStart: timing - JUDGMENT_WINDOW_MS,
              windowEnd: timing + JUDGMENT_WINDOW_MS,
              judged: false,
              success: false
            });
          }
        }
        
        // Append new judgments
        judgmentsRef.current = [...judgmentsRef.current, ...newJudgments];
        devLog.debug('Generated new loop judgments', { count: newJudgments.length, loop: loopCountRef.current });
      }
      
      // Update current/next chord display
      const updatedCurrentIndex = currentIndexRef.current;
      const currentJudgment = judgmentsRef.current[updatedCurrentIndex];
      const nextJudgment = judgmentsRef.current[updatedCurrentIndex + 1];
      
      // Only update state if chord has changed
      if (currentJudgment && currentJudgment.chord !== lastChordRef.current) {
        lastChordRef.current = currentJudgment.chord;
        onChordChange(currentJudgment.chord);
        
        setRhythmState(prev => ({
          ...prev,
          currentChord: currentJudgment.chord,
          nextChord: nextJudgment?.chord || null,
          judgments: [...judgmentsRef.current],
          currentJudgmentIndex: updatedCurrentIndex
        }));
      }
    };
    
    const interval = setInterval(updateRhythmState, 50);
    return () => clearInterval(interval);
  }, [stage, startAt, readyDuration, onChordMiss, onChordChange]);

  // Judge chord input
  const judgeChordInput = useCallback((inputChord: string) => {
    if (!startAt || stage.mode !== 'rhythm') return false;
    
    const currentTime = performance.now() - startAt;
    const currentMs = currentTime - readyDuration;
    
    const currentIndex = currentIndexRef.current;
    const currentJudgment = judgmentsRef.current[currentIndex];
    
    if (!currentJudgment || currentJudgment.judged) return false;
    
    // Check if within judgment window
    if (currentMs >= currentJudgment.windowStart && currentMs <= currentJudgment.windowEnd) {
      if (inputChord === currentJudgment.chord) {
        // Success!
        currentJudgment.judged = true;
        currentJudgment.success = true;
        currentIndexRef.current++;
        onChordSuccess(inputChord);
        
        // Update display immediately
        const nextIndex = currentIndexRef.current;
        const nextJudgment = judgmentsRef.current[nextIndex];
        const nextNextJudgment = judgmentsRef.current[nextIndex + 1];
        
        if (nextJudgment) {
          lastChordRef.current = nextJudgment.chord;
          onChordChange(nextJudgment.chord);
          
          setRhythmState(prev => ({
            ...prev,
            currentChord: nextJudgment.chord,
            nextChord: nextNextJudgment?.chord || null,
            judgments: [...judgmentsRef.current],
            currentJudgmentIndex: nextIndex
          }));
        }
        
        devLog.debug('Judgment success', { chord: inputChord });
        return true;
      }
    }
    
    return false;
  }, [stage, startAt, readyDuration, onChordSuccess, onChordChange]);

  return {
    rhythmState,
    judgeChordInput,
    getCurrentTiming: () => {
      if (!startAt) return 0;
      return performance.now() - startAt - readyDuration;
    }
  };
}