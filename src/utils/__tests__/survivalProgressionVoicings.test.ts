import { describe, expect, it, vi } from 'vitest';

import {
  analyzeSurvivalChordProgression,
  buildSurvivalChordProgression,
  buildSurvivalProgressionVoicingFormsMap,
  SURVIVAL_PROGRESSION_VOICING_MAP,
  survivalVoicingToNoteNames,
} from '@/utils/survivalProgressionChords';
import { runSurvivalProgressionVoicingsCli } from '@/utils/survivalProgressionVoicingsCli';

describe('survivalProgressionVoicings', () => {
  it('例進行: フォームが A-B-A-B になり、4 コード生成される', () => {
    const input = 'Dm7(9) G7(9.13) CM7(9) CM7(9)';
    const r = analyzeSurvivalChordProgression(input);
    expect(r.entries.map(e => e.form)).toEqual(['A', 'B', 'A', 'B']);
    expect(r.entries.map(e => e.name)).toEqual(['Dm7(9)', 'G7(9.13)', 'CM7(9)', 'CM7(9)']);
    expect(r.progression.length).toBe(4);
    for (const e of r.entries) {
      expect(e.voicing.length).toBe(4);
    }
    const flat = buildSurvivalChordProgression(input);
    expect(flat).toEqual(r.progression);
  });

  it('EbM7(9) は C フォームを使う', () => {
    const r = analyzeSurvivalChordProgression('EbM7(9)');
    expect(r.entries[0]?.form).toBe('C');
    expect(r.entries[0]?.kind).toBe('M7_9');
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

  it('buildSurvivalProgressionVoicingFormsMap は種別×ルートごとに 1 行ずつ', () => {
    const rows = buildSurvivalProgressionVoicingFormsMap();
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
