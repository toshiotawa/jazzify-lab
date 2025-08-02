/**
 * ファンタジーリズムゲームエンジン
 * リズムモード専用のゲームロジック
 */

import { devLog } from '@/utils/logger';
import { useTimeStore } from '@/stores/timeStore';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useRhythmEngine({
  stage,
  onChordSuccess,
  onChordMiss,
  onChordChange
}: UseRhythmEngineProps) {
  const { startAt, readyDuration } = useTimeStore();
  const [rhythmState, setRhythmState] = useState<RhythmGameState>({
    currentChord: null,
    nextChord: null,
    judgments: [],
    currentJudgmentIndex: 0,
    isProgressionMode: !!stage.chordProgressionData,
    chordQueue: []
  });
  
  // const lastProcessedMeasureRef = useRef<number>(0);
  // const lastProcessedBeatRef = useRef<number>(0);
  const judgmentsRef = useRef<RhythmJudgment[]>([]);

  // Calculate timing in ms from start
  const getMsFromMeasureBeat = useCallback((measure: number, beat: number) => {
    if (!startAt) return 0;
    const msPerBeat = 60000 / stage.bpm;
    const beatsFromStart = (measure - 1) * stage.timeSignature + (beat - 1);
    return readyDuration + beatsFromStart * msPerBeat;
  }, [stage.bpm, stage.timeSignature, startAt, readyDuration]);

  // Initialize chord progression or random pattern
  useEffect(() => {
    if (stage.mode !== 'rhythm') return;
    
    const judgments: RhythmJudgment[] = [];
    
    if (stage.chordProgressionData) {
      // Progression mode
      const sortedChords = [...stage.chordProgressionData.chords].sort((a, b) => {
        if (a.measure !== b.measure) return a.measure - b.measure;
        return a.beat - b.beat;
      });
      
      sortedChords.forEach(entry => {
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
      // Random mode - generate chords for each measure
      for (let measure = stage.countInMeasures + 1; measure <= stage.countInMeasures + stage.measureCount; measure++) {
        const chord = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
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
    
    judgmentsRef.current = judgments;
    setRhythmState(prev => ({
      ...prev,
      judgments,
      currentChord: judgments[0]?.chord || null,
      nextChord: judgments[1]?.chord || null
    }));
    
    if (judgments[0]) {
      onChordChange(judgments[0].chord);
    }
  }, [stage, getMsFromMeasureBeat, onChordChange]);

  // Check for missed judgments and update current chord
  useEffect(() => {
    if (!startAt || stage.mode !== 'rhythm') return;
    
    const checkJudgments = () => {
      const currentTime = performance.now() - startAt;
      const currentMs = currentTime - readyDuration;
      
      // Skip during count-in
      if (currentMs < 0) return;
      
      let currentIndex = rhythmState.currentJudgmentIndex;
      let updated = false;
      
      // Check for missed judgments
      while (currentIndex < judgmentsRef.current.length) {
        const judgment = judgmentsRef.current[currentIndex];
        
        if (!judgment.judged && currentMs > judgment.windowEnd) {
          // Missed this judgment
          judgment.judged = true;
          judgment.success = false;
          onChordMiss(judgment.chord);
          currentIndex++;
          updated = true;
          devLog.debug('Rhythm judgment missed:', judgment);
        } else {
          break;
        }
      }
      
      // Handle looping
      if (currentIndex >= judgmentsRef.current.length && !stage.chordProgressionData) {
        // Random mode - generate new chords for the loop
        const newJudgments: RhythmJudgment[] = [];
        const loopCount = Math.floor(currentIndex / stage.measureCount);
        const baseMs = getMsFromMeasureBeat(stage.countInMeasures + 1, 1) + loopCount * stage.measureCount * stage.timeSignature * (60000 / stage.bpm);
        
        for (let i = 0; i < stage.measureCount; i++) {
          const chord = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
          const timing = baseMs + i * stage.timeSignature * (60000 / stage.bpm);
          newJudgments.push({
            chord,
            measure: stage.countInMeasures + 1 + i,
            beat: 1,
            windowStart: timing - JUDGMENT_WINDOW_MS,
            windowEnd: timing + JUDGMENT_WINDOW_MS,
            judged: false,
            success: false
          });
        }
        
        judgmentsRef.current = [...judgmentsRef.current, ...newJudgments];
        updated = true;
      } else if (currentIndex >= judgmentsRef.current.length && stage.chordProgressionData) {
        // Progression mode - loop back to start
        currentIndex = 0;
        judgmentsRef.current.forEach(j => {
          j.judged = false;
          j.success = false;
        });
        updated = true;
      }
      
      if (updated) {
        const current = judgmentsRef.current[currentIndex];
        const next = judgmentsRef.current[currentIndex + 1];
        
        setRhythmState(prev => ({
          ...prev,
          currentJudgmentIndex: currentIndex,
          currentChord: current?.chord || null,
          nextChord: next?.chord || null,
          judgments: [...judgmentsRef.current]
        }));
        
        if (current) {
          onChordChange(current.chord);
        }
      }
    };
    
    const interval = setInterval(checkJudgments, 50);
    return () => clearInterval(interval);
  }, [stage, startAt, readyDuration, rhythmState.currentJudgmentIndex, getMsFromMeasureBeat, onChordMiss, onChordChange]);

  // Judge chord input
  const judgeChordInput = useCallback((inputChord: string) => {
    if (!startAt || stage.mode !== 'rhythm') return false;
    
    const currentTime = performance.now() - startAt;
    const currentMs = currentTime - readyDuration;
    
    const currentJudgment = judgmentsRef.current[rhythmState.currentJudgmentIndex];
    if (!currentJudgment || currentJudgment.judged) return false;
    
    // Check if within judgment window
    if (currentMs >= currentJudgment.windowStart && currentMs <= currentJudgment.windowEnd) {
      if (inputChord === currentJudgment.chord) {
        // Success!
        currentJudgment.judged = true;
        currentJudgment.success = true;
        onChordSuccess(inputChord);
        
        // Move to next chord
        const nextIndex = rhythmState.currentJudgmentIndex + 1;
        let nextJudgment = judgmentsRef.current[nextIndex];
        
        // Handle looping
        if (!nextJudgment) {
          if (!stage.chordProgressionData) {
            // Random mode - generate new chord
            const loopCount = Math.floor(nextIndex / stage.measureCount);
            const measureInLoop = nextIndex % stage.measureCount;
            const baseMs = getMsFromMeasureBeat(stage.countInMeasures + 1, 1) + loopCount * stage.measureCount * stage.timeSignature * (60000 / stage.bpm);
            const timing = baseMs + measureInLoop * stage.timeSignature * (60000 / stage.bpm);
            
            const newChord = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
            nextJudgment = {
              chord: newChord,
              measure: stage.countInMeasures + 1 + measureInLoop,
              beat: 1,
              windowStart: timing - JUDGMENT_WINDOW_MS,
              windowEnd: timing + JUDGMENT_WINDOW_MS,
              judged: false,
              success: false
            };
            judgmentsRef.current.push(nextJudgment);
          } else {
            // Progression mode - loop to start
            judgmentsRef.current.forEach(j => {
              j.judged = false;
              j.success = false;
            });
            nextJudgment = judgmentsRef.current[0];
          }
        }
        
        const nextNext = judgmentsRef.current[nextIndex + 1] || judgmentsRef.current[0];
        
        setRhythmState(prev => ({
          ...prev,
          currentJudgmentIndex: stage.chordProgressionData && !judgmentsRef.current[nextIndex] ? 0 : nextIndex,
          currentChord: nextJudgment?.chord || null,
          nextChord: nextNext?.chord || null,
          judgments: [...judgmentsRef.current]
        }));
        
        if (nextJudgment) {
          onChordChange(nextJudgment.chord);
        }
        
        devLog.debug('Rhythm judgment success:', currentJudgment);
        return true;
      }
    }
    
    return false;
  }, [stage, startAt, readyDuration, rhythmState.currentJudgmentIndex, getMsFromMeasureBeat, onChordSuccess, onChordChange]);

  return {
    rhythmState,
    judgeChordInput,
    getCurrentTiming: () => {
      if (!startAt) return 0;
      return performance.now() - startAt - readyDuration;
    }
  };
}