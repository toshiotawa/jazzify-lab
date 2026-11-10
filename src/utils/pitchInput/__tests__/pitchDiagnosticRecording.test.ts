import { pitchDiagnosticRecording } from '../pitchDiagnosticRecording';

describe('PitchDiagnosticRecording', () => {
  it('records only when enabled, preserves stopped history, and clears a new session', () => {
    const recording = pitchDiagnosticRecording;
    recording.record('ignored');
    expect(recording.snapshot().entries).toEqual([]);
    recording.start();
    recording.record('monitor', { confidence: 0.1 });
    recording.stop();
    recording.record('ignored');
    expect(recording.snapshot().entries.map((entry) => entry.event)).toEqual([
      'recordingStarted', 'monitor', 'recordingStopped',
    ]);
    expect(recording.snapshot().recording).toBe(false);
    recording.start();
    expect(recording.snapshot().entries.map((entry) => entry.event)).toEqual(['recordingStarted']);
  });

  it('retains bounded recent history in chronological order through repeated wraparound', () => {
    const recording = pitchDiagnosticRecording;
    recording.start();
    for (let index = 0; index < 24000; index += 1) recording.record(`event-${index}`);
    const snapshot = recording.snapshot();
    expect(snapshot.entries).toHaveLength(12000);
    expect(snapshot.entries[0].event).toBe('event-12000');
    expect(snapshot.entries[11999].event).toBe('event-23999');
    expect(snapshot.overwrittenEntries).toBe(12001);
  });

  it('records with force after stop', () => {
    const recording = pitchDiagnosticRecording;
    recording.start();
    recording.stop();
    recording.record('workerState', { ok: true }, true);
    expect(recording.snapshot().entries.map((entry) => entry.event)).toContain('workerState');
  });
});
