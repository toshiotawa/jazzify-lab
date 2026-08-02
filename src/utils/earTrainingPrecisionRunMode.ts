export type PrecisionRunMode = 'performance' | 'practice' | 'loopPractice';

export const precisionRunModeFromPracticeParam = (practiceParam: string | null): PrecisionRunMode => {
  if (practiceParam === 'loop') {
    return 'loopPractice';
  }
  if (practiceParam === '1') {
    return 'practice';
  }
  return 'performance';
};

export const isPrecisionPracticeRunMode = (runMode: PrecisionRunMode): boolean =>
  runMode !== 'performance';

export const isPrecisionLoopPracticeRunMode = (runMode: PrecisionRunMode): boolean =>
  runMode === 'loopPractice';
