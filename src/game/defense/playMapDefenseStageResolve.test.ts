import {
  resolvePlayMapDefenseDifficultyLevelFromCallResponse,
  resolvePlayMapDefenseStageId,
} from '@/game/defense/playMapDefenseStageResolve';

describe('resolvePlayMapDefenseStageId', () => {
  it('prefers call-response stage when enabled', () => {
    expect(
      resolvePlayMapDefenseStageId('legacy', 'cr-stage', true),
    ).toBe('cr-stage');
  });

  it('falls back to legacy when call-response id is empty', () => {
    expect(resolvePlayMapDefenseStageId('legacy', null, true)).toBe('legacy');
    expect(resolvePlayMapDefenseStageId('legacy', '   ', true)).toBe('legacy');
  });

  it('uses legacy when call-response is disabled', () => {
    expect(resolvePlayMapDefenseStageId('legacy', 'cr-stage', false)).toBe('legacy');
  });
});

describe('resolvePlayMapDefenseDifficultyLevelFromCallResponse', () => {
  it('prefers call-response difficulty when enabled', () => {
    expect(
      resolvePlayMapDefenseDifficultyLevelFromCallResponse(7, 5, true),
    ).toBe(5);
  });

  it('falls back to legacy when call-response level is invalid', () => {
    expect(
      resolvePlayMapDefenseDifficultyLevelFromCallResponse(7, null, true),
    ).toBe(7);
    expect(
      resolvePlayMapDefenseDifficultyLevelFromCallResponse(7, 0, true),
    ).toBe(7);
  });

  it('uses legacy when call-response is disabled', () => {
    expect(
      resolvePlayMapDefenseDifficultyLevelFromCallResponse(7, 5, false),
    ).toBe(7);
  });
});