import { describe, expect, it } from 'vitest';
import {
  DESCENT_MAP_PRELOAD_IMAGES,
  DESCENT_MAP_TEXTURE_URLS,
  descentMapAssetUrl,
} from './descentMapAssets';

describe('descentMapAssets', () => {
  it('テクスチャ URL にバージョンクエリを付与する', () => {
    expect(DESCENT_MAP_TEXTURE_URLS.background).toMatch(/^\/background\.webp\?v=/);
    expect(DESCENT_MAP_TEXTURE_URLS.door).toMatch(/^\/door\.webp\?v=/);
  });

  it('プリロード一覧に環境・キャラ・ボス WebP を含む', () => {
    expect(DESCENT_MAP_PRELOAD_IMAGES.length).toBeGreaterThanOrEqual(9);
    DESCENT_MAP_PRELOAD_IMAGES.forEach((url) => {
      expect(url).toMatch(/\.webp\?v=/);
    });
    expect(DESCENT_MAP_PRELOAD_IMAGES.some((url) => url.includes('migi.webp'))).toBe(true);
    expect(DESCENT_MAP_PRELOAD_IMAGES.some((url) => url.includes('monster_45.webp'))).toBe(true);
  });

  it('descentMapAssetUrl は既存クエリを除去してバージョンを付け直す', () => {
    expect(descentMapAssetUrl('/foo.webp?old=1')).toBe('/foo.webp?v=20260707a');
  });
});
