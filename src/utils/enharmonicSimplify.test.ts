import { describe, expect, it } from 'vitest';
import { simplifyMusicXmlEnharmonics, simplifySpelledPitch } from '@/utils/enharmonicSimplify';

describe('simplifySpelledPitch', () => {
  it('converts theoretical white-key accidentals', () => {
    expect(simplifySpelledPitch('E', 1, 4)).toEqual({ step: 'F', alter: 0, octave: 4 });
    expect(simplifySpelledPitch('B', 1, 4)).toEqual({ step: 'C', alter: 0, octave: 5 });
    expect(simplifySpelledPitch('C', -1, 5)).toEqual({ step: 'B', alter: 0, octave: 4 });
    expect(simplifySpelledPitch('F', -1, 4)).toEqual({ step: 'E', alter: 0, octave: 4 });
  });

  it('converts double sharps and flats', () => {
    expect(simplifySpelledPitch('F', 2, 4)).toEqual({ step: 'G', alter: 0, octave: 4 });
    expect(simplifySpelledPitch('B', -2, 4)).toEqual({ step: 'A', alter: 0, octave: 4 });
  });

  it('returns null when no simplification applies', () => {
    expect(simplifySpelledPitch('C', 0, 4)).toBeNull();
    expect(simplifySpelledPitch('F', 1, 4)).toBeNull();
  });
});

describe('simplifyMusicXmlEnharmonics', () => {
  const baseXml = (inner: string) => `<?xml version="1.0" encoding="UTF-8"?><score-partwise>${inner}</score-partwise>`;

  it('returns original xml when nothing changes', () => {
    const xml = baseXml(`
      <part><measure>
        <attributes><key><fifths>0</fifths></key></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch></note>
      </measure></part>
    `);
    expect(simplifyMusicXmlEnharmonics(xml)).toBe(xml);
  });

  it('simplifies note pitch and skips rests', () => {
    const xml = baseXml(`
      <part><measure>
        <attributes><key><fifths>0</fifths></key></attributes>
        <note><pitch><step>E</step><alter>1</alter><octave>4</octave></pitch></note>
        <note><rest/></note>
      </measure></part>
    `);
    const result = simplifyMusicXmlEnharmonics(xml);
    expect(result).toContain('<step>F</step>');
    expect(result).toContain('<octave>4</octave>');
    expect(result).not.toContain('<alter>1</alter>');
  });

  it('adds natural accidental when key signature conflicts', () => {
    const xml = baseXml(`
      <part><measure>
        <attributes><key><fifths>7</fifths></key></attributes>
        <note><pitch><step>E</step><alter>1</alter><octave>4</octave></pitch></note>
      </measure></part>
    `);
    const result = simplifyMusicXmlEnharmonics(xml);
    expect(result).toContain('<step>F</step>');
    expect(result).toContain('<alter>0</alter>');
    expect(result).toContain('<accidental>natural</accidental>');
  });

  it('simplifies harmony root and bass', () => {
    const xml = baseXml(`
      <part><measure>
        <harmony>
          <root><root-step>E</root-step><root-alter>1</root-alter></root>
          <bass><bass-step>B</bass-step><bass-alter>1</bass-alter></bass>
        </harmony>
      </measure></part>
    `);
    const result = simplifyMusicXmlEnharmonics(xml);
    expect(result).toContain('<root-step>F</root-step>');
    expect(result).toContain('<bass-step>C</bass-step>');
    expect(result).not.toContain('<root-alter>');
    expect(result).not.toContain('<bass-alter>');
  });
});
