import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAudioFetchCacheForTests,
  fetchCachedFullAudioBuffer,
  getCachedAudioArrayBuffer,
} from '@/utils/audioFetchCache';
import { fetchFullAudioBuffer } from '@/utils/fetchFullAudioBuffer';

vi.mock('@/utils/fetchFullAudioBuffer', () => ({
  fetchFullAudioBuffer: vi.fn(),
}));

const mockedFetchFullAudioBuffer = vi.mocked(fetchFullAudioBuffer);

describe('audioFetchCache', () => {
  beforeEach(() => {
    clearAudioFetchCacheForTests();
    mockedFetchFullAudioBuffer.mockReset();
  });

  afterEach(() => {
    clearAudioFetchCacheForTests();
  });

  it('dedupes concurrent fetches for the same URL', async () => {
    const buffer = new ArrayBuffer(8);
    mockedFetchFullAudioBuffer.mockImplementation(async () => buffer);

    const [a, b] = await Promise.all([
      fetchCachedFullAudioBuffer('https://example.com/a.mp3'),
      fetchCachedFullAudioBuffer('https://example.com/a.mp3'),
    ]);

    expect(a).toBe(buffer);
    expect(b).toBe(buffer);
    expect(mockedFetchFullAudioBuffer).toHaveBeenCalledTimes(1);
  });

  it('reuses cached buffer without refetching', async () => {
    const buffer = new ArrayBuffer(4);
    mockedFetchFullAudioBuffer.mockResolvedValue(buffer);

    await fetchCachedFullAudioBuffer('https://example.com/b.mp3');
    await fetchCachedFullAudioBuffer('https://example.com/b.mp3');

    expect(mockedFetchFullAudioBuffer).toHaveBeenCalledTimes(1);
    expect(getCachedAudioArrayBuffer('https://example.com/b.mp3')).toBe(buffer);
  });
});
