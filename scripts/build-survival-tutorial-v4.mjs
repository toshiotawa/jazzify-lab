#!/usr/bin/env node
/**
 * Survival Tutorial V4 manifest を MusicXML(+MIDI) から生成し stdout に出力する。
 *
 * Usage:
 *   node --experimental-strip-types ./scripts/build-survival-tutorial-v4.mjs [musicxml] [midi]
 *
 * 引数省略時は v4 サンプルフィクスチャを使う。
 * DOMParser は jsdom で polyfill する(アプリ/テストと同じパースコードを再利用)。
 *
 * demo ロール和音(MusicXML):
 * - staff 1|2 に低音から「前音タイ継続 + 新音 `<chord/>`」で段階的に増やす(段をまたいで可)。
 * - staff 3(ベース)は譜面に書いた MIDI をそのまま使う(コード名からは推測しない)。
 * - 各新音 onset に歌詞 Verse を付けると demo セリフと同期する。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { register } from 'node:module';
import { JSDOM } from 'jsdom';

register('./ts-extension-resolve-hook.mjs', import.meta.url);

const ROOT = resolve(import.meta.dirname, '..');
const V4_DIR = resolve(ROOT, 'src', 'components', 'survival', 'tutorial', 'v4');
const DEFAULT_XML = resolve(V4_DIR, '__fixtures__', 'sampleStageV4.musicxml');
const DEFAULT_CONFIG = 'SAMPLE_STAGE_V4_CONFIG';

const { window } = new JSDOM('');
globalThis.DOMParser = window.DOMParser;

const xmlPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_XML;
const midiPath = process.argv[3] ? resolve(process.cwd(), process.argv[3]) : null;

const musicXml = readFileSync(xmlPath, 'utf8');
const midi = midiPath ? new Uint8Array(readFileSync(midiPath)) : undefined;

const { buildSurvivalTutorialV4Manifest } = await import(
  resolve(V4_DIR, 'buildSurvivalTutorialV4Manifest.ts')
);
const configExportName = process.env.V4_CONFIG ?? DEFAULT_CONFIG;
const configModule = await import(
  configExportName === 'DEVELOPER_V4_ROLL_GRAND_STAFF_CONFIG'
    ? resolve(V4_DIR, 'sampleStageV4RollDeveloperConfig.ts')
    : resolve(V4_DIR, 'sampleStageV4Config.ts')
);
const config = configModule[configExportName];
if (!config) {
  throw new Error(`Unknown V4 config export: ${configExportName}`);
}

const manifest = buildSurvivalTutorialV4Manifest({
  musicXml,
  midi,
  config,
});

process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
