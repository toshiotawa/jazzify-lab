import { resolveSurvivalPhrasePreviewUrl } from '@/utils/survivalPhrasePreviewUrl';
import { SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL } from '@/utils/survivalPhraseDrumLoop';

describe('resolveSurvivalPhrasePreviewUrl', () => {
  it('uses phrase URL when set', () => {
    expect(resolveSurvivalPhrasePreviewUrl('https://x.example/a.mp3', 'https://fallback/b.mp3')).toBe(
      'https://x.example/a.mp3',
    );
  });

  it('trims phrase URL', () => {
    expect(resolveSurvivalPhrasePreviewUrl('  https://x.example/a.mp3  ', 'https://fallback/b.mp3')).toBe(
      'https://x.example/a.mp3',
    );
  });

  it('falls back to phrases stage BGM when phrase URL empty', () => {
    expect(resolveSurvivalPhrasePreviewUrl(null, 'https://fallback/b.mp3')).toBe('https://fallback/b.mp3');
    expect(resolveSurvivalPhrasePreviewUrl('  ', 'https://fallback/b.mp3')).toBe('https://fallback/b.mp3');
  });

  it('uses default drum loop when both empty', () => {
    expect(resolveSurvivalPhrasePreviewUrl(null, '')).toBe(SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL);
    expect(resolveSurvivalPhrasePreviewUrl(undefined, '   ')).toBe(SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL);
  });
});
