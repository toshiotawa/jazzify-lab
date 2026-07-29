/**
 * 動画視聴課題ステージの言語別ソース解決。
 * 英語 URL が未登録・空白のみのときは日本語にフォールバックする。
 */

export interface VideoLessonStageLocaleSource {
  video_url: string;
  video_url_en?: string | null;
  duration_sec?: number | null;
  duration_en_sec?: number | null;
  thumbnail_url?: string | null;
  thumbnail_url_en?: string | null;
}

export interface ResolvedVideoLessonSource {
  url: string;
  durationSec: number | null;
  thumbnailUrl: string | null;
  locale: 'ja' | 'en';
}

const trimOrEmpty = (value: string | null | undefined): string =>
  typeof value === 'string' ? value.trim() : '';

export function resolveVideoLessonSource(
  stage: VideoLessonStageLocaleSource,
  isEnglish: boolean,
): ResolvedVideoLessonSource {
  const jaUrl = trimOrEmpty(stage.video_url);
  const enUrl = trimOrEmpty(stage.video_url_en);
  if (isEnglish && enUrl.length > 0) {
    return {
      url: enUrl,
      durationSec: typeof stage.duration_en_sec === 'number' && stage.duration_en_sec > 0
        ? stage.duration_en_sec
        : (typeof stage.duration_sec === 'number' && stage.duration_sec > 0 ? stage.duration_sec : null),
      thumbnailUrl: (() => {
        const enThumb = trimOrEmpty(stage.thumbnail_url_en);
        if (enThumb.length > 0) return enThumb;
        const jaThumb = trimOrEmpty(stage.thumbnail_url);
        return jaThumb.length > 0 ? jaThumb : null;
      })(),
      locale: 'en',
    };
  }
  return {
    url: jaUrl,
    durationSec: typeof stage.duration_sec === 'number' && stage.duration_sec > 0
      ? stage.duration_sec
      : null,
    thumbnailUrl: (() => {
      const jaThumb = trimOrEmpty(stage.thumbnail_url);
      return jaThumb.length > 0 ? jaThumb : null;
    })(),
    locale: 'ja',
  };
}
