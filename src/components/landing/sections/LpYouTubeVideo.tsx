import React, { useState } from 'react';
import type { LandingYouTubeVideoCopy } from '@/components/landing/landingCopy';
import { trackEvent } from '@/utils/analytics/ga';

interface LpYouTubeVideoProps {
  copy: LandingYouTubeVideoCopy;
  videoId: string;
  startSeconds?: number;
  gaEventName: string;
  className?: string;
}

/**
 * YouTube のプレイヤーは初期表示では読み込まず、サムネイルのみ表示する。
 * 再生ボタンが押されたときだけ iframe に差し替える（LPの初期ロードを重くしないため）。
 */
export const LpYouTubeVideo: React.FC<LpYouTubeVideoProps> = ({
  copy,
  videoId,
  startSeconds = 0,
  gaEventName,
  className = 'lp-youtube-video',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnailBase = `https://i.ytimg.com/vi/${videoId}`;
  const [thumbnailSrc, setThumbnailSrc] = useState(`${thumbnailBase}/maxresdefault.jpg`);
  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?autoplay=1&start=${startSeconds}&rel=0`;

  const handlePlay = (): void => {
    setIsPlaying(true);
    trackEvent(gaEventName, { locale: 'ja' });
  };

  const handleThumbnailError = (): void => {
    setThumbnailSrc(`${thumbnailBase}/hqdefault.jpg`);
  };

  return (
    <div className={className}>
      <h3 className="lp-subtitle text-xl text-center mb-2">{copy.heading}</h3>
      <p
        className="lp-card-body text-center mb-6"
        style={{ color: 'var(--lp-ink-muted)' }}
      >
        {copy.caption}
      </p>
      <div className="lp-shot lp-yt-frame">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={copy.iframeTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="lp-yt-facade"
            onClick={handlePlay}
            aria-label={copy.playLabel}
          >
            <img
              src={thumbnailSrc}
              alt={copy.thumbnailAlt}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              onError={handleThumbnailError}
            />
            <span className="lp-promo-play-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
