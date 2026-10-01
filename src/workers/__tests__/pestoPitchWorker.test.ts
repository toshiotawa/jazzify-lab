import { vi } from 'vitest';

const { run } = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('onnxruntime-web', () => ({
  env: { wasm: {} },
  Tensor: class { constructor(public type: string, public data: Float32Array, public dims: number[]) {} },
  InferenceSession: { create: async () => ({ run }) },
}));

interface WorkerHarness {
  onmessage: ((event: { data: unknown; ports: unknown[] }) => Promise<void>) | null;
  postMessage: ReturnType<typeof vi.fn>;
}
interface PortHarness {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
}

const output = () => ({
  prediction: { data: new Float32Array([64]) },
  confidence: { data: new Float32Array([0.99]) },
  volume: { data: new Float32Array([0.1]) },
  cache_out: { data: new Float32Array(3976) },
});

describe('PESTO worker buffer recovery', () => {
  let worker: WorkerHarness;
  let port: PortHarness;
  const control = async (data: unknown) => {
    if (!worker.onmessage) throw new Error('worker not initialized');
    await worker.onmessage({ data, ports: [port] });
  };
  const send = (sequence: number, start = sequence * 240) => {
    const samples = new Float32Array(240).fill(0.1);
    if (!port.onmessage) throw new Error('port not connected');
    port.onmessage({ data: {
      type: 'audioChunk', generationId: 1, sequence, sourceStartSample: start,
      sourceEndSample: start + 240, sourceEndTimeSec: (start + 240) / 48_000,
      samples, rawRmsDbfs: -20, rawPeak: 0.1, clipCount: 0,
    } });
    return samples.buffer;
  };
  const recycled = () => port.postMessage.mock.calls.map(([message]) => message.buffer).filter(Boolean);

  beforeEach(async () => {
    vi.resetModules();
    run.mockReset().mockImplementation(async () => output());
    worker = { onmessage: null, postMessage: vi.fn() };
    port = { onmessage: null, postMessage: vi.fn() };
    vi.stubGlobal('self', worker);
    await import('../pestoPitchWorker');
    await control({ type: 'connectPort' });
    await control({ type: 'init', sensitivity: 5, generationId: 1, shiftSemitones: 0 });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('recycles queued and in-flight buffers on a gap and resumes with a fresh cache', async () => {
    let release: (() => void) | undefined;
    run.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(output()); }));
    const first = send(0);
    const queued = send(1);
    const resumed = send(3);
    expect(recycled()).toContain(queued);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(resumed));
    expect(recycled().filter((buffer) => buffer === first)).toHaveLength(1);
    expect(recycled().filter((buffer) => buffer === queued)).toHaveLength(1);
    expect(recycled().filter((buffer) => buffer === resumed)).toHaveLength(1);
    for (let sequence = 4; sequence < 10; sequence += 1) {
      send(sequence);
      await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(sequence - 1));
    }
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn', note: 64 }));
  });

  it('returns buffers discarded by a generation change', async () => {
    let release: (() => void) | undefined;
    run.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(output()); }));
    const first = send(0);
    const queued = send(1);
    await control({ type: 'setShiftSemitones', shiftSemitones: 12, generationId: 2 });
    expect(recycled()).toContain(queued);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(first));
    expect(worker.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn' }));
  });

  it('recycles a failed inference buffer and continues processing', async () => {
    run.mockRejectedValueOnce(new Error('inference failed'));
    const failed = send(0);
    const next = send(1);
    await vi.waitFor(() => expect(recycled()).toContain(next));
    expect(recycled()).toContain(failed);
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'error', message: 'inference failed' });
    expect(run).toHaveBeenCalledTimes(2);
  });
});
