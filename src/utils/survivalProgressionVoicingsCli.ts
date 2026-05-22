/**
 * CLI エントリ（esbuild bundle 用）。ゲームバンドルには含めない。
 */

import { readFileSync } from 'node:fs';

import {
  analyzeSurvivalChordProgression,
  buildSurvivalProgressionVoicingFormsMap,
  SURVIVAL_PROGRESSION_VOICING_MAP,
  survivalVoicingToNoteNames,
} from './survivalProgressionVoicings';
import {
  buildMergedKeyFifthsForChordsOnePerLineSections,
  parseChordsOnePerLineSections,
} from './survivalProgressionChordsOnePerLine';
import { buildProgressionChordDefinitions } from './survivalProgressionChords';
import {
  buildSurvivalProgressionMigrationSql,
  buildSurvivalProgressionMigrationSqlFromStageExports,
  type SurvivalSongsStageExportRow,
} from './survivalProgressionMigrationGenerator';
import { SURVIVAL_PROGRESSION_MIGRATION_INPUTS } from './survivalProgressionMigrationData';

const MIGRATION_HEADER =
  '-- Augment survival_stages.chord_progression with voicing_names + key_fifths.\n'
  + '-- 自動生成（scripts/survival-progression-voicings.mjs --gen-migration）。';

const M7_VOICING_FIX_HEADER =
  '-- Survival songs: m7 / m7(b5) voicing を 357R・7R35（9th なし）に修正し、m7(9) を分離。\n'
  + '-- 自動生成（scripts/survival-progression-voicings.mjs --gen-migration-all-songs）。\n';

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
  if (args[0] === '--gen-migration') {
    const sql = buildSurvivalProgressionMigrationSql(
      SURVIVAL_PROGRESSION_MIGRATION_INPUTS,
      MIGRATION_HEADER,
    );
    process.stdout.write(sql);
    return;
  }
  if (args[0] === '--gen-migration-all-songs') {
    const filePath = args[1]?.trim();
    if (!filePath) {
      process.stderr.write('Error: --gen-migration-all-songs には JSON ファイルパスが必要です。\n');
      process.exitCode = 1;
      return;
    }
    const raw = readFileSync(filePath, 'utf8');
    const rows = JSON.parse(raw) as SurvivalSongsStageExportRow[];
    const sql = buildSurvivalProgressionMigrationSqlFromStageExports(rows, M7_VOICING_FIX_HEADER);
    process.stdout.write(sql);
    return;
  }

  let input: string;
  let keyFifthsOverride: readonly number[] | null = null;
  let chordsTxtMeta: { readonly path: string; readonly sectionsCount: number } | null = null;

  if (args[0] === '--from-chords-txt') {
    const filePath = args[1]?.trim();
    if (!filePath) {
      process.stderr.write('Error: --from-chords-txt にはファイルパスが必要です。\n');
      process.exitCode = 1;
      return;
    }
    const content = readFileSync(filePath, 'utf8');
    const sections = parseChordsOnePerLineSections(content);
    const tokens = sections.flatMap(s => [...s.chordTokens]);
    input = tokens.join(' ');
    keyFifthsOverride = buildMergedKeyFifthsForChordsOnePerLineSections(sections);
    chordsTxtMeta = { path: filePath, sectionsCount: sections.length };
  } else {
    input = args.join(' ').trim();
  }

  if (!input) {
    process.stderr.write(
      'Usage: node scripts/survival-progression-voicings.mjs "Dm7(9) G7(9.13) CM7(9) CM7(9)"\n' +
        '       node scripts/survival-progression-voicings.mjs --from-chords-txt path/to/chords_one_per_line.txt\n' +
        '       node scripts/survival-progression-voicings.mjs --dump-map\n' +
        '       node scripts/survival-progression-voicings.mjs --dump-forms-map\n' +
        '       node scripts/survival-progression-voicings.mjs --gen-migration\n' +
        '       node scripts/survival-progression-voicings.mjs --gen-migration-all-songs path/to/export.json\n' +
        '  JSON に chordProgressionForDb（voicing_names / key_fifths 付き）を含めます。\n',
    );
    process.exitCode = 1;
    return;
  }
  const result = analyzeSurvivalChordProgression(input);

  const built = buildProgressionChordDefinitions(result.progression);
  if (keyFifthsOverride && keyFifthsOverride.length !== built.length) {
    process.stderr.write(
      `Error: key_fifths 件数 (${keyFifthsOverride.length}) がコード数 (${built.length}) と一致しません。\n`,
    );
    process.exitCode = 1;
    return;
  }
  const chordProgressionForDb = built.map((def, ix) => {
    const row: Record<string, unknown> = {
      name: result.progression[ix]?.name ?? def.displayName,
      voicing: [...(result.progression[ix]?.voicing ?? def.notes)],
    };
    const names = def.progressionStaffVoicingNames;
    if (names && names.length > 0) {
      row.voicing_names = [...names];
    }
    if (keyFifthsOverride) {
      row.key_fifths = keyFifthsOverride[ix];
    } else if (typeof def.progressionStaffKeyFifths === 'number') {
      row.key_fifths = def.progressionStaffKeyFifths;
    }
    return row;
  });

  const payload = {
    progression: result.progression,
    chordsTxt: chordsTxtMeta,
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
