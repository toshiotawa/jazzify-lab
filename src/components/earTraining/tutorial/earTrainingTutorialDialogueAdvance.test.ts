import {
  dialogueRequiresTapBeforeOsmd,
  shouldScheduleDialogueAutoAdvance,
} from './earTrainingTutorialDialogueAdvance';

describe('shouldScheduleDialogueAutoAdvance', () => {
  it('auto-advances non-final lines', () => {
    expect(shouldScheduleDialogueAutoAdvance(0, 4, true)).toBe(true);
    expect(shouldScheduleDialogueAutoAdvance(2, 4, true)).toBe(true);
  });

  it('waits for tap on final line before OSMD', () => {
    expect(shouldScheduleDialogueAutoAdvance(3, 4, true)).toBe(false);
  });

  it('auto-advances final line when OSMD does not follow', () => {
    expect(shouldScheduleDialogueAutoAdvance(3, 4, false)).toBe(true);
  });
});

describe('dialogueRequiresTapBeforeOsmd', () => {
  it('requires tap when next scene is chord_osmd', () => {
    expect(dialogueRequiresTapBeforeOsmd({ type: 'chord_osmd', contentRef: 'x', requiredLoops: 1 })).toBe(true);
  });

  it('does not require tap for other next scenes', () => {
    expect(dialogueRequiresTapBeforeOsmd({ type: 'dialogue_only', lines: [] })).toBe(false);
    expect(dialogueRequiresTapBeforeOsmd({ type: 'finish' })).toBe(false);
    expect(dialogueRequiresTapBeforeOsmd(null)).toBe(false);
  });
});
