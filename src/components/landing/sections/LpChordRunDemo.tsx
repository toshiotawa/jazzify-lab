import React, { useState } from 'react';
import type { LandingChordRunDemoCopy } from '@/components/landing/landingCopy';
import { LpAppStoreButton } from '@/components/landing/LpAppStoreButton';
import { trackEvent } from '@/utils/analytics/ga';

interface LpChordRunDemoProps {
  copy: LandingChordRunDemoCopy;
  /** codeRunDemoCatalog のデモ ID。日本語LPは demo_1、英語LPは demo_2 */
  demoId: string;
  /** GA / UTM の流入元ラベル */
  embedFrom: string;
  appStoreLabel: string;
  appStoreAriaLabel: string;
}

/**
 * コードランのデモを iframe で埋め込む。
 * 初期表示ではサムネイルのみを描画し、ボタンが押されたときだけ iframe を生成する
 * （LP のロード時に SPA をもう一つ起動させないため）。
 */
export const LpChordRunDemo: React.FC<LpChordRunDemoProps> = ({
  copy,
  demoId,
  embedFrom,
  appStoreLabel,
  appStoreAriaLabel,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStart = (): void => {
    setIsPlaying(true);
    trackEvent('lp_chord_run_demo_open', { demo_id: demoId, embed_from: embedFrom });
  };

  const embedUrl = `/embed/code-run?id=${demoId}&from=${embedFrom}&cta=signup`;

  return (
    <div className="lp-chord-run-demo">
      <h3 className="lp-subtitle text-xl text-center mb-2">{copy.heading}</h3>
      <p
        className="lp-card-body text-center mb-6"
        style={{ color: 'var(--lp-ink-muted)' }}
      >
        {copy.caption}
      </p>
      <div className="lp-shot lp-chord-run-demo__frame">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={copy.iframeTitle}
            allow="midi; autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="lp-yt-facade"
            onClick={handleStart}
            aria-label={copy.startLabel}
          >
            <img
              src="/newLP/chord-run.webp"
              alt={copy.thumbnailAlt}
              width={1280}
              height={952}
              loading="lazy"
              decoding="async"
            />
            <span className="lp-chord-run-demo__cta">
              <span className="lp-btn-gold px-8 py-4 text-base sm:text-lg shadow-2xl">
                {copy.startLabel}
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="lp-chord-run-demo__notes">
        <p className="lp-note" style={{ color: 'var(--lp-ink-muted)' }}>{copy.midiNote}</p>
        <p className="lp-note" style={{ color: 'var(--lp-ink-muted)' }}>{copy.iosNote}</p>
        <LpAppStoreButton label={appStoreLabel} ariaLabel={appStoreAriaLabel} size="sm" />
      </div>
    </div>
  );
};
