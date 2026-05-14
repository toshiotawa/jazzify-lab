/**
 * `fantasy-bgm/ear-training-self-paced-drum-loop.mp3` の CDN キャッシュをパージする。
 *
 * 必要（いずれかの名前、`env.r2` / `.env.r2` でも可・upload-dev-chord-voicing と同様）:
 *   CF_ZONE_ID または CLOUDFLARE_ZONE_ID
 *   CF_API_TOKEN または CLOUDFLARE_API_TOKEN（Zone → Cache Purge）
 *
 * Usage:
 *   node scripts/purge-ear-training-drum-loop-cdn.mjs
 *   node scripts/purge-ear-training-drum-loop-cdn.mjs --dry-run
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvR2Map } from './load-env-r2.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const envR2 = loadEnvR2Map(ROOT);
const dryRun = process.argv.includes('--dry-run');

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

const base = (
  process.env.VITE_R2_PUBLIC_URL ||
  envR2.VITE_R2_PUBLIC_URL ||
  process.env.R2_PUBLIC_URL ||
  envR2.R2_PUBLIC_URL ||
  'https://jazzify-cdn.com'
).replace(/\/$/, '');
const files = [`${base}/fantasy-bgm/ear-training-self-paced-drum-loop.mp3`];

async function main() {
  if (dryRun) {
    console.log(`[dry-run] purge files: ${files.join(', ')}`);
    return;
  }
  if (!zoneId || !token) {
    console.error(
      'CF_ZONE_ID（または CLOUDFLARE_ZONE_ID）と CF_API_TOKEN（または CLOUDFLARE_API_TOKEN）が必要です。env.r2.example を参照してください。',
    );
    process.exit(1);
  }
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
    console.error('パージ失敗:', res.status, JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log(`OK: CDN キャッシュをパージしました。\n${files.join('\n')}`);
}

await main();
