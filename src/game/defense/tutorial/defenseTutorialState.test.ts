import {
  advanceDefenseTutorialScreen,
  createDefenseTutorialSessionState,
  markDefenseTutorialPhraseSucceeded,
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
});
