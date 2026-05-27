import { describe, expect, it } from 'vitest';

import { buildProgressionChordDefinition } from '@/utils/survivalProgressionChords';
import {
  analyzeSurvivalChordProgression,
  SURVIVAL_PROGRESSION_VOICING_MAP,
} from '@/utils/survivalProgressionVoicings';

const HINT_LOWEST_MIDI_MIN = 48;
const HINT_LOWEST_MIDI_MAX = 59;

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

  it('progressionStaffVoicingNames は voicing 直値のオクターブを維持する（FM7(9)）', () => {
    const def = buildProgressionChordDefinition(
      {
        name: 'FM7(9)',
        voicing: [64, 67, 69, 72],
        voicingNames: ['E4', 'G4', 'A4', 'C5'],
        keyFifths: -1,
      },
      0,
      -1,
    );
    expect(def.progressionStaffVoicingNames).toEqual(['E4', 'G4', 'A4', 'C5']);
    expect(def.progressionStaffKeyFifths).toBe(-1);
  });

  it('BbM7(9) も voicing_names のオクターブをそのまま使う', () => {
    const def = buildProgressionChordDefinition(
      {
        name: 'BbM7(9)',
        voicing: [62, 65, 69, 72],
        voicingNames: ['D4', 'F4', 'A4', 'C5'],
        keyFifths: -2,
      },
      0,
      -2,
    );
    expect(def.progressionStaffVoicingNames).toEqual(['D4', 'F4', 'A4', 'C5']);
  });

  it('鍵盤 HINT 再構築結果が DB 通りのコード（Cm7(9) など）は綴りも変わらない', () => {
    const def = buildProgressionChordDefinition(
      {
        name: 'Cm7(9)',
        voicing: [51, 55, 58, 62],
        voicingNames: ['Eb3', 'G3', 'Bb3', 'D4'],
        keyFifths: -3,
      },
      0,
      -3,
    );
    expect(def.progressionStaffVoicingNames).toEqual(['Eb3', 'G3', 'Bb3', 'D4']);
  });

  it('SURVIVAL_PROGRESSION_VOICING_MAP: 旧フォールバックで高かったコードの最低音が HINT 基準 C3..B3 内（※m7 のマップキーは m7(9) 表記ではなく m7 接尾辞）', () => {
    const mapChecks: { readonly mapKey: string; readonly expectedMin: number }[] = [
      { mapKey: 'FM7(9)', expectedMin: 52 },
      { mapKey: 'EM7(9)', expectedMin: 51 },
      { mapKey: 'BbM7(9)', expectedMin: 50 },
      { mapKey: 'Bb7(9.13)', expectedMin: 50 },
      { mapKey: 'Fm7', expectedMin: 51 },
      { mapKey: 'Fm6(9)', expectedMin: 50 },
    ];
    for (const { mapKey, expectedMin } of mapChecks) {
      const entry = SURVIVAL_PROGRESSION_VOICING_MAP[mapKey];
      expect(entry).toBeDefined();
      const min = Math.min(...entry.voicing);
      expect(min).toBeGreaterThanOrEqual(HINT_LOWEST_MIDI_MIN);
      expect(min).toBeLessThanOrEqual(HINT_LOWEST_MIDI_MAX);
      expect(min).toBe(expectedMin);
    }
  });

  it('analyzeSurvivalChordProgression の FM7(9) / EM7(9) / Fm7(9) が鍵盤 HINT と同じ register の MIDI', () => {
    const fm = analyzeSurvivalChordProgression('FM7(9)');
    expect(fm.progression[0]?.voicing).toEqual([52, 55, 57, 60]);
    const em = analyzeSurvivalChordProgression('EM7(9)');
    expect(em.progression[0]?.voicing).toEqual([51, 54, 56, 59]);
    const fmi = analyzeSurvivalChordProgression('Fm7(9)');
    expect(fmi.progression[0]?.voicing).toEqual([51, 55, 56, 60]);
  });

  it('lesson stage 2 旧データ相当: 素の G7/CM7 は譜面綴りが生成されない', () => {
    const dm7 = buildProgressionChordDefinition({ name: 'Dm7', voicing: [50, 53, 57, 60] }, 0, 0);
    expect(dm7.progressionStaffVoicingNames?.length).toBe(4);
    const g7 = buildProgressionChordDefinition({ name: 'G7', voicing: [55, 59, 62, 65] }, 1, 0);
    expect(g7.progressionStaffVoicingNames).toBeUndefined();
    const cm7 = buildProgressionChordDefinition({ name: 'CM7', voicing: [48, 52, 55, 59] }, 2, 0);
    expect(cm7.progressionStaffVoicingNames).toBeUndefined();
  });

  it('balloon-rush-prog-iivi-01 旧6音: ピッチクラス重複で譜面綴りなし', () => {
    const dm7 = buildProgressionChordDefinition(
      {
        name: 'Dm7',
        voicing: [50, 53, 57, 60, 64, 69],
        voicingNames: ['D3', 'F3', 'A3', 'C4', 'E4', 'A4'],
        keyFifths: 0,
      },
      0,
      0,
    );
    expect(dm7.progressionStaffVoicingNames).toBeUndefined();
  });

  it('balloon-rush-prog-iivi-01 修正後: 4声 II-V-I は譜面綴りが揃う', () => {
    const entries = [
      {
        name: 'Dm7(9)',
        voicing: [53, 57, 60, 64],
        voicingNames: ['F3', 'A3', 'C4', 'E4'],
        keyFifths: 0,
      },
      {
        name: 'G7(9.13)',
        voicing: [53, 57, 59, 64],
        voicingNames: ['F3', 'A3', 'B3', 'E4'],
        keyFifths: 0,
      },
      {
        name: 'CM7(9)',
        voicing: [52, 55, 59, 62],
        voicingNames: ['E3', 'G3', 'B3', 'D4'],
        keyFifths: 0,
      },
    ] as const;
    for (const [i, entry] of entries.entries()) {
      const def = buildProgressionChordDefinition(entry, i, 0);
      expect(def.progressionStaffVoicingNames?.length).toBe(4);
    }
  });

  it('lesson stage 2 修正後: Dm7(9)/G7(9.13)/CM7(9) は譜面綴りが揃う', () => {
    const entries = [
      {
        name: 'Dm7(9)',
        voicing: [53, 57, 60, 64],
        voicingNames: ['F3', 'A3', 'C4', 'E4'],
        keyFifths: 0,
      },
      {
        name: 'G7(9.13)',
        voicing: [53, 57, 59, 64],
        voicingNames: ['F3', 'A3', 'B3', 'E4'],
        keyFifths: 0,
      },
      {
        name: 'CM7(9)',
        voicing: [52, 55, 59, 62],
        voicingNames: ['E3', 'G3', 'B3', 'D4'],
        keyFifths: 0,
      },
    ] as const;
    for (const [i, entry] of entries.entries()) {
      const def = buildProgressionChordDefinition(entry, i, 0);
      expect(def.progressionStaffVoicingNames?.length).toBe(4);
      expect(def.progressionStaffKeyFifths).toBe(0);
    }
  });

  it('Gb スペル（GbM7(9)）の異名同音表記を維持したまま voicing 直値を使う', () => {
    const def = buildProgressionChordDefinition(
      {
        name: 'GbM7(9)',
        voicing: [53, 56, 58, 61],
        voicingNames: ['F3', 'Ab3', 'Bb3', 'Db4'],
        keyFifths: -6,
      },
      0,
      -6,
    );
    expect(def.progressionStaffVoicingNames).toEqual(['F3', 'Ab3', 'Bb3', 'Db4']);
    expect(def.progressionStaffKeyFifths).toBe(-6);
  });
});
