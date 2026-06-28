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

const mockedFetch = vi.mocked(fetchEarTrainingStageById);

describe('earTrainingStageDetailCache', () => {
  beforeEach(() => {
    clearEarTrainingStageDetailCache();
    mockedFetch.mockReset();
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
});
