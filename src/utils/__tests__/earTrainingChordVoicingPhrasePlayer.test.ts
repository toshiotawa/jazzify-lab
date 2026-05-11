import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EarTrainingChordVoicingPhrasePlayer } from '@/utils/earTrainingChordVoicingPhrasePlayer';

const phraseStarts: number[] = [];
let decodeCallCount = 0;

class MockAudioParam {
  value = 1;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = new MockAudioParam();
  connect = vi.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn((when?: number) => {
    if (typeof when === 'number') {
      phraseStarts.push(when);
    }
  });
  stop = vi.fn();
}

const fakeBuffer: AudioBuffer = {
  duration: 8,
  sampleRate: 44100,
  length: 352800,
  numberOfChannels: 2,
  getChannelData: () => new Float32Array(0),
  copyFromChannel: () => undefined,
  copyToChannel: () => undefined,
};

class MockAudioContext {
  currentTime = 0;
  destination: object = {};

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  decodeAudioData = vi.fn().mockImplementation(() => {
    decodeCallCount += 1;
    return Promise.resolve(fakeBuffer);
  });

  createOscillator = (): MockOscillatorNode => new MockOscillatorNode();
  createGain = (): MockGainNode => new MockGainNode();
  createBufferSource = (): MockBufferSourceNode => new MockBufferSourceNode();
}

describe('EarTrainingChordVoicingPhrasePlayer', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    phraseStarts.length = 0;
    decodeCallCount = 0;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  const makePlayer = (): {
    player: EarTrainingChordVoicingPhrasePlayer;
    mockCtx: MockAudioContext;
  } => {
    const mockCtx = new MockAudioContext();
    const player = new EarTrainingChordVoicingPhrasePlayer({
      createAudioContext: () => mockCtx as unknown as AudioContext,
    });
    return { player, mockCtx };
  };

  it('schedulePreparedPhraseWithCountIn: フレーズは firstClick + beats * spb で start される', async () => {
    vi.useFakeTimers();
    const { player, mockCtx } = makePlayer();
    mockCtx.currentTime = 0;
    const prepared = {
      url: 'https://example.com/a.mp3',
      buffer: fakeBuffer,
    };
    player.schedulePreparedPhraseWithCountIn({
      prepared,
      countInBeats: 4,
      bpm: 60,
      beatGain: 1,
    });
    await Promise.resolve();
    await Promise.resolve();
    const leadIn = 0.02;
    const spb = 1;
    const firstClick = mockCtx.currentTime + leadIn;
    const expectedPhraseStart = firstClick + 4 * spb;
    expect(phraseStarts).toEqual([expectedPhraseStart]);
    player.dispose();
  });

  it('onBeat が各クリック後に残り拍を通知し、onInputWindowStart はフレーズ頭の半拍前に1回', async () => {
    vi.useFakeTimers();
    const { player } = makePlayer();
    const onBeat = vi.fn();
    const onInputWindowStart = vi.fn();
    const prepared = {
      url: 'https://example.com/b.mp3',
      buffer: fakeBuffer,
    };
    player.schedulePreparedPhraseWithCountIn({
      prepared,
      countInBeats: 4,
      bpm: 60,
      beatGain: 1,
      onBeat,
      onInputWindowStart,
    });
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);
    expect(onBeat).toHaveBeenLastCalledWith(3);
    await vi.advanceTimersByTimeAsync(3520);
    expect(onInputWindowStart).toHaveBeenCalledTimes(1);
    player.dispose();
  });

  it('prepare は同一 URL で decodeAudioData を1回だけ呼ぶ', async () => {
    const { player } = makePlayer();
    const url = 'https://example.com/c.mp3';
    await player.prepare(url);
    await player.prepare(url);
    expect(decodeCallCount).toBe(1);
    player.dispose();
  });

  it('getCurrentTime はフレーズ頭までは 0、再生後は経過秒を返す', async () => {
    vi.useFakeTimers();
    const { player, mockCtx } = makePlayer();
    mockCtx.currentTime = 0;
    const prepared = {
      url: 'https://example.com/d.mp3',
      buffer: fakeBuffer,
    };
    player.schedulePreparedPhraseWithCountIn({
      prepared,
      countInBeats: 1,
      bpm: 60,
      beatGain: 1,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(player.getCurrentTime()).toBe(0);
    const phraseStart = 0.02 + 1;
    mockCtx.currentTime = phraseStart + 0.5;
    expect(player.getCurrentTime()).toBeCloseTo(0.5, 5);
    player.dispose();
  });

  it('stop 後は getCurrentTime が 0', () => {
    const { player } = makePlayer();
    player.stop();
    expect(player.getCurrentTime()).toBe(0);
    player.dispose();
  });
});
