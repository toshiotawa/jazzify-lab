import {
  buildPhrasePairStaffVoicingGroups,
  computePhrasePairStaffCorrectGroupIds,
  pickLongestPhrasePairPattern,
  pickPhrasePairDisplayPattern,
} from '@/utils/earTrainingPhrasePairStaff';
import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';

const makePattern = (
  overrides: Partial<AdlibPattern> & Pick<AdlibPattern, 'id' | 'pcs'>,
): AdlibPattern => ({
  label: 'A',
  familyId: 'test',
  carryTailLength: 0,
  ...overrides,
});

describe('pickLongestPhrasePairPattern', () => {
  it('returns null for empty patterns', () => {
    expect(pickLongestPhrasePairPattern([])).toBeNull();
  });

  it('picks the longest pcs sequence', () => {
    const short = makePattern({ id: 'short', pcs: [0, 2] });
    const long = makePattern({
      id: 'long',
      pcs: [11, 2, 1, 11, 0],
      voicing: ['B4', 'D4', 'Db4', 'B4', 'C4'],
      voicingStaves: [1, 1, 1, 1, 1],
    });
    expect(pickLongestPhrasePairPattern([short, long])).toBe(long);
  });

  it('breaks ties by priority descending', () => {
    const low = makePattern({ id: 'low', pcs: [0, 2], priority: 0 });
    const high = makePattern({ id: 'high', pcs: [2, 0], priority: 5 });
    expect(pickLongestPhrasePairPattern([low, high])).toBe(high);
  });
});

describe('pickPhrasePairDisplayPattern', () => {
  it('returns null for empty buffer', () => {
    const cd = makePattern({ id: 'cd', pcs: [0, 2] });
    expect(pickPhrasePairDisplayPattern([], [cd])).toBeNull();
  });

  it('picks pattern matching buffer prefix', () => {
    const cd = makePattern({ id: 'cd', pcs: [0, 2] });
    const dc = makePattern({ id: 'dc', pcs: [2, 0] });
    expect(pickPhrasePairDisplayPattern([2], [cd, dc])?.id).toBe('dc');
    expect(pickPhrasePairDisplayPattern([2, 0], [cd, dc])?.id).toBe('dc');
  });
});

describe('buildPhrasePairStaffVoicingGroups', () => {
  it('returns empty when pattern is null', () => {
    expect(buildPhrasePairStaffVoicingGroups(null, 'CM7')).toEqual([]);
  });

  it('builds rest group with chord name', () => {
    expect(buildPhrasePairStaffVoicingGroups(null, 'CM7', 0, { isRest: true })).toMatchObject([
      { chordName: 'CM7', isRest: true, voicing: [] },
    ]);
  });

  it('limits visible notes to buffer length', () => {
    const pattern = makePattern({
      id: 'pair',
      pcs: [0, 2],
      voicing: ['C4', 'D4'],
    });
    const groups = buildPhrasePairStaffVoicingGroups(pattern, 'CM7', 1);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.voicing).toEqual(['C4']);
  });

  it('falls back to pitch-class note names when voicing is missing', () => {
    const pattern = makePattern({ id: 'no-voicing', pcs: [0, 2] });
    const groups = buildPhrasePairStaffVoicingGroups(pattern, 'CM7');
    expect(groups).toHaveLength(2);
    expect(groups[0]?.voicing).toEqual(['C4']);
    expect(groups[1]?.voicing).toEqual(['D4']);
  });

  it('builds one group per note with chord name on first slot', () => {
    const pattern = makePattern({
      id: 'pair',
      pcs: [0, 2],
      voicing: ['C4', 'D4'],
      voicingStaves: [1, 1],
    });
    const groups = buildPhrasePairStaffVoicingGroups(pattern, 'CM7');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      id: 'pp-pair-n0',
      chordName: 'CM7',
      voicing: ['C4'],
      voicingStaves: [1],
      measureOffset: 0,
    });
    expect(groups[1]).toMatchObject({
      id: 'pp-pair-n1',
      chordName: '',
      voicing: ['D4'],
      voicingStaves: [1],
    });
  });

  it('defaults missing staves to treble', () => {
    const pattern = makePattern({
      id: 'pair',
      pcs: [0, 2],
      voicing: ['C4', 'D4'],
    });
    const groups = buildPhrasePairStaffVoicingGroups(pattern, 'CM7');
    expect(groups[0]?.voicingStaves).toEqual([1]);
    expect(groups[1]?.voicingStaves).toEqual([1]);
  });
});

describe('computePhrasePairStaffCorrectGroupIds', () => {
  const longestPattern = makePattern({
    id: 'app',
    pcs: [11, 2, 1, 11, 0],
    voicing: ['B4', 'D4', 'Db4', 'B4', 'C4'],
    voicingStaves: [1, 1, 1, 1, 1],
  });

  it('returns empty set when buffer is empty', () => {
    expect(computePhrasePairStaffCorrectGroupIds(longestPattern, [])).toEqual(new Set());
  });

  it('returns empty set when pattern is null', () => {
    expect(computePhrasePairStaffCorrectGroupIds(null, [11, 2])).toEqual(new Set());
  });

  it('can highlight fallback groups when voicing is missing', () => {
    const pattern = makePattern({ id: 'no-voicing', pcs: [0, 2] });
    expect(computePhrasePairStaffCorrectGroupIds(pattern, [0, 2])).toEqual(
      new Set(['pp-no-voicing-n0', 'pp-no-voicing-n1']),
    );
  });

  it('returns empty set when buffer does not match pattern prefix', () => {
    expect(computePhrasePairStaffCorrectGroupIds(longestPattern, [4])).toEqual(new Set());
  });

  it('returns group ids for partial prefix match', () => {
    expect(computePhrasePairStaffCorrectGroupIds(longestPattern, [11, 2])).toEqual(
      new Set(['pp-app-n0', 'pp-app-n1']),
    );
  });

  it('returns all group ids for full prefix match', () => {
    expect(computePhrasePairStaffCorrectGroupIds(longestPattern, [11, 2, 1, 11, 0])).toEqual(
      new Set(['pp-app-n0', 'pp-app-n1', 'pp-app-n2', 'pp-app-n3', 'pp-app-n4']),
    );
  });
});
