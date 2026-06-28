import { fetchFullAudioBuffer } from '@/utils/fetchFullAudioBuffer';

const cachedBuffers = new Map<string, ArrayBuffer>();
const inFlight = new Map<string, Promise<ArrayBuffer>>();

export const getCachedAudioArrayBuffer = (url: string): ArrayBuffer | undefined => {
  const key = url.trim();
  if (key.length === 0) {
    return undefined;
  }
  return cachedBuffers.get(key);
};

export const fetchCachedFullAudioBuffer = async (url: string): Promise<ArrayBuffer> => {
  const key = url.trim();
  if (key.length === 0) {
    throw new Error('Audio URL is empty');
  }

  const cached = cachedBuffers.get(key);
  if (cached) {
    return cached;
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const promise = fetchFullAudioBuffer(key)
    .then((buffer) => {
      cachedBuffers.set(key, buffer);
      return buffer;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
};

export const clearAudioFetchCacheForTests = (): void => {
  cachedBuffers.clear();
  inFlight.clear();
};
