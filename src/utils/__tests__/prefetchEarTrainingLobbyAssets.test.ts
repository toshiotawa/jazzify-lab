import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearEarTrainingLobbyAssetCacheForTests,
  getCachedEarTrainingMusicXml,
  prefetchEarTrainingMusicXml,
  prefetchEarTrainingPhraseAudio,
  storeEarTrainingMusicXml,
} from '@/utils/prefetchEarTrainingLobbyAssets';

vi.mock('@/utils/fetchFullAudioBuffer', () => ({
  fetchFullAudioBuffer: vi.fn(),
}));

vi.mock('@/utils/earTrainingChordOsmd', () => ({
  normalizeChordOsmdMusicXml: vi.fn((text: string) => text.trim()),
}));

const { fetchFullAudioBuffer } = await import('@/utils/fetchFullAudioBuffer');
const mockedFetchAudio = vi.mocked(fetchFullAudioBuffer);

describe('prefetchEarTrainingLobbyAssets', () => {
  beforeEach(() => {
    clearEarTrainingLobbyAssetCacheForTests();
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
