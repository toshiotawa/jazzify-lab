import { PitchPleaseError, type Detector, type Frame, type Stats } from '@markusstrasser/pitchplease';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPitchPleaseLab,
  startPitchPleaseOnStream,
  stopPitchPlease,
  type PitchPleaseLabHandle,
} from '@/utils/pitchLab/pitchPleaseLab';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';
import { PolyPitchVoiceInput } from '@/utils/pitchInput/polyPitchVoiceInput';

vi.mock('@/utils/pitchLab/pitchPleaseLab', () => ({
  createPitchPleaseLab: vi.fn(),
  startPitchPleaseOnStream: vi.fn(),
  stopPitchPlease: vi.fn(),
}));

const pianoStats = (): Stats => ({
  model: 'piano',
  kernel: null,
  cpuLoad: 0,
  framesPerSecond: 0,
  sampleRate: 48_000,
});

const createHandle = (): PitchPleaseLabHandle => {
  const detector: Detector = {
    start: () => Promise.resolve(true),
    stop: () => undefined,
    togglePause: () => false,
    setModel: () => Promise.resolve(null),
    paused: false,
    running: true,
    model: 'piano',
    stats: pianoStats(),
  };
  return { detector, model: 'piano' };
};

const createStream = () => {
  const stop = vi.fn();
  const track = { stop };
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

  const callbacks = () => ({
    onNoteOn: vi.fn(),
    onNoteOff: vi.fn(),
    onConnectionChange: vi.fn(),
    onError: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    pendingMics.length = 0;
    pitchDiagnosticRecording.stop();
    pitchDiagnosticRecording.clearLastPolyConnectionError();
    getUserMedia.mockImplementation(() => new Promise((resolve) => {
      pendingMics.push(resolve);
    }));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.mocked(createPitchPleaseLab).mockImplementation(() => createHandle());
    vi.mocked(startPitchPleaseOnStream).mockResolvedValue(true);
  });

  it('重なった connect は最後の 1 台だけ残す', async () => {
    const input = new PolyPitchVoiceInput();
    const firstCallbacks = callbacks();
    const secondCallbacks = callbacks();
    const first = input.connect( firstCallbacks);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    const second = input.connect( secondCallbacks);
    const firstStream = createStream();
    const resolveFirst = pendingMics[0];
    if (!resolveFirst) throw new Error('マイク待ちがありません');
    resolveFirst(firstStream.stream);

    await expect(first).resolves.toBe(false);
    expect(firstStream.stop).toHaveBeenCalledTimes(1);
    expect(startPitchPleaseOnStream).not.toHaveBeenCalled();
    expect(firstCallbacks.onConnectionChange).not.toHaveBeenCalledWith(true);

    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });
    const secondStream = createStream();
    const resolveSecond = pendingMics[1];
    if (!resolveSecond) throw new Error('2 台目のマイク待ちがありません');
    resolveSecond(secondStream.stream);

    await expect(second).resolves.toBe(true);
    expect(startPitchPleaseOnStream).toHaveBeenCalledTimes(1);
    expect(secondStream.stop).not.toHaveBeenCalled();
    expect(secondCallbacks.onConnectionChange).toHaveBeenCalledWith(true);
    await input.disconnect();
  });

  it('接続中の disconnect は開いたマイクを残さない', async () => {
    const input = new PolyPitchVoiceInput();
    const pending = input.connect( callbacks());
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    const stopping = input.disconnect();
    const stream = createStream();
    const resolveMic = pendingMics[0];
    if (!resolveMic) throw new Error('マイク待ちがありません');
    resolveMic(stream.stream);

    await expect(pending).resolves.toBe(false);
    await stopping;
    expect(stream.stop).toHaveBeenCalledTimes(1);
    expect(startPitchPleaseOnStream).not.toHaveBeenCalled();
  });

  it('入力1では channelCount を要求しない', async () => {
    const input = new PolyPitchVoiceInput();
    const pending = input.connect(callbacks(), 'device-a', true, 1);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    const audio = getUserMedia.mock.calls[0]?.[0]?.audio as MediaTrackConstraints;
    expect(audio.channelCount).toBeUndefined();
    expect(audio.echoCancellation).toBe(true);
    pendingMics[0]?.(createStream().stream);
    await input.disconnect();
    await pending;
  });

  it('入力2では 2 チャンネルを exact で要求する', async () => {
    const input = new PolyPitchVoiceInput();
    const pending = input.connect(callbacks(), undefined, true, 2);
    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
    const audio = getUserMedia.mock.calls[0]?.[0]?.audio as MediaTrackConstraints;
    expect(audio.channelCount).toEqual({ exact: 2 });
    pendingMics[0]?.(createStream().stream);
    await input.disconnect();
    await pending;
  });

  it('PitchPlease の開始失敗をエラーとして返す', async () => {
    vi.mocked(startPitchPleaseOnStream).mockResolvedValue(false);
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect( hooks);
    await vi.waitFor(() => {
      expect(pendingMics).toHaveLength(1);
    });
    const stream = createStream();
    pendingMics[0]?.(stream.stream);

    await expect(pending).resolves.toBe(false);
    expect(hooks.onError).toHaveBeenCalledWith('PitchPlease を開始できませんでした');
    expect(hooks.onConnectionChange).not.toHaveBeenCalledWith(true);
    expect(stopPitchPlease).toHaveBeenCalledTimes(1);
    expect(stream.stop).toHaveBeenCalledTimes(1);
    pitchDiagnosticRecording.start();
    const started = pitchDiagnosticRecording.snapshot().entries.find((entry) => entry.event === 'recordingStarted');
    expect(started?.details).toMatchObject({
      lastPolyConnectionError: 'PitchPlease を開始できませんでした',
    });
    pitchDiagnosticRecording.stop();
    pitchDiagnosticRecording.clearLastPolyConnectionError();
  });

  it('実行中の PitchPlease エラーを診断に残して切断する', async () => {
    let reportError: ((error: PitchPleaseError) => void) | undefined;
    vi.mocked(createPitchPleaseLab).mockImplementation((_model, _recorder, _onFrame, _onDetectorFrame, onError) => {
      reportError = onError;
      return createHandle();
    });
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    pitchDiagnosticRecording.start();
    const pending = input.connect( hooks);
    await vi.waitFor(() => {
      expect(pendingMics).toHaveLength(1);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);

    reportError?.(new PitchPleaseError('processor-error', 'detector stopped'));
    await vi.waitFor(() => {
      expect(stopPitchPlease).toHaveBeenCalledTimes(1);
    });
    expect(hooks.onError).toHaveBeenCalledWith('detector stopped');
    expect(hooks.onConnectionChange).toHaveBeenCalledWith(false);
    const errorEntry = pitchDiagnosticRecording.snapshot().entries.find((entry) => entry.event === 'polyError');
    expect(errorEntry?.details).toMatchObject({ engine: 'pitchplease-piano', message: 'detector stopped' });
    pitchDiagnosticRecording.stop();
    pitchDiagnosticRecording.clearLastPolyConnectionError();
  });

  it('接続後に録音を開始しても polyConnect を残す', async () => {
    let onDetectorFrame: ((frame: Frame) => void) | undefined;
    vi.mocked(createPitchPleaseLab).mockImplementation(
      (_model, _recorder, _onFrame, onFrame) => {
        onDetectorFrame = onFrame;
        return createHandle();
      },
    );
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks);
    await vi.waitFor(() => {
      expect(pendingMics).toHaveLength(1);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);

    expect(
      pitchDiagnosticRecording.snapshot().entries.some((entry) => entry.event === 'polyConnect'),
    ).toBe(false);

    pitchDiagnosticRecording.start();
    const probs = new Float32Array(88);
    onDetectorFrame?.({
      time: 0,
      emitTime: 0,
      probs,
      notes: [],
      pitchClasses: [],
      stable: false,
      chord: null,
    });

    const connectEntry = pitchDiagnosticRecording.snapshot().entries.find(
      (entry) => entry.event === 'polyConnect',
    );
    expect(connectEntry?.details).toMatchObject({
      engine: 'pitchplease-piano',
      echoCancellation: true,
    });

    pitchDiagnosticRecording.stop();
    await input.disconnect();
  });

  it('setExpectedPitchClassMask で弱い期待音を受理する', async () => {
    let onDetectorFrame: ((frame: Frame) => void) | undefined;
    vi.mocked(createPitchPleaseLab).mockImplementation(
      (_model, _recorder, _onFrame, onFrame) => {
        onDetectorFrame = onFrame;
        return createHandle();
      },
    );
    const input = new PolyPitchVoiceInput();
    const hooks = callbacks();
    const pending = input.connect(hooks);
    await vi.waitFor(() => {
      expect(pendingMics).toHaveLength(1);
    });
    pendingMics[0]?.(createStream().stream);
    await expect(pending).resolves.toBe(true);
    input.setExpectedPitchClassMask(1 << 4);

    const probs = new Float32Array(88);
    probs[64 - 21] = 0.5;
    const frameBase: Frame = {
      time: 0,
      emitTime: 0,
      probs,
      notes: [],
      pitchClasses: [],
      stable: false,
      chord: null,
    };
    onDetectorFrame?.(frameBase);
    expect(hooks.onNoteOn).not.toHaveBeenCalled();
    onDetectorFrame?.({ ...frameBase, time: 0.01, emitTime: 0.01 });
    expect(hooks.onNoteOn).toHaveBeenCalledWith(64, expect.any(Number));
    await input.disconnect();
  });
});
