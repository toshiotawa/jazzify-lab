export interface PcmWavSegmentInput {
  samples: Int16Array;
  generationId: number;
  endSourceSample: number;
  endSourceTimeSec: number;
  inferenceIntervalMs: number;
  echoCancellation: boolean;
}

export interface PcmWavSegmentMeta {
  generationId: number;
  wavOffsetSamples: number;
  sampleCount: number;
  endSourceSample: number;
  endSourceTimeSec: number;
  inferenceIntervalMs: number;
  echoCancellation: boolean;
}

export const layoutPcmWavSegments = (
  segments: readonly PcmWavSegmentInput[],
  sampleRate: number,
  gapSec = 1,
): { pcmSegments: PcmWavSegmentMeta[]; totalSamples: number } => {
  const gapSamples = Math.round(sampleRate * gapSec);
  const pcmSegments: PcmWavSegmentMeta[] = [];
  let offset = 0;
  for (let index = 0; index < segments.length; index += 1) {
    if (index > 0) {
      offset += gapSamples;
    }
    const segment = segments[index];
    pcmSegments.push({
      generationId: segment.generationId,
      wavOffsetSamples: offset,
      sampleCount: segment.samples.length,
      endSourceSample: segment.endSourceSample,
      endSourceTimeSec: segment.endSourceTimeSec,
      inferenceIntervalMs: segment.inferenceIntervalMs,
      echoCancellation: segment.echoCancellation,
    });
    offset += segment.samples.length;
  }
  return { pcmSegments, totalSamples: offset };
};

const writeString = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

export const encodePcm16Wav = (
  segments: readonly PcmWavSegmentInput[],
  sampleRate: number,
  gapSec = 1,
): { wav: ArrayBuffer; pcmSegments: PcmWavSegmentMeta[] } => {
  const gapSamples = Math.round(sampleRate * gapSec);
  const { pcmSegments, totalSamples } = layoutPcmWavSegments(segments, sampleRate, gapSec);
  const dataBytes = totalSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataBytes, true);
  const pcm = new Int16Array(buffer, 44, totalSamples);
  let writeIndex = 0;
  for (let index = 0; index < segments.length; index += 1) {
    if (index > 0) {
      writeIndex += gapSamples;
    }
    pcm.set(segments[index].samples, writeIndex);
    writeIndex += segments[index].samples.length;
  }
  return { wav: buffer, pcmSegments };
};
