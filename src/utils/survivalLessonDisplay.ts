import type { StageDefinition, SurvivalBossType } from '@/components/survival/SurvivalStageDefinitions';
import {
  DEFAULT_SURVIVAL_MAP_CATEGORY,
  type SurvivalMapCategory,
} from '@/components/survival/SurvivalTypes';
import type { SurvivalLessonCompositeConfig } from '@/types';

/** `lesson_songs.survival_map_category` / URL の mapCategory を正規化（不正・欠落時は basic） */
export const resolveLessonSurvivalMapCategory = (
  raw: string | null | undefined,
): SurvivalMapCategory => {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (v === 'basic' || v === 'songs' || v === 'phrases' || v === 'lesson') return v;
  return DEFAULT_SURVIVAL_MAP_CATEGORY;
};

const normalizeBossType = (raw: string | undefined): SurvivalBossType => {
  if (raw === 'A' || raw === 'B' || raw === 'C') return raw;
  return 'B';
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

export const lessonSongHasInlineComposite = (
  compositeConfig: SurvivalLessonCompositeConfig | null | undefined,
): boolean => Boolean(compositeConfig?.phrases?.length && compositeConfig.phrases.length >= 2);
