export type CodeRunLetterRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface CodeRunRankThreshold {
  rank: CodeRunLetterRank;
  maxSeconds: number;
  sortOrder: number;
}

const DEFAULT_THRESHOLDS: readonly CodeRunRankThreshold[] = [
  { rank: 'S', maxSeconds: 60, sortOrder: 0 },
  { rank: 'A', maxSeconds: 90, sortOrder: 1 },
  { rank: 'B', maxSeconds: 120, sortOrder: 2 },
  { rank: 'C', maxSeconds: 150, sortOrder: 3 },
  { rank: 'D', maxSeconds: 165, sortOrder: 4 },
  { rank: 'E', maxSeconds: 180, sortOrder: 5 },
  { rank: 'F', maxSeconds: 195, sortOrder: 6 },
];

const compareCodeRunRanks = (
  a: CodeRunLetterRank,
  b: CodeRunLetterRank,
  thresholds: readonly CodeRunRankThreshold[] = DEFAULT_THRESHOLDS,
): number => {
  const orderA = thresholds.find((t) => t.rank === a)?.sortOrder ?? 99;
  const orderB = thresholds.find((t) => t.rank === b)?.sortOrder ?? 99;
  return orderA - orderB;
};

export const meetsCodeRunRankRequirement = (
  achieved: CodeRunLetterRank,
  required: CodeRunLetterRank,
  thresholds: readonly CodeRunRankThreshold[] = DEFAULT_THRESHOLDS,
): boolean => compareCodeRunRanks(achieved, required, thresholds) <= 0;

export const scoreToCodeRunRank = (
  elapsedSec: number,
  thresholds: readonly CodeRunRankThreshold[] = DEFAULT_THRESHOLDS,
): CodeRunLetterRank => {
  const sorted = [...thresholds].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const t of sorted) {
    if (elapsedSec <= t.maxSeconds) {
      return t.rank;
    }
  }
  return 'F';
};

export const formatCodeRunRankCondition = (
  requiredRank: CodeRunLetterRank,
  thresholds: readonly CodeRunRankThreshold[] = DEFAULT_THRESHOLDS,
  isEnglish: boolean,
): string => {
  const threshold = thresholds.find((t) => t.rank === requiredRank);
  const sec = threshold?.maxSeconds ?? 150;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  const timeLabel = isEnglish
    ? `${min}:${rem.toString().padStart(2, '0')} or faster`
    : `${min}分${rem > 0 ? `${rem}秒` : ''}以内`;
  return isEnglish
    ? `Clear rank ${requiredRank} or better (${timeLabel})`
    : `クリアランク ${requiredRank} 以上（${timeLabel}）`;
};
