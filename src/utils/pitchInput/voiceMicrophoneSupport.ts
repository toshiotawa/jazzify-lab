const microphoneConstraints = (
  deviceId?: string,
  echoCancellation = true,
  inputChannel: 1 | 2 = 1,
): MediaTrackConstraints => ({
  deviceId: deviceId ? { exact: deviceId } : undefined,
  channelCount: inputChannel === 2 ? { exact: 2 } : { ideal: 2 },
  echoCancellation,
  noiseSuppression: false,
  autoGainControl: false,
});

export const isVoiceMicrophoneSupported = (): boolean =>
  typeof navigator !== 'undefined'
  && typeof window !== 'undefined'
  && Boolean(navigator.mediaDevices?.getUserMedia)
  && typeof AudioWorkletNode !== 'undefined';

export const voiceMicrophoneConstraints = microphoneConstraints;
