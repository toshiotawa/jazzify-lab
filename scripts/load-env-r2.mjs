/**
 * R2 用ローカル env。`.env.r2` を優先し、無ければルートの `env.r2` を読む。
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} root プロジェクトルート
 * @returns {Record<string, string>}
 */
export function loadEnvR2Map(root) {
  for (const name of /** @type {const} */ (['.env.r2', 'env.r2'])) {
    const p = join(root, name);
    if (existsSync(p)) {
      return loadEnvFile(p);
    }
  }
  return {};
}

/**
 * 表示・ログ用。存在するファイルパス、無ければ推奨パス（`.env.r2`）。
 * @param {string} root
 * @returns {{ path: string; exists: boolean }}
 */
export function resolveEnvR2Meta(root) {
  const dot = join(root, '.env.r2');
  const plain = join(root, 'env.r2');
  if (existsSync(dot)) {
    return { path: dot, exists: true };
  }
  if (existsSync(plain)) {
    return { path: plain, exists: true };
  }
  return { path: dot, exists: false };
}

function loadEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[k] = v;
  }
  return map;
}
