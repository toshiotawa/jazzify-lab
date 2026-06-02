import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';

const EMPTY_CORRECT_GROUP_IDS = new Set<string>();

const phrasePairStaffGroupId = (patternId: string, noteIndex: number): string => (
  `pp-${patternId}-n${noteIndex}`
);

const longestCommonPrefixLength = (
  a: readonly number[],
  b: readonly number[],
): number => {
  const limit = Math.min(a.length, b.length);
  for (let i = 0; i < limit; i += 1) {
    if (a[i] !== b[i]) return i;
  }
  return limit;
};

const comparePatternsByLengthAndPriority = (a: AdlibPattern, b: AdlibPattern): number => {
  const lenDiff = b.pcs.length - a.pcs.length;
  if (lenDiff !== 0) return lenDiff;
  return (b.priority ?? 0) - (a.priority ?? 0);
};

/** Active step pattern group: longest pcs sequence; tie-break by priority desc. */
export const pickLongestPhrasePairPattern = (
  patterns: readonly AdlibPattern[],
): AdlibPattern | null => {
  if (patterns.length === 0) return null;

  let best = patterns[0];
  for (let i = 1; i < patterns.length; i += 1) {
    const candidate = patterns[i];
    if (comparePatternsByLengthAndPriority(candidate, best) < 0) {
      best = candidate;
    }
  }
  return best;
};

export const buildPhrasePairStaffVoicingGroups = (
  pattern: AdlibPattern | null,
  chordName: string,
): readonly ChordVoicingStaffGroup[] => {
  if (!pattern?.voicing?.length) return [];

  const voicing = pattern.voicing;
  const staves = pattern.voicingStaves ?? [];
  const groups: ChordVoicingStaffGroup[] = [];

  for (let i = 0; i < voicing.length; i += 1) {
    const noteName = voicing[i]?.trim();
    if (!noteName) continue;

    const staffRaw = staves[i];
    const staff: 1 | 2 = staffRaw === 2 ? 2 : 1;

    groups.push({
      id: phrasePairStaffGroupId(pattern.id, i),
      chordName: i === 0 ? chordName : '',
      voicing: [noteName],
      voicingStaves: [staff],
      measureOffset: 0,
      isActive: false,
    });
  }

  return groups;
};

/** Longest-pattern prefix matched by buffer → staff group ids for green highlight. */
export const computePhrasePairStaffCorrectGroupIds = (
  pattern: AdlibPattern | null,
  buffer: readonly number[],
): ReadonlySet<string> => {
  if (!pattern?.voicing?.length || buffer.length === 0) {
    return EMPTY_CORRECT_GROUP_IDS;
  }

  const matchedLength = longestCommonPrefixLength(buffer, pattern.pcs);
  if (matchedLength === 0) {
    return EMPTY_CORRECT_GROUP_IDS;
  }

  const correctIds = new Set<string>();
  const voicing = pattern.voicing;
  for (let i = 0; i < matchedLength; i += 1) {
    const noteName = voicing[i]?.trim();
    if (!noteName) continue;
    correctIds.add(phrasePairStaffGroupId(pattern.id, i));
  }

  return correctIds.size > 0 ? correctIds : EMPTY_CORRECT_GROUP_IDS;
};
