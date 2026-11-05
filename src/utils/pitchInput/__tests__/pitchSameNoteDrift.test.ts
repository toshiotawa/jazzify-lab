import { PitchOnsetTracker, type PitchFrame } from '../pitchOnsetTracker';

const frame = (prediction: number, volume = 0.01): PitchFrame => ({
  prediction, confidence: 0.99, volume,
});

describe('Same-note pitch drift', () => {
  it.each([
    { midi: 36, fastResponse: false },
    { midi: 36, fastResponse: true },
    { midi: 84, fastResponse: false },
    { midi: 84, fastResponse: true },
  ])('holds MIDI $midi through sub-semitone drift (fast=$fastResponse)', ({ midi, fastResponse }) => {
    const tracker = new PitchOnsetTracker({ fastResponse });
    const offsets = [0, 0.41, 0.45, 0.49, -0.41, -0.45, -0.49, 0.45, 0];
    const events = offsets.flatMap((offset, index) => tracker.processFrame(frame(midi + offset), index));
    expect(events).toEqual([{ type: 'noteOn', note: midi, frameIndex: 0, onsetFrameIndex: 0 }]);
    expect(tracker.getCurrentNote()).toBe(midi);
  });

  it.each([false, true])('keeps real semitone legato transitions (fast=%s)', (fastResponse) => {
    const tracker = new PitchOnsetTracker({ fastResponse });
    const events = [60.45, 60.45, 61.05, 61.05, 60.05, 60.05]
      .flatMap((midi, index) => tracker.processFrame(frame(midi), index));
    expect(events.filter((event) => event.type === 'noteOn').map((event) => event.note))
      .toEqual([60, 61, 60]);
    expect(events.filter((event) => event.type === 'noteOff').map((event) => event.note))
      .toEqual([60, 61]);
  });

  it('accepts a fresh same-note attack without a pitch-drift retrigger or extra delay', () => {
    const tracker = new PitchOnsetTracker({ retriggerGuardFrames: 2 });
    const events = [0.01, 0.01, 0.01, 0.001, 0.001, 0.01, 0.01]
      .flatMap((volume, index) => tracker.processFrame(frame(60.45, volume), index));
    expect(events.filter((event) => event.type === 'noteOn').map((event) => [event.note, event.frameIndex]))
      .toEqual([[60, 0], [60, 5]]);
  });

  it('still releases a drifting note after silence', () => {
    const tracker = new PitchOnsetTracker();
    const events = Array.from({ length: 16 }, (_, index) => tracker.processFrame(
      index < 8 ? frame(60.45) : { prediction: 0, confidence: 0, volume: 1e-8 }, index,
    )).flat();
    expect(events.filter((event) => event.type === 'noteOn').map((event) => event.note)).toEqual([60]);
    expect(events.filter((event) => event.type === 'noteOff').map((event) => event.note)).toEqual([60]);
    expect(tracker.getCurrentNote()).toBe(-1);
  });
});
