import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';

const EMPTY_CORRECT_GROUP_IDS = new Set<string>();
const NOTE_NAMES_BY_PITCH_CLASS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

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

const fallbackVoicingForPattern = (pattern: AdlibPattern): readonly string[] => (
  pattern.pcs.map((pc) => {
    const safePc = ((Math.trunc(pc) % 12) + 12) % 12;
    return `${NOTE_NAMES_BY_PITCH_CLASS[safePc] ?? 'C'}4`;
  })
);

const resolvePatternVoicing = (pattern: AdlibPattern): readonly string[] => (
  pattern.voicing?.length ? pattern.voicing : fallbackVoicingForPattern(pattern)
);

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

/** Buffer prefix に最も長く一致するパターン（表示用）。空 buffer は null。 */
export const pickPhrasePairDisplayPattern = (
  buffer: readonly number[],
  patterns: readonly AdlibPattern[],
): AdlibPattern | null => {
  if (buffer.length === 0 || patterns.length === 0) return null;

  let best: AdlibPattern | null = null;
  let bestPrefix = 0;
  for (const pattern of patterns) {
    const prefixLen = longestCommonPrefixLength(buffer, pattern.pcs);
    if (prefixLen <= 0) continue;
    if (
      best === null
      || prefixLen > bestPrefix
      || (prefixLen === bestPrefix && comparePatternsByLengthAndPriority(pattern, best) < 0)
    ) {
      best = pattern;
      bestPrefix = prefixLen;
    }
  }
  return best;
};

export const buildPhrasePairStaffVoicingGroups = (
  pattern: AdlibPattern | null,
  chordName: string,
  visibleNoteCount?: number,
  options?: { readonly isRest?: boolean },
): readonly ChordVoicingStaffGroup[] => {
  if (options?.isRest) {
    return [{
      id: 'pp-rest',
      chordName,
      voicing: [],
      voicingStaves: [],
      measureOffset: 0,
      isRest: true,
      isActive: false,
    }];
  }

  if (!pattern) return [];

  const voicing = resolvePatternVoicing(pattern);
  const staves = pattern.voicingStaves ?? [];
  const noteCount = Math.min(
    voicing.length,
    visibleNoteCount ?? voicing.length,
  );
  const groups: ChordVoicingStaffGroup[] = [];

  for (let i = 0; i < noteCount; i += 1) {
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
  if (!pattern || buffer.length === 0) {
    return EMPTY_CORRECT_GROUP_IDS;
  }

  const matchedLength = longestCommonPrefixLength(buffer, pattern.pcs);
  if (matchedLength === 0) {
    return EMPTY_CORRECT_GROUP_IDS;
  }

  const correctIds = new Set<string>();
  const voicing = resolvePatternVoicing(pattern);
  for (let i = 0; i < matchedLength; i += 1) {
    const noteName = voicing[i]?.trim();
    if (!noteName) continue;
    correctIds.add(phrasePairStaffGroupId(pattern.id, i));
  }

  return correctIds.size > 0 ? correctIds : EMPTY_CORRECT_GROUP_IDS;
};
