import { describe, expect, it, vi } from 'vitest';

const { SoundTouchMock } = vi.hoisted(() => {
  const mock = vi.fn(function SoundTouchMock(this: {
    pitchSemitones: number;
    inputBuffer: { putSamples: ReturnType<typeof vi.fn> };
    outputBuffer: {
      frameCount: number;
      extract: ReturnType<typeof vi.fn>;
      receive: ReturnType<typeof vi.fn>;
    };
    process: ReturnType<typeof vi.fn>;
  }) {
    this.pitchSemitones = 0;
    this.inputBuffer = { putSamples: vi.fn() };
    this.outputBuffer = {
      frameCount: 0,
      extract: vi.fn(),
      receive: vi.fn(),
    };
    this.process = vi.fn();
  });
  return { SoundTouchMock: mock };
});

vi.mock('@soundtouchjs/core', () => ({
  SoundTouch: SoundTouchMock,
}));

const processOfflineMock = vi.fn(async ({ input }: { input: AudioBuffer }) => input);

vi.mock('@soundtouchjs/audio-worklet', () => ({
  processOffline: (...args: unknown[]) => processOfflineMock(...args),
}));

vi.mock('@soundtouchjs/audio-worklet/processor?url', () => ({
  default: '/mock-soundtouch-processor.js',
}));

import {
  buildPhrasePrepareCacheKey,
  processOfflinePhraseBuffer,
  shiftPhraseBufferPitch,
} from '@/utils/earTrainingPhrasePitchShift';

const createMonoBuffer = (samples: readonly number[], sampleRate = 44100): AudioBuffer => {
  const channel = Float32Array.from(samples);
  return {
    length: samples.length,
    duration: samples.length / sampleRate,
    sampleRate,
    numberOfChannels: 1,
    getChannelData: (index: number) => (index === 0 ? channel : new Float32Array(0)),
    copyFromChannel: () => undefined,
    copyToChannel: () => undefined,
  };
};

const createMockAudioContext = (sampleRate: number): BaseAudioContext => ({
  createBuffer: (channels: number, length: number, rate: number) => {
    const channelData = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      length,
      sampleRate: rate,
      numberOfChannels: channels,
      duration: length / rate,
      getChannelData: (index: number) => channelData[index] ?? new Float32Array(0),
      copyToChannel: (source: Float32Array, channel: number) => {
        channelData[channel]?.set(source);
      },
      copyFromChannel: () => undefined,
    };
  },
  sampleRate,
} as unknown as BaseAudioContext);

describe('earTrainingPhrasePitchShift', () => {
  it('buildPhrasePrepareCacheKey は url・semitones・speedPercent を結合する', () => {
    expect(buildPhrasePrepareCacheKey('https://example.com/a.mp3', 2)).toBe(
      `https://example.com/a.mp3${'\0'}2${'\0'}100`,
    );
    expect(buildPhrasePrepareCacheKey('https://example.com/a.mp3', 12, 50)).toBe(
      `https://example.com/a.mp3${'\0'}12${'\0'}50`,
    );
  });

  it('processOfflinePhraseBuffer: 100%・0半音なら入力をそのまま返す', async () => {
    const source = createMonoBuffer([0, 0.5, -0.5, 0.25]);
    const result = await processOfflinePhraseBuffer(source, { semitones: 0, speedPercent: 100 });
    expect(result).toBe(source);
    expect(processOfflineMock).not.toHaveBeenCalled();
  });

  it('processOfflinePhraseBuffer: 速度変更時 processOffline を呼ぶ', async () => {
    processOfflineMock.mockClear();
    const source = createMonoBuffer([0, 0.25, 0.5]);
    await processOfflinePhraseBuffer(source, { speedPercent: 50 });
    expect(processOfflineMock).toHaveBeenCalledTimes(1);
  });

  it('semitones=0 のとき shiftPhraseBufferPitch は入力バッファをそのまま返す', async () => {
    const source = createMonoBuffer([0, 0.5, -0.5, 0.25]);
    const result = await shiftPhraseBufferPitch(source, 0);
    expect(result).toBe(source);
    expect(SoundTouchMock).not.toHaveBeenCalled();
  });

  it('semitones!=0 のとき SoundTouch 処理を呼ぶ', async () => {
    SoundTouchMock.mockClear();
    const source = createMonoBuffer([0, 0.25, 0.5, 0.75, 1]);
    await shiftPhraseBufferPitch(source, 2, createMockAudioContext(source.sampleRate));
    expect(SoundTouchMock).toHaveBeenCalledTimes(1);
  });
});
