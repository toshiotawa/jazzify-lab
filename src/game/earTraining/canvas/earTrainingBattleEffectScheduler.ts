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
  easeCubicIn,
  getEffectProgress,
  getVisualNow,
  hexColor,
  lerp,
  PARRY_FINISH_START_MS,
  PARRY_GUARD_SWAP_MS,
  PARRY_MOTION_END_MS,
  PARRY_RING_START_MS,
  PARRY_TOTAL_MS,
  PARRY_VISUAL_SLOW_DURATION_MS,
  PARRY_VISUAL_SLOW_SCALE,
} from './earTrainingBattleDrawState';
import {
  flashCharacter,
  holdCharacterForAction,
  knockCharacter,
  scheduleCharacterRecover,
} from './earTrainingBattleCharacterMotion';
import type { CharacterMotionTimers } from './earTrainingBattleCharacterMotion';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import {
  triggerCameraShake,
  triggerZoomToPlayer,
} from './earTrainingBattleCamera';

const CORRECT_IMPACT_MS = 540;
const MISS_IMPACT_MS = 520;
const FAIL_IMPACT_MS = 700;
const PARRY_GUARD_SLOW_RING_DELAY_MS = 35;
const PARRY_RING_ORANGE = 'rgba(251, 146, 60, 0.85)';
const PARRY_RING_ORANGE_FADE = 'rgba(251, 146, 60, 0.42)';
const PARRY_PRECISE_RING_ORANGE = 'rgba(251, 146, 60, 1)';
const PARRY_FIREWORK_COLORS = [
  '#ffffff',
  '#fef08a',
  '#fde047',
  '#fb923c',
  '#f97316',
  '#bae6fd',
  '#7dd3fc',
  '#fef3c7',
] as const;
const GOOD_COMPLETE_IMPACT_MS = 680;
const GREAT_COMPLETE_IMPACT_MS = 860;
const PERFECT_LIGHTNING_IMPACT_MS = 470;
const METEOR_IMPACT_MS = 980;
const AWESOME_METEOR_START_MS = 180 + 1080 + 340;
const CORRECT_PLAYER_POSE_DURATION_MS = 300;
const SKILL_PLAYER_POSE_FRAME_MS = 80;
const SKILL_PLAYER_POSE_SEQUENCE = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'] as const;
const AWESOME_MAGIC_CIRCLE_ALPHA = 0.68;
const HAMMER_DISMISS_FADE_MS = 280;
const OSMD_REFLECT_HIT_DELAY_MS = PARRY_FINISH_START_MS;
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

const addParryGuardEffect = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  startedAt: number,
): void => {
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'ring',
    startedAt,
    durationMs: 90,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color: 'rgba(255, 255, 255, 0)',
    strokeColor: PARRY_RING_ORANGE,
    size: 30,
    alpha: 0.75,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 0.45,
    scaleEnd: 1.15,
  });
  addVisual(visuals, {
    kind: 'ring',
    startedAt: startedAt + PARRY_GUARD_SLOW_RING_DELAY_MS,
    durationMs: 240,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color: 'rgba(255, 255, 255, 0)',
    strokeColor: PARRY_RING_ORANGE_FADE,
    size: 38,
    alpha: 0.24,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 0.7,
    scaleEnd: 1.75,
  });
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'osmdHammerReflect' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const addParryFireworks = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  startedAt: number,
): void => {
  const visuals: CanvasEffectVisual[] = [];
  const waveOffsets = [0, 55, 110, 165];
  for (const waveOffset of waveOffsets) {
    addVisual(visuals, {
      kind: 'burst',
      startedAt: startedAt + waveOffset,
      durationMs: 110,
      fromX: x,
      fromY: y,
      toX: x,
      toY: y,
      color: 'rgba(255, 255, 255, 0.95)',
      size: 22 + waveOffset * 0.15,
      alpha: 0.92,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 0.25,
      scaleEnd: 1.45,
      fadeOut: true,
    });
    addVisual(visuals, {
      kind: 'ring',
      startedAt: startedAt + waveOffset,
      durationMs: 260,
      fromX: x,
      fromY: y,
      toX: x,
      toY: y,
      color: 'rgba(255, 255, 255, 0)',
      strokeColor: waveOffset % 110 === 0 ? PARRY_RING_ORANGE : PARRY_RING_ORANGE_FADE,
      size: 18 + waveOffset * 0.08,
      alpha: 0.7,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 0.35,
      scaleEnd: 2.8,
      fadeOut: true,
    });
  }

  for (let wave = 0; wave < 3; wave += 1) {
    const waveStart = startedAt + wave * 65;
    const particleCount = 16 + wave * 6;
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / particleCount + (Math.random() - 0.5) * 0.45;
      const distance = 34 + Math.random() * 56 + wave * 14;
      addVisual(visuals, {
        kind: 'particle',
        startedAt: waveStart,
        durationMs: 420 + Math.round(Math.random() * 220),
        fromX: x,
        fromY: y,
        toX: x + Math.cos(angle) * distance,
        toY: y + Math.sin(angle) * distance - Math.random() * 28,
        color: PARRY_FIREWORK_COLORS[index % PARRY_FIREWORK_COLORS.length],
        size: 4 + Math.random() * 6,
        alpha: 0.98,
        rotation: 0,
        rotationEnd: 0,
        scaleStart: 1.35,
        scaleEnd: 0.12,
        fadeOut: true,
      });
    }
  }

  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'osmdHammerReflect' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const triggerParryVisualSlow = (runtime: EarTrainingBattleDrawRuntime, now: number): void => {
  runtime.visualSlow = {
    startedAt: now,
    durationMs: PARRY_VISUAL_SLOW_DURATION_MS,
    scale: PARRY_VISUAL_SLOW_SCALE,
  };
};

export const clearParryMotionTimers = (runtime: EarTrainingBattleDrawRuntime): void => {
  if (runtime.parryGuardSwapTimer !== null) {
    clearTimeout(runtime.parryGuardSwapTimer);
    runtime.parryGuardSwapTimer = null;
  }
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
): void => {
  if (runtime.parryGuardSwapTimer !== null) {
    clearTimeout(runtime.parryGuardSwapTimer);
    runtime.parryGuardSwapTimer = null;
  }
  cancelParryFinishMotion(runtime);

  runtime.parryMotionGeneration += 1;
  const generation = runtime.parryMotionGeneration;
  const firstGuard = runtime.parryGuardPoseAlternate ? 'yokoIssenC' : 'yokoIssenB';
  const secondGuard = runtime.parryGuardPoseAlternate ? 'yokoIssenB' : 'yokoIssenC';
  runtime.parryGuardPoseAlternate = !runtime.parryGuardPoseAlternate;

  const setPose = (poseKey: string | null, remainingMs: number): void => {
    runtime.player.poseKey = poseKey;
    runtime.player.poseUntil = performance.now() + remainingMs + 40;
    onDirty();
  };

  setPose(firstGuard, PARRY_TOTAL_MS);

  runtime.parryGuardSwapTimer = setTimeout(() => {
    if (runtime.parryMotionGeneration !== generation) return;
    setPose(secondGuard, PARRY_TOTAL_MS - PARRY_GUARD_SWAP_MS);
  }, PARRY_GUARD_SWAP_MS);

  runtime.parryFinishTimer = setTimeout(() => {
    if (runtime.parryMotionGeneration !== generation) return;
    setPose('yokoIssen', PARRY_TOTAL_MS - PARRY_FINISH_START_MS);
  }, PARRY_FINISH_START_MS);

  runtime.parryMotionEndTimer = setTimeout(() => {
    if (runtime.parryMotionGeneration !== generation) return;
    runtime.player.poseKey = null;
    onDirty();
  }, PARRY_MOTION_END_MS);
};

const THIN_RING_STACK_MAX = 3;

const registerTrackedEffect = (
  runtime: EarTrainingBattleDrawRuntime,
  effect: CanvasEffectRuntime,
): void => {
  runtime.effects.push(effect);
  if (effect.commandId >= 0) {
    runtime.effectByCommandId.set(effect.commandId, effect);
  }
};

const syncActiveThinRingCount = (
  runtime: EarTrainingBattleDrawRuntime,
  now: number,
): void => {
  let count = 0;
  for (const effect of runtime.effects) {
    for (const visual of effect.visuals) {
      if (visual.kind === 'thinRing' && now < visual.startedAt + visual.durationMs) {
        count += 1;
      }
    }
  }
  runtime.activeThinRingCount = count;
};

const addPreciseParryRing = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  startedAt: number,
): void => {
  const stackIndex = Math.min(runtime.activeThinRingCount, THIN_RING_STACK_MAX);
  runtime.activeThinRingCount += 1;
  const scaleStart = 0.45 + stackIndex * 0.12;
  const scaleEnd = 2.3 + stackIndex * 0.16;
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'thinRing',
    startedAt,
    durationMs: 480,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color: PARRY_PRECISE_RING_ORANGE,
    size: 68,
    alpha: 1,
    rotation: 0,
    rotationEnd: 0,
    scaleStart,
    scaleEnd,
    fadeOut: true,
  });
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'osmdHammerReflect' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const dismissIncomingOsmdHammer = (
  runtime: EarTrainingBattleDrawRuntime,
  relatedEffectId: number | undefined,
): void => {
  if (relatedEffectId === undefined) return;
  const incoming = runtime.effectByCommandId.get(relatedEffectId);
  if (!incoming) return;
  incoming.osmdHammerActive = false;
  const now = performance.now();
  const hammerVisual = incoming.visuals.find(visual => visual.kind === 'hammer');
  if (!hammerVisual) {
    incoming.visuals = [];
    return;
  }
  const progress = getEffectProgress(hammerVisual, now);
  const currentX = lerp(hammerVisual.fromX, hammerVisual.toX, easeCubicIn(progress));
  const currentY = lerp(hammerVisual.fromY, hammerVisual.toY, easeCubicIn(progress));
  const currentRotation = lerp(hammerVisual.rotation, hammerVisual.rotationEnd, progress);
  incoming.visuals = [{
    id: nextVisualId(),
    kind: 'hammer',
    startedAt: now,
    durationMs: HAMMER_DISMISS_FADE_MS,
    fromX: currentX,
    fromY: currentY,
    toX: currentX,
    toY: currentY,
    color: '#ffffff',
    size: hammerVisual.size,
    alpha: 1,
    rotation: currentRotation,
    rotationEnd: currentRotation,
    scaleStart: 1,
    scaleEnd: 1,
    imageKey: 'hammer',
    fadeOut: true,
  }];
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
  const facingLeft = anchors.player.x <= anchors.enemy.x;
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
    rotation: facingLeft ? 180 : 0,
    rotationEnd: facingLeft ? 180 : 0,
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
  const { runtime, anchors, onDirty, onImpact, playerTimers, snapshot, width } = ctx;
  const now = performance.now();

  const guardDirection = anchors.enemy.x < anchors.player.x ? -1 : 1;
  const guardX = anchors.player.x + guardDirection * 54;
  const guardY = anchors.player.bodyY - 22;

  holdCharacterForAction(
    runtime.player,
    'cast',
    PARRY_TOTAL_MS,
    snapshot,
    runtime.enemy.x,
    width,
    playerTimers,
    onDirty,
  );

  dismissIncomingOsmdHammer(runtime, command.relatedEffectId);
  triggerParryVisualSlow(runtime, now);
  scheduleParryMotion(runtime, onDirty);
  addParryFireworks(runtime, guardX, guardY, now);
  addParryGuardEffect(runtime, guardX, guardY, now + PARRY_RING_START_MS);
  if (command.precise === true) {
    addPreciseParryRing(runtime, anchors.player.x, anchors.player.bodyY, now + PARRY_RING_START_MS);
  }

  const visuals: CanvasEffectVisual[] = [];

  const slashCenterX = (guardX + anchors.enemy.x) / 2;
  const slashSpan = Math.abs(anchors.enemy.x - guardX) + 48;
  addVisual(visuals, {
    kind: 'slash',
    startedAt: now + PARRY_FINISH_START_MS,
    durationMs: PARRY_MOTION_END_MS - PARRY_FINISH_START_MS,
    fromX: slashCenterX,
    fromY: guardY,
    toX: slashCenterX,
    toY: guardY,
    color: 'rgba(255, 255, 255, 0.95)',
    size: slashSpan / 1.9,
    alpha: 1,
    rotation: -4,
    rotationEnd: -4,
    scaleStart: 0.5,
    scaleEnd: 1,
  });

  runtime.effects.push({
    commandId: command.id,
    command,
    startedAt: now,
    impactAt: now + OSMD_REFLECT_HIT_DELAY_MS,
    impactFired: false,
    visuals,
  });

  setTimeout(() => {
    flashCharacter(runtime.enemy, 2, 70);
    showDamageText(runtime, command.damage, anchors.enemy.x, anchors.enemy.bodyY);
    scheduleEnemyKnockback(ctx, 22, 160);
    onImpact(command.id);
    onDirty();
  }, OSMD_REFLECT_HIT_DELAY_MS);
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
  const { runtime, anchors, onDirty, playerTimers, snapshot, width, height } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1780, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, 'Awesome!', anchors.player.x, anchors.player.resultTextY, '#fde68a', 1600);
  triggerZoomToPlayer(runtime.camera, anchors.player.x, anchors.player.bodyY, width / 2, height / 2, 1080);
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
    case 'osmdHammerReflect':
      playOsmdHammerReflectEffect(ctx, command);
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
    runtime.visualSlow = null;
  }
  const visualNow = getVisualNow(now, runtime.visualSlow);
  runtime.effects = runtime.effects.filter(effect => {
    const maxVisualEnd = effect.visuals.reduce(
      (max, visual) => Math.max(max, visual.startedAt + visual.durationMs),
      effect.startedAt,
    );
    const keep = maxVisualEnd + 200 > visualNow;
    if (!keep && effect.commandId >= 0) {
      runtime.effectByCommandId.delete(effect.commandId);
    }
    return keep;
  });
  syncActiveThinRingCount(runtime, visualNow);
  runtime.floatingTexts = runtime.floatingTexts.filter(t => now - t.startedAt < t.durationMs);
  runtime.damageTexts = runtime.damageTexts.filter(t => now - t.startedAt < t.durationMs);
  if (runtime.screenFlash && now - runtime.screenFlash.startedAt > runtime.screenFlash.durationMs) {
    runtime.screenFlash = null;
  }
};

export const SKILL_POSE_FRAME_MS = SKILL_PLAYER_POSE_FRAME_MS;
