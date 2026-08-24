/**
 * onnxruntime-web の WASM ランタイムを public/ort に配置する。
 * dist を丸ごとコピーすると 50MB 超（WebGPU/jsep 版含む）になるため、
 * ort.env.wasm.numThreads = 1 の wasm EP が実際に読み込むファイルのみを対象にする。
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'node_modules/onnxruntime-web/dist');
const destDir = join(root, 'public/ort');

if (!existsSync(srcDir)) {
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const file of REQUIRED_FILES) {
  const src = join(srcDir, file);
  if (!existsSync(src)) {
    throw new Error(`onnxruntime-web dist に ${file} がありません。バージョンを確認してください。`);
  }
  copyFileSync(src, join(destDir, file));
}
