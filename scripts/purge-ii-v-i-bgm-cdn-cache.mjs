/**
 * jazzify-cdn 上の II-V-I BGM（120 URL）を Cloudflare キャッシュからパージする。
 *
 * 必要な環境変数（いずれかの名前をサポート）:
 *   CLOUDFLARE_ZONE_ID または CF_ZONE_ID
 *   CLOUDFLARE_API_TOKEN または CF_API_TOKEN（権限: Zone → Cache Purge）
 *
 * Usage:
 *   CF_ZONE_ID=... CF_API_TOKEN=... node scripts/purge-ii-v-i-bgm-cdn-cache.mjs
 *   node scripts/purge-ii-v-i-bgm-cdn-cache.mjs --dry-run
 */
const PUBLIC_BASE =
  process.env.II_V_I_CDN_BASE || 'https://jazzify-cdn.com/fantasy-bgm';

const KEYS = [
  'c',
  'f',
  'bb',
  'eb',
  'ab',
  'db',
  'gb',
  'b',
  'e',
  'a',
  'd',
  'g',
];
const RANGES = [
  '1-5',
  '6-10',
  '11-15',
  '16-20',
  '21-25',
  '26-30',
  '31-35',
  '36-40',
  '41-45',
  '46-50',
];

const dryRun = process.argv.includes('--dry-run');

function collectUrls() {
  const urls = [];
  for (const range of RANGES) {
    for (const slug of KEYS) {
      urls.push(`${PUBLIC_BASE}/ii-v-i-${range}-${slug}.mp3`);
    }
  }
  return urls;
}

async function main() {
  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID ||
    process.env.CF_ZONE_ID ||
    '';
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    '';

  const urls = collectUrls();
  if (dryRun) {
    console.log(`[dry-run] ${urls.length} URLs (例: ${urls[0]})`);
    return;
  }

  if (!zoneId || !token) {
    console.error(
      'CF_ZONE_ID / CLOUDFLARE_ZONE_ID と CF_API_TOKEN / CLOUDFLARE_API_TOKEN を設定してください。',
    );
    process.exit(1);
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: urls }),
    },
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    console.error('パージ失敗:', res.status, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`OK: ${urls.length} ファイルの CDN キャッシュをパージしました。`);
}

await main();
