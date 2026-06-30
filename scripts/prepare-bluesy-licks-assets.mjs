#!/usr/bin/env node
/**
 * Bluesy Licks 資産を一括生成（MusicXML + MP3 normal/slow）。
 *
 * MusicXML を差し替えたあとは:
 *   node scripts/upload-bluesy-licks-r2.mjs
 *   node scripts/purge-bluesy-licks-cdn-cache.mjs
 * upload が cache-bust 用 SQL を自動生成するので、それを Supabase に適用する。
 *
 * Usage:
 *   node scripts/prepare-bluesy-licks-assets.mjs
 *   node scripts/prepare-bluesy-licks-assets.mjs --dry-run
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  COMBINED_MUSICXML,
  OUT_DIR,
  PHRASE_SPECS,
  phraseAssetBase,
} from './bluesy-licks-config.mjs';
import {
  buildPhraseMusicXml,
  writeMusicXml,
  countOneLoopAttackTargets,
} from './bluesy-licks-musicxml-utils.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const dryRun = process.argv.includes('--dry-run');

function runNode(script, scriptArgs) {
  if (dryRun) {
    console.log(`[dry-run] node ${script} ${scriptArgs.join(' ')}`);
    return;
  }
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...scriptArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function main() {
  if (!existsSync(COMBINED_MUSICXML)) {
    console.error(`Missing: ${COMBINED_MUSICXML}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('[dry-run] mkdir', OUT_DIR);
  } else {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  /** @type {Record<string, { targetCount: number; bodyMeasures: number }>} */
  const combatStats = {};

  for (const spec of PHRASE_SPECS) {
    const xmlName = `${phraseAssetBase(spec.phraseIndex, false)}_loop4_ci.musicxml`;
    const xmlPath = join(OUT_DIR, xmlName);

    if (dryRun) {
      console.log(`[dry-run] MusicXML phrase ${spec.phraseIndex} -> ${xmlPath}`);
    } else {
      const xml = buildPhraseMusicXml(COMBINED_MUSICXML, spec);
      const measureCount = (xml.match(/<measure number="/g) ?? []).length;
      const expectedMeasures = 1 + spec.bodyMeasures * 4;
      if (measureCount !== expectedMeasures) {
        throw new Error(
          `phrase ${spec.phraseIndex}: ${measureCount} measures != expected ${expectedMeasures}`,
        );
      }
      writeMusicXml(xmlPath, xml);
      const targetCount = countOneLoopAttackTargets(xml, spec.bodyMeasures);
      combatStats[String(spec.phraseIndex)] = {
        targetCount,
        bodyMeasures: spec.bodyMeasures,
      };
      console.log(`MusicXML ${xmlName} (${measureCount} bars, targets=${targetCount})`);
    }
  }

  if (!dryRun) {
    runNode('build-bluesy-licks-mp3.mjs', ['--all']);
    runNode('build-bluesy-licks-mp3.mjs', ['--all', '--slow']);
  } else {
    console.log('[dry-run] node build-bluesy-licks-mp3.mjs --all');
    console.log('[dry-run] node build-bluesy-licks-mp3.mjs --all --slow');
  }

  if (!dryRun) {
    writeFileSync(
      join(OUT_DIR, 'bluesy-licks-combat-stats.json'),
      `${JSON.stringify(combatStats, null, 2)}\n`,
      'utf8',
    );
  }

  console.log('\nDone prepare-bluesy-licks-assets');
}

main();
