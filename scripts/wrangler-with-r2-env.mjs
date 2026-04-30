/**
 * `.env.r2` または `env.r2` の `CF_ACCOUNT_ID` を `CLOUDFLARE_ACCOUNT_ID` に写してから wrangler を起動する。
 * `wrangler r2 object put` などで毎回 export しなくてよい。
 *
 * Usage（プロジェクトルート）:
 *   npm run wrangler:r2 -- r2 object put jazzify-assets/fantasy-bgm/foo.mp3 -f ./foo.mp3 --content-type audio/mpeg
 *
 * 前提: 対話環境では `npx wrangler login`。非対話（CI 等）では `.env.r2` の `CLOUDFLARE_API_TOKEN`。Node 18+。
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2AccountIdFrom, r2S3CredentialsFrom, wranglerSpawnEnv } from './r2-env-helpers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const envR2 = loadEnvR2Map(ROOT);
const env = wranglerSpawnEnv(envR2);

const args = process.argv.slice(2);
const wranglerCli = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const opts = { cwd: ROOT, env, stdio: /** @type {const} */ ('inherit'), shell: false };

let r;
if (existsSync(wranglerCli)) {
  r = spawnSync(process.execPath, [wranglerCli, ...args], opts);
} else {
  const useShell = process.platform === 'win32';
  r = spawnSync('npx', ['wrangler', ...args], { ...opts, shell: useShell });
  if (r.error && useShell === false) {
    r = spawnSync('npx', ['wrangler', ...args], { ...opts, shell: true });
  }
}

if (r.error) {
  process.stderr.write(`${r.error.message}\n`);
  process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
