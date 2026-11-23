/**
 * Layer-2 deterministic dry-run guard for call-and-response clear safety.
 * Runs once at stage start; not per frame.
 */
import { computeDefenseCallResponseClearTarget } from '@/game/defense/defenseCallResponseCombat';
import {
  buildDefenseCallResponseBaseDifficulty,
  clampDefenseCallResponseTierLevel,
  computeDefenseEndlessAccelWithCap,
  countDefensePhraseAttacks,
  type DefenseEndlessAccelCap,
  getDefenseCallResponseTierPreset,
  resolveDefensePhraseBars,
  scaleDefenseEndlessAccelCap,
  type BuildDefenseCallResponseTierInput,
} from '@/game/defense/defenseCallResponseTier';
import { DEFENSE_ENDLESS_WAVE_INDEX } from '@/game/defense/defenseEngine';
import {
  chargeDefenseSp,
  performDefenseSlash,
  spawnCallResponseInitialEnemy,
  tickDefenseSimulation,
} from '@/game/defense/defenseEngine';
import type { DefenseDifficulty, DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';
import { createDefenseRuntime } from '@/game/defense/defenseTypes';

const DRY_RUN_DT_SEC = 0.05;
const MAX_BINARY_SEARCH_STEPS = 8;
const GUARD_SPEED_FACTOR = 0.9;
const MAX_RESPONSE_SIM_SEC = 600;
const MIN_GUARDED_SPEED_PX = 2;
const ENDLESS_SURVIVAL_SIM_SEC = 120;
const ENDLESS_SURVIVAL_STEADY_SEC = 60;
const ENDLESS_CAP_SAFETY_FACTOR = 0.85;
const ENDLESS_START_SPEED_SAFETY_FACTOR = 0.9;

type DryRunTimingMode = 'front_delayed' | 'back';

interface DryRunAttackEvent {
  readonly timeSec: number;
  readonly isMeasureEnd: boolean;
}

const buildPhraseOffsets = (
  attacks: number,
  phraseSec: number,
  eighthSec: number,
  mode: DryRunTimingMode,
): number[] => {
  const count = Math.max(1, attacks);
  const step = Math.min(eighthSec, phraseSec / count);
  const span = Math.max(0, count - 1) * step;
  const offsets: number[] = [];
  if (mode === 'front_delayed') {
    const leadDelay = Math.min(0.25, Math.max(0, (phraseSec - span) * 0.2));
    for (let i = 0; i < count; i += 1) {
      offsets.push(leadDelay + i * step);
    }
  } else {
    const start = Math.max(0, phraseSec - span - Math.min(0.1, phraseSec * 0.05));
    for (let i = 0; i < count; i += 1) {
      offsets.push(start + i * step);
    }
  }
  return offsets;
};

const buildMeasureEndIndices = (attackCount: number, measureCount: number): Set<number> => {
  const indices = new Set<number>();
  const mCount = Math.max(1, measureCount);
  for (let m = 0; m < mCount; m += 1) {
    const idx = Math.min(attackCount - 1, Math.floor(((m + 1) * attackCount) / mCount) - 1);
    if (idx >= 0) {
      indices.add(idx);
    }
  }
  return indices;
};

interface DryRunResult {
  readonly cleared: boolean;
  readonly playerHp: number;
}

type GuardStageInput = Pick<
  DefenseStage,
  | 'playerHp'
  | 'surviveSeconds'
  | 'attackTrigger'
  | 'bpm'
  | 'beatsPerBar'
  | 'phraseBars'
  | 'requiredCompletionCount'
  | 'callResponseResponseBars'
  | 'callResponseBars'
  | 'callResponseLaps'
  | 'audioLoopBars'
  | 'playStyle'
>;

const runDryRun = (
  stage: GuardStageInput,
  phrases: readonly DefensePhrase[],
  difficulty: DefenseDifficulty,
  targetKills: number,
  mode: DryRunTimingMode,
): DryRunResult => {
  if (phrases.length === 0 || targetKills <= 0) {
    return { cleared: false, playerHp: 0 };
  }

  const bpm = Math.max(1, stage.bpm);
  const beatsPerBar = Math.max(1, stage.beatsPerBar);
  const barSec = (60 / bpm) * beatsPerBar;
  const eighthSec = 30 / bpm;
  const callBars = Math.max(1, stage.callResponseBars ?? 1);
  const responseBars = Math.max(1, stage.callResponseResponseBars ?? 1);
  const callSec = callBars * barSec;
  const responseSec = responseBars * barSec;
  const spEligible = stage.attackTrigger === 'note' && stage.playStyle !== 'chord_voicing';

  const runtime = createDefenseRuntime(
    stage.playerHp,
    stage.surviveSeconds,
    difficulty.maxEnemies,
    false,
    stage.attackTrigger,
  );
  runtime.callResponseActive = true;
  runtime.endlessPromptEnabled = false;
  runtime.targetEnemiesDefeated = targetKills;
  runtime.spawnTimerSec = difficulty.spawnIntervalSec * 0.8;
  runtime.enemyBehavior = 'approach';
  spawnCallResponseInitialEnemy(runtime, difficulty);

  let totalResponseSec = 0;
  let phraseIdx = 0;

  while (runtime.result === 'playing' && totalResponseSec < MAX_RESPONSE_SIM_SEC) {
    const phrase = phrases[phraseIdx % phrases.length];
    phraseIdx += 1;
    if (!phrase) break;

    const phraseBars = resolveDefensePhraseBars(phrase, stage.phraseBars);
    const phraseSec = phraseBars * barSec;
    const attacks = countDefensePhraseAttacks(phrase, stage.attackTrigger);
    const measures = Math.max(1, phrase.chords.length);
    const reqCount = Math.max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount);
    const repsPerResponse = Math.max(1, Math.floor(responseBars / phraseBars));
    const offsets = buildPhraseOffsets(attacks, phraseSec, eighthSec, mode);
    const measureEnds = buildMeasureEndIndices(offsets.length, measures);

    let repsLeft = reqCount;
    while (repsLeft > 0 && runtime.result === 'playing' && totalResponseSec < MAX_RESPONSE_SIM_SEC) {
      const repsThisWindow = Math.min(repsLeft, repsPerResponse);
      const isFinishingPhrase = repsThisWindow === repsLeft;
      const events: DryRunAttackEvent[] = [];
      for (let r = 0; r < repsThisWindow; r += 1) {
        const baseT = r * phraseSec;
        for (let ni = 0; ni < offsets.length; ni += 1) {
          events.push({
            timeSec: baseT + (offsets[ni] ?? 0),
            isMeasureEnd: measureEnds.has(ni),
          });
        }
      }

      const lastEventTime = events.length > 0 ? (events[events.length - 1]?.timeSec ?? 0) : 0;
      const windowDur = isFinishingPhrase ? lastEventTime + DRY_RUN_DT_SEC : responseSec;

      runtime.enemyBehavior = 'approach';
      let eventIndex = 0;
      let localT = 0;
      while (localT < windowDur && runtime.result === 'playing') {
        const step = Math.min(DRY_RUN_DT_SEC, windowDur - localT);
        localT += step;
        totalResponseSec += step;

        while (eventIndex < events.length && (events[eventIndex]?.timeSec ?? Infinity) <= localT + 1e-9) {
          performDefenseSlash(runtime, 0, difficulty);
          if (runtime.result !== 'playing') break;
          if (spEligible && events[eventIndex]?.isMeasureEnd) {
            chargeDefenseSp(runtime);
          }
          eventIndex += 1;
        }
        if (runtime.result !== 'playing') break;

        tickDefenseSimulation(runtime, difficulty, step);
      }

      if (runtime.result !== 'playing') break;

      // Call phase: enemies dance (do not move, attack, or advance spawn timer).
      runtime.enemyBehavior = 'dance';
      for (const enemy of runtime.enemies) {
        if (enemy.active) {
          enemy.knockbackVx = 0;
          enemy.attackHitPending = false;
        }
      }
      runtime.elapsedSec += callSec;
      repsLeft -= repsThisWindow;
    }
  }

  return {
    cleared: runtime.result === 'clear',
    playerHp: runtime.playerHp,
  };
};

const passesGuardHpFloor = (
  playerHp: number,
  playerMaxHp: number,
  minHpRatio: number,
): boolean => playerHp >= Math.max(1, Math.ceil(playerMaxHp * minHpRatio));

const applyDefenseCallResponseClearGuard = (
  stage: GuardStageInput,
  phrases: readonly DefensePhrase[],
  base: DefenseDifficulty,
): DefenseDifficulty => {
  const tier = getDefenseCallResponseTierPreset(clampDefenseCallResponseTierLevel(base.level));
  const targetKills = computeDefenseCallResponseClearTarget(stage, phrases, base);
  if (targetKills == null || targetKills <= 0) {
    return base;
  }

  const candidateSpeed = Math.max(MIN_GUARDED_SPEED_PX, base.enemySpeedPxPerSec);

  const trySpeed = (speed: number): boolean => {
    const difficulty: DefenseDifficulty = {
      ...base,
      enemySpeedPxPerSec: speed,
    };
    const front = runDryRun(stage, phrases, difficulty, targetKills, 'front_delayed');
    if (!front.cleared || !passesGuardHpFloor(front.playerHp, stage.playerHp, tier.minHpGuardRatio)) {
      return false;
    }
    const back = runDryRun(stage, phrases, difficulty, targetKills, 'back');
    return back.cleared && passesGuardHpFloor(back.playerHp, stage.playerHp, tier.minHpGuardRatio);
  };

  if (trySpeed(candidateSpeed)) {
    return { ...base, enemySpeedPxPerSec: candidateSpeed };
  }

  let low = MIN_GUARDED_SPEED_PX;
  let high = candidateSpeed;
  for (let step = 0; step < MAX_BINARY_SEARCH_STEPS; step += 1) {
    const mid = (low + high) / 2;
    if (trySpeed(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const guarded = Math.max(MIN_GUARDED_SPEED_PX, low * GUARD_SPEED_FACTOR);
  return { ...base, enemySpeedPxPerSec: guarded };
};

export const resolveDefenseCallResponseGuardedDifficulty = (
  stage: GuardStageInput,
  phrases: readonly DefensePhrase[],
  buildInput: BuildDefenseCallResponseTierInput,
): DefenseDifficulty => {
  const baseDifficulty = buildDefenseCallResponseBaseDifficulty(buildInput);
  return applyDefenseCallResponseClearGuard(stage, phrases, baseDifficulty);
};

const applyEndlessAccel = (runtime: ReturnType<typeof createDefenseRuntime>, cap: DefenseEndlessAccelCap): void => {
  const accel = computeDefenseEndlessAccelWithCap(runtime.endlessElapsedSec, cap);
  runtime.endlessSpeedMult = accel.speedMult;
  runtime.endlessSpawnMult = accel.spawnMult;
  runtime.endlessHpMult = accel.hpMult;
};

const runEndlessSurvivalDryRun = (
  stage: GuardStageInput,
  phrases: readonly DefensePhrase[],
  difficulty: DefenseDifficulty,
  cap: DefenseEndlessAccelCap,
  mode: DryRunTimingMode,
): boolean => {
  if (phrases.length === 0) return false;

  const bpm = Math.max(1, stage.bpm);
  const beatsPerBar = Math.max(1, stage.beatsPerBar);
  const barSec = (60 / bpm) * beatsPerBar;
  const eighthSec = 30 / bpm;
  const callBars = Math.max(1, stage.callResponseBars ?? 1);
  const responseBars = Math.max(1, stage.callResponseResponseBars ?? 1);
  const callSec = callBars * barSec;
  const responseSec = responseBars * barSec;
  const spEligible = stage.attackTrigger === 'note' && stage.playStyle !== 'chord_voicing';

  const runtime = createDefenseRuntime(
    stage.playerHp,
    stage.surviveSeconds,
    difficulty.maxEnemies,
    false,
    stage.attackTrigger,
  );
  runtime.callResponseActive = true;
  runtime.endlessPromptEnabled = false;
  runtime.endlessMode = true;
  runtime.waveIndex = DEFENSE_ENDLESS_WAVE_INDEX;
  runtime.waveSpawnCount = 0;
  runtime.targetEnemiesDefeated = 1;
  runtime.spawnTimerSec = difficulty.spawnIntervalSec * 0.8;
  runtime.enemyBehavior = 'approach';
  applyEndlessAccel(runtime, cap);
  spawnCallResponseInitialEnemy(runtime, difficulty);

  let totalResponseSec = 0;
  let phraseIdx = 0;
  let hpAtSteadyStart: number | null = null;

  while (runtime.result === 'playing' && totalResponseSec < ENDLESS_SURVIVAL_SIM_SEC) {
    const phrase = phrases[phraseIdx % phrases.length];
    if (!phrase) break;
    phraseIdx += 1;

    const phraseBars = resolveDefensePhraseBars(phrase, stage.phraseBars);
    const phraseSec = phraseBars * barSec;
    const attacks = countDefensePhraseAttacks(phrase, stage.attackTrigger);
    const measures = Math.max(1, phrase.chords.length);
    const reqCount = Math.max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount);
    const repsPerResponse = Math.max(1, Math.floor(responseBars / phraseBars));
    const offsets = buildPhraseOffsets(attacks, phraseSec, eighthSec, mode);
    const measureEnds = buildMeasureEndIndices(offsets.length, measures);

    let repsLeft = reqCount;
    while (repsLeft > 0 && runtime.result === 'playing' && totalResponseSec < ENDLESS_SURVIVAL_SIM_SEC) {
      const repsThisWindow = Math.min(repsLeft, repsPerResponse);
      const isFinishingPhrase = repsThisWindow === repsLeft;
      const events: DryRunAttackEvent[] = [];
      for (let r = 0; r < repsThisWindow; r += 1) {
        const baseT = r * phraseSec;
        for (let ni = 0; ni < offsets.length; ni += 1) {
          events.push({
            timeSec: baseT + (offsets[ni] ?? 0),
            isMeasureEnd: measureEnds.has(ni),
          });
        }
      }

      const lastEventTime = events.length > 0 ? (events[events.length - 1]?.timeSec ?? 0) : 0;
      const windowDur = isFinishingPhrase ? lastEventTime + DRY_RUN_DT_SEC : responseSec;

      runtime.enemyBehavior = 'approach';
      let eventIndex = 0;
      let localT = 0;
      while (localT < windowDur && runtime.result === 'playing' && totalResponseSec < ENDLESS_SURVIVAL_SIM_SEC) {
        const step = Math.min(DRY_RUN_DT_SEC, windowDur - localT);
        localT += step;
        totalResponseSec += step;
        runtime.endlessElapsedSec += step;
        applyEndlessAccel(runtime, cap);

        if (totalResponseSec >= ENDLESS_SURVIVAL_SIM_SEC - ENDLESS_SURVIVAL_STEADY_SEC && hpAtSteadyStart == null) {
          hpAtSteadyStart = runtime.playerHp;
        }
        if (hpAtSteadyStart != null && runtime.playerHp < hpAtSteadyStart) {
          return false;
        }

        while (eventIndex < events.length && (events[eventIndex]?.timeSec ?? Infinity) <= localT + 1e-9) {
          performDefenseSlash(runtime, 0, difficulty);
          if (runtime.result !== 'playing') break;
          if (spEligible && events[eventIndex]?.isMeasureEnd) {
            chargeDefenseSp(runtime);
          }
          eventIndex += 1;
        }
        if (runtime.result !== 'playing') break;

        tickDefenseSimulation(runtime, difficulty, step);
      }

      if (runtime.result !== 'playing') break;

      runtime.enemyBehavior = 'dance';
      for (const enemy of runtime.enemies) {
        if (enemy.active) {
          enemy.knockbackVx = 0;
          enemy.attackHitPending = false;
        }
      }
      runtime.elapsedSec += callSec;
      repsLeft -= repsThisWindow;
    }
  }

  if (runtime.result !== 'playing' || hpAtSteadyStart == null) return false;
  return runtime.playerHp >= hpAtSteadyStart;
};

const passesEndlessCap = (
  stage: GuardStageInput,
  phrases: readonly DefensePhrase[],
  difficulty: DefenseDifficulty,
  cap: DefenseEndlessAccelCap,
): boolean => {
  const front = runEndlessSurvivalDryRun(stage, phrases, difficulty, cap, 'front_delayed');
  if (!front) return false;
  return runEndlessSurvivalDryRun(stage, phrases, difficulty, cap, 'back');
};

export const resolveDefenseEndlessAccelCap = (
  stage: GuardStageInput,
  phrases: readonly DefensePhrase[],
  difficulty: DefenseDifficulty,
): DefenseEndlessAccelCap => {
  const tryCapScale = (scale: number): boolean => passesEndlessCap(
    stage,
    phrases,
    difficulty,
    scaleDefenseEndlessAccelCap(scale),
  );

  if (tryCapScale(1)) {
    return scaleDefenseEndlessAccelCap(ENDLESS_CAP_SAFETY_FACTOR);
  }

  let low = 0;
  let high = 1;
  for (let step = 0; step < MAX_BINARY_SEARCH_STEPS; step += 1) {
    const mid = (low + high) / 2;
    if (tryCapScale(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  if (low > 0) {
    return scaleDefenseEndlessAccelCap(low * ENDLESS_CAP_SAFETY_FACTOR);
  }

  const fixedCap: DefenseEndlessAccelCap = {
    maxSpeedMult: 1,
    maxSpawnMult: 1,
    maxHpMult: 1,
    startSpeedMult: 1,
  };
  if (passesEndlessCap(stage, phrases, difficulty, fixedCap)) {
    return fixedCap;
  }

  let speedLow = 0.25;
  let speedHigh = 1;
  for (let step = 0; step < MAX_BINARY_SEARCH_STEPS; step += 1) {
    const mid = (speedLow + speedHigh) / 2;
    const cap: DefenseEndlessAccelCap = {
      maxSpeedMult: mid,
      maxSpawnMult: 1,
      maxHpMult: 1,
      startSpeedMult: mid,
    };
    if (passesEndlessCap(stage, phrases, difficulty, cap)) {
      speedLow = mid;
    } else {
      speedHigh = mid;
    }
  }

  const guardedStart = Math.max(0.25, speedLow * ENDLESS_START_SPEED_SAFETY_FACTOR);
  return {
    maxSpeedMult: guardedStart,
    maxSpawnMult: 1,
    maxHpMult: 1,
    startSpeedMult: guardedStart,
  };
};
