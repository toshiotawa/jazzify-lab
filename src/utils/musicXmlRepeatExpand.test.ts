import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { expandMusicXmlRepeats, prependFullMeasureCountInRest } from './musicXmlRepeatExpand';
import { convertMusicXmlToProgressionData } from './musicXmlToProgression';

const II_VI_DIR = join(process.cwd(), 'public', 'II-V-I_1-50');

describe('II-V-I MusicXML', () => {
  it('outputs progression stats for all phrase files (prepend + expand)', { timeout: 60_000 }, () => {
    const files = readdirSync(II_VI_DIR)
      .filter((f) => f.endsWith('.musicxml'))
      .sort();
    expect(files.length).toBeGreaterThan(0);

    const rows: { file: string; measures: number; notes: number }[] = [];
    for (const f of files) {
      const raw = readFileSync(join(II_VI_DIR, f), 'utf8');
      const piped = expandMusicXmlRepeats(prependFullMeasureCountInRest(raw));
      const prog = convertMusicXmlToProgressionData(piped, { groupSimultaneousNotes: true });
      const noteLike = prog.filter((p) => p.chord && p.chord !== 'N.C.');
      const doc = new DOMParser().parseFromString(piped, 'application/xml');
      const mc = doc.querySelectorAll('part > measure').length;
      rows.push({ file: f, measures: mc, notes: noteLike.length });
    }
    // eslint-disable-next-line no-console -- マイグレーション用の目安出力
    console.table(rows);
    expect(rows[0].notes).toBeGreaterThan(10);
  });
});
