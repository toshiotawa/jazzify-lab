import {
  beatToSeconds,
  buildDemoPlaySchedule,
} from '@/components/survival/tutorial/survivalTutorialDemoPlayScheduler';
import {
  buildDemoStaffVoicingGroups,
  isDemoStaffRestWindow,
  resolveDemoStaffWindowStartMeasure,
} from '@/components/survival/tutorial/SurvivalTutorialDemoStaff';
import { buildSurvivalDeveloperDemoPlayV3Script } from '@/components/survival/tutorial/buildSurvivalDeveloperDemoPlayV3Script';

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

  it('builds sorted schedule with demo-end event', () => {
    const schedule = buildDemoPlaySchedule(scene);
    expect(schedule.length).toBeGreaterThan(0);
    const end = schedule.find((e) => e.kind === 'demo-end');
    expect(end).toBeDefined();
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i].atSeconds).toBeGreaterThanOrEqual(schedule[i - 1].atSeconds);
    }
  });

  it('builds demo staff groups for active chord window', () => {
    const snapshot = {
      chords: scene.chords,
      activeChordIndex: 0,
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
      keyFifths: 0,
      windowStartMeasure: restMeasure.measureNumber,
    };
    expect(buildDemoStaffVoicingGroups(snapshot)).toEqual([]);
    expect(isDemoStaffRestWindow(snapshot)).toBe(true);
  });
});
