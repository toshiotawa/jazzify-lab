import {
  resolveBalloonRushDedicatedStaffVisible,
  shouldBuildSurvivalPunchStaffSnapshot,
  shouldRenderSurvivalPunchStaffOverlay,
} from '@/utils/balloonRushStaffVisibility';

describe('resolveBalloonRushDedicatedStaffVisible', () => {
  it('progression staffMode では progression 譜面があるときのみ可視', () => {
    expect(
      resolveBalloonRushDedicatedStaffVisible({
        hideStaff: false,
        staffMode: 'progression',
        hasProgressionStaff: true,
        hasRandomStaff: false,
      }),
    ).toBe(true);
    expect(
      resolveBalloonRushDedicatedStaffVisible({
        hideStaff: false,
        staffMode: 'progression',
        hasProgressionStaff: false,
        hasRandomStaff: true,
      }),
    ).toBe(false);
  });

  it('random-staff staffMode では random 譜面があるときのみ可視', () => {
    expect(
      resolveBalloonRushDedicatedStaffVisible({
        hideStaff: false,
        staffMode: 'random-staff',
        hasProgressionStaff: false,
        hasRandomStaff: true,
      }),
    ).toBe(true);
    expect(
      resolveBalloonRushDedicatedStaffVisible({
        hideStaff: false,
        staffMode: 'random-staff',
        hasProgressionStaff: true,
        hasRandomStaff: false,
      }),
    ).toBe(false);
  });

  it('hidden staffMode では常に非可視', () => {
    expect(
      resolveBalloonRushDedicatedStaffVisible({
        hideStaff: false,
        staffMode: 'hidden',
        hasProgressionStaff: true,
        hasRandomStaff: true,
      }),
    ).toBe(false);
  });

  it('hideStaff が true なら staffMode に関わらず非可視', () => {
    expect(
      resolveBalloonRushDedicatedStaffVisible({
        hideStaff: true,
        staffMode: 'progression',
        hasProgressionStaff: true,
        hasRandomStaff: true,
      }),
    ).toBe(false);
  });
});

describe('shouldRenderSurvivalPunchStaffOverlay', () => {
  const baseParams = {
    isBalloonRushMode: false,
    isPhraseMode: false,
    voicingNameCount: 4,
    scenarioMode: false,
    scenarioActive: false,
    hideStaff: false,
    staffMode: 'hidden' as const,
  };

  it('風船ラッシュ中は punch staff を描画しない', () => {
    expect(
      shouldRenderSurvivalPunchStaffOverlay({
        ...baseParams,
        isBalloonRushMode: true,
        staffMode: 'random-staff',
      }),
    ).toBe(false);
  });

  it('通常サバイバルでは punch staff を描画できる', () => {
    expect(shouldRenderSurvivalPunchStaffOverlay(baseParams)).toBe(true);
  });

  it('scenario random-staff では punch staff を抑止する', () => {
    expect(
      shouldRenderSurvivalPunchStaffOverlay({
        ...baseParams,
        scenarioMode: true,
        scenarioActive: true,
        staffMode: 'random-staff',
      }),
    ).toBe(false);
  });

  it('voicingNameCount が 0 なら描画しない', () => {
    expect(
      shouldRenderSurvivalPunchStaffOverlay({
        ...baseParams,
        voicingNameCount: 0,
      }),
    ).toBe(false);
  });
});

describe('shouldBuildSurvivalPunchStaffSnapshot', () => {
  it('風船ラッシュ中は snapshot を構築しない', () => {
    expect(
      shouldBuildSurvivalPunchStaffSnapshot({
        isBalloonRushMode: true,
        isPhraseMode: false,
        scenarioMode: true,
        scenarioActive: true,
        hideStaff: false,
        staffMode: 'random-staff',
      }),
    ).toBe(false);
  });
});
