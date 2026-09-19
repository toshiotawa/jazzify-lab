import { barSeconds } from '@/game/defense/defenseTransport';

export interface DefenseAudioLoopWindow {
  readonly startMeasure: number;
  readonly endMeasure: number;
  readonly startSec: number;
  readonly endSec: number;
  readonly durationSec: number;
}

export interface ResolveDefenseAudioLoopWindowParams {
  readonly startMeasure: number;
  readonly endMeasure: number;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly bufferDurationSec?: number;
}

export const resolveDefenseAudioLoopWindow = (
  params: ResolveDefenseAudioLoopWindowParams,
): DefenseAudioLoopWindow => {
  const startMeasure = Math.max(1, Math.trunc(params.startMeasure));
  const endMeasure = Math.max(startMeasure, Math.trunc(params.endMeasure));
  const measureDurationSec = barSeconds(params.bpm, params.beatsPerBar);
  const startSec = (startMeasure - 1) * measureDurationSec;
  let endSec = endMeasure * measureDurationSec;
  if (params.bufferDurationSec !== undefined) {
    endSec = Math.min(endSec, Math.max(startSec, params.bufferDurationSec));
  }
  return {
    startMeasure,
    endMeasure,
    startSec,
    endSec,
    durationSec: Math.max(1e-6, endSec - startSec),
  };
};

export const resolveDefenseAudioLoopFrameRange = (params: {
  readonly startMeasure: number;
  readonly endMeasure: number;
  readonly sampleRate: number;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly bufferFrameLength: number;
}): { startFrame: number; frameCount: number } => {
  const window = resolveDefenseAudioLoopWindow({
    startMeasure: params.startMeasure,
    endMeasure: params.endMeasure,
    bpm: params.bpm,
    beatsPerBar: params.beatsPerBar,
    bufferDurationSec: params.bufferFrameLength / params.sampleRate,
  });
  const startFrame = Math.min(
    params.bufferFrameLength,
    Math.max(0, Math.floor(window.startSec * params.sampleRate)),
  );
  const endFrame = Math.min(
    params.bufferFrameLength,
    Math.max(startFrame, Math.ceil(window.endSec * params.sampleRate)),
  );
  return {
    startFrame,
    frameCount: Math.max(0, endFrame - startFrame),
  };
};
