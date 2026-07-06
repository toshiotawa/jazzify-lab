import type { EarTrainingBattleEffectCommand } from '@/game/earTraining/types';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';
import type { CanvasCameraRuntime } from './earTrainingBattleCamera';
import type { EarTrainingRect } from './earTrainingBattleLayout';

export type CanvasCharacterMotionState = 'idle' | 'walk' | 'cast' | 'attack' | 'recover' | 'knockback' | 'dead';

export type CanvasKnockbackPhase = 'none' | 'push' | 'return';

export interface CanvasCharacterRuntime {
  side: 'player' | 'enemy';
  x: number;
  yOffset: number;
  rotation: number;
  homeX: number;
  minX: number;
  maxX: number;
  speed: number;
  motionState: CanvasCharacterMotionState;
  motionToken: number;
  walkFromX: number;
  walkToX: number;
  walkStartedAt: number;
  walkDurationMs: number;
  knockbackFromX: number;
  knockbackToX: number;
  knockbackFromY: number;
  knockbackToY: number;
  knockbackRotation: number;
  knockbackStartedAt: number;
  knockbackPushDurationMs: number;
  knockbackReturnDurationMs: number;
  knockbackPhase: CanvasKnockbackPhase;
  flashStartedAt: number;
  flashDurationMs: number;
  flashRepeat: number;
  tintColor: string | null;
  tintUntil: number;
  poseKey: string | null;
  poseUntil: number;
  avatarUrl: string;
  flipX: boolean;
}

export interface CanvasQuoteState {
  segments: readonly TutorialResolvedTextSegment[] | null;
  fontPx: number;
  showCue: boolean;
  cuePhase: number;
}

export interface CanvasPhraseIntroState {
  key: string;
  text: string;
  emphasis: boolean;
  startedAt: number;
}

export interface CanvasFloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  startedAt: number;
  durationMs: number;
}

export interface CanvasDamageText {
  text: string;
  x: number;
  y: number;
  startedAt: number;
  durationMs: number;
}

export type CanvasEffectVisualKind =
  | 'projectile'
  | 'burst'
  | 'ring'
  | 'particle'
  | 'hammer'
  | 'spark'
  | 'meteor'
  | 'lightning'
  | 'snowflake'
  | 'cloud'
  | 'energyOrb'
  | 'magicCircle'
  | 'slash'
  | 'thinRing'
  | 'shockwave';

export interface CanvasEffectVisual {
  id: string;
  kind: CanvasEffectVisualKind;
  startedAt: number;
  durationMs: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  rotationEnd: number;
  scaleStart: number;
  scaleEnd: number;
  imageKey?: string;
  label?: string;
  fadeOut?: boolean;
  strokeColor?: string;
  /** パリィ演出全体の開始時刻（751ms以降の残光フェード用） */
  groupStartedAt?: number;
  /** 251–750ms で拡大し 751ms 以降フェードするパリィ円 */
  parryRingExpand?: boolean;
}

export interface CanvasVisualSlowState {
  startedAt: number;
  durationMs: number;
  scale: number;
}

/** パリィ成功時の描画のみスロー（0–250ms、ゲーム時間は止めない） */
export const PARRY_SLOW_PHASE_MS = 250;
export const PARRY_RING_EXPAND_START_MS = 251;
export const PARRY_RING_EXPAND_END_MS = 750;
export const PARRY_EFFECT_FADE_START_MS = 751;
export const PARRY_GUARD_PHASE_MS = 500;
export const PARRY_FINISH_START_MS = 501;
export const PARRY_MOTION_END_MS = 1000;
export const PARRY_TOTAL_MS = 1000;
export const PARRY_RING_START_MS = PARRY_RING_EXPAND_START_MS;
export const PARRY_LINGER_FADE_START_MS = PARRY_EFFECT_FADE_START_MS;
export const PARRY_LINGER_FADE_DURATION_MS = PARRY_MOTION_END_MS - PARRY_EFFECT_FADE_START_MS;
export const PARRY_VISUAL_SLOW_DURATION_MS = PARRY_SLOW_PHASE_MS;
export const PARRY_VISUAL_SLOW_SCALE = 0.22;

export const getVisualSlowCompensation = (
  now: number,
  slow: CanvasVisualSlowState | null,
): number => {
  if (!slow || now <= slow.startedAt) return 0;
  const elapsed = now - slow.startedAt;
  if (elapsed >= slow.durationMs) {
    return slow.durationMs * (1 - slow.scale);
  }
  return elapsed * (1 - slow.scale);
};

export const getVisualNow = (now: number, slow: CanvasVisualSlowState | null): number =>
  now - getVisualSlowCompensation(now, slow);

export interface CanvasEffectRuntime {
  commandId: number;
  command: EarTrainingBattleEffectCommand;
  startedAt: number;
  impactAt: number;
  impactFired: boolean;
  visuals: CanvasEffectVisual[];
  osmdHammerActive?: boolean;
}

export interface CanvasHudHitRegion {
  id: string;
  rect: EarTrainingRect;
  onClick: () => void;
}

export interface BackgroundCacheState {
  width: number;
  height: number;
  canvas: HTMLCanvasElement | null;
}

export interface ParrySparkSlot {
  active: boolean;
  startedAt: number;
  durationMs: number;
  parryStartedAt: number;
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
  travel: number;
  size: number;
  /** 0=白, 1=オレンジ のグラデーション */
  colorMix: number;
}

export interface EarTrainingBattleDrawRuntime {
  width: number;
  height: number;
  player: CanvasCharacterRuntime;
  enemy: CanvasCharacterRuntime;
  camera: CanvasCameraRuntime;
  enemyAttackGaugePercent: number;
  playerQuote: CanvasQuoteState;
  partnerQuote: CanvasQuoteState;
  phraseIntro: CanvasPhraseIntroState | null;
  floatingTexts: CanvasFloatingText[];
  damageTexts: CanvasDamageText[];
  effects: CanvasEffectRuntime[];
  hudHitRegions: CanvasHudHitRegion[];
  screenFlash: { color: string; startedAt: number; durationMs: number; alpha: number } | null;
  startButtonPulsePhase: number;
  loadedImages: Map<string, HTMLImageElement>;
  backgroundCache: BackgroundCacheState;
  structuralKey: string;
  hudLayoutKey: string;
  phraseSlotKey: string;
  lastEffectId: number;
  staffReservedBottomY: number;
  /** アクティブな precise parry thinRing 数（stackIndex 用、prune 時に再計算） */
  activeThinRingCount: number;
  /** OSMD ハンマー dismiss の O(1) 参照 */
  effectByCommandId: Map<number, CanvasEffectRuntime>;
  /** 描画のみの疑似ヒットストップ（パリィ成功時） */
  visualSlow: CanvasVisualSlowState | null;
  /** フィニッシュモーションのキャンセル用 */
  parryMotionGeneration: number;
  parryFinishTimer: ReturnType<typeof setTimeout> | null;
  parryMotionEndTimer: ReturnType<typeof setTimeout> | null;
  parrySparkPool: ParrySparkSlot[];
  lastParryAt: number;
  /** 小節最終音符フィニッシュ中は連続パリィでモーションをキャンセルしない */
  parryFinishLocked: boolean;
}

export const easeCubicIn = (t: number): number => t * t * t;
export const easeCubicOut = (t: number): number => 1 - (1 - t) ** 3;
export const easeCubicInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
export const easeSineInOut = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeLinear = (t: number): number => t;

export const getParryLingerAlpha = (
  now: number,
  groupStartedAt: number | undefined,
  baseAlpha: number,
): number => {
  if (groupStartedAt === undefined) return baseAlpha;
  const age = now - groupStartedAt;
  if (age < PARRY_LINGER_FADE_START_MS) return baseAlpha;
  const fadeT = Math.min(1, (age - PARRY_LINGER_FADE_START_MS) / PARRY_LINGER_FADE_DURATION_MS);
  return baseAlpha * (1 - easeCubicOut(fadeT));
};

export const getEffectProgress = (visual: CanvasEffectVisual, now: number): number => {
  if (visual.durationMs <= 0) return 1;
  return Math.min(Math.max((now - visual.startedAt) / visual.durationMs, 0), 1);
};

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export const hexColor = (value: number, alpha = 1): string => {
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
