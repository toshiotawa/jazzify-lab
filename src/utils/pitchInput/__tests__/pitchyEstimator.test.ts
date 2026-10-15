import { PitchyEstimator } from '../pitchyEstimator';

const fill = (estimator: PitchyEstimator, midi: number, harmonic = false): void => {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  for (let chunk = 0; chunk < 20; chunk += 1) {
    estimator.push(Float32Array.from({ length: 240 }, (_, i) => {
      const phase = 2 * Math.PI * frequency * (chunk * 240 + i) / 48000;
      return 0.1 * (Math.sin(phase) + (harmonic ? 0.35 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase) : 0));
    }));
  }
};

describe('Pitchy streaming estimate', () => {
  it.each([33, 45, 60, 69, 84, 96])('detects MIDI %s with harmonics within 10 cents', (midi) => {
    const estimator = new PitchyEstimator();
    fill(estimator, midi, true);
    const frame = estimator.estimate();
    expect(Math.abs(frame.prediction - midi)).toBeLessThan(0.1);
    expect(frame.confidence).toBeGreaterThan(0.95);
    expect(frame.volume).toBeGreaterThan(0);
  });

  it('discards previous pitch on reset and uses current energy for silence', () => {
    const estimator = new PitchyEstimator();
    fill(estimator, 69);
    expect(estimator.estimate().prediction).toBeCloseTo(69, 1);
    estimator.push(new Float32Array(240));
    expect(estimator.estimate()).toMatchObject({ volume: 0, confidence: 0, prediction: 0 });
    estimator.reset();
    estimator.push(new Float32Array(240).fill(0.1));
    expect(estimator.estimate().confidence).toBe(0);
    fill(estimator, 60);
    expect(estimator.estimate().prediction).toBeCloseTo(60, 1);
  });
});
