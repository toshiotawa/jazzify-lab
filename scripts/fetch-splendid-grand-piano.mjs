#!/usr/bin/env node
/**
 * smplr の SplendidGrandPiano サンプルを public/ 配下へ self-host するための取得スクリプト。
 *
 * 外部 CDN (GitHub Pages) をランタイム依存にしないため、サンプルはリポジトリへ取り込んで
 * 自ドメインから配信する。
 *
 * Netlify はデプロイファイル名に `#` / `?` を許可しないため、ローカル保存時は `#` を `s`
 * に置換する (例: `MF C#1.m4a` → `MF Cs1.m4a`)。ランタイム側も同じ規則で URL を書き換える。
 *
 * 音源: AKAI が 2000 年代初頭にパブリックドメインとして公開した Steinway サンプル。
 * 帰属表示の義務はない。
 *
 * Usage: node ./scripts/fetch-splendid-grand-piano.mjs
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { LAYERS } from 'smplr';

const REMOTE_BASE = 'https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples';
const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'piano', 'splendid');
/** ブラウザ間で単一形式に揃えるため m4a (AAC) のみ取得する。ogg は Safari で再生できない。 */
const FORMAT = 'm4a';
const CONCURRENCY = 8;

const sampleNames = [...new Set(LAYERS.flatMap((layer) => layer.samples.map(([, name]) => name)))];

/** Netlify 向けに `#` を sharp の慣例 `s` へ置換したローカルファイル名。 */
const toLocalName = (name) => name.replace(/#/g, 's');

/** 上流 CDN 向け。smplr の loadAudioBuffer と同じエスケープ規則。 */
const toRemoteUrl = (name) =>
  `${REMOTE_BASE}/${name}.${FORMAT}`.replace(/#/g, '%23').replace(/ /g, '%20');

const alreadyDownloaded = async (filePath) => {
  try {
    const info = await stat(filePath);
    return info.size > 0;
  } catch {
    return false;
  }
};

const fetchOne = async (name) => {
  const filePath = path.join(OUT_DIR, `${toLocalName(name)}.${FORMAT}`);
  if (await alreadyDownloaded(filePath)) return 0;

  const response = await fetch(toRemoteUrl(name));
  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, bytes);
  return bytes.byteLength;
};

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true });

  let downloaded = 0;
  let totalBytes = 0;
  const queue = [...sampleNames];

  const worker = async () => {
    for (let name = queue.pop(); name !== undefined; name = queue.pop()) {
      const bytes = await fetchOne(name);
      if (bytes > 0) {
        downloaded += 1;
        totalBytes += bytes;
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  process.stdout.write(
    `SplendidGrandPiano: ${sampleNames.length} samples ready ` +
      `(${downloaded} newly downloaded, ${(totalBytes / 1024 / 1024).toFixed(1)} MB)\n`
  );
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
