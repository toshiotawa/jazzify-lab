import { toCdnProxyUrl } from '@/utils/cdnProxy';
import { normalizeChordOsmdMusicXml } from '@/utils/earTrainingChordOsmd';
import { fetchCachedFullAudioBuffer } from '@/utils/audioFetchCache';
import type { EarTrainingStage } from '@/types';

const warmedAudioUrls = new Set<string>();
const audioInFlight = new Map<string, Promise<ArrayBuffer>>();

const musicXmlCache = new Map<string, string>();
const musicXmlInFlight = new Map<string, Promise<string | null>>();
const midiCache = new Map<string, Uint8Array>();
const midiInFlight = new Map<string, Promise<Uint8Array | null>>();

export const getCachedEarTrainingMusicXml = (rawUrl: string): string | undefined => {
  const key = rawUrl.trim();
  if (key.length === 0) {
    return undefined;
  }
  return musicXmlCache.get(key);
};

export const storeEarTrainingMusicXml = (rawUrl: string, normalizedText: string): void => {
  const key = rawUrl.trim();
  if (key.length === 0) {
    return;
  }
  musicXmlCache.set(key, normalizedText);
};

export const getCachedEarTrainingMidi = (rawUrl: string): Uint8Array | undefined => {
  const key = rawUrl.trim();
  if (key.length === 0) {
    return undefined;
  }
  return midiCache.get(key);
};

export const storeEarTrainingMidi = (rawUrl: string, data: Uint8Array): void => {
  const key = rawUrl.trim();
  if (key.length === 0) {
    return;
  }
  midiCache.set(key, data);
};

export const fetchEarTrainingMidi = async (rawUrl: string): Promise<Uint8Array | null> => {
  const key = rawUrl.trim();
  if (key.length === 0) {
    return null;
  }
  const cached = midiCache.get(key);
  if (cached) {
    return cached;
  }
  const inFlight = midiInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }
  const promise = (async (): Promise<Uint8Array | null> => {
    const response = await fetch(toCdnProxyUrl(key));
    if (!response.ok) {
      return null;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      return null;
    }
    const data = new Uint8Array(buffer);
    midiCache.set(key, data);
    return data;
  })()
    .catch(() => null)
    .finally(() => {
      midiInFlight.delete(key);
    });
  midiInFlight.set(key, promise);
  return promise;
};

export const prefetchEarTrainingMidi = (rawUrl: string): void => {
  const key = rawUrl.trim();
  if (key.length === 0 || midiCache.has(key) || midiInFlight.has(key)) {
    return;
  }
  void fetchEarTrainingMidi(key);
};

export const prefetchEarTrainingPhraseAudio = (rawUrl: string): void => {
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return;
  }
  const proxyUrl = toCdnProxyUrl(trimmed);
  if (warmedAudioUrls.has(proxyUrl) || audioInFlight.has(proxyUrl)) {
    return;
  }
  const promise = fetchCachedFullAudioBuffer(proxyUrl)
    .then((buffer) => {
      warmedAudioUrls.add(proxyUrl);
      return buffer;
    })
    .catch(() => {
      warmedAudioUrls.delete(proxyUrl);
      return new ArrayBuffer(0);
    })
    .finally(() => {
      audioInFlight.delete(proxyUrl);
    });
  audioInFlight.set(proxyUrl, promise);
};

export const prefetchEarTrainingMusicXml = (rawUrl: string): void => {
  const key = rawUrl.trim();
  if (key.length === 0 || musicXmlCache.has(key) || musicXmlInFlight.has(key)) {
    return;
  }
  const promise = (async (): Promise<string | null> => {
    const response = await fetch(toCdnProxyUrl(key));
    if (!response.ok) {
      return null;
    }
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    const normalized = normalizeChordOsmdMusicXml(text);
    musicXmlCache.set(key, normalized);
    return normalized;
  })()
    .catch(() => null)
    .finally(() => {
      musicXmlInFlight.delete(key);
    });
  musicXmlInFlight.set(key, promise);
};

export const prefetchEarTrainingLobbyAssetsFromStage = (stage: EarTrainingStage): void => {
  const phrases = stage.phrases ?? [];
  if (phrases.length === 0) {
    return;
  }

  phrases.forEach((phrase) => {
    prefetchEarTrainingPhraseAudio(phrase.audio_url);
  });

  if (stage.mode === 'chord_osmd' || stage.mode === 'chord_precision') {
    phrases.forEach((phrase) => {
      if (phrase.music_xml_url) {
        prefetchEarTrainingMusicXml(phrase.music_xml_url);
      }
      if (phrase.midi_url) {
        prefetchEarTrainingMidi(phrase.midi_url);
      }
    });
  }
};

export const clearEarTrainingLobbyAssetCacheForTests = (): void => {
  warmedAudioUrls.clear();
  audioInFlight.clear();
  musicXmlCache.clear();
  musicXmlInFlight.clear();
  midiCache.clear();
  midiInFlight.clear();
};
