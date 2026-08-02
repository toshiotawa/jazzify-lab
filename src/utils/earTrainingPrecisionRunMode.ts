export type PrecisionRunMode = 'performance' | 'practice';

export const precisionRunModeFromPracticeParam = (practiceParam: string | null): PrecisionRunMode => {
  if (practiceParam === 'loop' || practiceParam === '1') {
    return 'practice';
  }
  return 'performance';
};

export const isPrecisionPracticeRunMode = (runMode: PrecisionRunMode): boolean =>
  runMode !== 'performance';
