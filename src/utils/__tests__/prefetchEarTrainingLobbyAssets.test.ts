import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearEarTrainingLobbyAssetCacheForTests,
  getCachedEarTrainingMusicXml,
  prefetchEarTrainingMusicXml,
  prefetchEarTrainingPhraseAudio,
  storeEarTrainingMusicXml,
} from '@/utils/prefetchEarTrainingLobbyAssets';
import { clearAudioFetchCacheForTests } from '@/utils/audioFetchCache';

vi.mock('@/utils/audioFetchCache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/audioFetchCache')>();
  return {
    ...actual,
    fetchCachedFullAudioBuffer: vi.fn(),
  };
});

vi.mock('@/utils/earTrainingChordOsmd', () => ({
  normalizeChordOsmdMusicXml: vi.fn((text: string) => text.trim()),
}));

const { fetchCachedFullAudioBuffer } = await import('@/utils/audioFetchCache');
const mockedFetchAudio = vi.mocked(fetchCachedFullAudioBuffer);

describe('prefetchEarTrainingLobbyAssets', () => {
  beforeEach(() => {
    clearEarTrainingLobbyAssetCacheForTests();
    clearAudioFetchCacheForTests();
    mockedFetchAudio.mockReset();
    mockedFetchAudio.mockResolvedValue(new ArrayBuffer(8));
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ignores empty audio and music xml urls', () => {
    prefetchEarTrainingPhraseAudio('   ');
    prefetchEarTrainingMusicXml('');

    expect(mockedFetchAudio).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('deduplicates music xml prefetch requests', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '<score-partwise></score-partwise>',
    } as Response);

    prefetchEarTrainingMusicXml('https://example.com/score.xml');
    prefetchEarTrainingMusicXml('https://example.com/score.xml');

    await Promise.resolve();
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getCachedEarTrainingMusicXml('https://example.com/score.xml')).toBe(
      '<score-partwise></score-partwise>',
    );
  });

  it('stores normalized music xml for reuse', () => {
    storeEarTrainingMusicXml('https://example.com/score.xml', 'normalized-xml');

    expect(getCachedEarTrainingMusicXml('https://example.com/score.xml')).toBe('normalized-xml');
  });

  it('deduplicates phrase audio prefetch requests', () => {
    prefetchEarTrainingPhraseAudio('https://example.com/phrase.mp3');
    prefetchEarTrainingPhraseAudio('https://example.com/phrase.mp3');

    expect(mockedFetchAudio).toHaveBeenCalledTimes(1);
  });
});
