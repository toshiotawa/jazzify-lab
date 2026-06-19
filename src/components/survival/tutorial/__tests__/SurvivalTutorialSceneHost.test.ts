import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import {
  isSurvivalTutorialNextSceneFinish,
  showSurvivalTutorialFinishCta,
} from '@/components/survival/tutorial/survivalTutorialV3FinishFlow';

const scriptWithFinish: SurvivalTutorialScriptPayloadV3 = {
  version: 3,
  ui: {
    hidePlayerHpBar: true,
    hideSettingsButton: true,
    hideBackButton: true,
    hideMidiToggle: true,
    showExitButton: true,
    playerInvincible: true,
    disableEnemyAttacks: true,
    keyboardHintsDefault: true,
  },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lines: [{ ja: '最終セリフ', en: 'Final line' }],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

describe('isSurvivalTutorialNextSceneFinish', () => {
  it('returns true when the next scene is finish', () => {
    expect(isSurvivalTutorialNextSceneFinish(scriptWithFinish, 0)).toBe(true);
  });

  it('returns false when the next scene is not finish', () => {
    expect(isSurvivalTutorialNextSceneFinish(scriptWithFinish, 1)).toBe(false);
  });

  it('returns false when sceneIndex is out of range', () => {
    expect(isSurvivalTutorialNextSceneFinish(scriptWithFinish, 99)).toBe(false);
  });
});

describe('showSurvivalTutorialFinishCta', () => {
  it('returns true for finish scene with showCta default', () => {
    const finishScene = scriptWithFinish.scenes[1];
    expect(finishScene).toBeDefined();
    if (!finishScene) return;
    expect(showSurvivalTutorialFinishCta(scriptWithFinish, finishScene)).toBe(true);
  });
});
