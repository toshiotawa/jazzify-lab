import {
  advanceDefenseTutorialScreen,
  createDefenseTutorialSessionState,
  markDefenseTutorialPhraseSucceeded,
  retreatDefenseTutorialScreen,
  shouldSaveCompletionOnExit,
} from '@/game/defense/tutorial/defenseTutorialState';
import { defaultTutorialNotationSettings } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';

describe('defenseTutorialState', () => {
  it('requires phrase success before saving completion on exit', () => {
    const initial = createDefenseTutorialSessionState(defaultTutorialNotationSettings('piano'));
    expect(shouldSaveCompletionOnExit(initial)).toBe(false);

    const succeeded = markDefenseTutorialPhraseSucceeded(
      advanceDefenseTutorialScreen(initial, 'play'),
    );
    expect(shouldSaveCompletionOnExit(succeeded)).toBe(true);
  });

  it('retreats through setup screens', () => {
    const initial = createDefenseTutorialSessionState(defaultTutorialNotationSettings('piano'));
    const confirm = advanceDefenseTutorialScreen(initial, 'notationConfirm');
    expect(retreatDefenseTutorialScreen(confirm)?.screen).toBe('notation');
    const inputChoice = advanceDefenseTutorialScreen(confirm, 'inputChoice');
    expect(retreatDefenseTutorialScreen(inputChoice)?.screen).toBe('notationConfirm');
  });
});
