import { getLandingCopy } from '@/components/landing/landingCopy';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';

describe('landing roadmap free tier alignment', () => {
  const jaSteps = getLandingCopy(false).roadmap.steps;
  const enSteps = getLandingCopy(true).roadmap.steps;

  it('JA and EN roadmap steps share the same block numbers', () => {
    expect(jaSteps.map((step) => step.blockNumber)).toEqual(
      enSteps.map((step) => step.blockNumber),
    );
  });

  it('marks exactly one main-quest chapter as free-playable for non-premium users', () => {
    const mainQuestSteps = jaSteps.filter((step) => step.blockNumber !== null);

    const freeSteps = mainQuestSteps.filter((step) =>
      isMainQuestBlockPlayable(step.blockNumber ?? 1, false),
    );

    expect(freeSteps).toHaveLength(1);
    expect(freeSteps[0]?.blockNumber).toBe(1);
  });

  it('derives free badge eligibility from isMainQuestBlockPlayable for each numbered step', () => {
    for (const step of jaSteps) {
      if (step.blockNumber === null) {
        expect(isMainQuestBlockPlayable(1, false)).toBeDefined();
        continue;
      }

      const shouldShowFreeBadge = isMainQuestBlockPlayable(step.blockNumber, false);
      if (step.blockNumber === 1) {
        expect(shouldShowFreeBadge).toBe(true);
      } else {
        expect(shouldShowFreeBadge).toBe(false);
      }
    }
  });

  it('lists chapters 1 through 5 in order before the beyond step', () => {
    const numberedSteps = jaSteps
      .filter((step): step is typeof step & { blockNumber: number } => step.blockNumber !== null)
      .map((step) => step.blockNumber);

    expect(numberedSteps).toEqual([1, 2, 3, 4, 5]);
    expect(jaSteps.at(-1)?.blockNumber).toBeNull();
  });
});
