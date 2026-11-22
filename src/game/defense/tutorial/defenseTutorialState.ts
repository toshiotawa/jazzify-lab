import type { InputMethod } from '@/types';
import type { DefenseTutorialNotationSettings } from '@/game/defense/tutorial/defenseTutorialNotation';

export type DefenseTutorialScreen =
  | 'notation'
  | 'notationConfirm'
  | 'inputChoice'
  | 'inputSetup'
  | 'play';

export interface DefenseTutorialSessionState {
  readonly screen: DefenseTutorialScreen;
  readonly notation: DefenseTutorialNotationSettings;
  readonly inputMethod: InputMethod | null;
  readonly phraseSucceeded: boolean;
  readonly completionSaved: boolean;
  readonly clearModalVisible: boolean;
}

export type DefenseTutorialResetReason =
  | 'notation'
  | 'inputMethod'
  | 'micSensitivity';

export const createDefenseTutorialSessionState = (
  notation: DefenseTutorialNotationSettings,
): DefenseTutorialSessionState => ({
  screen: 'notation',
  notation,
  inputMethod: null,
  phraseSucceeded: false,
  completionSaved: false,
  clearModalVisible: false,
});

export const advanceDefenseTutorialScreen = (
  state: DefenseTutorialSessionState,
  next: DefenseTutorialScreen,
): DefenseTutorialSessionState => ({
  ...state,
  screen: next,
});

export const retreatDefenseTutorialScreen = (
  state: DefenseTutorialSessionState,
): DefenseTutorialSessionState | null => {
  switch (state.screen) {
    case 'notationConfirm':
      return { ...state, screen: 'notation', clearModalVisible: false };
    case 'inputChoice':
      return { ...state, screen: 'notationConfirm', clearModalVisible: false };
    case 'inputSetup':
      return {
        ...state,
        screen: 'inputChoice',
        inputMethod: null,
        clearModalVisible: false,
      };
    case 'play':
      return {
        ...state,
        screen: 'inputSetup',
        phraseSucceeded: false,
        clearModalVisible: false,
      };
    default:
      return null;
  }
};

export const updateDefenseTutorialNotation = (
  state: DefenseTutorialSessionState,
  notation: DefenseTutorialNotationSettings,
): DefenseTutorialSessionState => ({
  ...state,
  notation,
  phraseSucceeded: false,
  clearModalVisible: false,
});

export const selectDefenseTutorialInputMethod = (
  state: DefenseTutorialSessionState,
  inputMethod: InputMethod,
): DefenseTutorialSessionState => ({
  ...state,
  inputMethod,
  phraseSucceeded: false,
  clearModalVisible: false,
});

export const markDefenseTutorialPhraseSucceeded = (
  state: DefenseTutorialSessionState,
): DefenseTutorialSessionState => {
  if (state.phraseSucceeded) {
    return state;
  }
  return {
    ...state,
    phraseSucceeded: true,
    clearModalVisible: true,
  };
};

export const dismissDefenseTutorialClearModal = (
  state: DefenseTutorialSessionState,
): DefenseTutorialSessionState => ({
  ...state,
  clearModalVisible: false,
});

export const markDefenseTutorialCompletionSaved = (
  state: DefenseTutorialSessionState,
): DefenseTutorialSessionState => ({
  ...state,
  completionSaved: true,
});

export const hasClearedDefenseTutorial = (
  state: DefenseTutorialSessionState,
): boolean => state.phraseSucceeded || state.completionSaved;

export const shouldResetPhraseProgress = (reason: DefenseTutorialResetReason): boolean => (
  reason === 'notation'
  || reason === 'inputMethod'
  || reason === 'micSensitivity'
);

export const shouldSaveCompletionOnExit = (
  state: DefenseTutorialSessionState,
): boolean => state.phraseSucceeded && !state.completionSaved;