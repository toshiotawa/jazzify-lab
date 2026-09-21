import { describe, expect, it } from 'vitest';
import { resolveEarTrainingMusicXmlLoad } from '@/utils/resolveEarTrainingMusicXmlLoad';

const baseParams = {
  rawUrl: 'https://example.com/score.xml',
  cachedText: undefined,
  existingLoadedUrl: null,
  existingMusicXmlText: null,
};

describe('resolveEarTrainingMusicXmlLoad', () => {
  it('uses fetched xml when available', () => {
    expect(resolveEarTrainingMusicXmlLoad({
      ...baseParams,
      fetched: 'normalized-xml',
    })).toEqual({
      normalizedBase: 'normalized-xml',
      shouldShowFetchError: false,
      shouldUpdateLoadedUrl: true,
      keepExistingDisplay: false,
    });
  });

  it('falls back to cache when fetch fails', () => {
    expect(resolveEarTrainingMusicXmlLoad({
      ...baseParams,
      fetched: null,
      cachedText: 'cached-xml',
    })).toEqual({
      normalizedBase: 'cached-xml',
      shouldShowFetchError: false,
      shouldUpdateLoadedUrl: true,
      keepExistingDisplay: false,
    });
  });

  it('keeps existing display for the same url when fetch and cache miss', () => {
    expect(resolveEarTrainingMusicXmlLoad({
      ...baseParams,
      fetched: null,
      existingLoadedUrl: 'https://example.com/score.xml',
      existingMusicXmlText: '<score-partwise></score-partwise>',
    })).toEqual({
      normalizedBase: null,
      shouldShowFetchError: false,
      shouldUpdateLoadedUrl: false,
      keepExistingDisplay: true,
    });
  });

  it('shows fetch error when nothing is available', () => {
    expect(resolveEarTrainingMusicXmlLoad({
      ...baseParams,
      fetched: null,
    })).toEqual({
      normalizedBase: null,
      shouldShowFetchError: true,
      shouldUpdateLoadedUrl: false,
      keepExistingDisplay: false,
    });
  });
});
