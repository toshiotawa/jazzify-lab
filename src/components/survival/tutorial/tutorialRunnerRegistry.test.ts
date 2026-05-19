import { describe, expect, it } from 'vitest';

import {
  resolveSurvivalBuiltinTutorialRunner,
  SURVIVAL_BUILTIN_TUTORIAL_RUNNERS,
} from '@/components/survival/tutorial/tutorialRunnerRegistry';

describe('tutorialRunnerRegistry', () => {
  it('resolves onboarding-v1 builtin runner', () => {
    expect(SURVIVAL_BUILTIN_TUTORIAL_RUNNERS['onboarding-v1']).toBeTypeOf('function');
    expect(resolveSurvivalBuiltinTutorialRunner('onboarding-v1')).toBe(
      SURVIVAL_BUILTIN_TUTORIAL_RUNNERS['onboarding-v1'],
    );
  });

  it('returns undefined for unknown runner keys', () => {
    expect(resolveSurvivalBuiltinTutorialRunner('does-not-exist')).toBeUndefined();
  });
});
