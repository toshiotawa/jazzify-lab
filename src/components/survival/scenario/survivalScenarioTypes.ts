/** チュートリアル / シナリオ用。iOS SurvivalScenarioOverrides と同等。 */

export type SurvivalScenarioStaffMode = 'hidden' | 'progression' | 'phrase';

export interface SurvivalScenarioOverrides {
  isActive: boolean;
  hideHud: boolean;
  hideStageTitle: boolean;
  hideHintBadge: boolean;
  hidePauseButton: boolean;
  hideKillCounter: boolean;
  hideTimerDisplay: boolean;
  hideStatusStrip: boolean;
  hidePlayerHpBar: boolean;
  hideStaff: boolean;
  hideChordSlots: boolean;
  hideChordPad: boolean;
  hideComboBadge: boolean;
  scenarioStaffClef: 1 | 2;
  hideStaffOnBSlotCompletion: boolean;
  useChordMidiNotesForHintHighlights: boolean;
  staffMode: SurvivalScenarioStaffMode;
  disableJoystick: boolean;
  disableTimeLimitClear: boolean;
  disableKillQuotaClear: boolean;
  disableResultScreen: boolean;
  playerInvincible: boolean;
  freezeAllEnemyAi: boolean;
  disableEnemyAttacks: boolean;
  blockChordPadInput: boolean;
  blockMidiGameInput: boolean;
  blockSlotEvaluation: boolean;
  disableSurvivalBgm: boolean;
  suppressAutoSpawn: boolean;
  bChordCompletionAttackSlot: 'A' | 'B' | null;
  bChordCompletionUseSpecial: boolean;
}

export const INACTIVE_SCENARIO_OVERRIDES: SurvivalScenarioOverrides = {
  isActive: false,
  hideHud: false,
  hideStageTitle: false,
  hideHintBadge: false,
  hidePauseButton: false,
  hideKillCounter: false,
  hideTimerDisplay: false,
  hideStatusStrip: false,
  hidePlayerHpBar: false,
  hideStaff: false,
  hideChordSlots: false,
  hideChordPad: false,
  hideComboBadge: false,
  scenarioStaffClef: 2,
  hideStaffOnBSlotCompletion: false,
  useChordMidiNotesForHintHighlights: false,
  staffMode: 'progression',
  disableJoystick: false,
  disableTimeLimitClear: false,
  disableKillQuotaClear: false,
  disableResultScreen: false,
  playerInvincible: false,
  freezeAllEnemyAi: false,
  disableEnemyAttacks: false,
  blockChordPadInput: false,
  blockMidiGameInput: false,
  blockSlotEvaluation: false,
  disableSurvivalBgm: false,
  suppressAutoSpawn: false,
  bChordCompletionAttackSlot: null,
  bChordCompletionUseSpecial: false,
};

export const TUTORIAL_BOOTSTRAP_OVERRIDES: SurvivalScenarioOverrides = {
  ...INACTIVE_SCENARIO_OVERRIDES,
  isActive: true,
  hideStaff: true,
  hideHud: true,
  hideChordSlots: true,
  hideChordPad: true,
  hideComboBadge: true,
  hideStatusStrip: true,
  hidePlayerHpBar: true,
  disableTimeLimitClear: true,
  disableKillQuotaClear: true,
  disableResultScreen: true,
  playerInvincible: true,
  disableEnemyAttacks: true,
  suppressAutoSpawn: true,
  blockSlotEvaluation: true,
  blockChordPadInput: true,
  blockMidiGameInput: true,
  disableSurvivalBgm: true,
  staffMode: 'hidden',
};
