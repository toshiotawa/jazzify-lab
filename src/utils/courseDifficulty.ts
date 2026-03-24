import type { Course, CourseDifficultyTier } from '@/types';

/** 一覧表示・セクション見出しの順序（上から） */
export const COURSE_DIFFICULTY_TIER_ORDER: CourseDifficultyTier[] = [
  'tutorial',
  'beginner',
  'intermediate',
  'advanced',
];

const TIER_SORT_INDEX: Record<CourseDifficultyTier, number> = {
  tutorial: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export const COURSE_DIFFICULTY_LABELS: Record<CourseDifficultyTier, { ja: string; en: string }> = {
  tutorial: { ja: 'チュートリアル', en: 'Tutorial' },
  beginner: { ja: '初級', en: 'Beginner' },
  intermediate: { ja: '中級', en: 'Intermediate' },
  advanced: { ja: '上級', en: 'Advanced' },
};

export function normalizeCourseDifficultyTier(
  raw: string | null | undefined,
): CourseDifficultyTier {
  if (raw === 'tutorial' || raw === 'beginner' || raw === 'intermediate' || raw === 'advanced') {
    return raw;
  }
  return 'beginner';
}

export function compareCoursesByDifficultyThenOrder(a: Course, b: Course): number {
  const ta = normalizeCourseDifficultyTier(a.difficulty_tier);
  const tb = normalizeCourseDifficultyTier(b.difficulty_tier);
  const di = TIER_SORT_INDEX[ta] - TIER_SORT_INDEX[tb];
  if (di !== 0) return di;
  return (a.order_index ?? 0) - (b.order_index ?? 0);
}

export function sortCoursesByDifficultyThenOrder<T extends Course>(courses: T[]): T[] {
  return [...courses].sort(compareCoursesByDifficultyThenOrder);
}

export function difficultyTierLabel(tier: CourseDifficultyTier, isEnglish: boolean): string {
  const row = COURSE_DIFFICULTY_LABELS[tier];
  return isEnglish ? row.en : row.ja;
}
