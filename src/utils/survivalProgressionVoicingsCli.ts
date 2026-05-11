/**
 * CLI エントリ（esbuild bundle 用）。ゲームバンドルには含めない。
 */

import {
  analyzeSurvivalChordProgression,
  SURVIVAL_PROGRESSION_VOICING_MAP,
  survivalVoicingToNoteNames,
} from './survivalProgressionVoicings';

export const runSurvivalProgressionVoicingsCli = (argv: readonly string[]): void => {
  const args = argv.filter(a => a !== '--');
  if (args[0] === '--dump-map') {
    process.stdout.write(`${JSON.stringify(SURVIVAL_PROGRESSION_VOICING_MAP, null, 2)}\n`);
    return;
  }
  const input = args.join(' ').trim();
  if (!input) {
    process.stderr.write(
      'Usage: node scripts/survival-progression-voicings.mjs "Dm7(9) G7(9.13) CM7(9) CM7(9)"\n' +
        '       node scripts/survival-progression-voicings.mjs --dump-map\n',
    );
    process.exitCode = 1;
    return;
  }
  const result = analyzeSurvivalChordProgression(input);
  const payload = {
    progression: result.progression,
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
