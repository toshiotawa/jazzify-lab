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
import { hexColor } from './earTrainingBattleDrawState';
import {
  holdCharacterForAction,
  knockCharacter,
} from './earTrainingBattleCharacterMotion';
import type { CharacterMotionTimers } from './earTrainingBattleCharacterMotion';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';

const CORRECT_IMPACT_MS = 540;
const MISS_IMPACT_MS = 520;
const FAIL_IMPACT_MS = 700;
const OSMD_REFLECT_IMPACT_MS = 360;
const GOOD_COMPLETE_IMPACT_MS = 680;
const GREAT_COMPLETE_IMPACT_MS = 860;
const PERFECT_LIGHTNING_IMPACT_MS = 470;
const METEOR_IMPACT_MS = 980;
const AWESOME_METEOR_START_MS = 180 + 1080 + 340;
const CORRECT_PLAYER_POSE_DURATION_MS = 300;
const SKILL_PLAYER_POSE_FRAME_MS = 80;

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

const flashCharacter = (view: CanvasCharacterRuntime, durationMs: number): void => {
  view.flashUntil = performance.now() + durationMs;
};

const tintCharacter = (view: CanvasCharacterRuntime, color: string, durationMs: number): void => {
  view.tintColor = color;
  view.tintUntil = performance.now() + durationMs;
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

const scheduleEnemyKnockback = (
  enemy: CanvasCharacterRuntime,
  distance: number,
  durationMs: number,
  onDirty: () => void,
): void => {
  setTimeout(() => {
    knockCharacter(enemy, distance, durationMs, onDirty);
  }, 16);
};

const playCorrectEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, scheduleImpact, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'cast', 720, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  runtime.player.poseKey = 'cast';
  runtime.player.poseUntil = performance.now() + CORRECT_PLAYER_POSE_DURATION_MS;

  const visuals: CanvasEffectVisual[] = [];
  if (command.originPoint) {
    addVisual(visuals, {
      kind: 'energyOrb',
      startedAt: performance.now(),
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
    startedAt: performance.now(),
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
    kind: 'ring',
    startedAt: performance.now(),
    durationMs: CORRECT_IMPACT_MS,
    fromX: anchors.player.x + 44,
    fromY: anchors.player.castY,
    toX: anchors.enemy.x,
    toY: anchors.enemy.bodyY,
    color: '#f97316',
    size: 22,
    alpha: 0.34,
    rotation: 0,
    rotationEnd: 0,
    scaleStart: 1,
    scaleEnd: 0.72,
  });

  runtime.effects.push({
    commandId: command.id,
    command,
    startedAt: performance.now(),
    impactAt: performance.now() + CORRECT_IMPACT_MS,
    impactFired: false,
    visuals,
  });
  scheduleImpact(command.id, CORRECT_IMPACT_MS);
  setTimeout(() => {
    flashCharacter(runtime.enemy, 180);
    addImpactBurst(runtime, anchors.enemy.x, anchors.enemy.bodyY, '#fb923c', false);
    showDamageText(runtime, command.damage, anchors.enemy.x, anchors.enemy.bodyY);
    scheduleEnemyKnockback(runtime.enemy, 24, 170, onDirty);
    onDirty();
  }, CORRECT_IMPACT_MS);
};

const addImpactBurst = (
  runtime: EarTrainingBattleDrawRuntime,
  x: number,
  y: number,
  color: string,
  heavy: boolean,
): void => {
  runtime.effects.push({
    commandId: -1,
    command: { id: -1, kind: 'correct' },
    startedAt: performance.now(),
    impactAt: performance.now(),
    impactFired: true,
    visuals: [{
      id: nextVisualId(),
      kind: 'burst',
      startedAt: performance.now(),
      durationMs: heavy ? 520 : 380,
      fromX: x,
      fromY: y,
      toX: x,
      toY: y,
      color,
      size: heavy ? 72 : 48,
      alpha: 0.9,
      rotation: 0,
      rotationEnd: 0,
      scaleStart: 0.4,
      scaleEnd: heavy ? 1.8 : 1.4,
    }],
  });
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
    flashCharacter(runtime.player, 180);
    addImpactBurst(runtime, anchors.player.x, anchors.player.bodyY, '#fb7185', heavy);
    knockCharacter(runtime.player, heavy ? -52 : -32, heavy ? 290 : 210, onDirty);
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
    flashCharacter(runtime.player, 180);
    addImpactBurst(runtime, anchors.player.x, anchors.player.bodyY, '#fb7185', false);
    knockCharacter(runtime.player, -28, 180, onDirty);
    effect.osmdHammerActive = false;
    onDirty();
  }, impactMs);
};

const playOsmdHammerReflectEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, scheduleImpact, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'cast', 620, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  runtime.player.poseKey = 'cast';
  runtime.player.poseUntil = performance.now() + CORRECT_PLAYER_POSE_DURATION_MS;
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, {
    kind: 'hammer',
    startedAt: performance.now(),
    durationMs: OSMD_REFLECT_IMPACT_MS,
    fromX: anchors.player.x,
    fromY: anchors.player.bodyY,
    toX: anchors.enemy.x,
    toY: anchors.enemy.bodyY,
    color: '#ffffff',
    size: 82,
    alpha: 1,
    rotation: 18,
    rotationEnd: -560,
    scaleStart: 1,
    scaleEnd: 1.12,
    imageKey: 'hammer',
  });
  runtime.effects.push({
    commandId: command.id,
    command,
    startedAt: performance.now(),
    impactAt: performance.now() + OSMD_REFLECT_IMPACT_MS,
    impactFired: false,
    visuals,
  });
  scheduleImpact(command.id, OSMD_REFLECT_IMPACT_MS);
  setTimeout(() => {
    flashCharacter(runtime.enemy, 180);
    addImpactBurst(runtime, anchors.enemy.x, anchors.enemy.bodyY, '#facc15', false);
    showDamageText(runtime, command.damage, anchors.enemy.x, anchors.enemy.bodyY);
    scheduleEnemyKnockback(runtime.enemy, 22, 160, onDirty);
    onDirty();
  }, OSMD_REFLECT_IMPACT_MS);
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
    flashCharacter(runtime.enemy, 180);
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
    scheduleEnemyKnockback(runtime.enemy, knockbackDistance, knockbackDuration, onDirty);
    onDirty();
  }, impactDelayMs);
};

const playGoodCompleteEffect = (ctx: EffectSchedulerContext, command: EarTrainingBattleEffectCommand): void => {
  const { runtime, anchors, onDirty, playerTimers, snapshot, width } = ctx;
  holdCharacterForAction(runtime.player, 'attack', 1120, snapshot, runtime.enemy.x, width, playerTimers, onDirty);
  showFloatingText(runtime, command.label ?? 'Good', anchors.player.x, anchors.player.resultTextY, getRankColor(command.label ?? 'Good'));
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
  const startedAt = performance.now();
  const visuals: CanvasEffectVisual[] = [];
  addVisual(visuals, { kind: 'projectile', startedAt, durationMs: 300, fromX: anchors.enemy.x, fromY: anchors.enemy.headY - 32, toX: anchors.enemy.x, toY: anchors.enemy.headY - 32, color: '#ffffff', size: 148, alpha: 0.9, rotation: 0, rotationEnd: 0, scaleStart: 1, scaleEnd: 1, imageKey: 'cloud' });
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
