import {
  PITCH_PCM_CAPTURE_CAPACITY_SAMPLES,
  PITCH_PCM_CAPTURE_SAMPLE_RATE,
  PitchPcmCaptureRing,
} from '../pitchPcmCapture';

describe('PitchPcmCaptureRing', () => {
  it('writes samples in order when enabled', () => {
    const ring = new PitchPcmCaptureRing();
    ring.setEnabled(true);
    ring.write(new Float32Array([0.5, -0.5]), 0, 2, 2 / PITCH_PCM_CAPTURE_SAMPLE_RATE);
    const snapshot = ring.snapshot();
    expect(snapshot.totalWritten).toBe(2);
    expect(snapshot.samples[0]).toBe(16384);
    expect(snapshot.samples[1]).toBe(-16383);
    expect(snapshot.endSourceSample).toBe(2);
  });

  it('zero-fills gaps between chunks', () => {
    const ring = new PitchPcmCaptureRing();
    ring.setEnabled(true);
    ring.write(new Float32Array([1]), 0, 1, 0);
    ring.write(new Float32Array([-1]), 4, 5, 5 / PITCH_PCM_CAPTURE_SAMPLE_RATE);
    const snapshot = ring.snapshot();
    expect(snapshot.totalWritten).toBe(5);
    expect(snapshot.samples.slice(1, 4)).toEqual(Int16Array.from([0, 0, 0]));
    expect(snapshot.samples[4]).toBe(-32767);
  });

  it('does not write while disabled', () => {
    const ring = new PitchPcmCaptureRing();
    ring.write(new Float32Array([1]), 0, 1, 0);
    expect(ring.snapshot().totalWritten).toBe(0);
  });

  it('stops writing after the ring capacity is reached', () => {
    const ring = new PitchPcmCaptureRing();
    ring.setEnabled(true);
    const chunk = new Float32Array(1_000).fill(0.25);
    ring.write(chunk, 0, chunk.length, 0);
    const nextStart = PITCH_PCM_CAPTURE_CAPACITY_SAMPLES - 500;
    ring.write(chunk, nextStart, nextStart + chunk.length, 0);
    expect(ring.snapshot().totalWritten).toBe(PITCH_PCM_CAPTURE_CAPACITY_SAMPLES);
  });

  it('returns chronological samples from snapshot', () => {
    const ring = new PitchPcmCaptureRing();
    ring.setEnabled(true);
    ring.write(new Float32Array([0.1, 0.2]), 10, 12, 0);
    ring.write(new Float32Array([0.3]), 12, 13, 0);
    const snapshot = ring.snapshot();
    expect(snapshot.samples).toHaveLength(3);
    expect(snapshot.endSourceSample).toBe(13);
  });
});
