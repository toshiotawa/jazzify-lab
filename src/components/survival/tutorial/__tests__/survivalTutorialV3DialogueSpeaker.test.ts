import { describe, expect, it, vi } from 'vitest';

import {
  presentSurvivalTutorialV3Line,
  resolveSurvivalTutorialV3Speaker,
} from '@/components/survival/tutorial/survivalTutorialV3DialogueSpeaker';

describe('survivalTutorialV3DialogueSpeaker', () => {
  it('dialogue_only 省略時は fai', () => {
    expect(resolveSurvivalTutorialV3Speaker({ ja: 'a', en: 'b' }, 'dialogue_only')).toBe('fai');
  });

  it('battle 省略時は jajii', () => {
    expect(resolveSurvivalTutorialV3Speaker({ ja: 'a', en: 'b' }, 'battle')).toBe('jajii');
  });

  it('speaker 明示を優先', () => {
    expect(
      resolveSurvivalTutorialV3Speaker({ ja: 'a', en: 'b', speaker: 'narration' }, 'battle'),
    ).toBe('narration');
  });

  it('presentSurvivalTutorialV3Line は話者ごとに sink を呼ぶ', () => {
    const setCharacterSegments = vi.fn();
    const setNarrationText = vi.fn();
    const setJajiiSpeechSegments = vi.fn();
    const sink = { setCharacterSegments, setNarrationText, setJajiiSpeechSegments };

    presentSurvivalTutorialV3Line(
      { ja: 'ナレ', en: 'Narr', speaker: 'narration' },
      false,
      'dialogue_only',
      sink,
    );
    expect(setCharacterSegments).toHaveBeenCalledWith([]);
    expect(setJajiiSpeechSegments).toHaveBeenCalledWith([]);
    expect(setNarrationText).toHaveBeenCalledWith('ナレ');

    setCharacterSegments.mockClear();
    setNarrationText.mockClear();
    setJajiiSpeechSegments.mockClear();

    presentSurvivalTutorialV3Line({ ja: '爺', en: 'J', speaker: 'jajii' }, false, 'dialogue_only', sink);
    expect(setJajiiSpeechSegments).toHaveBeenCalledWith([{ text: '爺', color: '#ffffff' }]);
    expect(setCharacterSegments).toHaveBeenCalledWith([]);
    expect(setNarrationText).toHaveBeenCalledWith('');
  });
});
