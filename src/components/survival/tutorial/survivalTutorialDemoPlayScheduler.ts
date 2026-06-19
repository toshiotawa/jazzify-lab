import type {
  SurvivalTutorialV3DemoChordEvent,
  SurvivalTutorialV3DemoLine,
  SurvivalTutorialV3DemoPlayScene,
} from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import { SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';

export interface SurvivalTutorialDemoScheduleEvent {
  readonly kind: 'chord-start' | 'roll-step-start' | 'chord-end' | 'line-start' | 'line-end' | 'demo-end';
  readonly atBeat: number;
  readonly atSeconds: number;
  readonly chordIndex?: number;
  readonly rollStepIndex?: number;
  readonly lineIndex?: number;
}

export const beatToSeconds = (beat: number, bpm: number): number => {
  const safeBpm = Math.max(1, bpm);
  return (beat * 60) / safeBpm;
};

/** BGM アンカー時刻からの残り遅延 ms（負値は 0 にクランプ）。 */
export const anchoredDelayMs = (atSecondsMs: number, elapsedMs: number): number =>
  Math.max(0, atSecondsMs - elapsedMs);

export const measureForBeat = (beat: number, beatsPerMeasure: number): number =>
  Math.floor(beat / beatsPerMeasure) + 1;

export const defaultLineDurationBeats = (bpm: number): number =>
  (SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS * bpm) / 60;

export const buildDemoPlaySchedule = (
  scene: SurvivalTutorialV3DemoPlayScene,
): readonly SurvivalTutorialDemoScheduleEvent[] => {
  const bpm = scene.bpm;
  const beatsPerMeasure = scene.beatsPerMeasure ?? 4;
  const defaultLineBeats = defaultLineDurationBeats(bpm);
  const endHold = scene.endHoldBeats ?? beatsPerMeasure;

  let maxEndBeat = 0;

  const events: SurvivalTutorialDemoScheduleEvent[] = [];

  scene.chords.forEach((chord, chordIndex) => {
    const rollSteps = chord.rollSteps;
    if (rollSteps && rollSteps.length > 0) {
      const end = chord.startBeat + chord.durationBeats;
      maxEndBeat = Math.max(maxEndBeat, end);
      rollSteps.forEach((step, rollStepIndex) => {
        const kind = rollStepIndex === 0 ? 'chord-start' : 'roll-step-start';
        events.push({
          kind,
          atBeat: step.startBeat,
          atSeconds: beatToSeconds(step.startBeat, bpm),
          chordIndex,
          rollStepIndex,
        });
      });
      events.push({
        kind: 'chord-end',
        atBeat: end,
        atSeconds: beatToSeconds(end, bpm),
        chordIndex,
      });
      return;
    }

    const start = chord.startBeat;
    const end = start + chord.durationBeats;
    maxEndBeat = Math.max(maxEndBeat, end);
    events.push({
      kind: 'chord-start',
      atBeat: start,
      atSeconds: beatToSeconds(start, bpm),
      chordIndex,
    });
    events.push({
      kind: 'chord-end',
      atBeat: end,
      atSeconds: beatToSeconds(end, bpm),
      chordIndex,
    });
  });

  scene.lines.forEach((line, lineIndex) => {
    const start = line.startBeat;
    const duration = line.durationBeats ?? defaultLineBeats;
    const end = start + duration;
    maxEndBeat = Math.max(maxEndBeat, end);
    events.push({
      kind: 'line-start',
      atBeat: start,
      atSeconds: beatToSeconds(start, bpm),
      lineIndex,
    });
    events.push({
      kind: 'line-end',
      atBeat: end,
      atSeconds: beatToSeconds(end, bpm),
      lineIndex,
    });
  });

  const demoEndBeat = maxEndBeat + endHold;
  events.push({
    kind: 'demo-end',
    atBeat: demoEndBeat,
    atSeconds: beatToSeconds(demoEndBeat, bpm),
  });

  events.sort((a, b) => a.atSeconds - b.atSeconds || a.kind.localeCompare(b.kind));
  return events;
};

export const chordEventId = (chord: SurvivalTutorialV3DemoChordEvent, index: number): string =>
  `demo-chord:${index}:${chord.measureNumber}:${chord.startBeat}`;

export const resolveDemoLineSpeaker = (
  line: SurvivalTutorialV3DemoLine,
): 'fai' | 'jajii' | 'narration' => {
  if (line.speaker === 'fai' || line.speaker === 'jajii' || line.speaker === 'narration') {
    return line.speaker;
  }
  return 'jajii';
};

export const getDemoPlayTotalBeats = (scene: SurvivalTutorialV3DemoPlayScene): number => {
  const schedule = buildDemoPlaySchedule(scene);
  const end = schedule.find((e) => e.kind === 'demo-end');
  return end?.atBeat ?? 0;
};
