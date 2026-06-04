import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import type { SurvivalScenarioOverrides } from '@/components/survival/scenario/survivalScenarioTypes';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type { ResolvedSurvivalLessonRuntime } from '@/utils/survivalLessonConfig';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import { resolveBalloonRushAllowedChordIds } from '@/utils/balloonRushStageDefinitions';
import { BALLOON_RUSH_DRUM_LOOP_BGM_URL } from '@/utils/balloonRushMap';

const BALLOON_RUSH_SCENARIO_OVERRIDES_BASE: SurvivalScenarioOverrides = {
  isActive: true,
  hideHud: false,
  hideStageTitle: false,
  hideHintBadge: true,
  hidePauseButton: false,
  hideKillCounter: true,
  hideTimerDisplay: true,
  hideStatusStrip: true,
  hidePlayerHpBar: true,
  hideStaff: false,
  hideChordSlots: true,
  hideChordPad: false,
  hideComboBadge: true,
  scenarioStaffClef: 2,
  hideStaffOnBSlotCompletion: false,
  useChordMidiNotesForHintHighlights: false,
  staffMode: 'hidden',
  disableJoystick: false,
  disableTimeLimitClear: false,
  disableKillQuotaClear: false,
  disableResultScreen: false,
  playerInvincible: true,
  freezeAllEnemyAi: true,
  disableEnemyAttacks: true,
  blockChordPadInput: false,
  blockMidiGameInput: false,
  blockSlotEvaluation: false,
  disableSurvivalBgm: false,
  suppressAutoSpawn: true,
  bChordCompletionAttackSlot: null,
  bChordCompletionUseSpecial: false,
};

export const balloonRushScenarioOverrides = (
  stage: BalloonRushResolvedStage,
  hintMode = false,
): SurvivalScenarioOverrides => ({
  ...BALLOON_RUSH_SCENARIO_OVERRIDES_BASE,
  staffMode: stage.stageType === 'progression' ? 'progression' : 'hidden',
  useChordMidiNotesForHintHighlights: stage.stageType === 'progression',
  scenarioStaffClef: stage.stageType === 'progression' ? 2 : 1,
  hideHintBadge: !hintMode,
});

export const balloonRushToStageDefinition = (stage: BalloonRushResolvedStage): StageDefinition => {
  const allowed = [...resolveBalloonRushAllowedChordIds(stage)];
  const progression =
    stage.stageType === 'progression' && stage.chordProgression?.length
      ? [...stage.chordProgression]
      : undefined;
  return {
    stageNumber: 9902,
    name: stage.title || stage.slug,
    nameEn: stage.titleEn || stage.slug,
    difficulty: 'easy',
    stageType: stage.stageType,
    playMode: 'survival',
    chordSuffix: stage.chordSuffix,
    chordDisplayName: stage.chordSuffix,
    chordDisplayNameEn: stage.chordSuffix,
    rootPattern: stage.rootPattern,
    rootPatternName: '',
    rootPatternNameEn: '',
    allowedChords: allowed.length > 0 ? allowed : ['Dm7'],
    blockKey: 'balloon_rush',
    mapCategory: 'lesson',
    lessonOnly: true,
    chordProgression: progression,
    productionStaffHintMode: stage.productionStaffHintMode,
    productionKeyboardHintMode: stage.productionKeyboardHintMode,
  };
};

export const balloonRushLessonRuntime = (stage: BalloonRushResolvedStage): ResolvedSurvivalLessonRuntime => ({
  bossMaxHp: 1,
  playerMaxHp: 9999,
  bgmUrl: stage.bgmUrl?.trim() || BALLOON_RUSH_DRUM_LOOP_BGM_URL,
  timeLimitSec: stage.timeLimitSec,
  killQuota: stage.popQuota,
  enemyStatMultiplier: 1,
  playerStatMultiplier: 1,
  compositeDamage: {
    note: 0,
    measureRange: 0,
    finishPrimary: 0,
    finishRepeat: 0,
  },
});

export const balloonRushDifficultyConfig = (stage: BalloonRushResolvedStage): DifficultyConfig => {
  const allowed = [...resolveBalloonRushAllowedChordIds(stage)];
  return {
    difficulty: 'easy',
    displayName: stage.slug,
    description: '',
    allowedChords: allowed.length > 0 ? allowed : ['Dm7'],
    enemySpawnRate: 999,
    enemySpawnCount: 0,
    enemyStatMultiplier: 1,
    expMultiplier: 1,
    itemDropRate: 0,
    bgmUrl: stage.bgmUrl?.trim() || BALLOON_RUSH_DRUM_LOOP_BGM_URL,
  };
};

/** iOS `SurvivalStageCenterStaffOverlay.frame(maxHeight:)` と揃える */
export const BALLOON_RUSH_COMPACT_STAFF_BAND_HEIGHT_PX = 160;
export const BALLOON_RUSH_PROGRESSION_STAFF_BAND_HEIGHT_PX = 220;
export const BALLOON_RUSH_STATUS_GAP_BELOW_STAFF_PX = 8;
/** Web `survivalStaffOverlayTopPadding` の HUD 帯（safe-area 除く） */
export const BALLOON_RUSH_STATUS_HUD_BAND_PX = 52;

export const resolveBalloonRushStaffBandHeightPx = (
  staffVisible: boolean,
  isProgressionStage: boolean,
): number => {
  if (!staffVisible) return 0;
  return isProgressionStage
    ? BALLOON_RUSH_PROGRESSION_STAFF_BAND_HEIGHT_PX
    : BALLOON_RUSH_COMPACT_STAFF_BAND_HEIGHT_PX;
};

export const resolveBalloonRushStatusOverlayTopStyle = (
  staffBandHeightPx: number,
): { paddingTop: string } => ({
  paddingTop: `calc(max(4px, env(safe-area-inset-top)) + ${BALLOON_RUSH_STATUS_HUD_BAND_PX}px + ${staffBandHeightPx + BALLOON_RUSH_STATUS_GAP_BELOW_STAFF_PX}px)`,
});
