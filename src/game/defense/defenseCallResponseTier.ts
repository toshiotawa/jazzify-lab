/**
 * Call-and-response phrase defense: 5-tier BPM/bar presets, Layer-1 density scaling,
 * 3-tier star rank, and endless acceleration helpers (client-side).
 */
import type {
  DefenseAttackTrigger,
  DefenseDifficulty,
  DefensePhrase,
  DefenseStage,
} from '@/game/defense/defenseTypes';
import { DEFENSE_PLAYER_X, DEFENSE_SPAWN_X } from '@/game/defense/defenseTypes';

type DefenseCallResponseTierLevel = 1 | 2 | 3 | 4 | 5;

interface DefenseCallResponseTierPreset {
  readonly level: DefenseCallResponseTierLevel;
  readonly reachBars: number;
  readonly enemyHp: number;
  readonly maxEnemies: number;
  readonly spawnPressure: number;
  readonly enemyDamage: number;
  readonly attackIntervalSec: number;
  readonly attackRangePx: number;
  readonly minHpGuardRatio: number;
}

const TIER_PRESETS: readonly DefenseCallResponseTierPreset[] = [
  {
    level: 1,
    reachBars: 8.5,
    enemyHp: 2,
    maxEnemies: 4,
    spawnPressure: 0.45,
    enemyDamage: 1,
    attackIntervalSec: 2.8,
    attackRangePx: 48,
    minHpGuardRatio: 0.85,
  },
  {
    level: 2,
    reachBars: 6.8,
    enemyHp: 3,
    maxEnemies: 5,
    spawnPressure: 0.62,
    enemyDamage: 2,
    attackIntervalSec: 2.4,
    attackRangePx: 50,
    minHpGuardRatio: 0.75,
  },
  {
    level: 3,
    reachBars: 5.2,
    enemyHp: 3,
    maxEnemies: 6,
    spawnPressure: 0.8,
    enemyDamage: 2,
    attackIntervalSec: 2.0,
    attackRangePx: 52,
    minHpGuardRatio: 0.65,
  },
  {
    level: 4,
    reachBars: 4.0,
    enemyHp: 4,
    maxEnemies: 8,
    spawnPressure: 0.98,
    enemyDamage: 2,
    attackIntervalSec: 1.6,
    attackRangePx: 54,
    minHpGuardRatio: 0.55,
  },
  {
    level: 5,
    reachBars: 3.1,
    enemyHp: 5,
    maxEnemies: 10,
    spawnPressure: 1.15,
    enemyDamage: 3,
    attackIntervalSec: 1.3,
    attackRangePx: 56,
    minHpGuardRatio: 0.5,
  },
] as const;

const MIN_SPAWN_INTERVAL_SEC = 0.8;
const MIN_CANDIDATE_SPEED_PX = 2;
const REFERENCE_NOTES_PER_BAR = 6;
const REFERENCE_MEASURES_PER_BAR = 1;

export const clampDefenseCallResponseTierLevel = (level: number): DefenseCallResponseTierLevel => {
  const clamped = Math.min(5, Math.max(1, Math.round(level)));
  return clamped as DefenseCallResponseTierLevel;
};

export const getDefenseCallResponseTierPreset = (
  level: DefenseCallResponseTierLevel,
): DefenseCallResponseTierPreset => TIER_PRESETS[level - 1] ?? TIER_PRESETS[0];

const countPhraseNotes = (phrase: DefensePhrase): number => {
  let total = 0;
  for (const chord of phrase.chords) {
    total += chord.notes.length;
  }
  return total;
};

export const resolveDefensePhraseBars = (
  phrase: DefensePhrase,
  stagePhraseBars: number,
): number => Math.max(1, stagePhraseBars, phrase.chords.length);

export const countDefensePhraseAttacks = (
  phrase: DefensePhrase,
  attackTrigger: DefenseAttackTrigger,
): number => (
  attackTrigger === 'note'
    ? Math.max(1, countPhraseNotes(phrase))
    : Math.max(1, phrase.chords.length)
);

const resolveEnemyHpForTrigger = (
  enemyHp: number,
  attackTrigger: DefenseAttackTrigger,
): number => (
  attackTrigger === 'measure' ? Math.max(1, Math.ceil(enemyHp / 2)) : enemyHp
);

export interface BuildDefenseCallResponseTierInput {
  readonly tierLevel: number;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly phraseBars: number;
  readonly attackTrigger: DefenseAttackTrigger;
  readonly phrases: readonly DefensePhrase[];
}

/**
 * Layer 1: Smooth speed reduction for sparse phrases / long trailing or leading silence gaps
 * relative to the 6-notes-per-bar reference at the same BPM.
 */
export const computeDefenseCallResponsePhraseDensityScale = (
  phrases: readonly DefensePhrase[],
  stage: Pick<DefenseStage, 'attackTrigger' | 'beatsPerBar' | 'bpm' | 'phraseBars'>,
): number => {
  if (phrases.length === 0) return 1;
  const bpm = Math.max(1, stage.bpm);
  const beatsPerBar = Math.max(1, stage.beatsPerBar);
  const barSec = (60 / bpm) * beatsPerBar;
  const eighthSec = 30 / bpm;
  const isNote = stage.attackTrigger === 'note';
  const refPerBar = isNote ? REFERENCE_NOTES_PER_BAR : REFERENCE_MEASURES_PER_BAR;
  const refGapSec = isNote ? barSec * 0.375 : barSec;

  let worstScale = 1;
  for (const phrase of phrases) {
    const phraseBars = resolveDefensePhraseBars(phrase, stage.phraseBars);
    const phraseSec = phraseBars * barSec;
    const attacks = countDefensePhraseAttacks(phrase, stage.attackTrigger);

    const notesPerBar = attacks / phraseBars;
    const densityRatio = Math.min(1, notesPerBar / refPerBar);
    const estGapSec = isNote
      ? Math.max(phraseSec / attacks, phraseSec - Math.max(0, attacks - 1) * eighthSec)
      : phraseSec / attacks;
    const gapRatio = Math.min(1, (refGapSec + 0.5) / (estGapSec + 0.5));
    const scale = Math.sqrt(Math.max(1e-6, densityRatio * gapRatio));
    if (scale < worstScale) {
      worstScale = scale;
    }
  }

  return Math.min(1, Math.max(0.1, worstScale));
};

/**
 * Builds the 5-tier BPM/bar-based base difficulty (including Layer-1 density scaling and
 * player-pace-relative spawnIntervalSec).
 */
export const buildDefenseCallResponseBaseDifficulty = (
  input: BuildDefenseCallResponseTierInput,
): DefenseDifficulty => {
  const tierLevel = clampDefenseCallResponseTierLevel(input.tierLevel);
  const tier = getDefenseCallResponseTierPreset(tierLevel);
  const isNote = input.attackTrigger === 'note';
  const bpm = Math.max(1, input.bpm);
  const beatsPerBar = Math.max(1, input.beatsPerBar);
  const barSec = (60 / bpm) * beatsPerBar;

  const lanePx = Math.max(1, DEFENSE_SPAWN_X - DEFENSE_PLAYER_X - tier.attackRangePx);
  const barBasedSpeed = lanePx / (tier.reachBars * barSec);
  const densityScale = computeDefenseCallResponsePhraseDensityScale(input.phrases, {
    attackTrigger: input.attackTrigger,
    beatsPerBar,
    bpm,
    phraseBars: input.phraseBars,
  });
  const candidateSpeed = Math.max(MIN_CANDIDATE_SPEED_PX, barBasedSpeed * densityScale);

  // Average player attack pace across stage phrases (attacks per second during response).
  let totalAttacks = 0;
  let totalPhraseSec = 0;
  for (const phrase of input.phrases) {
    const phraseBars = resolveDefensePhraseBars(phrase, input.phraseBars);
    totalAttacks += countDefensePhraseAttacks(phrase, input.attackTrigger);
    totalPhraseSec += phraseBars * barSec;
  }
  const attacksPerSec = totalPhraseSec > 0
    ? totalAttacks / totalPhraseSec
    : (isNote ? REFERENCE_NOTES_PER_BAR / barSec : 1 / barSec);

  const enemyHp = resolveEnemyHpForTrigger(tier.enemyHp, input.attackTrigger);
  const avgHitsWave0 = isNote ? Math.max(1, enemyHp * 0.95) : Math.max(1, enemyHp);
  const killSec = avgHitsWave0 / Math.max(0.05, attacksPerSec);
  const spawnIntervalSec = Math.max(MIN_SPAWN_INTERVAL_SEC, killSec / tier.spawnPressure);

  return {
    level: tier.level,
    enemyHp,
    spawnIntervalSec,
    maxEnemies: tier.maxEnemies,
    enemySpeedPxPerSec: candidateSpeed,
    enemyDamage: tier.enemyDamage,
    attackIntervalSec: tier.attackIntervalSec,
    attackRangePx: tier.attackRangePx,
  };
};

/** Clears at 1–3 stars from remaining HP (before endless). */
export const computeDefenseStarRank = (
  playerHp: number,
  playerMaxHp: number,
): 1 | 2 | 3 => {
  if (playerHp >= playerMaxHp) return 3;
  if (playerHp * 2 >= playerMaxHp) return 2;
  return 1;
};

export const formatDefenseStarRank = (rank: 1 | 2 | 3 | null | undefined): string => {
  if (rank == null) return '☆☆☆';
  const filled = '★'.repeat(rank);
  const empty = '☆'.repeat(3 - rank);
  return `${filled}${empty}`;
};

const ENDLESS_SPEED_ACCEL_PER_SEC = 0.025;
const ENDLESS_SPAWN_ACCEL_PER_SEC = 0.025;
const ENDLESS_HP_ACCEL_PER_SEC = 0.015;

interface DefenseEndlessAccel {
  readonly speedMult: number;
  readonly spawnMult: number;
  readonly hpMult: number;
}

export const computeDefenseEndlessAccel = (elapsedSec: number): DefenseEndlessAccel => {
  const clamped = Math.max(0, elapsedSec);
  return {
    speedMult: 1 + ENDLESS_SPEED_ACCEL_PER_SEC * clamped,
    spawnMult: 1 + ENDLESS_SPAWN_ACCEL_PER_SEC * clamped,
    hpMult: 1 + ENDLESS_HP_ACCEL_PER_SEC * clamped,
  };
};
