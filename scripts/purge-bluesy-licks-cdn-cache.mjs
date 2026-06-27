/**
 * Bluesy Licks 資産（`sozai/bluesy-licks/`）の CDN キャッシュをパージする。
 *
 * 必要（いずれかの名前、`env.r2` / `.env.r2` でも可）:
 *   CF_ZONE_ID または CLOUDFLARE_ZONE_ID
 *   CF_API_TOKEN または CLOUDFLARE_API_TOKEN（Zone → Cache Purge）
 *
 * Usage:
 *   node scripts/purge-bluesy-licks-cdn-cache.mjs
 *   node scripts/purge-bluesy-licks-cdn-cache.mjs --dry-run
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { CDN_BASE, OUT_DIR } from './bluesy-licks-config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const envR2 = loadEnvR2Map(ROOT);
const dryRun = process.argv.includes('--dry-run');

const PURGE_BATCH_SIZE = 30;

function collectCdnUrls() {
  if (!existsSync(OUT_DIR)) {
    return [];
  }
  return readdirSync(OUT_DIR)
    .filter((name) => name.startsWith('bluesy-licks-') && (name.endsWith('.mp3') || name.endsWith('.musicxml')))
    .sort()
    .map((name) => `${CDN_BASE}/${name}`);
}

function zoneCredentials() {
  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID ||
    process.env.CF_ZONE_ID ||
    envR2.CF_ZONE_ID ||
    envR2.CLOUDFLARE_ZONE_ID ||
    '';
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    envR2.CF_API_TOKEN ||
    envR2.CLOUDFLARE_API_TOKEN ||
    '';
  return { zoneId, token };
}

async function purgeBatch(zoneId, token, files) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(`purge failed ${res.status}: ${JSON.stringify(body)}`);
  }
}

async function main() {
  const urls = collectCdnUrls();
  if (urls.length === 0) {
    console.error(`No bluesy-licks assets in ${OUT_DIR}. Run prepare-bluesy-licks-assets.mjs first.`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`[dry-run] purge ${urls.length} URLs (例: ${urls[0]})`);
    return;
  }

  const { zoneId, token } = zoneCredentials();
  if (!zoneId || !token) {
    console.error(
      'CF_ZONE_ID（または CLOUDFLARE_ZONE_ID）と CF_API_TOKEN（または CLOUDFLARE_API_TOKEN）が必要です。env.r2.example を参照してください。',
    );
    process.exit(1);
  }

  for (let i = 0; i < urls.length; i += PURGE_BATCH_SIZE) {
    const batch = urls.slice(i, i + PURGE_BATCH_SIZE);
    await purgeBatch(zoneId, token, batch);
    console.log(`purged batch ${Math.floor(i / PURGE_BATCH_SIZE) + 1}: ${batch.length} URLs`);
  }

  console.log(`OK: CDN キャッシュをパージしました（合計 ${urls.length} ファイル）。`);
}

await main();
