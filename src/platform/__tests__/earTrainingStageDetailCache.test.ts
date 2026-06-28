import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearEarTrainingStageDetailCache,
  fetchEarTrainingStageDetailCached,
  preloadEarTrainingStageDetails,
} from '@/platform/earTrainingStageDetailCache';
import { fetchEarTrainingStageById } from '@/platform/supabaseEarTraining';
import type { EarTrainingStage } from '@/types';

vi.mock('@/platform/supabaseEarTraining', () => ({
  fetchEarTrainingStageById: vi.fn(),
}));

vi.mock('@/utils/prefetchEarTrainingLobbyAssets', () => ({
  prefetchEarTrainingLobbyAssetsFromStage: vi.fn(),
}));

const mockedFetch = vi.mocked(fetchEarTrainingStageById);
const { prefetchEarTrainingLobbyAssetsFromStage } = await import('@/utils/prefetchEarTrainingLobbyAssets');
const mockedPrefetchAssets = vi.mocked(prefetchEarTrainingLobbyAssetsFromStage);

describe('earTrainingStageDetailCache', () => {
  beforeEach(() => {
    clearEarTrainingStageDetailCache();
    mockedFetch.mockReset();
    mockedPrefetchAssets.mockReset();
  });

  it('preloads stage details in background', async () => {
    mockedFetch.mockResolvedValue({ id: 'stage-a' } as EarTrainingStage);

    preloadEarTrainingStageDetails(['stage-a']);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedFetch).toHaveBeenCalledWith('stage-a');
    await expect(fetchEarTrainingStageDetailCached('stage-a')).resolves.toMatchObject({ id: 'stage-a' });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates preload requests for the same stage', async () => {
    mockedFetch.mockResolvedValue({ id: 'stage-b' } as EarTrainingStage);

    preloadEarTrainingStageDetails(['stage-b', 'stage-b']);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('prefetches lobby assets after stage detail resolves', async () => {
    const stage = {
      id: 'stage-c',
      mode: 'chord_osmd',
      phrases: [{ audio_url: 'https://example.com/a.mp3', music_xml_url: 'https://example.com/a.xml' }],
    } as EarTrainingStage;
    mockedFetch.mockResolvedValue(stage);

    preloadEarTrainingStageDetails(['stage-c']);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedPrefetchAssets).toHaveBeenCalledWith(stage);
  });
});
