import { describe, expect, it } from 'vitest';

import { buildProgressionChordDefinition } from '@/utils/survivalProgressionChords';

describe('survivalProgressionChords', () => {
  it('buildProgressionChordDefinition の root はコード記号ルート（rootless voicing の最低音ではない）', () => {
    const def = buildProgressionChordDefinition({ name: 'Dm7(9)', voicing: [53, 57, 60, 64] }, 0, 0);
    expect(def.root).toBe('D');
    expect(def.notes[0]).toBe(53);
    expect(def.noteNames[0]).toBe('F');
  });

  it('スラッシュコードは分子のルートを使う', () => {
    const def = buildProgressionChordDefinition({ name: 'C/E', voicing: [52, 55, 60, 64] }, 0, 0);
    expect(def.root).toBe('C');
    const def2 = buildProgressionChordDefinition({ name: 'Dm7/G', voicing: [55, 60, 62, 65] }, 0, 0);
    expect(def2.root).toBe('D');
  });

  it('G7(9.13) / BbM7(9) / F#m7(9) の progression 名からルートを取る', () => {
    expect(buildProgressionChordDefinition({ name: 'G7(9.13)', voicing: [53] }, 0, 0).root).toBe('G');
    expect(buildProgressionChordDefinition({ name: 'BbM7(9)', voicing: [62] }, 0, 0).root).toBe('Bb');
    expect(buildProgressionChordDefinition({ name: 'F#m7(9)', voicing: [52] }, 0, 0).root).toBe(
      'F#',
    );
  });

  it('全黒鍵のシャープ/フラット表記と白鍵の異名同音も root として保持する', () => {
    const roots = ['C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb', 'Cb', 'B#', 'Fb', 'E#'];
    for (const root of roots) {
      const def = buildProgressionChordDefinition({ name: `${root}M7(9)`, voicing: [60] }, 0, 0);
      expect(def.root).toBe(root);
    }
  });
});
