import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import { PolyPitchVoiceInput } from '@/utils/pitchInput/polyPitchVoiceInput';

const createStream = (channelCount?: number) => {
  const stop = vi.fn();
  const getSettings = vi.fn(() => (
    channelCount === undefined ? {} : { channelCount }
  ));
  const track = { stop, getSettings, readyState: 'live' };
  return {
    stop,
    stream: {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    },
  };
};

describe('PolyPitchVoiceInput', () => {
  const getUserMedia = vi.fn();
  const pendingMics: Array<(stream: ReturnType<typeof createStream>['stream']) => void> = [];
  const postMessage = vi.fn();
  const createWorklet = vi.fn();
  let workerTarget: EventTarget;
  let failWorkerInit = false;

  const callbacks = () => ({
    onNoteOn: vi.fn(),
    onNoteOff: vi.fn(),
    onConnectionChange: vi.fn(),
    onError: vi.fn(),
  });

  const dispatchWorker = (data: unknown) => {
    workerTarget.dispatchEvent(new MessageEvent('message', { data }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    failWorkerInit = false;
    pendingMics.length = 0;
    pitchDiagnosticRecording.stop();
    pitchDiagnosticRecording.clearLastPolyConnectionError();
    getUserMedia.mockImplementation(() => new Promise((resolve) => {
      pendingMics.push(resolve);
    }));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('MessageChannel', class {
      port1 = {};
      port2 = {};
    });
    workerTarget = new EventTarget();
    vi.stubGlobal('Worker', class {
      addEventListener(...args: Parameters<EventTarget['addEventListener']>) {
        workerTarget.addEventListener(...args);
      }
      removeEventListener(...args: Parameters<EventTarget['removeEventListener']>) {
        workerTarget.removeEventListener(...args);
      }
      postMessage(message: { type: string }) {
        postMessage(message);
        if (message.type === 'init') {
          queueMicrotask(() => {
            if (failWorkerInit) {
              dispatchWorker({ type: 'error', message: 'kernel load failed' });
              return;
            }
            dispatchWorker({ type: 'ready', kernel: 'incport', sampleRate: 48_000 });
          });
        }
      }
      terminate() {}
    });
    vi.stubGlobal('AudioWorkletNode', class extends EventTarget {
      constructor(...args: unknown[]) {
        super();
        createWorklet(...args);
      }
      port = { postMessage: vi.fn(), close: vi.fn() };
      connect() {}
      disconnect() {}
    });
    vi.stubGlobal('AudioContext', class extends EventTarget {
      state = 'running';
      baseLatency = 0;
      currentTime = 0;
      destination = {};
      audioWorklet = { addModule: async () => undefined };
      createGain() {
        return { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
      }
      createAnalyser() {
        return {
          fftSize: 512,
          smoothingTimeConstant: 0,
          connect: vi.fn(),
          disconnect: vi.fn(),
          getFloatTimeDomainData: (buffer: Float32Array) => {
            buffer.fill(0);
          },
        };
      }
      createMediaStreamSource() {
        return { connect: vi.fn(), disconnect: vi.fn() };
      }
      async close() {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('重なった connect は最後の 1 台だけ残す', async () => {
    const input = new PolyPitchVoiceInput();
    const firstCallbacks = callbacks();
    const secondCallbacks = callbacks();
    const first = input.connect(firstCallbacks);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    const second = input.connect(secondCallbacks);
    const firstStream = createStream();
    pendingMics[0]?.(firstStream.stream);

    await expect(first).resolves.toBe(false);
    expect(firstStream.stop).toHaveBeenCalledTimes(1);
    expect(firstCallbacks.onConnectionChange).not.toHaveBeenCalledWith(true);

    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });
    pendingMics[1]?.(createStream().stream);

    await expect(second).resolves.toBe(true);
    expect(secondCallbacks.onConnectionChange).toHaveBeenCalledWith(true);
    await input.disconnect();
  });

  it('入力2では 2 チャンネルを exact で要求し、不足時は接続しない', async () => {
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks, undefined, true, 2);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    const audio = getUserMedia.mock.calls[0]?.[0]?.audio as MediaTrackConstraints;
    expect(audio.channelCount).toEqual({ exact: 2 });
    pendingMics[0]?.(createStream(1).stream);

    await expect(pending).resolves.toBe(false);
    expect(hooks.onError).toHaveBeenCalledWith(expect.stringContaining('入力2'));
    expect(createWorklet).not.toHaveBeenCalled();
  });

  it('Worker ready 後に capture Worklet を構成する', async () => {
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks, undefined, true, 2);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    pendingMics[0]?.(createStream(2).stream);
    await expect(pending).resolves.toBe(true);
    expect(createWorklet).toHaveBeenCalledWith(expect.anything(), 'pesto-capture-processor', {
      channelCountMode: 'max',
      channelInterpretation: 'discrete',
      processorOptions: { inputChannel: 1 },
    });
    await input.disconnect();
  });

  it('Worker エラーを伝播して切断する', async () => {
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);

    dispatchWorker({ type: 'error', message: 'detector stopped' });
    await vi.waitFor(() => {
      expect(hooks.onConnectionChange).toHaveBeenCalledWith(false);
    });
    expect(hooks.onError).toHaveBeenCalledWith('detector stopped');
  });

  it('Worker の noteOn を domTimeStamp 付きで渡す', async () => {
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks);
    await vi.waitFor(() => {
      expect(pendingMics.length).toBeGreaterThan(0);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);

    dispatchWorker({ type: 'noteOn', note: 64, audioContextTime: 1.25 });
    expect(hooks.onNoteOn).toHaveBeenCalledWith(64, expect.any(Number));
    dispatchWorker({ type: 'noteOff', note: 64 });
    expect(hooks.onNoteOff).toHaveBeenCalledWith(64);
    await input.disconnect();
  });

  it('Worker 初期化エラーで即時失敗し30秒待たない', async () => {
    failWorkerInit = true;
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks);
    await vi.waitFor(() => {
      expect(pendingMics.length).toBeGreaterThan(0);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(false);
    expect(hooks.onError).toHaveBeenCalledWith('kernel load failed');
    expect(hooks.onConnectionChange).not.toHaveBeenCalledWith(true);
  });

  it('接続後に診断記録を開始すると polyConnect を残す', async () => {
    const input = new PolyPitchVoiceInput();
    const pending = input.connect(callbacks());
    await vi.waitFor(() => {
      expect(pendingMics.length).toBeGreaterThan(0);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);

    pitchDiagnosticRecording.start();
    dispatchWorker({
      type: 'polyDiagFrame',
      levels: [[64, 90]],
      inputDb: -20,
    });

    const connectEntry = pitchDiagnosticRecording.snapshot().entries.find(
      (entry) => entry.event === 'polyConnect',
    );
    expect(connectEntry?.details).toMatchObject({ engine: 'pitchplease-piano' });
    expect(postMessage).toHaveBeenCalledWith({ type: 'setDiagnostics', enabled: true });

    pitchDiagnosticRecording.stop();
    await input.disconnect();
  });

  it('Worker の noteOn に level を診断へ記録する', async () => {
    pitchDiagnosticRecording.start();
    const input = new PolyPitchVoiceInput();
    const pending = input.connect(callbacks());
    await vi.waitFor(() => {
      expect(pendingMics.length).toBeGreaterThan(0);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);

    dispatchWorker({ type: 'noteOn', note: 64, audioContextTime: 1, level: 88 });
    const noteEntry = pitchDiagnosticRecording.snapshot().entries.find(
      (entry) => entry.event === 'polyNote',
    );
    expect(noteEntry?.details).toMatchObject({ midi: 64, kind: 'on', level: 88 });

    pitchDiagnosticRecording.stop();
    await input.disconnect();
  });

  it('setExpectedPitchClassMask を Worker へ送る', async () => {
    const input = new PolyPitchVoiceInput();
    const pending = input.connect(callbacks());
    await vi.waitFor(() => {
      expect(pendingMics.length).toBeGreaterThan(0);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);
    input.setExpectedPitchClassMask(1 << 4);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setExpectedPitchClassMask',
      mask: 1 << 4,
    }));
    await input.disconnect();
  });
});