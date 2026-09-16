import type { ChordQuality } from '@/utils/chord-templates';
import type { ScaleType } from '@/utils/chord-templates';
import type { TrainingLetterRank } from '@/game/training/trainingRank';

export type TrainingKind = 'note_reading' | 'interval' | 'chord' | 'scale' | 'voicing' | 'progression';
export type TrainingClefMode = 'instrument' | 'bass_concert' | 'grand_concert';

/** 事前計算済みコード進行の1コード（サバイバル chord_progression 相当） */
export interface TrainingProgressionEntry {
  readonly name: string;
  readonly voicing: readonly number[];
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly voicingStaves?: readonly number[];
  /** 1小節内の複数ヴォイシング（テンションリゾルブ等） */
  readonly voicingSlots?: readonly (readonly string[])[];
}

/** 基準キー移調モードの1コード */
export interface TrainingReferenceChord {
  readonly name: string;
  readonly notes: readonly string[];
}

export interface TrainingCategoryRow {
  readonly id: string;
  readonly slug: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly descriptionJa: string;
  readonly descriptionEn: string;
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
  /** 0 = 基本形, 1 = 第一転回形, … */
  readonly inversion?: number;
  /** true のとき譜面配列順（低→高）で入力必須 */
  readonly ordered?: boolean;
  /** kind=progression: 事前計算済み進行 */
  readonly progression?: readonly TrainingProgressionEntry[];
  /** kind=progression: 1ユニットあたりのコード数（省略時 = 全体1ユニット） */
  readonly unitSize?: number;
  /** kind=progression: ユニット完了後にランダムで別ユニットへ */
  readonly shuffleUnits?: boolean;
  /** kind=progression: 基準キー移調モードの基準長調 */
  readonly referenceKey?: string;
  /** kind=progression: 基準キー移調モードの基準コード列 */
  readonly referenceChords?: readonly TrainingReferenceChord[];
  /** kind=progression: Drop2 II-V-I フォーム（reference_chords 移調時に表参照） */
  readonly voicingForm?: 'aba' | 'bab';
  /** kind=progression: 1ヴォイシング完成ごとに攻撃・スコア+1 */
  readonly scorePerVoicing?: boolean;
  /** kind=progression: 各ヴォイシングの最初の1音正解でルート音を鳴らす */
  readonly playRootOnFirstCorrect?: boolean;
}

/** コード進行トレーニングの1ユニット（例: II-V-I 1キー分） */
export interface TrainingProgressionUnit {
  readonly unitIndex: number;
  readonly keyFifths: number;
  readonly questions: readonly TrainingQuestion[];
}

/** コード進行トレーニングの出題カーソル */
export interface TrainingProgressionCursor {
  readonly unitIndex: number;
  readonly chordIndex: number;
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
  /** grouped レイアウト: 同一コード内のヴォイシングインデックス（0始まり） */
  readonly groupIndex?: number;
}

export interface TrainingQuestion {
  readonly questionKey: string;
  readonly promptLabel: string;
  readonly notes: readonly TrainingQuestionNote[];
  readonly layout: 'stacked' | 'horizontal' | 'grouped';
  readonly ordered: boolean;
  readonly keyFifths: number;
  readonly rootMidi: number | null;
  /** grouped: 1ヴォイシング完成ごとに攻撃・スコア+1 */
  readonly scorePerVoicing?: boolean;
  /** grouped: 各ヴォイシングの最初の1音正解でルート音を鳴らす */
  readonly playRootOnFirstCorrect?: boolean;
  /** grouped: ヴォイシング数 */
  readonly voicingGroupCount?: number;
}

export interface TrainingQuestionBuilderOptions {
  readonly training: TrainingRow;
  readonly notationInstrumentId: string;
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

export interface TrainingGoalSetItem {
  readonly trainingId: string;
  readonly targetRank: TrainingLetterRank;
  readonly sortOrder: number;
}

export type TrainingGoalTargetInstrument = 'piano' | 'all';
export type TrainingGoalTargetLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TrainingGoalSet {
  readonly id: string;
  readonly slug: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly descriptionJa: string;
  readonly descriptionEn: string;
  readonly targetInstrument: TrainingGoalTargetInstrument;
  readonly targetLevel: TrainingGoalTargetLevel;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly items: readonly TrainingGoalSetItem[];
}

export interface TrainingUiText {
  readonly key: string;
  readonly textJa: string;
  readonly textEn: string;
}

export interface TrainingDailyBest {
  readonly day: string;
  readonly trainingId: string;
  readonly bestScore: number;
  readonly bestRank: TrainingLetterRank;
}

export const TRAINING_GAME_DURATION_SEC = 60;
export const TRAINING_COUNTDOWN_SEC = 3;
export const TRAINING_ENEMY_COUNT = 10;
export const TRAINING_GUARD_POSE_SEC = 0.375;
export const TRAINING_HUD_HEIGHT_PX = 64;
export const TRAINING_DYING_FADE_SPEED = 2.5;
export const TRAINING_DYING_KNOCKBACK_PX_PER_SEC = 120;
