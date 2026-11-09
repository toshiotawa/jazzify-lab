import { encodePcm16Wav, layoutPcmWavSegments } from '../pcmWavEncoder';

const readFourCc = (view: DataView, offset: number): string => {
  const bytes = [];
  for (let index = 0; index < 4; index += 1) {
    bytes.push(String.fromCharCode(view.getUint8(offset + index)));
  }
  return bytes.join('');
};

describe('pcmWavEncoder', () => {
  it('layouts segment offsets with a one-second gap', () => {
    const sampleRate = 48_000;
    const { pcmSegments, totalSamples } = layoutPcmWavSegments([
      { samples: new Int16Array(1_000), generationId: 1, endSourceSample: 1_000, endSourceTimeSec: 1, inferenceIntervalMs: 5, echoCancellation: false },
      { samples: new Int16Array(500), generationId: 2, endSourceSample: 2_000, endSourceTimeSec: 2, inferenceIntervalMs: 10, echoCancellation: true },
    ], sampleRate);
    expect(pcmSegments[0].wavOffsetSamples).toBe(0);
    expect(pcmSegments[1].wavOffsetSamples).toBe(1_000 + sampleRate);
    expect(totalSamples).toBe(1_000 + sampleRate + 500);
  });

  it('encodes 16-bit mono PCM at 48kHz with valid RIFF header sizes', () => {
    const sampleRate = 48_000;
    const segments = [
      {
        samples: Int16Array.from([100, -100, 0]),
        generationId: 9,
        endSourceSample: 3,
        endSourceTimeSec: 0.001,
        inferenceIntervalMs: 5,
        echoCancellation: false,
      },
    ];
    const { wav, pcmSegments } = encodePcm16Wav(segments, sampleRate);
    expect(pcmSegments[0].sampleCount).toBe(3);
    const view = new DataView(wav);
    expect(readFourCc(view, 0)).toBe('RIFF');
    expect(readFourCc(view, 8)).toBe('WAVE');
    expect(readFourCc(view, 12)).toBe('fmt ');
    expect(readFourCc(view, 36)).toBe('data');
    expect(view.getUint32(40, true)).toBe(6);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(24, true)).toBe(sampleRate);
    const pcm = new Int16Array(wav, 44, 3);
    expect(Array.from(pcm)).toEqual([100, -100, 0]);
  });
});
