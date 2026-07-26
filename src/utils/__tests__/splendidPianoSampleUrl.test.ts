import { toNetlifySafePianoSampleUrl } from '@/utils/splendidPianoSampleUrl';

describe('toNetlifySafePianoSampleUrl', () => {
  it('replaces encoded sharp with s for Netlify-safe filenames', () => {
    expect(toNetlifySafePianoSampleUrl('/piano/splendid/MF%20C%231.m4a')).toBe(
      '/piano/splendid/MF%20Cs1.m4a'
    );
  });

  it('leaves URLs without sharp unchanged', () => {
    expect(toNetlifySafePianoSampleUrl('/piano/splendid/FF%20A0.m4a')).toBe(
      '/piano/splendid/FF%20A0.m4a'
    );
  });

  it('replaces every encoded sharp in the path', () => {
    expect(toNetlifySafePianoSampleUrl('A%23/B%23.m4a')).toBe('As/Bs.m4a');
  });
});
