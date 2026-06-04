import {
  chordDefinitionToCodeRunActive,
  isCodeRunRandomStage,
  pickCodeRunRandomChord,
} from './codeRunRandomChords';

describe('codeRunRandomChords', () => {
  it('isCodeRunRandomStage は random かつ allowed があるときのみ true', () => {
    expect(isCodeRunRandomStage('random', ['C', 'D'])).toBe(true);
    expect(isCodeRunRandomStage('progression', ['C'])).toBe(false);
    expect(isCodeRunRandomStage('random', [])).toBe(false);
  });

  it('pickCodeRunRandomChord は C のメジャートライアド MIDI を返す', () => {
    const chord = pickCodeRunRandomChord(['C']);
    expect(chord).not.toBeNull();
    expect(chord?.displayName).toBeTruthy();
    expect(chord?.notes.length).toBeGreaterThanOrEqual(3);
    const pcs = new Set(chord?.notes.map(n => ((n % 12) + 12) % 12));
    expect(pcs.has(0)).toBe(true);
    expect(pcs.has(4)).toBe(true);
    expect(pcs.has(7)).toBe(true);
  });

  it('pickCodeRunRandomChord は Cm のマイナートライアドを返す', () => {
    const chord = pickCodeRunRandomChord(['Cm']);
    expect(chord).not.toBeNull();
    const pcs = new Set(chord?.notes.map(n => ((n % 12) + 12) % 12));
    expect(pcs.has(0)).toBe(true);
    expect(pcs.has(3)).toBe(true);
    expect(pcs.has(7)).toBe(true);
  });

  it('pickCodeRunRandomChord は CM7 を返す', () => {
    const chord = pickCodeRunRandomChord(['CM7']);
    expect(chord).not.toBeNull();
    expect(chord?.notes.length).toBeGreaterThanOrEqual(4);
  });

  it('chordDefinitionToCodeRunActive は id と notes を保持する', () => {
    const source = pickCodeRunRandomChord(['F']);
    expect(source).not.toBeNull();
    if (!source) return;
    const mapped = chordDefinitionToCodeRunActive({
      id: source.id,
      displayName: source.displayName,
      notes: source.notes,
      noteNames: [],
      quality: 'major',
      root: source.root,
    });
    expect(mapped.id).toBe(source.id);
    expect(mapped.notes).toEqual(source.notes);
  });
});
