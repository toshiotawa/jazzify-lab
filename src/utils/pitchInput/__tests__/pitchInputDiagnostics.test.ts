import { PitchInputDiagnostics } from '@/utils/pitchInput/pitchInputDiagnostics';

const createDiagnostics = () => new PitchInputDiagnostics({
  deviceLabel: 'test mic', sampleRate: 48_000,
  requestedEchoCancellation: true, actualEchoCancellation: true,
  shiftSemitones: 0, generationId: 1,
});

describe('PitchInputDiagnostics', () => {
  it('distinguishes repeated small source gaps from actual model resets', () => {
    const diagnostics = createDiagnostics();
    for (let i = 0; i < 100; i += 1) {
      diagnostics.recordDiscontinuity('sequenceGap', 128);
      diagnostics.recordDrop(128);
    }
    expect(diagnostics.snapshot(0)).toMatchObject({
      droppedSamples: 12800, discontinuities: 100,
      lastDiscontinuityReason: 'sequenceGap', modelResetCount: 0,
    });
    expect(diagnostics.snapshot(0).lastGapMs).toBeCloseTo(128 / 48);
    diagnostics.recordSourceGap(2400);
    diagnostics.recordModelReset();
    expect(diagnostics.snapshot(0)).toMatchObject({ lastGapMs: 50, modelResetCount: 1 });
  });

  it('reports recent total processing duration and expires old slow samples', () => {
    const diagnostics = createDiagnostics();
    for (let i = 0; i < 128; i += 1) diagnostics.recordProcessingDuration(20);
    expect(diagnostics.snapshot(0).processingMsP95).toBe(20);
    for (let i = 0; i < 128; i += 1) diagnostics.recordProcessingDuration(4.25);
    expect(diagnostics.snapshot(0).processingMsP95).toBe(4.25);
  });
});
