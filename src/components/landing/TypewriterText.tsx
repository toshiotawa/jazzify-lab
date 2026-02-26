import React, { useEffect, useState } from 'react';
import { platform } from '@/platform/index';

interface Props {
  text: string;
  className?: string;
  speedMsPerChar?: number;
  delayMs?: number;
  dataAnimate?: string;
}

export const TypewriterText: React.FC<Props> = ({
  text,
  className = '',
  speedMsPerChar = 80,
  delayMs = 0,
  dataAnimate,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    const start = () => {
      let index = 0;
      intervalId = platform.setInterval(() => {
        if (cancelled) return;
        index += 1;
        setDisplayedText(text.slice(0, index));
        if (index >= text.length && intervalId) {
          platform.clearInterval(intervalId);
        }
      }, speedMsPerChar);
    };

    const startTimer = platform.setTimeout(start, delayMs);

    return () => {
      cancelled = true;
      if (startTimer) platform.clearTimeout(startTimer);
      if (intervalId) platform.clearInterval(intervalId);
    };
  }, [text, speedMsPerChar, delayMs]);

  return (
    <p className={className} data-animate={dataAnimate} aria-label={text}>
      <span>{displayedText}</span>
      <span className="type-caret" aria-hidden="true">|</span>
    </p>
  );
};
