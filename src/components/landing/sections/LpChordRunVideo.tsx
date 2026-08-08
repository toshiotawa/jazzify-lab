import React, { useState } from 'react';
import type { LandingChordRunVideoCopy } from '@/components/landing/landingCopy';
import {
  CHORD_RUN_VIDEO_ID,
  CHORD_RUN_VIDEO_START_SECONDS,
} from '@/components/landing/landingLinks';
import { trackEvent } from '@/utils/analytics/ga';

const THUMBNAIL_BASE = `https://i.ytimg.com/vi/${CHORD_RUN_VIDEO_ID}`;
const EMBED_URL =
  `https://www.youtube-nocookie.com/embed/${CHORD_RUN_VIDEO_ID}` +
  `?autoplay=1&start=${CHORD_RUN_VIDEO_START_SECONDS}&rel=0`;

interface LpChordRunVideoProps {
  copy: LandingChordRunVideoCopy;
}

/**
 * YouTube のプレイヤーは初期表示では読み込まず、サムネイルのみ表示する。
 * 再生ボタンが押されたときだけ iframe に差し替える（LPの初期ロードを重くしないため）。
 */
export const LpChordRunVideo: React.FC<LpChordRunVideoProps> = ({ copy }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState(`${THUMBNAIL_BASE}/maxresdefault.jpg`);

  const handlePlay = (): void => {
    setIsPlaying(true);
    trackEvent('lp_chord_run_video_play', { locale: 'ja' });
  };

  const handleThumbnailError = (): void => {
    setThumbnailSrc(`${THUMBNAIL_BASE}/hqdefault.jpg`);
  };

  return (
    <div className="lp-chord-run-video">
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
            src={EMBED_URL}
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
