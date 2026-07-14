export const hasNonEmptyEnglishField = (value: string | null | undefined): boolean =>
  (value?.trim().length ?? 0) > 0;
