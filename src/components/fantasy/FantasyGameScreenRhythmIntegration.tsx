import React from 'react';
import { FantasyRhythmAdapter } from './FantasyRhythmAdapter';
import type { FantasyStage, FantasyGameState } from './FantasyGameEngine';

interface RhythmIntegrationProps {
  stage: FantasyStage;
  gameState: FantasyGameState;
  isGameActive: boolean;
      onChordCorrect: (chord: unknown, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => void;
  onEnemyAttack: () => void;
}

/**
 * Rhythm mode integration layer
 * This component can be added to FantasyGameScreen to enable rhythm mode
 */
export const FantasyGameScreenRhythmIntegration: React.FC<RhythmIntegrationProps> = ({
  stage,
  gameState,
  isGameActive,
  onChordCorrect,
  onEnemyAttack
}) => {
  // Check if this is a rhythm mode stage
  const extendedStage = stage as FantasyStage & { 
    game_type?: string;
    rhythm_pattern?: string;
    bpm?: number;
    time_signature?: number;
    loop_measures?: number;
    mp3_url?: string;
    chord_progression_data?: Array<{ chord: string; measure: number; beat: number }>;
  };

  const isRhythmMode = extendedStage.game_type === 'rhythm';

  if (!isRhythmMode) {
    return null;
  }

  // For rhythm mode, we need to handle chord input differently
  const handleChordInput = (chord: string) => {
    // Emit custom event for rhythm engine to process
    window.dispatchEvent(new CustomEvent('fantasy-chord-input', { 
      detail: { chord } 
    }));
  };

  // Wrap the chord correct callback for rhythm mode
  const handleRhythmChordCorrect = (chord: string) => {
    // For rhythm mode, we use simplified parameters
    const chordObj = { displayName: chord, id: chord };
    onChordCorrect(chordObj, false, 1, false, 'rhythm-enemy');
  };

  return (
    <FantasyRhythmAdapter
      stage={extendedStage as FantasyStage}
      gameState={gameState}
      isActive={isGameActive}
      onChordInput={handleChordInput}
      onEnemyAttack={onEnemyAttack}
      onChordCorrect={handleRhythmChordCorrect}
    />
  );
};

/**
 * Hook to integrate rhythm mode into existing FantasyGameScreen
 * 
 * Usage in FantasyGameScreen:
 * 
 * import { FantasyGameScreenRhythmIntegration } from './FantasyGameScreenRhythmIntegration';
 * 
 * // Inside component:
 * <FantasyGameScreenRhythmIntegration
 *   stage={stage}
 *   gameState={gameState}
 *   isGameActive={gameState.isGameActive}
 *   onChordCorrect={handleChordCorrect}
 *   onEnemyAttack={handleEnemyDamage}
 * />
 */
export default FantasyGameScreenRhythmIntegration;