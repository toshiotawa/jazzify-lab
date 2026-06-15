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
import { easeCubicIn, getEffectProgress, hexColor, lerp } from './earTrainingBattleDrawState';
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
const GOOD_COMPLETE_IMPACT_MS = 680;
const GREAT_COMPLETE_IMPACT_MS = 860;
const PERFECT_LIGHTNING_IMPACT_MS = 470;
const METEOR_IMPACT_MS = 980;
const AWESOME_METEOR_START_MS = 180 + 1080 + 340;
const CORRECT_PLAYER_POSE_DURATION_MS = 300;
const SKILL_PLAYER_POSE_FRAME_MS = 80;
const SKILL_PLAYER_POSE_SEQUENCE = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'] as const;
const AWESOME_MAGIC_CIRCLE_ALPHA = 0.68;
const HAMMER_FALL_MS = 420;
const HAMMER_FALL_DISTANCE = 130;

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

const addImpactBurst = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  color: string,
  heavy: boolean,
): void => {
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'burst',
    startedAt,
    durationMs: heavy ? 740 : 420,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color,
    size: heavy ? 92 : 48,
    alpha: heavy ? 0.16 : 0.16,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: heavy ? 2.25 : 1.6,
  });
  const sparkCount = heavy ? 22 : 9;
  const sparkDistanceX = heavy ? 104 : 44;
  const sparkDistanceY = heavy ? 68 : 30;
  const sparkDuration = heavy ? 680 : 360;
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
): void => {
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'ring',
    startedAt,
    durationMs: 130,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color: 'rgba(255, 255, 255, 0)',
    size: 42,
    alpha: 0.75,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 0.45,
    scaleEnd: 1.35,
  });
  addVisual(visuals, {
    kind: 'ring',
    startedAt: startedAt + PARRY_GUARD_SLOW_RING_DELAY_MS,
    durationMs: 420,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color: 'rgba(255, 255, 255, 0)',
    size: 56,
    alpha: 0.24,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 0.7,
    scaleEnd: 2.6,
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
  const incoming = runtime.effects.find(effect => effect.commandId === relatedEffectId);
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
    durationMs: HAMMER_FALL_MS,
    fromX: currentX,
    fromY: currentY,
    toX: currentX,
    toY: currentY + HAMMER_FALL_DISTANCE,
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

const addCastEffect = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  power: number,
): void => {
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'castRing',
    startedAt,
    durationMs: 520,
    fromX: x,
    fromY: y,
    toX: x,
    toY: y,
    color: 'rgba(56, 189, 248, 0.12)',
    size: 60 * power,
    alpha: 0.9,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: 1.5,
  });
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    addVisual(visuals, {
      kind: 'spark',
      startedAt,
      durationMs: 440,
      fromX: x,
      fromY: y,
      toX: x + Math.cos(angle) * 44 * power,
      toY: y + Math.sin(angle) * 30 * power,
      color: '#fef3c7',
      size: 6 + power,
      alpha: 0.86,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 1,
      scaleEnd: 0.3,
    });
  }
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'complete' },
    startedAt,
    impactAt: startedAt,
    impactFired: true,
    visuals,
  });
};

const addPlayerSparkles = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  durationMs: number,
  color: string,
  intense: boolean,
): void => {
  const burstCount = intense ? 18 : 8;
  const sparklesPerBurst = intense ? 5 : 3;
  const intervalMs = Math.max(48, Math.floor(durationMs / burstCount));
  for (let burstIndex = 0; burstIndex < burstCount; burstIndex += 1) {
    setTimeout(() => {
      const startedAt = performance.now();
      const visuals: CanvasEffectVisual[] = [];
      for (let sparkIndex = 0; sparkIndex < sparklesPerBurst; sparkIndex += 1) {
        const angle = Math.random() * Math.PI * 2;
        const startRadius = 18 + Math.random() * (intense ? 54 : 34);
        const endRadius = startRadius + 28 + Math.random() * (intense ? 64 : 26);
        addVisual(visuals, {
          kind: 'starSparkle',
          startedAt,
          durationMs: 520,
          fromX: x + Math.cos(angle) * startRadius,
          fromY: y + Math.sin(angle) * startRadius,
          toX: x + Math.cos(angle) * endRadius,
          toY: y + Math.sin(angle) * endRadius,
          color,
          size: intense ? 8 : 6,
          alpha: 0.94,
          rotation: 0,
          rotationEnd: 180,
          scaleStart: 1,
          scaleEnd: 0.2,
        });
      }
      runtime.effects.push({
        commandId: -1,
        command: { id: -1, kind: 'complete' },
        startedAt,
        impactAt: startedAt,
        impactFired: true,
        visuals,
      });
    }, burstIndex * intervalMs);
  }
};

const showPlayerPoseSequence = (
  runtime: EarTrainingBattleDrawRuntime,
  onDirty: () => void,
): void => {
  const startedAt = performance.now();
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
  addVisual(visuals, {
    kind: 'glow',
    startedAt,
    durationMs: CORRECT_IMPACT_MS,
    fromX: anchors.player.x + 44,
    fromY: anchors.player.castY,
    toX: anchors.enemy.x,
    toY: anchors.enemy.bodyY,
    color: 'rgba(249, 115, 22, 0.34)',
    size: 44,
    alpha: 0.34,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: 0.72,
  });
  addVisual(visuals, {
    kind: 'tail',
    startedAt,
    durationMs: CORRECT_IMPACT_MS,
    fromX: anchors.player.x + 14,
    fromY: anchors.player.castY + 6,
    toX: anchors.enemy.x,
    toY: anchors.enemy.bodyY,
    color: 'rgba(251, 146, 60, 0.72)',
    size: 16,
    alpha: 0.72,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: 0.5,
  });
  addVisual(visuals, {
    kind: 'tail',
    startedAt,
    durationMs: CORRECT_IMPACT_MS,
    fromX: anchors.player.x - 10,
    fromY: anchors.player.castY + 10,
    toX: anchors.enemy.x,
    toY: anchors.enemy.bodyY,
    color: 'rgba(239, 68, 68, 0.52)',
    size: 10,
    alpha: 0.52,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: 0.4,
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

const playOsmdHammerEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, scheduleImpact, enemyTimers, snapshot, width } = ctx;
  const impactMs = Math.max(120, Math.round((command.travelDurationSec ?? 0.72) * 1000));
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
  runtime.effects.push(effect);
  scheduleImpact(command.id, impactMs);
  setTimeout(() => {
    if (!effect.osmdHammerActive) return;
    flashCharacter(runtime.player, 2, 70);
    addImpactBurst(runtime, anchors.player.x, anchors.player.bodyY, '#fb7185', false);
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
    300,
    snapshot,
    runtime.enemy.x,
    width,
    playerTimers,
    onDirty,
  );

  runtime.player.poseKey = 'cast';
  runtime.player.poseUntil = now + 180;

  dismissIncomingOsmdHammer(runtime, command.relatedEffectId);
  addParryGuardEffect(runtime, guardX, guardY);

  const visuals: CanvasEffectVisual[] = [];

  const slashCenterX = (guardX + anchors.enemy.x) / 2;
  const slashSpan = Math.abs(anchors.enemy.x - guardX) + 48;
  addVisual(visuals, {
    kind: 'slash',
    startedAt: now,
    durationMs: 160,
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
    impactAt: now,
    impactFired: true,
    visuals,
  });

  onImpact(command.id);
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
    runtime.effects.push({
      commandId: -1,
      command: { id: -1, kind: 'complete' },
      startedAt: performance.now(),
      impactAt: performance.now(),
      impactFired: true,
      visuals: [{
        id: nextVisualId(),
        kind: 'aura',
        startedAt: performance.now(),
        durationMs: 820,
        fromX: anchors.enemy.x,
        fromY: anchors.enemy.bodyY,
        toX: anchors.enemy.x,
        toY: anchors.enemy.bodyY,
        color: hexColor(color, 1),
        size: 60,
        alpha: 0.14,
        rotation: 0,
        rotationEnd: 0,
        scaleStart: 1,
        scaleEnd: 2.15,
      }],
    });
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
  addVisual(visuals, { kind: 'castRing', startedAt, durationMs: 520, fromX: anchors.player.x, fromY: anchors.player.castY, toX: anchors.player.x, toY: anchors.player.castY, color: '#38bdf8', size: 40, alpha: 0.5, rotation: 0, rotationEnd: 0, scaleStart: 1, scaleEnd: 1.5 });
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
  addVisual(visuals, { kind: 'castRing', startedAt, durationMs: 520, fromX: anchors.player.x, fromY: anchors.player.castY, toX: anchors.player.x, toY: anchors.player.castY, color: '#38bdf8', size: 48, alpha: 0.5, rotation: 0, rotationEnd: 0, scaleStart: 1, scaleEnd: 1.6 });
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
  addCastEffect(runtime, anchors.player.x, anchors.player.castY, 2.65);
  addPlayerSparkles(runtime, anchors.player.x, anchors.player.bodyY, 1380, '#fef08a', true);
  const chantStartedAt = performance.now();
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'complete' },
    startedAt: chantStartedAt,
    impactAt: chantStartedAt,
    impactFired: true,
    visuals: [{
      id: nextVisualId(),
      kind: 'chantText',
      startedAt: chantStartedAt,
      durationMs: 1380,
      fromX: anchors.player.x,
      fromY: anchors.player.headY - 38,
      toX: anchors.player.x,
      toY: anchors.player.headY - 38,
      color: '#fef08a',
      size: 18,
      alpha: 1,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 1,
      scaleEnd: 1.32,
      label: 'Awesome!',
    }],
  });
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
  runtime.effects = runtime.effects.filter(effect => {
    const maxVisualEnd = effect.visuals.reduce(
      (max, visual) => Math.max(max, visual.startedAt + visual.durationMs),
      effect.startedAt,
    );
    return maxVisualEnd + 200 > now;
  });
  runtime.floatingTexts = runtime.floatingTexts.filter(t => now - t.startedAt < t.durationMs);
  runtime.damageTexts = runtime.damageTexts.filter(t => now - t.startedAt < t.durationMs);
  if (runtime.screenFlash && now - runtime.screenFlash.startedAt > runtime.screenFlash.durationMs) {
    runtime.screenFlash = null;
  }
};

export const SKILL_POSE_FRAME_MS = SKILL_PLAYER_POSE_FRAME_MS;
