import { vi } from 'vitest';

const { createSession, loadModel } = vi.hoisted(() => ({ createSession: vi.fn(), loadModel: vi.fn() }));
vi.mock('onnxruntime-web', () => ({ env: { wasm: {} }, InferenceSession: { create: createSession } }));
vi.mock('@/utils/pitchInput/pestoWebModel', () => ({ loadPestoWebModel: loadModel }));

interface Outbound {
  type: string;
  note?: number;
  diagnostics?: { modelId: string; inferenceIntervalMs: number; lastConcertMidi: number; discontinuities: number };
}

describe('Pitchy production worker pipeline', () => {
  let worker: { onmessage?: (event: { data: unknown; ports: unknown[] }) => Promise<void>; postMessage: (message: Outbound) => void };
  let port: { onmessage?: (event: { data: unknown }) => void; postMessage: (message: { type: string }) => void };
  let messages: Outbound[];
  let onRecycle: (() => void) | undefined;
  let sequence: number;
  let sourceSample: number;
  const control = async (data: unknown) => {
    if (!worker.onmessage) throw new Error('No worker');
    await worker.onmessage({ data, ports: [port] });
  };
  const init = async (interval: number, shift = 0) => {
    await control({ type: 'init', pitchEngine: 'pitchy', generationId: 1, sensitivity: 5,
      shiftSemitones: shift, inferenceIntervalMs: interval, config: { pitchStableFrames: 4 },
      diagnostics: { deviceLabel: 'synthetic', sampleRate: 48000, requestedEchoCancellation: false, actualEchoCancellation: false },
    });
  };
  const play = async (midi: number, chunks: number, amplitude: (t: number) => number = () => 0.1) => {
    for (let chunk = 0; chunk < chunks; chunk += 1) {
      const samples = Float32Array.from({ length: 240 }, (_, i) => {
        const phase = 2 * Math.PI * 440 * 2 ** ((midi - 69) / 12) * (sourceSample + i) / 48000;
        return amplitude((chunk * 240 + i) / 48000) * (Math.sin(phase) + 0.35 * Math.sin(phase * 2));
      });
      await new Promise<void>((resolve) => {
        onRecycle = resolve;
        port.onmessage?.({ data: {
          type: 'audioChunk', generationId: 1, sequence: sequence++, sourceStartSample: sourceSample,
          sourceEndSample: sourceSample + 240, sourceEndTimeSec: (sourceSample + 240) / 48000,
          samples, rawRmsDbfs: -20, rawPeak: 0.2, clipCount: 0,
        } });
      });
      sourceSample += 240;
    }
    await Promise.resolve();
  };

  beforeEach(async () => {
    vi.resetModules();
    createSession.mockClear();
    loadModel.mockClear();
    messages = [];
    sequence = 0;
    sourceSample = 0;
    worker = { postMessage: (message) => messages.push(message) };
    port = { postMessage: (message) => { if (message.type === 'recycle') onRecycle?.(); } };
    vi.stubGlobal('self', worker);
    await import('../pestoPitchWorker');
    await control({ type: 'connectPort' });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([5, 10, 20])('detects pitch changes and release at %sms without loading ONNX', async (interval) => {
    await init(interval);
    await play(60, 60);
    await play(69, 60);
    await play(69, 20, () => 0);
    expect(messages.filter((message) => message.type === 'noteOn').map((message) => message.note)).toEqual([60, 69]);
    expect(messages.filter((message) => message.type === 'noteOff').map((message) => message.note)).toEqual([60, 69]);
    expect(messages.some((message) => message.type === 'error')).toBe(false);
    expect(createSession).not.toHaveBeenCalled();
    expect(loadModel).not.toHaveBeenCalled();
    await control({ type: 'dumpDiagnostics' });
    expect(messages.at(-1)?.diagnostics).toMatchObject({ modelId: 'pitchy-4.1.0-mpm-4096-48000', inferenceIntervalMs: interval });
  });

  it('keeps expected-note repeat attacks available', async () => {
    await init(10);
    await control({ type: 'setExpectedPitchCandidates', mask: 1 << 4, midis: [64], repeatPitchClassMask: 1 << 4 });
    await play(64, 160, (t) => t < 0.1 ? 0 : 0.1 * Math.exp(-((t - 0.1) % 0.2) / 0.03));
    const notes = messages.filter((message) => message.type === 'noteOn');
    expect(notes.length).toBeGreaterThanOrEqual(3);
    expect(notes.every((message) => message.note === 64)).toBe(true);
  });

  it('restores concert pitch in low register and recovers after missing PCM', async () => {
    await init(10, 12);
    await play(45, 100);
    expect(messages.filter((message) => message.type === 'noteOn').map((message) => message.note)).toEqual([45]);
    sequence += 20;
    sourceSample += 4800;
    await play(45, 100);
    await play(45, 20, () => 0);
    expect(messages.some((message) => message.type === 'error')).toBe(false);
    expect(messages.filter((message) => message.type === 'noteOff').at(-1)?.note).toBe(45);
    await control({ type: 'dumpDiagnostics' });
    expect(messages.at(-1)?.diagnostics?.discontinuities).toBeGreaterThan(0);
  });
});
