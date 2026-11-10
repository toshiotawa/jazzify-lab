const microphoneConstraints = (
  deviceId?: string,
  echoCancellation = true,
  inputChannel: 1 | 2 = 1,
): MediaTrackConstraints => {
  const base: MediaTrackConstraints = {
    deviceId: deviceId ? { exact: deviceId } : undefined,
    echoCancellation,
    noiseSuppression: false,
    autoGainControl: false,
  };
  if (inputChannel === 2) {
    return { ...base, channelCount: { exact: 2 } };
  }
  return base;
};

export const isVoiceMicrophoneSupported = (): boolean =>
  typeof navigator !== 'undefined'
  && typeof window !== 'undefined'
  && Boolean(navigator.mediaDevices?.getUserMedia)
  && typeof AudioWorkletNode !== 'undefined';

export const voiceMicrophoneConstraints = microphoneConstraints;
