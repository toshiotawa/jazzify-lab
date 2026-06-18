/**
 * Lesson survival: inline composite phrase build + per-task runtime overrides.
 */
import { Note } from 'tonal';
import type { SurvivalBossType, StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import { STAGE_TIME_LIMIT_SECONDS } from '@/components/survival/SurvivalStageDefinitions';
import {
  resolveBlockBossMaxHp,
  resolveBlockKillQuota,
  resolveBlockPlayerMaxHp,
} from '@/utils/survivalBlockBalance';
import { resolveBossPlayerMaxHp } from '@/components/survival/boss/SurvivalBossEngine';
import {
  COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY,
  COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_REPEAT,
  COMPOSITE_PHRASE_MEASURE_RANGE_DAMAGE,
  COMPOSITE_PHRASE_NOTE_DAMAGE,
} from '@/utils/compositePhraseDamage';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type {
  SurvivalLessonCompositeConfig,
  SurvivalLessonCompositeDamageOverrides,
  SurvivalLessonOverrides,
} from '@/types';
import type {
  SurvivalPhraseChord,
  SurvivalPhraseDefinition,
} from '@/utils/survivalPhraseDefinitions';

export interface ResolvedSurvivalLessonCompositeDamage {
  readonly note: number;
  readonly measureRange: number;
  readonly finishPrimary: number;
  readonly finishRepeat: number;
}

export interface ResolvedSurvivalLessonRuntime {
  readonly bossMaxHp: number;
  readonly playerMaxHp: number;
  readonly bgmUrl: string | null;
  readonly timeLimitSec: number;
  readonly killQuota: number;
  readonly enemyStatMultiplier: number;
  readonly playerStatMultiplier: number;
  readonly compositeDamage: ResolvedSurvivalLessonCompositeDamage;
}

export interface ResolveSurvivalLessonRuntimeContext {
  readonly stageDefinition: StageDefinition;
  readonly baseConfig: DifficultyConfig;
  readonly isBossStage: boolean;
  readonly isPhraseMode: boolean;
  readonly isCompositeBoss: boolean;
  readonly isFirstBlockBoss: boolean;
}

const DEFAULT_COMPOSITE_DAMAGE: ResolvedSurvivalLessonCompositeDamage = {
  note: COMPOSITE_PHRASE_NOTE_DAMAGE,
  measureRange: COMPOSITE_PHRASE_MEASURE_RANGE_DAMAGE,
  finishPrimary: COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY,
  finishRepeat: COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_REPEAT,
};

const normalizeBossType = (raw: string | undefined): SurvivalBossType => {
  if (raw === 'A' || raw === 'B' || raw === 'C') return raw;
  return 'B';
};

const positiveInt = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const n = Math.trunc(value);
  return n > 0 ? n : undefined;
};

const positiveNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value > 0 ? value : undefined;
};

export const parseNoteNameToMidi = (noteName: string): number | null => {
  const trimmed = noteName.trim();
  if (!trimmed) return null;
  const midi = Note.midi(trimmed);
  return typeof midi === 'number' && Number.isFinite(midi) ? midi : null;
};

export const buildSurvivalPhrasesFromLessonCompositeConfig = (
  config: SurvivalLessonCompositeConfig,
  lessonSongId: string,
): SurvivalPhraseDefinition[] => {
  const phrases: SurvivalPhraseDefinition[] = [];
  const bossTypeKey = normalizeBossType(config.bossType);
  void bossTypeKey;

  config.phrases.forEach((phraseInput, phraseIndex) => {
    const chords: SurvivalPhraseChord[] = phraseInput.chords.map((ch, chordIndex) => {
      const notes = ch.noteNames.map((noteName, noteIndex) => {
        const pitchMidi = parseNoteNameToMidi(noteName);
        if (pitchMidi === null) {
          throw new Error(`Invalid note name: ${noteName}`);
        }
        const staffRaw = ch.noteStaves?.[noteIndex];
        const staff: 1 | 2 = staffRaw === 2 ? 2 : 1;
        return {
          orderIndex: noteIndex,
          pitchMidi,
          pitchClass: ((pitchMidi % 12) + 12) % 12,
          noteName: noteName.trim(),
          staff,
        };
      });
      return {
        id: `lesson-${lessonSongId}:p${phraseIndex}:c${chordIndex}`,
        orderIndex: chordIndex,
        chordName: ch.chordName,
        measureNumber: ch.measureNumber ?? 1,
        notes,
      };
    });

    phrases.push({
      id: `lesson-${lessonSongId}:phrase-${phraseIndex}`,
      mapCategory: 'phrases',
      stageNumber: phraseIndex + 1,
      title: phraseInput.title?.trim() || `Phrase ${phraseIndex + 1}`,
      bgmUrl: null,
      keyFifths: config.keyFifths ?? 0,
      chords,
    });
  });

  return phrases;
};

export const buildLessonCompositeStageDefinition = (
  title: string,
  titleEn: string,
  config: SurvivalLessonCompositeConfig,
): StageDefinition => ({
  stageNumber: 0,
  name: title,
  nameEn: titleEn,
  difficulty: 'easy',
  stageType: 'progression',
  playMode: 'survival',
  chordSuffix: '',
  chordDisplayName: 'Composite',
  chordDisplayNameEn: 'Composite',
  rootPattern: null,
  rootPatternName: '',
  rootPatternNameEn: '',
  allowedChords: [],
  blockKey: 'lesson_composite',
  mapCategory: 'phrases',
  lessonOnly: true,
  compositePhraseBossType: normalizeBossType(config.bossType),
  compositePhraseKeyFifths: config.keyFifths ?? 0,
  grandStaffMode: false,
});

export const resolveCompositeDamageOverrides = (
  raw: SurvivalLessonCompositeDamageOverrides | undefined,
): ResolvedSurvivalLessonCompositeDamage => ({
  note: positiveInt(raw?.note) ?? DEFAULT_COMPOSITE_DAMAGE.note,
  measureRange: positiveInt(raw?.measureRange) ?? DEFAULT_COMPOSITE_DAMAGE.measureRange,
  finishPrimary: positiveInt(raw?.finishPrimary) ?? DEFAULT_COMPOSITE_DAMAGE.finishPrimary,
  finishRepeat: positiveInt(raw?.finishRepeat) ?? DEFAULT_COMPOSITE_DAMAGE.finishRepeat,
});

export const resolveSurvivalLessonRuntime = (
  overrides: SurvivalLessonOverrides | null | undefined,
  ctx: ResolveSurvivalLessonRuntimeContext,
): ResolvedSurvivalLessonRuntime => {
  const { stageDefinition, baseConfig, isBossStage, isPhraseMode, isCompositeBoss } = ctx;

  const defaultBossHp = resolveBlockBossMaxHp(stageDefinition);
  const defaultPlayerHp = isBossStage
    ? resolveBossPlayerMaxHp(isPhraseMode)
    : resolveBlockPlayerMaxHp(stageDefinition);

  const bgmTrimmed = overrides?.bgmUrl?.trim();
  const bgmUrl = bgmTrimmed && bgmTrimmed.length > 0 ? bgmTrimmed : null;

  return {
    bossMaxHp: positiveInt(overrides?.bossMaxHp) ?? defaultBossHp,
    playerMaxHp: positiveInt(overrides?.playerMaxHp) ?? defaultPlayerHp,
    bgmUrl,
    timeLimitSec: positiveInt(overrides?.timeLimitSec) ?? STAGE_TIME_LIMIT_SECONDS,
    killQuota: positiveInt(overrides?.killQuota) ?? resolveBlockKillQuota(stageDefinition),
    enemyStatMultiplier: positiveNumber(overrides?.enemyStatMultiplier) ?? baseConfig.enemyStatMultiplier,
    playerStatMultiplier: positiveNumber(overrides?.playerStatMultiplier) ?? 1,
    compositeDamage: isCompositeBoss
      ? resolveCompositeDamageOverrides(overrides?.compositeDamage)
      : DEFAULT_COMPOSITE_DAMAGE,
  };
};

export const applyPlayerStatMultiplier = (
  stats: { aAtk: number; bAtk: number; cAtk: number },
  multiplier: number,
): { aAtk: number; bAtk: number; cAtk: number } => {
  if (multiplier === 1) return stats;
  return {
    aAtk: Math.max(1, Math.round(stats.aAtk * multiplier)),
    bAtk: Math.max(1, Math.round(stats.bAtk * multiplier)),
    cAtk: Math.max(1, Math.round(stats.cAtk * multiplier)),
  };
};

export const lessonSongHasInlineComposite = (
  compositeConfig: SurvivalLessonCompositeConfig | null | undefined,
): boolean => Boolean(compositeConfig?.phrases?.length && compositeConfig.phrases.length >= 2);
