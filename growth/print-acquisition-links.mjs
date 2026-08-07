#!/usr/bin/env node
/** acquisition-links.yaml の URL を一覧出力 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const yamlPath = path.join(__dirname, 'acquisition-links.yaml');

const flattenLinks = (obj, prefix = '') => {
  const lines = [];
  if (obj && typeof obj === 'object') {
    if (typeof obj.url === 'string') {
      lines.push(`${prefix}: ${obj.url}`);
    }
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'url') continue;
      lines.push(...flattenLinks(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return lines;
};

const main = async () => {
  const raw = await readFile(yamlPath, 'utf8');
  console.log('# Jazzify acquisition links\n');
  const urlMatches = [...raw.matchAll(/url:\s*(https?:\/\/[^\s]+)/g)];
  for (const [, url] of urlMatches) {
    console.log(url.replace(/\{[^}]+\}/g, 'SLUG'));
  }
  console.log('\n# Placeholders: {post_slug} {episode_slug} {video_slug} {category} {position} {slug}');
};

main();
