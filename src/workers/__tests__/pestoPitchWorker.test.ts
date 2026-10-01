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

const output = (note = 64) => ({
  prediction: { data: new Float32Array([note]), dispose: vi.fn() },
  confidence: { data: new Float32Array([0.99]), dispose: vi.fn() },
  volume: { data: new Float32Array([0.1]), dispose: vi.fn() },
  cache_out: { data: new Float32Array(3976).fill(1), dispose: vi.fn() },
});

describe('PESTO worker buffer recovery', () => {
  let worker: WorkerHarness;
  let port: PortHarness;
  const control = async (data: unknown) => {
    if (!worker.onmessage) throw new Error('worker not initialized');
    await worker.onmessage({ data, ports: [port] });
  };
  const send = (sequence: number, start = sequence * 240, activeGeneration = 1, captureQueueAgeMs = 0) => {
    const samples = new Float32Array(240).fill(0.1);
    if (!port.onmessage) throw new Error('port not connected');
    port.onmessage({ data: {
      type: 'audioChunk', generationId: activeGeneration, sequence, captureQueueAgeMs, sourceStartSample: start,
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
    await control({ type: 'init', sensitivity: 5, generationId: 1, shiftSemitones: 0,
      diagnostics: { deviceLabel: 'test mic', sampleRate: 48_000, requestedEchoCancellation: true, actualEchoCancellation: true },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('fetches only used outputs and releases their tensors after processing', async () => {
    const result = output();
    run.mockResolvedValueOnce(result);
    const buffer = send(0);
    await vi.waitFor(() => expect(recycled()).toContain(buffer));
    expect(run).toHaveBeenCalledWith(expect.anything(), ['prediction', 'confidence', 'volume', 'cache_out']);
    for (const tensor of Object.values(result)) expect(tensor.dispose).toHaveBeenCalledTimes(1);
  });

  it('does not reset the in-flight cache when later chunks have a gap', async () => {
    const cacheAtRun: number[] = [];
    run.mockImplementation((feeds: { cache: { data: Float32Array } }) => {
      cacheAtRun.push(feeds.cache.data[0]);
      return Promise.resolve(output());
    });
    for (let i = 0; i < 6; i += 1) {
      const buffer = send(i);
      await vi.waitFor(() => expect(recycled()).toContain(buffer));
    }
    let release: (() => void) | undefined;
    let runningCache: Float32Array | undefined;
    const result = output();
    run.mockImplementationOnce((feeds: { cache: { data: Float32Array } }) => {
      runningCache = feeds.cache.data;
      return new Promise((resolve) => { release = () => resolve(result); });
    });
    const first = send(6);
    send(7);
    const resumed = send(30);
    // 欠落より前の推論は、入力cacheも結果もまだ正常。
    expect(runningCache?.[0]).toBe(1);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(resumed));
    expect(recycled()).toContain(first);
    for (const tensor of Object.values(result)) expect(tensor.dispose).toHaveBeenCalledTimes(1);
    // 新区間を推論するときだけcacheをクリアする。
    expect(cacheAtRun.at(-1)).toBe(0);
  });

  it('discards pending chunks on any sequence gap and resets before resuming like iOS', async () => {
    const cacheAtRun: number[] = [];
    run.mockImplementation((feeds: { cache: { data: Float32Array } }) => {
      cacheAtRun.push(feeds.cache.data[0]);
      return Promise.resolve(output());
    });
    for (let sequence = 0; sequence < 6; sequence += 1) {
      const buffer = send(sequence);
      await vi.waitFor(() => expect(recycled()).toContain(buffer));
    }
    let release: (() => void) | undefined;
    run.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(output()); }));
    const first = send(6);
    const queued = send(7);
    const resumed = send(9);
    expect(recycled()).toContain(queued);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(resumed));
    for (const buffer of [first, queued, resumed]) {
      expect(recycled().filter((returned) => returned === buffer)).toHaveLength(1);
    }
    expect(cacheAtRun.at(-1)).toBe(0);
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOff' }));
  });

  it.each([1, 128, 480, 481])('resets cache for any missing source samples like iOS: %s', async (gap) => {
    const cacheAtRun: number[] = [];
    run.mockImplementation((feeds: { cache: { data: Float32Array } }) => {
      cacheAtRun.push(feeds.cache.data[0]);
      return Promise.resolve(output());
    });
    const first = send(0);
    await vi.waitFor(() => expect(recycled()).toContain(first));
    const next = send(2, 240 + gap);
    await vi.waitFor(() => expect(recycled()).toContain(next));
    expect(cacheAtRun).toEqual([0, 0]);
    for (let sequence = 3; sequence < 65; sequence += 1) {
      send(sequence, (sequence - 1) * 240 + gap);
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn', note: 64 }));
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'monitor', diagnostics: expect.objectContaining({ modelResetCount: 1, warmupFramesRemaining: 0 }),
    }));
  });

  it('includes capture-side waiting time in diagnostics', async () => {
    for (let sequence = 0; sequence < 60; sequence += 1) {
      send(sequence, sequence * 240, 1, 35);
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'monitor', diagnostics: expect.objectContaining({ queueAgeMsP95: expect.any(Number) }),
    }));
    const monitor = worker.postMessage.mock.calls.find(([message]) => message.type === 'monitor')?.[0];
    expect(monitor.diagnostics.queueAgeMsP95).toBeGreaterThanOrEqual(35);
  });

  it.each([12, 24])('matches iOS low-register accumulation and restores concert pitch at shift +%s', async (shift) => {
    await control({ type: 'init', sensitivity: 5, generationId: 1, shiftSemitones: shift });
    const factor = shift === 12 ? 2 : 4;
    for (let sequence = 0; sequence < 12 * factor; sequence += 1) {
      const buffer = send(sequence);
      await Promise.resolve();
      await Promise.resolve();
      expect(recycled()).toContain(buffer);
      expect(run).toHaveBeenCalledTimes(Math.floor((sequence + 1) / factor));
    }
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn', note: 64 - shift }));
  });

  it('bounds a burst of gaps and processes the retained valid suffix after a slow inference', async () => {
    let release: (() => void) | undefined;
    run.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(output()); }));
    const first = send(0);
    const discarded: ArrayBufferLike[] = [];
    for (let sequence = 2; sequence < 100; sequence += 2) discarded.push(send(sequence));
    const resumed = send(100);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(resumed));
    // iOS同様、欠番ごとに待機音声を回収し、最新の100から再開する。
    expect(run).toHaveBeenCalledTimes(2);
    for (const buffer of [first, ...discarded, resumed]) {
      expect(recycled().filter((returned) => returned === buffer)).toHaveLength(1);
    }
    for (let sequence = 101; sequence < 107; sequence += 1) {
      const buffer = send(sequence);
      await vi.waitFor(() => expect(recycled()).toContain(buffer));
    }
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn', note: 64 }));
  });

  it.each(['cache', 'prediction', 'confidence', 'volume'])('recovers from non-finite %s without poisoning future frames', async (field) => {
    const invalid = output();
    if (field === 'cache') invalid.cache_out.data[0] = NaN;
    else if (field === 'prediction') invalid.prediction.data[0] = NaN;
    else if (field === 'confidence') invalid.confidence.data[0] = Infinity;
    else invalid.volume.data[0] = NaN;
    run.mockResolvedValueOnce(invalid);
    const failed = send(0);
    const next = send(1);
    await vi.waitFor(() => expect(recycled()).toContain(next));
    expect(recycled()).toContain(failed);
    expect(run).toHaveBeenCalledTimes(2);
    for (const tensor of Object.values(invalid)) expect(tensor.dispose).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('recycles obsolete queued and in-flight buffers on a long gap and resumes with a fresh cache', async () => {
    let release: (() => void) | undefined;
    run.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(output()); }));
    const first = send(0);
    const queued = send(1);
    const resumed = send(30);
    expect(recycled()).toContain(queued);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(resumed));
    expect(recycled().filter((buffer) => buffer === first)).toHaveLength(1);
    expect(recycled().filter((buffer) => buffer === queued)).toHaveLength(1);
    expect(recycled().filter((buffer) => buffer === resumed)).toHaveLength(1);
    for (let sequence = 31; sequence < 37; sequence += 1) {
      send(sequence);
      await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(sequence - 28));
    }
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn', note: 64 }));
  });

  it('returns buffers discarded by a generation change', async () => {
    let release: (() => void) | undefined;
    const stale = output();
    run.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(stale); }));
    const first = send(0);
    const queued = send(1);
    await control({ type: 'setShiftSemitones', shiftSemitones: 12, generationId: 2 });
    expect(recycled()).toContain(queued);
    if (!release) throw new Error('inference did not start');
    release();
    await vi.waitFor(() => expect(recycled()).toContain(first));
    expect(worker.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOn' }));
    for (const tensor of Object.values(stale)) expect(tensor.dispose).toHaveBeenCalledTimes(1);
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
