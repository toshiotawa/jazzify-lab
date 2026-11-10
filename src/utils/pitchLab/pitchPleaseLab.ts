import {
  create,
  type Detector,
  type Frame,
  type PitchPleaseError,
} from '@markusstrasser/pitchplease';

export const PITCH_PLEASE_ASSET_BASE = '/vendor/pitchplease/';

export interface PitchPleaseLabHandle {
  detector: Detector;
  model: 'fast' | 'piano';
}

export const createPitchPleaseLab = (
  model: 'fast' | 'piano',
  _recorder: null,
  _onFrame: undefined,
  onDetectorFrame: ((frame: Frame) => void) | undefined,
  onError?: (error: PitchPleaseError) => void,
): PitchPleaseLabHandle => {
  const detector = create({
    model,
    assetBaseUrl: PITCH_PLEASE_ASSET_BASE,
    onNotes: (_notes, frame) => {
      onDetectorFrame?.(frame);
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
