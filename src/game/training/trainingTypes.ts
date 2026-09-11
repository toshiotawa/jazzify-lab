import type { ChordQuality } from '@/utils/chord-templates';
import type { ScaleType } from '@/utils/chord-templates';
import type { TrainingLetterRank } from '@/game/training/trainingRank';

export type TrainingKind = 'note_reading' | 'interval' | 'chord' | 'scale' | 'voicing' | 'progression';
export type TrainingClefMode = 'instrument' | 'bass_concert' | 'grand_concert';

export interface TrainingCategoryRow {
  readonly id: string;
  readonly slug: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly sortOrder: number;
  readonly isFree: boolean;
  readonly isActive: boolean;
}

export interface TrainingConfigBase {
  readonly roots?: readonly string[];
  readonly quality?: ChordQuality;
  readonly scale?: ScaleType;
  readonly interval?: string;
  readonly direction?: 'up' | 'down';
  readonly clef?: 'auto' | 'treble' | 'bass';
  readonly includeAccidentals?: boolean;
  readonly intervals?: readonly string[];
  readonly staves?: readonly number[];
  readonly voicingNotes?: readonly string[];
  readonly referenceRoot?: string;
  readonly minLowestNote?: string;
}

export interface TrainingRow {
  readonly id: string;
  readonly categoryId: string;
  readonly slug: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly sortOrder: number;
  readonly kind: TrainingKind;
  readonly clefMode: TrainingClefMode;
  readonly useKeySignature: boolean;
  readonly playRootOnCorrect: boolean;
  readonly bgmUrl: string;
  readonly config: TrainingConfigBase;
  readonly isActive: boolean;
}

export interface TrainingCategoryWithTrainings extends TrainingCategoryRow {
  readonly trainings: readonly TrainingRow[];
}

export interface TrainingQuestionNote {
  readonly noteName: string;
  readonly midi: number;
  readonly pitchClass: number;
  readonly staff: 1 | 2;
  /** 正解入力対象か（音程の基準音など表示専用は false） */
  readonly isTarget: boolean;
}

export interface TrainingQuestion {
  readonly questionKey: string;
  readonly promptLabel: string;
  readonly notes: readonly TrainingQuestionNote[];
  readonly layout: 'stacked' | 'horizontal';
  readonly ordered: boolean;
  readonly keyFifths: number;
  readonly rootMidi: number | null;
}

export interface TrainingQuestionBuilderOptions {
  readonly training: TrainingRow;
  readonly notationInstrumentId: string;
  readonly notationOctaveShift: number;
  readonly ignoreNotationInstrument?: boolean;
  readonly lessonRoots?: readonly string[];
  readonly lessonOrder?: 'random' | 'sequential';
  readonly lessonItems?: readonly TrainingConfigBase[];
  readonly lessonItemIndex?: number;
  readonly previousQuestionKey?: string | null;
}

interface TrainingRuntimeEnemy {
  typeIndex: number;
  active: boolean;
  fadeAlpha: number;
  slashUntilSec: number;
}

export interface TrainingRuntimeDyingEnemy {
  active: boolean;
  typeIndex: number;
  alpha: number;
  slashUntilSec: number;
  offsetX: number;
}

export interface TrainingRuntime {
  durationSec: number;
  elapsedSec: number;
  score: number;
  result: 'playing' | 'finished';
  enemy: TrainingRuntimeEnemy;
  /** Pre-allocated slot for defeat fade animation (no per-hit allocation). */
  dyingEnemy: TrainingRuntimeDyingEnemy;
  question: TrainingQuestion | null;
  correctTargetIndices: readonly number[];
  nextQuestionKey: string | null;
  /** Elapsed seconds until which GuardD pose is shown; 0 = inactive. */
  guardPoseUntilSec: number;
}

export interface TrainingScoreSummary {
  readonly trainingId: string;
  readonly bestScore: number;
  readonly bestRank: TrainingLetterRank;
  readonly rankPosition: number | null;
}

export interface TrainingRankingEntry {
  readonly rankPosition: number;
  readonly userId: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
  readonly playerLevel: number;
  readonly bestScore: number;
  readonly bestRank: TrainingLetterRank;
}

export const TRAINING_GAME_DURATION_SEC = 60;
export const TRAINING_COUNTDOWN_SEC = 3;
export const TRAINING_ENEMY_COUNT = 10;
export const TRAINING_GUARD_POSE_SEC = 1;
export const TRAINING_HUD_HEIGHT_PX = 64;
export const TRAINING_DYING_FADE_SPEED = 2.5;
export const TRAINING_DYING_KNOCKBACK_PX_PER_SEC = 120;
