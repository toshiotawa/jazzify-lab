import type { SurvivalScenarioStaffMode } from '@/components/survival/scenario/survivalScenarioTypes';

export interface ResolveBalloonRushDedicatedStaffVisibleParams {
  readonly hideStaff: boolean;
  readonly staffMode: SurvivalScenarioStaffMode;
  readonly hasProgressionStaff: boolean;
  readonly hasRandomStaff: boolean;
}

export const resolveBalloonRushDedicatedStaffVisible = (
  params: ResolveBalloonRushDedicatedStaffVisibleParams,
): boolean => {
  if (params.hideStaff) {
    return false;
  }
  if (params.staffMode === 'progression') {
    return params.hasProgressionStaff;
  }
  if (params.staffMode === 'random-staff') {
    return params.hasRandomStaff;
  }
  return false;
};

const SCENARIO_PUNCH_STAFF_SUPPRESSED_MODES: readonly SurvivalScenarioStaffMode[] = [
  'phrase',
  'progression',
  'demo-timeline',
  'hidden',
  'random-staff',
];

export interface ShouldRenderSurvivalPunchStaffOverlayParams {
  readonly isBalloonRushMode: boolean;
  readonly isPhraseMode: boolean;
  readonly voicingNameCount: number;
  readonly scenarioMode: boolean;
  readonly scenarioActive: boolean;
  readonly hideStaff: boolean;
  readonly staffMode: SurvivalScenarioStaffMode;
}

export const shouldRenderSurvivalPunchStaffOverlay = (
  params: ShouldRenderSurvivalPunchStaffOverlayParams,
): boolean => {
  if (params.isBalloonRushMode || params.isPhraseMode) {
    return false;
  }
  if (params.voicingNameCount <= 0) {
    return false;
  }
  if (
    params.scenarioMode
    && params.scenarioActive
    && (params.hideStaff || SCENARIO_PUNCH_STAFF_SUPPRESSED_MODES.includes(params.staffMode))
  ) {
    return false;
  }
  return true;
};

export const shouldBuildSurvivalPunchStaffSnapshot = (
  params: Omit<ShouldRenderSurvivalPunchStaffOverlayParams, 'voicingNameCount'>,
): boolean => shouldRenderSurvivalPunchStaffOverlay({ ...params, voicingNameCount: 1 });
