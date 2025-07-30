import React, { useCallback, useEffect, useMemo } from 'react';
import { RhythmTimingDisplay, useJudgmentFeedback } from './RhythmTimingDisplay';
import { useRhythmGameEngine } from './useRhythmGameEngine';
import type { FantasyStage, FantasyGameState } from './FantasyGameEngine';

interface FantasyRhythmAdapterProps {
  stage: FantasyStage;
  gameState: FantasyGameState;
  isActive: boolean;
  onChordInput: (chord: string) => void;
  onEnemyAttack: () => void;
  onChordCorrect: (chord: string) => void;
}

export const FantasyRhythmAdapter: React.FC<FantasyRhythmAdapterProps> = ({
  stage,
  gameState: _gameState,
  isActive,
  onChordInput,
  onEnemyAttack,
  onChordCorrect
}) => {
  const { triggerJudgment } = useJudgmentFeedback();
  
  const isRhythmMode = useMemo(() => {
    // Check if stage has rhythm mode properties (temporary until FantasyStage type is updated)
    const extendedStage = stage as FantasyStage & { game_type?: string };
    return extendedStage.game_type === 'rhythm';
  }, [stage]);
  
  const handleChordTiming = useCallback((chord: string) => {
    // Rhythm mode success
    onChordCorrect(chord);
    triggerJudgment('success');
  }, [onChordCorrect, triggerJudgment]);

  const handleMissedTiming = useCallback(() => {
    // Rhythm mode miss
    onEnemyAttack();
    triggerJudgment('miss');
  }, [onEnemyAttack, triggerJudgment]);

  const rhythmEngine = useRhythmGameEngine({
    stage,
    onChordTiming: handleChordTiming,
    onMissedTiming: handleMissedTiming
  });

  // Handle chord input from existing game engine
  useEffect(() => {
    if (!isRhythmMode || !isActive) return;

    const handleInput = (event: CustomEvent<{ chord: string }>) => {
      const success = rhythmEngine.handleChordInput(event.detail.chord);
      if (success) {
        onChordInput(event.detail.chord);
      }
    };

    window.addEventListener('fantasy-chord-input' as keyof WindowEventMap, handleInput as EventListener);
    return () => {
      window.removeEventListener('fantasy-chord-input' as keyof WindowEventMap, handleInput as EventListener);
    };
  }, [isRhythmMode, isActive, rhythmEngine, onChordInput]);

  // For quiz mode with music
  if (!isRhythmMode) {
    const extendedStage = stage as FantasyStage & { mp3_url?: string; bpm?: number; time_signature?: number; loop_measures?: number };
    if (!extendedStage.mp3_url) return null;

    // Use rhythm engine for music playback in quiz mode
    const quizMusicEngine = useRhythmGameEngine({ 
      stage: {
        ...stage,
        game_type: 'quiz',
        rhythm_pattern: 'random',
        bpm: extendedStage.bpm || 120,
        time_signature: extendedStage.time_signature || 4,
        loop_measures: extendedStage.loop_measures || 8,
        mp3_url: extendedStage.mp3_url
      } as FantasyStage,
      onChordTiming: () => {}, // No timing in quiz mode
      onMissedTiming: () => {} // No timing in quiz mode
    });

    useEffect(() => {
      if (isActive && quizMusicEngine.isInitialized && !quizMusicEngine.isPlaying) {
        quizMusicEngine.startMusic();
      } else if (!isActive && quizMusicEngine.isPlaying) {
        quizMusicEngine.pauseMusic();
      }
    }, [isActive, quizMusicEngine]);

    // Simple music player for quiz mode
    return (
      <div className="music-controls absolute top-20 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => quizMusicEngine.isPlaying ? quizMusicEngine.pauseMusic() : quizMusicEngine.startMusic()}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm"
            disabled={!quizMusicEngine.isInitialized}
          >
            {quizMusicEngine.isPlaying ? '⏸️ Pause' : '▶️ Play'} BGM
          </button>
          <span className="text-xs opacity-70">Quiz Mode</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Rhythm timing display */}
      <div className="rhythm-mode-ui absolute bottom-20 left-1/2 transform -translate-x-1/2 w-96 z-10">
        <RhythmTimingDisplay 
          isActive={isActive && rhythmEngine.isInitialized}
          className="backdrop-blur-sm bg-black/30 p-4 rounded-lg border border-white/20"
        />
      </div>

      {/* Music controls */}
      <div className="music-controls absolute top-20 right-4 flex gap-2 z-10">
        <button
          onClick={() => {
            if (rhythmEngine.isPlaying) {
              rhythmEngine.pauseMusic();
            } else {
              void rhythmEngine.startMusic();
            }
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            rhythmEngine.isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          title={rhythmEngine.isPlaying ? 'Pause Music' : 'Play Music'}
          disabled={!rhythmEngine.isInitialized}
        >
          {rhythmEngine.isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>

      {/* Music info */}
      {stage.mp3_url && (
        <div className="music-info absolute top-20 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white z-10">
          <div className="text-sm font-semibold mb-1">🎵 {stage.name}</div>
          <div className="text-xs text-gray-300">
            {stage.bpm} BPM • {stage.time_signature}/4
          </div>
          <div className="text-xs text-gray-400">
            Pattern: {stage.rhythm_pattern === 'random' ? 'Random' : 'Progression'}
          </div>
          {rhythmEngine.isPlaying && (
            <div className="text-xs text-green-400 mt-1">
              Measure {rhythmEngine.currentMeasure}, Beat {rhythmEngine.currentBeat}
            </div>
          )}
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-panel absolute top-32 left-4 bg-black bg-opacity-50 text-white p-4 rounded text-sm z-10">
          <div>Rhythm Initialized: {rhythmEngine.isInitialized ? 'Yes' : 'No'}</div>
          <div>Playing: {rhythmEngine.isPlaying ? 'Yes' : 'No'}</div>
          <div>Current Time: {Math.round(rhythmEngine.currentTime)}ms</div>
          <div>Active Enemies: {rhythmEngine.currentEnemies.length}</div>
          {rhythmEngine.getNextChordInfo() && (
            <>
              <div>Next Chord: {rhythmEngine.getNextChordInfo()?.chord}</div>
              <div>Time Until: {Math.round(rhythmEngine.getNextChordInfo()?.timeUntil || 0)}ms</div>
            </>
          )}
        </div>
      )}
    </>
  );
};