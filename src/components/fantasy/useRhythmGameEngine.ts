import { useState, useEffect, useCallback, useRef } from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';
import { RhythmTimingManager } from '@/utils/RhythmTimingManager';
import { AudioManager } from '@/utils/AudioManager';
import type { FantasyStage } from '@/types';

interface UseRhythmGameEngineProps {
  stage: FantasyStage;
  onChordTiming: (chord: string) => void;
  onMissedTiming: () => void;
}

interface RhythmEnemy {
  id: string;
  chord: string;
  timing: number;
  isActive: boolean;
}

export const useRhythmGameEngine = ({
  stage,
  onChordTiming,
  onMissedTiming
}: UseRhythmGameEngineProps) => {
  const rhythmStore = useRhythmStore();
  const [rhythmManager, setRhythmManager] = useState<RhythmTimingManager | null>(null);
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEnemies, setCurrentEnemies] = useState<RhythmEnemy[]>([]);

  // Initialize rhythm mode
  const initializeRhythm = useCallback(async () => {
    if (stage.game_type !== 'rhythm') return;

    // Initialize rhythm store
    rhythmStore.initializeRhythm(stage);
    
    // Create timing manager
    const manager = new RhythmTimingManager(
      stage.bpm || 120,
      stage.time_signature || 4
    );
    setRhythmManager(manager);
    
    // Initialize audio if URL provided
    if (stage.mp3_url) {
      try {
        const audio = new AudioManager(
          (time) => rhythmStore.updateTime(time),
          () => rhythmStore.resetToLoop()
        );
        
        await audio.load(stage.mp3_url);
        
        // Setup loop
        audio.setupLoop(
          2, // 2nd measure start
          stage.loop_measures || 8,
          stage.bpm || 120,
          stage.time_signature || 4
        );
        
        setAudioManager(audio);
        setIsInitialized(true);
        
      } catch (error) {
        // Continue without audio
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(true);
    }
  }, [stage, rhythmStore]);

  // Start music playback
  const startMusic = useCallback(async () => {
    if (audioManager && isInitialized) {
      await audioManager.play();
      rhythmStore.startMusic();
    }
  }, [audioManager, isInitialized, rhythmStore]);

  // Pause music
  const pauseMusic = useCallback(() => {
    if (audioManager) {
      audioManager.pause();
      rhythmStore.pauseMusic();
    }
  }, [audioManager, rhythmStore]);

  // Check for missed timing - defined before scheduleNextChord
  const checkMissedTiming = useCallback((enemy: RhythmEnemy) => {
    setCurrentEnemies(prev => {
      const stillActive = prev.find(e => e.id === enemy.id && e.isActive);
      if (stillActive) {
        onMissedTiming();
        return prev.filter(e => e.id !== enemy.id);
      }
      return prev;
    });
  }, [onMissedTiming]);

  // Schedule next chord
  const scheduleNextChordRef = useRef<() => void>();
  
  const scheduleNextChord = useCallback(() => {
    if (!rhythmManager || !stage) return;

    const currentTime = rhythmStore.rhythmState.currentTime;
    let nextChord: string;
    let nextTiming: number;

    if (stage.rhythm_pattern === 'random') {
      // Random pattern: one chord per measure
      nextChord = rhythmStore.getNextRandomChord();
      nextTiming = rhythmManager.getNextRandomTiming(currentTime);
    } else {
      // Progression pattern
      const progressionChord = rhythmStore.getNextProgressionChord();
      if (!progressionChord) return;
      
      nextChord = progressionChord.chord;
      nextTiming = rhythmManager.calculateProgressionTiming(
        progressionChord,
        rhythmStore.audioState.loopStartTime
      );
    }

    // Update rhythm state
    rhythmStore.updateTime(currentTime);
    
    // Create enemy for this chord
    const enemy: RhythmEnemy = {
      id: `enemy_${Date.now()}`,
      chord: nextChord,
      timing: nextTiming,
      isActive: true
    };

    setCurrentEnemies(prev => [...prev, enemy]);

    // Schedule removal if missed
    const timeUntilDeadline = nextTiming - currentTime + rhythmStore.rhythmState.judgmentWindow;
    if (timeUntilDeadline > 0) {
      setTimeout(() => {
        checkMissedTiming(enemy);
      }, timeUntilDeadline);
    }

    // Schedule next chord
    setTimeout(() => {
      scheduleNextChordRef.current?.();
    }, 1000); // Check every second
      }, [rhythmManager, stage, rhythmStore, checkMissedTiming]);
  
  scheduleNextChordRef.current = scheduleNextChord;

  // Handle chord input
  const handleChordInput = useCallback((chord: string) => {
    const currentTime = rhythmStore.rhythmState.currentTime;
    
    // Find matching enemy
    const matchingEnemy = currentEnemies.find(enemy => 
      enemy.chord === chord && 
      enemy.isActive &&
      rhythmManager?.isWithinJudgmentWindow(enemy.timing, currentTime)
    );

    if (matchingEnemy) {
      // Success!
      onChordTiming(chord);
      setCurrentEnemies(prev => prev.map(e => 
        e.id === matchingEnemy.id ? { ...e, isActive: false } : e
      ));
      return true;
    }

    return false;
  }, [currentEnemies, rhythmManager, rhythmStore, onChordTiming]);

  // Get next chord timing info
  const getNextChordInfo = useCallback(() => {
    const activeEnemies = currentEnemies.filter(e => e.isActive);
    if (activeEnemies.length === 0) return null;

    const currentTime = rhythmStore.rhythmState.currentTime;
    const nextEnemy = activeEnemies.reduce((closest, enemy) => {
      if (!closest) return enemy;
      return Math.abs(enemy.timing - currentTime) < Math.abs(closest.timing - currentTime) 
        ? enemy 
        : closest;
    });

    return {
      chord: nextEnemy.chord,
      timing: nextEnemy.timing,
      timeUntil: nextEnemy.timing - currentTime
    };
  }, [currentEnemies, rhythmStore]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioManager) {
        audioManager.cleanup();
      }
      rhythmStore.cleanup();
    };
  }, [audioManager, rhythmStore]);

  // Initialize on mount
  useEffect(() => {
    void initializeRhythm();
  }, [initializeRhythm]);

  // Start scheduling when music starts
  useEffect(() => {
    if (rhythmStore.rhythmState.isPlaying && isInitialized) {
      scheduleNextChord();
    }
  }, [rhythmStore.rhythmState.isPlaying, isInitialized, scheduleNextChord]);

  return {
    isInitialized,
    isPlaying: rhythmStore.rhythmState.isPlaying,
    currentTime: rhythmStore.rhythmState.currentTime,
    currentMeasure: rhythmStore.rhythmState.currentMeasure,
    currentBeat: rhythmStore.rhythmState.currentBeat,
    startMusic,
    pauseMusic,
    handleChordInput,
    getNextChordInfo,
    currentEnemies
  };
};