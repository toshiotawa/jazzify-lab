import {
  advanceDefenseTutorialScreen,
  createDefenseTutorialSessionState,
  dismissDefenseTutorialClearModal,
  hasClearedDefenseTutorial,
  markDefenseTutorialCompletionSaved,
  markDefenseTutorialPhraseSucceeded,
  retreatDefenseTutorialScreen,
  shouldSaveCompletionOnExit,
} from '@/game/defense/tutorial/defenseTutorialState';
import { defaultTutorialNotationSettings } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';

const baseNotation = defaultTutorialNotationSettings('piano');

describe('defenseTutorialState', () => {
  it('does not save completion on exit before phrase success', () => {
    const initial = createDefenseTutorialSessionState(baseNotation);
    expect(shouldSaveCompletionOnExit(initial)).toBe(false);
    expect(hasClearedDefenseTutorial(initial)).toBe(false);
  });

  it('opens clear modal and allows save only after phrase success', () => {
    const initial = createDefenseTutorialSessionState(baseNotation);
    const play = advanceDefenseTutorialScreen(initial, 'play');
    const succeeded = markDefenseTutorialPhraseSucceeded(play);

    expect(succeeded.phraseSucceeded).toBe(true);
    expect(succeeded.clearModalVisible).toBe(true);
    expect(shouldSaveCompletionOnExit(succeeded)).toBe(true);
    expect(hasClearedDefenseTutorial(succeeded)).toBe(true);
  });

  it('does not reopen the clear modal when phrase succeeds again', () => {
    const initial = createDefenseTutorialSessionState(baseNotation);
    const play = advanceDefenseTutorialScreen(initial, 'play');
    const first = markDefenseTutorialPhraseSucceeded(play);
    const dismissed = dismissDefenseTutorialClearModal(first);
    const again = markDefenseTutorialPhraseSucceeded(dismissed);

    expect(again.clearModalVisible).toBe(false);
    expect(again.phraseSucceeded).toBe(true);
  });

  it('stops saving after completion is persisted', () => {
    const initial = createDefenseTutorialSessionState(baseNotation);
    const succeeded = markDefenseTutorialPhraseSucceeded(
      advanceDefenseTutorialScreen(initial, 'play'),
    );
    const saved = markDefenseTutorialCompletionSaved(succeeded);

    expect(shouldSaveCompletionOnExit(saved)).toBe(false);
    expect(hasClearedDefenseTutorial(saved)).toBe(true);
  });

  it('retreats through setup screens', () => {
    const initial = createDefenseTutorialSessionState(baseNotation);
    const confirm = advanceDefenseTutorialScreen(initial, 'notationConfirm');
    expect(retreatDefenseTutorialScreen(confirm)?.screen).toBe('notation');
    const inputChoice = advanceDefenseTutorialScreen(confirm, 'inputChoice');
    expect(retreatDefenseTutorialScreen(inputChoice)?.screen).toBe('notationConfirm');
  });
});