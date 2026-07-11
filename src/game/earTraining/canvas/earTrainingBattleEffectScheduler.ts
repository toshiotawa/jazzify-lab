import type { EarTrainingBattleEffectCommand } from '@/game/earTraining/types';
import type { BattleAnchors } from './earTrainingBattleLayout';
import type {
  CanvasCharacterRuntime,
  CanvasDamageText,
  CanvasEffectRuntime,
  CanvasEffectVisual,
  CanvasFloatingText,
  EarTrainingBattleDrawRuntime,
} from './earTrainingBattleDrawState';
import {
  clearParryZoom,
  triggerCameraShake,
  triggerParryPhraseZoom,
} from './earTrainingBattleCamera';
import {
  clearJustParryEffect,
  JUST_PARRY_VISUAL_DURATION_MS,
  pruneJustParryEffect,
  startJustParryEffect,
} from './earTrainingBattleJustParryEffect';
import {
  resolveParryBeatSyncScheduleOrFallback,
  resolveParryZoomEndPhraseSec,
  resolveParryZoomScaleAtPhraseSec,
  resolvePhraseSecFromPerfAnchor,
} from './earTrainingBattleBeatSyncTiming';
import {
  createParryBeatSyncFromSlowPhaseMs,
  easeCubicIn,
  easeLinear,
  getEffectProgress,
  hexColor,
  lerp,
  PARRY_MOTION_END_MS,
  PARRY_REFLECT_HAMMER_WALL_MS,
  PARRY_TOTAL_MS,
  PARRY_ZOOM_TARGET,
} from './earTrainingBattleDrawState';
import {
  flashCharacter,
  holdCharacterForAction,
  knockCharacter,
  scheduleCharacterRecover,
} from './earTrainingBattleCharacterMotion';
import type { CharacterMotionTimers } from './earTrainingBattleCharacterMotion';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import { applyOsuCircleAnchorOffset } from './earTrainingBattleOsuCircleLayout';
import {
  burstOsuCircle,
  dismissOsuCircle,
  pruneOsuCircles,
  spawnOsuCircle,
} from './earTrainingBattleOsuCirclePool';
import {
  OSU_CIRCLE_INNER_RADIUS_PX,
} from './earTrainingBattleOsuCircleTiming';
import {
  pruneOsuCircleShatter,
  spawnOsuCircleShatter,
} from './earTrainingBattleOsuCircleShatterPool';

const CORRECT_IMPACT_MS = 540;
const MISS_IMPACT_MS = 520;
const FAIL_IMPACT_MS = 700;
const PARRY_GUARD_POSE_KEY = 'guardD';
const PARRY_FINISH_POSE_KEY = 'finish';
/** 連続ガード間で通常立ち絵を挟む最短時間 */
const PARRY_GUARD_STAND_BLIP_MS = 1;
const CORRECT_PLAYER_POSE_DURATION_MS = 300;
const GOOD_COMPLETE_IMPACT_MS = 680;
const GREAT_COMPLETE_IMPACT_MS = 860;
const PERFECT_LIGHTNING_IMPACT_MS = 470;
const METEOR_IMPACT_MS = 980;
const AWESOME_METEOR_START_MS = 1080;
const SKILL_PLAYER_POSE_FRAME_MS = 80;
const SKILL_PLAYER_POSE_SEQUENCE = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'] as const;
const AWESOME_MAGIC_CIRCLE_ALPHA = 0.68;
const HAMMER_THROW_WAVE_DURATION_MS = 200;

let visualIdCounter = 0;
const nextVisualId = (): string => {
  visualIdCounter += 1;
  return `fx-${visualIdCounter}`;
};

const addVisual = (
  visuals: CanvasEffectVisual[],
  visual: Omit<CanvasEffectVisual, 'id'>,
): void => {
  visuals.push({ ...visual, id: nextVisualId() });
};

const getRankColor = (label: string): string => {
  if (label === 'Perfect' || label === 'Awesome!') return '#fde68a';
  if (label === 'Great') return '#7dd3fc';
  if (label === 'Good') return '#facc15';
  return '#fef3c7';
};

export interface EffectSchedulerContext {
  runtime: EarTrainingBattleDrawRuntime;
  snapshot: EarTrainingBattleSnapshot;
  anchors: BattleAnchors;
  width: number;
  height: number;
  playerTimers: CharacterMotionTimers;
  enemyTimers: CharacterMotionTimers;
  onDirty: () => void;
  onImpact: (effectId: number) => void;
  scheduleImpact: (effectId: number, delayMs: number) => void;
}

const showFloatingText = (
  runtime: EarTrainingBattleDrawRuntime,
  text: string,
  x: number,
  y: number,
  color: string,
  durationMs = 1200,
): void => {
  runtime.floatingTexts.push({
    text,
    x,
    y,
    color,
    startedAt: performance.now(),
    durationMs,
  });
};

const showDamageText = (
  runtime: EarTrainingBattleDrawRuntime,
  damage: number | undefined,
  x: number,
  y: number,
): void => {
  if (damage === undefined || damage <= 0) return;
  runtime.damageTexts.push({
    text: `-${damage}`,
    x,
    y: y - 24,
    startedAt: performance.now(),
    durationMs: 900,
  });
};

const showScreenFlash = (
  runtime: EarTrainingBattleDrawRuntime,
  color: number,
  alpha: number,
): void => {
  runtime.screenFlash = {
    color: hexColor(color, alpha),
    startedAt: performance.now(),
    durationMs: 360,
    alpha,
  };
};

const tintCharacter = (view: CanvasCharacterRuntime, color: string, durationMs: number): void => {
  view.tintColor = color;
  view.tintUntil = performance.now() + durationMs;
};

const scheduleEnemyKnockback = (
  ctx: EffectSchedulerContext,
  distance: number,
  durationMs: number,
): void => {
  const { runtime, snapshot, width, enemyTimers, onDirty } = ctx;
  setTimeout(() => {
    knockCharacter(runtime.enemy, distance, durationMs, snapshot, runtime.player.x, width, enemyTimers, onDirty);
    const totalMs = durationMs + 360;
    setTimeout(() => {
      if (runtime.enemy.knockbackPhase === 'none') {
        scheduleCharacterRecover(runtime.enemy, runtime.player.x, width, snapshot, enemyTimers, onDirty);
      }
    }, totalMs);
  }, 16);
};

const schedulePlayerKnockback = (
  ctx: EffectSchedulerContext,
  distance: number,
  durationMs: number,
): void => {
  const { runtime, snapshot, width, playerTimers, onDirty } = ctx;
  knockCharacter(runtime.player, distance, durationMs, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  const totalMs = durationMs + 360;
  setTimeout(() => {
    if (runtime.player.knockbackPhase === 'none') {
      scheduleCharacterRecover(runtime.player, runtime.enemy.x, width, snapshot, playerTimers, onDirty);
    }
  }, totalMs);
};

interface LightImpactBurstOptions {
  durationMs: number;
  size: number;
  scaleEnd: number;
  sparkDuration: number;
  sparkCount?: number;
}

const addImpactBurst = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  color: string,
  heavy: boolean,
  lightOptions?: LightImpactBurstOptions,
): void => {
  const startedAt = performance.now();
  const lightDurationMs = lightOptions?.durationMs ?? 420;
  const lightSize = lightOptions?.size ?? 48;
  const lightScaleEnd = lightOptions?.scaleEnd ?? 1.6;
  const lightSparkDuration = lightOptions?.sparkDuration ?? 360;
  const lightSparkCount = lightOptions?.sparkCount ?? 9;
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'burst',
    startedAt,
    durationMs: heavy ? 740 : lightDurationMs,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color,
    size: heavy ? 92 : lightSize,
    alpha: heavy ? 0.16 : 0.16,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: heavy ? 2.25 : lightScaleEnd,
  });
  const sparkCount = heavy ? 22 : lightSparkCount;
  const sparkDistanceX = heavy ? 104 : 44;
  const sparkDistanceY = heavy ? 68 : 30;
  const sparkDuration = heavy ? 680 : lightSparkDuration;
  for (let index = 0; index < sparkCount; index += 1) {
    const angle = (Math.PI * 2 * index) / sparkCount;
    addVisual(visuals, {
      kind: 'spark',
      startedAt,
      durationMs: sparkDuration,
      fromX: x,
      fromY: y,
      toX: x + Math.cos(angle) * sparkDistanceX,
      toY: y + Math.sin(angle) * sparkDistanceY,
      color,
      size: heavy ? 10 : 6,
      alpha: 0.9,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 1,
      scaleEnd: 0.4,
    });
  }
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'correct' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const playOsmdApproachCircleEffect = (
  ctx: EffectSchedulerContext,
  command: EarTrainingBattleEffectCommand,
): void => {
  const { runtime, anchors, onDirty } = ctx;
  if (!runtime.chordOsmdBattle) {
    return;
  }
  const approachStartPhraseSec = command.approachStartPhraseSec;
  const judgedPhraseSec = command.judgedPhraseSec;
  if (approachStartPhraseSec === undefined || judgedPhraseSec === undefined) {
    return;
  }
  const centerX = anchors.player.x;
  const targetY = anchors.player.bodyY - 28;
  const layoutIndex = command.osuCircleLayoutIndex ?? 0;
  const positioned = applyOsuCircleAnchorOffset(centerX, targetY, layoutIndex);
  spawnOsuCircle(runtime.osuCirclePool, {
    commandId: command.id,
    approachStartPhraseSec,
    judgedPhraseSec,
    centerX: positioned.centerX,
    targetY: positioned.targetY,
    layoutIndex,
    noteLabels: command.osuCircleNoteLabels,
    colorIndex: command.osuCircleColorIndex,
  });
  onDirty();
};

const playOsmdApproachCircleBurstEffect = (
  ctx: EffectSchedulerContext,
  command: EarTrainingBattleEffectCommand,
): void => {
  const { runtime, onDirty } = ctx;
  if (!runtime.chordOsmdBattle) {
    return;
  }
  const relatedId = command.relatedEffectId;
  if (relatedId === undefined) {
    return;
  }
  const now = performance.now();
  const position = burstOsuCircle(runtime.osuCirclePool, relatedId);
  if (!position) {
    return;
  }
  spawnOsuCircleShatter(
    runtime.osuCircleShatterPool,
    position.centerX,
    position.targetY,
    OSU_CIRCLE_INNER_RADIUS_PX,
    now,
    position.colorIndex,
  );
  onDirty();
};

const playOsmdApproachCircleDismissEffect = (
  ctx: EffectSchedulerContext,
  command: EarTrainingBattleEffectCommand,
): void => {
  const { runtime, onDirty } = ctx;
  if (!runtime.chordOsmdBattle) {
    return;
  }
  const relatedId = command.relatedEffectId;
  if (relatedId === undefined) {
    return;
  }
  dismissOsuCircle(runtime.osuCirclePool, relatedId);
  onDirty();
};

const triggerParryBeatSyncEffects = (
  runtime: EarTrainingBattleDrawRuntime,
  command: EarTrainingBattleEffectCommand,
  now: number,
  focusX: number,
  focusY: number,
  width: number,
  height: number,
): void => {
  if (command.clearParryVisualSlow) {
    endVisualSlowAndResyncReflectHammers(runtime, now);
    clearParryZoom(runtime.camera);
    clearJustParryEffect(runtime.justParryEffect);
    return;
  }

  if (command.parryFinishOnly) {
    endVisualSlowAndResyncReflectHammers(runtime, now);
  }

  const schedule = resolveParryBeatSyncScheduleOrFallback({
    hitPhraseSec: command.hitPhraseTimeSec,
    hitPerfMs: now,
    bpm: command.effectiveBpm,
    isSwing: command.isSwing,
    nextTargetPhraseSec: command.nextTargetPhraseTimeSec,
  });
  runtime.parryBeatSync = createParryBeatSyncFromSlowPhaseMs(schedule.slowPhaseMs);

  const anchorPhraseSec = command.parryZoomAnchorPhraseSec;
  const peakPhraseSec = command.parryZoomPeakPhraseSec;
  const bpm = command.effectiveBpm;
  const hitPhraseSec = command.hitPhraseTimeSec;
  if (
    anchorPhraseSec === undefined
    || peakPhraseSec === undefined
    || hitPhraseSec === undefined
    || bpm === undefined
    || !Number.isFinite(anchorPhraseSec)
    || !Number.isFinite(peakPhraseSec)
    || !Number.isFinite(hitPhraseSec)
    || !Number.isFinite(bpm)
    || bpm <= 0
  ) {
    return;
  }

  const endPhraseSec = resolveParryZoomEndPhraseSec(peakPhraseSec, bpm);
  let startScale = 1;
  const existingZoom = runtime.camera.parryZoom;
  if (existingZoom) {
    const currentPhraseSec = resolvePhraseSecFromPerfAnchor(
      existingZoom.anchorPhraseSec,
      existingZoom.hitPerfMs,
      now,
    );
    startScale = resolveParryZoomScaleAtPhraseSec(currentPhraseSec, existingZoom);
  }

  // phrase 時刻と wall clock を対応付ける（アンカー時刻 = hitPerf 時点）
  const hitPerfMs = now - (hitPhraseSec - anchorPhraseSec) * 1000;
  triggerParryPhraseZoom(runtime.camera, {
    anchorPhraseSec,
    peakPhraseSec,
    endPhraseSec,
    hitPerfMs,
    focusX,
    focusY,
    centerX: width * 0.5,
    centerY: height * 0.5,
    zoomTarget: PARRY_ZOOM_TARGET,
    startScale,
  });
};

const resolveOneBeatDurationMs = (bpm: number | undefined): number => {
  if (bpm === undefined || !Number.isFinite(bpm) || bpm <= 0) {
    return PARRY_MOTION_END_MS;
  }
  return Math.max(1, Math.round(60_000 / bpm));
};

const resolveFinishParryMotionDurationMs = (
  motionDurationMs: number | undefined,
  bpm: number | undefined,
): number => {
  if (
    motionDurationMs !== undefined
    && Number.isFinite(motionDurationMs)
    && motionDurationMs > 0
  ) {
    return Math.round(motionDurationMs);
  }
  return resolveOneBeatDurationMs(bpm);
};

export const clearParryMotionTimers = (runtime: EarTrainingBattleDrawRuntime): void => {
  if (runtime.parryFinishTimer !== null) {
    clearTimeout(runtime.parryFinishTimer);
    runtime.parryFinishTimer = null;
  }
  if (runtime.parryMotionEndTimer !== null) {
    clearTimeout(runtime.parryMotionEndTimer);
    runtime.parryMotionEndTimer = null;
  }
};

const cancelParryFinishMotion = (runtime: EarTrainingBattleDrawRuntime): void => {
  if (runtime.parryFinishTimer !== null) {
    clearTimeout(runtime.parryFinishTimer);
    runtime.parryFinishTimer = null;
  }
  if (runtime.parryMotionEndTimer !== null) {
    clearTimeout(runtime.parryMotionEndTimer);
    runtime.parryMotionEndTimer = null;
  }
};

const scheduleParryMotion = (
  runtime: EarTrainingBattleDrawRuntime,
  onDirty: () => void,
  finishOnly: boolean,
  motionDurationMs?: number,
): void => {
  if (runtime.parryFinishLocked) {
    return;
  }

  cancelParryFinishMotion(runtime);
  runtime.parryMotionGeneration += 1;
  const generation = runtime.parryMotionGeneration;
  const now = performance.now();

  const setPose = (poseKey: string | null, remainingMs: number): void => {
    runtime.player.poseKey = poseKey;
    runtime.player.poseUntil = performance.now() + remainingMs + 40;
    onDirty();
  };

  const scheduleGuardClear = (): void => {
    runtime.parryMotionEndTimer = setTimeout(() => {
      if (runtime.parryMotionGeneration !== generation) return;
      runtime.player.poseKey = null;
      onDirty();
    }, JUST_PARRY_VISUAL_DURATION_MS);
  };

  const applyGuardPose = (): void => {
    setPose(PARRY_GUARD_POSE_KEY, JUST_PARRY_VISUAL_DURATION_MS);
    scheduleGuardClear();
  };

  if (finishOnly) {
    const finishDurationMs = resolveFinishParryMotionDurationMs(
      motionDurationMs,
      undefined,
    );
    runtime.parryFinishLocked = true;
    setPose(PARRY_FINISH_POSE_KEY, finishDurationMs);

    runtime.parryMotionEndTimer = setTimeout(() => {
      if (runtime.parryMotionGeneration !== generation) return;
      runtime.player.poseKey = null;
      runtime.parryFinishLocked = false;
      onDirty();
    }, finishDurationMs);
    return;
  }

  const isAlreadyGuard = runtime.player.poseKey === PARRY_GUARD_POSE_KEY
    && now < runtime.player.poseUntil;
  if (isAlreadyGuard) {
    // 連続正解: 通常立ち絵を1msだけ経由してから再度ガード
    setPose(null, PARRY_GUARD_STAND_BLIP_MS);
    runtime.parryFinishTimer = setTimeout(() => {
      if (runtime.parryMotionGeneration !== generation) return;
      applyGuardPose();
    }, PARRY_GUARD_STAND_BLIP_MS);
    return;
  }

  applyGuardPose();
};

const registerTrackedEffect = (
  runtime: EarTrainingBattleDrawRuntime,
  effect: CanvasEffectRuntime,
): void => {
  runtime.effects.push(effect);
  if (effect.commandId >= 0) {
    runtime.effectByCommandId.set(effect.commandId, effect);
  }
};

const dismissIncomingOsmdHammer = (
  runtime: EarTrainingBattleDrawRuntime,
  relatedEffectId: number | undefined,
  contactX: number,
  contactY: number,
  now: number,
): { x: number; y: number; size: number } => {
  if (relatedEffectId === undefined) {
    return { x: contactX, y: contactY, size: 76 };
  }
  const incoming = runtime.effectByCommandId.get(relatedEffectId);
  if (!incoming) {
    return { x: contactX, y: contactY, size: 76 };
  }
  incoming.osmdHammerActive = false;
  const hammerVisual = incoming.visuals.find(visual => visual.kind === 'hammer');
  if (!hammerVisual) {
    incoming.visuals = [];
    runtime.effectByCommandId.delete(relatedEffectId);
    return { x: contactX, y: contactY, size: 76 };
  }
  const t = getEffectProgress(hammerVisual, now);
  const x = lerp(hammerVisual.fromX, hammerVisual.toX, easeLinear(t));
  const y = lerp(hammerVisual.fromY, hammerVisual.toY, easeLinear(t));
  incoming.visuals = [];
  runtime.effectByCommandId.delete(relatedEffectId);
  return { x, y, size: hammerVisual.size };
};

const launchReflectedOsmdHammer = (
  visuals: CanvasEffectVisual[],
  contactX: number,
  contactY: number,
  hammerSize: number,
  enemyX: number,
  enemyY: number,
  startedAt: number,
): void => {
  addVisual(visuals, {
    kind: 'hammer',
    startedAt,
    durationMs: PARRY_REFLECT_HAMMER_WALL_MS,
    fromX: contactX,
    fromY: contactY,
    toX: enemyX - 20,
    toY: enemyY,
    color: '#ffffff',
    size: hammerSize,
    alpha: 1,
    rotation: 180,
    rotationEnd: 540,
    scaleStart: 1,
    scaleEnd: 1.05,
    imageKey: 'hammer',
  });
};

const resolveReflectHammerWallImpactDelayMs = (): number => PARRY_REFLECT_HAMMER_WALL_MS;

export const computeReflectHammerResyncState = (
  oldVisualNow: number,
  startedAt: number,
  now: number,
  durationMs: number = PARRY_REFLECT_HAMMER_WALL_MS,
): { progress: number; newStartedAt: number; remainingMs: number } => {
  const progress = Math.min(1, Math.max(0, (oldVisualNow - startedAt) / durationMs));
  return {
    progress,
    newStartedAt: now - progress * durationMs,
    remainingMs: (1 - progress) * durationMs,
  };
};

const fireReflectHammerImpact = (
  runtime: EarTrainingBattleDrawRuntime,
  effect: CanvasEffectRuntime,
): void => {
  if (effect.impactFired) {
    return;
  }
  effect.impactFired = true;
  if (effect.impactTimeoutId !== undefined) {
    clearTimeout(effect.impactTimeoutId);
    effect.impactTimeoutId = undefined;
  }
  const callbacks = runtime.reflectImpactCallbacks;
  if (!callbacks) {
    return;
  }
  flashCharacter(runtime.enemy, 2, 70);
  addImpactBurst(runtime, callbacks.enemyX, callbacks.enemyBodyY, '#fde68a', false, {
    durationMs: 220,
    size: 40,
    scaleEnd: 1.35,
    sparkDuration: 180,
    sparkCount: 6,
  });
  showDamageText(runtime, effect.command.damage, callbacks.enemyX, callbacks.enemyBodyY);
  callbacks.onImpact(effect.command.id);
  callbacks.onDirty();
};

const scheduleReflectHammerImpact = (
  runtime: EarTrainingBattleDrawRuntime,
  effect: CanvasEffectRuntime,
  delayMs: number,
): void => {
  if (effect.impactTimeoutId !== undefined) {
    clearTimeout(effect.impactTimeoutId);
  }
  if (delayMs <= 0) {
    fireReflectHammerImpact(runtime, effect);
    return;
  }
  effect.impactTimeoutId = setTimeout(() => {
    effect.impactTimeoutId = undefined;
    fireReflectHammerImpact(runtime, effect);
  }, delayMs);
};

export const endVisualSlowAndResyncReflectHammers = (
  runtime: EarTrainingBattleDrawRuntime,
  _now: number,
): void => {
  runtime.visualSlow = null;
};

const showPlayerPoseSequence = (
  runtime: EarTrainingBattleDrawRuntime,
  onDirty: () => void,
): void => {
  SKILL_PLAYER_POSE_SEQUENCE.forEach((poseKey, index) => {
    setTimeout(() => {
      runtime.player.poseKey = poseKey;
      runtime.player.poseUntil = performance.now() + SKILL_PLAYER_POSE_FRAME_MS;
      onDirty();
    }, index * SKILL_PLAYER_POSE_FRAME_MS);
  });
  setTimeout(() => {
    runtime.player.poseKey = null;
    onDirty();
  }, SKILL_PLAYER_POSE_SEQUENCE.length * SKILL_PLAYER_POSE_FRAME_MS);
};

const playCorrectEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, scheduleImpact, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'cast', 720, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  runtime.player.poseKey = 'correct3';
  runtime.player.poseUntil = performance.now() + CORRECT_PLAYER_POSE_DURATION_MS;

  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  if (command.originPoint) {
    addVisual(visuals, {
      kind: 'energyOrb',
      startedAt,
      durationMs: 140,
      fromX: command.originPoint.x,
      fromY: command.originPoint.y,
      toX: anchors.player.x,
      toY: anchors.player.castY,
      color: '#86efac',
      size: 14,
      alpha: 0.95,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 1,
      scaleEnd: 0.4,
    });
  }
  addVisual(visuals, {
    kind: 'projectile',
    startedAt,
    durationMs: CORRECT_IMPACT_MS,
    fromX: anchors.player.x + 44,
    fromY: anchors.player.castY,
    toX: anchors.enemy.x,
    toY: anchors.enemy.bodyY,
    color: '#f97316',
    size: 78,
    alpha: 1,
    rotation: -24,
    rotationEnd: 16,
    scaleStart: 1,
    scaleEnd: 1.23,
    imageKey: 'fireball',
  });

  runtime.effects.push({
    commandId: command.id,
    command,
    startedAt,
    impactAt: startedAt + CORRECT_IMPACT_MS,
    impactFired: false,
    visuals,
  });
  scheduleImpact(command.id, CORRECT_IMPACT_MS);
  setTimeout(() => {
    flashCharacter(runtime.enemy, 2, 70);
    addImpactBurst(runtime, anchors.enemy.x, anchors.enemy.bodyY, '#fb923c', false);
    showDamageText(runtime, command.damage, anchors.enemy.x, anchors.enemy.bodyY);
    scheduleEnemyKnockback(ctx, 24, 170);
    onDirty();
  }, CORRECT_IMPACT_MS);
};

const playEnemyAttackEffect = (
  ctx: EffectSchedulerContext,
  command: EarTrainingBattleEffectCommand,
  heavy: boolean,
): void => {
  const { runtime, anchors, onDirty, scheduleImpact, enemyTimers, snapshot, width } = ctx;
  const impactMs = heavy ? FAIL_IMPACT_MS : MISS_IMPACT_MS;
  holdCharacterForAction(runtime.enemy, 'attack', heavy ? 980 : 760, snapshot, runtime.player.x, width, enemyTimers, onDirty);
  if (heavy) {
    showFloatingText(runtime, command.label ?? 'Fail', anchors.player.x, anchors.player.resultTextY, '#fecaca');
  }
  triggerCameraShake(runtime.camera, heavy ? 8 : 5, heavy ? 240 : 150);
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'hammer',
    startedAt: performance.now(),
    durationMs: impactMs,
    fromX: anchors.enemy.x - 28,
    fromY: anchors.enemy.bodyY,
    toX: anchors.player.x,
    toY: anchors.player.bodyY,
    color: '#ffffff',
    size: heavy ? 104 : 76,
    alpha: 1,
    rotation: -18,
    rotationEnd: heavy ? 1062 : 702,
    scaleStart: 1,
    scaleEnd: 1,
    imageKey: 'hammer',
  });
  runtime.effects.push({
    commandId: command.id,
    command,
    startedAt: performance.now(),
    impactAt: performance.now() + impactMs,
    impactFired: false,
    visuals,
  });
  scheduleImpact(command.id, impactMs);
  setTimeout(() => {
    flashCharacter(runtime.player, 3, 70);
    addImpactBurst(runtime, anchors.player.x, anchors.player.bodyY, '#fb7185', heavy);
    schedulePlayerKnockback(ctx, heavy ? -52 : -32, heavy ? 290 : 210);
    onDirty();
  }, impactMs);
};

const addEnemyHammerThrowWave = (
  runtime: EarTrainingBattleDrawRuntime,
  anchors: BattleAnchors,
): void => {
  const startedAt = performance.now();
  const waveX = anchors.enemy.x - 28;
  const waveY = anchors.enemy.bodyY;
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'shockwave',
    startedAt,
    durationMs: HAMMER_THROW_WAVE_DURATION_MS,
    fromX: waveX,
    fromY: waveY,
    toX: waveX,
    toY: waveY,
    color: 'rgba(255, 255, 255, 0.85)',
    size: 56,
    alpha: 0.85,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 0.45,
    scaleEnd: 1.35,
    fadeOut: true,
  });
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'osmdHammer' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const playOsmdHammerEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, scheduleImpact, enemyTimers, snapshot, width } = ctx;
  const impactMs = Math.max(120, Math.round((command.travelDurationSec ?? 0.72) * 1000));
  addEnemyHammerThrowWave(runtime, anchors);
  holdCharacterForAction(runtime.enemy, 'attack', 760, snapshot, runtime.player.x, width, enemyTimers, onDirty);
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'hammer',
    startedAt: performance.now(),
    durationMs: impactMs,
    fromX: anchors.enemy.x - 28,
    fromY: anchors.enemy.bodyY - 8,
    toX: anchors.player.x,
    toY: anchors.player.bodyY,
    color: '#ffffff',
    size: 76,
    alpha: 1,
    rotation: -18,
    rotationEnd: 720,
    scaleStart: 1,
    scaleEnd: 1,
    imageKey: 'hammer',
  });
  const effect: CanvasEffectRuntime = {
    commandId: command.id,
    command,
    startedAt: performance.now(),
    impactAt: performance.now() + impactMs,
    impactFired: false,
    visuals,
    osmdHammerActive: true,
  };
  registerTrackedEffect(runtime, effect);
  scheduleImpact(command.id, impactMs);
  setTimeout(() => {
    if (!effect.osmdHammerActive) return;
    flashCharacter(runtime.player, 2, 70);
    addImpactBurst(runtime, anchors.player.x, anchors.player.bodyY, '#fb7185', false, {
      durationMs: 260,
      size: 34,
      scaleEnd: 1.3,
      sparkDuration: 220,
    });
    schedulePlayerKnockback(ctx, -28, 180);
    effect.osmdHammerActive = false;
    onDirty();
  }, impactMs);
};

const playOsmdHammerReflectEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  const now = performance.now();

  const parryCenterX = anchors.player.x;
  const parryCenterY = anchors.player.bodyY - 28;
  const finishOnly = command.parryFinishOnly === true;
  const finishMotionDurationMs = finishOnly
    ? resolveFinishParryMotionDurationMs(
      command.justParryEffectDurationMs,
      command.effectiveBpm,
    )
    : PARRY_TOTAL_MS;

  holdCharacterForAction(
    runtime.player,
    'cast',
    finishMotionDurationMs,
    snapshot,
    runtime.enemy.x,
    width,
    playerTimers,
    onDirty,
  );

  const contact = dismissIncomingOsmdHammer(
    runtime,
    command.relatedEffectId,
    parryCenterX,
    parryCenterY,
    now,
  );
  runtime.lastParryAt = now;
  triggerParryBeatSyncEffects(
    runtime,
    command,
    now,
    anchors.player.x,
    anchors.player.bodyY,
    width,
    runtime.height,
  );
  scheduleParryMotion(
    runtime,
    onDirty,
    finishOnly,
    finishOnly ? finishMotionDurationMs : undefined,
  );

  startJustParryEffect(runtime.justParryEffect, {
    startedAt: now,
    originX: contact.x,
    originY: contact.y,
    seedBase: command.id,
    imageKey: finishOnly ? PARRY_FINISH_POSE_KEY : PARRY_GUARD_POSE_KEY,
    flipX: false,
  });
  triggerCameraShake(runtime.camera, 1.5, 70);

  const impactDelayMs = resolveReflectHammerWallImpactDelayMs();
  const visuals: CanvasEffectVisual[] = [];
  launchReflectedOsmdHammer(
    visuals,
    contact.x,
    contact.y,
    contact.size,
    anchors.enemy.x,
    anchors.enemy.bodyY,
    now,
  );

  const effect: CanvasEffectRuntime = {
    commandId: command.id,
    command,
    startedAt: now,
    impactAt: now + PARRY_REFLECT_HAMMER_WALL_MS,
    impactFired: false,
    visuals,
  };
  runtime.effects.push(effect);

  scheduleReflectHammerImpact(runtime, effect, impactDelayMs);
  onDirty();
};

const applyCompletionImpact = (
  ctx: EffectSchedulerContext,
  command: EarTrainingBattleEffectCommand,
  color: number,
  knockbackDistance: number,
  knockbackDuration: number,
  tintColor: number,
  damage: number | undefined,
  impactDelayMs: number,
): void => {
  const { runtime, anchors, onDirty, scheduleImpact } = ctx;
  scheduleImpact(command.id, impactDelayMs);
  setTimeout(() => {
    flashCharacter(runtime.enemy, 2, 70);
    tintCharacter(runtime.enemy, hexColor(tintColor, 1), knockbackDuration + 260);
    addImpactBurst(runtime, anchors.enemy.x, anchors.enemy.bodyY, hexColor(color, 1), true);
    showScreenFlash(runtime, color, 0.16);
    showDamageText(runtime, damage, anchors.enemy.x, anchors.enemy.bodyY);
    runtime.player.poseKey = null;
    scheduleEnemyKnockback(ctx, knockbackDistance, knockbackDuration);
    onDirty();
  }, impactDelayMs);
};

const playGoodCompleteEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1120, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, command.label ?? 'Good', anchors.player.x, anchors.player.resultTextY, getRankColor(command.label ?? 'Good'));
  showPlayerPoseSequence(runtime, onDirty);
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, { kind: 'projectile', startedAt, durationMs: GOOD_COMPLETE_IMPACT_MS, fromX: anchors.player.x + 42, fromY: anchors.player.castY, toX: anchors.enemy.x, toY: anchors.enemy.bodyY, color: '#facc15', size: 64, alpha: 0.92, rotation: 0, rotationEnd: 540, scaleStart: 1, scaleEnd: 2.75, imageKey: 'fireRing' });
  runtime.effects.push({ commandId: command.id, command, startedAt, impactAt: startedAt + GOOD_COMPLETE_IMPACT_MS, impactFired: false, visuals });
  applyCompletionImpact(ctx, command, 0xfacc15, 84, 330, 0xfef08a, command.damage, GOOD_COMPLETE_IMPACT_MS);
};

const playSnowflakeEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1120, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, command.label ?? 'Great', anchors.player.x, anchors.player.resultTextY, getRankColor('Great'));
  showPlayerPoseSequence(runtime, onDirty);
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, { kind: 'snowflake', startedAt, durationMs: GREAT_COMPLETE_IMPACT_MS, fromX: anchors.player.x + 42, fromY: anchors.player.castY, toX: anchors.enemy.x, toY: anchors.enemy.bodyY, color: '#93c5fd', size: 72, alpha: 1, rotation: 0, rotationEnd: 720, scaleStart: 1, scaleEnd: 2.14, imageKey: 'snowflake' });
  runtime.effects.push({ commandId: command.id, command, startedAt, impactAt: startedAt + GREAT_COMPLETE_IMPACT_MS, impactFired: false, visuals });
  applyCompletionImpact(ctx, command, 0x93c5fd, 106, 360, 0x7dd3fc, command.damage, GREAT_COMPLETE_IMPACT_MS);
};

const playLightningEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1120, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, command.label ?? 'Perfect', anchors.player.x, anchors.player.resultTextY, getRankColor('Perfect'));
  showPlayerPoseSequence(runtime, onDirty);
  triggerCameraShake(runtime.camera, 4, 200);
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, { kind: 'cloud', startedAt, durationMs: 300, fromX: anchors.enemy.x, fromY: anchors.enemy.headY - 32, toX: anchors.enemy.x, toY: anchors.enemy.headY - 32, color: '#ffffff', size: 148, alpha: 0.9, rotation: 0, rotationEnd: 0, scaleStart: 1, scaleEnd: 1, imageKey: 'cloud' });
  addVisual(visuals, { kind: 'lightning', startedAt: startedAt + PERFECT_LIGHTNING_IMPACT_MS, durationMs: 420, fromX: anchors.enemy.x, fromY: anchors.enemy.headY - 18, toX: anchors.enemy.x, toY: anchors.enemy.bodyY + 8, color: '#fef08a', size: 190, alpha: 1, rotation: 4, rotationEnd: 4, scaleStart: 1, scaleEnd: 1, imageKey: 'lightning' });
  runtime.effects.push({ commandId: command.id, command, startedAt, impactAt: startedAt + PERFECT_LIGHTNING_IMPACT_MS, impactFired: false, visuals });
  applyCompletionImpact(ctx, command, 0xfef08a, 122, 390, 0xfef08a, command.damage, PERFECT_LIGHTNING_IMPACT_MS);
};

const launchMeteor = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand, delayMs: number): void => {
  const { runtime, anchors } = ctx;
  setTimeout(() => {
    const startedAt = performance.now();
    const meteorStartY = Math.max(150 + 8, anchors.enemy.headY - 230);
    const visuals: CanvasEffectVisual[] = [];
    addVisual(visuals, {
      kind: 'meteor',
      startedAt,
      durationMs: METEOR_IMPACT_MS,
      fromX: anchors.enemy.x - 148,
      fromY: meteorStartY,
      toX: anchors.enemy.x,
      toY: anchors.enemy.bodyY,
      color: '#f97316',
      size: 230,
      alpha: 1,
      rotation: -8,
      rotationEnd: 10,
      scaleStart: 1,
      scaleEnd: 1.53,
      imageKey: 'meteor',
    });
    runtime.effects.push({
      commandId: command.id,
      command,
      startedAt,
      impactAt: startedAt + METEOR_IMPACT_MS,
      impactFired: false,
      visuals,
    });
    applyCompletionImpact(ctx, command, 0xf97316, 172, 460, 0xffedd5, command.damage, METEOR_IMPACT_MS);
    ctx.onDirty();
  }, delayMs);
};

const playMeteorEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1780, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, 'Awesome!', anchors.player.x, anchors.player.resultTextY, '#fde68a', 1600);
  setTimeout(() => showPlayerPoseSequence(runtime, onDirty), 180);
  const magicStartedAt = performance.now();
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'complete' },
    startedAt: magicStartedAt,
    impactAt: magicStartedAt,
    impactFired: true,
    visuals: [{
      id: nextVisualId(),
      kind: 'magicCircle',
      startedAt: magicStartedAt,
      durationMs: 1080,
      fromX: anchors.player.x,
      fromY: anchors.player.footY - 12,
      toX: anchors.player.x,
      toY: anchors.player.footY - 12,
      color: '#ffffff',
      size: 220,
      alpha: AWESOME_MAGIC_CIRCLE_ALPHA,
      rotation: 0,
      rotationEnd: 180,
      scaleStart: 1,
      scaleEnd: 1.14,
      imageKey: 'magicCircle',
    }],
  });
  launchMeteor(ctx, command, AWESOME_METEOR_START_MS);
  onDirty();
};

const playOsmdMeteorEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1320, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, command.label ?? 'Bonus', anchors.player.x, anchors.player.resultTextY, '#fef08a');
  launchMeteor(ctx, command, 0);
  onDirty();
};

const playQuotaReachedEffect = (ctx: EffectSchedulerContext): void => {
  const { runtime, width, height } = ctx;
  const cx = width / 2;
  const cy = Math.max(150 + 40, Math.round(height * 0.35));
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    addVisual(visuals, {
      kind: 'particle',
      startedAt,
      durationMs: 700,
      fromX: cx,
      fromY: cy,
      toX: cx + Math.cos(angle) * 80,
      toY: cy + Math.sin(angle) * 80,
      color: '#facc15',
      size: 6,
      alpha: 1,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 1,
      scaleEnd: 0.4,
    });
  }
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'quotaReached' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const playVoicingCastEffect = (ctx: EffectSchedulerContext): void => {
  const { runtime, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'cast', CORRECT_PLAYER_POSE_DURATION_MS, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  runtime.player.poseKey = 'cast';
  runtime.player.poseUntil = performance.now() + CORRECT_PLAYER_POSE_DURATION_MS;
  onDirty();
};

const playCompleteEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const label = command.label ?? 'Good';
  const isSuperPerfect = label === 'Perfect' && (command.phraseNoteCount ?? 0) >= 6;
  if (isSuperPerfect) {
    playMeteorEffect(ctx, command);
    return;
  }
  if (label === 'Perfect') {
    playLightningEffect(ctx, command);
    return;
  }
  if (label === 'Great') {
    playSnowflakeEffect(ctx, command);
    return;
  }
  playGoodCompleteEffect(ctx, command);
};

export const scheduleEarTrainingBattleEffect = (
  ctx: EffectSchedulerContext,
  command: EarTrainingBattleEffectCommand,
): void => {
  if (ctx.runtime.lastEffectId === command.id) return;
  ctx.runtime.lastEffectId = command.id;
  ctx.runtime.reflectImpactCallbacks = {
    onImpact: ctx.onImpact,
    onDirty: ctx.onDirty,
    enemyX: ctx.anchors.enemy.x,
    enemyBodyY: ctx.anchors.enemy.bodyY,
  };

  switch (command.kind) {
    case 'correct':
      playCorrectEffect(ctx, command);
      break;
    case 'quotaReached':
      playQuotaReachedEffect(ctx);
      break;
    case 'osmdHammer':
      playOsmdHammerEffect(ctx, command);
      break;
    case 'osmdApproachCircle':
      playOsmdApproachCircleEffect(ctx, command);
      break;
    case 'osmdApproachCircleBurst':
      playOsmdApproachCircleBurstEffect(ctx, command);
      break;
    case 'osmdApproachCircleDismiss':
      playOsmdApproachCircleDismissEffect(ctx, command);
      break;
    case 'osmdHammerReflect':
      playOsmdHammerReflectEffect(ctx, command);
      break;
    case 'clearParryVisualSlow':
      endVisualSlowAndResyncReflectHammers(ctx.runtime, performance.now());
      clearParryZoom(ctx.runtime.camera);
      break;
    case 'osmdMeteor':
      playOsmdMeteorEffect(ctx, command);
      break;
    case 'voicingCast':
      playVoicingCastEffect(ctx);
      break;
    case 'complete':
      playCompleteEffect(ctx, command);
      break;
    case 'fail':
      playEnemyAttackEffect(ctx, command, true);
      break;
    default:
      playEnemyAttackEffect(ctx, command, false);
      break;
  }
  ctx.onDirty();
};

export const pruneExpiredEffects = (runtime: EarTrainingBattleDrawRuntime, now: number): void => {
  if (
    runtime.visualSlow
    && now > runtime.visualSlow.startedAt + runtime.visualSlow.durationMs
  ) {
    endVisualSlowAndResyncReflectHammers(runtime, now);
  }
  const visualNow = now;
  pruneOsuCircles(runtime.osuCirclePool);
  pruneOsuCircleShatter(runtime.osuCircleShatterPool, now);
  pruneJustParryEffect(runtime.justParryEffect, now);
  runtime.effects = runtime.effects.filter(effect => {
    const keepUntil = effect.visuals.reduce((max, visual) => {
      const visualEnd = visual.startedAt + visual.durationMs;
      const lingerEnd = visual.groupStartedAt !== undefined
        ? visual.groupStartedAt + runtime.parryBeatSync.motionEndMs
        : visualEnd;
      return Math.max(max, visualEnd, lingerEnd);
    }, effect.startedAt);
    const keep = keepUntil + 200 > visualNow;
    if (!keep && effect.commandId >= 0) {
      runtime.effectByCommandId.delete(effect.commandId);
    }
    return keep;
  });
  runtime.floatingTexts = runtime.floatingTexts.filter(t => now - t.startedAt < t.durationMs);
  runtime.damageTexts = runtime.damageTexts.filter(t => now - t.startedAt < t.durationMs);
  if (runtime.screenFlash && now - runtime.screenFlash.startedAt > runtime.screenFlash.durationMs) {
    runtime.screenFlash = null;
  }
};

export const SKILL_POSE_FRAME_MS = SKILL_PLAYER_POSE_FRAME_MS;
