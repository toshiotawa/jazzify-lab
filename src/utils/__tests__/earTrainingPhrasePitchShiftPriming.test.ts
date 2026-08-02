import { describe, expect, it } from 'vitest';
import {
  detectPhraseBufferLeadingOffsetSec,
  resolvePhraseBufferPrimingOffsetSec,
} from '@/utils/earTrainingPhrasePitchShiftPriming';

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

describe('earTrainingPhrasePitchShiftPriming', () => {
  it('detectPhraseBufferLeadingOffsetSec: 先頭無音を検出する', () => {
    const silentFrames = 2205;
    const samples = Array.from({ length: silentFrames + 100 }, (_, index) => (
      index < silentFrames ? 0 : 0.5
    ));
    const buffer = createMonoBuffer(samples);
    const offsetSec = detectPhraseBufferLeadingOffsetSec(buffer, { maxSearchSec: 0.1 });
    expect(offsetSec).toBeCloseTo(silentFrames / 44100, 5);
  });

  it('resolvePhraseBufferPrimingOffsetSec: 最大オフセットを返す', () => {
    const a = createMonoBuffer([0, 0, 0.5]);
    const b = createMonoBuffer([0, 0, 0, 0, 0.5]);
    expect(resolvePhraseBufferPrimingOffsetSec([a, b])).toBeCloseTo(4 / 44100, 5);
  });
});
