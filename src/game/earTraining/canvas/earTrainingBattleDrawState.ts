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
}

export interface CanvasVisualSlowState {
  startedAt: number;
  durationMs: number;
  scale: number;
}

/** パリィ成功時の描画のみスロー（35〜55ms、ゲーム時間は止めない） */
export const PARRY_VISUAL_SLOW_DURATION_MS = 45;
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
  /** 横一閃ポーズを交互に切り替える */
  yokoIssenPoseAlternate: boolean;
}

export const easeCubicIn = (t: number): number => t * t * t;
export const easeCubicOut = (t: number): number => 1 - (1 - t) ** 3;
export const easeCubicInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
export const easeSineInOut = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeLinear = (t: number): number => t;

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
