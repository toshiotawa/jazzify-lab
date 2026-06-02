import {
  buildPhrasePairStaffVoicingGroups,
  pickLongestPhrasePairPattern,
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

describe('buildPhrasePairStaffVoicingGroups', () => {
  it('returns empty when pattern is null', () => {
    expect(buildPhrasePairStaffVoicingGroups(null, 'CM7')).toEqual([]);
  });

  it('returns empty when voicing is missing', () => {
    const pattern = makePattern({ id: 'no-voicing', pcs: [0, 2] });
    expect(buildPhrasePairStaffVoicingGroups(pattern, 'CM7')).toEqual([]);
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
