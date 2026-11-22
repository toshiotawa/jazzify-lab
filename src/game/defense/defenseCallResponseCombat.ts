/**
 * Call-and-response combat helpers: clear target, difficulty speed, wave from phrase progress.
 */
import { getDefenseCallResponseConfig } from '@/game/defense/defenseCallResponse';
import type { DefenseDifficulty, DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';
import { DEFENSE_WAVE_COUNT } from '@/game/defense/defenseEnemyConfig';

export const DEFENSE_MIN_CLEAR_NOTES = 50;

export const countDefensePhraseNotes = (phrase: DefensePhrase): number => {
  let total = 0;
  for (const chord of phrase.chords) {
    total += chord.notes.length;
  }
  return total;
};

export const computeDefenseCallResponseClearTarget = (
  stage: Pick<DefenseStage, 'audioLoopBars' | 'callResponseBars' | 'callResponseResponseBars' | 'requiredCompletionCount'>,
  phrases: readonly DefensePhrase[],
): number | null => {
  if (getDefenseCallResponseConfig(stage) === null) {
    return null;
  }
  if (phrases.length === 0) {
    return null;
  }

  let completionsPerLap = 0;
  let notesPerLap = 0;
  for (const phrase of phrases) {
    const req = Math.max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount);
    const notes = countDefensePhraseNotes(phrase);
    completionsPerLap += req;
    notesPerLap += notes * req;
  }

  const laps = notesPerLap > 0
    ? Math.max(1, Math.ceil(DEFENSE_MIN_CLEAR_NOTES / notesPerLap))
    : 1;
  return completionsPerLap * laps;
};

export const resolveDefenseCallResponseEnemySpeedPx = (
  difficulty: Pick<DefenseDifficulty, 'enemySpeedPxPerSec' | 'level'>,
  cycleBars: number,
  responseBars: number,
): number => {
  const floorSpeed = Math.max(difficulty.enemySpeedPxPerSec, 34 + difficulty.level * 6);
  const approachShare = responseBars / Math.max(1, cycleBars);
  const mult = Math.min(1.5, 1 / Math.max(approachShare, 1e-6));
  return floorSpeed * mult;
};

export const applyDefenseCallResponseDifficulty = (
  difficulty: DefenseDifficulty,
  cycleBars: number,
  responseBars: number,
): DefenseDifficulty => ({
  ...difficulty,
  enemySpeedPxPerSec: resolveDefenseCallResponseEnemySpeedPx(
    difficulty,
    cycleBars,
    responseBars,
  ),
});

export const getDefenseWaveIndexFromPhraseProgress = (
  phraseCompletions: number,
  targetPhraseCompletions: number,
): number => {
  if (targetPhraseCompletions <= 0) {
    return 0;
  }
  const ratio = Math.min(1, phraseCompletions / targetPhraseCompletions);
  const index = Math.floor(ratio * DEFENSE_WAVE_COUNT);
  return Math.min(DEFENSE_WAVE_COUNT - 1, Math.max(0, index));
};