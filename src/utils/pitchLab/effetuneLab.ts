import { createChain, createNoteSpectrogram } from '@effetune/dsp';
import { EffeTuneNode } from '@effetune/dsp/worklet';
import type { NoteSpectrogramTelemetryFrame, TelemetryFrame } from '@effetune/dsp';
import {
  EFFETUNE_LEVEL_THRESHOLD,
  type PolyPitchEngineId,
  type PolyPitchFrame,
} from './polyPitchTypes';
import { effeTuneLevelsToActiveMidis } from './polyPitchMetrics';
import type { PolyPitchSessionRecorder } from './polyPitchSession';

export const EFFETUNE_VENDOR_BASE = '/vendor/effetune/';

const effetuneWorkletOptions = () => ({
  processorUrl: `${EFFETUNE_VENDOR_BASE}worklet-processor.js`,
  wasmUrl: `${EFFETUNE_VENDOR_BASE}assets/effetune-dsp.wasm`,
  simdWasmUrl: `${EFFETUNE_VENDOR_BASE}assets/effetune-dsp.simd.wasm`,
  metaUrl: `${EFFETUNE_VENDOR_BASE}assets/effetune-dsp.meta.json`,
});

const isNoteSpectrogram = (frame: TelemetryFrame): frame is NoteSpectrogramTelemetryFrame =>
  frame.kind === 'noteSpectrogram';

const revisedLevelsFromFrame = (
  frame: NoteSpectrogramTelemetryFrame,
): { levels: Float32Array; engineId: PolyPitchEngineId }[] => {
  const immediate: PolyPitchEngineId = 'effetune-immediate';
  const out: { levels: Float32Array; engineId: PolyPitchEngineId }[] = [
    { levels: frame.levels, engineId: immediate },
  ];
  const ext = frame as NoteSpectrogramTelemetryFrame & {
    revisedLevels?: Float32Array | null;
    revisions?: readonly { age: number; levels: Float32Array }[];
  };
  if (ext.revisions && ext.revisions.length > 0) {
    const rev40 = ext.revisions.find((r) => r.age === 2);
    if (rev40) {
      out.push({ levels: rev40.levels, engineId: 'effetune-revised-40ms' });
    }
  } else if (ext.revisedLevels) {
    out.push({ levels: ext.revisedLevels, engineId: 'effetune-revised-40ms' });
  }
  return out;
};

const spectrogramToPolyFrames = (
  frame: NoteSpectrogramTelemetryFrame,
  emitTimeSec: number,
): PolyPitchFrame[] => {
  const contentTimeSec = frame.timeSeconds;
  return revisedLevelsFromFrame(frame).map(({ levels, engineId }) => ({
    engineId,
    contentTimeSec,
    emitTimeSec,
    activeMidis: effeTuneLevelsToActiveMidis(
      levels,
      frame.firstMidi,
      frame.divisionsPerSemitone,
      EFFETUNE_LEVEL_THRESHOLD,
    ),
  }));
};

export interface EffetuneLabLiveHandle {
  node: EffeTuneNode;
  source: MediaStreamAudioSourceNode;
  unsubscribe: () => void;
}

export const connectEffetuneLive = async (
  context: AudioContext,
  stream: MediaStream,
  recorder: PolyPitchSessionRecorder | null,
  onFrame?: (frame: PolyPitchFrame) => void,
  onSpectrogram?: (frame: NoteSpectrogramTelemetryFrame) => void,
): Promise<EffetuneLabLiveHandle> => {
  const node = await EffeTuneNode.create(context, [createNoteSpectrogram()], {
    channels: 1,
    ...effetuneWorkletOptions(),
  });
  const source = context.createMediaStreamSource(stream);
  source.connect(node);

  const unsubscribe = node.subscribe((telemetry) => {
    if (!isNoteSpectrogram(telemetry)) return;
    onSpectrogram?.(telemetry);
    const emitTimeSec = context.currentTime;
    for (const poly of spectrogramToPolyFrames(telemetry, emitTimeSec)) {
      recorder?.append(poly);
      onFrame?.(poly);
    }
  });

  return { node, source, unsubscribe };
};

export const disconnectEffetuneLive = (handle: EffetuneLabLiveHandle): void => {
  handle.unsubscribe();
  handle.source.disconnect();
  handle.node.disconnect();
  handle.node.close();
};

export const analyzeEffetuneOffline = async (
  audio: AudioBuffer,
  onProgress?: (frameCount: number) => void,
): Promise<PolyPitchFrame[]> => {
  const channel = audio.getChannelData(0);
  const chain = await createChain([createNoteSpectrogram()]);
  const collected: PolyPitchFrame[] = [];
  await chain.process([channel], {
    sampleRate: audio.sampleRate,
    onTelemetry: (telemetry) => {
      if (!isNoteSpectrogram(telemetry)) return;
      const emitTimeSec = telemetry.timeSeconds;
      for (const poly of spectrogramToPolyFrames(telemetry, emitTimeSec)) {
        collected.push(poly);
      }
      onProgress?.(collected.length);
    },
  });
  chain.close();
  return collected;
};

export const effetuneDroppedFrames = (handle: EffetuneLabLiveHandle): number =>
  handle.node.droppedTelemetryFrames;
