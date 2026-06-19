import {
  anchoredDelayMs,
  beatToSeconds,
  buildDemoPlaySchedule,
} from '@/components/survival/tutorial/survivalTutorialDemoPlayScheduler';
import type { SurvivalTutorialV3DemoChordEvent } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import {
  buildDemoStaffVoicingGroups,
  isDemoStaffRestWindow,
  resolveDemoSceneFixedStaves,
  resolveDemoStaffWindowStartMeasure,
} from '@/components/survival/tutorial/SurvivalTutorialDemoStaff';
import { buildSurvivalDeveloperDemoPlayV3Script, DEMO_PLAY_HALF_BEAT_SCALE_START_MIDI } from '@/components/survival/tutorial/buildSurvivalDeveloperDemoPlayV3Script';

const SAME_MEASURE_HALF_BAR_CHORDS: readonly SurvivalTutorialV3DemoChordEvent[] = [
  {
    startBeat: 100,
    durationBeats: 2,
    chordName: 'Dm7',
    voicing: [48, 53, 57, 64],
    voicingNames: ['C3', 'F3', 'A3', 'E4'],
    voicing_staves: [2, 2, 2, 1],
    measureNumber: 26,
    keyFifths: 0,
  },
  {
    startBeat: 102,
    durationBeats: 2,
    chordName: 'G7',
    voicing: [47, 53, 57, 64],
    voicingNames: ['B2', 'F3', 'A3', 'E4'],
    voicing_staves: [2, 2, 2, 1],
    measureNumber: 26,
    keyFifths: 0,
  },
  {
    startBeat: 104,
    durationBeats: 4,
    chordName: 'CM7',
    voicing: [47, 52, 55, 62],
    voicingNames: ['B2', 'E3', 'G3', 'D4'],
    voicing_staves: [2, 2, 2, 1],
    measureNumber: 27,
    keyFifths: 0,
  },
];

const findActiveDemoChordAtBeat = (
  chords: readonly SurvivalTutorialV3DemoChordEvent[],
  currentBeat: number,
): SurvivalTutorialV3DemoChordEvent | undefined =>
  chords.find(
    (chord) =>
      currentBeat >= chord.startBeat &&
      currentBeat < chord.startBeat + chord.durationBeats,
  );

const findActiveDemoChordIndexAtBeat = (
  chords: readonly SurvivalTutorialV3DemoChordEvent[],
  currentBeat: number,
): number | null => {
  const index = chords.findIndex(
    (chord) =>
      currentBeat >= chord.startBeat &&
      currentBeat < chord.startBeat + chord.durationBeats,
  );
  return index >= 0 ? index : null;
};

describe('survivalTutorialDemoPlayScheduler', () => {
  const script = buildSurvivalDeveloperDemoPlayV3Script();
  const scene = script.scenes.find((s) => s.type === 'demo_play');
  if (!scene || scene.type !== 'demo_play') {
    throw new Error('demo_play scene missing in test fixture');
  }

  it('converts beats to seconds at 160 BPM', () => {
    expect(beatToSeconds(4, 160)).toBeCloseTo(1.5, 5);
    expect(beatToSeconds(0.5, 160)).toBeCloseTo(0.1875, 5);
  });

  it('computes anchored delay from BGM start', () => {
    expect(anchoredDelayMs(1500, 0)).toBe(1500);
    expect(anchoredDelayMs(1500, 500)).toBe(1000);
    expect(anchoredDelayMs(1500, 2000)).toBe(0);
  });

  it('builds sorted schedule with demo-end at last content end beat', () => {
    const schedule = buildDemoPlaySchedule(scene);
    expect(schedule.length).toBeGreaterThan(0);
    const end = schedule.find((e) => e.kind === 'demo-end');
    expect(end).toBeDefined();
    const contentEnds = schedule
      .filter((e) => e.kind === 'chord-end' || e.kind === 'line-end')
      .map((e) => e.atBeat);
    const maxContentEnd = Math.max(...contentEnds);
    expect(end?.atBeat).toBe(maxContentEnd);
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i].atSeconds).toBeGreaterThanOrEqual(schedule[i - 1].atSeconds);
    }
  });

  it('builds demo staff groups for active chord window', () => {
    const snapshot = {
      chords: scene.chords,
      activeChordIndex: 0,
      activeRollStepIndex: null,
      keyFifths: 0,
      windowStartMeasure: resolveDemoStaffWindowStartMeasure(scene.chords, 0),
    };
    const groups = buildDemoStaffVoicingGroups(snapshot);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]?.voicing.length).toBeGreaterThan(1);
    expect(groups.some((g) => g.isActive === true)).toBe(true);
    expect(groups.every((g) => g.measureOffset === 0)).toBe(true);
    expect(resolveDemoStaffWindowStartMeasure(scene.chords, null)).toBe(
      scene.chords[0]?.measureNumber ?? 1,
    );
  });

  it('detects rest window and returns empty voiced groups', () => {
    const restMeasure = scene.chords.find((chord) => chord.voicing.length === 0);
    expect(restMeasure).toBeDefined();
    if (!restMeasure) {
      throw new Error('rest measure missing in demo fixture');
    }
    const restIndex = scene.chords.indexOf(restMeasure);
    const snapshot = {
      chords: scene.chords,
      activeChordIndex: restIndex,
      activeRollStepIndex: null,
      keyFifths: 0,
      windowStartMeasure: restMeasure.measureNumber,
    };
    expect(buildDemoStaffVoicingGroups(snapshot)).toEqual([]);
    expect(isDemoStaffRestWindow(snapshot)).toBe(true);
  });

  it('uses single ascending scale notes for half-beat slots in measures 5-8', () => {
    const scaleEvents = scene.chords.filter((chord) => chord.measureNumber >= 5);
    expect(scaleEvents.length).toBe(32);
    expect(scaleEvents.every((chord) => chord.voicing.length === 1)).toBe(true);
    expect(scaleEvents[0]?.voicing[0]).toBe(DEMO_PLAY_HALF_BEAT_SCALE_START_MIDI);
    for (let i = 1; i < scaleEvents.length; i += 1) {
      const prev = scaleEvents[i - 1]?.voicing[0];
      const current = scaleEvents[i]?.voicing[0];
      expect(current).toBeDefined();
      expect(prev).toBeDefined();
      if (current === undefined || prev === undefined) {
        throw new Error('scale event missing midi');
      }
      expect(current).toBeGreaterThan(prev);
    }
  });

  it('resolves active chord by startBeat for same-measure half-bar switches', () => {
    const measure26Start = (26 - 1) * 4;
    expect(findActiveDemoChordAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start)?.chordName).toBe('Dm7');
    expect(findActiveDemoChordAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start + 1)?.chordName).toBe('Dm7');
    expect(findActiveDemoChordAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start + 2)?.chordName).toBe('G7');
    expect(findActiveDemoChordAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start + 3)?.chordName).toBe('G7');
    expect(findActiveDemoChordAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start + 4)?.chordName).toBe('CM7');

    const dm7Index = findActiveDemoChordIndexAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start);
    const g7Index = findActiveDemoChordIndexAtBeat(SAME_MEASURE_HALF_BAR_CHORDS, measure26Start + 2);
    expect(dm7Index).not.toBeNull();
    expect(g7Index).not.toBeNull();
    expect(dm7Index).not.toBe(g7Index);

    const dm7Snapshot = {
      chords: SAME_MEASURE_HALF_BAR_CHORDS,
      activeChordIndex: dm7Index,
      activeRollStepIndex: null,
      keyFifths: 0,
      windowStartMeasure: 26,
    };
    const g7Snapshot = {
      ...dm7Snapshot,
      activeChordIndex: g7Index,
    };

    const dm7Groups = buildDemoStaffVoicingGroups(dm7Snapshot);
    const g7Groups = buildDemoStaffVoicingGroups(g7Snapshot);
    expect(dm7Groups.find((g) => g.isActive)?.chordName).toBe('Dm7');
    expect(g7Groups.find((g) => g.isActive)?.chordName).toBe('G7');
    expect(dm7Groups.filter((g) => g.chordName.length > 0)).toHaveLength(1);
    expect(g7Groups.filter((g) => g.chordName.length > 0)).toHaveLength(1);
  });

  it('fixes demo scene staff layout from all chords and roll steps', () => {
    const rollChords: readonly SurvivalTutorialV3DemoChordEvent[] = [{
      startBeat: 0,
      durationBeats: 4,
      chordName: 'Dm7',
      voicing: [50, 53, 57, 74],
      voicingNames: ['D3', 'F3', 'A3', 'D5'],
      voicing_staves: [2, 2, 2, 1],
      measureNumber: 2,
      keyFifths: 0,
      rollSteps: [
        { startBeat: 0, newVoicing: [50], voicing: [50], voicing_staves: [2] },
        { startBeat: 1, newVoicing: [53], voicing: [50, 53], voicing_staves: [2, 2] },
        { startBeat: 2, newVoicing: [57], voicing: [50, 53, 57], voicing_staves: [2, 2, 2] },
        { startBeat: 3, newVoicing: [74], voicing: [50, 53, 57, 74], voicing_staves: [2, 2, 2, 1] },
      ],
    }];
    expect(resolveDemoSceneFixedStaves(rollChords)).toEqual([1, 2]);
    expect(resolveDemoSceneFixedStaves([{
      ...rollChords[0],
      voicing_staves: [2, 2, 2, 2],
      rollSteps: rollChords[0].rollSteps?.map((step) => ({
        ...step,
        voicing_staves: step.voicing_staves?.map(() => 2 as const),
      })),
    }])).toEqual([2]);
    expect(resolveDemoSceneFixedStaves(scene.chords)).toEqual([1, 2]);
  });

  it('emits roll-step-start events for rollSteps chords', () => {
    const rollChord: SurvivalTutorialV3DemoChordEvent = {
      startBeat: 0,
      durationBeats: 4,
      chordName: 'Dm7',
      voicing: [50, 53, 57, 60],
      measureNumber: 1,
      rollSteps: [
        { startBeat: 0, newVoicing: [50], voicing: [50] },
        { startBeat: 1, newVoicing: [53], voicing: [50, 53] },
        { startBeat: 2, newVoicing: [57], voicing: [50, 53, 57] },
        { startBeat: 3, newVoicing: [60], voicing: [50, 53, 57, 60] },
      ],
    };
    const schedule = buildDemoPlaySchedule({
      type: 'demo_play',
      bgm: { resetOnEnter: true },
      bpm: 120,
      chords: [rollChord],
      lines: [],
      livePlayback: true,
    });
    const rollSteps = schedule.filter((event) => event.kind === 'roll-step-start');
    expect(rollSteps).toHaveLength(3);
    expect(schedule.filter((event) => event.kind === 'chord-start')).toHaveLength(1);
  });
});
