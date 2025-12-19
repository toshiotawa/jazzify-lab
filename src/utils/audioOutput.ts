import { log } from '@/utils/logger';

type AudioContextWithSinkId = AudioContext & {
  setSinkId: (sinkId: string) => Promise<void>;
};

const hasAudioContextSetSinkId = (context: AudioContext): context is AudioContextWithSinkId => {
  return (
    typeof (context as unknown as { setSinkId?: unknown }).setSinkId === 'function'
  );
};

export const applyAudioOutputDevice = async (
  context: AudioContext,
  deviceId: string | null
): Promise<boolean> => {
  if (!deviceId) {
    // 未設定の場合は何もしない（システム既定のまま）
    return true;
  }
  if (!hasAudioContextSetSinkId(context)) {
    return false;
  }
  try {
    await context.setSinkId(deviceId);
    return true;
  } catch (error) {
    log.warn('AudioContext setSinkId failed:', error);
    return false;
  }
};

