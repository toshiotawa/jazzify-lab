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
}

export type DefenseTutorialResetReason =
  | 'notation'
  | 'inputMethod'
  | 'micSensitivity'
  | 'voiceFastResponse';

export const createDefenseTutorialSessionState = (
  notation: DefenseTutorialNotationSettings,
): DefenseTutorialSessionState => ({
  screen: 'notation',
  notation,
  inputMethod: null,
  phraseSucceeded: false,
  completionSaved: false,
});

export const advanceDefenseTutorialScreen = (
  state: DefenseTutorialSessionState,
  next: DefenseTutorialScreen,
): DefenseTutorialSessionState => ({
  ...state,
  screen: next,
});

export const updateDefenseTutorialNotation = (
  state: DefenseTutorialSessionState,
  notation: DefenseTutorialNotationSettings,
): DefenseTutorialSessionState => ({
  ...state,
  notation,
  phraseSucceeded: false,
});

export const selectDefenseTutorialInputMethod = (
  state: DefenseTutorialSessionState,
  inputMethod: InputMethod,
): DefenseTutorialSessionState => ({
  ...state,
  inputMethod,
  phraseSucceeded: false,
});

export const markDefenseTutorialPhraseSucceeded = (
  state: DefenseTutorialSessionState,
): DefenseTutorialSessionState => ({
  ...state,
  phraseSucceeded: true,
});

export const markDefenseTutorialCompletionSaved = (
  state: DefenseTutorialSessionState,
): DefenseTutorialSessionState => ({
  ...state,
  completionSaved: true,
});

export const shouldResetPhraseProgress = (reason: DefenseTutorialResetReason): boolean => (
  reason === 'notation'
  || reason === 'inputMethod'
  || reason === 'micSensitivity'
  || reason === 'voiceFastResponse'
);

export const shouldSaveCompletionOnExit = (
  state: DefenseTutorialSessionState,
): boolean => state.phraseSucceeded && !state.completionSaved;
