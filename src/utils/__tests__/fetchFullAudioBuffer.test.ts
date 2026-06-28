import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFullAudioBuffer } from '@/utils/fetchFullAudioBuffer';

describe('fetchFullAudioBuffer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns arrayBuffer on 200 response', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes,
    }));

    const result = await fetchFullAudioBuffer('https://example.com/test.mp3');
    expect(result).toBe(bytes);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries without cache when first response is 206', async () => {
    const bytes = new Uint8Array([9, 8, 7]).buffer;
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 206,
        arrayBuffer: async () => new Uint8Array([1]).buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => bytes,
      }));

    const result = await fetchFullAudioBuffer('https://example.com/partial.mp3');
    expect(result).toBe(bytes);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://example.com/partial.mp3', {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
  });
});
