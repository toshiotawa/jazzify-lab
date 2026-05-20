import { describe, expect, it } from 'vitest';

import { runSurvivalTutorialQuestions } from '../survivalTutorialQuestionFlow';

describe('runSurvivalTutorialQuestions', () => {
  it('abort 時は false を返す', async () => {
    const signal = AbortSignal.abort();
    await expect(
      runSurvivalTutorialQuestions({
        totalQuestions: 3,
        signal,
        sleepSeconds: async () => Promise.resolve(undefined),
        callbacks: {
          onIntro: () => undefined,
          onRevealFight: () => undefined,
        },
        waitForChordCompletion: async () => true,
        emitSpecialGaugeSkill: () => undefined,
        waitIntroAdvance: async () => undefined,
      }),
    ).resolves.toBe(false);
  });

  it('全問終了まで進むと true', async () => {
    let slotPulse = 0;
    let introCount = 0;
    let revealCount = 0;

    await expect(
      runSurvivalTutorialQuestions({
        totalQuestions: 2,
        signal: new AbortController().signal,
        sleepSeconds: async () => Promise.resolve(undefined),
        callbacks: {
          onIntro: () => {
            introCount += 1;
          },
          onRevealFight: () => {
            revealCount += 1;
          },
        },
        waitForChordCompletion: async (_t) => {
          slotPulse += 1;
          return true;
        },
        emitSpecialGaugeSkill: () => undefined,
        waitIntroAdvance: async () => undefined,
      }),
    ).resolves.toBe(true);

    expect(introCount).toBe(2);
    expect(revealCount).toBe(2);
    expect(slotPulse).toBe(2);
  });
});
