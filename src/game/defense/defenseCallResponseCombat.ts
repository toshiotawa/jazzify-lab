/**
 * Call-and-response combat helpers: kill clear target, difficulty speed, wave from KO progress.
 */
import { getDefenseCallResponseConfig } from '@/game/defense/defenseCallResponse';
import {
  DEFENSE_DAMAGE_UNIT,
  DEFENSE_FIREBALL_DAMAGE_MULT,
  DEFENSE_SP_MAX,
  DEFENSE_WAVE_COUNT,
  getDefenseSlashDamage,
  getDefenseWaveHpMult,
  getDefenseWaveIndexFromKillProgress,
  pickDefenseWaveEnemyType,
  resolveDefenseEnemyStats,
} from '@/game/defense/defenseEnemyConfig';
import type {
  DefenseAttackTrigger,
  DefenseDifficulty,
  DefensePhrase,
  DefensePlayStyle,
  DefenseStage,
} from '@/game/defense/defenseTypes';

export const DEFENSE_MIN_CLEAR_NOTES = 50;

export const countDefensePhraseNotes = (phrase: DefensePhrase): number => {
  let total = 0;
  for (const chord of phrase.chords) {
    total += chord.notes.length;
  }
  return total;
};

const countDefensePhraseMeasures = (phrase: DefensePhrase): number => (
  Math.max(1, phrase.chords.length)
);

interface LapTotals {
  readonly notesPerLap: number;
  readonly measuresPerLap: number;
  readonly laps: number;
}

const resolveEffectiveLaps = (
  stage: Pick<DefenseStage, 'requiredCompletionCount' | 'callResponseLaps'>,
  phrases: readonly DefensePhrase[],
): LapTotals | null => {
  let notesPerLap = 0;
  let measuresPerLap = 0;
  for (const phrase of phrases) {
    const req = Math.max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount);
    notesPerLap += countDefensePhraseNotes(phrase) * req;
    measuresPerLap += countDefensePhraseMeasures(phrase) * req;
  }
  if (notesPerLap <= 0) {
    return null;
  }
  const configuredLaps = Math.max(1, stage.callResponseLaps ?? 1);
  const minLapsForNotes = Math.max(1, Math.ceil(DEFENSE_MIN_CLEAR_NOTES / notesPerLap));
  const laps = Math.max(configuredLaps, minLapsForNotes);
  return { notesPerLap, measuresPerLap, laps };
};

const waveKillBandStart = (targetKills: number, waveIndex: number): number => {
  if (targetKills <= 0 || waveIndex <= 0) return 0;
  return Math.ceil((waveIndex * targetKills) / DEFENSE_WAVE_COUNT);
};

const minSlashHitsForKillCount = (
  targetKills: number,
  difficulty: DefenseDifficulty,
  totalFireballs: number,
  isWaveScaling: boolean,
): number => {
  if (targetKills <= 0) {
    return 0;
  }
  const hitBudgetPerEnemy: number[] = [];
  for (let i = 0; i < targetKills; i += 1) {
    const waveIndex = getDefenseWaveIndexFromKillProgress(i, targetKills);
    const spawnInWave = Math.max(0, i - waveKillBandStart(targetKills, waveIndex));
    let hpMult = isWaveScaling ? getDefenseWaveHpMult(waveIndex) : 1;
    if (isWaveScaling && waveIndex > 0 && spawnInWave < difficulty.maxEnemies - 1) {
      hpMult = getDefenseWaveHpMult(waveIndex - 1);
    }
    const enemyType = pickDefenseWaveEnemyType(waveIndex, spawnInWave, isWaveScaling);
    const resolved = resolveDefenseEnemyStats(enemyType, difficulty, hpMult);
    const slashDamage = getDefenseSlashDamage(waveIndex, isWaveScaling);
    const hits = Math.max(1, Math.ceil(resolved.hp / slashDamage));
    hitBudgetPerEnemy.push(hits);
  }

  let totalHits = 0;
  for (const hits of hitBudgetPerEnemy) {
    totalHits += hits;
  }

  const remaining = hitBudgetPerEnemy.slice();
  let slashSaved = 0;
  let slots = totalFireballs * difficulty.maxEnemies;
  while (slots > 0) {
    let bestIndex = -1;
    let bestHits = 0;
    for (let index = 0; index < remaining.length; index += 1) {
      const hits = remaining[index] ?? 0;
      if (hits > bestHits) {
        bestHits = hits;
        bestIndex = index;
      }
    }
    if (bestIndex < 0 || bestHits <= 0) {
      break;
    }
    const saved = Math.min(bestHits, DEFENSE_FIREBALL_DAMAGE_MULT);
    slashSaved += saved;
    remaining[bestIndex] = bestHits - saved;
    slots -= 1;
  }

  return Math.max(0, totalHits - slashSaved);
};

const resolveAttackBudget = (
  attackTrigger: DefenseAttackTrigger,
  playStyle: DefensePlayStyle,
  totals: LapTotals,
): { totalSlashes: number; totalFireballs: number } => {
  const slashEventsPerLap = attackTrigger === 'note'
    ? totals.notesPerLap
    : totals.measuresPerLap;
  const totalSlashes = Math.max(1, slashEventsPerLap * totals.laps);
  const spEligible = attackTrigger === 'note' && playStyle !== 'chord_voicing';
  const totalFireballs = spEligible
    ? Math.floor((totals.measuresPerLap * totals.laps) / DEFENSE_SP_MAX)
    : 0;
  return { totalSlashes, totalFireballs };
};

export const computeDefenseCallResponseClearTarget = (
  stage: Pick<
    DefenseStage,
    | 'audioLoopBars'
    | 'callResponseBars'
    | 'callResponseResponseBars'
    | 'requiredCompletionCount'
    | 'callResponseLaps'
    | 'attackTrigger'
    | 'playStyle'
  >,
  phrases: readonly DefensePhrase[],
  difficulty: Pick<DefenseDifficulty, 'enemyHp' | 'maxEnemies' | 'enemySpeedPxPerSec' | 'enemyDamage' | 'attackIntervalSec' | 'attackRangePx' | 'level'>,
): number | null => {
  if (getDefenseCallResponseConfig(stage) === null || phrases.length === 0) {
    return null;
  }
  const totals = resolveEffectiveLaps(stage, phrases);
  if (totals === null) {
    return null;
  }
  const { totalSlashes, totalFireballs } = resolveAttackBudget(
    stage.attackTrigger,
    stage.playStyle,
    totals,
  );
  const fullDifficulty: DefenseDifficulty = {
    level: difficulty.level,
    enemyHp: difficulty.enemyHp,
    spawnIntervalSec: 0,
    maxEnemies: difficulty.maxEnemies,
    enemySpeedPxPerSec: difficulty.enemySpeedPxPerSec,
    enemyDamage: difficulty.enemyDamage,
    attackIntervalSec: difficulty.attackIntervalSec,
    attackRangePx: difficulty.attackRangePx,
  };

  const isWaveScaling = stage.attackTrigger === 'note';
  let low = 1;
  let high = Math.max(totalSlashes * DEFENSE_DAMAGE_UNIT, 32);
  while (minSlashHitsForKillCount(high, fullDifficulty, totalFireballs, isWaveScaling) < totalSlashes) {
    high *= 2;
    if (high > 1_000_000) {
      break;
    }
  }

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const need = minSlashHitsForKillCount(mid, fullDifficulty, totalFireballs, isWaveScaling);
    if (need >= totalSlashes) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
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

/** Legacy cycle/response speed curve (pre–5-tier C&R). Prefer resolveDefenseCallResponseGuardedDifficulty. */
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

export {
  resolveDefenseCallResponseGuardedDifficulty,
  resolveDefenseEndlessAccelCap,
} from '@/game/defense/defenseCallResponseClearGuard';
export {
  computeDefenseEndlessAccel,
  computeDefenseStarRank,
  formatDefenseStarRank,
} from '@/game/defense/defenseCallResponseTier';