import {
  create,
  analyze,
  type Detector,
  type Frame,
  type PitchPleaseError,
} from '@markusstrasser/pitchplease';
import type { PolyPitchEngineId, PolyPitchFrame } from './polyPitchTypes';
import type { PolyPitchSessionRecorder } from './polyPitchSession';

export const PITCH_PLEASE_ASSET_BASE = '/vendor/pitchplease/';

const engineIdForModel = (model: 'fast' | 'piano'): PolyPitchEngineId =>
  model === 'piano' ? 'pitchplease-piano' : 'pitchplease-fast';

const frameToPoly = (model: 'fast' | 'piano', frame: Frame): PolyPitchFrame => ({
  engineId: engineIdForModel(model),
  contentTimeSec: frame.time,
  emitTimeSec: frame.emitTime,
  activeMidis: frame.notes.map((n) => n.midi),
});

export interface PitchPleaseLabHandle {
  detector: Detector;
  model: 'fast' | 'piano';
}

export const createPitchPleaseLab = (
  model: 'fast' | 'piano',
  recorder: PolyPitchSessionRecorder | null,
  onFrame?: (frame: PolyPitchFrame) => void,
  onDetectorFrame?: (frame: Frame) => void,
  onError?: (error: PitchPleaseError) => void,
): PitchPleaseLabHandle => {
  const detector = create({
    model,
    assetBaseUrl: PITCH_PLEASE_ASSET_BASE,
    onNotes: (_notes, frame) => {
      onDetectorFrame?.(frame);
      if (!recorder && !onFrame) return;
      const poly = frameToPoly(model, frame);
      recorder?.append(poly);
      onFrame?.(poly);
    },
    onError: (error) => {
      onError?.(error);
    },
  });
  return { detector, model };
};

export const startPitchPleaseOnStream = async (
  handle: PitchPleaseLabHandle,
  stream: MediaStream,
): Promise<boolean> => handle.detector.start(stream);

export const stopPitchPlease = (handle: PitchPleaseLabHandle): void => {
  handle.detector.stop();
};

export const pitchPleaseStats = (handle: PitchPleaseLabHandle): Detector['stats'] => handle.detector.stats;

export const analyzePitchPleaseFile = async (
  audio: AudioBuffer,
  model: 'fast' | 'piano',
): Promise<PolyPitchFrame[]> => {
  const frames = await analyze(audio, {
    model,
    assetBaseUrl: PITCH_PLEASE_ASSET_BASE,
  });
  return frames.map((f) => frameToPoly(model, f));
};

