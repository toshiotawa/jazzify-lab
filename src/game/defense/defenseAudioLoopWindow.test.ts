import {
  resolveDefenseAudioLoopFrameRange,
  resolveDefenseAudioLoopWindow,
} from '@/game/defense/defenseAudioLoopWindow';

describe('resolveDefenseAudioLoopWindow', () => {
  it('converts inclusive measure ranges to seconds at 120 BPM 4/4', () => {
    const window = resolveDefenseAudioLoopWindow({
      startMeasure: 1,
      endMeasure: 4,
      bpm: 120,
      beatsPerBar: 4,
    });
    expect(window.startSec).toBeCloseTo(0);
    expect(window.endSec).toBeCloseTo(8);
    expect(window.durationSec).toBeCloseTo(8);
  });

  it('supports variable phrase lengths such as 2 and 8 bars', () => {
    const twoBars = resolveDefenseAudioLoopWindow({
      startMeasure: 5,
      endMeasure: 6,
      bpm: 120,
      beatsPerBar: 4,
    });
    expect(twoBars.startSec).toBeCloseTo(8);
    expect(twoBars.endSec).toBeCloseTo(12);

    const eightBars = resolveDefenseAudioLoopWindow({
      startMeasure: 9,
      endMeasure: 16,
      bpm: 120,
      beatsPerBar: 4,
    });
    expect(eightBars.startSec).toBeCloseTo(16);
    expect(eightBars.endSec).toBeCloseTo(32);
  });

  it('clamps endSec to buffer duration', () => {
    const window = resolveDefenseAudioLoopWindow({
      startMeasure: 1,
      endMeasure: 4,
      bpm: 120,
      beatsPerBar: 4,
      bufferDurationSec: 6,
    });
    expect(window.endSec).toBeCloseTo(6);
    expect(window.durationSec).toBeCloseTo(6);
  });
});

describe('resolveDefenseAudioLoopFrameRange', () => {
  it('maps measure ranges to sample frames', () => {
    const range = resolveDefenseAudioLoopFrameRange({
      startMeasure: 5,
      endMeasure: 8,
      sampleRate: 44100,
      bpm: 120,
      beatsPerBar: 4,
      bufferFrameLength: 44100 * 20,
    });
    expect(range.startFrame).toBe(44100 * 8);
    expect(range.frameCount).toBe(44100 * 8);
  });
});
