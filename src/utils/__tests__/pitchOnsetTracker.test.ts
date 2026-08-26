import {
  PitchOnsetTracker,
  DEFAULT_ONSET_CONFIG,
  scaleOnsetConfigForSensitivity,
  type PitchFrame,
} from '@/utils/pitchInput/pitchOnsetTracker';
import golden from '@/utils/pitchInput/__fixtures__/onsetGolden.json';

describe('PitchOnsetTracker', () => {
  it('matches golden fixture events', () => {
    const tracker = new PitchOnsetTracker(golden.config);
    const allEvents: Array<{ type: string; note: number; frameIndex: number }> = [];

    golden.frames.forEach((frame, frameIndex) => {
      const events = tracker.processFrame(frame as PitchFrame, frameIndex);
      allEvents.push(...events);
    });

    expect(allEvents).toEqual(golden.expectedEvents);
  });

  it('emits immediate noteOn when confidence exceeds onsetImmediateConfidence', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 2,
      onsetImmediateConfidence: 0.85,
    });
    const silent: PitchFrame = { prediction: 0, confidence: 0, volume: 1e-8 };
    const highConfidence: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const lowConfidence: PitchFrame = { prediction: 60, confidence: 0.6, volume: 0.01 };

    expect(tracker.processFrame(silent, 0)).toEqual([]);
    expect(tracker.processFrame(highConfidence, 1)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 1 },
    ]);

    tracker.reset();
    expect(tracker.processFrame(silent, 0)).toEqual([]);
    expect(tracker.processFrame(lowConfidence, 1)).toEqual([]);
    expect(tracker.processFrame(lowConfidence, 2)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 2 },
    ]);
  });

  it('emits noteOn after pitchStableFrames', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 2,
      onsetImmediateConfidence: 2,
    });
    const silent: PitchFrame = { prediction: 0, confidence: 0, volume: 1e-8 };
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };

    expect(tracker.processFrame(silent, 0)).toEqual([]);
    expect(tracker.processFrame(voiced, 1)).toEqual([]);
    expect(tracker.processFrame(voiced, 2)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 2 },
    ]);
  });

  it('emits noteOff after releaseFrames below threshold', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      releaseFrames: 2,
      minNoteFrames: 1,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.1, volume: 1e-8 };

    tracker.processFrame(voiced, 0);
    tracker.processFrame(voiced, 1);
    tracker.processFrame(quiet, 2);
    const events = tracker.processFrame(quiet, 3);
    expect(events).toContainEqual({ type: 'noteOff', note: 60, frameIndex: 3 });
  });

  it('scales sensitivity thresholds', () => {
    const low = scaleOnsetConfigForSensitivity(1);
    const high = scaleOnsetConfigForSensitivity(10);
    expect(low.onsetLevelDb).toBeGreaterThan(high.onsetLevelDb);
  });

  it('reset clears state', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    tracker.processFrame(voiced, 0);
    tracker.reset();
    expect(tracker.getCurrentNote()).toBe(-1);
  });

  it('flushes pending noteOff from noteOnFrame not pendingOffFrame', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      releaseFrames: 1,
      minNoteFrames: 4,
      onsetImmediateConfidence: 2,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.1, volume: 1e-8 };

    tracker.processFrame(voiced, 0);
    expect(tracker.getCurrentNote()).toBe(60);
    tracker.processFrame(quiet, 1);
    expect(tracker.getCurrentNote()).toBe(60);
    tracker.processFrame(quiet, 2);
    expect(tracker.getCurrentNote()).toBe(60);
    tracker.processFrame(quiet, 3);
    expect(tracker.getCurrentNote()).toBe(60);
    const events = tracker.processFrame(quiet, 4);
    expect(events).toEqual([{ type: 'noteOff', note: 60, frameIndex: 4 }]);
  });

  it('counts pitch stability by quantized semitone not raw cents', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 2,
      onsetImmediateConfidence: 2,
    });
    const silent: PitchFrame = { prediction: 0, confidence: 0, volume: 1e-8 };
    const wobbleA: PitchFrame = { prediction: 60.2, confidence: 0.9, volume: 0.01 };
    const wobbleB: PitchFrame = { prediction: 59.8, confidence: 0.9, volume: 0.01 };

    tracker.processFrame(silent, 0);
    expect(tracker.processFrame(wobbleA, 1)).toEqual([]);
    expect(tracker.processFrame(wobbleB, 2)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 2 },
    ]);
  });

  it('retriggers same note after retriggerGuardFrames with attack rise', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 3,
      attackRiseDb: 6,
      onsetImmediateConfidence: 2,
    });
    const soft: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.001 };
    const loud: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.02 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.001 };

    tracker.processFrame(soft, 0);
    tracker.processFrame(quiet, 1);
    tracker.processFrame(quiet, 2);
    tracker.processFrame(quiet, 3);
    const events = tracker.processFrame(loud, 4);
    expect(events).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 4 },
      { type: 'noteOn', note: 60, frameIndex: 4 },
    ]);
  });
});
