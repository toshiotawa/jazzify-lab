import { PARRY_VISUAL_SLOW_DURATION_MS } from './earTrainingBattleDrawState';

export const BEAT_SYNC_TARGET_OFFSET_SEC = 0.25;
const BEAT_EPS = 1e-6;

export interface ParryBeatSyncSchedule {
  landingPhraseSec: number;
  slowDurationMs: number;
  panInEndPerfMs: number;
  returnEndPerfMs: number;
  slowPhaseMs: number;
  ringExpandStartMs: number;
}

export interface ResolveParryBeatSyncScheduleParams {
  hitPhraseSec: number;
  hitPerfMs: number;
  bpm: number;
  isSwing: boolean;
  targetOffsetSec?: number;
  nextTargetPhraseSec?: number;
}

const beatDurationSec = (bpm: number): number => 60 / Math.max(1, bpm);

const collectLandingCandidates = (
  hitPhraseSec: number,
  bpm: number,
): number[] => {
  const beatDur = beatDurationSec(bpm);
  const hitBeat = hitPhraseSec / beatDur;
  const startBeat = Math.floor(hitBeat + BEAT_EPS);
  const endBeat = Math.ceil(hitBeat + 2);
  const candidates: number[] = [];

  for (let beat = startBeat; beat <= endBeat; beat += 1) {
    const onBeatSec = beat * beatDur;
    if (onBeatSec > hitPhraseSec + BEAT_EPS) {
      candidates.push(onBeatSec);
    }
  }

  return candidates;
};

export const resolveBeatSyncLandingSec = (
  hitPhraseSec: number,
  bpm: number,
  _isSwing: boolean,
  targetOffsetSec = BEAT_SYNC_TARGET_OFFSET_SEC,
): number => {
  const targetSec = hitPhraseSec + targetOffsetSec;
  const candidates = collectLandingCandidates(hitPhraseSec, bpm);
  if (candidates.length === 0) {
    return hitPhraseSec + targetOffsetSec;
  }

  let bestSec = candidates[0];
  let bestDistance = Math.abs(bestSec - targetSec);

  for (let i = 1; i < candidates.length; i += 1) {
    const candidateSec = candidates[i];
    const distance = Math.abs(candidateSec - targetSec);

    if (distance < bestDistance - BEAT_EPS) {
      bestSec = candidateSec;
      bestDistance = distance;
      continue;
    }
    if (Math.abs(distance - bestDistance) <= BEAT_EPS && candidateSec > bestSec) {
      bestSec = candidateSec;
      bestDistance = distance;
    }
  }

  return bestSec;
};

export const phraseLandingToPerfMs = (
  hitPhraseSec: number,
  landingPhraseSec: number,
  hitPerfMs: number,
): number => hitPerfMs + (landingPhraseSec - hitPhraseSec) * 1000;

export const shouldRestartParryZoom = (
  nextTargetPhraseSec: number | undefined,
  landingPhraseSec: number,
): boolean =>
  nextTargetPhraseSec !== undefined
  && Number.isFinite(nextTargetPhraseSec)
  && nextTargetPhraseSec < landingPhraseSec - BEAT_EPS;

export const resolveParryBeatSyncSchedule = (
  params: ResolveParryBeatSyncScheduleParams,
): ParryBeatSyncSchedule => {
  const {
    hitPhraseSec,
    hitPerfMs,
    bpm,
    isSwing,
    targetOffsetSec = BEAT_SYNC_TARGET_OFFSET_SEC,
  } = params;

  const landingPhraseSec = resolveBeatSyncLandingSec(
    hitPhraseSec,
    bpm,
    isSwing,
    targetOffsetSec,
  );
  const slowDurationMs = Math.max(
    1,
    Math.round((landingPhraseSec - hitPhraseSec) * 1000),
  );
  const endPerfMs = phraseLandingToPerfMs(hitPhraseSec, landingPhraseSec, hitPerfMs);

  return {
    landingPhraseSec,
    slowDurationMs,
    slowPhaseMs: slowDurationMs,
    ringExpandStartMs: slowDurationMs + 1,
    panInEndPerfMs: endPerfMs,
    returnEndPerfMs: endPerfMs,
  };
};

export const resolveParryBeatSyncScheduleOrFallback = (
  params: Partial<ResolveParryBeatSyncScheduleParams> & { hitPerfMs: number },
): ParryBeatSyncSchedule => {
  const {
    hitPhraseSec,
    hitPerfMs,
    bpm,
    isSwing,
    targetOffsetSec,
  } = params;

  if (
    hitPhraseSec === undefined
    || bpm === undefined
    || isSwing === undefined
    || !Number.isFinite(hitPhraseSec)
    || !Number.isFinite(bpm)
    || bpm <= 0
  ) {
    const fallbackMs = PARRY_VISUAL_SLOW_DURATION_MS;
    const endPerfMs = hitPerfMs + fallbackMs;
    return {
      landingPhraseSec: hitPhraseSec ?? 0,
      slowDurationMs: fallbackMs,
      slowPhaseMs: fallbackMs,
      ringExpandStartMs: fallbackMs + 1,
      panInEndPerfMs: endPerfMs,
      returnEndPerfMs: endPerfMs,
    };
  }

  return resolveParryBeatSyncSchedule({
    hitPhraseSec,
    hitPerfMs,
    bpm,
    isSwing,
    targetOffsetSec,
    nextTargetPhraseSec: params.nextTargetPhraseSec,
  });
};
