import { vi } from 'vitest';
import { MIDI_PIANO_MIN } from '@/utils/pitchInput/polyPitchActiveSet';

const push = vi.fn();

vi.mock('@/utils/pitchInput/polyPitchPleaseWorkerEngine', () => ({
  initPolyPitchWorkerEngine: async () => ({
    detector: { push },
    kernelId: 'test-kernel',
    inputRate: 48_000,
  }),
}));

interface WorkerHarness {
  onmessage: ((event: { data: unknown; ports: unknown[] }) => Promise<void>) | null;
  postMessage: ReturnType<typeof vi.fn>;
}

interface PortHarness {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
}

describe('polyPitchWorker', () => {
  let worker: WorkerHarness;
  let port: PortHarness;

  const control = async (data: unknown, ports: unknown[] = []) => {
    if (!worker.onmessage) throw new Error('worker not initialized');
    await worker.onmessage({ data, ports });
  };

  const send = (sequence: number, start = sequence * 240, activeGeneration = 1) => {
    const samples = new Float32Array(240).fill(0.1);
    if (!port.onmessage) throw new Error('port not connected');
    port.onmessage({
      data: {
        type: 'audioChunk',
        generationId: activeGeneration,
        sequence,
        sourceStartSample: start,
        sourceEndSample: start + 240,
        sourceEndTimeSec: (start + 240) / 48_000,
        samples,
        rawRmsDbfs: -20,
        rawPeak: 0.1,
        clipCount: 0,
      },
    });
    return samples.buffer;
  };

  const recycled = () => port.postMessage.mock.calls.map(([message]) => message.buffer).filter(Boolean);

  beforeEach(async () => {
    vi.resetModules();
    push.mockReset().mockImplementation(() => {
      const probs = new Float32Array(88);
      probs[64 - MIDI_PIANO_MIN] = 0.95;
      return [{ probs }];
    });
    worker = { onmessage: null, postMessage: vi.fn() };
    port = { onmessage: null, postMessage: vi.fn() };
    vi.stubGlobal('self', worker);
    await import('../polyPitchWorker');
    await control({ type: 'connectPort' }, [port]);
    await control({
      type: 'init',
      generationId: 1,
      expectedPitchClassMask: 0,
    });
    worker.postMessage.mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('recycles buffers and emits noteOn from PitchPlease frames', async () => {
    const buffer = send(0);
    await vi.waitFor(() => expect(recycled()).toContain(buffer));
    const noteOn = worker.postMessage.mock.calls.find(
      ([message]) => message.type === 'noteOn',
    );
    expect(noteOn?.[0]).toMatchObject({ note: 64 });
  });

  it('drops audio from stale generations', () => {
    send(0, 0, 2);
    expect(recycled()).toHaveLength(1);
    expect(push).not.toHaveBeenCalled();
  });

  it('noteOn に frame.t を反映した audioContextTime を付与する', () => {
    push.mockImplementation(() => {
      const probs = new Float32Array(88);
      probs[64 - MIDI_PIANO_MIN] = 0.95;
      return [{ probs, t: 0.04 }];
    });
    send(0, 0, 1);
    const noteOn = worker.postMessage.mock.calls.find(
      ([message]) => message.type === 'noteOn',
    );
    expect(noteOn?.[0]).toMatchObject({
      note: 64,
      audioContextTime: 0.04,
      level: 95,
    });
  });
});