import { vi } from 'vitest';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import { PitchInputController } from '@/utils/PitchInputController';

vi.mock('@/utils/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/utils/globalAudience', () => ({ shouldUseEnglishCopy: () => false }));

const constraints = {
  deviceId: { exact: 'external-mic' },
  echoCancellation: true,
  noiseSuppression: false,
  autoGainControl: false,
};

describe('PitchInputController microphone setup', () => {
  const applyConstraints = vi.fn().mockResolvedValue(undefined);
  const stop = vi.fn();
  const getUserMedia = vi.fn();
  let controller: PitchInputController;
  let worker: EventTarget;

  beforeEach(() => {
    vi.clearAllMocks();
    PitchInputController.clearCachedPermission();
    applyConstraints.mockResolvedValue(undefined);
    const track = Object.assign(new EventTarget(), { readyState: 'live', getSettings: () => ({ deviceId: 'external-mic' }), applyConstraints, stop });
    getUserMedia.mockResolvedValue({ getAudioTracks: () => [track], getTracks: () => [track] });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('MessageChannel', class { port1 = {}; port2 = {}; });
    worker = new EventTarget();
    vi.stubGlobal('Worker', class {
      addEventListener(...args: Parameters<EventTarget['addEventListener']>) { worker.addEventListener(...args); }
      removeEventListener(...args: Parameters<EventTarget['removeEventListener']>) { worker.removeEventListener(...args); }
      postMessage(message: { type: string }) {
        if (message.type === 'init') queueMicrotask(() => worker.dispatchEvent(new MessageEvent('message', { data: { type: 'ready' } })));
      }
      terminate() {}
    });
    vi.stubGlobal('AudioWorkletNode', class extends EventTarget {
      port = { postMessage: () => undefined, close: () => undefined };
      connect() {}
      disconnect() {}
    });
    vi.stubGlobal('AudioContext', class extends EventTarget {
      state = 'running';
      baseLatency = 0;
      audioWorklet = { addModule: async () => undefined };
      createGain() { return { gain: { value: 0 }, connect: () => undefined, disconnect: () => undefined }; }
      createMediaStreamSource() { return { connect: () => undefined }; }
      async close() {}
    });
    controller = new PitchInputController({ onNoteOn: vi.fn(), onNoteOff: vi.fn() });
  });

  afterEach(async () => {
    await controller.disconnect();
    PitchInputController.clearCachedPermission();
    PitchInputController.setDiagnosticRecording(false);
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses the same AGC/NS settings for permission capture and fresh connections', async () => {
    expect(await PitchInputController.requestMicrophonePermission('external-mic')).toBe(true);
    expect(getUserMedia).toHaveBeenLastCalledWith({ audio: constraints, video: false });
    expect(await controller.connect('external-mic')).toBe(true);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(applyConstraints).toHaveBeenCalledWith(constraints);
    await controller.disconnect();
    expect(await controller.connect('external-mic')).toBe(true);
    expect(getUserMedia).toHaveBeenLastCalledWith({ audio: constraints, video: false });
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it('releases a cached microphone when applying its constraints fails', async () => {
    await PitchInputController.requestMicrophonePermission('external-mic');
    applyConstraints.mockRejectedValueOnce(new Error('constraints failed'));
    expect(await controller.connect('external-mic')).toBe(false);
    expect(stop).toHaveBeenCalled();
    expect(controller.isConnected()).toBe(false);
  });

  it('retains monitor and lifecycle history after disconnecting', async () => {
    PitchInputController.setDiagnosticRecording(true);
    await controller.connect('external-mic');
    worker.dispatchEvent(new MessageEvent('message', { data: {
      type: 'monitor', captureIntervalMs: 50, inferenceMs: 40, inputLevelDb: -20,
    } }));
    document.dispatchEvent(new Event('visibilitychange'));
    worker.dispatchEvent(new MessageEvent('error', { data: {} }));
    await controller.disconnect();
    const entries = pitchDiagnosticRecording.snapshot().entries;
    expect(entries.map((entry) => entry.event)).toEqual(expect.arrayContaining([
      'connectStarted', 'connected', 'monitor', 'document:visibilitychange', 'workerError', 'disconnect',
    ]));
    expect(entries.find((entry) => entry.event === 'monitor')?.details).toMatchObject({
      monitor: { inputLevelDb: -20, inferenceMs: 40 },
    });
    const length = entries.length;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pitchDiagnosticRecording.snapshot().entries).toHaveLength(length);
  });

  it('reports measured audio level independently of inference duration', async () => {
    await controller.connect('external-mic');
    worker.dispatchEvent(new MessageEvent('message', { data: { type: 'monitor', captureIntervalMs: 5, inferenceMs: 30, inputLevelDb: -42 } }));
    expect(PitchInputController.getLatencyStats().inputLevelDb).toBe(-42);
    worker.dispatchEvent(new MessageEvent('message', { data: { type: 'monitor', captureIntervalMs: 5, inferenceMs: 1, inputLevelDb: -42 } }));
    expect(PitchInputController.getLatencyStats().inputLevelDb).toBe(-42);
    await controller.disconnect();
    expect(PitchInputController.getLatencyStats().inputLevelDb).toBeNull();
  });

  it('downloads collected history even when the Worker cannot answer the state request', async () => {
    PitchInputController.setDiagnosticRecording(true);
    await controller.connect('external-mic');
    const download = vi.spyOn(pitchDiagnosticRecording, 'download').mockImplementation(() => undefined);
    vi.useFakeTimers();
    const request = PitchInputController.downloadDiagnostics();
    expect(download).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    await request;
    expect(download).toHaveBeenCalledOnce();
    expect(pitchDiagnosticRecording.snapshot().entries.map((entry) => entry.event)).toContain('workerStateTimeout');
  });
});
