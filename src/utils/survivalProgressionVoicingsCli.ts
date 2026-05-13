/**
 * CLI エントリ（esbuild bundle 用）。ゲームバンドルには含めない。
 */

import {
  analyzeSurvivalChordProgression,
  buildSurvivalProgressionVoicingFormsMap,
  SURVIVAL_PROGRESSION_VOICING_MAP,
  survivalVoicingToNoteNames,
} from './survivalProgressionVoicings';
import { buildProgressionChordDefinitions } from './survivalProgressionChords';

export const runSurvivalProgressionVoicingsCli = (argv: readonly string[]): void => {
  const args = argv.filter(a => a !== '--');
  if (args[0] === '--dump-map') {
    process.stdout.write(`${JSON.stringify(SURVIVAL_PROGRESSION_VOICING_MAP, null, 2)}\n`);
    return;
  }
  if (args[0] === '--dump-forms-map') {
    const rows = buildSurvivalProgressionVoicingFormsMap().map(r => ({
      root: r.root,
      kind: r.kind,
      A: [...r.A],
      B: [...r.B],
      ...(r.C ? { C: [...r.C] } : {}),
    }));
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return;
  }
  const input = args.join(' ').trim();
  if (!input) {
    process.stderr.write(
      'Usage: node scripts/survival-progression-voicings.mjs "Dm7(9) G7(9.13) CM7(9) CM7(9)"\n' +
        '       node scripts/survival-progression-voicings.mjs --dump-map\n' +
        '       node scripts/survival-progression-voicings.mjs --dump-forms-map\n' +
        '  JSON に chordProgressionForDb（voicing_names / key_fifths 付き）を含めます。\n',
    );
    process.exitCode = 1;
    return;
  }
  const result = analyzeSurvivalChordProgression(input);

  const built = buildProgressionChordDefinitions(result.progression);
  const chordProgressionForDb = built.map((def, ix) => {
    const row: Record<string, unknown> = {
      name: result.progression[ix]?.name ?? def.displayName,
      voicing: [...(result.progression[ix]?.voicing ?? def.notes)],
    };
    const names = def.progressionStaffVoicingNames;
    if (names && names.length > 0) {
      row.voicing_names = [...names];
    }
    if (typeof def.progressionStaffKeyFifths === 'number') {
      row.key_fifths = def.progressionStaffKeyFifths;
    }
    return row;
  });

  const payload = {
    progression: result.progression,
    chordProgressionForDb,
    detail: result.entries.map(e => ({
      name: e.name,
      kind: e.kind,
      root: e.root,
      form: e.form,
      voicing: [...e.voicing],
      noteNames: survivalVoicingToNoteNames(e.voicing),
      warnings: [...e.warnings],
    })),
    warnings: [...result.warnings],
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};
