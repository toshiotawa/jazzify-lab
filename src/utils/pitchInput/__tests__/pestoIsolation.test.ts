import { readFileSync } from 'node:fs';
import { isPestoIsolatedPath } from '../pestoIsolation';

it.each(['/main/play', '/main/play/', '/main/play/ear-training', '/main/play/fantasy'])('isolates game route %s', (path) => {
  expect(isPestoIsolatedPath(path)).toBe(true);
});
it.each(['/', '/login', '/main', '/main/dashboard', '/main/lessons/abc', '/main/account', '/main/playback', '/embed/code-run', '/blog/abc'])('keeps page %s outside isolation', (path) => {
  expect(isPestoIsolatedPath(path)).toBe(false);
});
it('matches the deployed document paths and allows nested WASM workers', () => {
  const headers = readFileSync('netlify.toml', 'utf8');
  const isolatedDocuments = [...headers.matchAll(/for = "([^"]+)"\s+\[headers.values\]\s+Cross-Origin-Opener-Policy = "same-origin"\s+Cross-Origin-Embedder-Policy = "credentialless"/g)].map((match) => match[1]);
  expect(isolatedDocuments).toEqual(['/main/play', '/main/play/*']);
  for (const prefix of ['/assets/*', '/ort/*', '/js/audio/*']) {
    expect(headers.split(`for = "${prefix}"`)[1].split('[[headers]]')[0]).toContain('Cross-Origin-Embedder-Policy = "credentialless"');
  }
});
