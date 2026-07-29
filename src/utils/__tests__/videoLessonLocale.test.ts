import { resolveVideoLessonSource } from '@/utils/videoLessonLocale';

describe('resolveVideoLessonSource', () => {
  const stage = {
    video_url: 'https://cdn.example/ja.mp4',
    video_url_en: 'https://cdn.example/en.mp4',
    duration_sec: 120,
    duration_en_sec: 110,
    thumbnail_url: 'https://cdn.example/ja.jpg',
    thumbnail_url_en: 'https://cdn.example/en.jpg',
  };

  it('英語 UI では en URL を使う', () => {
    const resolved = resolveVideoLessonSource(stage, true);
    expect(resolved.url).toBe('https://cdn.example/en.mp4');
    expect(resolved.locale).toBe('en');
    expect(resolved.durationSec).toBe(110);
    expect(resolved.thumbnailUrl).toBe('https://cdn.example/en.jpg');
  });

  it('日本語 UI では ja URL を使う', () => {
    const resolved = resolveVideoLessonSource(stage, false);
    expect(resolved.url).toBe('https://cdn.example/ja.mp4');
    expect(resolved.locale).toBe('ja');
  });

  it('en 未登録なら ja にフォールバック', () => {
    const resolved = resolveVideoLessonSource({
      video_url: 'https://cdn.example/ja.mp4',
      video_url_en: null,
    }, true);
    expect(resolved.url).toBe('https://cdn.example/ja.mp4');
    expect(resolved.locale).toBe('ja');
  });

  it('en が空白のみなら ja にフォールバック', () => {
    const resolved = resolveVideoLessonSource({
      video_url: 'https://cdn.example/ja.mp4',
      video_url_en: '   ',
    }, true);
    expect(resolved.url).toBe('https://cdn.example/ja.mp4');
    expect(resolved.locale).toBe('ja');
  });
});
