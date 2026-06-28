import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import type { EarTrainingTutorialUiOverrides } from './earTrainingTutorialScriptTypes';
import { isEarTrainingTutorialNoCombat } from './earTrainingTutorialBindings';

export const applyTutorialBattleSnapshot = (
  snapshot: EarTrainingBattleSnapshot,
  ui: EarTrainingTutorialUiOverrides,
): EarTrainingBattleSnapshot => ({
  ...snapshot,
  hidePlayerHpBar: ui.hidePlayerHpBar,
  hideSettingsButton: false,
  hideBackButton: ui.hideBackButton,
  hideLobbyControls: ui.hideLobby,
  hideMidiStatus: ui.hideMidiToggle,
  timeLabelHidden: ui.hideLobby,
  phraseIntroLine: ui.hidePhraseIntroQuota ? '' : snapshot.phraseIntroLine,
  showLobbyControls: ui.hideLobby ? false : snapshot.showLobbyControls,
  attackGaugeHidden: isEarTrainingTutorialNoCombat(ui) || ui.hideLobby
    ? true
    : snapshot.attackGaugeHidden,
  enemyAttackGaugePercent: isEarTrainingTutorialNoCombat(ui)
    ? 0
    : snapshot.enemyAttackGaugePercent,
});
