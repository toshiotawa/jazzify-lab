import React, { useEffect, useRef, useState } from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { JAZZIFY_VIRAL_TWEET_URL } from '@/components/landing/landingLinks';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const TWITTER_WIDGETS_SCRIPT_URL = 'https://platform.twitter.com/widgets.js';

interface TwttrWidgets {
  load: () => void;
}

interface TwttrGlobal {
  widgets: TwttrWidgets;
}

const isTwttrGlobal = (value: unknown): value is TwttrGlobal => {
  if (typeof value !== 'object' || value === null || !('widgets' in value)) {
    return false;
  }

  const widgets = value.widgets;
  return (
    typeof widgets === 'object' &&
    widgets !== null &&
    'load' in widgets &&
    typeof widgets.load === 'function'
  );
};

const loadTwitterWidgets = (): void => {
  if (typeof window === 'undefined') return;

  const twttr = window.twttr;
  if (isTwttrGlobal(twttr)) {
    twttr.widgets.load();
  }
};

const ensureTwitterWidgetsScript = (): void => {
  const existingScript = document.querySelector(
    `script[src="${TWITTER_WIDGETS_SCRIPT_URL}"]`,
  );
  if (existingScript) {
    loadTwitterWidgets();
    return;
  }

  const script = document.createElement('script');
  script.src = TWITTER_WIDGETS_SCRIPT_URL;
  script.async = true;
  script.charset = 'utf-8';
  script.onload = loadTwitterWidgets;
  document.body.appendChild(script);
};

export const LpViralTweetEmbed: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const { translationText } = copy.modes.viralTweet;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadWidget, setShouldLoadWidget] = useState(false);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadWidget(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '200px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoadWidget) return;
    ensureTwitterWidgetsScript();
  }, [shouldLoadWidget]);

  return (
    <div ref={containerRef} className="lp-viral-tweet">
      <div className="lp-viral-tweet-embed">
        <blockquote className="twitter-tweet" data-dnt="true" data-theme="dark">
          <p lang="ja" dir="ltr">
            パリィだけで倒すジャズ学習ゲー、どうですか？
            <br />
            <br />
            敵がフレーズを弾いてくる
            <br />
            ↓
            <br />
            タイミングよく同じ音を弾く
            <br />
            ↓
            <br />
            パリィ成功
            <br />
            ↓
            <br />
            ジャズの敵を倒す
            <br />
            <br />
            という、だいぶ意味不明なゲームを作っています。
          </p>
          &mdash; 俺の6秒フレーズ@Jazzify (@jazz_ad_lib){' '}
          <a href={JAZZIFY_VIRAL_TWEET_URL}>July 3, 2026</a>
        </blockquote>
      </div>

      {translationText ? (
        <p className="lp-viral-tweet-translation-text">{translationText}</p>
      ) : null}
    </div>
  );
};

declare global {
  interface Window {
    twttr?: unknown;
  }
}
