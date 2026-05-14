import { getChordVoicingQuoteDisplayText } from '@/utils/earTrainingChordVoicingQuote';

describe('getChordVoicingQuoteDisplayText', () => {
  it('returns null when chord is null', () => {
    expect(getChordVoicingQuoteDisplayText(null)).toBeNull();
  });

  it('returns null when quote is missing', () => {
    expect(getChordVoicingQuoteDisplayText({ quote: null })).toBeNull();
    expect(getChordVoicingQuoteDisplayText({ quote: undefined })).toBeNull();
  });

  it('returns null when text is only whitespace', () => {
    expect(getChordVoicingQuoteDisplayText({ quote: { text: '  ', phrase_chord_id: 'x', id: 'y' } })).toBeNull();
  });

  it('returns trimmed text', () => {
    expect(getChordVoicingQuoteDisplayText({ quote: { text: '  こんにちは ', phrase_chord_id: 'x', id: 'y' } })).toBe(
      'こんにちは',
    );
  });
});
