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
    // Ddim7 → D-4=Bb(pc10) → A フォーム → R 3 5 7 → D F Ab B = pc [2,5,8,11]
    expect(dDim.form).toBe('A');
    expect(pcs(dDim.voicing)).toEqual([2, 5, 8, 11]);
  });

  it('メジャー II-V-I 全 12 キーで A-B 交替（Eb は B-A-C）', () => {
    const KEYS: ReadonlyArray<{ key: string; input: string; expected: ReadonlyArray<'A' | 'B' | 'C'> }> = [
      { key: 'C',  input: 'Dm7(9) G7(9.13) CM7(9)',   expected: ['A', 'B', 'A'] },
      { key: 'Db', input: 'Ebm7(9) Ab7(9.13) DbM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'D',  input: 'Em7(9) A7(9.13) DM7(9)',   expected: ['B', 'A', 'B'] },
      { key: 'Eb', input: 'Fm7(9) Bb7(9.13) EbM7(9)', expected: ['B', 'A', 'C'] },
      { key: 'E',  input: 'F#m7(9) B7(9.13) EM7(9)',  expected: ['B', 'A', 'B'] },
      { key: 'F',  input: 'Gm7(9) C7(9.13) FM7(9)',   expected: ['B', 'A', 'B'] },
      { key: 'Gb', input: 'Abm7(9) Db7(9.13) GbM7(9)', expected: ['B', 'A', 'B'] },
      { key: 'G',  input: 'Am7(9) D7(9.13) GM7(9)',   expected: ['B', 'A', 'B'] },
      { key: 'Ab', input: 'Bbm7(9) Eb7(9.13) AbM7(9)', expected: ['A', 'B', 'A'] },
      { key: 'A',  input: 'Bm7(9) E7(9.13) AM7(9)',   expected: ['A', 'B', 'A'] },
      { key: 'Bb', input: 'Cm7(9) F7(9.13) BbM7(9)',  expected: ['A', 'B', 'A'] },
      { key: 'B',  input: 'C#m7(9) F#7(9.13) BM7(9)', expected: ['A', 'B', 'A'] },
    ];
    for (const { key, input, expected } of KEYS) {
      const r = analyzeSurvivalChordProgression(input);
      expect(r.entries.map(e => e.form), key).toEqual(expected);
    }
  });

  it('マイナー II-V-I 全 12 キー（i = m6(9)）で A-B 交替', () => {
    const KEYS: ReadonlyArray<{ key: string; input: string; expected: ReadonlyArray<'A' | 'B'> }> = [
      { key: 'Cm',  input: 'Dm7(b5) G7(b9.b13) Cm6(9)',  expected: ['A', 'B', 'A'] },
      { key: 'C#m', input: 'D#m7(b5) G#7(b9.b13) C#m6(9)', expected: ['B', 'A', 'B'] },
      { key: 'Dm',  input: 'Em7(b5) A7(b9.b13) Dm6(9)',  expected: ['B', 'A', 'B'] },
      { key: 'Ebm', input: 'Fm7(b5) Bb7(b9.b13) Ebm6(9)', expected: ['B', 'A', 'B'] },
      { key: 'Em',  input: 'F#m7(b5) B7(b9.b13) Em6(9)', expected: ['B', 'A', 'B'] },
      { key: 'Fm',  input: 'Gm7(b5) C7(b9.b13) Fm6(9)',  expected: ['B', 'A', 'B'] },
      { key: 'F#m', input: 'G#m7(b5) C#7(b9.b13) F#m6(9)', expected: ['B', 'A', 'B'] },
      { key: 'Gm',  input: 'Am7(b5) D7(b9.b13) Gm6(9)',  expected: ['B', 'A', 'B'] },
      { key: 'G#m', input: 'A#m7(b5) D#7(b9.b13) G#m6(9)', expected: ['A', 'B', 'A'] },
      { key: 'Am',  input: 'Bm7(b5) E7(b9.b13) Am6(9)',  expected: ['A', 'B', 'A'] },
      { key: 'Bbm', input: 'Cm7(b5) F7(b9.b13) Bbm6(9)', expected: ['A', 'B', 'A'] },
      { key: 'Bm',  input: 'C#m7(b5) F#7(b9.b13) Bm6(9)', expected: ['A', 'B', 'A'] },
    ];
    for (const { key, input, expected } of KEYS) {
      const r = analyzeSurvivalChordProgression(input);
      expect(r.entries.map(e => e.form), key).toEqual(expected);
    }
  });

  it('マイナー II-V-I（i = mM7(9)）でも同じ A-B 交替になる', () => {
    const r = analyzeSurvivalChordProgression('Dm7(b5) G7(b9.b13) CmM7(9)');
    expect(r.entries.map(e => e.form)).toEqual(['A', 'B', 'A']);
  });

  it('サヴァイバルマップの各エントリは 4 音かつ pitch class が一意', () => {
    const keys = Object.keys(SURVIVAL_PROGRESSION_VOICING_MAP);
    expect(keys.length).toBe(17 * 12);
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
    expect(rows.length).toBe(17 * 12);
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
