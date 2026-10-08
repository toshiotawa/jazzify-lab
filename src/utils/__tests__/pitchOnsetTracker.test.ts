import {
  PitchOnsetTracker,
  DEFAULT_ONSET_CONFIG,
  scaleOnsetConfigForSensitivity,
  type PitchFrame,
} from '@/utils/pitchInput/pitchOnsetTracker';
import g4RepeatAttackTrace from '@/utils/pitchInput/__fixtures__/g4RepeatAttackTrace.json';
import golden from '@/utils/pitchInput/__fixtures__/onsetGolden.json';

describe('PitchOnsetTracker', () => {
  it('matches golden fixture events', () => {
    const tracker = new PitchOnsetTracker(golden.config);
    const allEvents: Array<{
      type: string;
      note: number;
      frameIndex: number;
      onsetFrameIndex?: number;
    }> = [];

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
      { type: 'noteOn', note: 60, frameIndex: 1, onsetFrameIndex: 1 },
    ]);

    tracker.reset();
    expect(tracker.processFrame(silent, 0)).toEqual([]);
    expect(tracker.processFrame(lowConfidence, 1)).toEqual([]);
    expect(tracker.processFrame(lowConfidence, 2)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 2, onsetFrameIndex: 1 },
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
      { type: 'noteOn', note: 60, frameIndex: 2, onsetFrameIndex: 1 },
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
    const mid = scaleOnsetConfigForSensitivity(5);
    const nine = scaleOnsetConfigForSensitivity(9);
    const high = scaleOnsetConfigForSensitivity(10);
    expect(low.onsetLevelDb).toBeGreaterThan(high.onsetLevelDb);
    expect(low.minConfidence).toBe(0.65);
    expect(mid.minConfidence).toBe(0.5);
    expect(nine.minConfidence).toBe(0.3);
    expect(high.minConfidence).toBe(0.28);
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
      { type: 'noteOn', note: 60, frameIndex: 2, onsetFrameIndex: 1 },
    ]);
  });

  it('records onsetFrameIndex at stable-count start frame', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      onsetImmediateConfidence: 2,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.7, volume: 0.01 };

    expect(tracker.processFrame(voiced, 0)).toEqual([]);
    expect(tracker.processFrame(voiced, 1)).toEqual([]);
    expect(tracker.processFrame(voiced, 2)).toEqual([]);
    expect(tracker.processFrame(voiced, 3)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 3, onsetFrameIndex: 0 },
    ]);
  });

  it('ignores octave jump without attack rise while sustaining', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      attackRiseDb: 6,
      onsetImmediateConfidence: 2,
      fastResponse: true,
      fastLegatoConfidence: 0.8,
    });
    tracker.setExpectedPitchMask(1 << 0);
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const voiced72: PitchFrame = { prediction: 72, confidence: 0.95, volume: 0.0105 };

    tracker.processFrame(voiced60, 0);
    tracker.processFrame(voiced60, 1);
    expect(tracker.processFrame(voiced72, 2)).toEqual([]);
    expect(tracker.getCurrentNote()).toBe(60);
  });

  it('switches legato in one frame only when fast response and confidence is at least 0.8', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 2,
      fastResponse: true,
      fastLegatoConfidence: 0.8,
    });
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const voiced64: PitchFrame = { prediction: 64, confidence: 0.8, volume: 0.012 };

    tracker.processFrame(voiced60, 0);
    expect(tracker.processFrame(voiced64, 1)).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 1 },
      { type: 'noteOn', note: 64, frameIndex: 1, onsetFrameIndex: 1 },
    ]);
  });

  it('uses two hits in three frames when fast response is off', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      fastResponse: false,
    });
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.95, volume: 0.01 };
    const voiced64: PitchFrame = { prediction: 64, confidence: 0.95, volume: 0.012 };

    tracker.processFrame(voiced60, 0);
    expect(tracker.processFrame(voiced64, 1)).toEqual([]);
    expect(tracker.processFrame(voiced64, 2)).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 2 },
      { type: 'noteOn', note: 64, frameIndex: 2, onsetFrameIndex: 1 },
    ]);
  });

  it('accepts a legato pitch after two hits split by one other frame', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      fastResponse: false,
    });
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const voiced64: PitchFrame = { prediction: 64, confidence: 0.9, volume: 0.012 };
    const voiced67: PitchFrame = { prediction: 67, confidence: 0.9, volume: 0.012 };

    tracker.processFrame(voiced60, 0);
    expect(tracker.processFrame(voiced64, 1)).toEqual([]);
    expect(tracker.processFrame(voiced67, 2)).toEqual([]);
    expect(tracker.processFrame(voiced64, 3)).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 3 },
      { type: 'noteOn', note: 64, frameIndex: 3, onsetFrameIndex: 3 },
    ]);
  });

  it('adopts an expected pitch class after two frames below the normal confidence gate', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      minConfidence: 0.5,
      expectedAssistConfidence: 0.38,
    });
    tracker.setExpectedPitchMask(1 << 10);
    const bb: PitchFrame = { prediction: 58, confidence: 0.38, volume: 0.01 };
    expect(tracker.processFrame(bb, 0)).toEqual([]);
    expect(tracker.processFrame(bb, 1)).toEqual([
      { type: 'noteOn', note: 58, frameIndex: 1, onsetFrameIndex: 0 },
    ]);
  });

  it('does not adopt a non-expected pitch at assist confidence', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      minConfidence: 0.5,
      expectedAssistConfidence: 0.38,
    });
    tracker.setExpectedPitchMask(1 << 10);
    const other: PitchFrame = { prediction: 60, confidence: 0.38, volume: 0.01 };
    expect(tracker.processFrame(other, 0)).toEqual([]);
    expect(tracker.getCurrentNote()).toBe(-1);
  });

  it('switches to an expected pitch class after two frames while another note is held', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      fastResponse: false,
      expectedAssistConfidence: 0.38,
    });
    tracker.setExpectedPitchMask(1 << 10);
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const bb: PitchFrame = { prediction: 58, confidence: 0.38, volume: 0.01 };

    tracker.processFrame(voiced60, 0);
    expect(tracker.processFrame(bb, 1)).toEqual([]);
    expect(tracker.processFrame(bb, 2)).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 2 },
      { type: 'noteOn', note: 58, frameIndex: 2, onsetFrameIndex: 1 },
    ]);
  });

  it('does not immediate noteOn at q=2 with single observation', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 2,
      frameDurationMs: 10,
      allowImmediateFirstFrame: false,
      onsetImmediateConfidence: 0.85,
    });
    const voiced: PitchFrame = { prediction: 36, confidence: 0.95, volume: 0.02 };
    expect(tracker.processFrame(voiced, 0)).toEqual([]);
    expect(tracker.processFrame(voiced, 1)).toEqual([
      { type: 'noteOn', note: 36, frameIndex: 1, onsetFrameIndex: 0 },
    ]);
  });

  it('uses frameDurationMs for stable duration metadata', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      frameDurationMs: 10,
    });
    expect(tracker.getPitchStableDurationMs()).toBe(40);
  });

  it('does not emit noteOff when only confidence dips while volume stays above release', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      releaseFrames: 2,
      minNoteFrames: 1,
      onsetImmediateConfidence: 2,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const lowConfidence: PitchFrame = { prediction: 60, confidence: 0.1, volume: 0.01 };

    tracker.processFrame(voiced, 0);
    tracker.processFrame(lowConfidence, 1);
    tracker.processFrame(lowConfidence, 2);
    expect(tracker.getCurrentNote()).toBe(60);
    expect(tracker.processFrame(lowConfidence, 3)).toEqual([]);
  });

  it('emits noteOn when the same pitch returns after release with an attack rise', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      releaseFrames: 1,
      minNoteFrames: 1,
      attackRiseDb: 6,
      retriggerLookbackFrames: 4,
      onsetImmediateConfidence: 2,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.9, volume: 1e-8 };

    expect(tracker.processFrame(voiced, 0)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 0, onsetFrameIndex: 0 },
    ]);
    expect(tracker.processFrame(quiet, 1)).toEqual([{ type: 'noteOff', note: 60, frameIndex: 1 }]);
    expect(tracker.processFrame(voiced, 2)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 2, onsetFrameIndex: 2 },
    ]);
  });

  it('resumes without noteOn when the same pitch returns within retrigger guard without attack rise', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      releaseFrames: 1,
      minNoteFrames: 1,
      attackRiseDb: 80,
      retriggerLookbackFrames: 4,
      retriggerGuardFrames: 6,
      onsetImmediateConfidence: 2,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.9, volume: 1e-8 };

    tracker.processFrame(voiced, 0);
    tracker.processFrame(quiet, 1);
    expect(tracker.processFrame(voiced, 2)).toEqual([]);
    expect(tracker.getCurrentNote()).toBe(60);
  });

  it('emits noteOn when the same pitch returns after retrigger guard without attack rise', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      releaseFrames: 1,
      minNoteFrames: 1,
      attackRiseDb: 80,
      retriggerLookbackFrames: 4,
      retriggerGuardFrames: 6,
      onsetImmediateConfidence: 2,
    });
    const voiced: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.9, volume: 1e-8 };

    tracker.processFrame(voiced, 0);
    tracker.processFrame(quiet, 1);
    for (let frameIndex = 2; frameIndex < 7; frameIndex += 1) {
      tracker.processFrame(quiet, frameIndex);
    }
    expect(tracker.processFrame(voiced, 7)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 7, onsetFrameIndex: 7 },
    ]);
  });

  it('does not count the rising tail of a guided note as another octave strike', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, retriggerGuardFrames: 2 });
    tracker.processFrame({ prediction: 60, confidence: 0.99, volume: 0.004 }, 0);
    tracker.setExpectedPitchCandidates(1 << 0, [72]);
    for (let index = 1; index < 12; index += 1) {
      expect(tracker.processFrame({ prediction: 72, confidence: 0.99, volume: 0.02 }, index)).toEqual([]);
    }
    expect(tracker.getCurrentNote()).toBe(60);
  });

  it('does not immediate noteOn for multi-candidate expected assist at assist confidence', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 4,
      expectedAssistConfidence: 0.38,
    });
    tracker.setExpectedPitchCandidates((1 << 0) | (1 << 2) | (1 << 4), [60, 62, 64]);
    const d: PitchFrame = { prediction: 62, confidence: 0.38, volume: 0.01 };
    expect(tracker.processFrame(d, 0)).toEqual([]);
    expect(tracker.getCurrentNote()).toBe(-1);
  });

  it('requires an attack even when the expected octave is stable for many frames', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1 });
    tracker.processFrame({ prediction: 60, confidence: 0.99, volume: 0.01 }, 0);
    tracker.setExpectedPitchCandidates(1 << 0, [72]);
    for (let index = 1; index < 12; index += 1) {
      expect(tracker.processFrame({ prediction: 72, confidence: 0.99, volume: 0.0105 }, index)).toEqual([]);
    }
    expect(tracker.getCurrentNote()).toBe(60);
  });

  it('suppresses one-frame expected octave wobble without stability evidence', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      attackRiseDb: 6,
      onsetImmediateConfidence: 2,
      fastResponse: false,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60, 72]);
    const c4: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const c5: PitchFrame = { prediction: 72, confidence: 0.95, volume: 0.0105 };

    tracker.processFrame(c4, 0);
    tracker.processFrame(c4, 1);
    expect(tracker.processFrame(c5, 2)).toEqual([]);
    expect(tracker.getCurrentNote()).toBe(60);
  });

  const collectNoteOns = (
    tracker: PitchOnsetTracker,
    frames: Array<{ frame: PitchFrame; index: number }>,
  ): number[] => {
    const notes: number[] = [];
    for (const { frame, index } of frames) {
      const events = tracker.processFrame(frame, index);
      for (const event of events) {
        if (event.type === 'noteOn') {
          notes.push(event.note);
        }
      }
    }
    return notes;
  };

  const collectRepeatModeOnsetFrames = (
    tracker: PitchOnsetTracker,
    frames: Array<{ frame: PitchFrame; index: number }>,
  ): number[] => {
    const onsetFrames: number[] = [];
    for (const { frame, index } of frames) {
      const events = tracker.processFrame(frame, index);
      for (const event of events) {
        if (event.type === 'noteOn') {
          onsetFrames.push(event.onsetFrameIndex);
        }
      }
    }
    return onsetFrames;
  };

  it('emits multiple noteOns during monotonic attack rise without repeat mask', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      attackRiseDb: 6,
      onsetImmediateConfidence: 2,
    });
    const soft: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.002 };
    const loud: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.02 };

    tracker.processFrame(soft, 0);
    tracker.processFrame(quiet, 1);
    tracker.processFrame(quiet, 2);
    tracker.processFrame(quiet, 3);
    const firstRetrigger = tracker.processFrame(loud, 4);
    tracker.processFrame(quiet, 5);
    tracker.processFrame(quiet, 6);
    tracker.processFrame(quiet, 7);
    const secondRetrigger = tracker.processFrame(loud, 8);
    expect(firstRetrigger.some((event) => event.type === 'noteOn')).toBe(true);
    expect(secondRetrigger.some((event) => event.type === 'noteOn')).toBe(true);
  });

  it('emits one noteOn during monotonic attack rise with repeat mask', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 6,
      attackRiseDb: 6,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const frames: Array<{ frame: PitchFrame; index: number }> = [];
    for (let index = 0; index < 20; index += 1) {
      const volume = 0.001 * Math.pow(10, index * 0.08);
      frames.push({
        index,
        frame: { prediction: 60, confidence: 0.9, volume },
      });
    }
    const noteOns = collectNoteOns(tracker, frames);
    expect(noteOns).toEqual([60]);
  });

  it('retriggers legato same note after peak dip and rise with repeat mask', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const dip: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.0063 };
    const rise: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.016 };

    const noteOns = collectNoteOns(tracker, [
      { frame: peak, index: 0 },
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: dip, index: 3 },
      { frame: dip, index: 4 },
      { frame: rise, index: 5 },
      { frame: rise, index: 6 },
    ]);
    expect(noteOns).toEqual([60, 60]);
  });

  it('suppresses octave wobble within same pitch class when repeat mask is active', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      attackRiseDb: 6,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
      fastResponse: false,
    });
    tracker.setExpectedPitchCandidates(1 << 5, [65], 1 << 5);
    const f4: PitchFrame = { prediction: 65, confidence: 0.9, volume: 0.01 };
    const f5: PitchFrame = { prediction: 77, confidence: 0.95, volume: 0.0105 };

    tracker.processFrame(f4, 0);
    tracker.processFrame(f4, 1);
    expect(tracker.processFrame(f5, 2)).toEqual([]);
    expect(tracker.getCurrentNote()).toBe(65);
  });

  it('retriggers same note after retriggerGuardFrames with attack rise', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      attackRiseDb: 6,
      onsetImmediateConfidence: 2,
    });
    const soft: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const quiet: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.002 };
    const loud: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.02 };

    tracker.processFrame(soft, 0);
    tracker.processFrame(quiet, 1);
    tracker.processFrame(quiet, 2);
    tracker.processFrame(quiet, 3);
    const events = tracker.processFrame(loud, 4);
    expect(events).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 4 },
      { type: 'noteOn', note: 60, frameIndex: 4, onsetFrameIndex: 2 },
    ]);
  });

  it('suppresses repeat-mode same-midi pitch wobble without volume dip', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const flat: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const wobbleA: PitchFrame = { prediction: 60.45, confidence: 0.9, volume: 0.01 };
    const wobbleB: PitchFrame = { prediction: 59.55, confidence: 0.9, volume: 0.01 };

    const noteOns = collectNoteOns(tracker, [
      { frame: flat, index: 0 },
      { frame: flat, index: 1 },
      { frame: wobbleA, index: 2 },
      { frame: wobbleB, index: 3 },
      { frame: wobbleA, index: 4 },
      { frame: flat, index: 5 },
    ]);
    expect(noteOns).toEqual([60]);
  });

  it('suppresses repeat-mode neighbor semitone wobble without volume dip', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
      fastResponse: false,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const flat: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const neighbor: PitchFrame = { prediction: 61, confidence: 0.9, volume: 0.01 };

    const noteOns = collectNoteOns(tracker, [
      { frame: flat, index: 0 },
      { frame: flat, index: 1 },
      { frame: neighbor, index: 2 },
      { frame: neighbor, index: 3 },
      { frame: flat, index: 4 },
      { frame: flat, index: 5 },
    ]);
    expect(noteOns).toEqual([60]);
  });

  it('suppresses repeat-mode slow trough recovery without fast rise', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      retriggerLookbackFrames: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const dip: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.0063 };
    const frames: Array<{ frame: PitchFrame; index: number }> = [
      { frame: peak, index: 0 },
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: dip, index: 3 },
      { frame: dip, index: 4 },
    ];
    for (let step = 1; step <= 12; step += 1) {
      const volume = 0.0063 + ((0.017 - 0.0063) * step) / 12;
      frames.push({
        index: 4 + step,
        frame: { prediction: 60, confidence: 0.9, volume },
      });
    }
    const noteOns = collectNoteOns(tracker, frames);
    expect(noteOns).toEqual([60]);
  });

  it('retriggers repeat-mode note after dip and rise during semitone wobble', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const wobble: PitchFrame = { prediction: 61, confidence: 0.9, volume: 0.01 };
    const dip: PitchFrame = { prediction: 60.45, confidence: 0.9, volume: 0.0063 };
    const rise: PitchFrame = { prediction: 59.55, confidence: 0.9, volume: 0.016 };

    const noteOns = collectNoteOns(tracker, [
      { frame: peak, index: 0 },
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: wobble, index: 3 },
      { frame: dip, index: 4 },
      { frame: dip, index: 5 },
      { frame: rise, index: 6 },
      { frame: rise, index: 7 },
    ]);
    expect(noteOns).toEqual([60, 60]);
  });

  it('still switches legato by semitone without repeat mask', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      fastResponse: false,
      onsetImmediateConfidence: 2,
    });
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const voiced61: PitchFrame = { prediction: 61, confidence: 0.9, volume: 0.01 };

    tracker.processFrame(voiced60, 0);
    tracker.processFrame(voiced60, 1);
    expect(tracker.processFrame(voiced61, 2)).toEqual([]);
    expect(tracker.processFrame(voiced61, 3)).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 3 },
      { type: 'noteOn', note: 61, frameIndex: 3, onsetFrameIndex: 2 },
    ]);
  });

  it('still switches legato by two semitones with repeat mask active', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      fastResponse: false,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60, 62], 1 << 0);
    const voiced60: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const voiced62: PitchFrame = { prediction: 62, confidence: 0.9, volume: 0.01 };

    tracker.processFrame(voiced60, 0);
    tracker.processFrame(voiced60, 1);
    expect(tracker.processFrame(voiced62, 2)).toEqual([]);
    expect(tracker.processFrame(voiced62, 3)).toEqual([
      { type: 'noteOff', note: 60, frameIndex: 3 },
      { type: 'noteOn', note: 62, frameIndex: 3, onsetFrameIndex: 2 },
    ]);
  });

  it('suppresses repeat-mode distant unexpected pitch detour', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 7, [67], 1 << 7);
    const g4: PitchFrame = { prediction: 67, confidence: 0.9, volume: 0.01 };
    const detour: PitchFrame = { prediction: 86, confidence: 0.9, volume: 0.01 };
    const noteOns = collectNoteOns(tracker, [
      { frame: g4, index: 0 },
      { frame: g4, index: 1 },
      { frame: detour, index: 2 },
      { frame: detour, index: 3 },
      { frame: g4, index: 4 },
      { frame: g4, index: 5 },
    ]);
    expect(noteOns).toEqual([67]);
  });

  it('retriggers repeat-mode note when trough is only on unvoiced frames', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      repeatAttackWindowMs: 40,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const dipUnvoiced: PitchFrame = { prediction: 60, confidence: 0.1, volume: 0.00001 };
    const rise: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.016 };
    const noteOns = collectNoteOns(tracker, [
      { frame: peak, index: 0 },
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: dipUnvoiced, index: 3 },
      { frame: dipUnvoiced, index: 4 },
      { frame: rise, index: 5 },
      { frame: rise, index: 6 },
    ]);
    expect(noteOns).toEqual([60, 60]);
  });

  it('retriggers repeat-mode note after dip and rise within repeat attack window', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      repeatAttackWindowMs: 40,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const dip: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.0063 };
    const frames: Array<{ frame: PitchFrame; index: number }> = [
      { frame: peak, index: 0 },
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: dip, index: 3 },
      { frame: dip, index: 4 },
    ];
    for (let step = 0; step <= 6; step += 1) {
      const volume = 0.0063 + ((0.025 - 0.0063) * step) / 6;
      frames.push({
        index: 5 + step,
        frame: { prediction: 60, confidence: 0.9, volume },
      });
    }
    const noteOns = collectNoteOns(tracker, frames);
    expect(noteOns).toEqual([60, 60]);
  });

  it('backdates repeat-mode retrigger onsetFrameIndex to trough plus one within attack window', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      repeatAttackWindowMs: 40,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const dipUnvoiced: PitchFrame = { prediction: 60, confidence: 0.1, volume: 0.00001 };
    const rise: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.016 };
    const onsetFrames = collectRepeatModeOnsetFrames(tracker, [
      { frame: peak, index: 0 },
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: dipUnvoiced, index: 3 },
      { frame: dipUnvoiced, index: 4 },
      { frame: rise, index: 5 },
      { frame: rise, index: 6 },
    ]);
    expect(onsetFrames).toEqual([0, 5]);
    expect(onsetFrames[1]).toBeLessThan(6);
  });

  it('does not score a sustained repeat pitch after discontinuity recovery, but accepts a fresh attack', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, retriggerGuardFrames: 2 });
    tracker.setExpectedPitchCandidates(1, [60], 1);
    const frame = (prediction: number, attackDb = -20): PitchFrame => ({
      prediction, confidence: 0.99, volume: 0.01, attackDb,
    });
    tracker.processFrame(frame(60), 0);
    tracker.processFrame(frame(60), 1);
    expect(tracker.flushActiveNote(10, true)).toEqual([{ type: 'noteOff', note: 60, frameIndex: 10 }]);
    const recovered = collectNoteOns(tracker, [
      { frame: frame(72), index: 0 },
      { frame: frame(72), index: 1 },
      { frame: frame(60), index: 2 },
      { frame: frame(60), index: 3 },
      { frame: frame(60, -30), index: 4 },
      { frame: frame(60, -30), index: 5 },
      { frame: frame(60, -18), index: 6 },
    ]);
    expect(recovered).toEqual([60]);
  });

  it('requires a fresh attack for the same pitch class after release even if the detected octave changes', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, releaseFrames: 1, minNoteFrames: 1 });
    tracker.setExpectedPitchCandidates(1, [60, 72], 1);
    tracker.processFrame({ prediction: 60, confidence: 0.99, volume: 0.01, attackDb: -20 }, 0);
    tracker.processFrame({ prediction: 60, confidence: 0.99, volume: 0.01, attackDb: -20 }, 1);
    tracker.processFrame({ prediction: 0, confidence: 0, volume: 1e-8, attackDb: -20 }, 2);
    const noteOns = collectNoteOns(tracker, [
      { frame: { prediction: 72, confidence: 0.99, volume: 0.01, attackDb: -20 }, index: 3 },
      { frame: { prediction: 72, confidence: 0.99, volume: 0.01, attackDb: -20 }, index: 4 },
    ]);
    expect(noteOns).toEqual([]);
  });

  it('keeps repeat pitch class mask after reset', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 2,
      repeatRiseDb: 4,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
    const peak: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.01 };
    const dip: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.0063 };
    const rise: PitchFrame = { prediction: 60, confidence: 0.9, volume: 0.016 };
    tracker.processFrame(peak, 0);
    tracker.reset();
    const noteOns = collectNoteOns(tracker, [
      { frame: peak, index: 1 },
      { frame: peak, index: 2 },
      { frame: dip, index: 3 },
      { frame: dip, index: 4 },
      { frame: rise, index: 5 },
      { frame: rise, index: 6 },
    ]);
    expect(noteOns).toEqual([60, 60]);
  });

  it('replays synthetic G4 repeat attack trace fixture', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      ...g4RepeatAttackTrace.config,
    });
    tracker.setExpectedPitchCandidates(
      g4RepeatAttackTrace.repeatPitchClassMask,
      g4RepeatAttackTrace.expectedPitchMidis,
      g4RepeatAttackTrace.repeatPitchClassMask,
    );
    const noteOns = collectNoteOns(
      tracker,
      g4RepeatAttackTrace.frames.map((frame, index) => ({
        frame: frame as PitchFrame,
        index,
      })),
    );
    expect(noteOns).toEqual(g4RepeatAttackTrace.expectedNoteOns);
  });

  it('uses sharp attackDb to retrigger four times when model volume stays blurred', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 3,
      repeatRiseDb: 6,
      repeatAttackWindowMs: 40,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 7, [67], 1 << 7);

    const blurredVolume = 0.01;
    const frame = (attackDb: number): PitchFrame => ({
      prediction: 67,
      confidence: 0.9,
      volume: blurredVolume,
      attackDb,
    });
    const attackPattern = [
      -42, -38, -36, -34, -33, -31, -30, -28,
      -40, -36, -34, -32, -30, -28, -26,
      -39, -35, -33, -31, -29, -27, -25,
      -38, -34, -32, -30, -28, -26, -24,
    ];
    const noteOns = collectNoteOns(
      tracker,
      attackPattern.map((attackDb, index) => ({ frame: frame(attackDb), index })),
    );
    expect(noteOns).toEqual([67, 67, 67, 67]);
  });

  it('does not emit a fourth noteOn when attackDb lacks a final rise after three strikes', () => {
    const tracker = new PitchOnsetTracker({
      ...DEFAULT_ONSET_CONFIG,
      pitchStableFrames: 1,
      retriggerGuardFrames: 2,
      repeatDipDb: 3,
      repeatRiseDb: 6,
      repeatAttackWindowMs: 40,
      onsetImmediateConfidence: 2,
    });
    tracker.setExpectedPitchCandidates(1 << 7, [67], 1 << 7);

    const frame = (attackDb: number, confidence = 0.9): PitchFrame => ({
      prediction: 67,
      confidence,
      volume: 0.01,
      attackDb,
    });
    const frames: Array<{ frame: PitchFrame; index: number }> = [
      { frame: frame(-42), index: 0 },
      { frame: frame(-36), index: 1 },
      { frame: frame(-30), index: 2 },
      { frame: frame(-40), index: 3 },
      { frame: frame(-34), index: 4 },
      { frame: frame(-28), index: 5 },
      { frame: frame(-39), index: 6 },
      { frame: frame(-33), index: 7 },
      { frame: frame(-27), index: 8 },
      { frame: { prediction: 67, confidence: 0.4, volume: 0.004, attackDb: -40 }, index: 9 },
      { frame: { prediction: 67, confidence: 0.4, volume: 0.004, attackDb: -39.5 }, index: 10 },
      { frame: { prediction: 67, confidence: 0.4, volume: 0.004, attackDb: -39 }, index: 11 },
      { frame: { prediction: 67, confidence: 0.4, volume: 0.004, attackDb: -38.8 }, index: 12 },
      { frame: { prediction: 67, confidence: 0.4, volume: 0.004, attackDb: -38.5 }, index: 13 },
    ];
    const noteOns = collectNoteOns(tracker, frames);
    expect(noteOns).toEqual([67, 67, 67]);
  });
  it('keeps one strike during octave wobble, then accepts a fresh octave-reported attack', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, retriggerGuardFrames: 6 });
    tracker.setExpectedPitchCandidates(1 << 5, [65], 1 << 5);
    const frame = (prediction: number, attackDb: number): PitchFrame => ({
      prediction, confidence: 0.99, volume: 0.01, attackDb,
    });
    const notes = collectNoteOns(tracker, [
      { frame: frame(65, -20), index: 0 },
      { frame: frame(65, -20), index: 1 },
      { frame: frame(65, -30), index: 2 },
      // 同音再アタックのガード内でオクターブだけ変わっても受理しない。
      { frame: frame(77, -20), index: 3 },
      { frame: frame(77, -20), index: 8 },
      { frame: frame(77, -32), index: 9 },
      { frame: frame(77, -20), index: 10 },
    ]);
    expect(notes).toEqual([65, 65]);
    expect(tracker.getAttackReferenceNote()).toBe(65);
  });

  it('does not compare envelope levels from different measurement bands', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, retriggerGuardFrames: 2 });
    tracker.setExpectedPitchCandidates(1 << 5, [65], 1 << 5);
    const frame = (attackDb: number, attackMidi: number): PitchFrame => ({
      prediction: 65, confidence: 0.99, volume: 0.01, attackDb, attackMidi,
    });
    const notes = collectNoteOns(tracker, [
      { frame: frame(-20, 72), index: 0 },
      { frame: frame(-20, 72), index: 1 },
      { frame: frame(-35, 72), index: 2 },
      { frame: frame(-20, 65), index: 3 },
      { frame: frame(-20, 65), index: 4 },
      { frame: frame(-35, 65), index: 5 },
      { frame: frame(-20, 65), index: 6 },
    ]);
    expect(notes).toEqual([65, 65]);
  });

  it('expires an old trough across missing PCM, including a released same-pitch return', () => {
    for (const release of [false, true]) {
      const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, releaseFrames: 1, minNoteFrames: 1 });
      tracker.setExpectedPitchCandidates(1 << 0, [60], 1 << 0);
      const frame = (attackDb: number): PitchFrame => ({
        prediction: 60, confidence: 0.99, volume: 0.01, attackDb,
      });
      const notes = collectNoteOns(tracker, [
        { frame: frame(-20), index: 0 },
        { frame: frame(-20), index: 1 },
        { frame: release ? { prediction: 0, confidence: 0, volume: 1e-8, attackDb: -35 } : frame(-35), index: 2 },
        { frame: frame(-20), index: 30 },
        { frame: frame(-20), index: 31 },
        { frame: frame(-35), index: 32 },
        { frame: frame(-20), index: 33 },
      ]);
      expect(notes).toEqual([60, 60]);
    }
  });

  it('allows a written semitone step while suppressing an unexpected neighboring pitch', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, fastResponse: true });
    tracker.setExpectedPitchCandidates(1 << 0, [60]);
    tracker.processFrame({ prediction: 60, confidence: 0.99, volume: 0.01 }, 0);
    tracker.processFrame({ prediction: 60, confidence: 0.99, volume: 0.01 }, 1);
    expect(tracker.processFrame({ prediction: 61, confidence: 0.99, volume: 0.01 }, 2)).toEqual([]);
    tracker.setExpectedPitchCandidates((1 << 0) | (1 << 1), [60, 61]);
    expect(tracker.processFrame({ prediction: 61, confidence: 0.99, volume: 0.01 }, 3))
      .toContainEqual(expect.objectContaining({ type: 'noteOn', note: 61 }));
  });

  it('backdates a stable onset to the first real observation across missing PCM', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 2 });
    tracker.setExpectedPitchCandidates(1 << 0, [60]);
    const frame = { prediction: 60, confidence: 0.99, volume: 0.01 };
    expect(tracker.processFrame(frame, 1)).toEqual([]);
    expect(tracker.processFrame(frame, 9)).toEqual([
      { type: 'noteOn', note: 60, frameIndex: 9, onsetFrameIndex: 1 },
    ]);
  });

  it('retains the full attack window while the initial retrigger guard is active', () => {
    const tracker = new PitchOnsetTracker({ pitchStableFrames: 1, retriggerGuardFrames: 6 });
    tracker.setExpectedPitchCandidates(1 << 5, [65]);
    const levels = [-20, -20, -32, -31, -30, -29, -28, -27, -26];
    const notes = collectNoteOns(tracker, levels.map((attackDb, index) => ({
      frame: { prediction: 65, confidence: 0.99, volume: 0.01, attackDb }, index,
    })));
    expect(notes).toEqual([65, 65]);
  });

});
