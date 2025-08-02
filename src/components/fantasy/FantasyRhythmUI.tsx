/**
 * ファンタジーリズムモードUI
 * 太鼓の達人風のリズムゲームUI
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useTimeStore } from '@/stores/timeStore';
import type { RhythmGameState } from './FantasyRhythmEngine';

interface FantasyRhythmUIProps {
  rhythmState: RhythmGameState;
  className?: string;
}

export const FantasyRhythmUI: React.FC<FantasyRhythmUIProps> = ({
  rhythmState,
  className
}) => {
  const { currentMeasure, currentBeat, isCountIn, startAt, readyDuration } = useTimeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Debug logging
  // useEffect(() => {
  //   console.log('RhythmUI state:', { 
  //     currentChord: rhythmState.currentChord,
  //     nextChord: rhythmState.nextChord,
  //     judgmentCount: rhythmState.judgments.length,
  //     currentIndex: rhythmState.currentJudgmentIndex
  //   });
  // }, [rhythmState]);
  
  // 判定ラインの位置（画面左から）
  const JUDGMENT_LINE_X = 150;
  const TRACK_Y = 50;
  const NOTE_HEIGHT = 60;
  const NOTE_WIDTH = 80;
  const PIXELS_PER_SECOND = 300; // ノートの移動速度
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw track background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, TRACK_Y - NOTE_HEIGHT / 2, canvas.width, NOTE_HEIGHT);
      
      // Draw judgment line
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(JUDGMENT_LINE_X, TRACK_Y - NOTE_HEIGHT);
      ctx.lineTo(JUDGMENT_LINE_X, TRACK_Y + NOTE_HEIGHT);
      ctx.stroke();
      
      // Draw judgment window
      ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
      ctx.fillRect(JUDGMENT_LINE_X - 60, TRACK_Y - NOTE_HEIGHT / 2, 120, NOTE_HEIGHT);
      
      if (!startAt) return;
      
      const currentTime = performance.now() - startAt - readyDuration;
      
      // Draw notes - only show recent and upcoming notes
      const visibleJudgments = rhythmState.judgments.slice(
        Math.max(0, rhythmState.currentJudgmentIndex - 2),
        rhythmState.currentJudgmentIndex + 10
      );
      
      visibleJudgments.forEach((judgment, relativeIndex) => {
        if (judgment.judged && judgment.success) return; // 成功した判定は表示しない
        
        const noteTime = (judgment.windowStart + judgment.windowEnd) / 2;
        const x = JUDGMENT_LINE_X + (noteTime - currentTime) * PIXELS_PER_SECOND / 1000;
        
        // Only draw notes that are visible
        if (x > canvas.width || x < -NOTE_WIDTH) return;
        
        // Note color based on state
        const absoluteIndex = Math.max(0, rhythmState.currentJudgmentIndex - 2) + relativeIndex;
        if (judgment.judged && !judgment.success) {
          ctx.fillStyle = '#666'; // Missed
        } else if (absoluteIndex === rhythmState.currentJudgmentIndex) {
          ctx.fillStyle = '#4ecdc4'; // Current
        } else {
          ctx.fillStyle = '#95e1d3'; // Future
        }
        
        // Draw note
        ctx.fillRect(x - NOTE_WIDTH / 2, TRACK_Y - NOTE_HEIGHT / 2, NOTE_WIDTH, NOTE_HEIGHT);
        
        // Draw chord name
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(judgment.chord, x, TRACK_Y);
      });
      
      requestAnimationFrame(draw);
    };
    
    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [rhythmState, startAt, readyDuration]);
  
  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="w-full border border-gray-700 rounded-lg bg-gray-800"
      />
      
      {/* Current chord display */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-400">現在のコード</div>
        <div className="text-3xl font-bold text-white">
          {rhythmState.currentChord || '-'}
        </div>
      </div>
      
      {/* Next chord preview */}
      {rhythmState.nextChord && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500">次のコード</div>
          <div className="text-lg text-gray-300">
            {rhythmState.nextChord}
          </div>
        </div>
      )}
      
      {/* Beat indicator */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {isCountIn ? 'M / - B' : `M ${currentMeasure} - B`} {currentBeat}
      </div>
    </div>
  );
};