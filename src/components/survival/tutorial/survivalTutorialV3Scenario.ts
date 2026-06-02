import {
  TUTORIAL_BOOTSTRAP_OVERRIDES,
  type SurvivalScenarioOverrides,
} from '@/components/survival/scenario/survivalScenarioTypes';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';

/**
 * v3 共通: UI・任意 `scenarioOverrides` をブートストラップに合成。
 */
export function mergeSurvivalTutorialV3Baseline(
  script: SurvivalTutorialScriptPayloadV3,
): SurvivalScenarioOverrides {
  let merged: SurvivalScenarioOverrides = {
    ...TUTORIAL_BOOTSTRAP_OVERRIDES,
    ...(script.scenarioOverrides ?? {}),
  };

  const u = script.ui;
  merged = {
    ...merged,
    hidePlayerHpBar: u.hidePlayerHpBar,
    playerInvincible: u.playerInvincible,
    disableEnemyAttacks: u.disableEnemyAttacks,
    freezeAllEnemyAi: true,
    suppressAutoSpawn: true,
    /** 親 `TutorialAudioController` がドラムループを継続再生 */
    disableSurvivalBgm: true,
  };

  return merged;
}

/** フレーズのみステージ BGM を `SurvivalGameScreen` 側で再生 */
export function survivalTutorialPhraseBattleBaseline(
  script: SurvivalTutorialScriptPayloadV3,
): SurvivalScenarioOverrides {
  return {
    ...mergeSurvivalTutorialV3Baseline(script),
    disableSurvivalBgm: false,
  };
}

/** コードバトル: 入力可能・進行コード譜・B コードスロット有効時 */
export function survivalTutorialChordRevealOverrides(
  base: SurvivalScenarioOverrides,
): SurvivalScenarioOverrides {
  return {
    ...base,
    isActive: true,
    hideHud: false,
    hideStageTitle: true,
    hideTimerDisplay: true,
    hideKillCounter: true,
    hidePauseButton: true,
    hideHintBadge: true,
    hideStatusStrip: true,
    hideStaff: false,
    hideChordSlots: false,
    hideChordPad: false,
    hideComboBadge: true,
    staffMode: 'progression',
    scenarioStaffClef: 2,
    hideStaffOnBSlotCompletion: true,
    useChordMidiNotesForHintHighlights: true,
    blockChordPadInput: false,
    blockMidiGameInput: false,
    blockSlotEvaluation: false,
  };
}

/** intro フェーズ用: MIDI / 入力ブロックして譜面を隠す */
export function survivalTutorialChordIntroBlockOverrides(
  base: SurvivalScenarioOverrides,
): SurvivalScenarioOverrides {
  return {
    ...survivalTutorialChordRevealOverrides(base),
    hideStaff: true,
    staffMode: 'hidden',
    hideChordSlots: true,
    hideChordPad: false,
    useChordMidiNotesForHintHighlights: false,
    blockChordPadInput: true,
    blockMidiGameInput: true,
    blockSlotEvaluation: true,
  };
}

/** フレーズ intro: 入力ブロック・譜面非表示（フレーズ譜は reveal 後）。 */
export function survivalTutorialPhraseIntroBlockOverrides(
  base: SurvivalScenarioOverrides,
): SurvivalScenarioOverrides {
  return {
    ...survivalTutorialPhraseRevealOverrides(base),
    hideStaff: true,
    staffMode: 'hidden',
    useChordMidiNotesForHintHighlights: false,
    blockChordPadInput: true,
    blockMidiGameInput: true,
    blockSlotEvaluation: true,
  };
}

/** フレーズバトル: フレーズ譜は `phraseStaffProps` 経路。コードスロット評価はオフのまま。 */
export function survivalTutorialPhraseRevealOverrides(
  base: SurvivalScenarioOverrides,
): SurvivalScenarioOverrides {
  return {
    ...base,
    isActive: true,
    hideHud: false,
    hideStageTitle: true,
    hideTimerDisplay: true,
    hideKillCounter: true,
    hidePauseButton: true,
    hideHintBadge: true,
    hideStatusStrip: true,
    hideStaff: false,
    hideChordSlots: true,
    hideChordPad: false,
    hideComboBadge: true,
    staffMode: 'phrase',
    blockChordPadInput: false,
    blockMidiGameInput: false,
    blockSlotEvaluation: true,
  };
}

/** demo_play: 譜面表示・入力ブロック・鍵盤ハイライトは外部スケジューラ */
export function survivalTutorialDemoPlayRevealOverrides(
  base: SurvivalScenarioOverrides,
): SurvivalScenarioOverrides {
  return {
    ...base,
    isActive: true,
    hideHud: false,
    hideStageTitle: true,
    hideTimerDisplay: true,
    hideKillCounter: true,
    hidePauseButton: true,
    hideHintBadge: true,
    hideStatusStrip: true,
    hideStaff: false,
    hideChordSlots: true,
    hideChordPad: true,
    hideComboBadge: true,
    staffMode: 'demo-timeline',
    useChordMidiNotesForHintHighlights: false,
    blockChordPadInput: true,
    blockMidiGameInput: true,
    blockSlotEvaluation: true,
    disableJoystick: true,
  };
}

/** demo_play intro: 譜面非表示 */
export function survivalTutorialDemoPlayIntroOverrides(
  base: SurvivalScenarioOverrides,
): SurvivalScenarioOverrides {
  return {
    ...survivalTutorialDemoPlayRevealOverrides(base),
    hideStaff: true,
    staffMode: 'hidden',
  };
}
