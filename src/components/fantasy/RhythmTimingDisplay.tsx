import React, { useCallback, useEffect, useState } from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';

interface RhythmTimingDisplayProps {
  isActive: boolean;
  className?: string;
}

interface JudgmentResult {
  type: 'success' | 'miss' | null;
  timestamp: number;
}

export const RhythmTimingDisplay: React.FC<RhythmTimingDisplayProps> = ({
  isActive,
  className = ''
}) => {
  const { rhythmState } = useRhythmStore();
  const [judgmentResult, setJudgmentResult] = useState<JudgmentResult>({ type: null, timestamp: 0 });

  // Show judgment feedback
  const showJudgment = useCallback((type: 'success' | 'miss') => {
    setJudgmentResult({ type, timestamp: Date.now() });
    
    // Clear after animation
    setTimeout(() => {
      setJudgmentResult({ type: null, timestamp: 0 });
    }, 1000);
  }, []);

  // Calculate timing marker position (0 to 1)
  const calculateMarkerPosition = (): number => {
    if (!isActive || rhythmState.nextChordTiming === 0) return 0;
    
    const timeUntilNext = rhythmState.nextChordTiming - rhythmState.currentTime;
    const maxTime = 4000; // 4 seconds display range
    
    return Math.max(0, Math.min(1, 1 - (timeUntilNext / maxTime)));
  };

  // Check if in judgment window
  const isInJudgmentWindow = (): boolean => {
    if (!isActive || rhythmState.nextChordTiming === 0) return false;
    
    const timeDiff = Math.abs(rhythmState.currentTime - rhythmState.nextChordTiming);
    return timeDiff <= rhythmState.judgmentWindow;
  };

  const markerPosition = calculateMarkerPosition();
  const inJudgmentWindow = isInJudgmentWindow();

  // Export showJudgment method via custom hook (defined below)
  useEffect(() => {
    const element = document.getElementById('rhythm-timing-display');
    if (element) {
      (element as HTMLElement & { _showJudgment?: typeof showJudgment })._showJudgment = showJudgment;
    }
  }, [showJudgment]);

  return (
    <div id="rhythm-timing-display" className={`rhythm-timing-display ${className}`}>
      {/* Timing Track */}
      <div className="timing-track relative w-full h-4 bg-gray-700 rounded-lg overflow-hidden">
        
        {/* Progress Fill */}
        <div 
          className="timing-progress absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
          style={{ width: `${markerPosition * 100}%` }}
        />
        
        {/* Judgment Zone (at 80% position) */}
        <div 
          className="judgment-zone absolute top-0 h-full w-2 bg-yellow-400 opacity-60"
          style={{ left: '80%' }}
        />
        
        {/* Perfect Timing Line */}
        <div 
          className={`perfect-line absolute top-0 h-full w-1 transition-colors duration-200 ${
            inJudgmentWindow ? 'bg-green-400 animate-pulse' : 'bg-white'
          }`}
          style={{ left: '80%' }}
        />
        
        {/* Moving Marker */}
        {isActive && (
          <div 
            className={`timing-marker absolute top-0 h-full w-3 rounded transition-all duration-100 ${
              inJudgmentWindow 
                ? 'bg-green-400 animate-bounce shadow-lg shadow-green-400/50' 
                : 'bg-white'
            }`}
            style={{ 
              left: `${Math.max(0, Math.min(97, markerPosition * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
      </div>

      {/* Next Chord Display */}
      {isActive && rhythmState.nextChord && (
        <div className="next-chord-display mt-2 text-center">
          <div className={`chord-name text-2xl font-bold transition-all duration-200 ${
            inJudgmentWindow ? 'text-green-400 animate-pulse' : 'text-white'
          }`}>
            {rhythmState.nextChord}
          </div>
          <div className="timing-info text-sm text-gray-400">
            {Math.round((rhythmState.nextChordTiming - rhythmState.currentTime) / 1000 * 10) / 10}s
          </div>
        </div>
      )}

      {/* Judgment Feedback */}
      {judgmentResult.type && (
        <div 
          className={`judgment-feedback absolute inset-0 flex items-center justify-center pointer-events-none
            ${judgmentResult.type === 'success' 
              ? 'text-green-400 animate-ping' 
              : 'text-red-400 animate-bounce'
            }`}
        >
          <div className="text-4xl font-bold">
            {judgmentResult.type === 'success' ? '✓' : '✗'}
          </div>
        </div>
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info mt-2 text-xs text-gray-500 font-mono">
          <div>Current: {rhythmState.currentTime.toFixed(0)}ms</div>
          <div>Next: {rhythmState.nextChordTiming.toFixed(0)}ms</div>
          <div>Measure: {rhythmState.currentMeasure}.{rhythmState.currentBeat}</div>
          <div>Window: {inJudgmentWindow ? 'IN' : 'OUT'}</div>
        </div>
      )}
    </div>
  );
};

// Hook for triggering judgment feedback
export const useJudgmentFeedback = () => {
  const triggerJudgment = (type: 'success' | 'miss') => {
    const element = document.getElementById('rhythm-timing-display');
    if (element) {
      const elementWithMethod = element as HTMLElement & { 
        _showJudgment?: (type: 'success' | 'miss') => void 
      };
      if (elementWithMethod._showJudgment) {
        elementWithMethod._showJudgment(type);
      }
    }
  };

  return { triggerJudgment };
};