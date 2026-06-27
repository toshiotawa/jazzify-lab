#!/usr/bin/env node
/**
 * MQ Block2 用 sozai を public/sozai/new から public/sozai へ配置し、CI / 無音 MP3 を生成する。
 *
 * Usage:
 *   node scripts/prepare-mq-b2-assets.mjs
 *   node scripts/prepare-mq-b2-assets.mjs --dry-run
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseMqB2SurvivalTutorialXml } from './parse-mq-b2-survival-tutorial-xml.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const NEW_DIR = join(ROOT, 'public', 'sozai', 'new');
const SOZAI = join(ROOT, 'public', 'sozai');
const dryRun = process.argv.includes('--dry-run');

/** @type {readonly { src: string; dest: string }[]} */
const COPIES = [
  { src: 'ドミファ.mp3', dest: 'mq-b2-domifa.mp3' },
  { src: 'ドミファ.musicxml', dest: 'mq-b2-domifa.musicxml' },
  { src: 'ソシド.mp3', dest: 'mq-b2-soshido.mp3' },
  { src: 'ソシド.musicxml', dest: 'mq-b2-soshido.musicxml' },
  { src: 'モチーフ.mp3', dest: 'mq-b2-motif.mp3' },
  { src: 'モチーフ.musicxml', dest: 'mq-b2-motif.musicxml' },
  {
    src: 'C Blues backing 12bars 100BPM カウントインなし.mp3',
    dest: 'mq-b2-c-blues-12bars-100bpm.mp3',
  },
];

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
  for (const { src, dest } of COPIES) {
    const from = join(NEW_DIR, src);
    const to = join(SOZAI, dest);
    if (!existsSync(from)) {
      console.error(`Missing source: ${from}`);
      process.exit(1);
    }
    if (dryRun) {
      console.log(`[dry-run] copy ${from} -> ${to}`);
    } else {
      copyFileSync(from, to);
      console.log(`copy ${dest}`);
    }
  }

  for (const base of ['mq-b2-domifa', 'mq-b2-soshido']) {
    runNode('build-mq-b2-count-in-mp3.mjs', [
      '--input', join(SOZAI, `${base}.mp3`),
      '--output', join(SOZAI, `${base}_count-in.mp3`),
      '--bpm', '120',
      ...(dryRun ? ['--dry-run'] : []),
    ]);
  }

  const survivalParsed = parseMqB2SurvivalTutorialXml();
  runNode('build-mq-b2-silent-mp3.mjs', [
    '--output', join(SOZAI, 'mq-b2-motif-demo-silent.mp3'),
    '--duration', String(Math.ceil(survivalParsed.demoDurationSec)),
    ...(dryRun ? ['--dry-run'] : []),
  ]);
  runNode('build-mq-b2-silent-mp3.mjs', [
    '--output', join(SOZAI, 'mq-b2-motif-playalong-silent.mp3'),
    '--duration', String(Math.ceil(survivalParsed.playalongDurationSec)),
    ...(dryRun ? ['--dry-run'] : []),
  ]);

  console.log('\nDone prepare-mq-b2-assets');
}

main();
