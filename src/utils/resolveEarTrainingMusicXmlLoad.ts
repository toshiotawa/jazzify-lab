export interface ResolveEarTrainingMusicXmlLoadParams {
  rawUrl: string;
  fetched: string | null;
  cachedText: string | undefined;
  existingLoadedUrl: string | null;
  existingMusicXmlText: string | null;
}

export interface ResolveEarTrainingMusicXmlLoadResult {
  normalizedBase: string | null;
  shouldShowFetchError: boolean;
  shouldUpdateLoadedUrl: boolean;
  keepExistingDisplay: boolean;
}

export const resolveEarTrainingMusicXmlLoad = (
  params: ResolveEarTrainingMusicXmlLoadParams,
): ResolveEarTrainingMusicXmlLoadResult => {
  if (params.fetched) {
    return {
      normalizedBase: params.fetched,
      shouldShowFetchError: false,
      shouldUpdateLoadedUrl: true,
      keepExistingDisplay: false,
    };
  }
  if (params.cachedText) {
    return {
      normalizedBase: params.cachedText,
      shouldShowFetchError: false,
      shouldUpdateLoadedUrl: true,
      keepExistingDisplay: false,
    };
  }
  if (
    params.existingLoadedUrl === params.rawUrl
    && params.existingMusicXmlText
  ) {
    return {
      normalizedBase: null,
      shouldShowFetchError: false,
      shouldUpdateLoadedUrl: false,
      keepExistingDisplay: true,
    };
  }
  return {
    normalizedBase: null,
    shouldShowFetchError: true,
    shouldUpdateLoadedUrl: false,
    keepExistingDisplay: false,
  };
};
