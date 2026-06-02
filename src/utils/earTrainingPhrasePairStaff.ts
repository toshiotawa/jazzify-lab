import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';

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
      id: `pp-${pattern.id}-n${i}`,
      chordName: i === 0 ? chordName : '',
      voicing: [noteName],
      voicingStaves: [staff],
      measureOffset: 0,
      isActive: false,
    });
  }

  return groups;
};
