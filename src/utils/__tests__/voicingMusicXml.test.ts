import { describe, expect, it } from 'vitest';
import { buildVoicingMusicXml, parseVoicingNoteName } from '@/utils/voicingMusicXml';

describe('voicingMusicXml', () => {
  it('parseVoicingNoteName でダブルシャープ x を alter=2 として扱う', () => {
    const note = parseVoicingNoteName('Cx5');
    expect(note.step).toBe('C');
    expect(note.alter).toBe(2);
    expect(note.octave).toBe(5);
    expect(note.midi).toBe(74);
  });

  it('parseVoicingNoteName でダブルフラット bb を alter=-2 として扱う', () => {
    const note = parseVoicingNoteName('Dbb4');
    expect(note.step).toBe('D');
    expect(note.alter).toBe(-2);
    expect(note.octave).toBe(4);
    expect(note.midi).toBe(60);
  });

  it('voicing と voicing_staves の長さが違うとエラー', () => {
    expect(() => buildVoicingMusicXml({ voicing: ['C4'], voicingStaves: [] })).toThrow();
  });

  it('staff=1 のみの voicing でト音譜表側に4音生成される', () => {
    const { xml, noteOrder } = buildVoicingMusicXml({
      voicing: ['D4', 'F#4', 'A4', 'C5'],
      voicingStaves: [1, 1, 1, 1],
    });
    expect(noteOrder).toEqual([0, 1, 2, 3]);
    expect(xml).toContain('<staves>2</staves>');
    expect(xml).toContain('<step>D</step>');
    expect(xml).toContain('<step>F</step>');
    expect(xml).toContain('<alter>1</alter>');
    expect(xml).toContain('<step>A</step>');
    expect(xml).toContain('<step>C</step>');
    expect(xml).toContain('<staff>1</staff>');
    expect(xml).not.toContain('<staff>2</staff>');
    expect(xml).toContain('<rest/>');
  });

  it('staff=1/2 混在の voicing で両譜表に振り分ける', () => {
    const { xml, noteOrder } = buildVoicingMusicXml({
      voicing: ['E2', 'G2', 'C3', 'E4'],
      voicingStaves: [2, 2, 2, 1],
    });
    expect(noteOrder.length).toBe(4);
    expect(noteOrder[0]).toBe(3);
    expect(xml).toContain('<staff>1</staff>');
    expect(xml).toContain('<staff>2</staff>');
    expect(xml).not.toContain('<rest/>');
  });

  it('ダブル臨時記号が <alter>2</alter>, <alter>-2</alter> として出力される', () => {
    const { xml } = buildVoicingMusicXml({
      voicing: ['Cx5', 'Dbb4'],
      voicingStaves: [1, 2],
    });
    expect(xml).toContain('<alter>2</alter>');
    expect(xml).toContain('<alter>-2</alter>');
  });

  it('voicing が空だとエラー', () => {
    expect(() => buildVoicingMusicXml({ voicing: [], voicingStaves: [] })).toThrow();
  });

  it('voicing_staves の値が 1/2 以外だとエラー', () => {
    expect(() =>
      buildVoicingMusicXml({ voicing: ['C4'], voicingStaves: [3] }),
    ).toThrow();
  });
});
