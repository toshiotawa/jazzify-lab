import {
  advanceDefenseTutorialScreen,
  createDefenseTutorialSessionState,
  markDefenseTutorialCompletionSaved,
  retreatDefenseTutorialScreen,
  shouldSaveCompletionOnExit,
} from '@/game/defense/tutorial/defenseTutorialState';
import { defaultTutorialNotationSettings } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';

describe('defenseTutorialState', () => {
  it('saves completion on exit unless already saved', () => {
    const initial = createDefenseTutorialSessionState(defaultTutorialNotationSettings('piano'));
    expect(shouldSaveCompletionOnExit(initial)).toBe(true);

    const saved = markDefenseTutorialCompletionSaved(initial);
    expect(shouldSaveCompletionOnExit(saved)).toBe(false);
  });

  it('retreats through setup screens', () => {
    const initial = createDefenseTutorialSessionState(defaultTutorialNotationSettings('piano'));
    const confirm = advanceDefenseTutorialScreen(initial, 'notationConfirm');
    expect(retreatDefenseTutorialScreen(confirm)?.screen).toBe('notation');
    const inputChoice = advanceDefenseTutorialScreen(confirm, 'inputChoice');
    expect(retreatDefenseTutorialScreen(inputChoice)?.screen).toBe('notationConfirm');
  });
});
