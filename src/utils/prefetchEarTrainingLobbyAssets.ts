import { toCdnProxyUrl } from '@/utils/cdnProxy';
import { normalizeChordOsmdMusicXml } from '@/utils/earTrainingChordOsmd';
import { fetchFullAudioBuffer } from '@/utils/fetchFullAudioBuffer';
import type { EarTrainingStage } from '@/types';

const warmedAudioUrls = new Set<string>();
const audioInFlight = new Map<string, Promise<ArrayBuffer>>();

const musicXmlCache = new Map<string, string>();
const musicXmlInFlight = new Map<string, Promise<string | null>>();

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

export const prefetchEarTrainingPhraseAudio = (rawUrl: string): void => {
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return;
  }
  const proxyUrl = toCdnProxyUrl(trimmed);
  if (warmedAudioUrls.has(proxyUrl) || audioInFlight.has(proxyUrl)) {
    return;
  }
  const promise = fetchFullAudioBuffer(proxyUrl)
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
  const firstPhrase = stage.phrases?.[0];
  if (!firstPhrase) {
    return;
  }
  prefetchEarTrainingPhraseAudio(firstPhrase.audio_url);
  if (stage.mode === 'chord_osmd' && firstPhrase.music_xml_url) {
    prefetchEarTrainingMusicXml(firstPhrase.music_xml_url);
  }
};

export const clearEarTrainingLobbyAssetCacheForTests = (): void => {
  warmedAudioUrls.clear();
  audioInFlight.clear();
  musicXmlCache.clear();
  musicXmlInFlight.clear();
};
