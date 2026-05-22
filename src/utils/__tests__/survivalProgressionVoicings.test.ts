import { describe, expect, it, vi } from 'vitest';

import {
  analyzeSurvivalChordProgression,
  SURVIVAL_PROGRESSION_VOICING_MAP,
  survivalVoicingToNoteNames,
} from '@/utils/survivalProgressionVoicings';
import { runSurvivalProgressionVoicingsCli } from '@/utils/survivalProgressionVoicingsCli';

describe('survivalProgressionVoicings', () => {
  it('例進行: コードマップ既定フォームを固定し、同一コードの繰り返しで反転しない', () => {
    const input = 'Dm7(9) G7(9.13) CM7(9) CM7(9)';
    const r = analyzeSurvivalChordProgression(input);
    expect(r.entries.map(e => e.form)).toEqual(['A', 'B', 'A', 'A']);
    expect(r.entries.map(e => e.name)).toEqual(['Dm7(9)', 'G7(9.13)', 'CM7(9)', 'CM7(9)']);
    expect(r.progression.length).toBe(4);
    for (const e of r.entries) {
      expect(e.voicing.length).toBe(4);
    }
  });

  it('EbM7(9) は C フォームを使う', () => {
    const r = analyzeSurvivalChordProgression('EbM7(9)');
    expect(r.entries[0]?.form).toBe('C');
    expect(r.entries[0]?.kind).toBe('M7_9');
  });

  it('単体の既定フォーム: Fm7=B, Bb7=A, Bdim7=B', () => {
    const r = analyzeSurvivalChordProgression('Fm7 Bb7 Bdim7');
    expect(r.entries.map(e => `${e.name}:${e.form}`)).toEqual([
      'Fm7:B',
      'Bb7:A',
      'Bdim7:B',
    ]);
  });

  it('dim7 の音は A=R 3 5 7、B=5 7 R 3 のピッチクラスになる', () => {
    const r = analyzeSurvivalChordProgression('Cdim7 Ddim7');
    const cDim = r.entries[0];
    const dDim = r.entries[1];
    if (!cDim || !dDim) throw new Error('parse failed');
    const pcs = (midis: readonly number[]) => midis.map(m => ((m % 12) + 12) % 12);
    // Cdim7 → C-4=Ab(pc8) → B フォーム → 5 7 R 3 → Gb A C Eb = pc [6,9,0,3]
    expect(cDim.form).toBe('B');
    expect(pcs(cDim.voicing)).toEqual([6, 9, 0, 3]);
    // Ddim7 → D-4=Bb(pc10) → B フォーム → 5 7 R 3 → Ab B D F = pc [8,11,2,5]
    expect(dDim.form).toBe('B');
    expect(pcs(dDim.voicing)).toEqual([8, 11, 2, 5]);
  });

  it('メジャー II-V-I 全キーで指定フォーム表に従う（Eb は B-A-C）', () => {
    const KEYS: ReadonlyArray<{ key: string; input: string; expected: ReadonlyArray<'A' | 'B' | 'C'> }> = [
      { key: 'C',  input: 'Dm7(9) G7(9.13) CM7(9)',   expected: ['A', 'B', 'A'] },
      { key: 'Db', input: 'Ebm7(9) Ab7(9.13) DbM7(9)', expected: ['A', 'B', 'A'] },
      { key: 'D',  input: 'Em7(9) A7(9.13) DM7(9)',   expected: ['A', 'B', 'A'] },
      { key: 'Eb', input: 'Fm7(9) Bb7(9.13) EbM7(9)', expected: ['B', 'A', 'C'] },
      { key: 'E',  input: 'F#m7(9) B7(9.13) EM7(9)',  expected: ['B', 'A', 'B'] },
      { key: 'F',  input: 'Gm7(9) C7(9.13) FM7(9)',   expected: ['B', 'A', 'B'] },
      { key: 'F#', input: 'G#m7(9) C#7(9.13) F#M7(9)', expected: ['B', 'A', 'B'] },
      { key: 'Gb', input: 'Abm7(9) Db7(9.13) GbM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'G',  input: 'Am7(9) D7(9.13) GM7(9)',   expected: ['B', 'A', 'B'] },
      { key: 'Ab', input: 'Bbm7(9) Eb7(9.13) AbM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'A',  input: 'Bm7(9) E7(9.13) AM7(9)',   expected: ['B', 'A', 'B'] },
      { key: 'Bb', input: 'Cm7(9) F7(9.13) BbM7(9)',  expected: ['A', 'B', 'A'] },
      { key: 'B',  input: 'C#m7(9) F#7(9.13) BM7(9)', expected: ['A', 'B', 'A'] },
    ];
    for (const { key, input, expected } of KEYS) {
      const r = analyzeSurvivalChordProgression(input);
      expect(r.entries.map(e => e.form), key).toEqual(expected);
    }
  });

  it('マイナー II-V-I 全 12 キー（i = mM7(9)）で指定フォーム表に従う', () => {
    const KEYS: ReadonlyArray<{ key: string; input: string; expected: ReadonlyArray<'A' | 'B'> }> = [
      { key: 'Cm',  input: 'Dm7(b5) G7(b9.b13) CmM7(9)',  expected: ['A', 'B', 'A'] },
      { key: 'Dbm', input: 'Ebm7(b5) Ab7(b9.b13) DbmM7(9)', expected: ['A', 'B', 'A'] },
      { key: 'Dm',  input: 'Em7(b5) A7(b9.b13) DmM7(9)',  expected: ['A', 'B', 'A'] },
      { key: 'Ebm', input: 'Fm7(b5) Bb7(b9.b13) EbmM7(9)', expected: ['A', 'B', 'A'] },
      { key: 'Em',  input: 'F#m7(b5) B7(b9.b13) EmM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'Fm',  input: 'Gm7(b5) C7(b9.b13) FmM7(9)',  expected: ['B', 'A', 'B'] },
      { key: 'F#m', input: 'G#m7(b5) C#7(b9.b13) F#mM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'Gm',  input: 'Am7(b5) D7(b9.b13) GmM7(9)',  expected: ['B', 'A', 'B'] },
      { key: 'Abm', input: 'Bbm7(b5) Eb7(b9.b13) AbmM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'Am',  input: 'Bm7(b5) E7(b9.b13) AmM7(9)',  expected: ['B', 'A', 'B'] },
      { key: 'Bbm', input: 'Cm7(b5) F7(b9.b13) BbmM7(9)', expected: ['A', 'B', 'A'] },
      { key: 'Bm',  input: 'C#m7(b5) F#7(b9.b13) BmM7(9)', expected: ['A', 'B', 'A'] },
    ];
    for (const { key, input, expected } of KEYS) {
      const r = analyzeSurvivalChordProgression(input);
      expect(r.entries.map(e => e.form), key).toEqual(expected);
    }
  });

  it('マイナー II-V-I（i = mM7(9)）でも同じ A-B 交替になる', () => {
    const r = analyzeSurvivalChordProgression('Fm7(b5) Bb7(b9.b13) EbmM7(9)');
    expect(r.entries.map(e => e.form)).toEqual(['A', 'B', 'A']);
  });

  it('サヴァイバルマップの各エントリは 4 音かつ pitch class が一意', () => {
    const keys = Object.keys(SURVIVAL_PROGRESSION_VOICING_MAP);
    expect(keys.length).toBe(17 * 13);
    for (const k of keys) {
      const { voicing } = SURVIVAL_PROGRESSION_VOICING_MAP[k];
      expect(voicing.length, k).toBe(4);
      const pcs = new Set(voicing.map(m => ((m % 12) + 12) % 12));
      expect(pcs.size, k).toBe(4);
    }
  });

  it('--dump-forms-map: 全ルート×全種の A/B（と Eb M7_9 の C）が JSON で出力される', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runSurvivalProgressionVoicingsCli(['--dump-forms-map']);
    const raw = String(writeSpy.mock.calls[0]?.[0] ?? '');
    writeSpy.mockRestore();
    const rows = JSON.parse(raw) as Array<{ root: string; kind: string; A: number[]; B: number[]; C?: number[] }>;
    expect(rows.length).toBe(17 * 13);
    const ebM7 = rows.find(r => r.root === 'Eb' && r.kind === 'M7_9');
    expect(ebM7?.C).toBeDefined();
    expect(ebM7?.C?.length).toBe(4);
    const noCElse = rows.filter(r => r.C !== undefined && !(r.root === 'Eb' && r.kind === 'M7_9'));
    expect(noCElse.length).toBe(0);
  });

  it('未対応コードはエラーになる', () => {
    expect(() => analyzeSurvivalChordProgression('Cmaj13')).toThrow(/Unsupported chord/);
  });

  it('survivalVoicingToNoteNames が MIDI 60 = C4 を満たす', () => {
    expect(survivalVoicingToNoteNames([60])).toEqual(['C4']);
  });

  it('m7b5 トークンを m7(b5) に正規化してパースする', () => {
    const r = analyzeSurvivalChordProgression('Bm7b5 E7(b9.b13)');
    expect(r.entries.map(e => e.name)).toEqual(['Bm7(b5)', 'E7(b9.b13)']);
  });

  it('M7(9.13) / m7(b9.b13) をパースする', () => {
    const r = analyzeSurvivalChordProgression('FM7(9.13) Dm7(b9.b13)');
    expect(r.entries.map(e => `${e.name}:${e.kind}`)).toEqual([
      'FM7(9.13):M7_9',
      'Dm7(b9.b13):m7',
    ]);
  });

  it('m7(9) は 9th を含み、素の m7 / m7(b5) は 357R・7R35（9th なし）', () => {
    const pcs = (midis: readonly number[]) => midis.map(m => ((m % 12) + 12) % 12);
    const ROOT_PC: Record<string, number> = {
      C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
      G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
    };
    const rootPcOf = (root: string): number => ROOT_PC[root] ?? 0;
    const hasNinth = (root: string, voicing: readonly number[]) =>
      pcs(voicing).includes((rootPcOf(root) + 2) % 12);
    const hasRoot = (root: string, voicing: readonly number[]) =>
      pcs(voicing).includes(rootPcOf(root));

    const dm9 = analyzeSurvivalChordProgression('Dm7(9)').entries[0];
    const dm = analyzeSurvivalChordProgression('Dm7').entries[0];
    const em = analyzeSurvivalChordProgression('Em7').entries[0];
    const amB5 = analyzeSurvivalChordProgression('Am7(b5)').entries[0];
    if (!dm9 || !dm || !em || !amB5) throw new Error('parse failed');

    expect(dm9.kind).toBe('m7_9');
    expect(hasNinth('D', dm9.voicing)).toBe(true);
    expect(hasNinth('D', dm.voicing)).toBe(false);
    expect(hasRoot('D', dm.voicing)).toBe(true);
    expect(hasNinth('E', em.voicing)).toBe(false);
    expect(hasRoot('E', em.voicing)).toBe(true);
    expect(hasNinth('A', amB5.voicing)).toBe(false);
    expect(hasRoot('A', amB5.voicing)).toBe(true);
  });

  it('runSurvivalProgressionVoicingsCli が progression JSON を出力する', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runSurvivalProgressionVoicingsCli(['Dm7(9)', 'CM7(9)']);
    expect(writeSpy).toHaveBeenCalled();
    const raw = String(writeSpy.mock.calls[0]?.[0] ?? '');
    const parsed = JSON.parse(raw) as { progression: { name: string }[] };
    expect(parsed.progression.map(p => p.name)).toEqual(['Dm7(9)', 'CM7(9)']);
    writeSpy.mockRestore();
  });
});
