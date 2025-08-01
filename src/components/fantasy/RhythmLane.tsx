import React, { useMemo, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useTimeStore } from '@/stores/timeStore';

interface RhythmNote {
  chord: string;
  measure: number;
  beat: number;
  id: string;
}

interface RhythmLaneProps {
  notes: RhythmNote[];
  currentChord: string | null;
  onJudgment: (noteId: string, timing: 'perfect' | 'good' | 'miss') => void;
  bpm: number;
  measureCount: number;
  timeSignature: number;
  isPlaying: boolean;
  targetChord?: string | null; // 現在のターゲットコード
}

export const RhythmLane: React.FC<RhythmLaneProps> = ({
  notes,
  currentChord,
  onJudgment,
  bpm,
  measureCount: _measureCount,
  timeSignature,
  isPlaying
}) => {
  const { currentMeasure, currentBeat, isCountIn } = useTimeStore();
  const laneRef = useRef<HTMLDivElement>(null);
  
  // Calculate note positions based on timing
  const notePositions = useMemo(() => {
    if (!isPlaying) return [];
    
    const msPerBeat = 60000 / bpm;
    const currentTime = ((currentMeasure - 1) * timeSignature + (currentBeat - 1)) * msPerBeat;
    const lookAheadTime = 3000; // 3 seconds look-ahead
    
    return notes.map(note => {
      const noteTime = ((note.measure - 1) * timeSignature + (note.beat - 1)) * msPerBeat;
      const timeDiff = noteTime - currentTime;
      
      if (timeDiff < -200 || timeDiff > lookAheadTime) {
        return null;
      }
      
      const position = ((lookAheadTime - timeDiff) / lookAheadTime) * 100;
      
      return {
        ...note,
        position,
        isInJudgmentWindow: Math.abs(timeDiff) <= 200
      };
    }).filter(Boolean);
  }, [notes, currentMeasure, currentBeat, bpm, timeSignature, isPlaying]);
  
  // Check for notes in judgment window
  useEffect(() => {
    if (!isPlaying || isCountIn) return;
    
    notePositions.forEach(note => {
      if (note && note.isInJudgmentWindow && currentChord === note.chord) {
        onJudgment(note.id, Math.abs(100 - note.position) <= 5 ? 'perfect' : 'good');
      }
    });
  }, [notePositions, currentChord, onJudgment, isPlaying, isCountIn]);
  
  return (
    <div className="relative w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
      {/* Lane background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-50" />
      
      {/* Judgment line */}
      <div className="absolute left-[15%] top-0 bottom-0 w-1 bg-yellow-400 z-10">
        <div className="absolute -left-12 -right-12 top-1/2 -translate-y-1/2 h-24 border-2 border-yellow-400 rounded-full" />
      </div>
      
      {/* Notes */}
      <div ref={laneRef} className="relative h-full">
        {notePositions.map((note) => note && (
          <div
            key={note.id}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 transition-all duration-100",
              "w-20 h-20 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-lg",
              "border-4 border-white shadow-lg",
              note.isInJudgmentWindow && "scale-110 border-yellow-400"
            )}
            style={{ 
              left: `${note.position}%`,
              transform: `translateX(-50%) translateY(-50%)`
            }}
          >
            {note.chord}
          </div>
        ))}
      </div>
      
      {/* Visual guides */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-20" />
    </div>
  );
};