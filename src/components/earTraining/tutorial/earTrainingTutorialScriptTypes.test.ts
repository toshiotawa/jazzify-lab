import { resolveDialogueLineSpeaker } from './earTrainingTutorialScriptTypes';

describe('resolveDialogueLineSpeaker', () => {
  it('defaults to player when speaker omitted', () => {
    expect(resolveDialogueLineSpeaker({ ja: 'あ', en: 'a' })).toBe('player');
  });

  it('returns partner when set', () => {
    expect(resolveDialogueLineSpeaker({
      ja: 'あ',
      en: 'a',
      speaker: 'partner',
    })).toBe('partner');
  });

  it('returns player when explicitly set', () => {
    expect(resolveDialogueLineSpeaker({
      ja: 'あ',
      en: 'a',
      speaker: 'player',
    })).toBe('player');
  });
});
